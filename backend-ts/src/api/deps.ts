import { NextFunction, Request, Response } from 'express';
import { UserWithProfiles, UserRepository } from '../repositories/userRepository';
import { TokenRepository } from '../repositories/tokenRepository';
import { decodeAccessToken } from '../core/security';
import { HttpError } from '../core/errors';

export interface AuthenticatedRequest extends Request {
  user?: UserWithProfiles;
  tokenJti?: string;
}

export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7).trim();
}

export async function authenticateOptional(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return next();
    }

    const payload = decodeAccessToken(token);
    if (!payload || !payload.sub) {
      return next();
    }

    if (payload.jti && (await TokenRepository.isJtiRevoked(payload.jti))) {
      return next();
    }

    const user = await UserRepository.getById(parseInt(payload.sub, 10));
    if (!user || user.account_status !== 'active') {
      return next();
    }

    req.user = user;
    req.tokenJti = payload.jti;
    next();
  } catch (err) {
    next();
  }
}

export async function requireAuthenticated(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      throw new HttpError(401, 'Authentication credentials were not provided.');
    }

    const payload = decodeAccessToken(token);
    if (!payload) {
      throw new HttpError(401, 'Invalid or expired access token.');
    }

    if (payload.jti && (await TokenRepository.isJtiRevoked(payload.jti))) {
      throw new HttpError(401, 'Token has been revoked.');
    }

    if (!payload.sub) {
      throw new HttpError(401, 'Invalid token claims.');
    }

    const user = await UserRepository.getById(parseInt(payload.sub, 10));
    if (!user) {
      throw new HttpError(401, 'User not found.');
    }

    if (user.account_status === 'suspended') {
      throw new HttpError(403, 'Your account has been suspended.');
    }

    if (user.account_status !== 'active') {
      throw new HttpError(403, 'Account is inactive.');
    }

    req.user = user;
    req.tokenJti = payload.jti;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireJobSeekerContext(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== 'job_seeker') {
    return next(new HttpError(403, 'Operation requires job seeker role.'));
  }
  next();
}

export function requireEmployerContext(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== 'employer') {
    return next(new HttpError(403, 'Operation requires employer role.'));
  }
  next();
}

export function requireAdminContext(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== 'admin') {
    return next(new HttpError(403, 'Operation requires administrator role.'));
  }
  next();
}
