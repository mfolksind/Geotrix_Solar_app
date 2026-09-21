import OrderModel from '../../modules/orders/models/order.model';
import OrderItemModel from '../../modules/orders/models/orderItem.model';
import UserModel from '../../modules/users/user.model';
import ProductModel from '../../modules/products/product.model';

export class AnalyticsService {
  public async sales(period: { from?: Date; to?: Date; range?: string }) {
    const match: any = { paymentStatus: 'PAID' };
    if (period.from) match.createdAt = { $gte: period.from };
    if (period.to) match.createdAt = match.createdAt ? { ...match.createdAt, $lte: period.to } : { $lte: period.to };

    const [salesAggregate, salesTrend] = await Promise.all([
      OrderModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            subtotal: { $sum: '$subtotal' },
            taxAmount: { $sum: '$taxAmount' },
            ordersCount: { $sum: 1 },
          },
        },
      ]),
      OrderModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$totalAmount' },
            tax: { $sum: '$taxAmount' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const total = salesAggregate[0]?.totalRevenue ?? 0;
    const subtotal = salesAggregate[0]?.subtotal ?? 0;
    const tax = salesAggregate[0]?.taxAmount ?? 0;
    const ordersCount = salesAggregate[0]?.ordersCount ?? 0;

    return {
      total,
      subtotal,
      tax,
      ordersCount,
      averageOrderValue: ordersCount > 0 ? Math.round(total / ordersCount) : 0,
      trend: salesTrend,
    };
  }

  public async orders(period: { from?: Date; to?: Date }) {
    const match: any = {};
    if (period.from) match.createdAt = { $gte: period.from };
    if (period.to) match.createdAt = match.createdAt ? { ...match.createdAt, $lte: period.to } : { $lte: period.to };

    const [total, statusBreakdown] = await Promise.all([
      OrderModel.countDocuments(match).exec(),
      OrderModel.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    return { total, statusBreakdown };
  }

  public async products() {
    const [total, activeCount, topSelling] = await Promise.all([
      ProductModel.countDocuments({ isDeleted: false }).exec(),
      ProductModel.countDocuments({ isDeleted: false, status: 'ACTIVE' }).exec(),
      OrderItemModel.aggregate([
        {
          $group: {
            _id: { product: '$product', name: '$productName' },
            unitsSold: { $sum: '$quantity' },
            revenue: { $sum: '$subtotal' },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
      ]),
    ]);

    return {
      total,
      activeCount,
      topSelling: topSelling.map((p) => ({
        productId: p._id.product,
        name: p._id.name,
        unitsSold: p.unitsSold,
        revenue: p.revenue,
      })),
    };
  }

  public async users() {
    const [total, customers, admins] = await Promise.all([
      UserModel.countDocuments({ isDeleted: false }).exec(),
      UserModel.countDocuments({ role: { $in: ['customer', 'user'] }, isDeleted: false }).exec(),
      UserModel.countDocuments({ role: { $in: ['admin', 'super_admin', 'manager'] }, isDeleted: false }).exec(),
    ]);

    return { total, customers, admins };
  }

  public async revenue(period: { from?: Date; to?: Date; range?: string }) {
    return this.sales(period);
  }
}
