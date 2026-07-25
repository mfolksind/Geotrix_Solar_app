import UserModel from './user.model';
import { IUserDocument } from './user.interface';
import { UserQuery, UpdateProfilePayload, ChangeStatusPayload, CreateUserPayload } from './user.types';

export class UserRepository {
  public async findById(id: string): Promise<IUserDocument | null> {
    return UserModel.findById(id).exec();
  }

  public async findByEmail(email: string): Promise<IUserDocument | null> {
    return UserModel.findOne({ email }).exec();
  }

  public async findAll(filter: UserQuery = {}): Promise<IUserDocument[]> {
    return UserModel.find(filter).exec();
  }

  public async create(payload: CreateUserPayload): Promise<IUserDocument> {
    return UserModel.create(payload);
  }

  public async update(id: string, payload: Partial<UpdateProfilePayload>): Promise<IUserDocument | null> {
    return UserModel.findByIdAndUpdate(id, payload, { new: true }).exec();
  }

  public async delete(id: string): Promise<IUserDocument | null> {
    return UserModel.findByIdAndDelete(id).exec();
  }

  public async updateStatus(id: string, payload: ChangeStatusPayload): Promise<IUserDocument | null> {
    return UserModel.findByIdAndUpdate(id, { status: payload.status }, { new: true }).exec();
  }
}
