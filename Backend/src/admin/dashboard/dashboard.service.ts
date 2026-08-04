import { UserRepository } from '../../modules/users/user.repository';
import { CategoryRepository } from '../../modules/categories/category.repository';
import OrderModel from '../../modules/orders/models/order.model';
import OrderItemModel from '../../modules/orders/models/orderItem.model';
import ProductModel from '../../modules/products/product.model';
import ReviewModel from '../../modules/reviews/models/review.model';

export class DashboardService {
  private userRepo = new UserRepository();
  private categoryRepo = new CategoryRepository();

  public async metrics() {
    const now = new Date();
    const startOfRange = new Date(now);
    startOfRange.setDate(now.getDate() - 6);

    const [
      users,
      totalProductsCount,
      categories,
      totalOrdersCount,
      pendingOrdersCount,
      completedOrdersCount,
      totalSalesResult,
      topProductsResult,
      orderStatusResult,
      salesTrendResult,
      reviewSummaryResult,
      recentOrdersResult,
      recentReviewsResult,
    ] = await Promise.all([
      this.userRepo.findAll(),
      ProductModel.countDocuments({ isDeleted: false }).exec(),
      this.categoryRepo.findAll(),
      OrderModel.countDocuments({}).exec(),
      OrderModel.countDocuments({ status: 'PENDING' }).exec(),
      OrderModel.countDocuments({ status: { $in: ['COMPLETED', 'DELIVERED'] } }).exec(),
      OrderModel.aggregate([
        { $match: { paymentStatus: 'PAID' } },
        { $group: { _id: null, totalSales: { $sum: '$totalAmount' } } },
      ]).exec(),
      OrderItemModel.aggregate([
        { $group: { _id: { product: '$product', name: '$productName' }, unitsSold: { $sum: '$quantity' }, revenue: { $sum: '$subtotal' } } },
        { $sort: { unitsSold: -1, revenue: -1 } },
        { $limit: 5 },
      ]).exec(),
      OrderModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).exec(),
      OrderModel.aggregate([
        { $match: { createdAt: { $gte: startOfRange } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]).exec(),
      ReviewModel.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, totalReviews: { $sum: 1 }, averageRating: { $avg: '$rating' }, approvedReviews: { $sum: { $cond: [{ $eq: ['$isApproved', true] }, 1, 0] } } } },
      ]).exec(),
      OrderModel.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name email')
        .lean()
        .exec(),
      ReviewModel.find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name email')
        .populate('product', 'name')
        .lean()
        .exec(),
    ]);

    const totalUsers = users.filter((u: any) => ['customer', 'user'].includes(u.role)).length;
    const activeCustomers = users.filter((u: any) => ['customer', 'user'].includes(u.role) && u.status === 'active').length;
    const totalProducts = totalProductsCount as number;
    const totalCategories = categories.length;
    const totalOrders = totalOrdersCount as number;
    const pendingOrders = pendingOrdersCount as number;
    const completedOrders = completedOrdersCount as number;
    const totalSales = totalSalesResult?.[0]?.totalSales ?? 0;
    const reviewSummary = reviewSummaryResult?.[0] ?? { totalReviews: 0, averageRating: 0, approvedReviews: 0 };

    return {
      totalSales,
      totalOrders,
      totalCustomers: totalUsers,
      activeCustomers,
      totalProducts,
      totalCategories,
      pendingOrders,
      completedOrders,
      averageOrderValue: totalOrders ? totalSales / totalOrders : 0,
      topProducts: topProductsResult.map((item: any) => ({
        productId: item._id.product?.toString() ?? '',
        name: item._id.name ?? 'Unnamed product',
        unitsSold: item.unitsSold,
        revenue: item.revenue,
      })),
      recentOrders: recentOrdersResult.map((order: any) => ({
        id: order._id?.toString() ?? '',
        orderNumber: order.orderNumber,
        customerName: order.user?.name ?? 'Unknown customer',
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
      })),
      salesTrend: salesTrendResult.map((item: any) => ({
        date: item._id,
        revenue: item.revenue,
        orders: item.orders,
      })),
      orderStatusBreakdown: orderStatusResult.map((item: any) => ({
        status: item._id,
        count: item.count,
      })),
      reviewsSummary: {
        totalReviews: reviewSummary.totalReviews,
        averageRating: Number(reviewSummary.averageRating ?? 0),
        approvedReviews: reviewSummary.approvedReviews,
      },
      recentReviews: recentReviewsResult.map((review: any) => ({
        id: review._id?.toString() ?? '',
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        userName: review.user?.name ?? 'Anonymous',
        productName: review.product?.name ?? 'Unknown product',
        createdAt: review.createdAt,
      })),
    };
  }
}
