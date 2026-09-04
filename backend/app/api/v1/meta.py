from fastapi import APIRouter, status
from app.schemas.meta import MetadataOptionsOut
from app.services.geography_service import GeographyService

router = APIRouter(prefix="/meta", tags=["Metadata"])

COMMON_SKILLS = [
    "Carpentry",
    "Masonry",
    "Plumbing",
    "Electrical Installation",
    "Arc Welding",
    "Fishing & Marine Navigation",
    "Agriculture & Crop Farming",
    "Tourism & Tour Guiding",
    "Hotel & Hospitality",
    "Culinary Arts & Cooking",
    "Retail & Sales",
    "Bookkeeping & Accounting",
    "Administrative Support",
    "Motorcycle & Vehicle Repair",
    "IT & Computer Literacy",
    "Driving (Professional License)",
    "Customer Service",
    "Teaching & Tutoring",
]

EDUCATION_LEVELS = [
    "Elementary",
    "High School / Secondary",
    "Vocational / TVET / TESDA",
    "Associate Degree",
    "Bachelor's Degree",
    "Post-Graduate / Master's / Doctorate",
]

EMPLOYMENT_TYPES = [
    "Full-time",
    "Part-time",
    "Contract",
    "Seasonal",
    "Freelance",
]

BUSINESS_TYPES = [
    "Tourism & Hospitality",
    "Retail & Wholesale",
    "Construction & Engineering",
    "Agriculture & Fisheries",
    "Food & Beverage",
    "Transportation & Logistics",
    "Education & Training",
    "Government / Public Service",
    "Professional & Financial Services",
    "General Enterprise",
]


@router.get("/options", response_model=MetadataOptionsOut, status_code=status.HTTP_200_OK)
def get_metadata_options():
    """Retrieves canonical Batanes geography hierarchy and standard options."""
    return MetadataOptionsOut(
        hierarchy=GeographyService.get_hierarchy(),
        municipalities=GeographyService.get_municipalities(),
        skills=COMMON_SKILLS,
        education_levels=EDUCATION_LEVELS,
        employment_types=EMPLOYMENT_TYPES,
        business_types=BUSINESS_TYPES,
    )
