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

  public async findByUser(userId: string) {
    return OrderModel.find({ user: userId }).sort({ createdAt: -1 }).exec();
  }

  public async updateStatus(id: string, status: string, session?: ClientSession) {
    return OrderModel.findByIdAndUpdate(id, { status }, { new: true, session }).exec();
  }
}
