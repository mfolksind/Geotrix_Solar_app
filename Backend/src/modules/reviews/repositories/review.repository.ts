import ReviewModel from '../models/review.model';
import { IReviewDocument } from '../interfaces/review.interface';
import { ClientSession } from 'mongoose';

export class ReviewRepository {
  public async create(payload: Partial<IReviewDocument>, session?: ClientSession) {
    return ReviewModel.create([payload], { session }).then((docs) => docs[0]);
  }

  public async findById(id: string) {
    return ReviewModel.findById(id).exec();
  }

  public async findByProduct(productId: string, filter: Record<string, unknown> = {}, skip = 0, limit = 10, sort: Record<string, 1 | -1> = { createdAt: -1 }) {
    const q = { product: productId, isDeleted: false, ...filter };
    return ReviewModel.find(q).sort(sort as any).skip(skip).limit(limit).populate('user', 'name avatar').exec();
  }

  public async findByUser(userId: string) {
    return ReviewModel.find({ user: userId, isDeleted: false }).sort({ createdAt: -1 }).exec();
  }

  public async update(id: string, updates: Partial<IReviewDocument>, session?: ClientSession) {
    return ReviewModel.findByIdAndUpdate(id, { $set: updates }, { new: true, session }).exec();
  }

  public async softDelete(id: string, session?: ClientSession) {
    return ReviewModel.findByIdAndUpdate(id, { $set: { isDeleted: true } }, { new: true, session }).exec();
  }

  public async updateApproval(id: string, isApproved: boolean, session?: ClientSession) {
    return ReviewModel.findByIdAndUpdate(id, { $set: { isApproved } }, { new: true, session }).exec();
  }
}
