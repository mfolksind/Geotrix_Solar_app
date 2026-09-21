import { Request, Response } from 'express';
import asyncHandler from '../../common/utils/asyncHandler';
import { DashboardService } from './dashboard.service';

const service = new DashboardService();

export class DashboardController {
  public get = asyncHandler(async (req: Request, res: Response) => {
    const { range, from, to } = req.query as any;
    const data = await service.metrics({
      range: typeof range === 'string' ? range : '30d',
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
    res.status(200).json({ success: true, data });
  });
}

export default new DashboardController();
