import UserModel from '../../modules/users/user.model';
import CategoryModel from '../../modules/categories/category.model';
import FamilyModel from '../../modules/families/family.model';
import OrderModel from '../../modules/orders/models/order.model';
import OrderItemModel from '../../modules/orders/models/orderItem.model';
import ProductModel from '../../modules/products/product.model';
import ProductVariantModel from '../../modules/products/productVariant.model';
import ReviewModel from '../../modules/reviews/models/review.model';
import TicketModel from '../../modules/support/models/ticket.model';
import { Lead as LeadModel } from '../../modules/leads/lead.model';
import PaymentModel from '../../modules/payments/models/payment.model';

export interface DashboardMetricsFilter {
  range?: string; // '7d' | '30d' | '90d' | '1y' | 'all'
  from?: Date;
  to?: Date;
}

export class DashboardService {
  public async metrics(filter: DashboardMetricsFilter = {}) {
    const now = new Date();
    let startDate: Date | null = null;
    let previousStartDate: Date | null = null;
    let previousEndDate: Date | null = null;

    const range = filter.range || '30d';

    if (filter.from && filter.to) {
      startDate = new Date(filter.from);
      const diff = filter.to.getTime() - filter.from.getTime();
      previousStartDate = new Date(filter.from.getTime() - diff);
      previousEndDate = new Date(filter.from);
    } else if (range === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      previousEndDate = startDate;
    } else if (range === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      previousEndDate = startDate;
    } else if (range === '90d') {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      previousStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      previousEndDate = startDate;
    } else if (range === '1y') {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      previousStartDate = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
      previousEndDate = startDate;
    } else {
      // 'all'
      startDate = null;
    }

    const currentPeriodMatch: any = {};
    if (startDate) {
      currentPeriodMatch.createdAt = { $gte: startDate };
    }

    const prevPeriodMatch: any = {};
    if (previousStartDate && previousEndDate) {
      prevPeriodMatch.createdAt = { $gte: previousStartDate, $lt: previousEndDate };
    }

    // Execute parallel queries for high performance
    const [
      // Totals
      allUsersCount,
      customersCount,
      periodCustomersCount,
      totalProductsCount,
      totalVariantsCount,
      totalFamiliesCount,
      totalCategoriesCount,
      totalOrdersCount,
      periodOrdersCount,
      pendingOrdersCount,
      processingOrdersCount,
      deliveredOrdersCount,
      cancelledOrdersCount,
      allTimeSalesResult,
      periodSalesResult,
      prevPeriodSalesResult,
      // Operational Action Items
      openTicketsCount,
      newLeadsCount,
      pendingReviewsCount,
      lowStockVariantsCount,
      // Aggregations
      salesTrendResult,
      orderStatusResult,
      paymentMethodResult,
      topProductsResult,
      categoryStatsResult,
      familyStatsResult,
      reviewSummaryResult,
      // Recent Feeds
      recentOrdersResult,
      recentTicketsResult,
      recentLeadsResult,
      recentReviewsResult,
    ] = await Promise.all([
      // 1. Users
      UserModel.countDocuments({ isDeleted: false }),
      UserModel.countDocuments({ role: { $in: ['customer', 'user'] }, isDeleted: false }),
      startDate
        ? UserModel.countDocuments({ role: { $in: ['customer', 'user'] }, createdAt: { $gte: startDate }, isDeleted: false })
        : UserModel.countDocuments({ role: { $in: ['customer', 'user'] }, isDeleted: false }),
      // 2. Catalog
      ProductModel.countDocuments({ isDeleted: false }),
      ProductVariantModel.countDocuments({ isDeleted: false }),
      FamilyModel.countDocuments({ isDeleted: false }),
      CategoryModel.countDocuments({ isDeleted: false }),
      // 3. Orders Counts
      OrderModel.countDocuments({}),
      OrderModel.countDocuments(currentPeriodMatch),
      OrderModel.countDocuments({ status: { $in: ['PENDING', 'CONFIRMED'] } }),
      OrderModel.countDocuments({ status: 'PROCESSING' }),
      OrderModel.countDocuments({ status: { $in: ['COMPLETED', 'DELIVERED'] } }),
      OrderModel.countDocuments({ status: 'CANCELLED' }),
      // 4. Sales Aggregations
      OrderModel.aggregate([
        { $match: { paymentStatus: 'PAID' } },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$totalAmount' },
            subtotal: { $sum: '$subtotal' },
            taxAmount: { $sum: '$taxAmount' },
            paidOrders: { $sum: 1 },
          },
        },
      ]),
      OrderModel.aggregate([
        { $match: { paymentStatus: 'PAID', ...(startDate ? { createdAt: { $gte: startDate } } : {}) } },
        {
          $group: {
            _id: null,
            periodSales: { $sum: '$totalAmount' },
            periodSubtotal: { $sum: '$subtotal' },
            periodTax: { $sum: '$taxAmount' },
            periodPaidOrders: { $sum: 1 },
          },
        },
      ]),
      prevPeriodMatch.createdAt
        ? OrderModel.aggregate([
            { $match: { paymentStatus: 'PAID', ...prevPeriodMatch } },
            { $group: { _id: null, prevSales: { $sum: '$totalAmount' } } },
          ])
        : Promise.resolve([]),
      // 5. Action Items
      TicketModel.countDocuments({ status: { $in: ['OPEN', 'IN_PROGRESS'] }, isDeleted: false }),
      LeadModel.countDocuments({ status: 'New' }),
      ReviewModel.countDocuments({ isApproved: false, isDeleted: false }),
      ProductVariantModel.countDocuments({ stock: { $lte: 5 }, isDeleted: false }),
      // 6. Sales Trend (by day if <= 90d, by month if > 90d)
      OrderModel.aggregate([
        { $match: { ...(startDate ? { createdAt: { $gte: startDate } } : {}) } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: range === '1y' || range === 'all' ? '%Y-%m' : '%Y-%m-%d',
                date: '$createdAt',
              },
            },
            revenue: {
              $sum: {
                $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, '$totalAmount', 0],
              },
            },
            tax: {
              $sum: {
                $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, { $ifNull: ['$taxAmount', 0] }, 0],
              },
            },
            orders: { $sum: 1 },
            paidOrders: {
              $sum: {
                $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, 1, 0],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // 7. Order Status Distribution
      OrderModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, totalValue: { $sum: '$totalAmount' } } },
        { $sort: { count: -1 } },
      ]),
      // 8. Payment Method Distribution
      OrderModel.aggregate([
        { $group: { _id: '$paymentMethod', count: { $sum: 1 }, totalValue: { $sum: '$totalAmount' } } },
        { $sort: { count: -1 } },
      ]),
      // 9. Top Selling Products
      OrderItemModel.aggregate([
        {
          $group: {
            _id: { product: '$product', name: '$productName' },
            unitsSold: { $sum: '$quantity' },
            revenue: { $sum: '$subtotal' },
            ordersCount: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1, unitsSold: -1 } },
        { $limit: 8 },
      ]),
      // 10. Sales by Category (via Product lookup)
      OrderItemModel.aggregate([
        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'prodInfo',
          },
        },
        { $unwind: { path: '$prodInfo', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'categories',
            localField: 'prodInfo.category',
            foreignField: '_id',
            as: 'catInfo',
          },
        },
        { $unwind: { path: '$catInfo', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$catInfo.name',
            unitsSold: { $sum: '$quantity' },
            revenue: { $sum: '$subtotal' },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 6 },
      ]),
      // 11. Sales by Family (via Product lookup)
      OrderItemModel.aggregate([
        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'prodInfo',
          },
        },
        { $unwind: { path: '$prodInfo', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'families',
            localField: 'prodInfo.family',
            foreignField: '_id',
            as: 'familyInfo',
          },
        },
        { $unwind: { path: '$familyInfo', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$familyInfo.name',
            unitsSold: { $sum: '$quantity' },
            revenue: { $sum: '$subtotal' },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 6 },
      ]),
      // 12. Reviews Aggregation
      ReviewModel.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            averageRating: { $avg: '$rating' },
            approvedReviews: { $sum: { $cond: [{ $eq: ['$isApproved', true] }, 1, 0] } },
          },
        },
      ]),
      // 13. Recent Orders
      OrderModel.find({})
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('user', 'name email')
        .lean()
        .exec(),
      // 14. Recent Support Tickets
      TicketModel.find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name email')
        .lean()
        .exec(),
      // 15. Recent Leads
      LeadModel.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
        .exec(),
      // 16. Recent Reviews
      ReviewModel.find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name email')
        .populate('product', 'name')
        .lean()
        .exec(),
    ]);

    const allTimeSales = allTimeSalesResult?.[0]?.totalSales ?? 0;
    const allTimeTax = allTimeSalesResult?.[0]?.taxAmount ?? 0;
    const periodSales = periodSalesResult?.[0]?.periodSales ?? (startDate ? 0 : allTimeSales);
    const periodTax = periodSalesResult?.[0]?.periodTax ?? (startDate ? 0 : allTimeTax);
    const periodPaidOrders = periodSalesResult?.[0]?.periodPaidOrders ?? 0;
    const prevPeriodSales = prevPeriodSalesResult?.[0]?.prevSales ?? 0;

    // Growth calculations
    let revenueGrowth = 0;
    if (prevPeriodSales > 0) {
      revenueGrowth = Math.round(((periodSales - prevPeriodSales) / prevPeriodSales) * 100);
    }

    const reviewSummary = reviewSummaryResult?.[0] ?? { totalReviews: 0, averageRating: 0, approvedReviews: 0 };
    const avgOrderVal = periodPaidOrders > 0 ? periodSales / periodPaidOrders : (totalOrdersCount > 0 ? allTimeSales / totalOrdersCount : 0);

    return {
      selectedRange: range,
      overview: {
        totalSales: allTimeSales,
        periodSales,
        periodTax,
        allTimeTax,
        revenueGrowth,
        totalOrders: totalOrdersCount,
        periodOrders: periodOrdersCount,
        paidOrders: allTimeSalesResult?.[0]?.paidOrders ?? 0,
        pendingOrders: pendingOrdersCount,
        processingOrders: processingOrdersCount,
        deliveredOrders: deliveredOrdersCount,
        cancelledOrders: cancelledOrdersCount,
        totalCustomers: customersCount,
        newCustomers: periodCustomersCount,
        totalUsers: allUsersCount,
        totalProducts: totalProductsCount,
        totalVariants: totalVariantsCount,
        totalFamilies: totalFamiliesCount,
        totalCategories: totalCategoriesCount,
        averageOrderValue: Math.round(avgOrderVal),
        fulfillmentRate: totalOrdersCount > 0 ? Math.round((deliveredOrdersCount / totalOrdersCount) * 100) : 100,
      },
      actionItems: {
        pendingOrders: pendingOrdersCount,
        openTickets: openTicketsCount,
        newLeads: newLeadsCount,
        pendingReviews: pendingReviewsCount,
        lowStockItems: lowStockVariantsCount,
      },
      salesTrend: salesTrendResult.map((item: any) => ({
        date: item._id,
        revenue: item.revenue || 0,
        tax: item.tax || 0,
        orders: item.orders || 0,
        paidOrders: item.paidOrders || 0,
      })),
      orderStatusBreakdown: orderStatusResult.map((item: any) => ({
        status: item._id || 'UNKNOWN',
        count: item.count,
        totalValue: item.totalValue || 0,
      })),
      paymentMethodBreakdown: paymentMethodResult.map((item: any) => ({
        method: item._id || 'ONLINE',
        count: item.count,
        totalValue: item.totalValue || 0,
      })),
      topProducts: topProductsResult.map((item: any) => ({
        productId: item._id.product?.toString() ?? '',
        name: item._id.name ?? 'Unnamed Product',
        unitsSold: item.unitsSold,
        revenue: item.revenue,
        ordersCount: item.ordersCount,
      })),
      categoryBreakdown: categoryStatsResult.map((item: any) => ({
        name: item._id || 'Uncategorized',
        unitsSold: item.unitsSold,
        revenue: item.revenue,
      })),
      familyBreakdown: familyStatsResult.map((item: any) => ({
        name: item._id || 'Unassigned Family',
        unitsSold: item.unitsSold,
        revenue: item.revenue,
      })),
      reviewsSummary: {
        totalReviews: reviewSummary.totalReviews,
        averageRating: Number(Number(reviewSummary.averageRating ?? 0).toFixed(1)),
        approvedReviews: reviewSummary.approvedReviews,
      },
      recentOrders: recentOrdersResult.map((order: any) => ({
        id: order._id?.toString() ?? '',
        orderNumber: order.orderNumber,
        customerName: order.user?.name ?? 'Guest / Customer',
        customerEmail: order.user?.email ?? '',
        totalAmount: order.totalAmount,
        subtotal: order.subtotal,
        taxAmount: order.taxAmount,
        paymentStatus: order.paymentStatus || 'PENDING',
        status: order.status || 'PENDING',
        createdAt: order.createdAt,
      })),
      recentTickets: recentTicketsResult.map((ticket: any) => ({
        id: ticket._id?.toString() ?? '',
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        priority: ticket.priority,
        status: ticket.status,
        userName: ticket.user?.name ?? 'Customer',
        createdAt: ticket.createdAt,
      })),
      recentLeads: recentLeadsResult.map((lead: any) => ({
        id: lead._id?.toString() ?? '',
        fullName: lead.fullName,
        propertyType: lead.propertyType,
        city: lead.city,
        whatsappNumber: lead.whatsappNumber,
        monthlyBill: lead.monthlyBill,
        status: lead.status,
        createdAt: lead.createdAt,
      })),
      recentReviews: recentReviewsResult.map((review: any) => ({
        id: review._id?.toString() ?? '',
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        isApproved: review.isApproved,
        userName: review.user?.name ?? 'Anonymous',
        productName: review.product?.name ?? 'Product',
        createdAt: review.createdAt,
      })),
    };
  }
}
