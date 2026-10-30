import { User } from '@prisma/client';
import { UserRepository } from '../repositories/userRepository';
import { JobRepository } from '../repositories/jobRepository';
import { JobService } from './jobService';
import { GeographyService } from './geographyService';
import { normalizeSkillValues, skillsMatch, splitSkills } from './skillService';
import {
  CandidateRankingResponse,
  CandidateScoreOut,
  JobRankingResponse,
  JobScoreOut,
} from '../schemas/recommendation';
import { PublicJobSeekerSummary } from '../schemas/user';
import { JobOut } from '../schemas/job';

export class RecommendationService {
  static tokenizeSkills(rawSkills: string | null | undefined): string[] {
    const split = splitSkills(rawSkills);
    const normalized = normalizeSkillValues(split);
    return normalized.map(s => s.toLowerCase());
  }

  static calculateSkillScore(neededSkillsRaw: string, candidateSkillsRaw: string): number {
    const neededTokens = this.tokenizeSkills(neededSkillsRaw);
    if (neededTokens.length === 0) return 0.0;

    const candidateTokens = this.tokenizeSkills(candidateSkillsRaw);
    if (candidateTokens.length === 0) return 0.0;

    const matchedNeeded = skillsMatch(neededTokens, candidateTokens);
    const score = (matchedNeeded.size / neededTokens.length) * 70.0;
    return Math.round(score * 100) / 100;
  }

  static async rankCandidates(
    neededSkills: string,
    targetMunicipality: string,
    targetBarangay?: string | null,
    limit: number = 50
  ): Promise<CandidateRankingResponse> {
    const candidates = await UserRepository.listJobSeekers(null, null, null, limit * 2, 0);
    const tier1: CandidateScoreOut[] = [];
    const tier2: PublicJobSeekerSummary[] = [];

    for (const candidate of candidates) {
      const isl = GeographyService.resolveIsland(candidate.municipality) || 'Batan Island';
      const bio = candidate.job_seeker_profile?.bio || null;
      const edu = candidate.job_seeker_profile?.education || null;
      const exp = candidate.job_seeker_profile?.experience_years ?? 0;

      const candSummary: PublicJobSeekerSummary = {
        id: candidate.id,
        full_name: candidate.full_name,
        municipality: candidate.municipality,
        island: isl,
        barangay: candidate.barangay,
        skills: candidate.skills,
        education: edu,
        experience_years: exp,
        bio,
        profile_pic: candidate.profile_pic,
      };

      const skillScore = this.calculateSkillScore(neededSkills, candidate.skills || '');
      const geoScore = GeographyService.scoreDistance(
        targetMunicipality,
        targetBarangay,
        candidate.municipality,
        candidate.barangay
      );
      const totalScore = Math.round((skillScore + geoScore) * 100) / 100;

      if (totalScore > 0) {
        tier1.push({
          candidate: candSummary,
          skill_score: skillScore,
          geographic_score: geoScore,
          total_score: totalScore,
        });
      } else {
        tier2.push(candSummary);
      }
    }

    tier1.sort((a, b) => {
      if (b.total_score !== a.total_score) {
        return b.total_score - a.total_score;
      }
      return a.candidate.full_name.localeCompare(b.candidate.full_name);
    });

    tier2.sort((a, b) => a.full_name.localeCompare(b.full_name));

    return {
      tier_1: tier1.slice(0, limit),
      tier_2: tier2.slice(0, limit),
    };
  }

  static async rankJobsForSeeker(seeker: User, limit: number = 50): Promise<JobRankingResponse> {
    const activeJobs = await JobRepository.listActiveJobs(null, null, null, null, limit * 2, 0);
    const tier1: JobScoreOut[] = [];
    const tier2: JobOut[] = [];

    const seekerSkills = seeker.skills || '';

    for (const job of activeJobs) {
      const jobOut = JobService.toJobOut(job);
      const skillScore = this.calculateSkillScore(job.required_skills, seekerSkills);
      const geoScore = GeographyService.scoreDistance(
        job.municipality,
        job.barangay,
        seeker.municipality,
        seeker.barangay
      );
      const totalScore = Math.round((skillScore + geoScore) * 100) / 100;

      if (totalScore > 0) {
        tier1.push({
          job: jobOut,
          skill_score: skillScore,
          geographic_score: geoScore,
          total_score: totalScore,
        });
      } else {
        tier2.push(jobOut);
      }
    }

    tier1.sort((a, b) => {
      if (b.total_score !== a.total_score) {
        return b.total_score - a.total_score;
      }
      return a.job.title.localeCompare(b.job.title);
    });

    tier2.sort((a, b) => a.title.localeCompare(b.title));

    return {
      tier_1: tier1.slice(0, limit),
      tier_2: tier2.slice(0, limit),
    };
  }
}
