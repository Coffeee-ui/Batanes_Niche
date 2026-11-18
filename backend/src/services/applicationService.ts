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
  static toSeekerApplicationOut(application: ApplicationWithRelations): SeekerApplicationOut {
    // For Job Seekers, display 'new' as 'Submitted'
    const displayStatus = application.status === 'new' ? 'Submitted' : application.status;

    return {
      id: application.id,
      job_id: application.job_id,
      status: displayStatus,
      stage: application.stage || application.status,
      cover_letter: application.cover_letter,
      resume_url: application.resume_url,
      answers: application.answers,
      created_at: application.created_at.toISOString(),
      updated_at: application.updated_at ? application.updated_at.toISOString() : undefined,
      withdrawn_at: application.withdrawn_at ? application.withdrawn_at.toISOString() : undefined,
      interview_date: application.interview_date ? application.interview_date.toISOString() : undefined,
      interview_type: application.interview_type,
      interview_location: application.interview_location,
      interview_message: application.interview_message,
      interview_status: application.interview_status,
      rejection_message: application.rejection_message,
      job: application.job ? JobService.toJobOut(application.job as any) : undefined,
    };
  }

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
      date_of_birth: seeker.date_of_birth || undefined,
      desired_employment_type: seeker.desired_employment_type || undefined,
    };

    return {
      id: application.id,
      job_id: application.job_id,
      status: application.status,
      stage: application.stage || application.status,
      cover_letter: application.cover_letter,
      resume_url: application.resume_url,
      answers: application.answers,
      created_at: application.created_at.toISOString(),
      updated_at: application.updated_at ? application.updated_at.toISOString() : undefined,
      withdrawn_at: application.withdrawn_at ? application.withdrawn_at.toISOString() : undefined,
      interview_date: application.interview_date ? application.interview_date.toISOString() : undefined,
      interview_type: application.interview_type,
      interview_location: application.interview_location,
      interview_message: application.interview_message,
      interview_status: application.interview_status,
      rejection_template: application.rejection_template,
      rejection_message: application.rejection_message,
      applicant: applicantProfile,
      job: application.job ? JobService.toJobOut(application.job as any) : undefined,
    };
  }

  static async submitApplication(seeker: User, appData: ApplicationCreate): Promise<SeekerApplicationOut> {
    if (seeker.role !== 'job_seeker') {
      throw new HttpError(403, 'Only job seekers can apply for jobs.');
    }

    const job = await JobRepository.getById(appData.job_id, false);
    if (!job || (job.status !== 'published' && job.status !== 'active')) {
      throw new HttpError(400, 'Applications can only be submitted to published vacancies.');
    }

    if (job.employer_id === seeker.id) {
      throw new HttpError(400, 'You cannot apply to your own job listing.');
    }

    // Check for duplicate active application inside transaction or atomic check
    const hasActive = await ApplicationRepository.hasActiveApplication(job.id, seeker.id);
    if (hasActive) {
      throw new HttpError(409, 'You already have an active application for this job.');
    }

    const resume = appData.resume_url?.trim() || seeker.resume_url || null;
    const coverLetter = appData.cover_letter?.trim() || null;
    const answers = appData.answers ? appData.answers.trim() : null;

    const [created] = await prisma.$transaction([
      prisma.application.create({
        data: {
          job: { connect: { id: job.id } },
          seeker: { connect: { id: seeker.id } },
          cover_letter: coverLetter,
          resume_url: resume,
          answers,
          status: 'new',
          stage: 'new',
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
          link: '/applications',
        },
      }),
    ]);

    return this.toSeekerApplicationOut(created);
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

    const newStage = updateData.status.trim().toLowerCase();
    const validStages = ['new', 'reviewing', 'shortlisted', 'interview', 'hired', 'rejected'];
    if (!validStages.includes(newStage)) {
      throw new HttpError(400, `Invalid stage. Allowed stages: ${validStages.join(', ')}.`);
    }

    const [updatedApp] = await prisma.$transaction([
      prisma.application.update({
        where: { id: appId },
        data: {
          status: newStage,
          stage: newStage,
          updated_at: new Date(),
        },
        include: {
          job: { include: { employer: { include: { employer_profile: true } } } },
          seeker: { include: { job_seeker_profile: true } },
        },
      }),
      prisma.notification.create({
        data: {
          user: { connect: { id: application.seeker_id } },
          title: 'Application Status Updated',
          message: `Your application for '${application.job.title}' was updated to: ${newStage === 'new' ? 'Submitted' : newStage}.`,
          type: 'application_status_updated',
          link: '/applications',
        },
      }),
    ]);

    return this.toEmployerApplicationOut(updatedApp);
  }

  static async inviteToInterview(
    appId: number,
    employer: User,
    data: {
      interview_date: string;
      interview_type: 'in_person' | 'online';
      interview_location: string;
      interview_message?: string | null;
    }
  ): Promise<EmployerApplicationOut> {
    const application = await ApplicationRepository.getById(appId);
    if (!application || application.job.employer_id !== employer.id) {
      throw new HttpError(403, 'Permission denied.');
    }

    const [updatedApp] = await prisma.$transaction([
      prisma.application.update({
        where: { id: appId },
        data: {
          status: 'interview',
          stage: 'interview',
          interview_date: new Date(data.interview_date),
          interview_type: data.interview_type,
          interview_location: data.interview_location.trim(),
          interview_message: data.interview_message?.trim() || null,
          interview_status: 'pending',
          updated_at: new Date(),
        },
        include: {
          job: { include: { employer: { include: { employer_profile: true } } } },
          seeker: { include: { job_seeker_profile: true } },
        },
      }),
      prisma.notification.create({
        data: {
          user: { connect: { id: application.seeker_id } },
          title: 'Interview Invitation',
          message: `You have received an interview invitation for '${application.job.title}'.`,
          type: 'interview_invitation',
          link: '/applications',
        },
      }),
    ]);

    return this.toEmployerApplicationOut(updatedApp);
  }

  static async respondToInterview(
    appId: number,
    seeker: User,
    response: 'accepted' | 'declined'
  ): Promise<SeekerApplicationOut> {
    const application = await ApplicationRepository.getById(appId);
    if (!application || application.seeker_id !== seeker.id) {
      throw new HttpError(403, 'Permission denied.');
    }

    if (application.status !== 'interview') {
      throw new HttpError(400, 'This application is not in the interview stage.');
    }

    const [updatedApp] = await prisma.$transaction([
      prisma.application.update({
        where: { id: appId },
        data: {
          interview_status: response,
          updated_at: new Date(),
        },
        include: {
          job: { include: { employer: { include: { employer_profile: true } } } },
          seeker: { include: { job_seeker_profile: true } },
        },
      }),
      prisma.notification.create({
        data: {
          user: { connect: { id: application.job.employer_id } },
          title: 'Interview Response Received',
          message: `${seeker.full_name} has ${response} the interview invitation for '${application.job.title}'.`,
          type: 'interview_response',
          link: '/applications',
        },
      }),
    ]);

    return this.toSeekerApplicationOut(updatedApp);
  }

  static async rejectApplication(
    appId: number,
    employer: User,
    data: { rejection_template?: string | null; rejection_message?: string | null }
  ): Promise<EmployerApplicationOut> {
    const application = await ApplicationRepository.getById(appId);
    if (!application || application.job.employer_id !== employer.id) {
      throw new HttpError(403, 'Permission denied.');
    }

    const msg = data.rejection_message?.trim() || 'Thank you for your interest. We have decided to proceed with other candidates at this time.';

    const [updatedApp] = await prisma.$transaction([
      prisma.application.update({
        where: { id: appId },
        data: {
          status: 'rejected',
          stage: 'rejected',
          rejection_template: data.rejection_template || null,
          rejection_message: msg,
          updated_at: new Date(),
        },
        include: {
          job: { include: { employer: { include: { employer_profile: true } } } },
          seeker: { include: { job_seeker_profile: true } },
        },
      }),
      prisma.notification.create({
        data: {
          user: { connect: { id: application.seeker_id } },
          title: 'Application Update',
          message: `Update on your application for '${application.job.title}'.`,
          type: 'application_rejected',
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
    if (!isSeekerOwner) {
      throw new HttpError(403, 'Only the applicant can withdraw this application.');
    }

    if (application.status === 'withdrawn') {
      throw new HttpError(400, 'Application is already withdrawn.');
    }

    if (application.status === 'hired') {
      throw new HttpError(400, 'Cannot withdraw an application that has already been marked as Hired.');
    }

    const [updatedApp] = await prisma.$transaction([
      prisma.application.update({
        where: { id: appId },
        data: {
          status: 'withdrawn',
          withdrawn_at: new Date(),
          updated_at: new Date(),
        },
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
          link: '/applications',
        },
      }),
    ]);

    return this.toSeekerApplicationOut(updatedApp);
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
      return filtered.map((a: ApplicationWithRelations) => this.toSeekerApplicationOut(a));
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
