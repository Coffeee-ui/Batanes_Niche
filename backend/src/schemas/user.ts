import { z } from 'zod';

export const EmployerProfileOutSchema = z.object({
  company_name: z.string(),
  company_address: z.string(),
  company_description: z.string().nullable().optional(),
  business_type: z.string(),
  industry: z.string().nullable().optional(),
  onboarding_completed: z.boolean().default(false),
  walkthrough_dismissed: z.boolean().default(false),
});

export type EmployerProfileOut = z.infer<typeof EmployerProfileOutSchema>;

export const JobSeekerProfileOutSchema = z.object({
  bio: z.string().nullable().optional(),
  education: z.string().nullable().optional(),
  experience_years: z.number().int().default(0),
  desired_employment_type: z.string().nullable().optional(),
  work_experience: z.string().nullable().optional(),
  date_of_birth: z.string().nullable().optional(),
  is_discoverable: z.boolean().default(true),
  onboarding_completed: z.boolean().default(false),
  walkthrough_dismissed: z.boolean().default(false),
});

export type JobSeekerProfileOut = z.infer<typeof JobSeekerProfileOutSchema>;

export const PublicJobSeekerSummarySchema = z.object({
  id: z.number().int(),
  full_name: z.string(),
  municipality: z.string(),
  island: z.string(),
  barangay: z.string().nullable().optional(),
  skills: z.string().nullable().optional(),
  education: z.string().nullable().optional(),
  experience_years: z.number().int().default(0),
  bio: z.string().nullable().optional(),
  profile_pic: z.string().nullable().optional(),
  desired_employment_type: z.string().nullable().optional(),
  is_discoverable: z.boolean().default(true),
});

export type PublicJobSeekerSummary = z.infer<typeof PublicJobSeekerSummarySchema>;

export const PublicEmployerSummarySchema = z.object({
  id: z.number().int(),
  company_name: z.string(),
  company_address: z.string(),
  company_description: z.string().nullable().optional(),
  business_type: z.string(),
  industry: z.string().nullable().optional(),
  municipality: z.string(),
  island: z.string(),
  active_vacancies_count: z.number().int().default(0),
});

export type PublicEmployerSummary = z.infer<typeof PublicEmployerSummarySchema>;

export const PrivateUserProfileSchema = z.object({
  id: z.number().int(),
  username: z.string(),
  email: z.string(),
  full_name: z.string(),
  phone_number: z.string().nullable().optional(),
  municipality: z.string(),
  island: z.string(),
  barangay: z.string().nullable().optional(),
  skills: z.string().nullable().optional(),
  profile_pic: z.string().nullable().optional(),
  resume_url: z.string().nullable().optional(),
  role: z.string(),
  account_status: z.string(),
  profile_completeness: z.number().int(),
  date_of_birth: z.string().nullable().optional(),
  desired_employment_type: z.string().nullable().optional(),
  work_experience: z.string().nullable().optional(),
  is_discoverable: z.boolean().default(true),
  onboarding_completed: z.boolean().default(false),
  walkthrough_dismissed: z.boolean().default(false),
  notification_preferences: z.string().nullable().optional(),
  language_preference: z.string().default('en'),
  employer_profile: EmployerProfileOutSchema.nullable().optional(),
  job_seeker_profile: JobSeekerProfileOutSchema.nullable().optional(),
  created_at: z.string(),
});

export type PrivateUserProfile = z.infer<typeof PrivateUserProfileSchema>;

export const EmployerApplicantProfileSchema = z.object({
  seeker_id: z.number().int(),
  full_name: z.string(),
  email: z.string(),
  phone_number: z.string().nullable().optional(),
  municipality: z.string(),
  island: z.string(),
  barangay: z.string().nullable().optional(),
  skills: z.string().nullable().optional(),
  education: z.string().nullable().optional(),
  experience_years: z.number().int().default(0),
  bio: z.string().nullable().optional(),
  profile_pic: z.string().nullable().optional(),
  resume_url: z.string().nullable().optional(),
  date_of_birth: z.string().nullable().optional(),
  desired_employment_type: z.string().nullable().optional(),
});

export type EmployerApplicantProfile = z.infer<typeof EmployerApplicantProfileSchema>;

export const UserProfileUpdateSchema = z.object({
  full_name: z.string().optional(),
  phone_number: z.string().nullable().optional(),
  municipality: z.string().optional(),
  barangay: z.string().nullable().optional(),
  skills: z.string().nullable().optional(),
  profile_pic: z.string().nullable().optional(),
  resume_url: z.string().nullable().optional(),
  date_of_birth: z.string().nullable().optional(),
  desired_employment_type: z.string().nullable().optional(),
  work_experience: z.string().nullable().optional(),
  is_discoverable: z.boolean().optional(),
  onboarding_completed: z.boolean().optional(),
  walkthrough_dismissed: z.boolean().optional(),
  notification_preferences: z.string().nullable().optional(),
  language_preference: z.string().optional(),

  // Job seeker fields
  bio: z.string().nullable().optional(),
  education: z.string().nullable().optional(),
  experience_years: z.number().int().nullable().optional(),

  // Employer fields
  company_name: z.string().optional(),
  company_address: z.string().optional(),
  company_description: z.string().nullable().optional(),
  business_type: z.string().optional(),
  industry: z.string().nullable().optional(),
});

export type UserProfileUpdate = z.infer<typeof UserProfileUpdateSchema>;
