import { Notification } from '@prisma/client';
import { NotificationRepository } from '../repositories/notificationRepository';
import { NotificationOut } from '../schemas/notification';

export class NotificationService {
  static toNotificationOut(n: Notification): NotificationOut {
    return {
      id: n.id,
      user_id: n.user_id,
      title: n.title,
      message: n.message,
      type: n.type,
      is_read: n.is_read,
      link: n.link,
      created_at: n.created_at.toISOString(),
    };
  }

  static async createNotification(
    userId: number,
    title: string,
    message: string,
    type: string,
    link?: string | null
  ): Promise<Notification> {
    return NotificationRepository.create({
      user: { connect: { id: userId } },
      title,
      message,
      type,
      link: link || null,
    });
  }

  static async getUserNotifications(userId: number, limit: number = 50): Promise<NotificationOut[]> {
    const list = await NotificationRepository.listByUser(userId, limit);
    return list.map(this.toNotificationOut);
  }

  static async markAllRead(userId: number): Promise<number> {
    return NotificationRepository.markAllRead(userId);
  }

  static async getUnreadCount(userId: number): Promise<number> {
    return NotificationRepository.countUnread(userId);
  }
}
