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
    const clean = identifier.trim().toLowerCase();
    // Case-insensitive match on username or email
    const users = await prisma.user.findMany({
      include: { employer_profile: true, job_seeker_profile: true },
    });
    return (
      users.find(
        u => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean
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
    limit: number = 50,
    offset: number = 0
  ): Promise<UserWithProfiles[]> {
    const where: Prisma.UserWhereInput = {
      role: 'job_seeker',
      account_status: 'active',
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

    return prisma.user.findMany({
      where,
      include: { employer_profile: true, job_seeker_profile: true },
      orderBy: { full_name: 'asc' },
      skip: offset,
      take: limit,
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
