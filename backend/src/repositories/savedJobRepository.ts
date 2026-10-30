import { Prisma } from '@prisma/client';
import { prisma } from '../database/client';

export type SavedJobWithRelations = Prisma.SavedJobGetPayload<{
  include: {
    job: {
      include: {
        employer: { include: { employer_profile: true } };
        applications: true;
      };
    };
  };
}>;

export class SavedJobRepository {
  static async getBySeekerAndJob(seekerId: number, jobId: number): Promise<SavedJobWithRelations | null> {
    return prisma.savedJob.findUnique({
      where: {
        seeker_id_job_id: { seeker_id: seekerId, job_id: jobId },
      },
      include: {
        job: {
          include: {
            employer: { include: { employer_profile: true } },
            applications: true,
          },
        },
      },
    });
  }

  static async create(seekerId: number, jobId: number): Promise<SavedJobWithRelations> {
    return prisma.savedJob.create({
      data: {
        seeker: { connect: { id: seekerId } },
        job: { connect: { id: jobId } },
      },
      include: {
        job: {
          include: {
            employer: { include: { employer_profile: true } },
            applications: true,
          },
        },
      },
    });
  }

  static async delete(seekerId: number, jobId: number): Promise<void> {
    await prisma.savedJob.delete({
      where: {
        seeker_id_job_id: { seeker_id: seekerId, job_id: jobId },
      },
    });
  }

  static async listBySeeker(seekerId: number): Promise<SavedJobWithRelations[]> {
    return prisma.savedJob.findMany({
      where: { seeker_id: seekerId },
      include: {
        job: {
          include: {
            employer: { include: { employer_profile: true } },
            applications: true,
          },
        },
      },
      orderBy: { saved_at: 'desc' },
    });
  }
}
