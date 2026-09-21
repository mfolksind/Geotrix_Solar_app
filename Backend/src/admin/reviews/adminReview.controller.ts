import { Request, Response } from 'express';
import asyncHandler from '../../common/utils/asyncHandler';
import { AdminReviewService } from './adminReview.service';

type AuthRequest = Request & { user?: { id: string; role?: string } };

const service = new AdminReviewService();

export class AdminReviewController {
  public getStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const stats = await service.getStats();
    res.status(200).json({ success: true, data: stats });
  });

  public list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await service.list(req.query as Record<string, unknown>);
    res.status(200).json({ success: true, data: result });
  });

  public get = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const review = await service.get(id);
    res.status(200).json({ success: true, data: review });
  });

  public approve = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const { isApproved } = req.body as { isApproved: boolean };
    const updated = await service.approve(id, Boolean(isApproved));
    res.status(200).json({ success: true, data: updated });
  });

  public delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const deleted = await service.delete(id);
    res.status(200).json({ success: true, data: deleted });
  });
}

export default new AdminReviewController();
