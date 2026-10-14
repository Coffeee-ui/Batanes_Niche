import { Router, Response, NextFunction } from 'express';
import { UserService } from '../../services/userService';
import { AuthenticatedRequest, requireAuthenticated } from '../deps';
import { UserProfileUpdateSchema } from '../../schemas/user';
import { HttpError } from '../../core/errors';

export const usersRouter = Router();

// GET /profile
usersRouter.get(
  '/profile',
  requireAuthenticated,
  (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const profile = UserService.getPrivateProfile(req.user!);
      res.status(200).json(profile);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /profile
usersRouter.put(
  '/profile',
  requireAuthenticated,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const updateData = UserProfileUpdateSchema.parse(req.body);
      const updated = await UserService.updateProfile(req.user!, updateData);
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// GET /job-seekers
usersRouter.get(
  '/job-seekers',
  requireAuthenticated,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user!.role !== 'employer' && req.user!.role !== 'admin') {
        throw new HttpError(403, 'Candidate directory is accessible only to employers and administrators.');
      }

      const municipality = (req.query.municipality as string) || null;
      const island = (req.query.island as string) || null;
      const skill = (req.query.skill as string) || null;
      const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '50', 10)));
      const offset = Math.max(0, parseInt((req.query.offset as string) || '0', 10));

      const candidates = await UserService.searchJobSeekers(municipality, island, skill, limit, offset);
      res.status(200).json(candidates);
    } catch (err) {
      next(err);
    }
  }
);
