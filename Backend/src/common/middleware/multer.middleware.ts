import multer from 'multer';
import { RequestHandler } from 'express';
import fs from 'fs';
import path from 'path';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.memoryStorage();
const publicUploadDir = path.resolve(process.cwd(), 'public/uploads');
fs.mkdirSync(publicUploadDir, { recursive: true });

const imageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);

function fileFilter(req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (!imageMimeTypes.has(file.mimetype)) {
    return cb(new Error('Unsupported file type. Allowed: jpg, jpeg, png, webp'));
  }
  cb(null, true);
}

const baseMulter = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } });

const publicStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, publicUploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const publicMulter = multer({ storage: publicStorage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } });

export function uploadSingle(fieldName: string): RequestHandler {
  return baseMulter.single(fieldName);
}

export function uploadMultiple(fieldName: string, maxCount = 5): RequestHandler {
  return baseMulter.array(fieldName, maxCount);
}

export function uploadSingleToPublic(fieldName: string): RequestHandler {
  return publicMulter.single(fieldName);
}

export function uploadMultipleToPublic(fieldName: string, maxCount = 5): RequestHandler {
  return publicMulter.array(fieldName, maxCount);
}
