import CartModel from '../models/cart.model';
import { ICartDocument } from '../interfaces/cart.interface';

export class CartRepository {
  public async create(userId: string) {
    return CartModel.create({ user: userId });
  }

  public async findById(cartId: string) {
    return CartModel.findById(cartId).exec();
  }

  public async findByUser(userId: string) {
    return CartModel.findOne({ user: userId }).exec();
  }

  public async updateTotals(cartId: string, totals: Partial<ICartDocument>) {
    return CartModel.findByIdAndUpdate(cartId, { $set: totals }, { new: true }).exec();
  }

  public async clearCart(cartId: string) {
    return CartModel.findByIdAndUpdate(
      cartId,
      {
        totalItems: 0,
        totalQuantity: 0,
        subtotal: 0,
        taxAmount: 0,
        cgst: 0,
        sgst: 0,
        discountAmount: 0,
        totalAmount: 0,
      },
      { new: true }
    ).exec();
  }
}
