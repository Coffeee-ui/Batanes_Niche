import { Notification } from '@prisma/client';
import { NotificationRepository } from '../repositories/notificationRepository';
import { NotificationOut } from '../schemas/notification';

export class NotificationService {
  static toNotificationOut(n: Notification): NotificationOut {
    let category = 'account';
    const typeStr = (n.type || '').toLowerCase();
    if (typeStr.includes('application')) category = 'applications';
    else if (typeStr.includes('interview')) category = 'interviews';
    else if (typeStr.includes('job') || typeStr.includes('vacancy')) category = 'jobs';

    return {
      id: n.id,
      user_id: n.user_id,
      title: n.title,
      message: n.message,
      type: n.type,
      category,
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

  static async getUserNotifications(userId: number, category?: string | null, limit: number = 50): Promise<NotificationOut[]> {
    const list = await NotificationRepository.listByUser(userId, limit);
    let mapped = list.map(this.toNotificationOut);
    if (category) {
      mapped = mapped.filter(n => n.category.toLowerCase() === category.toLowerCase());
    }
    return mapped;
  }

  static async markRead(notificationId: number, userId: number): Promise<boolean> {
    return NotificationRepository.markRead(notificationId, userId);
  }

  static async markAllRead(userId: number): Promise<number> {
    return NotificationRepository.markAllRead(userId);
  }

  static async getUnreadCount(userId: number): Promise<number> {
    return NotificationRepository.countUnread(userId);
  }

  static async deleteNotification(notificationId: number, userId: number): Promise<boolean> {
    return NotificationRepository.delete(notificationId, userId);
  }

  static async bulkDeleteNotifications(notificationIds: number[], userId: number): Promise<number> {
    return NotificationRepository.bulkDelete(notificationIds, userId);
  }
}
