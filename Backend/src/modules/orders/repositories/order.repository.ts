import OrderModel from '../models/order.model';
import { IOrderDocument } from '../interfaces/order.interface';
import { ClientSession, Types } from 'mongoose';

export class OrderRepository {
  public async create(payload: Partial<IOrderDocument>, session?: ClientSession) {
    return OrderModel.create([payload], { session }).then((docs) => docs[0]);
  }

  public async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return OrderModel.findById(id).exec();
  }

  public async findByOrderNumber(orderNumber: string) {
    return OrderModel.findOne({ orderNumber }).exec();
  }

  public async findAll(options: { page?: number, limit?: number } = {}) {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.max(1, Math.min(100, options.limit ?? 20));
    const skip = (page - 1) * limit;

    const query = OrderModel.find().populate('user', 'name firstName lastName email').skip(skip).limit(limit).sort({ createdAt: -1 });
    const [items, total] = await Promise.all([query.exec(), OrderModel.countDocuments().exec()]);
    
    return { items, total, page, limit };
  }

  public async findByUser(userId: string) {
    return OrderModel.find({ user: userId }).sort({ createdAt: -1 }).exec();
  }

  public async updateStatus(id: string, status: string, session?: ClientSession) {
    return OrderModel.findByIdAndUpdate(id, { status }, { new: true, session }).exec();
  }
}
