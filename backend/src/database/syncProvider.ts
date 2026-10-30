import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

// Load environment variables from backend/.env first, then root .env
const localEnvPath = path.resolve(__dirname, '../../.env');
const rootEnvPath = path.resolve(__dirname, '../../../.env');

if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
}
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}

export type DbDialect = 'sqlite' | 'postgresql';

export function detectProvider(): { dialect: DbDialect; rawUrl: string; directUrl?: string } {
  const rawUrl = process.env.DATABASE_URL || '';
  const providerEnv = (process.env.DB_PROVIDER || '').trim().toLowerCase();

  const isPostgres =
    providerEnv === 'postgres' ||
    providerEnv === 'postgresql' ||
    rawUrl.startsWith('postgres://') ||
    rawUrl.startsWith('postgresql://');

  const dialect: DbDialect = isPostgres ? 'postgresql' : 'sqlite';
  const directUrl = process.env.DIRECT_URL?.trim() || undefined;

  return { dialect, rawUrl, directUrl };
}

export function syncPrismaSchema(force: boolean = false): boolean {
  const schemaPath = path.resolve(__dirname, '../../prisma/schema.prisma');
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Prisma schema not found at: ${schemaPath}`);
  }

  const { dialect, directUrl } = detectProvider();
  let schemaContent = fs.readFileSync(schemaPath, 'utf8');

  // Match provider inside datasource db { ... }
  const providerRegex = /(datasource\s+db\s*\{[\s\S]*?provider\s*=\s*")[^"]+("[\s\S]*?\})/;
  const match = schemaContent.match(providerRegex);

  if (!match) {
    throw new Error('Could not find datasource db block in prisma/schema.prisma');
  }

  const currentProvider = schemaContent.match(/datasource\s+db\s*\{[\s\S]*?provider\s*=\s*"([^"]+)"/)?.[1];
  const hasDirectUrlInSchema = /directUrl\s*=\s*env\("DIRECT_URL"\)/.test(schemaContent);

  const providerNeedsChange = currentProvider !== dialect;
  const directUrlNeedsChange = dialect === 'postgresql' ? (Boolean(directUrl) && !hasDirectUrlInSchema) : hasDirectUrlInSchema;

  if (!providerNeedsChange && !directUrlNeedsChange && !force) {
    return false;
  }

  console.log(`[Database Sync] Updating schema.prisma provider from '${currentProvider}' to '${dialect}'...`);

  // Update provider
  schemaContent = schemaContent.replace(
    /(datasource\s+db\s*\{[\s\S]*?provider\s*=\s*")[^"]+(")/,
    `$1${dialect}$2`
  );

  // Manage directUrl for PostgreSQL
  if (dialect === 'postgresql' && directUrl) {
    if (!hasDirectUrlInSchema) {
      schemaContent = schemaContent.replace(
        /(url\s*=\s*env\("DATABASE_URL"\))/,
        `$1\n  directUrl = env("DIRECT_URL")`
      );
    }
  } else {
    // Remove directUrl if SQLite or not provided
    schemaContent = schemaContent.replace(/\s*directUrl\s*=\s*env\("DIRECT_URL"\)/g, '');
  }

  fs.writeFileSync(schemaPath, schemaContent, 'utf8');
  console.log(`[Database Sync] schema.prisma synchronized to '${dialect}'. Generating Prisma Client...`);

  try {
    const cwd = path.resolve(__dirname, '../..');
    execSync('npx prisma generate', { cwd, stdio: 'inherit' });
    console.log(`[Database Sync] Prisma Client successfully regenerated for '${dialect}'.`);
    return true;
  } catch (err) {
    console.error('[Database Sync] Failed to regenerate Prisma Client:', err);
    throw err;
  }
}

// Allow direct CLI execution: ts-node src/database/syncProvider.ts
if (require.main === module) {
  try {
    syncPrismaSchema();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
