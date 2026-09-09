# 19 - Skills and Business Type Catalog

## 1. Overview

The **Batanes Niche Job Portal** defines a shared canonical vocabulary for skills and business/enterprise types.
This vocabulary is:

- Exposed to clients via the `/api/v1/meta/options` endpoint (`GET`).
- Consumed by the `SkillSelector` frontend component (`frontend/src/components/forms/SkillSelector.tsx`).
- Normalized on the backend by `SkillService` (`backend/app/services/skill_service.py`).
- Used as the input vocabulary for the deterministic recommendation engine (`RecommendationService`).

---

## 2. Canonical Skill Catalog

The current catalog is defined in `backend/app/api/v1/meta.py` as the `COMMON_SKILLS` list.
All 18 entries represent trade, vocational, and service competencies relevant to the Batanes island economy.

| # | Canonical Skill Name |
|---|---|
| 1 | Carpentry |
| 2 | Masonry |
| 3 | Plumbing |
| 4 | Electrical Installation |
| 5 | Arc Welding |
| 6 | Fishing & Marine Navigation |
| 7 | Agriculture & Crop Farming |
| 8 | Tourism & Tour Guiding |
| 9 | Hotel & Hospitality |
| 10 | Culinary Arts & Cooking |
| 11 | Retail & Sales |
| 12 | Bookkeeping & Accounting |
| 13 | Administrative Support |
| 14 | Motorcycle & Vehicle Repair |
| 15 | IT & Computer Literacy |
| 16 | Driving (Professional License) |
| 17 | Customer Service |
| 18 | Teaching & Tutoring |

> [!NOTE]
> The catalog is a Python list in `meta.py`. Adding or renaming a canonical skill requires updating `COMMON_SKILLS` and restarting the API. No database migration is required — skills are stored as comma-separated strings, not as foreign key references.

---

## 3. How Predefined Skills Are Represented

Canonical skills are stored as **comma-separated plain text** in:

- `users.skills` — for job seeker profiles.
- `jobs.required_skills` — for job postings.

Example stored value: `"Carpentry, Arc Welding, Customer Service"`

When a user selects a predefined skill from the catalog, the frontend `SkillSelector` resolves the value to its
canonical form (case-insensitive lookup). The backend `normalize_skill_values` function performs the same
resolution on write, so values stored in the database are always in canonical casing.

---

## 4. Custom ("Other") Skill Handling

Both the frontend and backend support custom skill values that fall outside the predefined catalog.

### Frontend (`SkillSelector`)

1. The `SkillSelector` dropdown exposes an **"Other"** option at the end of the canonical list.
2. Selecting **"Other"** reveals a free-text input field.
3. The user types a custom skill name and clicks **Add** (or presses `Enter`).
4. Before adding, the component normalizes the typed value (trim + collapse whitespace) and checks whether it
   matches a canonical entry — if it does, the canonical form is used; if not, the typed value is stored as-is.
5. The literal string `"Other"` itself (case-insensitive) is **rejected** and cannot be added as a skill value.
   This prevents the raw placeholder from being stored or compared.

### Backend (`SkillService`)

The `normalize_skill_values(values, catalog)` function:

1. Iterates over each comma-separated input value.
2. Strips whitespace and collapses internal spaces via `re.sub(r"\s+", " ", ...)`.
3. Skips any value that normalizes to `"other"` (case-insensitive via `str.casefold()`).
4. Attempts a canonical lookup: if the normalized value matches a catalog entry exactly, the canonical casing
   is stored; otherwise, the cleaned custom value is stored.
5. Deduplicates by normalized form — two values that normalize identically are stored only once.
6. Returns `None` if the result is empty (all tokens were filtered or the input was blank).

---

## 5. Deterministic Normalization

The normalization pipeline is fully deterministic:

```python
def normalize_skill(value: str) -> str:
    """Return the deterministic comparison value for a skill."""
    return re.sub(r"\s+", " ", value.strip().casefold())
```

- **No fuzzy logic**: Two values must resolve to identical normalized strings to be considered equal.
- **No semantic matching**: `"Cooking"` and `"Culinary Arts & Cooking"` are different normalized values.
- **Idempotent**: Running the normalization pipeline twice on the same data produces the same result.

This means skill data stored before the canonical catalog was introduced remains valid — it is simply treated
as a custom value until its normalized form exactly matches a catalog entry.

---

## 6. Canonical Skill Matching (Recommendation Engine)

The recommendation engine compares required skills against candidate skills using the same normalization pipeline.

### Matching Rules

1. Both `job.required_skills` and `user.skills` are split by commas and normalized via `normalize_skill_values`.
2. The literal value `"other"` is excluded from both sets before comparison.
3. A required skill is **matched** if and only if its normalized form appears exactly in the candidate's
   normalized skill set.
