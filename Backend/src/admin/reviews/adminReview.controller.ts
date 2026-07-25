import { Request, Response } from 'express';
import asyncHandler from '../../common/utils/asyncHandler';
import { AdminReviewService } from './adminReview.service';

const service = new AdminReviewService();

export class AdminReviewController {
  public list = asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.query as any;
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const sort = req.query.sort ? JSON.parse(req.query.sort as string) : { createdAt: -1 };
    const rating = req.query.rating ? Number(req.query.rating) : undefined;
    const result = await service.list(productId, page, limit, sort, rating);
    res.status(200).json({ success: true, data: result });
  });

  public approve = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { isApproved } = req.body as { isApproved: boolean };
    const updated = await service.approve(id, !!isApproved);
    res.status(200).json({ success: true, data: updated });
  });

  public delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const deleted = await service.delete(id);
    res.status(200).json({ success: true, data: deleted });
  });
}

export default new AdminReviewController();
