import { AnyZodObject, ZodError } from 'zod';
import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../errors/ApiError';

type Location = 'body' | 'params' | 'query';

export default function validate(schema: AnyZodObject, location: Location = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const target = req[location] as unknown;
      const result = schema.safeParse(target);
      if (!result.success) {
        const errors = result.error.errors.map((e) => ({ path: e.path, message: e.message }));
        throw new ApiError(400, 'Validation failed', errors);
      }

      // assign parsed data back
      Object.assign(req[location], result.data);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({ path: e.path, message: e.message }));
        next(new ApiError(400, 'Validation failed', errors));
        return;
      }
      next(err);
    }
  };
}
