  import path from 'path';
  import dotenv from 'dotenv';
  import { z } from 'zod';

  const envPath = path.resolve(__dirname, '../../.env');
  dotenv.config({ path: envPath });

  const getEnv = (...values: Array<string | undefined>): string => {
    const resolved = values.find((value) => value?.trim() !== undefined && value?.trim() !== '')?.trim() || '';
    return resolved;
  };

  const raw = {
    PORT: getEnv(process.env.PORT, '5000'),
    NODE_ENV: getEnv(process.env.NODE_ENV, 'development'),
    MONGODB_URI: getEnv(process.env.MONGODB_URI, process.env.MONGO_URI),
    JWT_ACCESS_SECRET: getEnv(process.env.JWT_ACCESS_SECRET),
    JWT_REFRESH_SECRET: getEnv(process.env.JWT_REFRESH_SECRET),
    JWT_ACCESS_EXPIRES: getEnv(process.env.JWT_ACCESS_EXPIRES, process.env.JWT_ACCESS_EXPIRES_IN, '60m'),
    JWT_REFRESH_EXPIRES: getEnv(process.env.JWT_REFRESH_EXPIRES, process.env.JWT_REFRESH_EXPIRES_IN, '7d'),
    JWT_REFRESH_COOKIE_MAX_AGE: getEnv(process.env.JWT_REFRESH_COOKIE_MAX_AGE, '604800000'),
    SMTP_HOST: getEnv(process.env.SMTP_HOST, process.env.EMAIL_HOST),
    SMTP_PORT: getEnv(process.env.SMTP_PORT, process.env.EMAIL_PORT, '587'),
    SMTP_USER: getEnv(process.env.SMTP_USER, process.env.EMAIL_USER),
    SMTP_PASS: getEnv(process.env.SMTP_PASS, process.env.EMAIL_PASS),
    CLIENT_URL: getEnv(process.env.CLIENT_URL, process.env.FRONTEND_URL, 'http://localhost:3000'),
    CLOUDINARY_CLOUD_NAME: getEnv(process.env.CLOUDINARY_CLOUD_NAME),
    CLOUDINARY_API_KEY: getEnv(process.env.CLOUDINARY_API_KEY),
    CLOUDINARY_API_SECRET: getEnv(process.env.CLOUDINARY_API_SECRET),
  };

  const envSchema = z.object({
    PORT: z.preprocess((val) => Number(val), z.number().int().positive()),
    NODE_ENV: z.enum(['development', 'production', 'test']),
    MONGODB_URI: z.string().min(1),
    JWT_ACCESS_SECRET: z.string().min(8),
    JWT_REFRESH_SECRET: z.string().min(8),
    JWT_ACCESS_EXPIRES: z.string().min(1),
    JWT_REFRESH_EXPIRES: z.string().min(1),
    JWT_REFRESH_COOKIE_MAX_AGE: z.preprocess((val) => Number(val), z.number().int().positive()),
    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z.preprocess((val) => Number(val), z.number().int().positive()),
    SMTP_USER: z.string().min(1),
    SMTP_PASS: z.string().min(1),
    CLIENT_URL: z.string().url(),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
  });

  export const env = envSchema.parse(raw);

  export type Env = typeof env;
