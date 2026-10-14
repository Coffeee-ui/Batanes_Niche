import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../core/errors';
import { ErrorLoggingService } from '../services/errorLoggingService';

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
  const errorMsg = err instanceof Error ? err.message : String(err);
  const stackTrace = err instanceof Error ? err.stack : undefined;
  const username = (req as any).user?.username || null;

  console.error(`[TRACE_ID: ${traceId}] Unhandled Exception on ${req.method} ${req.originalUrl}: ${errorMsg}`);

  try {
    await ErrorLoggingService.recordError(
      `[${traceId}] ${errorMsg}`,
      req.originalUrl,
      username,
      stackTrace || null,
      req.body ? JSON.stringify(req.body) : null
    );
  } catch (logErr) {
    console.error('Failed to record incident to error_reports:', logErr);
  }

  res.setHeader('X-Trace-ID', traceId);
  res.status(500).json({
    detail: 'An internal error occurred. Please contact support.',
    trace_id: traceId,
  });
}
