import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { AuthRepository } from './auth.repository';
import { AuthTokens, CreateUserPayload, ForgotPasswordPayload, GoogleLoginPayload, LoginPayload, RegisterPayload, RegisterAdminPayload, ResetPasswordPayload, VerifyEmailPayload } from './auth.types';
import { generateAccessToken, generateRefreshToken, hashToken, verifyGoogleIdToken } from './auth.utils';
import { sendEmail } from '../../common/services/email/email.service';
import UserModel from '../users/user.model';
import FamilyModel from '../families/family.model';

const REFRESH_TOKEN_EXPIRES_IN_MS = Number(process.env.JWT_REFRESH_COOKIE_MAX_AGE ?? 7 * 24 * 60 * 60 * 1000);
const PASSWORD_RESET_TOKEN_EXPIRES_IN_MS = Number(process.env.PASSWORD_RESET_TOKEN_EXPIRES_IN_MS ?? 60 * 60 * 1000);
const EMAIL_VERIFY_TOKEN_EXPIRES_IN_MS = Number(process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN_MS ?? 24 * 60 * 60 * 1000);

export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  public async register(payload: RegisterPayload, origin: string): Promise<{ user: unknown; tokens: AuthTokens }> {
    const existingUser = await this.authRepository.findByEmail(payload.email);
    if (existingUser) {
      throw new Error('Email is already registered');
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
      isVerified: false,
      status: initialStatus,
    };

    const user = await this.authRepository.createUser(userPayload);
    const emailToken = crypto.randomUUID();
    const emailTokenHash = hashToken(emailToken);
    const expiresAt = new Date(Date.now() + EMAIL_VERIFY_TOKEN_EXPIRES_IN_MS);

    await this.authRepository.saveEmailVerificationToken(user.id, emailTokenHash, expiresAt);
    await sendEmail({
      to: user.email,
      subject: 'Verify your email',
      text: `Verify your account by visiting ${origin}/verify-email?token=${emailToken}`,
      html: `<p>Verify your account by visiting <a href="${origin}/verify-email?token=${emailToken}">${origin}/verify-email</a></p>`,
    });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    const refreshTokenHash = hashToken(refreshToken);
    await this.authRepository.saveRefreshToken(user.id, refreshTokenHash, new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS));

    return { user, tokens: { accessToken, refreshToken } };
  }

  public async registerAdmin(payload: RegisterAdminPayload, origin: string): Promise<{ user: unknown; tokens: AuthTokens }> {
    const adminKey = process.env.ADMIN_REGISTRATION_KEY;
    if (!adminKey) {
      throw new Error('Admin registration is not configured');
    }

    if (payload.adminKey !== adminKey) {
      throw new Error('Invalid admin registration key');
    }

    const existingUser = await this.authRepository.findByEmail(payload.email);
    if (existingUser) {
      throw new Error('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);
    const userPayload: CreateUserPayload = {
      name: payload.name,
      email: payload.email,
      password: passwordHash,
      phone: payload.phone,
      provider: 'local',
      role: 'admin',
      isVerified: false,
      status: 'active',
    };

    const user = await this.authRepository.createUser(userPayload);
    const emailToken = crypto.randomUUID();
    const emailTokenHash = hashToken(emailToken);
    const expiresAt = new Date(Date.now() + EMAIL_VERIFY_TOKEN_EXPIRES_IN_MS);

    await this.authRepository.saveEmailVerificationToken(user.id, emailTokenHash, expiresAt);
    await sendEmail({
      to: user.email,
      subject: 'Verify your email',
      text: `Verify your account by visiting ${origin}/verify-email?token=${emailToken}`,
      html: `<p>Verify your account by visiting <a href="${origin}/verify-email?token=${emailToken}">${origin}/verify-email</a></p>`,
    });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    const refreshTokenHash = hashToken(refreshToken);
    await this.authRepository.saveRefreshToken(user.id, refreshTokenHash, new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS));

    return { user, tokens: { accessToken, refreshToken } };
  }

  public async login(payload: LoginPayload): Promise<{ user: unknown; tokens: AuthTokens }> {
    const user = await this.authRepository.findByEmail(payload.email);
    if (!user || !user.password) {
      throw new Error('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(payload.password, user.password);
    if (!passwordMatches) {
      throw new Error('Invalid email or password');
    }

    if (user.status !== 'active') {
      throw new Error('Account is not active');
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    const refreshTokenHash = hashToken(refreshToken);

    await this.authRepository.saveRefreshToken(user.id, refreshTokenHash, new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS));

    return { user, tokens: { accessToken, refreshToken } };
  }

  public async googleLogin(payload: GoogleLoginPayload): Promise<{ user: unknown; tokens: AuthTokens }> {
    const decoded = await verifyGoogleIdToken(payload.idToken);
    const email = decoded.email;
    const googleId = decoded.sub;
    const name = decoded.name ?? email?.split('@')[0] ?? 'Google User';

    if (!email || !googleId) {
      throw new Error('Invalid Google token');
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
      throw new Error('Refresh token is invalid or expired');
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

  public async forgotPassword(payload: ForgotPasswordPayload, origin: string): Promise<void> {
    const user = await this.authRepository.findByEmail(payload.email);
    if (!user) {
      return;
    }

    const resetToken = crypto.randomUUID();
    const resetTokenHash = hashToken(resetToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRES_IN_MS);

    await this.authRepository.savePasswordResetToken(user.id, resetTokenHash, expiresAt);
    await sendEmail({
      to: user.email,
      subject: 'Reset your password',
      text: `Use this link to reset your password: ${origin}/reset-password?token=${resetToken}`,
      html: `<p>Use this link to reset your password: <a href="${origin}/reset-password?token=${resetToken}">${origin}/reset-password</a></p>`,
    });
  }

  public async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    const tokenHash = hashToken(payload.token);
    const resetRecord = await this.authRepository.findPasswordResetToken(tokenHash);
    if (!resetRecord || resetRecord.expiresAt < new Date()) {
      throw new Error('Reset token is invalid or expired');
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);
    await UserModel.findByIdAndUpdate(resetRecord.user, { password: passwordHash }).exec();
    await this.authRepository.deletePasswordResetToken(tokenHash);
  }

  public async verifyEmail(payload: VerifyEmailPayload): Promise<void> {
    const tokenHash = hashToken(payload.token);
    const verificationRecord = await this.authRepository.findVerificationToken(tokenHash);
    if (!verificationRecord || verificationRecord.expiresAt < new Date()) {
      throw new Error('Verification token is invalid or expired');
    }

    await UserModel.findByIdAndUpdate(verificationRecord.user, { isVerified: true }).exec();
    await this.authRepository.deleteEmailVerificationToken(tokenHash);
  }

  public async resendVerificationEmail(email: string, origin: string): Promise<void> {
    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.isVerified) {
      return;
    }

    const verificationToken = crypto.randomUUID();
    const tokenHash = hashToken(verificationToken);
    const expiresAt = new Date(Date.now() + EMAIL_VERIFY_TOKEN_EXPIRES_IN_MS);

    await this.authRepository.saveEmailVerificationToken(user.id, tokenHash, expiresAt);
    await sendEmail({
      to: user.email,
      subject: 'Verify your email',
      text: `Verify your account by visiting ${origin}/verify-email?token=${verificationToken}`,
      html: `<p>Verify your account by visiting <a href="${origin}/verify-email?token=${verificationToken}">${origin}/verify-email</a></p>`,
    });
  }
}
