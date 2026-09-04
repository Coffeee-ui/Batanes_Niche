from typing import Dict, List
from pydantic import BaseModel


class MetadataOptionsOut(BaseModel):
    hierarchy: Dict[str, Dict[str, List[str]]]
    municipalities: List[str]
    skills: List[str]
    education_levels: List[str]
    employment_types: List[str]
    business_types: List[str]
