import bcrypt from 'bcryptjs';
import { prisma, disconnectDatabase } from './client';
import { settings } from '../core/config';

export async function seedDatabase(): Promise<void> {
  console.log(`[Database Seed] Starting idempotent seed on ${settings.DB_PROVIDER.toUpperCase()} database...`);

  // 1. Seed Administrator
  const adminExists = await prisma.user.findUnique({
    where: { username: 'admin' },
  });

  if (!adminExists) {
    const passwordHash = await bcrypt.hash('AdminSecure123!', 12);
    await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@batanesniche.ph',
        password_hash: passwordHash,
        full_name: 'Platform Administrator',
        municipality: 'Basco',
        role: 'admin',
        account_status: 'active',
      },
    });
    console.log('[Database Seed] Created Administrator: admin (admin@batanesniche.ph)');
  } else {
    console.log('[Database Seed] Administrator already exists (skipping).');
  }

  // 2. Seed Employer (batanes_inn)
  let employer = await prisma.user.findUnique({
    where: { username: 'batanes_inn' },
    include: { employer_profile: true },
  });

  if (!employer) {
    const passwordHash = await bcrypt.hash('EmployerSecure123!', 12);
    employer = await prisma.user.create({
      data: {
        username: 'batanes_inn',
        email: 'manager@batanesinn.ph',
        password_hash: passwordHash,
        full_name: 'Maria Castillejos',
        phone_number: '09191234567',
        municipality: 'Basco',
        barangay: 'Kayvaluganan',
        role: 'employer',
        account_status: 'active',
        employer_profile: {
          create: {
            company_name: 'Batanes Seaside Inn & Tours',
            company_address: 'National Road, Basco, Batanes',
            company_description: 'Premier eco-tourism and authentic Ivatan hospitality lodge in Basco.',
            business_type: 'Tourism & Hospitality',
          },
        },
      },
      include: { employer_profile: true },
    });
    console.log('[Database Seed] Created Employer: batanes_inn (manager@batanesinn.ph)');
  } else {
    console.log('[Database Seed] Employer batanes_inn already exists (skipping).');
  }

  // Seed Canonical Jobs for batanes_inn
  if (employer) {
    const job1Exists = await prisma.job.findFirst({
      where: {
        employer_id: employer.id,
        title: 'Tour Guide & Heritage Coordinator',
      },
    });

    if (!job1Exists) {
      await prisma.job.create({
        data: {
          employer_id: employer.id,
          title: 'Tour Guide & Heritage Coordinator',
          description:
            'Lead heritage tours across Batan Island landmarks. Knowledge of Ivatan culture and eco-tourism required.',
          municipality: 'Basco',
          barangay: 'Kayvaluganan',
          salary_min: 18000.0,
          salary_max: 25000.0,
          employment_type: 'Full-time',
          required_skills: 'Tourism & Tour Guiding, Customer Service, Driving (Professional License)',
          status: 'active',
        },
      });
      console.log("[Database Seed] Seeded job: 'Tour Guide & Heritage Coordinator'");
    }

    const job2Exists = await prisma.job.findFirst({
      where: {
        employer_id: employer.id,
        title: 'Guest Services & Culinary Assistant',
      },
    });

    if (!job2Exists) {
      await prisma.job.create({
        data: {
          employer_id: employer.id,
          title: 'Guest Services & Culinary Assistant',
          description:
            'Support front desk hospitality and authentic Ivatan breakfast preparation for eco-lodge guests.',
          municipality: 'Basco',
          barangay: 'Chanarian',
          salary_min: 15000.0,
          salary_max: 20000.0,
          employment_type: 'Full-time',
          required_skills: 'Hotel & Hospitality, Culinary Arts & Cooking, Customer Service',
          status: 'active',
        },
      });
      console.log("[Database Seed] Seeded job: 'Guest Services & Culinary Assistant'");
    }
  }

  // 3. Seed Job Seeker (ivatan_guide)
  const seekerExists = await prisma.user.findUnique({
    where: { username: 'ivatan_guide' },
  });

  if (!seekerExists) {
    const passwordHash = await bcrypt.hash('SeekerSecure123!', 12);
    await prisma.user.create({
      data: {
        username: 'ivatan_guide',
        email: 'juan@batanesguide.ph',
        password_hash: passwordHash,
        full_name: 'Juan Abad',
        phone_number: '09289876543',
        municipality: 'Basco',
        barangay: 'San Antonio',
        role: 'job_seeker',
        account_status: 'active',
        skills: 'Tourism & Tour Guiding, Customer Service, Arc Welding',
        job_seeker_profile: {
          create: {
            bio: 'Passionate Ivatan certified tour guide with 4 years experience in Northern Batan and Sabtang cultural tours.',
            education: "Bachelor's Degree",
            experience_years: 4,
          },
        },
      },
    });
    console.log('[Database Seed] Created Job Seeker: ivatan_guide (juan@batanesguide.ph)');
  } else {
    console.log('[Database Seed] Job Seeker ivatan_guide already exists (skipping).');
  }

  console.log('[Database Seed] Database seeding completed successfully.');
}

// Allow direct CLI execution: ts-node src/database/seed.ts
if (require.main === module) {
  seedDatabase()
    .catch(err => {
      console.error('[Database Seed Error]:', err);
      process.exit(1);
    })
    .finally(() => disconnectDatabase());
}
