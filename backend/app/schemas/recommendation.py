from typing import List
from pydantic import BaseModel
from app.schemas.job import JobOut
from app.schemas.user import PublicJobSeekerSummary


class CandidateScoreOut(BaseModel):
    candidate: PublicJobSeekerSummary
    skill_score: float
    geographic_score: float
    total_score: float


class CandidateRankingResponse(BaseModel):
    tier_1: List[CandidateScoreOut]
    tier_2: List[PublicJobSeekerSummary]


class JobScoreOut(BaseModel):
    job: JobOut
    skill_score: float
    geographic_score: float
    total_score: float


class JobRankingResponse(BaseModel):
    tier_1: List[JobScoreOut]
    tier_2: List[JobOut]
