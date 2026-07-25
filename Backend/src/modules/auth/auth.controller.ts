import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { AuthService } from './auth.service';
import { RegisterPayload, RegisterAdminPayload, LoginPayload, GoogleLoginPayload, ForgotPasswordPayload, ResetPasswordPayload, VerifyEmailPayload } from './auth.types';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  public register = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body as RegisterPayload;
    const result = await this.authService.register(payload);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: result,
    });
  });

  public registerAdmin = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body as RegisterAdminPayload;
    const result = await this.authService.registerAdmin(payload);

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

    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth',
    });

    res.status(200).json({
      success: true,
      message: 'Google login successful',
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
    await this.authService.forgotPassword(payload);

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
    await this.authService.resendVerificationEmail(email);

    res.status(200).json({
      success: true,
      message: 'Verification email resent',
      data: {},
    });
  });
}
