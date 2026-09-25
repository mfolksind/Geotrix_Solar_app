import PaymentModel from '../../modules/payments/models/payment.model';
import OrderModel from '../../modules/orders/models/order.model';
import UserModel from '../../modules/users/user.model';
import { Types } from 'mongoose';

export interface AdminPaymentQuery {
  page?: number | string;
  limit?: number | string;
  search?: string;
  status?: string;
  paymentMethod?: string;
  sort?: string;
}

export class AdminPaymentService {
  public async getStats() {
    const [
      totalPayments,
      successfulPayments,
      pendingPayments,
      failedPayments,
      refundedPayments,
      volumeResult,
    ] = await Promise.all([
      PaymentModel.countDocuments({}),
      PaymentModel.countDocuments({ status: 'SUCCESS' }),
      PaymentModel.countDocuments({ status: 'PENDING' }),
      PaymentModel.countDocuments({ status: 'FAILED' }),
      PaymentModel.countDocuments({ status: 'REFUNDED' }),
      PaymentModel.aggregate([
        { $match: { status: 'SUCCESS' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const totalVolume = volumeResult?.[0]?.total || 0;

    return {
      totalPayments,
      successfulPayments,
      pendingPayments,
      failedPayments,
      refundedPayments,
      totalVolume,
    };
  }

  public async listPayments(query: AdminPaymentQuery = {}) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (query.status && query.status !== 'ALL') {
      filter.status = query.status.toUpperCase();
    }

    if (query.paymentMethod && query.paymentMethod !== 'ALL') {
      filter.paymentMethod = query.paymentMethod.toUpperCase();
    }

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');

      const [matchingUsers, matchingOrders] = await Promise.all([
        UserModel.find({
          $or: [
            { name: { $regex: searchRegex } },
            { email: { $regex: searchRegex } },
            { phone: { $regex: searchRegex } },
          ],
        }).select('_id').lean(),
        OrderModel.find({
          orderNumber: { $regex: searchRegex },
        }).select('_id').lean(),
      ]);

      const userIds = matchingUsers.map((u) => u._id);
      const orderIds = matchingOrders.map((o) => o._id);

      filter.$or = [
        { transactionId: { $regex: searchRegex } },
        { providerOrderId: { $regex: searchRegex } },
        { paymentProvider: { $regex: searchRegex } },
        { user: { $in: userIds } },
        { order: { $in: orderIds } },
      ];
    }

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (query.sort === 'oldest') sortOption = { createdAt: 1 };
    else if (query.sort === 'amount_desc') sortOption = { amount: -1 };
    else if (query.sort === 'amount_asc') sortOption = { amount: 1 };

    const paymentsQuery = PaymentModel.find(filter)
      .populate('user', 'name email phone role')
      .populate('order', 'orderNumber status paymentStatus totalAmount subtotal tax shippingCharge discount')
      .skip(skip)
      .limit(limit)
      .sort(sortOption);

    const [items, total] = await Promise.all([
      paymentsQuery.exec(),
      PaymentModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  public async getPayment(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new Error('Invalid payment ID');

    const payment = await PaymentModel.findById(id)
      .populate('user', 'name email phone role')
      .populate({
        path: 'order',
        populate: [{ path: 'address' }],
      })
      .exec();

    return payment;
  }

  public async updateStatus(id: string, status: string, failureReason?: string) {
    if (!Types.ObjectId.isValid(id)) throw new Error('Invalid payment ID');

    const formattedStatus = status.toUpperCase();
    const updatePayload: any = { status: formattedStatus };
    if (formattedStatus === 'SUCCESS') {
      updatePayload.paidAt = new Date();
    }
    if (failureReason) {
      updatePayload.failureReason = failureReason;
    }

    const updated = await PaymentModel.findByIdAndUpdate(id, updatePayload, { new: true })
      .populate('user', 'name email phone')
      .populate('order')
      .exec();

    if (updated && updated.order) {
      const orderDoc: any = updated.order;
      const orderId = typeof orderDoc === 'object' && orderDoc._id ? orderDoc._id : orderDoc;
      const orderNumber = orderDoc?.orderNumber || 'Order';
      const customerId =
        updated.user && typeof updated.user === 'object' && (updated.user as any)._id
          ? String((updated.user as any)._id)
          : String(updated.user || orderDoc?.user);

      const mappedPaymentStatus =
        formattedStatus === 'SUCCESS'
          ? 'PAID'
          : formattedStatus === 'REFUNDED'
          ? 'REFUNDED'
          : formattedStatus === 'FAILED'
          ? 'FAILED'
          : 'PENDING';

      // Update Order paymentStatus only (order status remains PENDING for explicit admin confirmation)
      await OrderModel.findByIdAndUpdate(orderId, { paymentStatus: mappedPaymentStatus }).exec();

      const { emitToUser, emitToAdmins } = await import('../../socket/socket.server');
      const { notificationService } = await import('../../modules/notifications/notification.service');

      emitToUser(customerId, 'order:payment_status_updated', {
        orderId: String(orderId),
        orderNumber,
        paymentStatus: mappedPaymentStatus,
      });
      emitToAdmins('order:payment_status_updated', {
        orderId: String(orderId),
        orderNumber,
        paymentStatus: mappedPaymentStatus,
      });

      let notifTitle = `Payment Status Update (#${orderNumber})`;
      let notifMessage = `Payment status for order #${orderNumber} is now "${mappedPaymentStatus}".`;

      if (mappedPaymentStatus === 'PAID') {
        notifTitle = `Payment Verified! (#${orderNumber})`;
        notifMessage = `Your payment of ₹${(updated.amount || 0).toLocaleString()} for order #${orderNumber} has been verified and confirmed by our finance team.`;
      } else if (mappedPaymentStatus === 'FAILED') {
        notifTitle = `Payment Verification Failed (#${orderNumber})`;
        notifMessage = `Payment verification for order #${orderNumber} was not successful. Please contact support.`;
      } else if (mappedPaymentStatus === 'REFUNDED') {
        notifTitle = `Payment Refunded (#${orderNumber})`;
        notifMessage = `A refund of ₹${(updated.amount || 0).toLocaleString()} has been processed for order #${orderNumber}.`;
      }

      try {
        await notificationService.sendNotification({
          recipient: customerId,
          title: notifTitle,
          message: notifMessage,
          type: 'ORDER_PAYMENT',
          data: {
            orderId: String(orderId),
            orderNumber,
            paymentStatus: mappedPaymentStatus,
          },
        });
      } catch (notifErr) {
        console.warn('[AdminPaymentService] Failed to dispatch payment notification:', notifErr);
      }
    }

    return updated;
  }
}
