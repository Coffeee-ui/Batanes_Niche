import re
from typing import Iterable, List, Optional

from app.api.v1.meta import COMMON_SKILLS


OTHER_SKILL = "Other"


def normalize_skill(value: str) -> str:
    """Return the deterministic comparison value for a skill."""
    return re.sub(r"\s+", " ", value.strip().casefold())


def split_skills(raw_skills: Optional[str]) -> List[str]:
    if not raw_skills:
        return []
    return [value.strip() for value in raw_skills.split(",") if value.strip()]


def canonical_skill(value: str, catalog: Iterable[str] = COMMON_SKILLS) -> Optional[str]:
    normalized = normalize_skill(value)
    return next((skill for skill in catalog if normalize_skill(skill) == normalized), None)


def normalize_skill_values(values: Iterable[str], catalog: Iterable[str] = COMMON_SKILLS) -> List[str]:
    """Deduplicate canonical values and custom values without fuzzy matching."""
    result: List[str] = []
    seen = set()
    for value in values:
        cleaned = value.strip()
        if not cleaned or normalize_skill(cleaned) == normalize_skill(OTHER_SKILL):
            continue
        resolved = canonical_skill(cleaned, catalog) or re.sub(r"\s+", " ", cleaned)
        comparison_value = normalize_skill(resolved)
        if comparison_value not in seen:
            seen.add(comparison_value)
            result.append(resolved)
    return result


def serialize_skill_values(values: Iterable[str]) -> Optional[str]:
    normalized = normalize_skill_values(values)
    return ", ".join(normalized) or None


def skills_match(needed: Iterable[str], candidate: Iterable[str]) -> set[str]:
    candidate_by_id = {normalize_skill(value) for value in candidate if normalize_skill(value) != normalize_skill(OTHER_SKILL)}
    return {
        normalize_skill(value)
        for value in needed
        if normalize_skill(value) != normalize_skill(OTHER_SKILL)
        and normalize_skill(value) in candidate_by_id
    }