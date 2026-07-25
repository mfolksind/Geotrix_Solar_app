import { ZodError } from 'zod';
import jwt from 'jsonwebtoken';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors: unknown[];

  constructor(statusCode: number, message: string, errors: unknown[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static fromUnknown(err: unknown): ApiError {
    // ApiError passthrough
    if (err instanceof ApiError) return err;

    // Zod validation
    if (err instanceof ZodError) {
      const errors = err.errors.map((e) => ({ path: e.path, message: e.message }));
      return new ApiError(400, 'Validation error', errors);
    }

    // JWT errors
    if (err instanceof jwt.TokenExpiredError) {
      return new ApiError(401, 'Token expired', []);
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return new ApiError(401, 'Invalid token', []);
    }

    // Mongoose / Mongo errors
    // Duplicate key (MongoServerError with code 11000)
    const anyErr = err as any;
    if (anyErr && anyErr.name === 'MongoServerError' && anyErr.code === 11000) {
      const keys = anyErr.keyValue ? Object.keys(anyErr.keyValue) : [];
      const message = `Duplicate key error: ${keys.join(', ')}`;
      return new ApiError(409, message, [{ fields: anyErr.keyValue }]);
    }

    // Mongoose validation error
    if (anyErr && anyErr.name === 'ValidationError' && anyErr.errors) {
      const errors = Object.values(anyErr.errors).map((e: any) => ({ message: e.message, path: e.path }));
      return new ApiError(400, 'Database validation error', errors);
    }

    // CastError (invalid ObjectId)
    if (anyErr && anyErr.name === 'CastError') {
      return new ApiError(400, 'Invalid identifier', [{ path: anyErr.path, value: anyErr.value }]);
    }

    // Fallback
    if (err instanceof Error) {
      return new ApiError(500, err.message || 'Internal server error', []);
    }

    return new ApiError(500, 'Unknown error', []);
  }
}

export default ApiError;
