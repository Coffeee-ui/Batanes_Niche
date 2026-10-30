import { Prisma } from '@prisma/client';
import { prisma } from '../database/client';
import { MUNICIPALITY_TO_ISLAND } from '../core/geography';

export type JobWithRelations = Prisma.JobGetPayload<{
  include: {
    employer: { include: { employer_profile: true } };
    applications: true;
  };
}>;

export class JobRepository {
  static async getById(jobId: number, includeDeleted: boolean = false): Promise<JobWithRelations | null> {
    const where: Prisma.JobWhereInput = { id: jobId };
    if (!includeDeleted) {
      where.deleted_at = null;
    }
    return prisma.job.findFirst({
      where,
      include: {
        employer: { include: { employer_profile: true } },
        applications: true,
      },
    });
  }

  static async create(data: Prisma.JobCreateInput): Promise<JobWithRelations> {
    return prisma.job.create({
      data,
      include: {
        employer: { include: { employer_profile: true } },
        applications: true,
      },
    });
  }

  static async update(jobId: number, data: Prisma.JobUpdateInput): Promise<JobWithRelations> {
    return prisma.job.update({
      where: { id: jobId },
      data,
      include: {
        employer: { include: { employer_profile: true } },
        applications: true,
      },
    });
  }

  static async listActiveJobs(
    municipality?: string | null,
    island?: string | null,
    keyword?: string | null,
    employmentType?: string | null,
    limit: number = 50,
    offset: number = 0
  ): Promise<JobWithRelations[]> {
    const where: Prisma.JobWhereInput = {
      status: 'active',
      deleted_at: null,
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

    if (keyword) {
      const kw = keyword.trim();
      where.OR = [
        { title: { contains: kw } },
        { description: { contains: kw } },
        { required_skills: { contains: kw } },
      ];
    }

    if (employmentType) {
      where.employment_type = { equals: employmentType.trim() };
    }

    return prisma.job.findMany({
      where,
      include: {
        employer: { include: { employer_profile: true } },
        applications: true,
      },
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limit,
    });
  }

  static async listByEmployer(
    employerId: number,
    includeClosed: boolean = true,
    limit: number = 50,
    offset: number = 0
  ): Promise<JobWithRelations[]> {
    const where: Prisma.JobWhereInput = {
      employer_id: employerId,
    };

    if (!includeClosed) {
      where.status = 'active';
      where.deleted_at = null;
    }

    return prisma.job.findMany({
      where,
      include: {
        employer: { include: { employer_profile: true } },
        applications: true,
      },
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limit,
    });
  }

  static async listAllForAdmin(
    status?: string | null,
    limit: number = 50,
    offset: number = 0
  ): Promise<JobWithRelations[]> {
    const where: Prisma.JobWhereInput = {};
    if (status) {
      where.status = status;
    }

    return prisma.job.findMany({
      where,
      include: {
        employer: { include: { employer_profile: true } },
        applications: true,
      },
      orderBy: { id: 'desc' },
      skip: offset,
      take: limit,
    });
  }

  static async countActiveJobs(): Promise<number> {
    return prisma.job.count({
      where: {
        status: 'active',
        deleted_at: null,
      },
    });
  }
}
