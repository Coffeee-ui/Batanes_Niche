import { UserRepository, UserWithProfiles } from '../repositories/userRepository';
import { GeographyService } from './geographyService';
import { serializeSkillValues } from './skillService';
import {
  EmployerProfileOut,
  JobSeekerProfileOut,
  PrivateUserProfile,
  PublicJobSeekerSummary,
  UserProfileUpdate,
} from '../schemas/user';
import { HttpError } from '../core/errors';

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
      if (profile.education && profile.education.trim().length > 0) points += 15;
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
      };
    }

    let seekerOut: JobSeekerProfileOut | null = null;
    if (user.job_seeker_profile) {
      seekerOut = {
        bio: user.job_seeker_profile.bio,
        education: user.job_seeker_profile.education,
        experience_years: user.job_seeker_profile.experience_years,
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
    limit: number = 50,
    offset: number = 0
  ): Promise<PublicJobSeekerSummary[]> {
    const users = await UserRepository.listJobSeekers(municipality, island, skill, limit, offset);
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
      };
    });
  }
}
