import mongoose from 'mongoose';
import { ReviewRepository } from '../repositories/review.repository';
import ReviewModel from '../models/review.model';
import OrderModel from '../../orders/models/order.model';
import ProductModel from '../../products/product.model';
import { IReviewDocument } from '../interfaces/review.interface';
import { CreateReviewPayload, UpdateReviewPayload } from '../types/review.types';
import { ApiError } from '../../../common/errors/ApiError';

export class ReviewService {
  constructor(private readonly repo: ReviewRepository) {}

  private async hasUserPurchasedProduct(userId: string, productId: string) {
    const order = await OrderModel.findOne({ user: userId, status: 'DELIVERED', 'items.product': productId }).exec();
    return !!order;
  }

  public async createReview(payload: CreateReviewPayload) {
    const { userId, productId, rating, title, comment, images } = payload;

    // verify purchase
    const purchased = await this.hasUserPurchasedProduct(userId, productId);
    if (!purchased) throw new ApiError(400, 'User must have a delivered order containing the product to review');

    // prevent duplicate
    const existing = await ReviewModel.findOne({ user: userId, product: productId }).exec();
    if (existing) throw new ApiError(400, 'User already submitted a review for this product');

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const reviewPayload: Partial<IReviewDocument> = {
        product: productId,
        user: userId,
        rating,
        title,
        comment,
        images: images ?? [],
        isVerifiedPurchase: true,
        isApproved: true,
        isDeleted: false,
      };

      const review = await this.repo.create(reviewPayload, session);

      await this.calculateAverageRating(productId, session);

      await session.commitTransaction();
      session.endSession();
      return review;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw ApiError.fromUnknown(err);
    }
  }

  public async updateReview(id: string, updates: UpdateReviewPayload) {
    const review = await this.repo.findById(id);
    if (!review) throw new ApiError(404, 'Review not found');
    if (review.isDeleted) throw new ApiError(400, 'Cannot modify a deleted review');

    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const updated = await this.repo.update(id, updates as Partial<IReviewDocument>, session);

      if (updates.rating !== undefined) await this.calculateAverageRating(review.product.toString(), session);

      await session.commitTransaction();
      session.endSession();
      return updated;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw ApiError.fromUnknown(err);
    }
  }

  public async deleteReview(id: string) {
    const review = await this.repo.findById(id);
    if (!review) throw new ApiError(404, 'Review not found');
    if (review.isDeleted) return review;

    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const deleted = await this.repo.softDelete(id, session);
      await this.calculateAverageRating(review.product.toString(), session);
      await session.commitTransaction();
      session.endSession();
      return deleted;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw ApiError.fromUnknown(err);
    }
  }

  public async getReview(id: string) {
    return this.repo.findById(id);
  }

  public async getProductReviews(productId: string, page = 1, limit = 10, sort: Record<string, 1 | -1> = { createdAt: -1 }, rating?: number) {
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};
    if (rating) filter.rating = rating;
    const reviews = await this.repo.findByProduct(productId, filter, skip, limit, sort);
    const total = await ReviewModel.countDocuments({ product: productId, isDeleted: false, ...(rating ? { rating } : {}) }).exec();
    return { data: reviews, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  public async approveReview(id: string, isApproved: boolean) {
    const review = await this.repo.findById(id);
    if (!review) throw new ApiError(404, 'Review not found');

    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const updated = await this.repo.updateApproval(id, isApproved, session);
      await this.calculateAverageRating(review.product.toString(), session);
      await session.commitTransaction();
      session.endSession();
      return updated;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw ApiError.fromUnknown(err);
    }
  }

  public async calculateAverageRating(productId: string, session?: mongoose.ClientSession) {
    const result = await ReviewModel.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId), isDeleted: false, isApproved: true } },
      { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ])
      .exec();

    const avg = result[0]?.avgRating ?? 0;
    const count = result[0]?.count ?? 0;

    await ProductModel.findByIdAndUpdate(productId, { $set: { averageRating: avg, totalReviews: count } }, { session }).exec();
    return { averageRating: avg, totalReviews: count };
  }
}
