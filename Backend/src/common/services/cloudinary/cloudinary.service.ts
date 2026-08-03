import { v2 as cloudinary } from 'cloudinary';
import { PassThrough } from 'stream';
import path from 'path';
import { CloudinaryUploadResult } from './cloudinary.types';
import cloudinaryConfig from './cloudinary.config';
import { env } from '../../../config/env';

function mapResult(result: unknown): CloudinaryUploadResult {
  const r = result as any;
  return {
    secure_url: r.secure_url,
    public_id: r.public_id,
    width: r.width,
    height: r.height,
    format: r.format,
    bytes: r.bytes,
  };
}

function buildFallbackResult(file: Express.Multer.File): CloudinaryUploadResult {
  const fallbackUrl = file.path ? `/uploads/${path.basename(file.path)}` : '';
  return {
    secure_url: fallbackUrl,
    public_id: '',
    width: 0,
    height: 0,
    format: path.extname(file.originalname || '').slice(1) || 'jpg',
    bytes: file.size || 0,
  };
}

export async function uploadImage(file: Express.Multer.File, folder = 'uploads'): Promise<CloudinaryUploadResult> {
  if (!file) throw new Error('File is missing');

  const isCloudinaryConfigured = Boolean(
    env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME
  ) && Boolean(env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY) && Boolean(env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET);

  if (!isCloudinaryConfigured) {
    return buildFallbackResult(file);
  }

  try {
    if (file.path) {
      const result = await cloudinary.uploader.upload(file.path, { folder });
      // Clean up the local file after successful upload to Cloudinary
      try {
        require('fs').unlinkSync(file.path);
      } catch (err) {
        console.error('Failed to delete local file after Cloudinary upload', err);
      }
      return mapResult(result);
    }

    if (!file.buffer) throw new Error('File buffer is missing');

    return new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('Empty upload result'));
        resolve(mapResult(result));
      });

      const passthrough = new PassThrough();
      passthrough.end(file.buffer);
      passthrough.pipe(stream);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/api[_ -]?key|cloudinary|must supply/i.test(message)) {
      return buildFallbackResult(file);
    }
    throw error;
  }
}

export async function uploadMultipleImages(files: Express.Multer.File[], folder = 'uploads'): Promise<CloudinaryUploadResult[]> {
  const uploads = files.map((f) => uploadImage(f, folder));
  return Promise.all(uploads);
}

export async function deleteImage(publicId: string): Promise<boolean> {
  const result = await cloudinary.uploader.destroy(publicId);
  const res = result as any;
  return res.result === 'ok' || res.result === 'not_found';
}

export async function replaceImage(oldPublicId: string | null | undefined, file: Express.Multer.File, folder = 'uploads'): Promise<CloudinaryUploadResult> {
  const uploaded = await uploadImage(file, folder);
  if (oldPublicId) await deleteImage(oldPublicId);
  return uploaded;
}

export default {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  replaceImage,
};
