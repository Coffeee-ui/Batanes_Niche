import { UserRepository, UserWithProfiles } from '../repositories/userRepository';
import { GeographyService } from './geographyService';
import { serializeSkillValues } from './skillService';
import {
  EmployerProfileOut,
  JobSeekerProfileOut,
  PrivateUserProfile,
  PublicEmployerSummary,
  PublicJobSeekerSummary,
  UserProfileUpdate,
} from '../schemas/user';
import { HttpError } from '../core/errors';
import { getPasswordHash, verifyPassword } from '../core/security';
import { prisma } from '../database/client';

export class UserService {
  static calculateProfileCompleteness(user: UserWithProfiles): number {
    let points = 0;

    // Base Fields
    if (user.full_name && user.full_name.trim().length >= 2) points += 15;
    if (user.phone_number && user.phone_number.trim().length >= 7) points += 10;
    if (user.municipality && user.municipality.trim().length > 0) points += 10;
    if (user.barangay && user.barangay.trim().length > 0) points += 10;
    if (user.skills && user.skills.trim().length > 0) points += 15;
    if (user.profile_pic && user.profile_pic.trim().length > 0) points += 5;
    if (user.resume_url && user.resume_url.trim().length > 0) points += 10;

    // Role-Specific Fields
    if (user.role === 'job_seeker' && user.job_seeker_profile) {
      const profile = user.job_seeker_profile;
      if (profile.bio && profile.bio.trim().length > 0) points += 10;
      if (profile.education && profile.education.trim().length > 0) points += 10;
      if (user.date_of_birth && user.date_of_birth.trim().length > 0) points += 5;
    } else if (user.role === 'employer' && user.employer_profile) {
      const profile = user.employer_profile;
      if (profile.company_name && profile.company_name.trim().length > 0) points += 10;
      if (profile.company_description && profile.company_description.trim().length > 0) points += 15;
    }

    return Math.min(points, 100);
  }

  static getPrivateProfile(user: UserWithProfiles): PrivateUserProfile {
    const completeness = this.calculateProfileCompleteness(user);
    const island = GeographyService.resolveIsland(user.municipality) || 'Batan Island';

    let empOut: EmployerProfileOut | null = null;
    if (user.employer_profile) {
      empOut = {
        company_name: user.employer_profile.company_name,
        company_address: user.employer_profile.company_address,
        company_description: user.employer_profile.company_description,
        business_type: user.employer_profile.business_type,
        industry: user.employer_profile.industry,
        onboarding_completed: Boolean(user.employer_profile.onboarding_completed || user.onboarding_completed),
        walkthrough_dismissed: Boolean(user.employer_profile.walkthrough_dismissed || user.walkthrough_dismissed),
      };
    }

    let seekerOut: JobSeekerProfileOut | null = null;
    if (user.job_seeker_profile) {
      seekerOut = {
        bio: user.job_seeker_profile.bio,
        education: user.job_seeker_profile.education,
        experience_years: user.job_seeker_profile.experience_years,
        desired_employment_type: user.desired_employment_type,
        work_experience: user.work_experience,
        date_of_birth: user.date_of_birth,
        is_discoverable: user.is_discoverable,
        onboarding_completed: Boolean(user.onboarding_completed),
        walkthrough_dismissed: Boolean(user.walkthrough_dismissed),
      };
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      phone_number: user.phone_number,
      municipality: user.municipality,
      island,
      barangay: user.barangay,
      skills: user.skills,
      profile_pic: user.profile_pic,
      resume_url: user.resume_url,
      role: user.role,
      account_status: user.account_status,
      profile_completeness: completeness,
      date_of_birth: user.date_of_birth,
      desired_employment_type: user.desired_employment_type,
      work_experience: user.work_experience,
      is_discoverable: user.is_discoverable,
      onboarding_completed: Boolean(user.onboarding_completed),
      walkthrough_dismissed: Boolean(user.walkthrough_dismissed),
      notification_preferences: user.notification_preferences,
      language_preference: user.language_preference || 'en',
      employer_profile: empOut,
      job_seeker_profile: seekerOut,
      created_at: user.created_at.toISOString(),
    };
  }

