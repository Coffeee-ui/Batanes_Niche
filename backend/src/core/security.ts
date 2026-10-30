import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { settings } from './config';

export function verifyPassword(plainPassword: string, hashedPassword: string): boolean {
  try {
    return bcrypt.compareSync(plainPassword, hashedPassword);
  } catch {
    return false;
  }
}

export function getPasswordHash(password: string): string {
  const salt = bcrypt.genSaltSync(12);
  return bcrypt.hashSync(password, salt);
}

export interface AccessTokenClaims {
  sub: string;
  username: string;
  role: string;
  jti: string;
  iat: number;
  exp: number;
}

export function createAccessToken(
  subject: string | number,
  username: string,
  role: string,
  expiresInSeconds?: number,
  customJti?: string
): { token: string; jti: string; expiresAt: Date } {
  const nowSec = Math.floor(Date.now() / 1000);
  const durationSec = expiresInSeconds || settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60;
  const expSec = nowSec + durationSec;
  const tokenJti = customJti || crypto.randomUUID();

  const payload: AccessTokenClaims = {
    sub: String(subject),
    username,
    role,
    jti: tokenJti,
    iat: nowSec,
    exp: expSec,
  };

  const token = jwt.sign(payload, settings.JWT_SECRET_KEY, {
    algorithm: settings.JWT_ALGORITHM as jwt.Algorithm,
  });

  const expiresAt = new Date(expSec * 1000);
  return { token, jti: tokenJti, expiresAt };
}

export function decodeAccessToken(token: string): AccessTokenClaims | null {
  try {
    const decoded = jwt.verify(token, settings.JWT_SECRET_KEY, {
      algorithms: [settings.JWT_ALGORITHM as jwt.Algorithm],
    }) as AccessTokenClaims;
    return decoded;
  } catch {
    return null;
  }
}

export function hashRefreshToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken, 'utf8').digest('hex');
}

export function generateRefreshToken(): { rawToken: string; tokenHash: string; expiresAt: Date } {
  const rawToken = crypto.randomBytes(32).toString('base64url');
  const tokenHash = hashRefreshToken(rawToken);
  const expiresAt = new Date(Date.now() + settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60 * 1000);
  return { rawToken, tokenHash, expiresAt };
}

export function generateSixDigitOtp(): string {
  const num = crypto.randomInt(100000, 1000000);
  return String(num);
}

export function hashOtp(otpCode: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(otpCode, salt);
}

export function verifyOtp(plainOtp: string, hashedOtp: string): boolean {
  try {
    return bcrypt.compareSync(plainOtp, hashedOtp);
  } catch {
    return false;
  }
}
