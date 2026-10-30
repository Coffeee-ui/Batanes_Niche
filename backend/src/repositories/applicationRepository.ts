import { Prisma } from '@prisma/client';
import { prisma } from '../database/client';

export type ApplicationWithRelations = Prisma.ApplicationGetPayload<{
  include: {
    job: { include: { employer: { include: { employer_profile: true } } } };
    seeker: { include: { job_seeker_profile: true } };
  };
}>;

export class ApplicationRepository {
  static async getById(appId: number): Promise<ApplicationWithRelations | null> {
    return prisma.application.findUnique({
      where: { id: appId },
      include: {
        job: { include: { employer: { include: { employer_profile: true } } } },
        seeker: { include: { job_seeker_profile: true } },
      },
    });
  }

  static async getByJobAndSeeker(jobId: number, seekerId: number): Promise<ApplicationWithRelations | null> {
    return prisma.application.findUnique({
      where: {
        job_id_seeker_id: { job_id: jobId, seeker_id: seekerId },
      },
      include: {
        job: { include: { employer: { include: { employer_profile: true } } } },
        seeker: { include: { job_seeker_profile: true } },
      },
    });
  }

  static async create(data: Prisma.ApplicationCreateInput): Promise<ApplicationWithRelations> {
    return prisma.application.create({
      data,
      include: {
        job: { include: { employer: { include: { employer_profile: true } } } },
        seeker: { include: { job_seeker_profile: true } },
      },
    });
  }

  static async update(appId: number, data: Prisma.ApplicationUpdateInput): Promise<ApplicationWithRelations> {
    return prisma.application.update({
      where: { id: appId },
      data,
      include: {
        job: { include: { employer: { include: { employer_profile: true } } } },
        seeker: { include: { job_seeker_profile: true } },
      },
    });
  }

  static async listBySeeker(
    seekerId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<ApplicationWithRelations[]> {
    return prisma.application.findMany({
      where: { seeker_id: seekerId },
      include: {
        job: { include: { employer: { include: { employer_profile: true } } } },
        seeker: { include: { job_seeker_profile: true } },
      },
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limit,
    });
  }

  static async listByEmployer(
    employerId: number,
    jobId?: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<ApplicationWithRelations[]> {
    const where: Prisma.ApplicationWhereInput = {
      job: { employer_id: employerId },
    };
    if (jobId) {
      where.job_id = jobId;
    }

    return prisma.application.findMany({
      where,
      include: {
        job: { include: { employer: { include: { employer_profile: true } } } },
        seeker: { include: { job_seeker_profile: true } },
      },
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limit,
    });
  }

  static async hasActiveApplication(jobId: number, seekerId: number): Promise<boolean> {
    const existing = await prisma.application.findUnique({
      where: {
        job_id_seeker_id: { job_id: jobId, seeker_id: seekerId },
      },
      select: { id: true, status: true },
    });
    return existing !== null && existing.status !== 'withdrawn';
  }

  static async countApplications(): Promise<number> {
    return prisma.application.count();
  }
}
