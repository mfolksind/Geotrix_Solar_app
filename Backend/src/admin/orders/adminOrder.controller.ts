import { Request, Response } from 'express';
import asyncHandler from '../../common/utils/asyncHandler';
import { AdminOrderService } from './adminOrder.service';

const service = new AdminOrderService();

export class AdminOrderController {
  public list = asyncHandler(async (req: Request, res: Response) => {
    const result = await service.list(req.query as Record<string, unknown>);
    res.status(200).json({ success: true, data: result });
  });

  public get = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const order = await service.get(id);
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
    const { status } = req.body as { status: string };
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
