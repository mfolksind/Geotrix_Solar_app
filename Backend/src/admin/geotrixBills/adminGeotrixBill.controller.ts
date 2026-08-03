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
}

export default new AdminGeotrixBillController();
