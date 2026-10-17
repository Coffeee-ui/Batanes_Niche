import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import {
  resolveSqlitePaths,
  ensureParentDirectory,
  enableSqliteForeignKeys,
} from './seeds/utils';
import { seedBaselineData } from './seeds/baseline';
import { seedSampleData } from './seeds/sample';

// ---------------------------------------------------------------------------
// 1. Environment Loading (Root .env first, then backend-ts/.env)
// ---------------------------------------------------------------------------
const rootDir = path.resolve(__dirname, '../..');
const backendTsDir = path.resolve(rootDir, 'backend-ts');

const rootEnv = path.resolve(rootDir, '.env');
const localEnv = path.resolve(backendTsDir, '.env');

if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
}
if (fs.existsSync(localEnv)) {
  dotenv.config({ path: localEnv });
}

// ---------------------------------------------------------------------------
// 2. Command Line Argument Parser
// ---------------------------------------------------------------------------
interface CliOptions {
  reset: boolean;
  seedOnly: boolean;
  noSeed: boolean;
  dbPath?: string;
  help: boolean;
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    reset: false,
    seedOnly: false,
    noSeed: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--reset') {
      options.reset = true;
    } else if (arg === '--seed-only') {
      options.seedOnly = true;
    } else if (arg === '--no-seed') {
      options.noSeed = true;
    } else if (arg === '--db-path') {
      options.dbPath = args[++i];
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
================================================================================
Batanes Niche Job Portal - Database Initializer & Seeder
================================================================================

Usage:
  pnpm db:setup [options]
  ts-node development/scripts/init-db.ts [options]

Options:
  --help, -h          Show this help message and exit.
  --reset             Drop and recreate the SQLite database cleanly before seeding.
                      (Refuses to run in production or against PostgreSQL).
  --seed-only         Skip schema push / migrations and only insert baseline + sample seeds.
  --no-seed           Push schema only; do not seed baseline or sample data.
  --db-path <path>    Specify a custom SQLite file path (default: Database/batanes_niche.db).

Examples:
  pnpm db:setup                       # Normal idempotent init (schema + seed)
  pnpm db:setup -- --reset            # Clean reset and re-seed
  pnpm db:setup -- --seed-only        # Run seed insertion without schema push
  pnpm db:setup -- --no-seed          # Push schema only without sample rows
  pnpm db:setup -- --db-path ./test.db# Initialize a custom database path
`);
}

// ---------------------------------------------------------------------------
// 3. Main Database Initialization Routine
// ---------------------------------------------------------------------------
export async function initializeDatabase(options: CliOptions): Promise<void> {
  if (options.help) {
    printHelp();
    return;
  }

  console.log('\n================================================================================');
  console.log(' [Batanes Niche] SQLite Database Setup & Seeder');
  console.log('================================================================================');

  // 1. Resolve Target Database Path
  const { filePath, prismaUrl, isCustom } = resolveSqlitePaths(options.dbPath);
  console.log(`[DB Setup] Target Database File: ${filePath}`);
  console.log(`[DB Setup] Resolved Prisma URL:   ${prismaUrl}`);

  // 2. Production Safety Checks
  const env = (process.env.ENVIRONMENT || process.env.NODE_ENV || 'development').toLowerCase();
  const isProduction = env === 'production' || env === 'prod';

  if (options.reset && isProduction) {
    throw new Error(
      '[CRITICAL ERROR] --reset is strictly forbidden in production environment! Aborting.'
    );
  }

  const rawUrl = process.env.DATABASE_URL || '';
  const isPostgres =
    rawUrl.startsWith('postgres://') ||
    rawUrl.startsWith('postgresql://') ||
    (process.env.DB_PROVIDER || '').toLowerCase() === 'postgres';

  if (options.reset && isPostgres) {
    throw new Error(
      '[CRITICAL ERROR] --reset was invoked against a PostgreSQL/remote database. Use Prisma migrations for remote schemas. Aborting.'
    );
  }

  // 3. Handle --reset: Safely remove existing SQLite file and companion files
  if (options.reset) {
    console.log('\n[DB Setup] --reset requested: Removing existing database files...');
    const filesToRemove = [
      filePath,
      `${filePath}-wal`,
      `${filePath}-shm`,
      `${filePath}-journal`,
    ];
    for (const f of filesToRemove) {
      if (fs.existsSync(f)) {
        fs.unlinkSync(f);
        console.log(`  ✓ Removed: ${f}`);
      }
    }
  }

  // 4. Ensure Parent Directory Exists
  ensureParentDirectory(filePath);

  // 5. Schema Push (Single Source of Truth: backend-ts/prisma/schema.prisma)
  if (!options.seedOnly) {
    console.log('\n[DB Setup] Applying schema from backend-ts/prisma/schema.prisma...');

    try {
      // Synchronize schema provider to sqlite if needed
      const syncScript = path.resolve(backendTsDir, 'src/database/syncProvider.ts');
      if (fs.existsSync(syncScript)) {
        try {
          execSync(`npx ts-node "${syncScript}"`, {
            cwd: backendTsDir,
            stdio: 'pipe',
            env: {
              ...process.env,
              DATABASE_URL: prismaUrl,
              DB_PROVIDER: 'sqlite',
            },
          });
        } catch {
          // If syncProvider has already matched, continue
        }
      }

      // Execute prisma db push
      execSync('npx prisma db push --skip-generate', {
        cwd: backendTsDir,
        stdio: 'inherit',
        env: {
          ...process.env,
          DATABASE_URL: prismaUrl,
        },
      });

      console.log('  ✓ Schema verified & synchronized successfully.');
    } catch (pushErr) {
      console.error('[DB Setup Error] Failed to push schema to database:', pushErr);
      throw pushErr;
    }
  } else {
    console.log('\n[DB Setup] --seed-only passed: Skipping schema synchronization.');
  }

  // 6. Connect Prisma Client
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: prismaUrl,
      },
    },
    errorFormat: 'minimal',
  });

  try {
    // 7. Enforce SQLite Foreign Keys
    await enableSqliteForeignKeys(prisma);

    // 8. Transactional Seeding
    if (!options.noSeed) {
      console.log('\n[DB Setup] Seeding database within atomic transaction...');

      await prisma.$transaction(
        async (tx) => {
          console.log('\n[1/2] Seeding Baseline Operational Data:');
          const baseline = await seedBaselineData(tx);
          console.log(`  Baseline complete (${baseline.inserted} inserted, ${baseline.skipped} preserved).`);

          console.log('\n[2/2] Seeding Sample Development Data (Demo accounts, jobs, applications):');
          const sample = await seedSampleData(tx);
          console.log(
            `  Sample complete (${sample.employers} employers, ${sample.jobSeekers} seekers, ${sample.jobs} jobs, ${sample.applications} apps, ${sample.savedJobs} bookmarks, ${sample.notifications} notifs).`
          );
        },
        {
          maxWait: 10000,
          timeout: 30000,
        }
      );

      console.log('\n  ✓ All seed transactions committed successfully.');
    } else {
      console.log('\n[DB Setup] --no-seed passed: Skipping data seeding.');
    }

    console.log('\n================================================================================');
    console.log(' [SUCCESS] Database setup finished cleanly!');
    console.log(` Database: ${filePath}`);
    console.log(' Ready for immediate use:');
    console.log('   - Demo Seeker Login:   ivatan_guide / SeekerSecure123!');
    console.log('   - Demo Employer Login: batanes_inn / EmployerSecure123!');
    console.log('   - Admin SSR Portal:    admin / AdminSecure123! (http://localhost:8000/admin)');
    console.log('================================================================================\n');
  } finally {
    await prisma.$disconnect();
  }
}

// ---------------------------------------------------------------------------
// 4. Direct CLI Execution
// ---------------------------------------------------------------------------
if (require.main === module) {
  const options = parseArgs(process.argv.slice(2));
  initializeDatabase(options)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('\n[DB Setup Fatal Error]:', err instanceof Error ? err.message : err);
      process.exit(1);
    });
}
