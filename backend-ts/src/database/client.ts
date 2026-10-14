import { PrismaClient } from '@prisma/client';
import { settings } from '../core/config';

// Ensure database configuration is valid
settings.validateDatabaseConfig();

const logOptions: ('query' | 'info' | 'warn' | 'error')[] =
  settings.DEBUG && settings.ENVIRONMENT === 'development'
    ? ['error', 'warn']
    : ['error'];

export const prisma = new PrismaClient({
  log: logOptions,
  errorFormat: 'minimal',
});

export function isPostgres(): boolean {
  return settings.DB_PROVIDER === 'postgresql';
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('[Database] Connection pool cleanly disconnected.');
  } catch (err) {
    console.error('[Database] Error disconnecting Prisma client:', err);
  }
}

export async function checkDatabaseHealth(): Promise<{
  status: 'ready' | 'not_ready';
  database: 'connected' | 'disconnected';
  provider: string;
  latencyMs: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;
    return {
      status: 'ready',
      database: 'connected',
      provider: settings.DB_PROVIDER,
      latencyMs,
    };
  } catch (exc) {
    return {
      status: 'not_ready',
      database: 'disconnected',
      provider: settings.DB_PROVIDER,
      latencyMs: Date.now() - start,
      error: exc instanceof Error ? exc.message : String(exc),
    };
  }
}
