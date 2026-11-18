import { PrismaClient, Prisma } from '@prisma/client';
import { hashPassword } from './utils';

export interface SeedResult {
  inserted: number;
  skipped: number;
}

/**
 * Seeds required baseline data (Platform Administrator for backend SSR portal).
 * Idempotent: Skips creation if the administrator account already exists.
 */
export async function seedBaselineData(
  prisma: PrismaClient | Prisma.TransactionClient
): Promise<SeedResult> {
  let inserted = 0;
  let skipped = 0;

  const env = (process.env.ENVIRONMENT || process.env.NODE_ENV || 'development').toLowerCase();
  const isProduction = env === 'production' || env === 'prod';
  const adminEmail = process.env.ADMIN_INITIAL_EMAIL?.trim() || 'admin@batanesniche.ph';
  const plainPassword = process.env.ADMIN_INITIAL_PASSWORD?.trim() || (isProduction ? null : 'AdminSecure123!');

  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [{ username: 'admin' }, { email: adminEmail }],
    },
  });

  if (!existingAdmin) {
    if (!plainPassword) {
      throw new Error(
        '[DB Seed Error] In production, ADMIN_INITIAL_PASSWORD must be provided in environment variables to create the administrator account.'
      );
    }

    const passwordHash = await hashPassword(plainPassword);
    const adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        email: adminEmail,
        password_hash: passwordHash,
        full_name: 'Platform Administrator',
        municipality: 'Basco',
        barangay: 'San Antonio',
        role: 'admin',
        account_status: 'active',
      },
    });

    await prisma.auditLog.create({
      data: {
        actor_id: adminUser.id,
        actor_role: 'admin',
        action: 'SYSTEM_BASELINE_INIT',
        target_type: 'user',
        target_id: adminUser.id,
        details: JSON.stringify({ message: 'Platform Administrator created during baseline seed.' }),
      },
    });

    console.log('  ✓ Created Administrator: admin (admin@batanesniche.ph)');
    inserted++;
  } else {
    console.log('  - Administrator already exists (skipping).');
    skipped++;
  }

  return { inserted, skipped };
}
