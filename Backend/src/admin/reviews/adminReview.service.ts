import { ReviewRepository } from '../../modules/reviews/repositories/review.repository';
import { ReviewService } from '../../modules/reviews/services/review.service';

export class AdminReviewService {
  private repo = new ReviewRepository();
  private service = new ReviewService(this.repo);

  public async list(productId: string, page = 1, limit = 10, sort: Record<string, 1 | -1> = { createdAt: -1 }, rating?: number) {
    return this.service.getProductReviews(productId, page, limit, sort, rating);
  }

  public async approve(id: string, isApproved: boolean) {
    return this.service.approveReview(id, isApproved);
  }

  public async delete(id: string) {
    return this.service.deleteReview(id);
  }
}
