import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

cloudinary.uploader.upload('../../mfolksgeotrix/public/logo.png', { folder: 'test' })
  .then(res => console.log('SUCCESS:', res.secure_url))
  .catch(err => console.error('ERROR:', err));
