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
    clientItems: { variantId: string; quantity: number; unit?: string; selectedUnit?: string }[],
    notes?: string,
    paymentMethod: 'RAZORPAY' | 'BANK_TRANSFER' | string = 'RAZORPAY'
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

      // Multi-unit determination
      const chosenUnit = (item.selectedUnit || item.unit || variant.unit || 'pcs').trim();
      let unitPrice = variant.discountPrice || variant.price;

      if (variant.unitPrices && Array.isArray(variant.unitPrices) && variant.unitPrices.length > 0) {
        const matchingUnitPrice = variant.unitPrices.find(
          (up: any) => up.unit?.toLowerCase() === chosenUnit.toLowerCase()
        );
        if (matchingUnitPrice) {
          unitPrice = matchingUnitPrice.discountPrice ?? matchingUnitPrice.price;
        }
      }

      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;

      itemsData.push({
        product: product.id,
        variant: variant.id,
        productName: product.name,
        variantName: variant.variantName,
        quantity: item.quantity,
        unit: chosenUnit,
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
        paymentMethod: paymentMethod || 'RAZORPAY',
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
        unit: it.unit,
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

      // create initial payment tracking record
      try {
        const PaymentModel = (await import('../../payments/models/payment.model')).default;
        await PaymentModel.create({
          order: order._id,
          user: userId,
          paymentMethod: paymentMethod || 'RAZORPAY',
          paymentProvider: paymentMethod === 'RAZORPAY' ? 'RAZORPAY' : 'BANK_TRANSFER',
          amount: totalAmount,
          subtotal,
          taxAmount: tax,
          cgst,
          sgst,
          discount,
          shippingFee: shippingCharge,
          currency: 'INR',
          status: 'PENDING',
        });
      } catch (payErr) {
        console.warn('[OrderService] Failed to create pending payment record:', payErr);
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

      // 1. Clear user cart upon successful order placement
      try {
        const cart = await this.cartRepo.findByUser(userId);
        if (cart) {
          const cartItems = await this.cartItemRepo.findByCart(cart.id);
          await Promise.all(cartItems.map((i) => this.cartItemRepo.delete(i.id)));
          await this.cartRepo.clearCart(cart.id);
          emitToUser(userId, 'cart:updated', { action: 'CLEAR' });
        }
      } catch (cartErr) {
        console.warn('[OrderService] Failed to clear user cart on order creation:', cartErr);
      }

      // 2. Emit live socket events
      const orderData = populated ? populated.toObject() : order.toObject();
      emitToUser(userId, 'order:created', { order: orderData, billingBreakup });
      emitToAdmins('order:new', { order: orderData, billingBreakup });

      // 3. Dispatch multi-channel notifications based on paymentMethod
      try {
        const isBankTransfer = paymentMethod === 'BANK_TRANSFER';

        const customerTitle = isBankTransfer
          ? `Order Placed - Bank Transfer (#${order.orderNumber})`
          : `Order Received (#${order.orderNumber})`;

        const customerMsg = isBankTransfer
          ? `Your order #${order.orderNumber} for ₹${totalAmount.toLocaleString()} has been placed via Bank Transfer. Please complete the transfer and our finance team will verify your payment.`
          : `Thank you! Your order #${order.orderNumber} for ₹${totalAmount.toLocaleString()} has been placed and is awaiting admin confirmation.`;

        // Customer notification
        await notificationService.sendNotification({
          recipient: userId,
          title: customerTitle,
          message: customerMsg,
          type: 'ORDER_CREATED',
          data: {
            orderId: String(order._id),
            orderNumber: order.orderNumber,
            totalAmount,
            status: 'PENDING',
            paymentMethod: order.paymentMethod,
          },
        });

        // Admin team notification
        const adminTitle = isBankTransfer
          ? `New Bank Transfer Order (#${order.orderNumber})`
          : `New Order Received (#${order.orderNumber})`;

        const adminMsg = isBankTransfer
          ? `New bank transfer order for ₹${totalAmount.toLocaleString()} awaiting manual payment verification.`
          : `New order placed for ₹${totalAmount.toLocaleString()} with ${orderItems.length} item(s).`;

        await notificationService.sendToRole('admin', {
          title: adminTitle,
          message: adminMsg,
          type: 'ORDER_CREATED',
          data: {
            orderId: String(order._id),
            orderNumber: order.orderNumber,
            totalAmount,
            paymentMethod: order.paymentMethod,
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

    const formattedStatus = status.toUpperCase();
    const updated = await this.orderRepo.updateStatus(id, formattedStatus);

    const customerId =
      order.user && typeof order.user === 'object' && (order.user as any)._id
        ? String((order.user as any)._id)
        : String(order.user);

    emitToUser(customerId, 'order:status_updated', {
      orderId: id,
      orderNumber: order.orderNumber,
      status: formattedStatus,
    });
    emitToAdmins('order:status_updated', {
      orderId: id,
      orderNumber: order.orderNumber,
      status: formattedStatus,
    });

    let notifTitle = `Order Update: #${order.orderNumber}`;
    let notifMessage = `Your order status has been updated to "${formattedStatus}".`;

    switch (formattedStatus) {
      case 'CONFIRMED':
        notifTitle = `Order Confirmed! (#${order.orderNumber})`;
        notifMessage = `Great news! Your order #${order.orderNumber} has been verified and confirmed by our team.`;
        break;
      case 'PROCESSING':
        notifTitle = `Order in Processing (#${order.orderNumber})`;
        notifMessage = `Your order #${order.orderNumber} is currently being packed and prepared for dispatch.`;
        break;
      case 'SHIPPED':
        notifTitle = `Order Shipped! (#${order.orderNumber})`;
        notifMessage = `Your order #${order.orderNumber} has been handed over to the courier and is on its way.`;
        break;
      case 'DELIVERED':
        notifTitle = `Order Delivered! (#${order.orderNumber})`;
        notifMessage = `Your order #${order.orderNumber} has been successfully delivered. Thank you for choosing Geotrix!`;
        break;
      case 'CANCELLED':
        notifTitle = `Order Cancelled (#${order.orderNumber})`;
        notifMessage = `Your order #${order.orderNumber} has been cancelled.`;
        break;
    }

    try {
      await notificationService.sendNotification({
        recipient: customerId,
        title: notifTitle,
        message: notifMessage,
        type: 'ORDER_STATUS',
        data: { orderId: id, orderNumber: order.orderNumber, status: formattedStatus },
      });
    } catch (notifErr) {
      console.warn('[OrderService] Failed to notify on order status update:', notifErr);
    }

    return updated;
  }

  public async updatePaymentStatus(id: string, paymentStatus: string) {
    const order = await this.orderRepo.findById(id);
    if (!order) throw new ApiError(404, 'Order not found');

    const formattedPaymentStatus = paymentStatus.toUpperCase();
    const updated = await this.orderRepo.updatePaymentStatus(id, formattedPaymentStatus);

    // Sync Payment record if exists
    try {
      const PaymentModel = (await import('../../payments/models/payment.model')).default;
      const paymentSyncStatus =
        formattedPaymentStatus === 'PAID'
          ? 'SUCCESS'
          : formattedPaymentStatus === 'FAILED'
          ? 'FAILED'
          : formattedPaymentStatus === 'REFUNDED'
          ? 'REFUNDED'
          : 'PENDING';

      await PaymentModel.findOneAndUpdate(
        { order: id },
        {
          status: paymentSyncStatus,
          ...(paymentSyncStatus === 'SUCCESS' ? { paidAt: new Date() } : {}),
        }
      ).exec();
    } catch (paySyncErr) {
      console.warn('[OrderService] Failed to sync payment document on status update:', paySyncErr);
    }

    const customerId =
      order.user && typeof order.user === 'object' && (order.user as any)._id
        ? String((order.user as any)._id)
        : String(order.user);

    emitToUser(customerId, 'order:payment_status_updated', {
      orderId: id,
      orderNumber: order.orderNumber,
      paymentStatus: formattedPaymentStatus,
    });
    emitToAdmins('order:payment_status_updated', {
      orderId: id,
      orderNumber: order.orderNumber,
      paymentStatus: formattedPaymentStatus,
    });

    const isBankTransfer = order.paymentMethod === 'BANK_TRANSFER';
    let notifTitle = `Payment Status Update (#${order.orderNumber})`;
    let notifMessage = `Payment status for order #${order.orderNumber} is now "${formattedPaymentStatus}".`;

    switch (formattedPaymentStatus) {
      case 'PAID':
        notifTitle = isBankTransfer
          ? `Bank Payment Verified! (#${order.orderNumber})`
          : `Payment Confirmed (#${order.orderNumber})`;
        notifMessage = isBankTransfer
          ? `Your bank transfer payment of ₹${(order.totalAmount || 0).toLocaleString()} for order #${order.orderNumber} has been verified and confirmed by our finance team.`
          : `Payment of ₹${(order.totalAmount || 0).toLocaleString()} has been received for order #${order.orderNumber}.`;
        break;
      case 'FAILED':
        notifTitle = isBankTransfer
          ? `Bank Payment Verification Failed (#${order.orderNumber})`
          : `Payment Failed (#${order.orderNumber})`;
        notifMessage = isBankTransfer
          ? `We could not verify the bank transfer for order #${order.orderNumber}. Please contact support or retry payment.`
          : `Payment for order #${order.orderNumber} could not be completed. Please check and retry.`;
        break;
      case 'REFUNDED':
        notifTitle = `Payment Refunded (#${order.orderNumber})`;
        notifMessage = `A refund of ₹${(order.totalAmount || 0).toLocaleString()} has been processed for order #${order.orderNumber}.`;
        break;
    }

    try {
      await notificationService.sendNotification({
        recipient: customerId,
        title: notifTitle,
        message: notifMessage,
        type: 'ORDER_PAYMENT',
        data: {
          orderId: id,
          orderNumber: order.orderNumber,
          paymentStatus: formattedPaymentStatus,
          paymentMethod: order.paymentMethod,
        },
      });
    } catch (notifErr) {
      console.warn('[OrderService] Failed to notify on payment status update:', notifErr);
    }

    return updated;
  }
}
