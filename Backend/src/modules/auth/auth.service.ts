import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { AuthRepository } from './auth.repository';
import {
  AuthTokens,
  CreateUserPayload,
  ForgotPasswordPayload,
  VerifyOtpPayload,
  GoogleLoginPayload,
  LoginPayload,
  RegisterPayload,
  RegisterAdminPayload,
  ResetPasswordPayload,
  VerifyEmailPayload,
} from './auth.types';
import { generateAccessToken, generateRefreshToken, hashToken, verifyGoogleIdToken } from './auth.utils';
import { sendEmail } from '../../common/services/email/email.service';
import UserModel from '../users/user.model';
import FamilyModel from '../families/family.model';
import { ApiError } from '../../common/errors/ApiError';

const REFRESH_TOKEN_EXPIRES_IN_MS = Number(process.env.JWT_REFRESH_COOKIE_MAX_AGE ?? 7 * 24 * 60 * 60 * 1000);
const OTP_EXPIRES_IN_MS = 10 * 60 * 1000; // 10 minutes
const EMAIL_VERIFY_TOKEN_EXPIRES_IN_MS = Number(process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN_MS ?? 24 * 60 * 60 * 1000);

export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  public async register(payload: RegisterPayload, origin: string): Promise<{ user: unknown; tokens?: AuthTokens; message?: string }> {
    const existingUser = await this.authRepository.findByEmail(payload.email);
    if (existingUser) {
      throw new ApiError(400, 'Email is already registered');
    }

    let familyApprovalStatus: 'pending' | 'approved' | 'rejected' | null = null;
    let initialStatus: 'active' | 'inactive' | 'blocked' = 'active';
    let familyId = payload.family;

    if (!familyId && payload.familySlug) {
      const familyBySlug = await FamilyModel.findOne({ slug: payload.familySlug });
      if (familyBySlug) {
        familyId = familyBySlug._id.toString();
      }
    }

    if (!familyId) {
      const geotrixFamily = await FamilyModel.findOne({ slug: 'geotrix' });
      if (geotrixFamily) {
        familyId = geotrixFamily._id.toString();
      }
    }

    if (familyId) {
      const family = await FamilyModel.findById(familyId);
      if (family) {
        if (payload.source === 'website') {
          familyApprovalStatus = 'approved';
          initialStatus = 'active';
        } else if (family.requiresAdminApproval) {
          familyApprovalStatus = 'pending';
          initialStatus = 'inactive';
        } else {
          familyApprovalStatus = 'approved';
          initialStatus = 'active';
        }
      }
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);
    const userPayload: CreateUserPayload = {
      name: payload.name,
      email: payload.email,
      password: passwordHash,
      phone: payload.phone,
      family: familyId,
      familyApprovalStatus,
      provider: 'local',
      role: 'customer',
      isVerified: true,
      status: initialStatus,
    };

    const user = await this.authRepository.createUser(userPayload);

    if (payload.source === 'app' && familyApprovalStatus === 'pending') {
      return { user, message: 'Registration pending admin approval.' };
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    const refreshTokenHash = hashToken(refreshToken);
    await this.authRepository.saveRefreshToken(user.id, refreshTokenHash, new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS));

    return { user, tokens: { accessToken, refreshToken } };
  }

  public async registerAdmin(payload: RegisterAdminPayload, origin: string): Promise<{ user: unknown; tokens: AuthTokens }> {
    const adminKey = process.env.ADMIN_REGISTRATION_KEY;
    if (!adminKey) {
      throw new ApiError(500, 'Admin registration is not configured');
    }

    if (payload.adminKey !== adminKey) {
      throw new ApiError(403, 'Invalid admin registration key');
    }

    const existingUser = await this.authRepository.findByEmail(payload.email);
    if (existingUser) {
      throw new ApiError(400, 'Email is already registered');
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);
    const userPayload: CreateUserPayload = {
      name: payload.name,
      email: payload.email,
      password: passwordHash,
      phone: payload.phone,
      provider: 'local',
      role: 'admin',
      isVerified: true,
      status: 'active',
    };

    const user = await this.authRepository.createUser(userPayload);

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    const refreshTokenHash = hashToken(refreshToken);
    await this.authRepository.saveRefreshToken(user.id, refreshTokenHash, new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS));

    return { user, tokens: { accessToken, refreshToken } };
  }

  public async login(payload: LoginPayload): Promise<{ user: unknown; tokens: AuthTokens }> {
    const user = await this.authRepository.findByEmail(payload.email);
    if (!user || !user.password) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(payload.password, user.password);
    if (!passwordMatches) {
      throw new ApiError(401, 'Invalid email or password');
    }

    if (user.status !== 'active') {
      throw new ApiError(403, 'Account is not active');
    }

    if (payload.adminOnly) {
      const adminRoles = ['admin', 'super_admin', 'manager'];
      if (!adminRoles.includes((user.role || '').toLowerCase())) {
        throw new ApiError(403, 'Access denied: Administrator privileges required.');
      }
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    const refreshTokenHash = hashToken(refreshToken);

    await this.authRepository.saveRefreshToken(user.id, refreshTokenHash, new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS));

    return { user, tokens: { accessToken, refreshToken } };
  }

  public async adminLogin(payload: LoginPayload): Promise<{ user: unknown; tokens: AuthTokens }> {
    return this.login({ ...payload, adminOnly: true });
  }

  public async googleLogin(payload: GoogleLoginPayload): Promise<{ user: unknown; tokens?: AuthTokens; message?: string }> {
    const decoded = await verifyGoogleIdToken(payload.idToken);
    const email = decoded.email;
    const googleId = decoded.sub;
    const name = decoded.name ?? email?.split('@')[0] ?? 'Google User';

    if (!email || !googleId) {
      throw new ApiError(400, 'Invalid Google token');
    }

    let user = await this.authRepository.findByEmail(email);
    if (!user) {
      let familyId: string | undefined = payload.family;
      let familyApprovalStatus: 'pending' | 'approved' | 'rejected' | null = null;
      let initialStatus: 'active' | 'inactive' | 'blocked' = 'active';

      if (!familyId && payload.familySlug) {
        const familyBySlug = await FamilyModel.findOne({ slug: payload.familySlug });
        if (familyBySlug) {
          familyId = familyBySlug._id.toString();
        }
      }

      if (!familyId) {
        const geotrixFamily = await FamilyModel.findOne({ slug: 'geotrix' });
        if (geotrixFamily) {
          familyId = geotrixFamily._id.toString();
        }
      }

      if (familyId) {
        const family = await FamilyModel.findById(familyId);
        if (family) {
          if (payload.source === 'website') {
            familyApprovalStatus = 'approved';
            initialStatus = 'active';
          } else if (family.requiresAdminApproval) {
            familyApprovalStatus = 'pending';
            initialStatus = 'inactive';
          } else {
            familyApprovalStatus = 'approved';
          }
        }
      }

      const userPayload: CreateUserPayload = {
        name,
        email,
        provider: 'google',
        providerId: googleId,
        role: 'customer',
        family: familyId,
        familyApprovalStatus,
        isVerified: true,
        status: initialStatus,
      };
      user = await this.authRepository.createUser(userPayload);
    }

    if (payload.source === 'app' && user.familyApprovalStatus === 'pending') {
      return { user, message: 'Registration pending admin approval.' };
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    const refreshTokenHash = hashToken(refreshToken);
    await this.authRepository.saveRefreshToken(user.id, refreshTokenHash, new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS));

    return { user, tokens: { accessToken, refreshToken } };
  }

  public async refreshToken(token: string): Promise<AuthTokens> {
    const tokenHash = hashToken(token);
    const existingToken = await this.authRepository.findRefreshToken(tokenHash);
    if (!existingToken || existingToken.expiresAt < new Date()) {
      throw new ApiError(401, 'Refresh token is invalid or expired');
    }

    const accessToken = generateAccessToken(existingToken.user.toString());
    const newRefreshToken = generateRefreshToken(existingToken.user.toString());
    const newRefreshTokenHash = hashToken(newRefreshToken);

    await this.authRepository.deleteRefreshToken(tokenHash);
    await this.authRepository.saveRefreshToken(existingToken.user.toString(), newRefreshTokenHash, new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS));

    return { accessToken, refreshToken: newRefreshToken };
  }

  public async logout(token: string): Promise<void> {
    const tokenHash = hashToken(token);
    await this.authRepository.deleteRefreshToken(tokenHash);
  }

  // =========================================================================
  // EMAIL OTP FORGOT PASSWORD FLOW
  // =========================================================================

  public async forgotPassword(payload: ForgotPasswordPayload, origin?: string): Promise<{ success: boolean; message: string; email: string }> {
    const user = await this.authRepository.findByEmail(payload.email);
    if (!user) {
      throw new ApiError(404, 'No account registered with this email address');
    }

    // Generate secure 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + OTP_EXPIRES_IN_MS);

    // Save OTP to DB
    await this.authRepository.savePasswordResetOtp(user.id, user.email, token, otp, expiresAt);

    // Send email with OTP code
    try {
      await sendEmail({
        to: user.email,
        subject: 'Mfolks - Password Reset Verification Code',
        text: `Your password reset verification code is: ${otp}. This code is valid for 10 minutes.`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #0f172a; margin: 0 0 8px 0; font-size: 22px; font-weight: 700;">Password Reset Request</h2>
              <p style="color: #64748b; font-size: 14px; margin: 0;">Use the 6-digit verification code below to securely reset your password.</p>
            </div>
            <div style="background: #f8fafc; border: 1px dashed #57c5cc; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
              <p style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0; font-weight: 600;">Your Verification OTP</p>
              <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #57c5cc; font-family: monospace;">${otp}</div>
              <p style="color: #94a3b8; font-size: 12px; margin: 12px 0 0 0;">⏱ Valid for the next <b>10 minutes</b>.</p>
            </div>
            <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0 0 16px 0;">
              If you didn't request this code, you can safely ignore this email. Someone may have typed your email address by mistake.
            </p>
            <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; font-size: 12px; color: #94a3b8; text-align: center;">
              &copy; ${new Date().getFullYear()} Mfolks Platform. All rights reserved.
            </div>
          </div>
        `,
      });
    } catch (mailError) {
      console.error('Failed to send password reset OTP email:', mailError);
      throw new ApiError(500, 'Failed to send OTP email. Please verify email service configuration.');
    }

    return {
      success: true,
      message: 'A 6-digit verification code has been sent to your email.',
      email: user.email,
    };
  }

  public async verifyOtp(payload: VerifyOtpPayload): Promise<{ success: boolean; message: string; token: string; email: string }> {
    const record = await this.authRepository.findPasswordResetByEmail(payload.email);
    if (!record) {
      throw new ApiError(400, 'No active password reset request found for this email');
    }

    if (new Date() > record.expiresAt) {
      throw new ApiError(400, 'Verification code has expired. Please request a new OTP.');
    }

    if (record.otp !== payload.otp.trim()) {
      throw new ApiError(400, 'Invalid verification code. Please check and try again.');
    }

    // Mark as verified
    await this.authRepository.markResetVerified(record.id);

    return {
      success: true,
      message: 'OTP verified successfully.',
      token: record.token,
      email: payload.email,
    };
  }

  public async resetPassword(payload: ResetPasswordPayload): Promise<{ success: boolean; message: string }> {
    let resetRecord = null;

    if (payload.token) {
      resetRecord = await this.authRepository.findPasswordResetToken(payload.token);
    } else if (payload.email && payload.otp) {
      const record = await this.authRepository.findPasswordResetByEmail(payload.email);
      if (record && record.otp === payload.otp.trim()) {
        resetRecord = record;
      }
    } else if (payload.email) {
      const record = await this.authRepository.findPasswordResetByEmail(payload.email);
      if (record && record.isVerified) {
        resetRecord = record;
      }
    }

    if (!resetRecord || new Date() > resetRecord.expiresAt) {
      throw new ApiError(400, 'Password reset session is invalid or expired. Please request a new code.');
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);
    await UserModel.findByIdAndUpdate(resetRecord.user, { password: passwordHash }).exec();

    // Clean up reset records for this user
    await this.authRepository.deletePasswordResetByUser(resetRecord.user.toString());

    // Send confirmation email
    const user = await UserModel.findById(resetRecord.user).exec();
    if (user) {
      try {
        await sendEmail({
          to: user.email,
          subject: 'Mfolks - Password Successfully Updated',
          text: 'Your account password has been successfully reset. You can now log in with your new password.',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
              <h3 style="color: #0f172a; margin: 0 0 12px 0;">Password Successfully Reset</h3>
              <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
                Your Mfolks account password was successfully updated. You can now log in using your new password.
              </p>
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                If you did not perform this change, please contact our support team immediately.
              </p>
            </div>
          `,
        });
      } catch (e) {
        console.error('Confirmation email send failed:', e);
      }
    }

    return {
      success: true,
      message: 'Password reset successfully. You can now log in with your new credentials.',
    };
  }

  public async verifyEmail(payload: VerifyEmailPayload): Promise<void> {
    const verificationRecord = await this.authRepository.findVerificationToken(payload.token);
    if (!verificationRecord || verificationRecord.expiresAt < new Date()) {
      throw new ApiError(400, 'Verification token is invalid or expired');
    }

    await UserModel.findByIdAndUpdate(verificationRecord.user, { isVerified: true }).exec();
    await this.authRepository.deleteEmailVerificationToken(payload.token);
  }

  public async resendVerificationEmail(email: string, origin: string): Promise<void> {
    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (user.isVerified) {
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + EMAIL_VERIFY_TOKEN_EXPIRES_IN_MS);

    await this.authRepository.saveEmailVerificationToken(user.id, verificationToken, expiresAt, otp);
    await sendEmail({
      to: user.email,
      subject: 'Verify your email - Mfolks',
      text: `Your verification code is: ${otp}. Or verify at: ${origin}/verify-email?token=${verificationToken}`,
      html: `<p>Your verification code is: <b>${otp}</b></p><p>Or click to verify: <a href="${origin}/verify-email?token=${verificationToken}">${origin}/verify-email</a></p>`,
    });
  }
}
