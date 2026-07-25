import { Request, Response } from 'express';
import asyncHandler from '../../common/utils/asyncHandler';
import { AdminGeotrixBillService } from './adminGeotrixBill.service';

const service = new AdminGeotrixBillService();

export class AdminGeotrixBillController {
  public list = asyncHandler(async (req: Request, res: Response) => {
    const data = await service.list(req.query as Record<string, unknown>);
    res.status(200).json({ success: true, data });
  });

  public get = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const bill = await service.get(id);
    res.status(200).json({ success: true, data: bill });
  });

  public updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const payload = req.body;
    const userId = (req as any).user?.id as string;
    const updated = await service.updateStatus(id, payload, userId);
    res.status(200).json({ success: true, data: updated });
  });

  public approve = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { remarks } = req.body as { remarks?: string };
    const userId = (req as any).user?.id as string;
    const updated = await service.approve(id, remarks, userId);
    res.status(200).json({ success: true, data: updated });
  });

  public reject = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { remarks } = req.body as { remarks?: string };
    const userId = (req as any).user?.id as string;
    const updated = await service.reject(id, remarks, userId);
    res.status(200).json({ success: true, data: updated });
  });
}

export default new AdminGeotrixBillController();
