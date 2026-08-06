import { Request, Response } from 'express';
import asyncHandler from '../../../common/utils/asyncHandler';
import { PaymentService } from '../services/payment.service';
import crypto from 'crypto';

type AuthRequest = Request & { user?: { id: string } };

export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  public getPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const payment = await this.service.getPayment(id);
    res.status(200).json({ success: true, data: payment });
  });

  public getPaymentsByUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id as string;
    const payments = await this.service.getPaymentsByUser(userId);
    res.status(200).json({ success: true, data: payments });
  });

  public createRazorpayOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { amount, currency = "INR", receipt } = req.body;
    const order = await this.service.createRazorpayOrder(amount, currency, receipt);
    res.status(201).json({ success: true, data: order });
  });

  public verifyRazorpayPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({ success: false, message: 'Missing required payment verification fields' });
    }

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Now update payment record locally
    const userId = req.user?.id as string;
    const updated = await this.service.markRazorpaySuccess(
      orderId,
      razorpay_payment_id,
      razorpay_order_id,
      userId
    );
    
    res.status(200).json({ success: true, data: updated });
  });
}
