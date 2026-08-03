import GeotrixBillModel from '../models/geotrixBill.model';
import { IGeotrixBillDocument } from '../interfaces/geotrixBill.interface';
import { ClientSession } from 'mongoose';

interface FindAllOptions {
  page?: number;
  limit?: number;
  search?: string;
  project?: string;
  startDate?: Date;
  endDate?: Date;
  sort?: Record<string, 1 | -1>;
}

export class GeotrixBillRepository {
  public async create(payload: Partial<IGeotrixBillDocument>, session?: ClientSession) {
    return GeotrixBillModel.create([payload], { session }).then((docs) => docs[0]);
  }

  public async findById(id: string) {
    return GeotrixBillModel.findById(id).where({ isDeleted: false }).populate('submittedBy approvedBy').exec();
  }

  public async findByBillNumber(billNumber: string) {
    return GeotrixBillModel.findOne({ billNumber, isDeleted: false }).exec();
  }

  public async findAll(options: FindAllOptions = {}) {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.max(1, Math.min(100, options.limit ?? 20));
    const skip = (page - 1) * limit;

    const filters: Record<string, unknown> = { isDeleted: false };
    if (options.search) filters.billNumber = { $regex: options.search, $options: 'i' };
    if (options.project) filters.projectName = options.project;
    if (options.startDate || options.endDate) {
      filters.billDate = {} as any;
      if (options.startDate) (filters.billDate as any).$gte = options.startDate;
      if (options.endDate) (filters.billDate as any).$lte = options.endDate;
    }

    const query = GeotrixBillModel.find(filters).populate('submittedBy approvedBy').skip(skip).limit(limit);
    if (options.sort) query.sort(options.sort);

    const [items, total] = await Promise.all([query.exec(), GeotrixBillModel.countDocuments(filters).exec()]);
    return { items, total, page, limit };
  }

  public async update(id: string, updates: Partial<IGeotrixBillDocument>, session?: ClientSession) {
    return GeotrixBillModel.findByIdAndUpdate(id, { $set: updates }, { new: true, session }).exec();
  }

  public async softDelete(id: string, session?: ClientSession) {
    return GeotrixBillModel.findByIdAndUpdate(id, { $set: { isDeleted: true } }, { new: true, session }).exec();
  }
}
