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
      job: application.job ? JobService.toJobOut(application.job as any) : undefined,
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

    const existingApp = await prisma.application.findUnique({
      where: {
        job_id_seeker_id: { job_id: job.id, seeker_id: seeker.id },
      },
    });

    if (existingApp && existingApp.status !== 'withdrawn') {
      throw new HttpError(400, 'You have already applied for this job.');
    }

    const resume = appData.resume_url?.trim() || seeker.resume_url || null;
    const coverLetter = appData.cover_letter?.trim() || null;

    let createdApp: ApplicationWithRelations;

    if (existingApp && existingApp.status === 'withdrawn') {
      // Re-activate previously withdrawn application to satisfy the unique constraint
      const [updated] = await prisma.$transaction([
        prisma.application.update({
          where: { id: existingApp.id },
          data: {
            cover_letter: coverLetter,
            resume_url: resume,
            status: 'pending',
            created_at: new Date(),
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
      createdApp = updated;
    } else {
      const [created] = await prisma.$transaction([
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
      createdApp = created;
    }

    // Fetch fresh job so application count is accurate immediately
    const freshJob = await JobRepository.getById(job.id, false);

    return {
      id: createdApp.id,
      job_id: createdApp.job_id,
      status: createdApp.status,
      cover_letter: createdApp.cover_letter,
      resume_url: createdApp.resume_url,
      created_at: createdApp.created_at.toISOString(),
      job: freshJob ? JobService.toJobOut(freshJob) : JobService.toJobOut(job),
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
    if (!['pending', 'accepted', 'rejected', 'withdrawn'].includes(newStatus)) {
      throw new HttpError(400, "Invalid status. Allowed statuses: 'pending', 'accepted', 'rejected', 'withdrawn'.");
    }

    const currentStatus = application.status;
    const allowedTransitions: Record<string, string[]> = {
      pending: ['accepted', 'rejected', 'withdrawn'],
      accepted: ['pending', 'rejected', 'withdrawn'],
      rejected: ['pending'],
      withdrawn: ['pending'],
    };

    if (newStatus !== currentStatus && !allowedTransitions[currentStatus]?.includes(newStatus)) {
      throw new HttpError(400, `Invalid status transition from '${currentStatus}' to '${newStatus}'.`);
    }

    const statusText =
      newStatus === 'accepted'
        ? 'accepted'
        : newStatus === 'rejected'
        ? 'rejected'
        : newStatus === 'withdrawn'
        ? 'withdrawn'
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
          link: '/applications',
        },
      }),
    ]);

    return this.toEmployerApplicationOut(updatedApp);
  }

  static async withdrawApplication(
    appId: number,
    currentUser: User
  ): Promise<SeekerApplicationOut | EmployerApplicationOut> {
    const application = await ApplicationRepository.getById(appId);
    if (!application) {
      throw new HttpError(404, 'Application not found.');
    }

    const isSeekerOwner = currentUser.role === 'job_seeker' && application.seeker_id === currentUser.id;
    const isEmployerOwner = (currentUser.role === 'employer' && application.job.employer_id === currentUser.id) || currentUser.role === 'admin';

    if (!isSeekerOwner && !isEmployerOwner) {
      throw new HttpError(403, 'You do not have permission to withdraw this application.');
    }

    if (application.status === 'withdrawn') {
      throw new HttpError(400, 'Application is already withdrawn.');
    }

    // Job seekers can withdraw if pending or accepted
    if (isSeekerOwner && !['pending', 'accepted'].includes(application.status)) {
      throw new HttpError(400, `Cannot withdraw an application that is already '${application.status}'.`);
    }

    // Execute atomic withdrawal & notification
    if (isSeekerOwner) {
      const [updatedApp] = await prisma.$transaction([
        prisma.application.update({
          where: { id: appId },
          data: { status: 'withdrawn' },
          include: {
            job: { include: { employer: { include: { employer_profile: true } } } },
            seeker: { include: { job_seeker_profile: true } },
          },
        }),
        prisma.notification.create({
          data: {
            user: { connect: { id: application.job.employer_id } },
            title: 'Application Withdrawn',
            message: `${currentUser.full_name} withdrew their application for '${application.job.title}'.`,
            type: 'application_withdrawn',
            link: '/jobs/my',
          },
        }),
      ]);

      return {
        id: updatedApp.id,
        job_id: updatedApp.job_id,
        status: updatedApp.status,
        cover_letter: updatedApp.cover_letter,
        resume_url: updatedApp.resume_url,
        created_at: updatedApp.created_at.toISOString(),
        job: updatedApp.job ? JobService.toJobOut(updatedApp.job as any) : undefined,
      };
    } else {
      // Employer withdrawing/rejecting applicant
      const [updatedApp] = await prisma.$transaction([
        prisma.application.update({
          where: { id: appId },
          data: { status: 'withdrawn' },
          include: {
            job: { include: { employer: { include: { employer_profile: true } } } },
            seeker: { include: { job_seeker_profile: true } },
          },
        }),
        prisma.notification.create({
          data: {
            user: { connect: { id: application.seeker_id } },
            title: 'Application Status Updated',
            message: `Your application for '${application.job.title}' was withdrawn.`,
            type: 'application_status_updated',
            link: '/applications',
          },
        }),
      ]);

      return this.toEmployerApplicationOut(updatedApp);
    }
  }

  static async listApplications(
    currentUser: User,
    limit: number = 50,
    offset: number = 0,
    jobId?: number
  ): Promise<(SeekerApplicationOut | EmployerApplicationOut)[]> {
    if (currentUser.role === 'job_seeker') {
      const apps = await ApplicationRepository.listBySeeker(currentUser.id, limit, offset);
      const filtered = jobId ? apps.filter(a => a.job_id === jobId) : apps;
      return filtered.map((a: ApplicationWithRelations) => ({
        id: a.id,
        job_id: a.job_id,
        status: a.status,
        cover_letter: a.cover_letter,
        resume_url: a.resume_url,
        created_at: a.created_at.toISOString(),
        job: a.job ? JobService.toJobOut(a.job as any) : undefined,
      }));
    } else if (currentUser.role === 'employer') {
      if (jobId) {
        const job = await JobRepository.getById(jobId, true);
        if (!job || job.employer_id !== currentUser.id) {
          throw new HttpError(403, 'You do not have permission to view applicants for this job.');
        }
      }
      const apps = await ApplicationRepository.listByEmployer(currentUser.id, jobId, limit, offset);
      return apps.map(a => this.toEmployerApplicationOut(a));
    }
    return [];
  }
}