4. No substring logic, fuzzy matching, semantic similarity, or machine learning is used.
5. The match result feeds the proportional skill score formula (see [**09-Recommendation-Engine.md**](./09-Recommendation-Engine.md)).

### Custom Skill Matching

Custom values follow exactly the same rules. If a job requires `"Ivatan Stone Wall Construction"` and a
candidate has listed `"Ivatan Stone Wall Construction"`, the exact normalized match fires. If the candidate
listed `"stone wall construction"` (different casing or missing prefix), no match occurs.

---

## 7. Prevention of Literal "Other" Matches

The `skills_match` function explicitly excludes `"other"` from both the required and candidate sets:

```python
def skills_match(needed: Iterable[str], candidate: Iterable[str]) -> set[str]:
    candidate_by_id = {
        normalize_skill(value) for value in candidate
        if normalize_skill(value) != normalize_skill(OTHER_SKILL)
    }
    return {
        normalize_skill(value)
        for value in needed
        if normalize_skill(value) != normalize_skill(OTHER_SKILL)
        and normalize_skill(value) in candidate_by_id
    }
```

This ensures that a job posting with `required_skills = "Other"` and a candidate with `skills = "Other"`
do not score a false skill match.

---

## 8. Business / Enterprise Type Catalog

The current catalog is defined in `backend/app/api/v1/meta.py` as the `BUSINESS_TYPES` list.

| # | Canonical Business Type |
|---|---|
| 1 | Tourism & Hospitality |
| 2 | Retail & Wholesale |
| 3 | Construction & Engineering |
| 4 | Agriculture & Fisheries |
| 5 | Food & Beverage |
| 6 | Transportation & Logistics |
| 7 | Education & Training |
| 8 | Government / Public Service |
| 9 | Professional & Financial Services |
| 10 | General Enterprise |

### Custom Business Type

Employers may enter a custom business type that does not appear in the catalog:

1. The `ProfilePage` frontend renders an **"Other"** option in the business type selector.
2. Selecting "Other" reveals a free-text input field for a custom business type string.
3. The backend stores the value as-is via `" ".join(update_data.business_type.split())` — whitespace is
   collapsed but casing is preserved. No canonical lookup is applied to business types.
4. On reload, if the stored value is not in the canonical catalog, the selector shows "Other" and the
   custom input field is pre-populated with the stored value.

---

## 9. Business Type → Suggested Skills (Not Implemented in V2)

> [!IMPORTANT]
> The V2 implementation does **not** include an automatic Business Type → Suggested Skills mapping.
> The employer selects required skills for each job posting independently via the `SkillSelector`.
> The business type stored on the employer's profile has no programmatic effect on job skill suggestions.
>
> If this feature is added in a future version, this document should be updated.

---

## 10. Job Required Skills

Job postings use the same canonical skill vocabulary as job seeker profiles.

- When creating or editing a job, the employer uses the `SkillSelector` component (identical to the profile
  page) to specify `required_skills`.
- The frontend serializes selected skills as a comma-separated string: `selectedSkills.join(', ')`.
- The backend (`JobService.create_job` and `JobService.update_job`) calls `serialize_skill_values` on the
  submitted string, applying the full normalization pipeline before persisting.
- If the submitted skills string contains only tokens that normalize to empty or to `"other"`, the backend
  raises `HTTP 400 Bad Request` with the message:
  > "A custom value is required when selecting Other as a skill."
- Required skills are optional on a job posting. If empty (`""`), the field is stored as an empty string and
  the recommendation engine returns `0.0` skill score for all candidates (no penalty; the job simply has
  no required-skill matching).

---

## 11. Migration and Compatibility

### Pre-Catalog Skill Data

Existing skill values stored before the canonical catalog was introduced are treated as **custom values**.
They are preserved verbatim (after whitespace normalization).

- If a legacy value happens to match a canonical entry (case-insensitively), it is silently upgraded to
  canonical casing on the next profile save.
- If it does not match, it is stored as a valid custom value and participates in exact matching.
- No one-time migration script has been executed to retroactively canonicalize existing data.

### Idempotency

Running the normalization pipeline on already-normalized data produces the same output. Safe to apply
repeatedly without duplicating or corrupting stored skill values.

---

## 12. Next Steps

- For the full scoring model that consumes normalized skills, see [**09-Recommendation-Engine.md**](./09-Recommendation-Engine.md).
- For backend authorization rules governing who can update skills and job requirements, see [**07-User-Roles-and-Permissions.md**](./07-User-Roles-and-Permissions.md).
- For the geography catalog that works alongside skill matching, see [**13-Geography-and-Reference-Data.md**](./13-Geography-and-Reference-Data.md).
