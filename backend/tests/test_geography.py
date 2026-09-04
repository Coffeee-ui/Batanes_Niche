import pytest
from app.services.geography_service import GeographyService
from app.services.recommendation_service import RecommendationService


def test_automatic_island_resolution():
    """Section 7.1.1: Municipality deterministically resolves island."""
    assert GeographyService.resolve_island("Basco") == "Batan Island"
    assert GeographyService.resolve_island("Mahatao") == "Batan Island"
    assert GeographyService.resolve_island("Ivana") == "Batan Island"
    assert GeographyService.resolve_island("Uyugan") == "Batan Island"
    assert GeographyService.resolve_island("Sabtang") == "Sabtang Island"
    assert GeographyService.resolve_island("Itbayat") == "Itbayat Island"
    assert GeographyService.resolve_island("NonExistent") is None


def test_location_validation_and_composite_names():
    """Section 7.1.2: Validates canonical municipalities, barangays, and composite names."""
    # Exact canonical match
    valid, island, mun, bgy = GeographyService.validate_location("Basco", "San Antonio")
    assert valid is True
    assert island == "Batan Island"
    assert mun == "Basco"
    assert bgy == "San Antonio"

    # Composite name matching either full or constituent parts
    valid, _, _, bgy_comp = GeographyService.validate_location("Basco", "Santa Rosa")
    assert valid is True
    assert "Kayhuvokan" in bgy_comp

    valid, _, _, bgy_full = GeographyService.validate_location("Basco", "Kayhuvokan (Santa Rosa)")
    assert valid is True

    # Invalid barangay
    valid_inv, _, _, _ = GeographyService.validate_location("Basco", "NotABarangay")
    assert valid_inv is False


def test_geographic_distance_scoring():
    """
    Section 7.2.2 Geographic Scoring Breakdown:
    - Same Barangay + Same Municipality = 30.0 pts (Hyper-local exact match)
    - Same Municipality (different/unspecified) = 25.0 pts
    - Same Island = 15.0 pts
    - Inter-Island = 5.0 pts
    - Unknown / Invalid = 0.0 pts
    """
    # 30.0 pts: Same Barangay + Same Municipality
    score_30 = GeographyService.score_distance("Basco", "San Antonio", "Basco", "San Antonio")
    assert score_30 == 30.0

    # 25.0 pts: Same Municipality, different barangay
    score_25 = GeographyService.score_distance("Basco", "San Antonio", "Basco", "Chanarian")
    assert score_25 == 25.0

    # 15.0 pts: Same Island (Basco to Mahatao on Batan Island)
    score_15 = GeographyService.score_distance("Basco", "San Antonio", "Mahatao", "Uvoy")
    assert score_15 == 15.0

    # 5.0 pts: Inter-Island (Basco on Batan Island to Sabtang on Sabtang Island)
    score_5 = GeographyService.score_distance("Basco", "San Antonio", "Sabtang", "Chavayan")
    assert score_5 == 5.0

    # 0.0 pts: Invalid location
    score_0 = GeographyService.score_distance("Basco", "San Antonio", "Manila", "Intramuros")
    assert score_0 == 0.0


def test_bidirectional_substring_skill_matching():
    """
    Section 7.2.1 Skill Matching:
    - Deterministic bidirectional substring matching: (k in c or c in k)
    - 'weld' matches 'arc welding' (k is substring of c) -> valid match
    - 'welder' does NOT match 'arc welding' under substring rules -> invalid match
    """
    # 'weld' in 'arc welding' -> matched
    score_match = RecommendationService.calculate_skill_score("weld", "arc welding, plumbing")
    assert score_match == 70.0

    # 'welder' is NOT in 'arc welding', and 'arc welding' is NOT in 'welder' -> 0.0
    score_nomatch = RecommendationService.calculate_skill_score("welder", "arc welding, plumbing")
    assert score_nomatch == 0.0

    # Multiple skills partial match (1 of 2 matched -> round(1/2 * 70) = 35.0)
    score_half = RecommendationService.calculate_skill_score("weld, carpentry", "arc welding, plumbing")
    assert score_half == 35.0

    # Empty needed keywords -> 0.0
    score_empty = RecommendationService.calculate_skill_score("", "arc welding")
    assert score_empty == 0.0
