import { User } from '@prisma/client';
import { JobRepository, JobWithRelations } from '../repositories/jobRepository';
import { SavedJobRepository, SavedJobWithRelations } from '../repositories/savedJobRepository';
import { GeographyService } from './geographyService';
import { serializeSkillValues } from './skillService';
import { JobCreate, JobOut, JobPreviewOut, JobUpdate, SavedJobOut } from '../schemas/job';
import { HttpError } from '../core/errors';

export class JobService {
  static toJobPreviewOut(job: JobWithRelations): JobPreviewOut {
    return {
      id: job.id,
      title: job.title,
      salary_min: Number(job.salary_min),
      salary_max: Number(job.salary_max),
      required_skills: job.required_skills,
    };
  }

  static toJobOut(job: JobWithRelations): JobOut {
    const island = GeographyService.resolveIsland(job.municipality) || 'Batan Island';
    let companyName: string | null = null;
    if (job.employer) {
      if (job.employer.employer_profile) {
        companyName = job.employer.employer_profile.company_name;
      } else {
        companyName = job.employer.full_name;
      }
    }

    return {
      id: job.id,
      employer_id: job.employer_id,
      title: job.title,
      description: job.description,
      municipality: job.municipality,
      island,
      barangay: job.barangay,
      salary_min: Number(job.salary_min),
      salary_max: Number(job.salary_max),
      employment_type: job.employment_type,
      required_skills: job.required_skills,
      status: job.status,
      created_at: job.created_at.toISOString(),
      company_name: companyName,
      application_count: job.applications ? job.applications.length : 0,
    };
  }

  static async createJob(employer: User, jobData: JobCreate): Promise<JobOut> {
    if (employer.role !== 'employer') {
      throw new HttpError(403, 'Only employers can create job listings.');
    }

    if (jobData.salary_min > jobData.salary_max) {
      throw new HttpError(400, 'Minimum salary cannot exceed maximum salary.');
    }

    const locResult = GeographyService.validateLocation(jobData.municipality, jobData.barangay);
    if (!locResult.isValid || !locResult.canonicalMunicipality) {
      throw new HttpError(400, `Invalid Batanes location: '${jobData.municipality}', '${jobData.barangay}'.`);
    }

    const normalizedSkills = serializeSkillValues(jobData.required_skills.split(','));
    if (jobData.required_skills.trim() && !normalizedSkills) {
      throw new HttpError(400, 'A custom value is required when selecting Other as a skill.');
    }

    const created = await JobRepository.create({
      employer: { connect: { id: employer.id } },
      title: jobData.title.trim(),
      description: jobData.description.trim(),
      municipality: locResult.canonicalMunicipality,
      barangay: locResult.canonicalBarangay,
      salary_min: jobData.salary_min,
      salary_max: jobData.salary_max,
      employment_type: jobData.employment_type.trim(),
      required_skills: normalizedSkills || '',
      status: 'active',
    });

    return this.toJobOut(created);
  }

  static async getJobById(jobId: number, currentUser?: User | null): Promise<JobOut> {
    const includeDeleted = Boolean(currentUser && (currentUser.role === 'admin' || currentUser.role === 'employer'));
    const job = await JobRepository.getById(jobId, includeDeleted);

    if (!job) {
      throw new HttpError(404, 'Job posting not found.');
    }

    if (job.deleted_at && !(currentUser && (currentUser.id === job.employer_id || currentUser.role === 'admin'))) {
      throw new HttpError(404, 'Job posting not found.');
    }

    if (currentUser && currentUser.role === 'employer' && job.employer_id !== currentUser.id) {
      throw new HttpError(403, 'Employers can only view their own job listings.');
    }

    return this.toJobOut(job);
  }

