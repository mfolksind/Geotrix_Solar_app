import { OrderRepository } from '../../modules/orders/repositories/order.repository';
import OrderModel from '../../modules/orders/models/order.model';
import OrderItemModel from '../../modules/orders/models/orderItem.model';
import UserModel from '../../modules/users/user.model';
import { OrderService } from '../../modules/orders/services/order.service';
import { OrderItemRepository } from '../../modules/orders/repositories/orderItem.repository';
import { CartRepository } from '../../modules/carts/repositories/cart.repository';
import { CartItemRepository } from '../../modules/carts/repositories/cartItem.repository';
import { IOrderBillingBreakup } from '../../modules/orders/interfaces/order.interface';

export interface AdminOrderQueryParams {
  search?: string;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  sort?: string;
  page?: number | string;
  limit?: number | string;
}

export class AdminOrderService {
  private orderRepo = new OrderRepository();
  private orderItemRepo = new OrderItemRepository();
  private cartRepo = new CartRepository();
  private cartItemRepo = new CartItemRepository();
  private service = new OrderService(this.orderRepo, this.orderItemRepo, this.cartRepo, this.cartItemRepo);

  public async getStats() {
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      deliveredOrders,
      cancelledOrders,
      paidOrders,
      revenueResult
    ] = await Promise.all([
      OrderModel.countDocuments({}),
      OrderModel.countDocuments({ status: 'PENDING' }),
      OrderModel.countDocuments({ status: { $in: ['CONFIRMED', 'PROCESSING', 'SHIPPED'] } }),
      OrderModel.countDocuments({ status: { $in: ['DELIVERED', 'COMPLETED'] } }),
      OrderModel.countDocuments({ status: 'CANCELLED' }),
      OrderModel.countDocuments({ paymentStatus: 'PAID' }),
      OrderModel.aggregate([
        { $match: { paymentStatus: 'PAID' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    const totalRevenue = revenueResult?.[0]?.total || 0;

    return {
      totalOrders,
      pendingOrders,
      processingOrders,
      deliveredOrders,
      cancelledOrders,
      paidOrders,
      totalRevenue,
    };
  }

  public async list(query: AdminOrderQueryParams = {}) {
    const filter: Record<string, any> = {};

    if (query.status && query.status !== 'ALL') {
      filter.status = query.status.toUpperCase();
    }

    if (query.paymentStatus && query.paymentStatus !== 'ALL') {
      filter.paymentStatus = query.paymentStatus.toUpperCase();
    }

    if (query.paymentMethod && query.paymentMethod !== 'ALL') {
      filter.paymentMethod = query.paymentMethod.toUpperCase();
    }

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      
      const matchingUsers = await UserModel.find({
        $or: [
          { name: { $regex: searchRegex } },
          { firstName: { $regex: searchRegex } },
          { lastName: { $regex: searchRegex } },
          { email: { $regex: searchRegex } },
          { phone: { $regex: searchRegex } },
        ]
      }).select('_id').lean();

      const userIds = matchingUsers.map(u => u._id);

      filter.$or = [
        { orderNumber: { $regex: searchRegex } },
        { notes: { $regex: searchRegex } },
        { user: { $in: userIds } },
      ];
    }

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (query.sort) {
      switch (query.sort) {
        case 'oldest':
        case 'createdAt:asc':
          sortOption = { createdAt: 1 };
          break;
        case 'amount_desc':
        case 'totalAmount:desc':
          sortOption = { totalAmount: -1 };
          break;
        case 'amount_asc':
        case 'totalAmount:asc':
          sortOption = { totalAmount: 1 };
          break;
        case 'newest':
        case 'createdAt:desc':
        default:
          sortOption = { createdAt: -1 };
          break;
      }
    }

    const page = Math.max(1, parseInt(String(query.page || 1), 10) || 1);
    const hasLimit = query.limit !== undefined && query.limit !== '0' && query.limit !== 0;
    const limit = hasLimit ? Math.max(1, parseInt(String(query.limit), 10) || 20) : 0;

    let findQuery = OrderModel.find(filter)
      .populate('user', 'name firstName lastName email phone role')
      .populate('address')
      .sort(sortOption);

    if (limit > 0) {
      findQuery = findQuery.skip((page - 1) * limit).limit(limit);
    }

    const [rawOrders, total] = await Promise.all([
      findQuery.lean(),
      OrderModel.countDocuments(filter),
    ]);

    const orderIds = rawOrders.map(o => o._id);
    const orderItems = await OrderItemModel.find({ order: { $in: orderIds } })
      .populate({
        path: 'variant',
        select: 'variantName slug thumbnail images price sku discountPrice'
      })
      .populate({
        path: 'product',
        select: 'name images'
      })
      .lean();

    const itemsMap = new Map<string, any[]>();
    orderItems.forEach(item => {
      const orderIdStr = item.order.toString();
      if (!itemsMap.has(orderIdStr)) itemsMap.set(orderIdStr, []);
      itemsMap.get(orderIdStr)!.push(item);
    });

    const enrichedOrders = rawOrders.map(order => {
      const items = itemsMap.get(order._id.toString()) || [];
      const subtotal = order.subtotal || 0;
      const discount = order.discount || 0;
      const taxableAmount = Math.max(0, subtotal - discount);
      const taxRate = order.taxRate || 18;
      const taxAmount = order.tax || Math.round(taxableAmount * 0.18 * 100) / 100;
      const cgst = order.cgst || Math.round((taxAmount / 2) * 100) / 100;
      const sgst = order.sgst || Math.round((taxAmount / 2) * 100) / 100;
      const shippingCharge = order.shippingCharge || 0;
      const totalAmount = order.totalAmount || (taxableAmount + taxAmount + shippingCharge);

      const billingBreakup: IOrderBillingBreakup = {
        subtotal,
        discount,
        taxableAmount,
        taxRate,
        taxAmount,
        cgst,
        sgst,
        shippingCharge,
        totalAmount,
      };

      return {
        ...order,
        items,
        itemsCount: items.reduce((acc, it) => acc + (it.quantity || 1), 0),
        billingBreakup,
      };
    });

    return {
      items: enrichedOrders,
      total,
      page,
      limit: limit || total,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 1,
    };
  }

  public async get(id: string) {
    const order = await OrderModel.findById(id)
      .populate('user', 'name firstName lastName email phone role')
      .populate('address')
      .lean();

    if (!order) return null;

    const items = await OrderItemModel.find({ order: id })
      .populate({
        path: 'variant',
        select: 'variantName slug thumbnail images price sku discountPrice'
      })
      .populate({
        path: 'product',
        select: 'name images'
      })
      .lean();

    const subtotal = order.subtotal || 0;
    const discount = order.discount || 0;
    const taxableAmount = Math.max(0, subtotal - discount);
    const taxRate = order.taxRate || 18;
    const taxAmount = order.tax || Math.round(taxableAmount * 0.18 * 100) / 100;
    const cgst = order.cgst || Math.round((taxAmount / 2) * 100) / 100;
    const sgst = order.sgst || Math.round((taxAmount / 2) * 100) / 100;
    const shippingCharge = order.shippingCharge || 0;
    const totalAmount = order.totalAmount || (taxableAmount + taxAmount + shippingCharge);

    const billingBreakup: IOrderBillingBreakup = {
      subtotal,
      discount,
      taxableAmount,
      taxRate,
      taxAmount,
      cgst,
      sgst,
      shippingCharge,
      totalAmount,
    };

    return {
      ...order,
      items,
      itemsCount: items.reduce((acc, it) => acc + (it.quantity || 1), 0),
      billingBreakup,
    };
  }

  public async updateStatus(id: string, status: string) {
    return this.service.updateOrderStatus(id, status);
  }

  public async updatePaymentStatus(id: string, status: string) {
    return this.service.updatePaymentStatus(id, status);
  }

  public async updateShipping(id: string, payload: Record<string, unknown>) {
    const updated = await OrderModel.findByIdAndUpdate(id, { $set: { shipping: payload } } as any, { new: true })
      .populate('user', 'name firstName lastName email phone')
      .exec();
    return updated;
  }

  public async cancel(id: string) {
    return this.service.updateOrderStatus(id, 'CANCELLED');
  }
}
