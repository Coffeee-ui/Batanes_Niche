import { z } from 'zod';
import { JobOutSchema } from './job';
import { EmployerApplicantProfileSchema } from './user';

export const PipelineStageEnum = z.enum([
  'new',
  'submitted', // alias for new
  'reviewing',
  'shortlisted',
  'interview',
  'hired',
  'rejected',
  'withdrawn',
]);

export const ApplicationCreateSchema = z.object({
  job_id: z.number().int(),
  cover_letter: z.string().nullable().optional(),
  resume_url: z.string().nullable().optional(),
  answers: z.string().nullable().optional(), // JSON-stringified answers
});

export type ApplicationCreate = z.infer<typeof ApplicationCreateSchema>;

export const ApplicationUpdateSchema = z.object({
  status: PipelineStageEnum,
});

export type ApplicationUpdate = z.infer<typeof ApplicationUpdateSchema>;

export const InterviewInviteSchema = z.object({
  interview_date: z.string().min(1, 'Interview date and time are required.'),
  interview_type: z.enum(['in_person', 'online']),
  interview_location: z.string().min(2, 'Location or meeting link is required.'),
  interview_message: z.string().nullable().optional(),
});

export type InterviewInvite = z.infer<typeof InterviewInviteSchema>;

export const InterviewResponseSchema = z.object({
  response: z.enum(['accepted', 'declined']),
});

export type InterviewResponse = z.infer<typeof InterviewResponseSchema>;

export const RejectionRequestSchema = z.object({
  rejection_template: z.string().nullable().optional(),
  rejection_message: z.string().nullable().optional(),
});

export type RejectionRequest = z.infer<typeof RejectionRequestSchema>;

export const SeekerApplicationOutSchema = z.object({
  id: z.number().int(),
  job_id: z.number().int(),
  status: z.string(), // displayed as "Submitted" if 'new'
  stage: z.string().nullable().optional(),
  cover_letter: z.string().nullable().optional(),
  resume_url: z.string().nullable().optional(),
  answers: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().nullable().optional(),
  withdrawn_at: z.string().nullable().optional(),
  interview_date: z.string().nullable().optional(),
  interview_type: z.string().nullable().optional(),
  interview_location: z.string().nullable().optional(),
  interview_message: z.string().nullable().optional(),
  interview_status: z.string().nullable().optional(),
  rejection_message: z.string().nullable().optional(),
  job: JobOutSchema.nullable().optional(),
});

export type SeekerApplicationOut = z.infer<typeof SeekerApplicationOutSchema>;

export const EmployerApplicationOutSchema = z.object({
  id: z.number().int(),
  job_id: z.number().int(),
  status: z.string(),
  stage: z.string().nullable().optional(),
  cover_letter: z.string().nullable().optional(),
  resume_url: z.string().nullable().optional(),
  answers: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().nullable().optional(),
  withdrawn_at: z.string().nullable().optional(),
  interview_date: z.string().nullable().optional(),
  interview_type: z.string().nullable().optional(),
  interview_location: z.string().nullable().optional(),
  interview_message: z.string().nullable().optional(),
  interview_status: z.string().nullable().optional(),
  rejection_template: z.string().nullable().optional(),
  rejection_message: z.string().nullable().optional(),
  applicant: EmployerApplicantProfileSchema,
  job: JobOutSchema.nullable().optional(),
});

export type EmployerApplicationOut = z.infer<typeof EmployerApplicationOutSchema>;

