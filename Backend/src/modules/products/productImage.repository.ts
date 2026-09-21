import ProductImageModel from './productImage.model';
import { IProductImageDocument } from './product.interface';
import { Types } from 'mongoose';

export class ProductImageRepository {
  public async create(payload: Partial<IProductImageDocument>) {
    return ProductImageModel.create(payload as Partial<IProductImageDocument>);
  }

  public async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return ProductImageModel.findById(id).exec();
  }

  public async findByVariant(variantId: string) {
    return ProductImageModel.find({ variant: variantId }).sort({ sortOrder: 1 }).exec();
  }

  public async setPrimaryImage(variantId: string, imageId: string) {
    await ProductImageModel.updateMany({ variant: variantId, _id: { $ne: imageId } }, { $set: { isPrimary: false } }).exec();
    return ProductImageModel.findByIdAndUpdate(imageId, { $set: { isPrimary: true } }, { new: true }).exec();
  }

  public async delete(id: string) {
    return ProductImageModel.findByIdAndDelete(id).exec();
  }
}