  static async updateJob(jobId: number, employer: User, updateData: JobUpdate): Promise<JobOut> {
    const job = await JobRepository.getById(jobId, false);
    if (!job) {
      throw new HttpError(404, 'Job posting not found.');
    }

    if (job.employer_id !== employer.id && employer.role !== 'admin') {
      throw new HttpError(403, 'You do not have permission to edit this job.');
    }

    const jobUpdates: Record<string, unknown> = {};

    if (updateData.title !== undefined) jobUpdates.title = updateData.title.trim();
    if (updateData.description !== undefined) jobUpdates.description = updateData.description.trim();
    if (updateData.employment_type !== undefined) jobUpdates.employment_type = updateData.employment_type.trim();

    if (updateData.required_skills !== undefined) {
      const normalizedSkills = serializeSkillValues(updateData.required_skills.split(','));
      if (updateData.required_skills.trim() && !normalizedSkills) {
        throw new HttpError(400, 'A custom value is required when selecting Other as a skill.');
      }
      jobUpdates.required_skills = normalizedSkills || '';
    }

    const newMin = updateData.salary_min !== undefined ? updateData.salary_min : Number(job.salary_min);
    const newMax = updateData.salary_max !== undefined ? updateData.salary_max : Number(job.salary_max);
    if (newMin > newMax) {
      throw new HttpError(400, 'Minimum salary cannot exceed maximum salary.');
    }
    if (updateData.salary_min !== undefined) jobUpdates.salary_min = updateData.salary_min;
    if (updateData.salary_max !== undefined) jobUpdates.salary_max = updateData.salary_max;

    if (updateData.municipality !== undefined || updateData.barangay !== undefined) {
      const mun = updateData.municipality || job.municipality;
      const bgy = updateData.barangay !== undefined ? updateData.barangay : job.barangay;
      const locResult = GeographyService.validateLocation(mun, bgy);
      if (!locResult.isValid || !locResult.canonicalMunicipality) {
        throw new HttpError(400, `Invalid Batanes location: '${mun}', '${bgy}'.`);
      }
      jobUpdates.municipality = locResult.canonicalMunicipality;
      jobUpdates.barangay = locResult.canonicalBarangay;
    }

    if (updateData.status !== undefined) {
      jobUpdates.status = updateData.status;
    }

    const updated = await JobRepository.update(jobId, jobUpdates);
    return this.toJobOut(updated);
  }

  static async softDeleteJob(jobId: number, employer: User): Promise<void> {
    const job = await JobRepository.getById(jobId, false);
    if (!job) {
      throw new HttpError(404, 'Job posting not found.');
    }

    if (job.employer_id !== employer.id && employer.role !== 'admin') {
      throw new HttpError(403, 'You do not have permission to delete this job.');
    }

    await JobRepository.update(jobId, {
      status: 'closed',
      deleted_at: new Date(),
    });
  }

  static async listActiveJobs(
    municipality?: string | null,
    island?: string | null,
    keyword?: string | null,
    employmentType?: string | null,
    limit: number = 50,
    offset: number = 0
  ): Promise<JobOut[]> {
    const jobs = await JobRepository.listActiveJobs(municipality, island, keyword, employmentType, limit, offset);
    return jobs.map(j => this.toJobOut(j));
  }

  static async listActiveJobsPreview(limit: number = 50, offset: number = 0): Promise<JobPreviewOut[]> {
    const jobs = await JobRepository.listActiveJobs(null, null, null, null, limit, offset);
    return jobs.map(j => this.toJobPreviewOut(j));
  }

  static async listEmployerJobs(
    employerId: number,
    includeClosed: boolean = true,
    limit: number = 50,
    offset: number = 0
  ): Promise<JobOut[]> {
    const jobs = await JobRepository.listByEmployer(employerId, includeClosed, limit, offset);
    return jobs.map(j => this.toJobOut(j));
  }

  // --- Saved Jobs (Bookmarks) ---

  static async saveJob(seeker: User, jobId: number): Promise<void> {
    if (seeker.role !== 'job_seeker') {
      throw new HttpError(403, 'Only job seekers can bookmark jobs.');
    }

    const job = await JobRepository.getById(jobId, false);
    if (!job || job.status !== 'active') {
      throw new HttpError(400, 'Only active jobs can be bookmarked.');
    }

    const existing = await SavedJobRepository.getBySeekerAndJob(seeker.id, jobId);
    if (existing) {
      return; // Idempotent
    }

    await SavedJobRepository.create(seeker.id, jobId);
  }

  static async removeSavedJob(seeker: User, jobId: number): Promise<void> {
    if (seeker.role !== 'job_seeker') {
      throw new HttpError(403, 'Only job seekers can manage bookmarks.');
    }

    const saved = await SavedJobRepository.getBySeekerAndJob(seeker.id, jobId);
    if (!saved) {
      throw new HttpError(404, 'Saved job not found.');
    }

    await SavedJobRepository.delete(seeker.id, jobId);
  }

  static async listSavedJobs(seeker: User): Promise<SavedJobOut[]> {
    if (seeker.role !== 'job_seeker') {
      throw new HttpError(403, 'Only job seekers can view saved jobs.');
    }

    const list = await SavedJobRepository.listBySeeker(seeker.id);
    return list.map((s: SavedJobWithRelations) => ({
      id: s.id,
      saved_at: s.saved_at.toISOString(),
      job: this.toJobOut(s.job),
    }));
  }
}
