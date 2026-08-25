import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { AuthService } from './auth.service';
import { RegisterPayload, RegisterAdminPayload, LoginPayload, GoogleLoginPayload, ForgotPasswordPayload, ResetPasswordPayload, VerifyEmailPayload } from './auth.types';
import { env } from '../../config/env';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  public register = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body as RegisterPayload;
    const origin = req.headers.origin || env.CLIENT_URLS[0] || 'http://localhost:3000';
    const result = await this.authService.register(payload, origin);

    res.status(201).json({
      success: true,
      message: result.message || 'Registration successful',
      data: result,
    });
  });

  public registerAdmin = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body as RegisterAdminPayload;
    const origin = req.headers.origin || env.CLIENT_URLS[0] || 'http://localhost:3000';
    const result = await this.authService.registerAdmin(payload, origin);

    res.status(201).json({
      success: true,
      message: 'Admin registration successful',
      data: result,
    });
  });

  public login = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body as LoginPayload;
    const result = await this.authService.login(payload);

    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth',
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  });

  public googleLogin = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body as GoogleLoginPayload;
    const result = await this.authService.googleLogin(payload);

    if (result.tokens) {
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/auth',
      });
    }

    res.status(200).json({
      success: true,
      message: result.message || 'Google login successful',
      data: result,
    });
  });

  public refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken as string;
    const result = await this.authService.refreshToken(refreshToken);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth',
    });

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: result,
    });
  });

  public logout = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken as string;
    await this.authService.logout(refreshToken);

    res.clearCookie('refreshToken', { path: '/auth' });
    res.status(200).json({
      success: true,
      message: 'Logout successful',
      data: {},
    });
  });

  public forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body as ForgotPasswordPayload;
    const origin = req.headers.origin || env.CLIENT_URLS[0] || 'http://localhost:3000';
    await this.authService.forgotPassword(payload, origin);

    res.status(200).json({
      success: true,
      message: 'Password reset email sent',
      data: {},
    });
  });

  public resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body as ResetPasswordPayload;
    await this.authService.resetPassword(payload);

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      data: {},
    });
  });

  public verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body as VerifyEmailPayload;
    await this.authService.verifyEmail(payload);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {},
    });
  });

  public resendVerificationEmail = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body as { email: string };
    const origin = req.headers.origin || env.CLIENT_URLS[0] || 'http://localhost:3000';
    await this.authService.resendVerificationEmail(email, origin);

    res.status(200).json({
      success: true,
      message: 'Verification email resent',
      data: {},
    });
  });
}