  static async updateProfile(user: UserWithProfiles, updateData: UserProfileUpdate): Promise<PrivateUserProfile> {
    const userUpdates: Record<string, unknown> = {};

    if (updateData.full_name !== undefined) userUpdates.full_name = updateData.full_name.trim();
    if (updateData.phone_number !== undefined)
      userUpdates.phone_number = updateData.phone_number ? updateData.phone_number.trim() : null;
    if (updateData.skills !== undefined) {
      userUpdates.skills = updateData.skills ? serializeSkillValues(updateData.skills.split(',')) : null;
    }
    if (updateData.profile_pic !== undefined)
      userUpdates.profile_pic = updateData.profile_pic ? updateData.profile_pic.trim() : null;
    if (updateData.resume_url !== undefined)
      userUpdates.resume_url = updateData.resume_url ? updateData.resume_url.trim() : null;
    if (updateData.date_of_birth !== undefined)
      userUpdates.date_of_birth = updateData.date_of_birth ? updateData.date_of_birth.trim() : null;
    if (updateData.desired_employment_type !== undefined)
      userUpdates.desired_employment_type = updateData.desired_employment_type ? updateData.desired_employment_type.trim() : null;
    if (updateData.work_experience !== undefined)
      userUpdates.work_experience = updateData.work_experience ? updateData.work_experience.trim() : null;
    if (updateData.is_discoverable !== undefined)
      userUpdates.is_discoverable = Boolean(updateData.is_discoverable);
    if (updateData.onboarding_completed !== undefined)
      userUpdates.onboarding_completed = Boolean(updateData.onboarding_completed);
    if (updateData.walkthrough_dismissed !== undefined)
      userUpdates.walkthrough_dismissed = Boolean(updateData.walkthrough_dismissed);
    if (updateData.notification_preferences !== undefined)
      userUpdates.notification_preferences = updateData.notification_preferences;
    if (updateData.language_preference !== undefined)
      userUpdates.language_preference = updateData.language_preference;

    // Validate location if municipality or barangay updated
    const newMun = updateData.municipality || user.municipality;
    const newBgy = updateData.barangay !== undefined ? updateData.barangay : user.barangay;

    const locResult = GeographyService.validateLocation(newMun, newBgy);
    if (!locResult.isValid || !locResult.canonicalMunicipality) {
      throw new HttpError(400, `Invalid Batanes location: '${newMun}', '${newBgy}'.`);
    }

    userUpdates.municipality = locResult.canonicalMunicipality;
    userUpdates.barangay = locResult.canonicalBarangay;

    let empProfileUpdates: Record<string, unknown> | undefined;
    let seekerProfileUpdates: Record<string, unknown> | undefined;

    if (user.role === 'job_seeker') {
      seekerProfileUpdates = {};
      if (updateData.bio !== undefined) seekerProfileUpdates.bio = updateData.bio ? updateData.bio.trim() : null;
      if (updateData.education !== undefined)
        seekerProfileUpdates.education = updateData.education ? updateData.education.trim() : null;
      if (updateData.experience_years !== undefined)
        seekerProfileUpdates.experience_years = updateData.experience_years ?? 0;
    } else if (user.role === 'employer') {
      empProfileUpdates = {};
      if (updateData.company_name !== undefined)
        empProfileUpdates.company_name = updateData.company_name.trim();
      if (updateData.company_address !== undefined)
        empProfileUpdates.company_address = updateData.company_address.trim();
      if (updateData.company_description !== undefined)
        empProfileUpdates.company_description = updateData.company_description
          ? updateData.company_description.trim()
          : null;
      if (updateData.business_type !== undefined)
        empProfileUpdates.business_type = updateData.business_type.replace(/\s+/g, ' ').trim();
      if (updateData.industry !== undefined)
        empProfileUpdates.industry = updateData.industry ? updateData.industry.trim() : null;
      if (updateData.onboarding_completed !== undefined)
        empProfileUpdates.onboarding_completed = Boolean(updateData.onboarding_completed);
      if (updateData.walkthrough_dismissed !== undefined)
        empProfileUpdates.walkthrough_dismissed = Boolean(updateData.walkthrough_dismissed);
    }

    const updated = await UserRepository.update(
      user.id,
      userUpdates,
      empProfileUpdates,
      seekerProfileUpdates
    );

    return this.getPrivateProfile(updated);
  }

  static async searchJobSeekers(
    municipality?: string | null,
    island?: string | null,
    skill?: string | null,
    education?: string | null,
    experienceYears?: number | null,
    desiredEmploymentType?: string | null,
    limit: number = 50,
    offset: number = 0
  ): Promise<PublicJobSeekerSummary[]> {
    const users = await UserRepository.listJobSeekers(
      municipality,
      island,
      skill,
      education,
      experienceYears,
      desiredEmploymentType,
      limit,
      offset
    );
    return users.map(u => {
      const isl = GeographyService.resolveIsland(u.municipality) || 'Batan Island';
      return {
        id: u.id,
        full_name: u.full_name,
        municipality: u.municipality,
        island: isl,
        barangay: u.barangay,
        skills: u.skills,
        education: u.job_seeker_profile?.education || null,
        experience_years: u.job_seeker_profile?.experience_years || 0,
        bio: u.job_seeker_profile?.bio || null,
        profile_pic: u.profile_pic,
        desired_employment_type: u.desired_employment_type,
        is_discoverable: u.is_discoverable,
      };
    });
  }

