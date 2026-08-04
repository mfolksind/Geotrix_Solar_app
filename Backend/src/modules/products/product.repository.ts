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

  public async findAll(query: any = {}) {
    const { page = 1, limit = 10, search, status, sort } = query;
    const filter: any = { isDeleted: false };
    
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (status) {
      filter.status = status;
    }

    let queryObj = ProductModel.find(filter);
    
    if (sort) {
      const [field, order] = sort.split(':');
      queryObj = queryObj.sort({ [field]: order === 'desc' ? -1 : 1 });
    } else {
      queryObj = queryObj.sort({ createdAt: -1 });
    }

    const skip = (page - 1) * limit;
    return queryObj.skip(skip).limit(limit).exec();
  }


  public async update(id: string, update: Partial<IProductDocument>) {
    return ProductModel.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  public async softDelete(id: string) {
    return ProductModel.findByIdAndUpdate(id, { isDeleted: true, status: 'INACTIVE' }, { new: true }).exec();
  }
}
