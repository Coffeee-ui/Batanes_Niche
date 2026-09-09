from typing import List
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.job import Job
from app.schemas.recommendation import (
    CandidateScoreOut,
    CandidateRankingResponse,
    JobScoreOut,
    JobRankingResponse,
)
from app.repositories.user_repository import UserRepository
from app.repositories.job_repository import JobRepository
from app.services.job_service import JobService
from app.services.user_service import UserService
from app.services.geography_service import GeographyService
from app.services.skill_service import normalize_skill_values, skills_match, split_skills


class RecommendationService:
    @staticmethod
    def tokenize_skills(raw_skills: str) -> List[str]:
        """
        Tokenizes raw skills string per Section 7.2.1:
        1. Convert to lowercase
        2. Split by commas ','
        3. Trim leading and trailing whitespace
        4. Filter out empty tokens
        """
        return [value.casefold() for value in normalize_skill_values(split_skills(raw_skills or ""))]

    @staticmethod
    def calculate_skill_score(needed_skills_raw: str, candidate_skills_raw: str) -> float:
        """
        Calculates skill match score (0.0 to 70.0 pts) using deterministic exact matching.
        Canonical and custom values are compared by normalized value; literal Other is ignored.
        skill_score = round((len(matched_needed_keywords) / len(total_needed_keywords)) * 70.0, 2)
        """
        needed_tokens = RecommendationService.tokenize_skills(needed_skills_raw)
        if not needed_tokens:
            return 0.0

        candidate_tokens = RecommendationService.tokenize_skills(candidate_skills_raw)
        if not candidate_tokens:
            return 0.0

        matched_needed = skills_match(needed_tokens, candidate_tokens)

        score = round((len(matched_needed) / len(needed_tokens)) * 70.0, 2)
        return score

    @staticmethod
    def rank_candidates(
        db: Session,
        needed_skills: str,
        target_municipality: str,
        target_barangay: str = None,
        limit: int = 50,
    ) -> CandidateRankingResponse:
        """
        Ranks job seeker candidates for an employer posting (Two-Tier Ranking, Section 7.2.3):
        - Tier 1: Total Score > 0, sorted by (Total Score DESC, full_name ASC)
        - Tier 2: Total Score == 0, sorted by full_name ASC
        Candidate details are sanitized (zero phone/email leakage).
        """
        candidates = UserRepository.list_job_seekers(db, limit=limit * 2)
        tier_1: List[CandidateScoreOut] = []
        tier_2 = []

        for candidate in candidates:
            # Sanitized candidate representation
            summary = UserService.search_job_seekers(db, municipality=candidate.municipality, limit=1)
            # Find the matching summary for this candidate
            cand_summary = next((s for s in summary if s.id == candidate.id), None)
            if not cand_summary:
                isl = GeographyService.resolve_island(candidate.municipality) or "Batan Island"
                bio = candidate.job_seeker_profile.bio if candidate.job_seeker_profile else None
                edu = candidate.job_seeker_profile.education if candidate.job_seeker_profile else None
                exp = candidate.job_seeker_profile.experience_years if candidate.job_seeker_profile else 0
                from app.schemas.user import PublicJobSeekerSummary
                cand_summary = PublicJobSeekerSummary(
                    id=candidate.id,
                    full_name=candidate.full_name,
                    municipality=candidate.municipality,
                    island=isl,
                    barangay=candidate.barangay,
                    skills=candidate.skills,
                    education=edu,
                    experience_years=exp,
                    bio=bio,
                    profile_pic=candidate.profile_pic,
                )

            skill_score = RecommendationService.calculate_skill_score(needed_skills, candidate.skills or "")
            geo_score = GeographyService.score_distance(
                target_municipality, target_barangay, candidate.municipality, candidate.barangay
            )
            total_score = round(skill_score + geo_score, 2)

            if total_score > 0:
                tier_1.append(
                    CandidateScoreOut(
                        candidate=cand_summary,
                        skill_score=skill_score,
                        geographic_score=geo_score,
                        total_score=total_score,
                    )
                )
            else:
                tier_2.append(cand_summary)

        # Sort Tier 1: Total Score DESC, full_name ASC
        tier_1.sort(key=lambda item: (-item.total_score, item.candidate.full_name.lower()))
        # Sort Tier 2: full_name ASC
        tier_2.sort(key=lambda cand: cand.full_name.lower())

        return CandidateRankingResponse(
            tier_1=tier_1[:limit],
            tier_2=tier_2[:limit],
        )

    @staticmethod
    def rank_jobs_for_seeker(
        db: Session, seeker: User, limit: int = 50
    ) -> JobRankingResponse:
        """
        Ranks active jobs for a job seeker (Two-Tier Ranking, Section 7.2.3):
        - Tier 1: Total Score > 0, sorted by (Total Score DESC, title ASC)
        - Tier 2: Total Score == 0, sorted by title ASC
        """
        active_jobs = JobRepository.list_active_jobs(db, limit=limit * 2)
        tier_1: List[JobScoreOut] = []
        tier_2 = []

        seeker_skills = seeker.skills or ""

        for job in active_jobs:
            job_out = JobService._to_job_out(job)
            skill_score = RecommendationService.calculate_skill_score(job.required_skills, seeker_skills)
            geo_score = GeographyService.score_distance(
                job.municipality, job.barangay, seeker.municipality, seeker.barangay
            )
            total_score = round(skill_score + geo_score, 2)

            if total_score > 0:
                tier_1.append(
                    JobScoreOut(
                        job=job_out,
                        skill_score=skill_score,
                        geographic_score=geo_score,
                        total_score=total_score,
                    )
                )
            else:
                tier_2.append(job_out)

        # Sort Tier 1: Total Score DESC, title ASC
        tier_1.sort(key=lambda item: (-item.total_score, item.job.title.lower()))
        # Sort Tier 2: title ASC
        tier_2.sort(key=lambda j: j.title.lower())

        return JobRankingResponse(
            tier_1=tier_1[:limit],
            tier_2=tier_2[:limit],
        )