  static async searchEmployers(
    company?: string | null,
    industry?: string | null,
    municipality?: string | null,
    hasActiveVacancies?: boolean,
    limit: number = 50,
    offset: number = 0
  ): Promise<PublicEmployerSummary[]> {
    const employers = await UserRepository.listEmployers(company, industry, municipality, limit, offset);
    let list = employers.map(e => {
      const isl = GeographyService.resolveIsland(e.municipality) || 'Batan Island';
      return {
        id: e.id,
        company_name: e.employer_profile?.company_name || e.full_name,
        company_address: e.employer_profile?.company_address || `${e.municipality}, Batanes`,
        company_description: e.employer_profile?.company_description || null,
        business_type: e.employer_profile?.business_type || 'General Enterprise',
        industry: e.employer_profile?.industry || e.employer_profile?.business_type || null,
        municipality: e.municipality,
        island: isl,
        active_vacancies_count: e._count.jobs,
      };
    });

    if (hasActiveVacancies) {
      list = list.filter(e => e.active_vacancies_count > 0);
    }

    return list;
  }

  static async getEmployerProfile(id: number): Promise<PublicEmployerSummary> {
    const user = await UserRepository.getById(id);
    if (!user || user.role !== 'employer' || user.account_status !== 'active') {
      throw new HttpError(404, 'Employer not found.');
    }
    const isl = GeographyService.resolveIsland(user.municipality) || 'Batan Island';
    const activeVacanciesCount = await prisma.job.count({
      where: {
        employer_id: user.id,
        status: { in: ['published', 'active'] },
        deleted_at: null,
      },
    });

    return {
      id: user.id,
      company_name: user.employer_profile?.company_name || user.full_name,
      company_address: user.employer_profile?.company_address || `${user.municipality}, Batanes`,
      company_description: user.employer_profile?.company_description || null,
      business_type: user.employer_profile?.business_type || 'General Enterprise',
      industry: user.employer_profile?.industry || user.employer_profile?.business_type || null,
      municipality: user.municipality,
      island: isl,
      active_vacancies_count: activeVacanciesCount,
    };
  }

  // Account Operations
  static async changePassword(user: UserWithProfiles, oldPass: string, newPass: string): Promise<void> {
    if (!verifyPassword(oldPass, user.password_hash)) {
      throw new HttpError(400, 'Current password is incorrect.');
    }
    const newHash = getPasswordHash(newPass);
    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash: newHash },
    });
  }

  static async deactivateAccount(user: UserWithProfiles): Promise<void> {
    if (user.role === 'employer') {
      const openJobs = await prisma.job.count({
        where: {
          employer_id: user.id,
          status: { in: ['published', 'active'] },
          deleted_at: null,
        },
      });
      if (openJobs > 0) {
        throw new HttpError(
          400,
          'You have active published vacancies. Please pause or close all vacancies before deactivating your account.'
        );
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        account_status: 'deactivated',
        deactivated_at: new Date(),
        is_discoverable: false,
      },
    });
  }

  static async reactivateAccount(emailOrUsername: string, pass: string): Promise<UserWithProfiles> {
    const user = await UserRepository.getByUsernameOrEmail(emailOrUsername);
    if (!user || !verifyPassword(pass, user.password_hash)) {
      throw new HttpError(401, 'Invalid credentials.');
    }
    if (user.account_status !== 'deactivated') {
      throw new HttpError(400, 'Account is not in a deactivated state.');
    }

    const reactivated = await prisma.user.update({
      where: { id: user.id },
      data: {
        account_status: 'active',
        deactivated_at: null,
        is_discoverable: true,
      },
      include: { employer_profile: true, job_seeker_profile: true },
    });

    return reactivated;
  }

  static async requestPermanentDeletion(user: UserWithProfiles, pass: string): Promise<void> {
    if (!verifyPassword(pass, user.password_hash)) {
      throw new HttpError(400, 'Incorrect password.');
    }

    if (user.role === 'employer') {
      const openJobs = await prisma.job.count({
        where: {
          employer_id: user.id,
          status: { in: ['published', 'active', 'paused'] },
          deleted_at: null,
        },
      });
      if (openJobs > 0) {
        throw new HttpError(
          400,
          'You have open vacancies. Please close recruitment and finalize applications before requesting permanent deletion.'
        );
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        account_status: 'deletion_requested',
        deletion_requested_at: new Date(),
        is_discoverable: false,
      },
    });
  }
}
