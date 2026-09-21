import ReviewModel from '../../modules/reviews/models/review.model';
import ProductModel from '../../modules/products/product.model';
import UserModel from '../../modules/users/user.model';
import { Types } from 'mongoose';

export interface AdminReviewQuery {
  page?: number | string;
  limit?: number | string;
  search?: string;
  status?: string;
  rating?: number | string;
  isVerifiedPurchase?: string;
  sort?: string;
}

export class AdminReviewService {
  public async getStats() {
    const [
      totalReviews,
      approvedReviews,
      pendingReviews,
      verifiedPurchases,
      ratingAvgResult,
    ] = await Promise.all([
      ReviewModel.countDocuments({ isDeleted: false }),
      ReviewModel.countDocuments({ isDeleted: false, isApproved: true }),
      ReviewModel.countDocuments({ isDeleted: false, isApproved: false }),
      ReviewModel.countDocuments({ isDeleted: false, isVerifiedPurchase: true }),
      ReviewModel.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } },
      ]),
    ]);

    const avgRating = ratingAvgResult?.[0]?.avgRating
      ? Math.round(ratingAvgResult[0].avgRating * 10) / 10
      : 0;

    return {
      totalReviews,
      approvedReviews,
      pendingReviews,
      verifiedPurchases,
      avgRating,
    };
  }

  public async list(query: AdminReviewQuery = {}) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { isDeleted: false };

    if (query.status === 'APPROVED') {
      filter.isApproved = true;
    } else if (query.status === 'PENDING') {
      filter.isApproved = false;
    }

    if (query.rating && query.rating !== 'ALL') {
      filter.rating = Number(query.rating);
    }

    if (query.isVerifiedPurchase && query.isVerifiedPurchase !== 'ALL') {
      filter.isVerifiedPurchase = query.isVerifiedPurchase === 'true';
    }

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');

      const [matchingUsers, matchingProducts] = await Promise.all([
        UserModel.find({
          $or: [
            { name: { $regex: searchRegex } },
            { email: { $regex: searchRegex } },
          ],
        }).select('_id').lean(),
        ProductModel.find({
          name: { $regex: searchRegex },
        }).select('_id').lean(),
      ]);

      const userIds = matchingUsers.map((u) => u._id);
      const productIds = matchingProducts.map((p) => p._id);

      filter.$or = [
        { comment: { $regex: searchRegex } },
        { title: { $regex: searchRegex } },
        { user: { $in: userIds } },
        { product: { $in: productIds } },
      ];
    }

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (query.sort === 'oldest') sortOption = { createdAt: 1 };
    else if (query.sort === 'rating_desc') sortOption = { rating: -1 };
    else if (query.sort === 'rating_asc') sortOption = { rating: 1 };

    const reviewsQuery = ReviewModel.find(filter)
      .populate('user', 'name email phone role profilePicture')
      .populate('product', 'name slug images price')
      .skip(skip)
      .limit(limit)
      .sort(sortOption);

    const [items, total] = await Promise.all([
      reviewsQuery.exec(),
      ReviewModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  public async get(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new Error('Invalid review ID');
    return ReviewModel.findById(id)
      .populate('user', 'name email phone role profilePicture')
      .populate('product', 'name slug images price')
      .exec();
  }

  public async approve(id: string, isApproved: boolean) {
    if (!Types.ObjectId.isValid(id)) throw new Error('Invalid review ID');
    return ReviewModel.findByIdAndUpdate(id, { isApproved }, { new: true })
      .populate('user', 'name email')
      .populate('product', 'name')
      .exec();
  }

  public async delete(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new Error('Invalid review ID');
    return ReviewModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true }).exec();
  }
}
