# 13 - Geography and Reference Data

## 1. Canonical Batanes Geographic Hierarchy

The **Batanes Niche Job Portal** is anchored on an authoritative geographic hierarchy modeling the **three permanently inhabited islands**, **six municipalities**, and **29 barangays** of the province of Batanes.

```
                                  +---------------------------------------+
                                  |           PROVINCE OF BATANES         |
                                  +---------------------------------------+
                                                      |
                  +-----------------------------------+-----------------------------------+
                  |                                   |                                   |
                  v                                   v                                   v
      +-----------------------+           +-----------------------+           +-----------------------+
      |      Batan Island     |           |     Sabtang Island    |           |    Itbayat Island     |
      +-----------------------+           +-----------------------+           +-----------------------+
                  |                                   |                                   |
     +------------+------------+                      |                                   |
     |      |           |      |                      |                                   |
     v      v           v      v                      v                                   v
   Basco Mahatao     Ivana   Uyugan                Sabtang                             Itbayat
  (6 Bgy) (4 Bgy)   (4 Bgy) (4 Bgy)                (6 Bgy)                             (5 Bgy)
```

---

## 2. Definitive Geographic Catalog

### 2.1 Batan Island (Total: 18 Barangays)

| Municipality | Canonical Barangay Name | Composite Alias / Sub-names Accepted | Character / Economic Profile |
|---|---|---|---|
| **Basco** (Capital) | `Chanarian` | - | Coastal community, beachfront lodges, transport hub |
| **Basco** | `Kayhuvokan (Santa Rosa)` | `Kayhuvokan`, `Santa Rosa` | Commercial center, public market, government services |
| **Basco** | `Kayvaluganan` | - | Commercial center, dining, banking, homestays |
| **Basco** | `San Antonio` | - | Residential and administrative district, provincial capitol |
| **Basco** | `San Joaquin` | - | Port access, fishing, trade services |
| **Basco** | `Santo Domingo (Ihubok II)` | `Santo Domingo`, `Ihubok II` | Town cathedral district, commercial hospitality |
| **Mahatao** | `Hanheng` | - | Agriculture, artisanal trades, coastal fishing |
| **Mahatao** | `Kaumbakan` | - | Heritage stone dwellings, eco-tourism guiding |
| **Mahatao** | `Panatayan` | - | Agricultural farming, cattle raising |
| **Mahatao** | `Uvoy` | - | Historic homestays, fishing, shelter port services |
| **Ivana** | `Radiwan` | - | Port of Ivana (transit point to Sabtang), tourism |
| **Ivana** | `Salagao` | - | Agriculture, traditional crafts, garlic production |
| **Ivana** | `San Vicente (Igang)` | `San Vicente`, `Igang` | Historic stone heritage sites, artisanal weaving |
| **Ivana** | `Tuhel` | - | Farming, traditional livestock management |
| **Uyugan** | `Imnajbu` | - | Historic chapel landmark, coastal fishing, tourism |
| **Uyugan** | `Itbud` | - | Communal pasture farming, eco-tourism |
| **Uyugan** | `Kayvaluganan (Kayuganan)` | `Kayvaluganan`, `Kayuganan` | Rice farming, traditional stone house maintenance |
| **Uyugan** | `Kaybatbatan` | - | Agricultural production, cattle rearing |

### 2.2 Sabtang Island (Total: 6 Barangays)

| Municipality | Canonical Barangay Name | Composite Alias Accepted | Character / Economic Profile |
|---|---|---|---|
| **Sabtang** | `Chavayan` | - | UNESCO-tentative heritage stone village, vakul weaving |
| **Sabtang** | `Malakdang` | - | Island administrative district, local commerce |
| **Sabtang** | `Nakanmuan` | - | Remote fishing community, artisanal boat building |
| **Sabtang** | `Savidug` | - | Traditional stone villages, eco-cultural tourism |
| **Sabtang** | `Sinakan` | - | Main island seaport, homestays, civic center |
| **Sabtang** | `Sumnanga` | - | Coastal fishing village, lobster catching, farming |

### 2.3 Itbayat Island (Total: 5 Barangays)

