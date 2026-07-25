import { Types } from 'mongoose';
import UserModel from '../users/user.model';
import { RefreshTokenModel, PasswordResetTokenModel, EmailVerificationTokenModel } from './auth.repository.models';
import { CreateUserPayload } from './auth.types';

export class AuthRepository {
  public async findByEmail(email: string) {
    return UserModel.findOne({ email }).select('+password').exec();
  }

  public async createUser(payload: CreateUserPayload) {
    return UserModel.create(payload);
  }

  public async saveRefreshToken(userId: string, token: string, expiresAt: Date) {
    return RefreshTokenModel.create({ user: new Types.ObjectId(userId), token, expiresAt });
  }

  public async findRefreshToken(token: string) {
    return RefreshTokenModel.findOne({ token }).exec();
  }

  public async deleteRefreshToken(token: string) {
    return RefreshTokenModel.deleteOne({ token }).exec();
  }

  public async savePasswordResetToken(userId: string, token: string, expiresAt: Date) {
    return PasswordResetTokenModel.create({ user: new Types.ObjectId(userId), token, expiresAt });
  }

  public async findPasswordResetToken(token: string) {
    return PasswordResetTokenModel.findOne({ token }).exec();
  }

  public async deletePasswordResetToken(token: string) {
    return PasswordResetTokenModel.deleteOne({ token }).exec();
  }

  public async saveEmailVerificationToken(userId: string, token: string, expiresAt: Date) {
    return EmailVerificationTokenModel.create({ user: new Types.ObjectId(userId), token, expiresAt });
  }

  public async findVerificationToken(token: string) {
    return EmailVerificationTokenModel.findOne({ token }).exec();
  }

  public async deleteEmailVerificationToken(token: string) {
    return EmailVerificationTokenModel.deleteOne({ token }).exec();
  }
}
