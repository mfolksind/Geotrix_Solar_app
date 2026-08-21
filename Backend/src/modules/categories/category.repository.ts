import { Types } from 'mongoose';
import CategoryModel from './category.model';
import { ICategoryDocument } from './category.interface';

export class CategoryRepository {
  public async create(payload: Partial<ICategoryDocument>) {
    return CategoryModel.create(payload as Partial<ICategoryDocument>);
  }

  public async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return CategoryModel.findById(id).where({ isDeleted: false }).exec();
  }

  public async findBySlug(slug: string) {
    return CategoryModel.findOne({ slug, isDeleted: false }).exec();
  }

  public async findByName(name: string) {
    return CategoryModel.findOne({ name, isDeleted: false }).exec();
  }

  public async findAll(filter: { status?: string; includeDeleted?: boolean; family?: string } = {}) {
    const q: any = {};
    if (filter.status) q.status = filter.status;
    if (filter.family) q.family = filter.family;
    if (!filter.includeDeleted) q.isDeleted = false;

    return CategoryModel.find(q).sort({ sortOrder: 1, name: 1 }).exec();
  }

  public async update(id: string, update: Partial<ICategoryDocument>) {
    return CategoryModel.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  public async updateStatus(id: string, status: string) {
    return CategoryModel.findByIdAndUpdate(id, { status }, { new: true }).exec();
  }

  public async softDelete(id: string) {
    return CategoryModel.findByIdAndUpdate(id, { isDeleted: true, status: 'INACTIVE' }, { new: true }).exec();
  }
}
