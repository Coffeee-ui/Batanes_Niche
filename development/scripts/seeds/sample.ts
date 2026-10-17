import { PrismaClient, Prisma } from '@prisma/client';
import { hashPassword } from './utils';

export interface SampleSeedSummary {
  employers: number;
  jobSeekers: number;
  jobs: number;
  applications: number;
  savedJobs: number;
  notifications: number;
}

/**
 * Seeds realistic development sample data for Batanes Niche Job Portal.
 * Includes canonical Demo Mode accounts (batanes_inn and ivatan_guide).
 * Fully idempotent.
 */
export async function seedSampleData(
  prisma: PrismaClient | Prisma.TransactionClient
): Promise<SampleSeedSummary> {
  const summary: SampleSeedSummary = {
    employers: 0,
    jobSeekers: 0,
    jobs: 0,
    applications: 0,
    savedJobs: 0,
    notifications: 0,
  };

  const defaultEmployerPassword = await hashPassword('EmployerSecure123!');
  const defaultSeekerPassword = await hashPassword('SeekerSecure123!');

  // ============================================================================
  // 1. EMPLOYERS
  // ============================================================================
  const employerDefs = [
    {
      username: 'batanes_inn', // Canonical Demo Employer
      email: 'manager@batanesinn.ph',
      fullName: 'Maria Castillejos',
      phone: '09191234567',
      municipality: 'Basco',
      barangay: 'Kayvaluganan',
      companyName: 'Batanes Seaside Inn & Tours',
      companyAddress: 'National Road, Basco, Batanes',
      companyDescription: 'Premier eco-tourism and authentic Ivatan hospitality lodge in Basco.',
      businessType: 'Tourism & Hospitality',
    },
    {
      username: 'bacasejos',
      email: 'jesi.bacasejos@gmail.com',
      fullName: 'Jessie Bacasejos',
      phone: '09201112233',
      municipality: 'Sabtang',
      barangay: 'Sinakan',
      companyName: 'Sabtang Crafts & Fishery Cooperative',
      companyAddress: 'Port Road, Sinakan, Sabtang, Batanes',
      companyDescription: 'Community cooperative promoting authentic traditional Ivatan stone craftsmanship, woven vakul, and sustainable coastal fishing.',
      businessType: 'Arts, Crafts & Agriculture',
    },
    {
      username: 'leklek',
      email: 'lexterlampas@gmail.com',
      fullName: 'Lexter Lampas',
      phone: '09358889900',
      municipality: 'Itbayat',
      barangay: 'San Rafael',
      companyName: 'Itbayat Agro-Livestock Development',
      companyAddress: 'Mayoyao Ridge, Itbayat, Batanes',
      companyDescription: 'Highland pasture livestock farming and native garlic harvesting across the northernmost island municipality.',
      businessType: 'Agriculture & Farming',
    },
  ];

  const employerMap = new Map<string, number>();

  for (const emp of employerDefs) {
    let user = await prisma.user.findUnique({
      where: { username: emp.username },
      include: { employer_profile: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          username: emp.username,
          email: emp.email,
          password_hash: defaultEmployerPassword,
          full_name: emp.fullName,
          phone_number: emp.phone,
          municipality: emp.municipality,
          barangay: emp.barangay,
          role: 'employer',
          account_status: 'active',
          employer_profile: {
            create: {
              company_name: emp.companyName,
              company_address: emp.companyAddress,
              company_description: emp.companyDescription,
              business_type: emp.businessType,
            },
          },
        },
        include: { employer_profile: true },
      });
      console.log(`  ✓ Created Employer: ${emp.username} (${emp.companyName})`);
      summary.employers++;
    } else {
      console.log(`  - Employer ${emp.username} already exists (skipping).`);
    }
    employerMap.set(emp.username, user.id);
  }

  // ============================================================================
  // 2. JOB SEEKERS
  // ============================================================================
  const seekerDefs = [
    {
      username: 'ivatan_guide', // Canonical Demo Seeker
      email: 'juan@batanesguide.ph',
      fullName: 'Juan Abad',
      phone: '09289876543',
      municipality: 'Basco',
      barangay: 'San Antonio',
      skills: 'Tourism & Tour Guiding, Customer Service, Driving (Professional License)',
      bio: 'Passionate Ivatan certified tour guide with 4 years experience in Northern Batan and Sabtang cultural tours.',
      education: "Bachelor's Degree",
      experienceYears: 4,
    },
    {
      username: 'gabotero',
      email: 'gab.joland@gmail.com',
      fullName: 'Joland Gabotero',
      phone: '09475556677',
      municipality: 'Sabtang',
      barangay: 'Chavayan',
      skills: 'Arc Welding, Construction & Carpentry, Boat Operation & Seamanship',
      bio: 'Experienced craftsman and technician specialized in metal fabrication and maritime transport across the Bashi Channel.',
      education: 'Vocational / Technical Certificate',
      experienceYears: 6,
    },
    {
      username: 'elena_florez',
      email: 'elena@batanes.ph',
      fullName: 'Elena Florez',
      phone: '09562223344',
      municipality: 'Mahatao',
      barangay: 'Uvoy',
      skills: 'Culinary Arts & Cooking, Hotel & Hospitality, Inventory & Bookkeeping',
      bio: 'Hospitality specialist with hands-on experience in farm-to-table culinary preparation and guest relations for boutique homestays.',
      education: 'Associate Degree in Hospitality Management',
      experienceYears: 3,
    },
  ];

  const seekerMap = new Map<string, number>();

  for (const seeker of seekerDefs) {
    let user = await prisma.user.findUnique({
      where: { username: seeker.username },
      include: { job_seeker_profile: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          username: seeker.username,
          email: seeker.email,
          password_hash: defaultSeekerPassword,
          full_name: seeker.fullName,
          phone_number: seeker.phone,
          municipality: seeker.municipality,
          barangay: seeker.barangay,
          role: 'job_seeker',
          account_status: 'active',
          skills: seeker.skills,
          job_seeker_profile: {
            create: {
              bio: seeker.bio,
              education: seeker.education,
              experience_years: seeker.experienceYears,
            },
          },
        },
        include: { job_seeker_profile: true },
      });
      console.log(`  ✓ Created Job Seeker: ${seeker.username} (${seeker.fullName})`);
      summary.jobSeekers++;
    } else {
      console.log(`  - Job Seeker ${seeker.username} already exists (skipping).`);
    }
    seekerMap.set(seeker.username, user.id);
  }

  // ============================================================================
  // 3. JOBS
  // ============================================================================
  const jobDefs = [
    {
      employerUsername: 'batanes_inn',
      title: 'Tour Guide & Heritage Coordinator',
      description: 'Lead heritage tours across Batan Island landmarks including Marlboro Hills, Honshu Lighthouse, and Fundacion Pacita. Knowledge of Ivatan culture and eco-tourism ethics required.',
      municipality: 'Basco',
      barangay: 'Kayvaluganan',
      salaryMin: 18000.0,
      salaryMax: 25000.0,
      employmentType: 'Full-time',
      requiredSkills: 'Tourism & Tour Guiding, Customer Service, Driving (Professional License)',
      status: 'active',
    },
    {
      employerUsername: 'batanes_inn',
      title: 'Guest Services & Culinary Assistant',
      description: 'Support front desk hospitality, guest check-in, and authentic Ivatan breakfast preparation for eco-lodge visitors. Warm demeanor and food safety knowledge required.',
      municipality: 'Basco',
      barangay: 'Chanarian',
      salaryMin: 15000.0,
      salaryMax: 20000.0,
      employmentType: 'Full-time',
      requiredSkills: 'Hotel & Hospitality, Culinary Arts & Cooking, Customer Service',
      status: 'active',
    },
    {
      employerUsername: 'leklek',
      title: 'Organic Farming & Livestock Caretaker',
      description: 'Manage pasture cattle rotation, organic native garlic cultivation, and root crop storage across upland Itbayat fields. Experience with livestock health is preferred.',
      municipality: 'Itbayat',
      barangay: 'San Rafael',
      salaryMin: 16000.0,
      salaryMax: 22000.0,
      employmentType: 'Full-time',
      requiredSkills: 'Agriculture & Farming, Physical Labor, Animal Husbandry',
      status: 'active',
    },
    {
      employerUsername: 'bacasejos',
      title: 'Handicraft Artisan & Woodworker',
      description: 'Craft traditional souvenir items, authentic stone-house miniatures, and indigenous bamboo/rattan products. Training and apprenticeship provided to motivated applicants.',
      municipality: 'Sabtang',
      barangay: 'Sinakan',
      salaryMin: 14000.0,
      salaryMax: 19000.0,
      employmentType: 'Full-time',
      requiredSkills: 'Construction & Carpentry, Handicrafts & Weaving, Creative Arts',
      status: 'active',
    },
    {
      employerUsername: 'bacasejos',
      title: 'Coastal Boat Navigator & Cargo Hand',
      description: 'Assist in seasonal inter-island passenger and supply transit between Ivana port and Sabtang. Must have sea endurance and basic safety certifications.',
      municipality: 'Sabtang',
      barangay: 'Sinakan',
      salaryMin: 17000.0,
      salaryMax: 24000.0,
      employmentType: 'Part-time',
      requiredSkills: 'Boat Operation & Seamanship, Physical Labor, Safety & First Aid',
      status: 'active',
    },
  ];

  const jobMap = new Map<string, number>();

  for (const j of jobDefs) {
    const employerId = employerMap.get(j.employerUsername);
    if (!employerId) continue;

    let job = await prisma.job.findFirst({
      where: {
        employer_id: employerId,
        title: j.title,
      },
    });

    if (!job) {
      job = await prisma.job.create({
        data: {
          employer_id: employerId,
          title: j.title,
          description: j.description,
          municipality: j.municipality,
          barangay: j.barangay,
          salary_min: j.salaryMin,
          salary_max: j.salaryMax,
          employment_type: j.employmentType,
          required_skills: j.requiredSkills,
          status: j.status,
        },
      });
      console.log(`  ✓ Seeded Job: '${j.title}' (${j.municipality})`);
      summary.jobs++;
    } else {
      console.log(`  - Job '${j.title}' already exists (skipping).`);
    }
    jobMap.set(j.title, job.id);
  }

  // ============================================================================
  // 4. APPLICATIONS
  // ============================================================================
  const appDefs = [
    {
      jobTitle: 'Tour Guide & Heritage Coordinator',
      seekerUsername: 'ivatan_guide',
      status: 'accepted',
      coverLetter: 'I have been guiding cultural tours for 4 years across Batanes. I am passionate about Ivatan preservation and look forward to coordinating heritage programs.',
    },
    {
      jobTitle: 'Organic Farming & Livestock Caretaker',
      seekerUsername: 'gabotero',
      status: 'pending',
      coverLetter: 'I have extensive hands-on experience in farm carpentry, fence building, and livestock care on Sabtang island.',
    },
    {
      jobTitle: 'Guest Services & Culinary Assistant',
      seekerUsername: 'elena_florez',
      status: 'pending',
      coverLetter: 'Certified in culinary preparation with 3 years hospitality experience welcoming guests to authentic Batanes homestays.',
    },
  ];

  for (const app of appDefs) {
    const jobId = jobMap.get(app.jobTitle);
    const seekerId = seekerMap.get(app.seekerUsername);
    if (!jobId || !seekerId) continue;

    const existingApp = await prisma.application.findUnique({
      where: {
        job_id_seeker_id: {
          job_id: jobId,
          seeker_id: seekerId,
        },
      },
    });

    if (!existingApp) {
      await prisma.application.create({
        data: {
          job_id: jobId,
          seeker_id: seekerId,
          status: app.status,
          cover_letter: app.coverLetter,
        },
      });
      console.log(`  ✓ Seeded Application: ${app.seekerUsername} -> '${app.jobTitle}' [${app.status}]`);
      summary.applications++;
    } else {
      console.log(`  - Application for '${app.jobTitle}' already exists (skipping).`);
    }
  }

  // ============================================================================
  // 5. SAVED JOBS (BOOKMARKS)
  // ============================================================================
  const savedJobDefs = [
    { seekerUsername: 'ivatan_guide', jobTitle: 'Guest Services & Culinary Assistant' },
    { seekerUsername: 'gabotero', jobTitle: 'Tour Guide & Heritage Coordinator' },
  ];

  for (const sj of savedJobDefs) {
    const seekerId = seekerMap.get(sj.seekerUsername);
    const jobId = jobMap.get(sj.jobTitle);
    if (!seekerId || !jobId) continue;

    const existingSaved = await prisma.savedJob.findUnique({
      where: {
        seeker_id_job_id: {
          seeker_id: seekerId,
          job_id: jobId,
        },
      },
    });

    if (!existingSaved) {
      await prisma.savedJob.create({
        data: {
          seeker_id: seekerId,
          job_id: jobId,
        },
      });
      console.log(`  ✓ Seeded Bookmark: ${sj.seekerUsername} saved '${sj.jobTitle}'`);
      summary.savedJobs++;
    }
  }

  // ============================================================================
  // 6. NOTIFICATIONS
  // ============================================================================
  const notifDefs = [
    {
      username: 'batanes_inn',
      title: 'New Application Received',
      message: "Juan Abad submitted an application for 'Tour Guide & Heritage Coordinator'.",
      type: 'new_application',
      link: '/applications',
      isRead: true,
    },
    {
      username: 'ivatan_guide',
      title: 'Application Accepted',
      message: "Congratulations! Your application for 'Tour Guide & Heritage Coordinator' at Batanes Seaside Inn & Tours has been accepted.",
      type: 'application_status_updated',
      link: '/applications',
      isRead: false,
    },
    {
      username: 'leklek',
      title: 'New Application Received',
      message: "Joland Gabotero submitted an application for 'Organic Farming & Livestock Caretaker'.",
      type: 'new_application',
      link: '/applications',
      isRead: false,
    },
  ];

  for (const n of notifDefs) {
    const userId = employerMap.get(n.username) || seekerMap.get(n.username);
    if (!userId) continue;

    const existingNotif = await prisma.notification.findFirst({
      where: {
        user_id: userId,
        title: n.title,
      },
    });

    if (!existingNotif) {
      await prisma.notification.create({
        data: {
          user_id: userId,
          title: n.title,
          message: n.message,
          type: n.type,
          link: n.link,
          is_read: n.isRead,
        },
      });
      console.log(`  ✓ Seeded Notification: for ${n.username} ('${n.title}')`);
      summary.notifications++;
    }
  }

  return summary;
}
