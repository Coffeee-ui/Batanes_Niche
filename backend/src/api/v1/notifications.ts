import { Router, Response, NextFunction } from 'express';
import { NotificationService } from '../../services/notificationService';
import { AuthenticatedRequest, requireAuthenticated } from '../deps';

export const notificationsRouter = Router();

// GET / (list notifications with category filter)
notificationsRouter.get(
  '/',
  requireAuthenticated,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = (req.query.category as string) || null;
      const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '50', 10)));
      const notifications = await NotificationService.getUserNotifications(req.user!.id, category, limit);
      res.status(200).json(notifications);
    } catch (err) {
      next(err);
    }
  }
);

// GET /unread-count
notificationsRouter.get(
  '/unread-count',
  requireAuthenticated,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const count = await NotificationService.getUnreadCount(req.user!.id);
      res.status(200).json({ unread_count: count });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /read (mark all read)
notificationsRouter.put(
  '/read',
  requireAuthenticated,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const count = await NotificationService.markAllRead(req.user!.id);
      res.status(200).json({ message: `Marked ${count} notifications as read.` });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /bulk (bulk delete notifications)
notificationsRouter.delete(
  '/bulk',
  requireAuthenticated,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ids: number[] = Array.isArray(req.body.ids) ? req.body.ids.map((id: any) => parseInt(id, 10)) : [];
      if (!ids.length) {
        res.status(400).json({ message: 'No notification IDs provided' });
        return;
      }
      const count = await NotificationService.bulkDeleteNotifications(ids, req.user!.id);
      res.status(200).json({ message: `Deleted ${count} notifications.` });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /:id/read (mark single notification read)
notificationsRouter.put(
  '/:id/read',
  requireAuthenticated,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid notification ID' });
        return;
      }
      await NotificationService.markRead(id, req.user!.id);
      res.status(200).json({ message: 'Notification marked as read.' });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /:id (delete single notification)
notificationsRouter.delete(
  '/:id',
  requireAuthenticated,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid notification ID' });
        return;
      }
      const deleted = await NotificationService.deleteNotification(id, req.user!.id);
      if (!deleted) {
        res.status(404).json({ message: 'Notification not found' });
        return;
      }
      res.status(200).json({ message: 'Notification deleted.' });
    } catch (err) {
      next(err);
    }
  }
);
