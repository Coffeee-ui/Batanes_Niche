from typing import Dict, List, Optional, Tuple

CANONICAL_GEOGRAPHY: Dict[str, Dict[str, List[str]]] = {
    "Batan Island": {
        "Basco": [
            "Chanarian",
            "Kayhuvokan (Santa Rosa)",
            "Kayvaluganan",
            "San Antonio",
            "San Joaquin",
            "Santo Domingo (Ihubok II)",
        ],
        "Mahatao": [
            "Hanheng",
            "Kaumbakan",
            "Panatayan",
            "Uvoy",
        ],
        "Ivana": [
            "Radiwan",
            "Salagao",
            "San Vicente (Igang)",
            "Tuhel",
        ],
        "Uyugan": [
            "Imnajbu",
            "Itbud",
            "Kayvaluganan (Kayuganan)",
            "Kaybatbatan",
        ],
    },
    "Sabtang Island": {
        "Sabtang": [
            "Chavayan",
            "Malakdang",
            "Nakanmuan",
            "Savidug",
            "Sinakan",
            "Sumnanga",
        ],
    },
    "Itbayat Island": {
        "Itbayat": [
            "Raele",
            "San Rafael (Idiang)",
            "Santa Lucia (Kauhauhasan)",
            "Santa Maria (Marapuy)",
            "Santa Rosa (Kaynatuan)",
        ],
    },
}

MUNICIPALITY_TO_ISLAND: Dict[str, str] = {
    "Basco": "Batan Island",
    "Mahatao": "Batan Island",
    "Ivana": "Batan Island",
    "Uyugan": "Batan Island",
    "Sabtang": "Sabtang Island",
    "Itbayat": "Itbayat Island",
}

ALL_MUNICIPALITIES: List[str] = list(MUNICIPALITY_TO_ISLAND.keys())


def resolve_island(municipality: str) -> Optional[str]:
    """Deterministically resolves island from municipality."""
    if not municipality:
        return None
    for canonical_mun, island in MUNICIPALITY_TO_ISLAND.items():
        if canonical_mun.lower() == municipality.strip().lower():
            return island
    return None


def get_canonical_municipality(municipality: str) -> Optional[str]:
    """Returns canonical municipality name if valid, else None."""
    if not municipality:
        return None
    clean = municipality.strip().lower()
    for canonical_mun in ALL_MUNICIPALITIES:
        if canonical_mun.lower() == clean:
            return canonical_mun
    return None


def get_canonical_barangay(municipality: str, barangay: str) -> Optional[str]:
    """
    Validates and returns canonical barangay for the given municipality.
    Supports composite names (e.g. 'San Vicente (Igang)' matches either full string or constituent parts).
    """
    canonical_mun = get_canonical_municipality(municipality)
    if not canonical_mun or not barangay:
        return None

    island = MUNICIPALITY_TO_ISLAND[canonical_mun]
    barangays = CANONICAL_GEOGRAPHY[island][canonical_mun]
    clean_bgy = barangay.strip().lower()

    for canonical_bgy in barangays:
        c_lower = canonical_bgy.lower()
        if c_lower == clean_bgy:
            return canonical_bgy
        # Check composite parts, e.g. "Kayhuvokan (Santa Rosa)" -> "Kayhuvokan", "Santa Rosa"
        if "(" in canonical_bgy and ")" in canonical_bgy:
            main_part = canonical_bgy.split("(")[0].strip().lower()
            paren_part = canonical_bgy.split("(")[1].split(")")[0].strip().lower()
            if clean_bgy in (main_part, paren_part):
                return canonical_bgy

    return None


def validate_location(municipality: str, barangay: Optional[str] = None) -> Tuple[bool, Optional[str], Optional[str], Optional[str]]:
    """
    Validates a municipality and optional barangay.
    Returns: (is_valid, canonical_island, canonical_municipality, canonical_barangay)
    """
    canonical_mun = get_canonical_municipality(municipality)
    if not canonical_mun:
        return False, None, None, None

    island = MUNICIPALITY_TO_ISLAND[canonical_mun]

    if not barangay:
        return True, island, canonical_mun, None

    canonical_bgy = get_canonical_barangay(canonical_mun, barangay)
    if canonical_bgy:
        return True, island, canonical_mun, canonical_bgy
    return False, None, None, None


def calculate_geographic_score(
    mun1: Optional[str], bgy1: Optional[str],
    mun2: Optional[str], bgy2: Optional[str]
) -> float:
    """
    Calculates geographic distance score (0.0 to 30.0 points) according to Section 7.2.2:
    - Same Barangay + Same Municipality = 30.0 pts (Hyper-local exact match)
    - Same Municipality (different/unspecified barangay) = 25.0 pts (Same municipal jurisdiction)
    - Same Island = 15.0 pts (Intra-island road transit accessible)
    - Inter-Island = 5.0 pts (Inter-island sea crossing required)
    - Unknown / Invalid Location = 0.0 pts
    """
    valid1, island1, c_mun1, c_bgy1 = validate_location(mun1 or "", bgy1)
    valid2, island2, c_mun2, c_bgy2 = validate_location(mun2 or "", bgy2)

    if not valid1 or not valid2:
        return 0.0

    if c_mun1 == c_mun2:
        if c_bgy1 and c_bgy2 and c_bgy1 == c_bgy2:
            return 30.0
        return 25.0

    if island1 == island2:
        return 15.0

    # Both valid in Batanes, but different islands
    return 5.0
