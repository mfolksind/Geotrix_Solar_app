import crypto from 'crypto';
import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { env } from '../../config/env';

const ACCESS_SECRET: Secret = env.JWT_ACCESS_SECRET;
const REFRESH_SECRET: Secret = env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES_IN = env.JWT_ACCESS_EXPIRES;
const REFRESH_EXPIRES_IN = env.JWT_REFRESH_EXPIRES;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? '';

const jwtSign = (payload: jwt.JwtPayload, secret: Secret, expiresIn: string | number): string =>
  jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);

const jwtVerify = (token: string, secret: Secret): JwtPayload =>
  jwt.verify(token, secret) as JwtPayload;

const getJwtToken = (userId: string, secret: Secret, expiresIn: string | number): string =>
  jwtSign({ sub: userId }, secret, expiresIn);

export function generateAccessToken(userId: string): string {
  return getJwtToken(userId, ACCESS_SECRET, ACCESS_EXPIRES_IN);
}

export function generateRefreshToken(userId: string): string {
  return getJwtToken(userId, REFRESH_SECRET, REFRESH_EXPIRES_IN);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwtVerify(token, ACCESS_SECRET);
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwtVerify(token, REFRESH_SECRET);
}

export function decodeToken(token: string): JwtPayload | null {
  return jwt.decode(token) as JwtPayload | null;
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/auth',
  maxAge: Number(env.JWT_REFRESH_COOKIE_MAX_AGE),
};

export async function verifyGoogleIdToken(idToken: string): Promise<TokenPayload> {
  const client = new OAuth2Client(GOOGLE_CLIENT_ID);
  const ticket = await client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
  return ticket.getPayload() as TokenPayload;
}
