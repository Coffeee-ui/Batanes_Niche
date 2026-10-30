import { Router, Response, NextFunction } from 'express';
import { JobService } from '../../services/jobService';
import {
  AuthenticatedRequest,
  requireAuthenticated,
  requireJobSeekerContext,
} from '../deps';
import { HttpError } from '../../core/errors';

export const savedJobsRouter = Router();

// GET / (list saved jobs)
savedJobsRouter.get(
  '/',
  requireAuthenticated,
  requireJobSeekerContext,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const savedJobs = await JobService.listSavedJobs(req.user!);
      res.status(200).json(savedJobs);
    } catch (err) {
      next(err);
    }
  }
);

// POST /:jobId (bookmark job)
savedJobsRouter.post(
  '/:jobId',
  requireAuthenticated,
  requireJobSeekerContext,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = parseInt(req.params.jobId, 10);
      if (isNaN(jobId)) {
        throw new HttpError(404, 'Job not found.');
      }
      await JobService.saveJob(req.user!, jobId);
      res.status(201).json({ message: 'Job successfully saved.' });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /:jobId (remove bookmark)
savedJobsRouter.delete(
  '/:jobId',
  requireAuthenticated,
  requireJobSeekerContext,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = parseInt(req.params.jobId, 10);
      if (isNaN(jobId)) {
        throw new HttpError(404, 'Job not found.');
      }
      await JobService.removeSavedJob(req.user!, jobId);
      res.status(200).json({ message: 'Job bookmark successfully removed.' });
    } catch (err) {
      next(err);
    }
  }
);
