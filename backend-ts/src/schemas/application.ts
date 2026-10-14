import { z } from 'zod';
import { JobOutSchema } from './job';
import { EmployerApplicantProfileSchema } from './user';

export const ApplicationCreateSchema = z.object({
  job_id: z.number().int(),
  cover_letter: z.string().nullable().optional(),
  resume_url: z.string().nullable().optional(),
});

export type ApplicationCreate = z.infer<typeof ApplicationCreateSchema>;

export const ApplicationUpdateSchema = z.object({
  status: z.enum(['pending', 'accepted', 'rejected']),
});

export type ApplicationUpdate = z.infer<typeof ApplicationUpdateSchema>;

export const SeekerApplicationOutSchema = z.object({
  id: z.number().int(),
  job_id: z.number().int(),
  status: z.string(),
  cover_letter: z.string().nullable().optional(),
  resume_url: z.string().nullable().optional(),
  created_at: z.string(),
  job: JobOutSchema.nullable().optional(),
});

export type SeekerApplicationOut = z.infer<typeof SeekerApplicationOutSchema>;

export const EmployerApplicationOutSchema = z.object({
  id: z.number().int(),
  job_id: z.number().int(),
  status: z.string(),
  cover_letter: z.string().nullable().optional(),
  resume_url: z.string().nullable().optional(),
  created_at: z.string(),
  applicant: EmployerApplicantProfileSchema,
});

export type EmployerApplicationOut = z.infer<typeof EmployerApplicationOutSchema>;
