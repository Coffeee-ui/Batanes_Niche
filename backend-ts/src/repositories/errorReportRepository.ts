import { ErrorReport, Prisma } from '@prisma/client';
import { prisma } from '../database/client';

export class ErrorReportRepository {
  static async create(data: Prisma.ErrorReportCreateInput): Promise<ErrorReport> {
    return prisma.errorReport.create({
      data,
    });
  }

  static async listReports(limit: number = 50, offset: number = 0): Promise<ErrorReport[]> {
    return prisma.errorReport.findMany({
      orderBy: { timestamp: 'desc' },
      skip: offset,
      take: limit,
    });
  }
}
