import ProductModel from './product.model';
import { IProductDocument } from './product.interface';
import { Types } from 'mongoose';

export class ProductRepository {
  public async create(payload: Partial<IProductDocument>) {
    return ProductModel.create(payload as Partial<IProductDocument>);
  }

  public async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return ProductModel.findById(id).where({ isDeleted: false }).exec();
  }

  public async findBySlug(slug: string) {
    return ProductModel.findOne({ slug, isDeleted: false }).exec();
  }

  public async findAll(query: { search?: string; category?: string; status?: string; page?: number; limit?: number; sort?: any }) {
    const q: any = { isDeleted: false };
    if (query.status) q.status = query.status;
    if (query.category) q.category = query.category;
    if (query.search) q.$text = { $search: query.search };

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, query.limit ?? 20);
    const skip = (page - 1) * limit;

    let cursor = ProductModel.find(q).skip(skip).limit(limit);

    if (query.sort) cursor = cursor.sort(query.sort);
    return cursor.exec();
  }

  public async update(id: string, update: Partial<IProductDocument>) {
    return ProductModel.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  public async softDelete(id: string) {
    return ProductModel.findByIdAndUpdate(id, { isDeleted: true, status: 'INACTIVE' }, { new: true }).exec();
  }
}
