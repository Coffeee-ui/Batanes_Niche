import { PrismaClient } from '@prisma/client';
import { settings } from '../core/config';
import { schemaSyncStatus } from './ensureSchema';

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

// Guard against runtime provider mismatch (e.g. SQLite client running against PostgreSQL)
const activeProvider = (prisma as any)._engineConfig?.activeProvider;
if (activeProvider && activeProvider !== settings.DB_PROVIDER) {
  throw new Error(
    `[Database Provider Mismatch] Prisma Client was compiled for '${activeProvider}', but runtime DB_PROVIDER is '${settings.DB_PROVIDER}'. Run 'pnpm run db:sync' or 'prisma generate' to regenerate the client.`
  );
}

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

function sanitizeDatabaseError(msg: string): string {
  return msg
    .replace(/(postgres(?:ql)?:\/\/[^:]+:)([^@]+)(@)/gi, '$1[REDACTED]$3')
    .replace(/(password|passwd|pwd|secret)=([^&;\s]+)/gi, '$1=[REDACTED]');
}

export async function checkDatabaseHealth(): Promise<{
  status: 'ready' | 'not_ready';
  database: 'connected' | 'disconnected';
  provider: string;
  latencyMs: number;
  error?: string;
  schemaSync?: typeof schemaSyncStatus;
  testQuery?: { success: boolean; error?: string };
}> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;

    let testQuery: { success: boolean; error?: string } = { success: true };
    try {
      await prisma.job.findMany({
        where: { status: { in: ['published', 'active'] }, deleted_at: null },
        include: {
          employer: { include: { employer_profile: true } },
          applications: true,
        },
        take: 1,
      });
    } catch (jobErr) {
      const rawJobMsg = jobErr instanceof Error ? jobErr.message : String(jobErr);
      testQuery = { success: false, error: sanitizeDatabaseError(rawJobMsg) };
    }

    return {
      status: 'ready',
      database: 'connected',
      provider: settings.DB_PROVIDER,
      latencyMs,
      schemaSync: schemaSyncStatus,
      testQuery,
    };
  } catch (exc) {
    const rawMsg = exc instanceof Error ? exc.message : String(exc);
    return {
      status: 'not_ready',
      database: 'disconnected',
      provider: settings.DB_PROVIDER,
      latencyMs: Date.now() - start,
      error: sanitizeDatabaseError(rawMsg),
    };
  }
}
