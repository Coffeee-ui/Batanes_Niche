import crypto from 'crypto';
import { Request } from 'express';
import { settings } from '../core/config';
import { UserWithProfiles, UserRepository } from '../repositories/userRepository';

export const ADMIN_COOKIE_NAME = 'batanes_admin_session';
export const CSRF_COOKIE_NAME = 'batanes_admin_csrf';
export const SESSION_MAX_AGE_SEC = 43200; // 12 hours

interface AdminSessionPayload {
  user_id: number;
  username: string;
  role: string;
  exp: number;
}

function sign(payload: AdminSessionPayload, secret: string): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function unsign(token: string, secret: string): AdminSessionPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  if (sig !== expectedSig) return null;
  try {
    const jsonStr = Buffer.from(data, 'base64url').toString('utf8');
    const payload = JSON.parse(jsonStr) as AdminSessionPayload;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createAdminSessionCookie(user: { id: number; username: string; role: string }): {
  sessionToken: string;
  csrfToken: string;
} {
  const exp = Date.now() + SESSION_MAX_AGE_SEC * 1000;
  const sessionToken = sign(
    { user_id: user.id, username: user.username, role: user.role, exp },
    settings.ADMIN_SESSION_SECRET
  );
  const csrfToken = crypto.randomBytes(16).toString('hex');
  return { sessionToken, csrfToken };
}

export async function getAdminUserFromRequest(req: Request): Promise<UserWithProfiles | null> {
  const sessionCookie = req.cookies?.[ADMIN_COOKIE_NAME];
  if (!sessionCookie) return null;

  const payload = unsign(sessionCookie, settings.ADMIN_SESSION_SECRET);
  if (!payload || !payload.user_id) return null;

  const user = await UserRepository.getById(payload.user_id);
  if (!user || user.role !== 'admin' || user.account_status !== 'active') {
    return null;
  }

  return user;
}

export function verifyCsrfToken(req: Request, submittedCsrf?: string | null): boolean {
  const cookieCsrf = req.cookies?.[CSRF_COOKIE_NAME];
  if (!cookieCsrf || !submittedCsrf) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(cookieCsrf), Buffer.from(submittedCsrf));
  } catch {
    return false;
  }
}
