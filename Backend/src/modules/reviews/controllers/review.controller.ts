import { Request, Response } from 'express';
import asyncHandler from '../../../common/utils/asyncHandler';
import { ReviewService } from '../services/review.service';

type AuthRequest = Request & { user?: { id: string } };

export class ReviewController {
  constructor(private readonly service: ReviewService) {}

  public createReview = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId, rating, title, comment, images } = req.body as any;
    const userId = req.user?.id as string;
    const review = await this.service.createReview({ productId, userId, rating, title, comment, images });
    res.status(201).json({ success: true, data: review });
  });

  public getProductReviews = asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params as { productId: string };
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const sortKey = (req.query.sort as string) ?? 'newest';
    const rating = req.query.rating ? Number(req.query.rating) : undefined;

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      highest: { rating: -1 },
      lowest: { rating: 1 },
    };

    const sortOption = sortMap[sortKey] ?? ({ createdAt: -1 } as Record<string, 1 | -1>);
    const result = await this.service.getProductReviews(productId, page, limit, sortOption, rating);
    res.status(200).json({ success: true, data: result.data, meta: result.meta });
  });

  public getReview = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const review = await this.service.getReview(id);
    res.status(200).json({ success: true, data: review });
  });

  public updateReview = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const updates = req.body as any;
    const updated = await this.service.updateReview(id, updates);
    res.status(200).json({ success: true, data: updated });
  });

  public approveReview = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const { isApproved } = req.body as { isApproved: boolean };
    const updated = await this.service.approveReview(id, !!isApproved);
    res.status(200).json({ success: true, data: updated });
  });

  public deleteReview = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const deleted = await this.service.deleteReview(id);
    res.status(200).json({ success: true, data: deleted });
  });
}
