from typing import Dict, List, Optional, Tuple
from app.core.geography import (
    CANONICAL_GEOGRAPHY,
    ALL_MUNICIPALITIES,
    resolve_island,
    validate_location,
    calculate_geographic_score,
)


class GeographyService:
    @staticmethod
    def get_hierarchy() -> Dict[str, Dict[str, List[str]]]:
        """Returns canonical Batanes hierarchy."""
        return CANONICAL_GEOGRAPHY

    @staticmethod
    def get_municipalities() -> List[str]:
        """Returns list of canonical municipalities."""
        return ALL_MUNICIPALITIES

    @staticmethod
    def resolve_island(municipality: str) -> Optional[str]:
        """Deterministically derives island from municipality."""
        return resolve_island(municipality)

    @staticmethod
    def validate_location(municipality: str, barangay: Optional[str] = None) -> Tuple[bool, Optional[str], Optional[str], Optional[str]]:
        """
        Validates a municipality and optional barangay.
        Returns: (is_valid, canonical_island, canonical_municipality, canonical_barangay)
        """
        return validate_location(municipality, barangay)

    @staticmethod
    def score_distance(
        mun1: Optional[str], bgy1: Optional[str],
        mun2: Optional[str], bgy2: Optional[str]
    ) -> float:
        """
        Calculates geographic score (0 to 30 pts) according to Section 7.2.2.
        """
        return calculate_geographic_score(mun1, bgy1, mun2, bgy2)
