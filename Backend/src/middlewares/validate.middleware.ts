import { AnyZodObject, ZodTypeAny } from 'zod';
import { Request, Response, NextFunction } from 'express';

type SchemaLocation = 'body' | 'params' | 'query';

function validate(schema: AnyZodObject | ZodTypeAny, location: SchemaLocation = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const target = req[location] as unknown;
    const result = schema.safeParse(target);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.format(),
      });
      return;
    }

    Object.assign(req[location], result.data);
    next();
  };
}

export default validate;
