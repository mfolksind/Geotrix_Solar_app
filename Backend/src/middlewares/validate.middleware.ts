import { AnyZodObject, ZodTypeAny } from 'zod';
import { Request, Response, NextFunction } from 'express';

type SchemaLocation = 'body' | 'params' | 'query';

function validate(schema: AnyZodObject | ZodTypeAny, location: SchemaLocation = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const target = req[location] as unknown;
    const result = schema.safeParse(target);

    if (!result.success) {
      const passwordIssue = result.error.issues.find((issue) => issue.path.includes('password'));
      const firstIssue = passwordIssue || result.error.issues[0];
      const errorMessage = firstIssue ? firstIssue.message : 'Validation failed';

      res.status(400).json({
        success: false,
        message: errorMessage,
        errors: result.error.format(),
      });
      return;
    }

    Object.assign(req[location], result.data);
    next();
  };
}

export default validate;
