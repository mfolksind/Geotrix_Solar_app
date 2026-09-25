import mongoose from "mongoose";
import { PaymentRepository } from "../repositories/payment.repository";
import { OrderRepository } from "../../orders/repositories/order.repository";
import { ApiError } from "../../../common/errors/ApiError";
import PaymentModel from "../models/payment.model";
import Razorpay from "razorpay";

export class PaymentService {
    private razorpay: Razorpay;

    constructor(
        private readonly repo: PaymentRepository,
        private readonly orderRepo: OrderRepository,
    ) {
        this.razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || "placeholder_key",
            key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder_secret",
        });
    }

    // Removed legacy createPayment as requested

    public async createRazorpayOrder(amount: number, currency: string = "INR", receipt: string) {
        if (!amount || amount < 1) {
            throw new ApiError(400, "Amount must be at least 1 INR");
        }

        const options = {
            amount: Math.round(amount * 100), // amount in smallest currency unit (paise)
            currency,
            receipt,
        };

        try {
            const order = await this.razorpay.orders.create(options);
            return order;
        } catch (err) {
            console.error("Razorpay Error:", err);
            throw new ApiError(500, "Failed to create Razorpay order");
        }
    }

    public async markRazorpaySuccess(orderId: string, transactionId: string, providerOrderId: string, userId: string) {
        const order = await this.orderRepo.findById(orderId);
        if (!order) throw new ApiError(404, "Order not found");

        const existingSuccess = await PaymentModel.findOne({ order: orderId, status: "SUCCESS" }).exec();
        if (existingSuccess) throw new ApiError(400, "Order already has a successful payment");

        try {
            const paymentPayload = {
                order: orderId,
                user: userId,
                paymentMethod: "RAZORPAY",
                amount: order.totalAmount,
                currency: "INR",
                transactionId,
                providerOrderId,
                status: "SUCCESS",
                paidAt: new Date(),
            };

            const payment = await this.repo.create(paymentPayload as any);
            await this.orderRepo.updatePaymentStatus(orderId, "PAID");
            // Order status stays PENDING (or current status) to be handled and confirmed explicitly by admin

            // Emit live socket event
            const { emitToUser, emitToAdmins } = await import("../../../socket/socket.server");
            const { notificationService } = await import("../../notifications/notification.service");

            emitToUser(userId, "order:payment_status_updated", {
                orderId,
                orderNumber: order.orderNumber,
                paymentStatus: "PAID",
            });
            emitToAdmins("order:payment_status_updated", {
                orderId,
                orderNumber: order.orderNumber,
                paymentStatus: "PAID",
            });

            try {
                await notificationService.sendNotification({
                    recipient: userId,
                    title: `Payment Received (#${order.orderNumber})`,
                    message: `Payment of ₹${order.totalAmount.toLocaleString()} received for order #${order.orderNumber}. Your order is awaiting admin review and confirmation.`,
                    type: "ORDER_PAYMENT",
                    data: {
                        orderId: String(order._id),
                        orderNumber: order.orderNumber,
                        paymentStatus: "PAID",
                    },
                });
            } catch (notifErr) {
                console.warn("[PaymentService] Failed to dispatch payment notification:", notifErr);
            }

            return payment;
        } catch (err) {
            throw ApiError.fromUnknown(err);
        }
    }

    public async getPayment(id: string) {
        return PaymentModel.findById(id).populate("order").populate("user").exec();
    }

    public async getPaymentsByUser(userId: string) {
        return PaymentModel.find({ user: userId }).sort({ createdAt: -1 }).exec();
    }

    // Removed retry and refund methods as requested
}
