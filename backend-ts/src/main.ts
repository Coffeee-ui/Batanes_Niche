import path from 'path';
import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { settings } from './core/config';
import { checkDatabaseHealth, disconnectDatabase } from './database/client';
import { structuredLoggingMiddleware } from './middleware/logging';
import { errorHandler } from './middleware/errorHandler';
import { apiV1Router } from './api/v1';
import { adminRouter } from './admin/routes';

const app = express();

// Trust proxy for IP headers
app.set('trust proxy', 1);

// CORS configuration matching FastAPI
app.use(
  cors({
    origin: settings.ALLOWED_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['*'],
  })
);

// Body parsers & cookie parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Structured logging middleware
app.use(structuredLoggingMiddleware);

// Security Headers (Section 26.8)
app.use((_req: Request, res: Response, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  if (settings.ENVIRONMENT === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// --- Health & Readiness Endpoints (Section 34) ---

// GET /health (Liveness probe)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    app: settings.APP_NAME,
    version: '2.0.0',
  });
});

// GET /ready (Readiness probe)
app.get('/ready', async (_req: Request, res: Response) => {
  const health = await checkDatabaseHealth();
  if (health.status === 'ready') {
    res.status(200).json(health);
  } else {
    res.status(503).json(health);
  }
});

// Mount Static Files for Admin UI
const adminStaticDir = path.resolve(__dirname, 'static');
app.use('/admin/static', express.static(adminStaticDir));

// Mount Routers
app.use('/api/v1', apiV1Router);
app.use('/admin', adminRouter);

// Global Error Handler
app.use(errorHandler);

// Start server
let server: any = null;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(settings.PORT, () => {
    console.log(`[Batanes Niche] TypeScript Server running on port ${settings.PORT}`);
    console.log(`[Batanes Niche] Provider: ${settings.DB_PROVIDER.toUpperCase()}, Environment: ${settings.ENVIRONMENT}, Debug: ${settings.DEBUG}`);
    console.log(`[Batanes Niche] Demo Mode: ${settings.is_demo_mode_active ? 'ACTIVE' : 'DISABLED'}`);
  });

  const handleShutdown = async (signal: string) => {
    console.log(`\n[Batanes Niche] Received ${signal}. Starting graceful shutdown...`);
    if (server) {
      server.close(async () => {
        console.log('[Batanes Niche] HTTP server closed.');
        await disconnectDatabase();
        process.exit(0);
      });
    } else {
      await disconnectDatabase();
      process.exit(0);
    }
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
}

export default app;
