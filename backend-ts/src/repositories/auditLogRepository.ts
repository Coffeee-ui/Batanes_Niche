import { AuditLog, Prisma } from '@prisma/client';
import { prisma } from '../database/client';

export class AuditLogRepository {
  static async create(data: Prisma.AuditLogCreateInput): Promise<AuditLog> {
    return prisma.auditLog.create({
      data,
    });
  }

  static async listLogs(limit: number = 50, offset: number = 0): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      skip: offset,
      take: limit,
    });
  }

  static async countLogs(): Promise<number> {
    return prisma.auditLog.count();
  }
}
