import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';

export function structuredLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const traceId = (req.headers['x-trace-id'] as string) || crypto.randomUUID().slice(0, 8);
  req.headers['x-trace-id'] = traceId;
  res.setHeader('X-Trace-ID', traceId);

  const startTime = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const userId = (req as any).user?.id || null;

    const logPayload = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      service: 'api',
      endpoint: req.originalUrl || req.url,
      method: req.method,
      status_code: res.statusCode,
      duration_ms: durationMs,
      user_id: userId,
      trace_id: traceId,
    };

    console.log(JSON.stringify(logPayload));
  });

  next();
}
