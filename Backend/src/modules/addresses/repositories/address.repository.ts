import AddressModel from '../models/address.model';
import { IAddressDocument } from '../interfaces/address.interface';
import { Types } from 'mongoose';

export interface AddressQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  addressType?: string;
  isDefault?: boolean | string;
  userId?: string;
  sort?: string;
}

export class AddressRepository {
  public async create(payload: Partial<IAddressDocument>) {
    return AddressModel.create(payload as Partial<IAddressDocument>);
  }

  public async getStats() {
    const [totalAddresses, homeAddresses, officeAddresses, otherAddresses, defaultAddresses, distinctUsers] =
      await Promise.all([
        AddressModel.countDocuments({ isDeleted: false }),
        AddressModel.countDocuments({ isDeleted: false, addressType: 'HOME' }),
        AddressModel.countDocuments({ isDeleted: false, addressType: 'OFFICE' }),
        AddressModel.countDocuments({ isDeleted: false, addressType: 'OTHER' }),
        AddressModel.countDocuments({ isDeleted: false, isDefault: true }),
        AddressModel.distinct('user', { isDeleted: false }).then((users) => users.length),
      ]);

    return {
      totalAddresses,
      homeAddresses,
      officeAddresses,
      otherAddresses,
      defaultAddresses,
      distinctUsers,
    };
  }

  public async findAll(options: AddressQueryOptions = {}) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(options.limit) || 20));
    const skip = (page - 1) * limit;

    const filters: Record<string, unknown> = { isDeleted: false };

    if (options.userId && Types.ObjectId.isValid(options.userId)) {
      filters.user = new Types.ObjectId(options.userId);
    }

    if (options.addressType && options.addressType !== 'ALL') {
      filters.addressType = options.addressType.toUpperCase();
    }

    if (options.isDefault !== undefined && options.isDefault !== 'ALL' && options.isDefault !== '') {
      filters.isDefault = options.isDefault === true || options.isDefault === 'true';
    }

    if (options.search && options.search.trim()) {
      const searchRegex = new RegExp(options.search.trim(), 'i');
      filters.$or = [
        { fullName: searchRegex },
        { phone: searchRegex },
        { city: searchRegex },
        { state: searchRegex },
        { postalCode: searchRegex },
        { addressLine1: searchRegex },
        { addressLine2: searchRegex },
        { landmark: searchRegex },
      ];
    }

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (options.sort === 'oldest') sortOption = { createdAt: 1 };
    else if (options.sort === 'city_asc') sortOption = { city: 1 };
    else if (options.sort === 'name_asc') sortOption = { fullName: 1 };
    else if (options.sort === 'name_desc') sortOption = { fullName: -1 };

    const query = AddressModel.find(filters)
      .populate('user', 'name email phone role')
      .skip(skip)
      .limit(limit)
      .sort(sortOption);

    const [items, total] = await Promise.all([query.exec(), AddressModel.countDocuments(filters).exec()]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  public async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return AddressModel.findById(id).where({ isDeleted: false }).populate('user', 'name email phone role').exec();
  }

  public async findOwnedById(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(userId)) return null;
    return AddressModel.findOne({ _id: id, user: new Types.ObjectId(userId), isDeleted: false }).exec();
  }

  public async findByUser(userId: string) {
    return AddressModel.find({ user: userId, isDeleted: false }).sort({ isDefault: -1, createdAt: -1 }).exec();
  }

  public async update(id: string, update: Partial<IAddressDocument>) {
    return AddressModel.findByIdAndUpdate(id, update, { new: true }).populate('user', 'name email phone role').exec();
  }

  public async updateOwned(id: string, update: Partial<IAddressDocument>, userId: string) {
    if (!Types.ObjectId.isValid(id)) return null;

    const address = await AddressModel.findOne({ _id: id, user: userId, isDeleted: false }).exec();
    if (!address) return null;

    return AddressModel.findByIdAndUpdate(id, update, { new: true }).populate('user', 'name email phone role').exec();
  }

  public async softDelete(id: string) {
    return AddressModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true }).exec();
  }

  public async softDeleteOwned(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) return null;

    const address = await AddressModel.findOne({ _id: id, user: userId, isDeleted: false }).exec();
    if (!address) return null;

    return AddressModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true }).exec();
  }

  public async unsetDefaultForUser(userId: string) {
    return AddressModel.updateMany({ user: userId, isDefault: true }, { isDefault: false }).exec();
  }
}
