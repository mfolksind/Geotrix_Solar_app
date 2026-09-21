import { Types } from 'mongoose';
import UserModel from '../users/user.model';
import { RefreshTokenModel, PasswordResetTokenModel, EmailVerificationTokenModel } from './auth.repository.models';
import { CreateUserPayload } from './auth.types';

export class AuthRepository {
  public async findByEmail(email: string) {
    return UserModel.findOne({ email: email.toLowerCase() }).select('+password').exec();
  }

  public async findById(id: string) {
    return UserModel.findById(id).select('+password').exec();
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

  public async savePasswordResetOtp(userId: string, email: string, token: string, otpHash: string, expiresAt: Date) {
    // Delete any existing reset records for this user
    await PasswordResetTokenModel.deleteMany({ user: new Types.ObjectId(userId) }).exec();
    return PasswordResetTokenModel.create({
      user: new Types.ObjectId(userId),
      email: email.toLowerCase(),
      token,
      otp: otpHash,
      isVerified: false,
      expiresAt,
    });
  }

  public async savePasswordResetToken(userId: string, token: string, expiresAt: Date) {
    return PasswordResetTokenModel.create({ user: new Types.ObjectId(userId), token, expiresAt });
  }

  public async findPasswordResetRecord(tokenOrOtp: string) {
    return PasswordResetTokenModel.findOne({
      $or: [{ token: tokenOrOtp }, { otp: tokenOrOtp }],
    }).exec();
  }

  public async findPasswordResetByEmail(email: string) {
    return PasswordResetTokenModel.findOne({ email: email.toLowerCase() }).sort({ createdAt: -1 }).exec();
  }

  public async markResetVerified(recordId: string) {
    return PasswordResetTokenModel.findByIdAndUpdate(recordId, { isVerified: true }, { new: true }).exec();
  }

  public async findPasswordResetToken(token: string) {
    return PasswordResetTokenModel.findOne({ token }).exec();
  }

  public async deletePasswordResetToken(token: string) {
    return PasswordResetTokenModel.deleteOne({ token }).exec();
  }

  public async deletePasswordResetByUser(userId: string) {
    return PasswordResetTokenModel.deleteMany({ user: new Types.ObjectId(userId) }).exec();
  }

  public async saveEmailVerificationToken(userId: string, token: string, expiresAt: Date, otp?: string) {
    await EmailVerificationTokenModel.deleteMany({ user: new Types.ObjectId(userId) }).exec();
    return EmailVerificationTokenModel.create({ user: new Types.ObjectId(userId), token, otp, expiresAt });
  }

  public async findVerificationToken(token: string) {
    return EmailVerificationTokenModel.findOne({
      $or: [{ token }, { otp: token }],
    }).exec();
  }

  public async deleteEmailVerificationToken(token: string) {
    return EmailVerificationTokenModel.deleteOne({ token }).exec();
  }
}
