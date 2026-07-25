import { NextFunction, Request, Response } from 'express';
import { uploadImage, uploadMultipleImages } from '../services/cloudinary';
import asyncHandler from 'express-async-handler';

export function uploadToCloudSingle(fieldName?: string) {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const file = req.file as Express.Multer.File | undefined;
    if (!file) return next();

    const result = await uploadImage(file);
    req.uploadedFile = result;
    next();
  });
}

export function uploadToCloudMultiple() {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (!files.length) return next();

    const results = await uploadMultipleImages(files);
    req.uploadedFiles = results;
    next();
  });
}
