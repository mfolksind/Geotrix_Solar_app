import mongoose from 'mongoose';
import { OrderRepository } from '../repositories/order.repository';
import { OrderItemRepository } from '../repositories/orderItem.repository';
import { CartRepository } from '../../carts/repositories/cart.repository';
import { CartItemRepository } from '../../carts/repositories/cartItem.repository';
import AddressModel from '../../addresses/models/address.model';
import ProductModel from '../../products/product.model';
import ProductVariantModel from '../../products/productVariant.model';
import { ApiError } from '../../../common/errors/ApiError';
import { IOrderBillingBreakup } from '../interfaces/order.interface';
import { emitToUser, emitToAdmins } from '../../../socket/socket.server';
import { notificationService } from '../../notifications/notification.service';

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${ts}-${rand}`;
}

export class OrderService {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly orderItemRepo: OrderItemRepository,
    private readonly cartRepo: CartRepository,
    private readonly cartItemRepo: CartItemRepository
  ) {}

  public async createOrder(
    userId: string,
    addressId: string,
    clientItems: { variantId: string; quantity: number }[],
    notes?: string
  ) {
    if (!clientItems || clientItems.length === 0) throw new ApiError(400, 'Cart is empty');

    // validate address
    const address = await AddressModel.findById(addressId).exec();
    if (!address) throw new ApiError(404, 'Address not found');
    if (address.user.toString() !== userId) throw new ApiError(403, 'Address does not belong to user');

    let subtotal = 0;
    const itemsData = [];

    // validate product/variant availability and calculate subtotal
    for (const item of clientItems) {
      const variant = await ProductVariantModel.findById(item.variantId).exec();
      if (!variant) throw new ApiError(400, 'Product variant not found');

      const product = await ProductModel.findById(variant.product).exec();
      if (!product || (product as any).isDeleted || (product as any).status !== 'ACTIVE')
        throw new ApiError(400, 'Product is not available');

      if ((variant.stock ?? 0) < item.quantity)
        throw new ApiError(400, `Insufficient stock for variant ${variant.id}`);

      const unitPrice = variant.discountPrice || variant.price;
      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;

      itemsData.push({
        product: product.id,
        variant: variant.id,
        productName: product.name,
        variantName: variant.variantName,
        quantity: item.quantity,
        unitPrice,
        subtotal: itemSubtotal,
      });
    }

    try {
      const discount = 0; // Or calculate if coupon is applied
      const taxableAmount = Math.max(0, subtotal - discount);
      const taxRate = 18; // 18% standard GST
      const tax = Math.round(taxableAmount * 0.18 * 100) / 100;
      const cgst = Math.round((tax / 2) * 100) / 100; // 9%
      const sgst = Math.round((tax / 2) * 100) / 100; // 9%
      const shippingCharge = Number(process.env.SHIPPING_CHARGE ?? 0);
      const totalAmount = Math.round((taxableAmount + tax + shippingCharge) * 100) / 100;

      const orderPayload = {
        orderNumber: generateOrderNumber(),
        user: userId,
        address: addressId,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        subtotal,
        shippingCharge,
        discount,
        taxRate,
        tax,
        cgst,
        sgst,
        totalAmount,
        notes,
      } as const;

      const order = await this.orderRepo.create(orderPayload as any);

      // build order items
      const orderItems = itemsData.map((it) => ({
        order: order.id,
        product: it.product,
        variant: it.variant,
        productName: it.productName,
        variantName: it.variantName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        subtotal: it.subtotal,
      }));

      await this.orderItemRepo.createMany(orderItems as any[]);

      // deduct stock
      for (const it of itemsData) {
        const variant = await ProductVariantModel.findById(it.variant).exec();
        if (!variant) throw new ApiError(400, 'Product variant not found during stock deduction');
        const newStock = (variant.stock ?? 0) - it.quantity;
        if (newStock < 0) throw new ApiError(400, 'Insufficient stock during order creation');
        await ProductVariantModel.findByIdAndUpdate(variant.id, { stock: newStock }).exec();
      }

      // return populated order with billing breakup
      const populated = await this.orderRepo.findById(order.id);
      const billingBreakup: IOrderBillingBreakup = {
        subtotal,
        discount,
        taxableAmount,
        taxRate,
        taxAmount: tax,
        cgst,
        sgst,
        shippingCharge,
        totalAmount,
      };

      // 1. Emit live socket events
      const orderData = populated ? populated.toObject() : order.toObject();
      emitToUser(userId, 'order:created', { order: orderData, billingBreakup });
      emitToAdmins('order:new', { order: orderData, billingBreakup });

      // 2. Dispatch multi-channel notifications
      try {
        // Customer notification
        await notificationService.sendNotification({
          recipient: userId,
          title: `Order Placed Successfully! (#${order.orderNumber})`,
          message: `Your order for ₹${totalAmount.toLocaleString()} has been placed. We'll notify you once it ships!`,
          type: 'ORDER_CREATED',
          data: {
            orderId: String(order._id),
            orderNumber: order.orderNumber,
            totalAmount,
          },
        });

        // Admin team notification
        await notificationService.sendToRole('admin', {
          title: `New Order Received (#${order.orderNumber})`,
          message: `New order placed for ₹${totalAmount.toLocaleString()} with ${orderItems.length} item(s).`,
          type: 'ORDER_CREATED',
          data: {
            orderId: String(order._id),
            orderNumber: order.orderNumber,
            totalAmount,
          },
        });
      } catch (notifErr) {
        console.warn('[OrderService] Failed to dispatch order notifications:', notifErr);
      }

      return {
        ...orderData,
        billingBreakup,
      };
    } catch (err) {
      throw ApiError.fromUnknown(err);
    }
  }

  public async getOrder(id: string) {
    const order = await this.orderRepo.findById(id);
    if (!order) throw new ApiError(404, 'Order not found');
    const items = await this.orderItemRepo.findByOrder(id);

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
      ...order.toObject(),
      items,
      billingBreakup,
    };
  }

  public async getOrders(userId: string, isAdmin: boolean = false) {
    if (isAdmin) {
      return this.orderRepo.findAll();
    }
    return this.orderRepo.findByUser(userId);
  }

  public async cancelOrder(id: string, userId: string) {
    const order = await this.orderRepo.findById(id);
    if (!order) throw new ApiError(404, 'Order not found');
    if (order.user.toString() !== userId) throw new ApiError(403, 'Cannot cancel order');
    if (order.status === 'CANCELLED') return order;

    if (order.paymentStatus === 'PENDING') {
      await this.orderRepo.updatePaymentStatus(id, 'FAILED');
    }
    const cancelled = await this.orderRepo.updateStatus(id, 'CANCELLED');

    emitToUser(userId, 'order:cancelled', { orderId: id, orderNumber: order.orderNumber });
    emitToAdmins('order:cancelled', { orderId: id, orderNumber: order.orderNumber });

    try {
      await notificationService.sendNotification({
        recipient: userId,
        title: `Order Cancelled (#${order.orderNumber})`,
        message: `Your order #${order.orderNumber} has been successfully cancelled.`,
        type: 'ORDER_STATUS',
        data: { orderId: id, orderNumber: order.orderNumber, status: 'CANCELLED' },
      });
    } catch (notifErr) {
      console.warn('[OrderService] Failed to notify on order cancellation:', notifErr);
    }

    return cancelled;
  }

  public async updateOrderStatus(id: string, status: string) {
    const order = await this.orderRepo.findById(id);
    if (!order) throw new ApiError(404, 'Order not found');

    const updated = await this.orderRepo.updateStatus(id, status);

    const customerId =
      order.user && typeof order.user === 'object' && (order.user as any)._id
        ? String((order.user as any)._id)
        : String(order.user);

    emitToUser(customerId, 'order:status_updated', {
      orderId: id,
      orderNumber: order.orderNumber,
      status,
    });

    try {
      await notificationService.sendNotification({
        recipient: customerId,
        title: `Order Update: #${order.orderNumber}`,
        message: `Your order status is now "${status}".`,
        type: 'ORDER_STATUS',
        data: { orderId: id, orderNumber: order.orderNumber, status },
      });
    } catch (notifErr) {
      console.warn('[OrderService] Failed to notify on order status update:', notifErr);
    }

    return updated;
  }
}
