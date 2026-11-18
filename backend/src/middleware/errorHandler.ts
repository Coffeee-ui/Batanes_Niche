import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../core/errors';
import { ErrorLoggingService } from '../services/errorLoggingService';

const SENSITIVE_KEYS = new Set([
  'password',
  'password_hash',
  'new_password',
  'confirm_password',
  'old_password',
  'otp_code',
  'token',
  'refresh_token',
  'authorization',
  'secret',
]);

function sanitizeSensitiveString(str: string): string {
  if (!str) return str;
  return str
    .replace(/(postgres(?:ql)?:\/\/[^:]+:)([^@]+)(@)/gi, '$1[REDACTED]$3')
    .replace(/(password|passwd|pwd|secret|token|api[_-]?key)=([^&;\s]+)/gi, '$1=[REDACTED]');
}

function sanitizeRequestBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  try {
    const cloned = JSON.parse(JSON.stringify(body));
    const mask = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      for (const key of Object.keys(obj)) {
        if (SENSITIVE_KEYS.has(key.toLowerCase())) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          mask(obj[key]);
        }
      }
    };
    mask(cloned);
    return JSON.stringify(cloned);
  } catch {
    return '[Unserializable Request Body]';
  }
}

export async function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  if (err instanceof HttpError) {
    res.status(err.status).json({ detail: err.detail });
    return;
  }

  if (err instanceof ZodError) {
    const detail = err.issues.map(issue => ({
      loc: ['body', ...issue.path.map(String)],
      msg: issue.message,
      type: issue.code,
    }));
    res.status(422).json({ detail });
    return;
  }

  const traceId = (req.headers['x-trace-id'] as string) || crypto.randomUUID().slice(0, 8);
  const rawErrorMsg = err instanceof Error ? err.message : String(err);
  const rawStackTrace = err instanceof Error ? err.stack : undefined;
  const username = (req as any).user?.username || null;

  const errorMsg = sanitizeSensitiveString(rawErrorMsg);
  const stackTrace = rawStackTrace ? sanitizeSensitiveString(rawStackTrace) : undefined;

  console.error(`[TRACE_ID: ${traceId}] Unhandled Exception on ${req.method} ${req.originalUrl}: ${errorMsg}`);

  try {
    await ErrorLoggingService.recordError(
      `[${traceId}] ${errorMsg}`,
      req.originalUrl,
      username,
      stackTrace || null,
      sanitizeRequestBody(req.body)
    );
  } catch (logErr) {
    const logErrMsg = logErr instanceof Error ? logErr.message : String(logErr);
    console.error(
      `[TRACE_ID: ${traceId}] Failed to record incident to error_reports (DB offline/inaccessible):`,
      sanitizeSensitiveString(logErrMsg)
    );
  }

  if (res.headersSent) {
    return;
  }

  res.setHeader('X-Trace-ID', traceId);
  res.status(500).json({
    detail: 'An internal error occurred. Please contact support.',
    trace_id: traceId,
  });
}
