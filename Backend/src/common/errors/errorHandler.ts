import { NextFunction, Request, Response } from 'express';
import ApiError from './ApiError';

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  const apiError = ApiError.fromUnknown(err);

  // Log unexpected/internal errors
  if (apiError.statusCode >= 500) {
    console.error(err);
  }

  res.status(apiError.statusCode).json({
    success: false,
    message: apiError.message,
    errors: Array.isArray(apiError.errors) ? apiError.errors : [],
  });
}

export default errorHandler;
