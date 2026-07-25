import CartModel from '../models/cart.model';
import { ICartDocument } from '../interfaces/cart.interface';

export class CartRepository {
  public async create(userId: string) {
    return CartModel.create({ user: userId });
  }

  public async findByUser(userId: string) {
    return CartModel.findOne({ user: userId }).exec();
  }

  public async updateTotals(cartId: string, totals: { totalItems: number; totalQuantity: number; totalAmount: number }) {
    return CartModel.findByIdAndUpdate(cartId, { $set: totals }, { new: true }).exec();
  }

  public async clearCart(cartId: string) {
    return CartModel.findByIdAndUpdate(cartId, { totalItems: 0, totalQuantity: 0, totalAmount: 0 }, { new: true }).exec();
  }
}
