import ProductVariantModel from './productVariant.model';
import { IProductVariantDocument } from './product.interface';
import { Types } from 'mongoose';

export class ProductVariantRepository {
  public async create(payload: Partial<IProductVariantDocument>) {
    return ProductVariantModel.create(payload as Partial<IProductVariantDocument>);
  }

  public async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return ProductVariantModel.findById(id).exec();
  }

  public async findBySku(sku: string) {
    return ProductVariantModel.findOne({ sku }).exec();
  }

  public async findByProduct(productId: string) {
    return ProductVariantModel.find({ product: productId }).exec();
  }

  public async update(id: string, update: Partial<IProductVariantDocument>) {
    return ProductVariantModel.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  public async delete(id: string) {
    return ProductVariantModel.findByIdAndDelete(id).exec();
  }
}
