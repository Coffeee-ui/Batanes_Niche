import { Router, Response, NextFunction } from 'express';
import { RecommendationService } from '../../services/recommendationService';
import { JobService } from '../../services/jobService';
import {
  AuthenticatedRequest,
  requireAuthenticated,
  requireEmployerContext,
  requireJobSeekerContext,
} from '../deps';

export const recommendationsRouter = Router();

// GET /candidates (employer candidate recommendations)
recommendationsRouter.get(
  '/candidates',
  requireAuthenticated,
  requireEmployerContext,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const targetMun = (req.query.municipality as string) || user.municipality;
      const targetBgy = (req.query.barangay as string) || user.barangay;
      let neededSkills = (req.query.skills as string) || '';

      if (!neededSkills) {
        const activeJobs = await JobService.listEmployerJobs(user.id, false);
        const allSkills = activeJobs
          .map(j => j.required_skills)
          .filter(Boolean);
        neededSkills = allSkills.join(', ');
      }

      const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '50', 10)));
      const ranking = await RecommendationService.rankCandidates(neededSkills, targetMun, targetBgy, limit);
      res.status(200).json(ranking);
    } catch (err) {
      next(err);
    }
  }
);

// GET /jobs-ranked (job seeker ranked job recommendations)
recommendationsRouter.get(
  '/jobs-ranked',
  requireAuthenticated,
  requireJobSeekerContext,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '50', 10)));
      const ranking = await RecommendationService.rankJobsForSeeker(req.user!, limit);
      res.status(200).json(ranking);
    } catch (err) {
      next(err);
    }
  }
);
