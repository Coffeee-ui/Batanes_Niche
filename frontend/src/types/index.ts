// ============================================================
// Shared TypeScript types for Batanes Niche Job Portal
// Aligned with Version 2 Single Source of Truth & Reference UI
// ============================================================

export type UserRole = 'job_seeker' | 'employer';

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
  date_of_birth?: string;
  desired_employment_type?: string;
  work_experience?: string;
  is_discoverable?: boolean;
  onboarding_completed?: boolean;
  walkthrough_dismissed?: boolean;
  notification_preferences?: string;
  language_preference?: string;
  deactivated_at?: string;
  deletion_requested_at?: string;
  employer_profile?: EmployerProfile;
  job_seeker_profile?: JobSeekerProfile;
  created_at: string;
  // UI helpers
  company_name?: string;
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
  industry?: string;
  onboarding_completed?: boolean;
  walkthrough_dismissed?: boolean;
}

export type JobStatus = 'draft' | 'published' | 'paused' | 'closed' | 'archived' | 'active';
export type EmploymentType = 'Full-time' | 'Part-time' | 'Contract' | 'Seasonal' | 'Freelance';
export type SalaryType = 'range' | 'exact' | 'negotiable';
export type SalaryPeriod = 'hourly' | 'daily' | 'monthly' | 'project';
export type WorkArrangement = 'on-site' | 'hybrid' | 'remote';

export interface Job {
  id: number;
  employer_id: number;
  title: string;
  description: string;
  municipality: string;
  island: string;
  barangay?: string;
  street_or_landmark?: string;
  work_arrangement?: WorkArrangement | string;
  multiple_locations?: boolean | string;
  salary_min: number;
  salary_max: number;
  salary_type?: SalaryType | string;
  salary_period?: SalaryPeriod | string;
  employment_type: EmploymentType | string;
  experience_level?: string;
  benefits?: string;
  application_deadline?: string;
  application_questions?: string[] | string;
  required_skills?: string;
  category?: string;
  status: JobStatus;
  is_featured?: boolean;
  close_option?: 'reviewing' | 'ended';
  created_at: string;
  company_name?: string;
  company_address?: string;
  company_description?: string;
  employer_name?: string;
  application_count?: number;
  stats?: JobStats;
}

export interface JobStats {
  total_applications: number;
  by_status: Record<string, number>;
}

export interface JobPreview {
  id: number;
  title: string;
  salary_min: number;
  salary_max: number;
  salary_type?: string;
  salary_period?: string;
  required_skills?: string;
  category?: string;
}

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'new' | 'reviewing' | 'shortlisted' | 'interview' | 'hired';
export type PipelineStage = 'new' | 'reviewing' | 'shortlisted' | 'interview' | 'hired' | 'rejected';

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
  desired_employment_type?: string;
  work_experience?: string;
}

export interface Application {
  id: number;
  job_id: number;
  seeker_id?: number;
  status: ApplicationStatus;
  stage?: PipelineStage;
  cover_letter?: string;
  answers?: string;
  resume_url?: string;
  created_at: string;
  updated_at?: string;
  withdrawn_at?: string;
  rejection_template?: string;
  rejection_message?: string;
  interview_date?: string;
  interview_type?: string;
  interview_location?: string;
  interview_message?: string;
  interview_status?: 'pending' | 'accepted' | 'declined';
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
  category?: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  application_updates: boolean;
  interview_invitations: boolean;
  account_updates: boolean;
  followed_employers_vacancies: boolean;
  new_applications: boolean;
  interview_responses: boolean;
  vacancy_updates: boolean;
}

export interface SavedJob {
  id: number;
  seeker_id: number;
  job_id: number;
  saved_at: string;
  job: Job;
}

export interface Employer {
  id: number;
  company_name: string;
  company_address: string;
  company_description?: string;
  business_type?: string;
  industry?: string;
  municipality: string;
  island: string;
  barangay?: string;
  profile_pic?: string;
  active_vacancies_count: number;
}

export interface FollowedEmployer {
  id: number;
  employer_id: number;
  followed_at: string;
  employer: Employer;
}

export interface SavedCandidate {
  id: number;
  candidate_id: number;
  saved_at: string;
  candidate: Candidate;
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

export interface DemoRoleInfo {
  role: UserRole;
  label: string;
  description: string;
}

export interface DemoStatusResponse {
  enabled: boolean;
  roles: DemoRoleInfo[];
}

export interface RegisterPayload {
  username?: string;
  email: string;
  password: string;
  full_name: string;
  role: 'job_seeker' | 'employer';
  municipality?: string;
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
  street_or_landmark?: string;
  work_arrangement?: string;
  multiple_locations?: boolean | string;
  salary_min: number;
  salary_max: number;
  salary_type?: string;
  salary_period?: string;
  employment_type: string;
  experience_level?: string;
  benefits?: string;
  application_deadline?: string;
  application_questions?: string[] | string;
  required_skills: string;
  category?: string;
  is_featured?: boolean;
  status?: string;
}

export interface JobUpdate {
  title?: string;
  description?: string;
  municipality?: string;
  barangay?: string;
  street_or_landmark?: string;
  work_arrangement?: string;
  multiple_locations?: boolean | string;
  salary_min?: number;
  salary_max?: number;
  salary_type?: string;
  salary_period?: string;
  employment_type?: string;
  experience_level?: string;
  benefits?: string;
  application_deadline?: string;
  application_questions?: string[] | string;
  required_skills?: string;
  category?: string;
  is_featured?: boolean;
  status?: string;
}

export interface JobFilters {
  q?: string;
  keyword?: string;
  municipality?: string;
  island?: string;
  employment_type?: string;
  experience_level?: string;
  min_salary?: number;
  max_salary?: number;
  work_arrangement?: string;
  page?: number;
  page_size?: number;
  category?: string;
  sort?: 'newest' | 'salary_desc' | 'salary_asc';
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
  desired_employment_type?: string;
  is_discoverable?: boolean;
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
