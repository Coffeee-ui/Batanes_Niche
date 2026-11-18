import { Prisma } from '@prisma/client';
import { prisma } from '../database/client';
import { MUNICIPALITY_TO_ISLAND } from '../core/geography';

export type UserWithProfiles = Prisma.UserGetPayload<{
  include: { employer_profile: true; job_seeker_profile: true };
}>;

export class UserRepository {
  static async getById(userId: number): Promise<UserWithProfiles | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      include: { employer_profile: true, job_seeker_profile: true },
    });
  }

  static async getByUsername(username: string): Promise<UserWithProfiles | null> {
    return prisma.user.findFirst({
      where: { username: { equals: username } },
      include: { employer_profile: true, job_seeker_profile: true },
    });
  }

  static async getByEmail(email: string): Promise<UserWithProfiles | null> {
    return prisma.user.findFirst({
      where: { email: { equals: email.trim().toLowerCase() } },
      include: { employer_profile: true, job_seeker_profile: true },
    });
  }

  static async getByUsernameOrEmail(identifier: string): Promise<UserWithProfiles | null> {
    const clean = identifier.trim();
    const cleanLower = clean.toLowerCase();

    // Fast indexed lookup: exact username (case-preserved or lowered) or lowercase email
    const exactMatch = await prisma.user.findFirst({
      where: {
        OR: [
          { username: clean },
          { username: cleanLower },
          { email: cleanLower },
        ],
      },
      include: { employer_profile: true, job_seeker_profile: true },
    });
    if (exactMatch) return exactMatch;

    // Fallback: limited candidates matching prefix to preserve case-insensitive login without scanning full DB
    const prefix = cleanLower.slice(0, 3);
    const candidates = await prisma.user.findMany({
      where: {
        OR: [
          { username: { startsWith: prefix } },
          { email: { startsWith: prefix } },
        ],
      },
      take: 25,
      include: { employer_profile: true, job_seeker_profile: true },
    });

    return (
      candidates.find(
        u => u.username.toLowerCase() === cleanLower || u.email.toLowerCase() === cleanLower
      ) || null
    );
  }

  static async create(
    userData: Prisma.UserCreateInput,
    employerProfile?: Prisma.EmployerProfileCreateWithoutUserInput,
    jobSeekerProfile?: Prisma.JobSeekerProfileCreateWithoutUserInput
  ): Promise<UserWithProfiles> {
    return prisma.user.create({
      data: {
        ...userData,
        employer_profile: employerProfile ? { create: employerProfile } : undefined,
        job_seeker_profile: jobSeekerProfile ? { create: jobSeekerProfile } : undefined,
      },
      include: { employer_profile: true, job_seeker_profile: true },
    });
  }

  static async update(
    userId: number,
    userData: Prisma.UserUpdateInput,
    employerProfile?: Prisma.EmployerProfileUpdateWithoutUserInput,
    jobSeekerProfile?: Prisma.JobSeekerProfileUpdateWithoutUserInput
  ): Promise<UserWithProfiles> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        ...userData,
        employer_profile: employerProfile
          ? {
              upsert: {
                create: employerProfile as Prisma.EmployerProfileCreateWithoutUserInput,
                update: employerProfile,
              },
            }
          : undefined,
        job_seeker_profile: jobSeekerProfile
          ? {
              upsert: {
                create: jobSeekerProfile as Prisma.JobSeekerProfileCreateWithoutUserInput,
                update: jobSeekerProfile,
              },
            }
          : undefined,
      },
      include: { employer_profile: true, job_seeker_profile: true },
    });
  }

  static async listJobSeekers(
    municipality?: string | null,
    island?: string | null,
    skill?: string | null,
    education?: string | null,
    experienceYears?: number | null,
    desiredEmploymentType?: string | null,
    limit: number = 50,
    offset: number = 0
  ): Promise<UserWithProfiles[]> {
    const where: Prisma.UserWhereInput = {
      role: 'job_seeker',
      account_status: 'active',
      is_discoverable: true,
    };

    if (municipality) {
      where.municipality = { equals: municipality.trim() };
    }

    if (island) {
      const munsOnIsland = Object.entries(MUNICIPALITY_TO_ISLAND)
        .filter(([_, isl]) => isl.toLowerCase() === island.trim().toLowerCase())
        .map(([mun]) => mun);
      where.municipality = { in: munsOnIsland };
    }

    if (skill) {
      where.skills = { contains: skill.trim() };
    }

    if (desiredEmploymentType) {
      where.desired_employment_type = { contains: desiredEmploymentType.trim() };
    }

    if (education || (experienceYears !== null && experienceYears !== undefined)) {
      where.job_seeker_profile = {
        ...(education ? { education: { contains: education.trim() } } : {}),
        ...(experienceYears !== null && experienceYears !== undefined
          ? { experience_years: { gte: experienceYears } }
          : {}),
      };
    }

    return prisma.user.findMany({
      where,
      include: { employer_profile: true, job_seeker_profile: true },
      orderBy: { full_name: 'asc' },
      skip: offset,
      take: limit,
    });
  }

  static async listEmployers(
    company?: string | null,
    industry?: string | null,
    municipality?: string | null,
    limit: number = 50,
    offset: number = 0
  ): Promise<Array<UserWithProfiles & { _count: { jobs: number } }>> {
    const where: Prisma.UserWhereInput = {
      role: 'employer',
      account_status: 'active',
    };

    if (municipality) {
      where.municipality = { equals: municipality.trim() };
    }

    if (company || industry) {
      where.employer_profile = {
        ...(company ? { company_name: { contains: company.trim() } } : {}),
        ...(industry
          ? {
              OR: [
                { industry: { contains: industry.trim() } },
                { business_type: { contains: industry.trim() } },
              ],
            }
          : {}),
      };
    }

    return prisma.user.findMany({
      where,
      include: {
        employer_profile: true,
        job_seeker_profile: true,
        _count: {
          select: {
            jobs: {
              where: {
                status: { in: ['published', 'active'] },
                deleted_at: null,
              },
            },
          },
        },
      },
      orderBy: { full_name: 'asc' },
      skip: offset,
      take: limit,
    });
  }

  // Saved Candidates
  static async saveCandidate(employerId: number, candidateId: number) {
    return prisma.savedCandidate.upsert({
      where: {
        employer_id_candidate_id: {
          employer_id: employerId,
          candidate_id: candidateId,
        },
      },
      update: {},
      create: {
        employer_id: employerId,
        candidate_id: candidateId,
      },
    });
  }

  static async removeSavedCandidate(employerId: number, candidateId: number) {
    return prisma.savedCandidate.deleteMany({
      where: {
        employer_id: employerId,
        candidate_id: candidateId,
      },
    });
  }

  static async listSavedCandidates(employerId: number) {
    const saved = await prisma.savedCandidate.findMany({
      where: { employer_id: employerId },
      include: {
        candidate: {
          include: { job_seeker_profile: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
    // Filter out candidates who disabled discoverability or are not active
    return saved.filter(
      s => s.candidate.account_status === 'active' && s.candidate.is_discoverable
    );
  }

  // Followed Employers
  static async followEmployer(seekerId: number, employerId: number) {
    return prisma.followedEmployer.upsert({
      where: {
        seeker_id_employer_id: {
          seeker_id: seekerId,
          employer_id: employerId,
        },
      },
      update: {},
      create: {
        seeker_id: seekerId,
        employer_id: employerId,
      },
    });
  }

  static async unfollowEmployer(seekerId: number, employerId: number) {
    return prisma.followedEmployer.deleteMany({
      where: {
        seeker_id: seekerId,
        employer_id: employerId,
      },
    });
  }

  static async isFollowingEmployer(seekerId: number, employerId: number): Promise<boolean> {
    const count = await prisma.followedEmployer.count({
      where: { seeker_id: seekerId, employer_id: employerId },
    });
    return count > 0;
  }

  static async listFollowedEmployers(seekerId: number) {
    return prisma.followedEmployer.findMany({
      where: { seeker_id: seekerId },
      include: {
        employer: {
          include: { employer_profile: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  // User Reports
  static async createReport(
    reporterId: number,
    targetType: string,
    targetId: number,
    reason: string,
    details?: string | null
  ) {
    return prisma.userReport.create({
      data: {
        reporter_id: reporterId,
        target_type: targetType,
        target_id: targetId,
        reason,
        details: details || null,
      },
    });
  }

  static async countUsers(role?: string | null, status?: string | null): Promise<number> {
    const where: Prisma.UserWhereInput = {};
    if (role) where.role = role;
    if (status) where.account_status = status;
    return prisma.user.count({ where });
  }

  static async listUsersForAdmin(
    query?: string | null,
    role?: string | null,
    status?: string | null,
    limit: number = 50,
    offset: number = 0
  ): Promise<UserWithProfiles[]> {
    const where: Prisma.UserWhereInput = {};

    if (role) where.role = role;
    if (status) where.account_status = status;

    if (query) {
      const q = query.trim();
      where.OR = [
        { username: { contains: q } },
        { email: { contains: q } },
        { full_name: { contains: q } },
      ];
    }

    return prisma.user.findMany({
      where,
      include: { employer_profile: true, job_seeker_profile: true },
      orderBy: { id: 'desc' },
      skip: offset,
      take: limit,
    });
  }
}
