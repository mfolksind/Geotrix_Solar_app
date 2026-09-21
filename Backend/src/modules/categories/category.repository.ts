import { Types } from 'mongoose';
import CategoryModel from './category.model';
import { ICategoryDocument } from './category.interface';
import { CategoryQueryParams } from './category.types';

export class CategoryRepository {
  public async create(payload: Partial<ICategoryDocument>) {
    return CategoryModel.create(payload as Partial<ICategoryDocument>);
  }

  public async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return CategoryModel.findById(id).where({ isDeleted: false }).populate('family', 'name slug').exec();
  }

  public async findBySlug(slug: string) {
    return CategoryModel.findOne({ slug, isDeleted: false }).populate('family', 'name slug').exec();
  }

  public async findByName(name: string) {
    return CategoryModel.findOne({ name, isDeleted: false }).exec();
  }

  public async findAll(filter: CategoryQueryParams & { includeDeleted?: boolean } = {}) {
    const q: any = {};
    if (filter.status && filter.status !== 'ALL') q.status = filter.status.toUpperCase();
    if (filter.family && filter.family !== 'ALL') q.family = filter.family;
    if (!filter.includeDeleted) q.isDeleted = false;

    if (filter.search && filter.search.trim()) {
      const regex = new RegExp(filter.search.trim(), 'i');
      q.$or = [
        { name: { $regex: regex } },
        { slug: { $regex: regex } },
        { description: { $regex: regex } },
      ];
    }

    let sortOption: Record<string, 1 | -1> = { sortOrder: 1, name: 1 };
    if (filter.sort) {
      switch (filter.sort) {
        case 'name_asc':
          sortOption = { name: 1 };
          break;
        case 'name_desc':
          sortOption = { name: -1 };
          break;
        case 'newest':
          sortOption = { createdAt: -1 };
          break;
        case 'oldest':
          sortOption = { createdAt: 1 };
          break;
        case 'order_desc':
          sortOption = { sortOrder: -1, name: 1 };
          break;
        case 'order_asc':
        default:
          sortOption = { sortOrder: 1, name: 1 };
          break;
      }
    }

    const page = Math.max(1, parseInt(String(filter.page || 1), 10) || 1);
    const hasLimit = filter.limit !== undefined && filter.limit !== '0' && filter.limit !== 0;
    const limit = hasLimit ? Math.max(1, parseInt(String(filter.limit), 10) || 50) : 0;

    let query = CategoryModel.find(q).populate('family', 'name slug').sort(sortOption);
    if (limit > 0) {
      query = query.skip((page - 1) * limit).limit(limit);
    }

    const [categories, total] = await Promise.all([
      query.lean(),
      CategoryModel.countDocuments(q),
    ]);

    return {
      categories,
      pagination: {
        total,
        page,
        limit: limit || total,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 1,
      },
    };
  }

  public async update(id: string, update: Partial<ICategoryDocument>) {
    return CategoryModel.findByIdAndUpdate(id, update, { new: true }).populate('family', 'name slug').exec();
  }

  public async updateStatus(id: string, status: string) {
    return CategoryModel.findByIdAndUpdate(id, { status }, { new: true }).populate('family', 'name slug').exec();
  }

  public async softDelete(id: string) {
    return CategoryModel.findByIdAndUpdate(id, { isDeleted: true, status: 'INACTIVE' }, { new: true }).exec();
  }
}

