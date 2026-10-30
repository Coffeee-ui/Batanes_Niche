import { Notification, Prisma } from '@prisma/client';
import { prisma } from '../database/client';

export class NotificationRepository {
  static async create(data: Prisma.NotificationCreateInput): Promise<Notification> {
    return prisma.notification.create({
      data,
    });
  }

  static async listByUser(userId: number, limit: number = 50): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }

  static async markAllRead(userId: number): Promise<number> {
    const res = await prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });
    return res.count;
  }

  static async countUnread(userId: number): Promise<number> {
    return prisma.notification.count({
      where: { user_id: userId, is_read: false },
    });
  }
}
