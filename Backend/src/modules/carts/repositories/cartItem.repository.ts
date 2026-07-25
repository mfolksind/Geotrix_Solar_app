import CartItemModel from '../models/cartItem.model';
import { ICartItemDocument } from '../interfaces/cart.interface';
import { Types } from 'mongoose';

export class CartItemRepository {
  public async create(payload: Partial<ICartItemDocument>) {
    return CartItemModel.create(payload as Partial<ICartItemDocument>);
  }

  public async update(id: string, update: Partial<ICartItemDocument>) {
    return CartItemModel.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  public async delete(id: string) {
    return CartItemModel.findByIdAndDelete(id).exec();
  }

  public async findByCart(cartId: string) {
    return CartItemModel.find({ cart: cartId }).populate('product').populate('variant').exec();
  }

  public async findByVariant(cartId: string, variantId: string) {
    return CartItemModel.findOne({ cart: cartId, variant: variantId }).exec();
  }

  public async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return CartItemModel.findById(id).populate('product').populate('variant').exec();
  }
}
