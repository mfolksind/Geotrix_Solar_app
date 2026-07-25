import { Request, Response } from 'express';
import asyncHandler from '../../common/utils/asyncHandler';
import { DashboardService } from './dashboard.service';

const service = new DashboardService();

export class DashboardController {
  public get = asyncHandler(async (req: Request, res: Response) => {
    const data = await service.metrics();
    res.status(200).json({ success: true, data });
  });
}

export default new DashboardController();
