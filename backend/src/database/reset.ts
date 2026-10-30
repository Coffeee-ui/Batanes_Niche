import { prisma, disconnectDatabase } from './client';
import { settings } from '../core/config';
import { seedDatabase } from './seed';

export async function resetDatabase(): Promise<void> {
  if (settings.ENVIRONMENT === 'production' || process.env.NODE_ENV === 'production') {
    throw new Error('[Database Reset] Refusing to reset database in production environment!');
  }

  console.log(`[Database Reset] Resetting ${settings.DB_PROVIDER.toUpperCase()} database (${settings.ENVIRONMENT})...`);

  // Delete child records first to respect foreign keys
  await prisma.auditLog.deleteMany();
  await prisma.errorReport.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.revokedToken.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.savedJob.deleteMany();
  await prisma.application.deleteMany();
  await prisma.job.deleteMany();
  await prisma.jobSeekerProfile.deleteMany();
  await prisma.employerProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log('[Database Reset] All tables cleared.');
  await seedDatabase();
  console.log('[Database Reset] Database reset & re-seeded successfully.');
}

if (require.main === module) {
  resetDatabase()
    .catch(err => {
      console.error('[Database Reset Error]:', err);
      process.exit(1);
    })
    .finally(() => disconnectDatabase());
}
