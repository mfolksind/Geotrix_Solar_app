import OrderItemModel from '../models/orderItem.model';
import { IOrderItemDocument } from '../interfaces/order.interface';
import { ClientSession } from 'mongoose';

export class OrderItemRepository {
  public async createMany(items: Partial<IOrderItemDocument>[], session?: ClientSession) {
    return OrderItemModel.insertMany(items, { session });
  }

  public async findByOrder(orderId: string) {
    return OrderItemModel.find({ order: orderId }).exec();
  }
}
