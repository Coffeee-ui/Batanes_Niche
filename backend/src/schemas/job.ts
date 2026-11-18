import { z } from 'zod';

export const JobStatusEnum = z.enum([
  'draft',
  'published',
  'paused',
  'closed',
  'archived',
  'active', // backward-compatibility alias for published
]);

export const SalaryTypeEnum = z.enum(['fixed', 'range', 'negotiable', 'undisclosed']);
export const SalaryPeriodEnum = z.enum(['hourly', 'daily', 'monthly', 'yearly']);
export const WorkArrangementEnum = z.enum(['on_site', 'hybrid', 'remote']);

export const JobCreateSchema = z
  .object({
    title: z.string().min(2).max(150),
    description: z.string().min(10),
    municipality: z.string().min(2).max(50),
    barangay: z.string().max(100).nullable().optional(),
    street_or_landmark: z.string().max(150).nullable().optional(),
    work_arrangement: WorkArrangementEnum.default('on_site'),
    multiple_locations: z.union([z.string(), z.boolean()]).nullable().optional(),
    employment_type: z.string().max(50),
    experience_level: z.string().max(50).nullable().optional(),
    salary_type: SalaryTypeEnum.default('range'),
    salary_period: SalaryPeriodEnum.default('monthly'),
    salary_min: z.number().nonnegative().default(0),
    salary_max: z.number().nonnegative().default(0),
    benefits: z.string().nullable().optional(),
    application_deadline: z.string().nullable().optional(),
    application_questions: z.union([z.string(), z.array(z.string())]).nullable().optional(), // JSON encoded string array or array
    required_skills: z.string().min(1),
    status: JobStatusEnum.default('published'),
    is_featured: z.boolean().default(false),
  })
  .refine(
    data => {
      if (data.salary_type === 'range' && data.salary_min && data.salary_max) {
        return data.salary_min <= data.salary_max;
      }
      return true;
    },
    {
      message: 'Minimum salary cannot exceed maximum salary.',
      path: ['salary_min'],
    }
  );

export type JobCreate = z.infer<typeof JobCreateSchema>;

export const JobUpdateSchema = z
  .object({
    title: z.string().min(2).max(150).optional(),
    description: z.string().min(10).optional(),
    municipality: z.string().min(2).max(50).optional(),
    barangay: z.string().max(100).nullable().optional(),
    street_or_landmark: z.string().max(150).nullable().optional(),
    work_arrangement: WorkArrangementEnum.optional(),
    multiple_locations: z.union([z.string(), z.boolean()]).nullable().optional(),
    employment_type: z.string().max(50).optional(),
    experience_level: z.string().max(50).nullable().optional(),
    salary_type: SalaryTypeEnum.optional(),
    salary_period: SalaryPeriodEnum.optional(),
    salary_min: z.number().nonnegative().optional(),
    salary_max: z.number().nonnegative().optional(),
    benefits: z.string().nullable().optional(),
    application_deadline: z.string().nullable().optional(),
    application_questions: z.union([z.string(), z.array(z.string())]).nullable().optional(),
    required_skills: z.string().min(1).optional(),
    status: JobStatusEnum.optional(),
    is_featured: z.boolean().optional(),
    close_option: z.enum(['reviewing', 'ended']).optional(),
  })
  .refine(
    data => {
      if (data.salary_min !== undefined && data.salary_max !== undefined) {
        return data.salary_min <= data.salary_max;
      }
      return true;
    },
    {
      message: 'Minimum salary cannot exceed maximum salary.',
      path: ['salary_min'],
    }
  );

export type JobUpdate = z.infer<typeof JobUpdateSchema>;

export const JobCloseRequestSchema = z.object({
  close_option: z.enum(['reviewing', 'ended']),
});

export type JobCloseRequest = z.infer<typeof JobCloseRequestSchema>;

export const JobStatsOutSchema = z.object({
  total_applications: z.number().int(),
  by_status: z.record(z.number().int()),
});

export type JobStatsOut = z.infer<typeof JobStatsOutSchema>;

export const JobOutSchema = z.object({
  id: z.number().int(),
  employer_id: z.number().int(),
  title: z.string(),
  description: z.string(),
  municipality: z.string(),
  island: z.string(),
  barangay: z.string().nullable().optional(),
  street_or_landmark: z.string().nullable().optional(),
  work_arrangement: z.string().nullable().optional(),
  multiple_locations: z.string().nullable().optional(),
  employment_type: z.string(),
  experience_level: z.string().nullable().optional(),
  salary_type: z.string().default('range'),
  salary_period: z.string().default('monthly'),
  salary_min: z.number(),
  salary_max: z.number(),
  benefits: z.string().nullable().optional(),
  application_deadline: z.string().nullable().optional(),
  application_questions: z.string().nullable().optional(),
  required_skills: z.string(),
  status: z.string(),
  is_featured: z.boolean().default(false),
  close_option: z.string().nullable().optional(),
  created_at: z.string(),
  company_name: z.string().nullable().optional(),
  company_address: z.string().nullable().optional(),
  company_description: z.string().nullable().optional(),
  application_count: z.number().int().default(0),
  stats: JobStatsOutSchema.optional(),
});

export type JobOut = z.infer<typeof JobOutSchema>;

export const JobPreviewOutSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  salary_min: z.number(),
  salary_max: z.number(),
  salary_type: z.string().default('range'),
  salary_period: z.string().default('monthly'),
  required_skills: z.string(),
});

export type JobPreviewOut = z.infer<typeof JobPreviewOutSchema>;

export const SavedJobOutSchema = z.object({
  id: z.number().int(),
  saved_at: z.string(),
  job: JobOutSchema,
});

export type SavedJobOut = z.infer<typeof SavedJobOutSchema>;
