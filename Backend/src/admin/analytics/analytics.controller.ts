import { Request, Response } from 'express';
import asyncHandler from '../../common/utils/asyncHandler';
import { AnalyticsService } from './analytics.service';

const service = new AnalyticsService();

export class AnalyticsController {
  public sales = asyncHandler(async (req: Request, res: Response) => {
    const { from, to } = req.query as any;
    const data = await service.sales({ from: from ? new Date(from) : undefined, to: to ? new Date(to) : undefined });
    res.status(200).json({ success: true, data });
  });

  public orders = asyncHandler(async (req: Request, res: Response) => {
    const { from, to } = req.query as any;
    const data = await service.orders({ from: from ? new Date(from) : undefined, to: to ? new Date(to) : undefined });
    res.status(200).json({ success: true, data });
  });

  public products = asyncHandler(async (req: Request, res: Response) => {
    const data = await service.products();
    res.status(200).json({ success: true, data });
  });

  public users = asyncHandler(async (req: Request, res: Response) => {
    const data = await service.users();
    res.status(200).json({ success: true, data });
  });

  public revenue = asyncHandler(async (req: Request, res: Response) => {
    const { from, to } = req.query as any;
    const data = await service.revenue({ from: from ? new Date(from) : undefined, to: to ? new Date(to) : undefined });
    res.status(200).json({ success: true, data });
  });
}

export default new AnalyticsController();
