import { Request, Response } from 'express';
import asyncHandler from '../../../common/utils/asyncHandler';
import { PaymentService } from '../services/payment.service';

type AuthRequest = Request & { user?: { id: string } };

export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  public createPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { orderId, paymentMethod, amount, currency, metadata } = req.body as any;
    const userId = req.user?.id as string;
    const payment = await this.service.createPayment({ orderId, userId, paymentMethod, amount, currency, metadata });
    res.status(201).json({ success: true, data: payment });
  });

  public verifyPayment = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body as any;
    const updated = await this.service.verifyPayment(payload);
    res.status(200).json({ success: true, data: updated });
  });

  public retryPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const retry = await this.service.retryPayment(id);
    res.status(201).json({ success: true, data: retry });
  });

  public refundPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const { amount } = req.body as { amount: number };
    const updated = await this.service.refundPayment(id, amount);
    res.status(200).json({ success: true, data: updated });
  });

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
}
