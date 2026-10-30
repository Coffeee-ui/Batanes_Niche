import { z } from 'zod';

export const JobCreateSchema = z.object({
  title: z.string().min(2).max(150),
  description: z.string().min(10),
  municipality: z.string().min(2).max(50),
  barangay: z.string().max(100).nullable().optional(),
  salary_min: z.number().nonnegative(),
  salary_max: z.number().nonnegative(),
  employment_type: z.string().max(50),
  required_skills: z.string().min(1),
});

export type JobCreate = z.infer<typeof JobCreateSchema>;

export const JobUpdateSchema = z.object({
  title: z.string().min(2).max(150).optional(),
  description: z.string().min(10).optional(),
  municipality: z.string().min(2).max(50).optional(),
  barangay: z.string().max(100).nullable().optional(),
  salary_min: z.number().nonnegative().optional(),
  salary_max: z.number().nonnegative().optional(),
  employment_type: z.string().max(50).optional(),
  required_skills: z.string().min(1).optional(),
  status: z.enum(['active', 'closed', 'draft']).optional(),
});

export type JobUpdate = z.infer<typeof JobUpdateSchema>;

export const JobOutSchema = z.object({
  id: z.number().int(),
  employer_id: z.number().int(),
  title: z.string(),
  description: z.string(),
  municipality: z.string(),
  island: z.string(),
  barangay: z.string().nullable().optional(),
  salary_min: z.number(),
  salary_max: z.number(),
  employment_type: z.string(),
  required_skills: z.string(),
  status: z.string(),
  created_at: z.string(),
  company_name: z.string().nullable().optional(),
  application_count: z.number().int().default(0),
});

export type JobOut = z.infer<typeof JobOutSchema>;

export const JobPreviewOutSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  salary_min: z.number(),
  salary_max: z.number(),
  required_skills: z.string(),
});

export type JobPreviewOut = z.infer<typeof JobPreviewOutSchema>;

export const SavedJobOutSchema = z.object({
  id: z.number().int(),
  saved_at: z.string(),
  job: JobOutSchema,
});

export type SavedJobOut = z.infer<typeof SavedJobOutSchema>;
