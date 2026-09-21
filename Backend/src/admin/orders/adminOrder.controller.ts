import { Request, Response } from 'express';
import asyncHandler from '../../common/utils/asyncHandler';
import { AdminOrderService } from './adminOrder.service';

const service = new AdminOrderService();

export class AdminOrderController {
  public getStats = asyncHandler(async (_req: Request, res: Response) => {
    const stats = await service.getStats();
    res.status(200).json({ success: true, data: stats });
  });

  public list = asyncHandler(async (req: Request, res: Response) => {
    const result = await service.list(req.query as any);
    res.status(200).json({
      success: true,
      data: result.items,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      }
    });
  });

  public get = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const order = await service.get(id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }
    res.status(200).json({ success: true, data: order });
  });

  public updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: string };
    const updated = await service.updateStatus(id, status);
    res.status(200).json({ success: true, data: updated });
  });

  public updatePaymentStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const status = (req.body as any)?.status || (req.body as any)?.paymentStatus;
    const updated = await service.updatePaymentStatus(id, status);
    res.status(200).json({ success: true, data: updated });
  });

  public updateShipping = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const updated = await service.updateShipping(id, req.body as Record<string, unknown>);
    res.status(200).json({ success: true, data: updated });
  });

  public cancel = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const cancelled = await service.cancel(id);
    res.status(200).json({ success: true, data: cancelled });
  });
}

export default new AdminOrderController();

