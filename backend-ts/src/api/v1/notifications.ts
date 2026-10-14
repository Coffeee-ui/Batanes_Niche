import { Router, Response, NextFunction } from 'express';
import { NotificationService } from '../../services/notificationService';
import { AuthenticatedRequest, requireAuthenticated } from '../deps';

export const notificationsRouter = Router();

// GET / (list notifications)
notificationsRouter.get(
  '/',
  requireAuthenticated,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '50', 10)));
      const notifications = await NotificationService.getUserNotifications(req.user!.id, limit);
      res.status(200).json(notifications);
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
