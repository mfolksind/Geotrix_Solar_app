import { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { JwtPayload } from 'jsonwebtoken';
import { ApiError } from '../../utils/apiError';
import UserModel from '../users/user.model';
import { verifyAccessToken } from './auth.utils';
import { UserRole } from '../users/user.types';

export type AuthRole = UserRole;

export interface AuthUser {
  id: string;
  role: AuthRole;
  status: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export const authenticate = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authorization header missing or malformed');
  }

  const token = authorization.slice(7).trim();
  if (!token) {
    throw new ApiError(401, 'Bearer token missing');
  }

  let payload: JwtPayload;
  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired token');
  }

  const userId = payload.sub;
  if (!userId || typeof userId !== 'string') {
    throw new ApiError(401, 'Invalid token payload');
  }

  const user = await UserModel.findById(userId).exec();
  if (!user) {
    throw new ApiError(401, 'User not found');
  }

  if (user.status !== 'active') {
    throw new ApiError(403, 'User account is not active');
  }

  req.user = {
    id: user.id,
    role: user.role as AuthRole,
    status: user.status,
  };

  next();
});

export function authorize(...allowedRoles: Array<AuthRole | string>) {
  const normalizedRoles = allowedRoles.map((role) => role.toLowerCase());

  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      throw new ApiError(401, 'Authentication required');
    }

    if (!normalizedRoles.includes(user.role.toLowerCase())) {
      throw new ApiError(403, 'Forbidden: insufficient permissions');
    }

    next();
  };
}
