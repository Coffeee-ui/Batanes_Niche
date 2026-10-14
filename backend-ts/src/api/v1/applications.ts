import { Router, Response, NextFunction } from 'express';
import { ApplicationService } from '../../services/applicationService';
import {
  AuthenticatedRequest,
  requireAuthenticated,
  requireJobSeekerContext,
} from '../deps';
import { ApplicationCreateSchema, ApplicationUpdateSchema } from '../../schemas/application';
import { HttpError } from '../../core/errors';

export const applicationsRouter = Router();

// POST / (submit application)
applicationsRouter.post(
  '/',
  requireAuthenticated,
  requireJobSeekerContext,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appData = ApplicationCreateSchema.parse(req.body);
      const application = await ApplicationService.submitApplication(req.user!, appData);
      res.status(201).json(application);
    } catch (err) {
      next(err);
    }
  }
);

// GET / (list applications for current user)
applicationsRouter.get(
  '/',
  requireAuthenticated,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '50', 10)));
      const offset = Math.max(0, parseInt((req.query.offset as string) || '0', 10));

      const applications = await ApplicationService.listApplications(req.user!, limit, offset);
      res.status(200).json(applications);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /:appId (update application status by employer)
applicationsRouter.put(
  '/:appId',
  requireAuthenticated,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appId = parseInt(req.params.appId, 10);
      if (isNaN(appId)) {
        throw new HttpError(404, 'Application not found.');
      }
      const updateData = ApplicationUpdateSchema.parse(req.body);
      const updated = await ApplicationService.updateApplicationStatus(appId, req.user!, updateData);
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  }
);
