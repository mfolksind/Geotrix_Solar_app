import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wrap an async Express handler and forward errors to `next()`.
 *
 * Usage:
 * router.get('/', asyncHandler(async (req, res) => { ... }));
 */
export const asyncHandler = <P = any, ResBody = any, ReqBody = any, ReqQuery = any>(
  fn: (req: Request<P, ResBody, ReqBody, ReqQuery>, res: Response<ResBody>, next: NextFunction) => Promise<any>
): RequestHandler<P, ResBody, ReqBody, ReqQuery> => {
  return (req: Request<P, ResBody, ReqBody, ReqQuery>, res: Response<ResBody>, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
