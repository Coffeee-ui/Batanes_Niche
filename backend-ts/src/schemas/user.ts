import { z } from 'zod';

export const EmployerProfileOutSchema = z.object({
  company_name: z.string(),
  company_address: z.string(),
  company_description: z.string().nullable().optional(),
  business_type: z.string(),
});

export type EmployerProfileOut = z.infer<typeof EmployerProfileOutSchema>;

export const JobSeekerProfileOutSchema = z.object({
  bio: z.string().nullable().optional(),
  education: z.string().nullable().optional(),
  experience_years: z.number().int().default(0),
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
});

export type PublicJobSeekerSummary = z.infer<typeof PublicJobSeekerSummarySchema>;

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

  // Job seeker fields
  bio: z.string().nullable().optional(),
  education: z.string().nullable().optional(),
  experience_years: z.number().int().nullable().optional(),

  // Employer fields
  company_name: z.string().optional(),
  company_address: z.string().optional(),
  company_description: z.string().nullable().optional(),
  business_type: z.string().optional(),
});

export type UserProfileUpdate = z.infer<typeof UserProfileUpdateSchema>;
