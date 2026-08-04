import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../../config/env';

const cloudName = env.CLOUDINARY_CLOUD_NAME ?? process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = env.CLOUDINARY_API_KEY ?? process.env.CLOUDINARY_API_KEY;
const apiSecret = env.CLOUDINARY_API_SECRET ?? process.env.CLOUDINARY_API_SECRET;

console.log("CloudName:", cloudName); if (!cloudName || !apiKey || !apiSecret) { console.log("Cloudinary SKIPPED configuration!");
  // do not throw in non-production to allow local dev without cloudinary configured
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cloudinary configuration is missing in environment variables');
  }
} else {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export default cloudinary;
