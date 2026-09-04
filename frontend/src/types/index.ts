// ============================================================
// Shared TypeScript types for Batanes Niche Job Portal
// Aligned with Version 2 Single Source of Truth (Sections 8, 14, 15)
// ============================================================

export type UserRole = 'job_seeker' | 'employer' | 'admin';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone_number?: string;
  municipality: string;
  island: string;
  barangay?: string;
  skills?: string;
  profile_pic?: string;
  resume_url?: string;
  role: UserRole;
  account_status: string;
  profile_completeness: number;
  employer_profile?: EmployerProfile;
  job_seeker_profile?: JobSeekerProfile;
  created_at: string;
  // UI helpers
  phone?: string;
  bio?: string;
  is_active?: boolean;
  is_verified?: boolean;
}

export interface JobSeekerProfile {
  bio?: string;
  education?: string;
  experience_years?: number;
}

export interface EmployerProfile {
  company_name: string;
  company_address: string;
  company_description?: string;
  business_type: string;
}

export type JobStatus = 'active' | 'closed' | 'draft' | 'disabled';
export type EmploymentType = 'Full-time' | 'Part-time' | 'Contract' | 'Seasonal' | 'Freelance';

export interface Job {
  id: number;
  employer_id: number;
  title: string;
  description: string;
  municipality: string;
  island: string;
  barangay?: string;
  salary_min: number;
  salary_max: number;
  employment_type: EmploymentType;
  required_skills?: string;
  status: JobStatus;
  created_at: string;
  company_name?: string;
  employer_name?: string;
  application_count?: number;
}

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export interface EmployerApplicantProfile {
  seeker_id: number;
  full_name: string;
  email: string;
  phone_number?: string;
  municipality: string;
  island: string;
  barangay?: string;
  skills?: string;
  education?: string;
  experience_years: number;
  bio?: string;
  profile_pic?: string;
  resume_url?: string;
}

export interface Application {
  id: number;
  job_id: number;
  status: ApplicationStatus;
  cover_letter?: string;
  resume_url?: string;
  created_at: string;
  job?: Job;
  applicant?: EmployerApplicantProfile;
  // Flattened convenience properties for UI components
  job_title?: string;
  company_name?: string;
  seeker_name?: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface SavedJob {
  id: number;
  seeker_id: number;
  job_id: number;
  saved_at: string;
  job: Job;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
  role: string;
  username: string;
}

export interface LoginResponse extends Token {
  user?: User;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role: 'job_seeker' | 'employer';
  municipality: string;
  barangay?: string;
  phone_number?: string;
  phone?: string;
  skills?: string;
  bio?: string;
  company_name?: string;
  company_address?: string;
  company_description?: string;
  business_type?: string;
}

export interface LoginPayload {
  username_or_email: string;
  password: string;
  email?: string;
}

export interface JobCreate {
  title: string;
  description: string;
  municipality: string;
  barangay?: string;
  salary_min?: number;
  salary_max?: number;
  employment_type: EmploymentType;
  required_skills?: string;
}

export interface JobFilters {
  q?: string;
  keyword?: string;
  municipality?: string;
  island?: string;
  employment_type?: string;
  min_salary?: number;
  page?: number;
  page_size?: number;
}

export interface Candidate {
  id: number;
  full_name: string;
  municipality: string;
  island: string;
  barangay?: string;
  skills?: string;
  education?: string;
  experience_years: number;
  bio?: string;
  profile_pic?: string;
  profile_completeness?: number;
}

export interface ScoredCandidate {
  candidate: Candidate;
  skill_score: number;
  geographic_score: number;
  total_score: number;
}

export interface ScoredJob {
  job: Job;
  skill_score: number;
  geographic_score: number;
  total_score: number;
}

export interface CandidateRankingResponse {
  tier_1: ScoredCandidate[];
  tier_2: ScoredCandidate[];
}

export interface JobRankingResponse {
  tier_1: ScoredJob[];
  tier_2: ScoredJob[];
}

export interface MetadataOptions {
  hierarchy: Record<string, Record<string, string[]>>;
  municipalities: string[];
  skills: string[];
  education_levels: string[];
  employment_types: string[];
  business_types: string[];
}

export interface GeoMeta {
  municipalities: string[];
  barangays: Record<string, string[]>;
  islands: string[];
  employment_types: string[];
}

export interface ApiError {
  detail: string | Array<{ msg: string; loc?: string[] }>;
}
