import { z } from 'zod';
import { JobOutSchema } from './job';
import { PublicJobSeekerSummarySchema } from './user';

export const CandidateScoreOutSchema = z.object({
  candidate: PublicJobSeekerSummarySchema,
  skill_score: z.number(),
  geographic_score: z.number(),
  total_score: z.number(),
});

export type CandidateScoreOut = z.infer<typeof CandidateScoreOutSchema>;

export const CandidateRankingResponseSchema = z.object({
  tier_1: z.array(CandidateScoreOutSchema),
  tier_2: z.array(PublicJobSeekerSummarySchema),
});

export type CandidateRankingResponse = z.infer<typeof CandidateRankingResponseSchema>;

export const JobScoreOutSchema = z.object({
  job: JobOutSchema,
  skill_score: z.number(),
  geographic_score: z.number(),
  total_score: z.number(),
});

export type JobScoreOut = z.infer<typeof JobScoreOutSchema>;

export const JobRankingResponseSchema = z.object({
  tier_1: z.array(JobScoreOutSchema),
  tier_2: z.array(JobOutSchema),
});

export type JobRankingResponse = z.infer<typeof JobRankingResponseSchema>;
