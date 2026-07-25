import AddressModel from '../models/address.model';
import { IAddressDocument } from '../interfaces/address.interface';
import { Types } from 'mongoose';

export class AddressRepository {
  public async create(payload: Partial<IAddressDocument>) {
    return AddressModel.create(payload as Partial<IAddressDocument>);
  }

  public async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return AddressModel.findById(id).where({ isDeleted: false }).exec();
  }

  public async findOwnedById(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(userId)) return null;
    return AddressModel.findOne({ _id: id, user: new Types.ObjectId(userId), isDeleted: false }).exec();
  }

  public async findByUser(userId: string) {
    return AddressModel.find({ user: userId, isDeleted: false }).sort({ isDefault: -1, createdAt: -1 }).exec();
  }

  public async update(id: string, update: Partial<IAddressDocument>) {
    return AddressModel.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  public async updateOwned(id: string, update: Partial<IAddressDocument>, userId: string) {
    if (!Types.ObjectId.isValid(id)) return null;

    const address = await AddressModel.findOne({ _id: id, user: userId, isDeleted: false }).exec();
    if (!address) return null;

    return AddressModel.findByIdAndUpdate(id, update, { new: true }).exec();
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