| Municipality | Canonical Barangay Name | Composite Alias Accepted | Character / Economic Profile |
|---|---|---|---|
| **Itbayat** | `Raele` | - | Agriculture, garlic and root crop farming |
| **Itbayat** | `San Rafael (Idiang)` | `San Rafael`, `Idiang` | Ancient Ivatan fortress site, communal cattle raising |
| **Itbayat** | `Santa Lucia (Kauhauhasan)` | `Santa Lucia`, `Kauhauhasan` | Town center, municipal administration, education |
| **Itbayat** | `Santa Maria (Marapuy)` | `Santa Maria`, `Marapuy` | Port access, cliff harbor logistics, fishing |
| **Itbayat** | `Santa Rosa (Kaynatuan)` | `Santa Rosa`, `Kaynatuan` | Upland agriculture, seasonal ginger and garlic |

---

## 3. Normalization & Validation Logic (`backend/app/core/geography.py`)

### 3.1 Composite Name Matching
Ivatan barangay names frequently incorporate historical or dialectal identifiers (e.g., *Kayhuvokan (Santa Rosa)*). The system implements flexible parsing:
- Inputs matching the complete canonical string (e.g., `"Kayhuvokan (Santa Rosa)"`) succeed.
- Inputs matching either constituent part (e.g., `"Kayhuvokan"` or `"Santa Rosa"`) automatically resolve to the canonical composite name.

### 3.2 Island Resolution
Municipalities map deterministically to their home island:
```python
MUNICIPALITY_TO_ISLAND = {
    "Basco": "Batan Island",
    "Mahatao": "Batan Island",
    "Ivana": "Batan Island",
    "Uyugan": "Batan Island",
    "Sabtang": "Sabtang Island",
    "Itbayat": "Itbayat Island",
}
```

---

## 4. Reference Options Endpoint (`GET /api/v1/meta/options`)

The metadata router exposes a public endpoint returning all canonical options for dropdowns, search filters, and badge selection:

```json
{
  "islands": ["Batan Island", "Sabtang Island", "Itbayat Island"],
  "municipalities": ["Basco", "Mahatao", "Ivana", "Uyugan", "Sabtang", "Itbayat"],
  "barangays_by_municipality": {
    "Basco": [
      "Chanarian",
      "Kayhuvokan (Santa Rosa)",
      "Kayvaluganan",
      "San Antonio",
      "San Joaquin",
      "Santo Domingo (Ihubok II)"
    ],
    ...
  },
  "employment_types": [
    "Full-time",
    "Part-time",
    "Contract",
    "Seasonal",
    "Internship"
  ],
  "curated_skills": [
    "Tourism & Tour Guiding",
    "Customer Service",
    "Hotel & Hospitality",
    "Culinary Arts & Cooking",
    "Carpentry & Masonry",
    "Electrical & Wiring",
    "Driving (Professional License)",
    "Plumbing",
    "Accounting & Bookkeeping",
    "Agriculture & Farming",
    "Fisheries & Marine",
    "Arc Welding"
  ]
}
```

---

## 5. Seed Data CLI (`python -m app.cli seed-data`)

The platform includes an automated reference seeder that populates realistic demonstration accounts and job listings grounded in authentic Ivatan geography:

```bash
cd backend
python -m app.cli seed-data
```

### Seeded Accounts & Listings
1. **System Administrator**: `admin@batanesniche.ph` (`admin` / `AdminSecure123!`).
2. **Local Enterprise Employer**: `batanes_inn` (*Batanes Seaside Inn & Tours*, Basco / Kayvaluganan).
   - Vacancy 1: *Tour Guide & Heritage Coordinator* (Basco / Kayvaluganan).
   - Vacancy 2: *Guest Services & Culinary Assistant* (Basco / Chanarian).
3. **Verified Job Seeker**: `ivatan_guide` (*Juan Abad*, Basco / San Antonio).
   - Skills: `"Tourism & Tour Guiding, Customer Service, Arc Welding"`.

---

## 6. Procedures for Updating Canonical Geography

If municipal boundaries or barangay classifications are altered by provincial ordinance:
1. Update dictionary definitions in `backend/app/core/geography.py`.
2. Generate an Alembic data migration if historical rows require renaming.
3. Run `pytest tests/test_geography.py` to confirm zero regression across validation, distance scoring, and composite alias resolution.

---

## 7. Next Steps

- For testing contracts covering geography validation, see [**14-Testing-and-Quality.md**](./14-Testing-and-Quality.md).
- To inspect production deployment and database persistence, see [**15-Deployment-and-Operations.md**](./15-Deployment-and-Operations.md).
- For complete developer extension runbooks, see [**17-Developer-Guide.md**](./17-Developer-Guide.md).
