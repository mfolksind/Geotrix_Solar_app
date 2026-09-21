import { Request, Response } from 'express';
import asyncHandler from '../../common/utils/asyncHandler';
import { AdminPaymentService } from './adminPayment.service';

type AuthRequest = Request & { user?: { id: string; role?: string } };

const service = new AdminPaymentService();

export class AdminPaymentController {
  public getStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const stats = await service.getStats();
    res.status(200).json({ success: true, data: stats });
  });

  public list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await service.listPayments(req.query as Record<string, unknown>);
    res.status(200).json({ success: true, data: result });
  });

  public get = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const payment = await service.getPayment(id);
    res.status(200).json({ success: true, data: payment });
  });

  public updateStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const { status, failureReason } = req.body as { status: string; failureReason?: string };
    const updated = await service.updateStatus(id, status, failureReason);
    res.status(200).json({ success: true, data: updated });
  });
}

export default new AdminPaymentController();
