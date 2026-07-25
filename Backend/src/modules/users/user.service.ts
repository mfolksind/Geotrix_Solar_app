import { UserRepository } from './user.repository';
import { IUserDocument } from './user.interface';
import { UpdateProfilePayload, ChangeStatusPayload, UserQuery } from './user.types';

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  public async getProfile(userId: string): Promise<IUserDocument | null> {
    return this.userRepository.findById(userId);
  }

  public async updateProfile(userId: string, payload: UpdateProfilePayload): Promise<IUserDocument | null> {
    return this.userRepository.update(userId, payload);
  }

  public async getUserById(userId: string): Promise<IUserDocument | null> {
    return this.userRepository.findById(userId);
  }

  public async getAllUsers(filter: UserQuery = {}): Promise<IUserDocument[]> {
    return this.userRepository.findAll(filter);
  }

  public async deleteUser(userId: string): Promise<IUserDocument | null> {
    return this.userRepository.delete(userId);
  }

  public async changeUserStatus(userId: string, payload: ChangeStatusPayload): Promise<IUserDocument | null> {
    return this.userRepository.updateStatus(userId, payload);
  }
}
