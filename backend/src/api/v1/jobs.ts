import { Router, Response, NextFunction } from 'express';
import { JobService } from '../../services/jobService';
import {
  AuthenticatedRequest,
  authenticateOptional,
  requireAuthenticated,
  requireEmployerContext,
} from '../deps';
import { JobCloseRequestSchema, JobCreateSchema, JobUpdateSchema } from '../../schemas/job';
import { HttpError } from '../../core/errors';

export const jobsRouter = Router();

// GET /featured (featured jobs for homepage)
jobsRouter.get(
  '/featured',
  async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobs = await JobService.listFeaturedJobs();
      res.status(200).json(jobs);
    } catch (err) {
      next(err);
    }
  }
);

// GET /recommended (recommended jobs for seeker)
jobsRouter.get(
  '/recommended',
  authenticateOptional,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || '10', 10)));
      const jobs = await JobService.listRecommendedJobs(req.user, limit);
      res.status(200).json(jobs);
    } catch (err) {
      next(err);
    }
  }
);

// GET /preview
jobsRouter.get(
  '/preview',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '50', 10)));
      const offset = Math.max(0, parseInt((req.query.offset as string) || '0', 10));
      const previews = await JobService.listActiveJobsPreview(limit, offset);
      res.status(200).json(previews);
    } catch (err) {
      next(err);
    }
  }
);

// GET / (list active jobs or preview)
jobsRouter.get(
  '/',
  authenticateOptional,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '50', 10)));
      const offset = Math.max(0, parseInt((req.query.offset as string) || '0', 10));

      const municipality = (req.query.municipality as string) || null;
      const island = (req.query.island as string) || null;
      const keyword = (req.query.keyword as string) || (req.query.q as string) || null;
      const employmentType = (req.query.employment_type as string) || null;
      const category = (req.query.category as string) || null;

      // Whitelist safe sort options
      const rawSort = (req.query.sort as string) || 'newest';
      const allowedSorts = ['newest', 'salary_desc', 'salary_asc'];
      const sort = allowedSorts.includes(rawSort) ? rawSort : 'newest';

      const total = await JobService.countActiveJobs(municipality, island, keyword, employmentType, category);
      res.setHeader('X-Total-Count', total.toString());
      res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count');

      if (!req.user) {
        const previews = await JobService.listActiveJobsPreview(limit, offset, sort, category);
        res.status(200).json(previews);
        return;
      }

      if (req.user.role === 'employer') {
        throw new HttpError(403, 'Employers cannot browse job seeker listings.');
      }

      const jobs = await JobService.listActiveJobs(municipality, island, keyword, employmentType, limit, offset, sort, category);
      res.status(200).json(jobs);
    } catch (err) {
      next(err);
    }
  }
);

// POST / (create job)
jobsRouter.post(
  '/',
  requireAuthenticated,
  requireEmployerContext,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobData = JobCreateSchema.parse(req.body);
      const created = await JobService.createJob(req.user!, jobData);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  }
);

// GET /my (employer's jobs)
jobsRouter.get(
  '/my',
  requireAuthenticated,
  requireEmployerContext,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const includeClosed = req.query.include_closed !== 'false';
      const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '50', 10)));
      const offset = Math.max(0, parseInt((req.query.offset as string) || '0', 10));

      const jobs = await JobService.listEmployerJobs(req.user!.id, includeClosed, limit, offset);
      res.status(200).json(jobs);
    } catch (err) {
      next(err);
    }
  }
);

// GET /:jobId/stats (vacancy application stats)
jobsRouter.get(
  '/:jobId/stats',
  requireAuthenticated,
  requireEmployerContext,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = parseInt(req.params.jobId, 10);
      if (isNaN(jobId)) {
        throw new HttpError(404, 'Job posting not found.');
      }
      const stats = await JobService.getJobStats(jobId, req.user!);
      res.status(200).json(stats);
    } catch (err) {
      next(err);
    }
  }
);

// POST /:jobId/close (close vacancy with options)
jobsRouter.post(
  '/:jobId/close',
  requireAuthenticated,
  requireEmployerContext,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = parseInt(req.params.jobId, 10);
      if (isNaN(jobId)) {
        throw new HttpError(404, 'Job posting not found.');
      }
      const body = JobCloseRequestSchema.parse(req.body);
      const updated = await JobService.closeJob(jobId, req.user!, body.close_option);
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /:jobId/status (change vacancy status)
jobsRouter.put(
  '/:jobId/status',
  requireAuthenticated,
  requireEmployerContext,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = parseInt(req.params.jobId, 10);
      if (isNaN(jobId)) {
        throw new HttpError(404, 'Job posting not found.');
      }
      const status = req.body.status;
      if (!status || typeof status !== 'string') {
        throw new HttpError(400, 'Valid status is required.');
      }
      const updated = await JobService.updateJobStatus(jobId, req.user!, status);
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// GET /:jobId (allow public guest access)
jobsRouter.get(
  '/:jobId',
  authenticateOptional,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = parseInt(req.params.jobId, 10);
      if (isNaN(jobId)) {
        throw new HttpError(404, 'Job posting not found.');
      }
      const job = await JobService.getJobById(jobId, req.user);
      res.status(200).json(job);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /:jobId
jobsRouter.put(
  '/:jobId',
  requireAuthenticated,
  requireEmployerContext,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = parseInt(req.params.jobId, 10);
      if (isNaN(jobId)) {
        throw new HttpError(404, 'Job posting not found.');
      }
      const updateData = JobUpdateSchema.parse(req.body);
      const updated = await JobService.updateJob(jobId, req.user!, updateData);
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /:jobId
jobsRouter.delete(
  '/:jobId',
  requireAuthenticated,
  requireEmployerContext,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = parseInt(req.params.jobId, 10);
      if (isNaN(jobId)) {
        throw new HttpError(404, 'Job posting not found.');
      }
      await JobService.softDeleteJob(jobId, req.user!);
      res.status(200).json({ message: 'Job posting successfully closed and archived.' });
    } catch (err) {
      next(err);
    }
  }
);
