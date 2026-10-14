import { User } from '@prisma/client';
import { prisma } from '../database/client';
import { ApplicationRepository, ApplicationWithRelations } from '../repositories/applicationRepository';
import { JobRepository } from '../repositories/jobRepository';
import { JobService } from './jobService';
import { GeographyService } from './geographyService';
import {
  ApplicationCreate,
  ApplicationUpdate,
  EmployerApplicationOut,
  SeekerApplicationOut,
} from '../schemas/application';
import { EmployerApplicantProfile } from '../schemas/user';
import { HttpError } from '../core/errors';

export class ApplicationService {
  static toEmployerApplicationOut(application: ApplicationWithRelations): EmployerApplicationOut {
    const seeker = application.seeker;
    const island = GeographyService.resolveIsland(seeker.municipality) || 'Batan Island';
    const profile = seeker.job_seeker_profile;

    const applicantProfile: EmployerApplicantProfile = {
      seeker_id: seeker.id,
      full_name: seeker.full_name,
      email: seeker.email,
      phone_number: seeker.phone_number || undefined,
      municipality: seeker.municipality,
      island,
      barangay: seeker.barangay || undefined,
      skills: seeker.skills || undefined,
      education: profile?.education || undefined,
      experience_years: profile?.experience_years ?? 0,
      bio: profile?.bio || undefined,
      profile_pic: seeker.profile_pic || undefined,
      resume_url: application.resume_url || seeker.resume_url || undefined,
    };

    return {
      id: application.id,
      job_id: application.job_id,
      status: application.status,
      cover_letter: application.cover_letter,
      resume_url: application.resume_url,
      created_at: application.created_at.toISOString(),
      applicant: applicantProfile,
    };
  }

  static async submitApplication(seeker: User, appData: ApplicationCreate): Promise<SeekerApplicationOut> {
    if (seeker.role !== 'job_seeker') {
      throw new HttpError(403, 'Only job seekers can apply for jobs.');
    }

    const job = await JobRepository.getById(appData.job_id, false);
    if (!job || job.status !== 'active') {
      throw new HttpError(400, 'Applications can only be submitted to active jobs.');
    }

    if (job.employer_id === seeker.id) {
      throw new HttpError(400, 'You cannot apply to your own job listing.');
    }

    const hasApplied = await ApplicationRepository.hasActiveApplication(job.id, seeker.id);
    if (hasApplied) {
      throw new HttpError(400, 'You have already applied for this job.');
    }

    const resume = appData.resume_url?.trim() || seeker.resume_url || null;
    const coverLetter = appData.cover_letter?.trim() || null;

    const [createdApp] = await prisma.$transaction([
      prisma.application.create({
        data: {
          job: { connect: { id: job.id } },
          seeker: { connect: { id: seeker.id } },
          cover_letter: coverLetter,
          resume_url: resume,
          status: 'pending',
        },
        include: {
          job: { include: { employer: { include: { employer_profile: true } } } },
          seeker: { include: { job_seeker_profile: true } },
        },
      }),
      prisma.notification.create({
        data: {
          user: { connect: { id: job.employer_id } },
          title: 'New Application Received',
          message: `${seeker.full_name} submitted an application for your job posting: '${job.title}'.`,
          type: 'new_application',
          link: '/jobs/my',
        },
      }),
    ]);

    return {
      id: createdApp.id,
      job_id: createdApp.job_id,
      status: createdApp.status,
      cover_letter: createdApp.cover_letter,
      resume_url: createdApp.resume_url,
      created_at: createdApp.created_at.toISOString(),
      job: JobService.toJobOut(job),
    };
  }

  static async updateApplicationStatus(
    appId: number,
    employer: User,
    updateData: ApplicationUpdate
  ): Promise<EmployerApplicationOut> {
    if (employer.role !== 'employer' && employer.role !== 'admin') {
      throw new HttpError(403, 'Only the job employer can update application status.');
    }

    const application = await ApplicationRepository.getById(appId);
    if (!application) {
      throw new HttpError(404, 'Application not found.');
    }

    if (application.job.employer_id !== employer.id && employer.role !== 'admin') {
      throw new HttpError(403, 'You do not have permission to manage applications for this job.');
    }

    const newStatus = updateData.status.trim().toLowerCase();
    if (!['pending', 'accepted', 'rejected'].includes(newStatus)) {
      throw new HttpError(400, "Invalid status. Allowed statuses: 'pending', 'accepted', 'rejected'.");
    }

    const currentStatus = application.status;
    const allowedTransitions: Record<string, string[]> = {
      pending: ['accepted', 'rejected'],
      accepted: ['pending'],
      rejected: ['pending'],
    };

    if (newStatus !== currentStatus && !allowedTransitions[currentStatus]?.includes(newStatus)) {
      throw new HttpError(400, `Invalid status transition from '${currentStatus}' to '${newStatus}'.`);
    }

    const statusText =
      newStatus === 'accepted'
        ? 'accepted'
        : newStatus === 'rejected'
        ? 'rejected'
        : 'marked pending';

    const [updatedApp] = await prisma.$transaction([
      prisma.application.update({
        where: { id: appId },
        data: { status: newStatus },
        include: {
          job: { include: { employer: { include: { employer_profile: true } } } },
          seeker: { include: { job_seeker_profile: true } },
        },
      }),
      prisma.notification.create({
        data: {
          user: { connect: { id: application.seeker_id } },
          title: 'Application Status Updated',
          message: `Your application for '${application.job.title}' was ${statusText}.`,
          type: 'application_status_updated',
          link: '/dashboard',
        },
      }),
    ]);

    return this.toEmployerApplicationOut(updatedApp);
  }

  static async listApplications(
    currentUser: User,
    limit: number = 50,
    offset: number = 0
  ): Promise<(SeekerApplicationOut | EmployerApplicationOut)[]> {
    if (currentUser.role === 'job_seeker') {
      const apps = await ApplicationRepository.listBySeeker(currentUser.id, limit, offset);
      return apps.map((a: ApplicationWithRelations) => ({
        id: a.id,
        job_id: a.job_id,
        status: a.status,
        cover_letter: a.cover_letter,
        resume_url: a.resume_url,
        created_at: a.created_at.toISOString(),
        job: a.job ? JobService.toJobOut(a.job as any) : undefined,
      }));
    } else if (currentUser.role === 'employer') {
      const apps = await ApplicationRepository.listByEmployer(currentUser.id, limit, offset);
      return apps.map(a => this.toEmployerApplicationOut(a));
    }
    return [];
  }
}
