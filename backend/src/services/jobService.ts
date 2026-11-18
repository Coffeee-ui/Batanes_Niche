import { Prisma, User } from '@prisma/client';
import { prisma } from '../database/client';
import { JobRepository, JobWithRelations } from '../repositories/jobRepository';
import { SavedJobRepository, SavedJobWithRelations } from '../repositories/savedJobRepository';
import { GeographyService } from './geographyService';
import { serializeSkillValues } from './skillService';
import { JobCreate, JobOut, JobPreviewOut, JobStatsOut, JobUpdate, SavedJobOut } from '../schemas/job';
import { HttpError } from '../core/errors';

export class JobService {
  static toJobPreviewOut(job: JobWithRelations): JobPreviewOut {
    return {
      id: job.id,
      title: job.title,
      salary_min: Number(job.salary_min),
      salary_max: Number(job.salary_max),
      salary_type: (job as any).salary_type || 'range',
      salary_period: (job as any).salary_period || 'monthly',
      required_skills: job.required_skills,
    };
  }

  static toJobOut(job: JobWithRelations): JobOut {
    const island = GeographyService.resolveIsland(job.municipality) || 'Batan Island';
    let companyName: string | null = null;
    let companyAddress: string | null = null;
    let companyDescription: string | null = null;

    if (job.employer) {
      if (job.employer.employer_profile) {
        companyName = job.employer.employer_profile.company_name;
        companyAddress = job.employer.employer_profile.company_address;
        companyDescription = job.employer.employer_profile.company_description;
      } else {
        companyName = job.employer.full_name;
      }
    }

    const apps = job.applications || [];
    const activeApps = apps.filter((a: { status?: string }) => a.status !== 'withdrawn');

    return {
      id: job.id,
      employer_id: job.employer_id,
      title: job.title,
      description: job.description,
      municipality: job.municipality,
      island,
      barangay: job.barangay,
      street_or_landmark: (job as any).street_or_landmark || null,
      work_arrangement: (job as any).work_arrangement || null,
      multiple_locations: (job as any).multiple_locations || null,
      employment_type: job.employment_type,
      experience_level: (job as any).experience_level || null,
      salary_type: (job as any).salary_type || 'range',
      salary_period: (job as any).salary_period || 'monthly',
      salary_min: Number(job.salary_min),
      salary_max: Number(job.salary_max),
      benefits: (job as any).benefits || null,
      application_deadline: (job as any).application_deadline
        ? (job as any).application_deadline instanceof Date
          ? (job as any).application_deadline.toISOString()
          : String((job as any).application_deadline)
        : null,
      application_questions: (job as any).application_questions || null,
      required_skills: job.required_skills,
      status: job.status,
      is_featured: (job as any).is_featured || false,
      close_option: (job as any).close_option || null,
      created_at: job.created_at.toISOString(),
      company_name: companyName,
      company_address: companyAddress,
      company_description: companyDescription,
      application_count: activeApps.length,
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

    if (jobData.is_featured) {
      const activeFeaturedCount = await prisma.job.count({
        where: {
          employer_id: employer.id,
          is_featured: true,
          status: { in: ['published', 'active'] },
          deleted_at: null,
        },
      });
      if (activeFeaturedCount >= 3) {
        throw new HttpError(400, 'An employer can have a maximum of 3 active featured vacancies.');
      }
    }

    const initialStatus = jobData.status || 'published';

    const createPayload: Prisma.JobCreateInput = {
      employer: { connect: { id: employer.id } },
      title: jobData.title.trim(),
      description: jobData.description.trim(),
      municipality: locResult.canonicalMunicipality,
      barangay: locResult.canonicalBarangay,
      street_or_landmark: jobData.street_or_landmark?.trim() || null,
      work_arrangement: jobData.work_arrangement || null,
      multiple_locations: typeof jobData.multiple_locations === 'boolean'
        ? (jobData.multiple_locations ? 'true' : 'false')
        : (jobData.multiple_locations?.trim() || null),
      employment_type: jobData.employment_type.trim(),
      experience_level: jobData.experience_level || null,
      salary_type: jobData.salary_type || 'range',
      salary_period: jobData.salary_period || 'monthly',
      salary_min: jobData.salary_min,
      salary_max: jobData.salary_max,
      benefits: jobData.benefits?.trim() || null,
      application_deadline: jobData.application_deadline ? new Date(jobData.application_deadline) : null,
      application_questions: Array.isArray(jobData.application_questions)
        ? JSON.stringify(jobData.application_questions)
        : (jobData.application_questions?.trim() || null),
      required_skills: normalizedSkills || '',
      status: initialStatus,
      is_featured: Boolean(jobData.is_featured),
    };

    const created = await JobRepository.create(createPayload);
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

    if (job.status === 'closed' || job.status === 'archived') {
      throw new HttpError(400, 'Cannot edit closed or archived vacancies.');
    }

    const jobUpdates: Record<string, unknown> = {};

    if (updateData.title !== undefined) jobUpdates.title = updateData.title.trim();
    if (updateData.description !== undefined) jobUpdates.description = updateData.description.trim();
    if (updateData.employment_type !== undefined) jobUpdates.employment_type = updateData.employment_type.trim();
    if (updateData.street_or_landmark !== undefined) jobUpdates.street_or_landmark = updateData.street_or_landmark?.trim() || null;
    if (updateData.work_arrangement !== undefined) jobUpdates.work_arrangement = updateData.work_arrangement;
    if (updateData.multiple_locations !== undefined) {
      jobUpdates.multiple_locations = typeof updateData.multiple_locations === 'boolean'
        ? (updateData.multiple_locations ? 'true' : 'false')
        : (updateData.multiple_locations?.trim() || null);
    }
    if (updateData.experience_level !== undefined) jobUpdates.experience_level = updateData.experience_level;
    if (updateData.salary_type !== undefined) jobUpdates.salary_type = updateData.salary_type;
    if (updateData.salary_period !== undefined) jobUpdates.salary_period = updateData.salary_period;
    if (updateData.benefits !== undefined) jobUpdates.benefits = updateData.benefits?.trim() || null;
    if (updateData.application_deadline !== undefined) {
      jobUpdates.application_deadline = updateData.application_deadline ? new Date(updateData.application_deadline) : null;
    }
    if (updateData.application_questions !== undefined) {
      jobUpdates.application_questions = Array.isArray(updateData.application_questions)
        ? JSON.stringify(updateData.application_questions)
        : (updateData.application_questions?.trim() || null);
    }

    if (updateData.is_featured !== undefined) {
      if (updateData.is_featured && !job.is_featured) {
        const activeFeaturedCount = await prisma.job.count({
          where: {
            employer_id: employer.id,
            is_featured: true,
            status: { in: ['published', 'active'] },
            deleted_at: null,
          },
        });
        if (activeFeaturedCount >= 3) {
          throw new HttpError(400, 'An employer can have a maximum of 3 active featured vacancies.');
        }
      }
      jobUpdates.is_featured = Boolean(updateData.is_featured);
    }

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

    const updated = await JobRepository.update(jobId, jobUpdates as any);
    return this.toJobOut(updated);
  }

  static async updateJobStatus(jobId: number, employer: User, newStatus: string): Promise<JobOut> {
    const job = await JobRepository.getById(jobId, false);
    if (!job) {
      throw new HttpError(404, 'Job posting not found.');
    }

    if (job.employer_id !== employer.id && employer.role !== 'admin') {
      throw new HttpError(403, 'You do not have permission to modify this job.');
    }

    const updated = await JobRepository.update(jobId, { status: newStatus });
    return this.toJobOut(updated);
  }

  static async closeJob(jobId: number, employer: User, closeOption: 'reviewing' | 'ended'): Promise<JobOut> {
    const job = await JobRepository.getById(jobId, false);
    if (!job) {
      throw new HttpError(404, 'Job posting not found.');
    }

    if (job.employer_id !== employer.id && employer.role !== 'admin') {
      throw new HttpError(403, 'You do not have permission to close this job.');
    }

    const updated = await JobRepository.update(jobId, {
      status: 'closed',
      close_option: closeOption,
    } as any);
    return this.toJobOut(updated);
  }

  static async getJobStats(jobId: number, employer: User): Promise<JobStatsOut> {
    const job = await JobRepository.getById(jobId, true);
    if (!job) {
      throw new HttpError(404, 'Job posting not found.');
    }

    if (job.employer_id !== employer.id && employer.role !== 'admin') {
      throw new HttpError(403, 'You do not have permission to view stats for this job.');
    }

    const apps = job.applications || [];
    const by_status: Record<string, number> = {};
    for (const app of apps) {
      const stage = (app as any).stage || app.status || 'new';
      by_status[stage] = (by_status[stage] || 0) + 1;
    }

    return {
      total_applications: apps.length,
      by_status,
    };
  }

  static async listFeaturedJobs(): Promise<JobOut[]> {
    const jobs = await prisma.job.findMany({
      where: {
        is_featured: true,
        status: { in: ['published', 'active'] },
        deleted_at: null,
      },
      orderBy: { created_at: 'desc' },
      include: {
        employer: { include: { employer_profile: true } },
        applications: true,
      },
    });
    return jobs.map(j => this.toJobOut(j as any));
  }

  static async listRecommendedJobs(seeker?: User | null, limit: number = 10): Promise<JobOut[]> {
    if (!seeker || !seeker.skills) {
      // Fallback to latest jobs
      const latest = await JobRepository.listActiveJobs(null, null, null, null, limit, 0, 'created_at_desc', null);
      return latest.map(j => this.toJobOut(j));
    }

    const seekerSkills = seeker.skills
      .toLowerCase()
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const activeJobs = await JobRepository.listActiveJobs(null, null, null, null, 50, 0, null, null);

    // Score jobs based on matching skills and same municipality
    const scored = activeJobs.map(job => {
      let score = 0;
      const jobSkills = (job.required_skills || '').toLowerCase();
      for (const skill of seekerSkills) {
        if (jobSkills.includes(skill)) {
          score += 10;
        }
      }
      if (seeker.municipality && job.municipality.toLowerCase() === seeker.municipality.toLowerCase()) {
        score += 5;
      }
      return { job, score };
    });

    scored.sort((a, b) => b.score - a.score || b.job.created_at.getTime() - a.job.created_at.getTime());

    return scored.slice(0, limit).map(s => this.toJobOut(s.job));
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
      status: 'archived',
      deleted_at: new Date(),
    });
  }

  static async countActiveJobs(
    municipality?: string | null,
    island?: string | null,
    keyword?: string | null,
    employmentType?: string | null,
    category?: string | null
  ): Promise<number> {
    return JobRepository.countActiveJobs(municipality, island, keyword, employmentType, category);
  }

  static async listActiveJobs(
    municipality?: string | null,
    island?: string | null,
    keyword?: string | null,
    employmentType?: string | null,
    limit: number = 50,
    offset: number = 0,
    sort?: string | null,
    category?: string | null
  ): Promise<JobOut[]> {
    const jobs = await JobRepository.listActiveJobs(municipality, island, keyword, employmentType, limit, offset, sort, category);
    return jobs.map(j => this.toJobOut(j));
  }

  static async listActiveJobsPreview(
    limit: number = 50,
    offset: number = 0,
    sort?: string | null,
    category?: string | null
  ): Promise<JobPreviewOut[]> {
    const jobs = await JobRepository.listActiveJobs(null, null, null, null, limit, offset, sort, category);
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
    if (!job || (job.status !== 'active' && job.status !== 'published')) {
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
