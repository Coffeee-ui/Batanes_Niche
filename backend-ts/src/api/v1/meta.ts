import { Router, Request, Response, NextFunction } from 'express';
import { GeographyService } from '../../services/geographyService';
import {
  BUSINESS_TYPES,
  COMMON_SKILLS,
  EDUCATION_LEVELS,
  EMPLOYMENT_TYPES,
} from '../../core/constants';
import { MetadataOptionsOut } from '../../schemas/meta';

export const metaRouter = Router();

// GET /options
metaRouter.get(
  '/options',
  (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const data: MetadataOptionsOut = {
        hierarchy: GeographyService.getHierarchy(),
        municipalities: GeographyService.getMunicipalities(),
        skills: COMMON_SKILLS,
        education_levels: EDUCATION_LEVELS,
        employment_types: EMPLOYMENT_TYPES,
        business_types: BUSINESS_TYPES,
      };
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }
);
