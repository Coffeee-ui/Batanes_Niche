# 01 - System Overview

## 1. Domain Context & Purpose

The **Batanes Niche Job Portal** is an employment marketplace and talent matching platform specifically engineered for the province of **Batanes, Philippines**.

Batanes is the northernmost and smallest province in the Philippines, composed of ten islands, three of which are permanently inhabited: **Batan Island**, **Sabtang Island**, and **Itbayat Island**. The province is characterized by unique geographical, demographic, and economic conditions:
- **Geographic Fragmentation & Sea Barriers**: Municipalities are separated by open ocean waters (e.g., the Balintang Channel and Luzon Strait). Travel between Batan and the outer islands of Sabtang and Itbayat requires inter-island motorboat or falowa sea crossings, which are highly subject to weather conditions and seasonal monsoons.
- **Micro and Seasonal Economy**: The private sector consists primarily of micro, small, and medium enterprises (MSMEs) in eco-tourism, hospitality, agriculture, fisheries, local construction, and traditional trades. Many job opportunities are seasonal or project-based.
- **Talent Retention**: Skilled Ivatan workers frequently migrate to mainland Luzon due to limited visibility into local employment opportunities, while local businesses struggle to find verified workers residing on the same island or municipality.

The Batanes Niche Job Portal solves these structural challenges by delivering a **hyper-localized matching system** that prioritizes transit accessibility, island residency, and practical vocational skills.

---

## 2. Core Value Propositions

| Stakeholder | Key Challenges Addressed | System Value Proposition |
|---|---|---|
| **Job Seekers** | High cost and logistical friction of traveling across islands for job inquiries; lack of visibility into local enterprise vacancies. | Access to verified local vacancies; hyper-local distance transparency; automated matching based on island location and vocational skills; bookmarking vacancies. |
| **Local Employers** | Difficulty reaching trade workers across distant barangays; receiving unqualified applicants from outside the island. | Hyper-targeted candidate discovery; ranking applicants by proximity and skill fit; streamlined application review; direct contact revelation upon application. |
| **Provincial & Municipal Administration** | Lack of visibility into provincial labor supply/demand; lack of oversight on employment practices. | Centralized server-rendered administration dashboard; user moderation; job posting review; append-only audit trail of sensitive actions; error reporting. |

---

## 3. Target User Personas

1. **The Ivatan Job Seeker**:
   - Residents of Batanes seeking full-time, part-time, seasonal, or contractual employment.
   - Skillsets span hospitality, eco-tourism guiding, culinary arts, carpentry, stonemasonry, electrical work, agriculture, fishing, driving, and administrative support.
   - Accesses the portal via mobile or desktop web browsers with varying connectivity speeds.

2. **The Local Enterprise Employer**:
   - Proprietors and managers of local lodges, homestays, tour agencies, restaurants, hardware stores, construction contractors, cooperative societies, and municipal projects.
   - Need reliable local candidates living within commuting distance to minimize absenteeism during severe weather.

3. **The System Administrator**:
   - Municipal or platform administrators responsible for maintaining platform integrity, moderating bad-faith postings, suspending offending accounts, inspecting unhandled system errors, and reviewing compliance audit trails.

---

## 4. Version 2 Implemented Feature Scope

Version 2 represents a robust, production-ready release with the following core functional modules:

### 4.1 Authentication & Account Management
- **Role Invariant Registration**: Public registration exclusively for `job_seeker` and `employer` accounts. Automatic profile entity creation (`job_seeker_profiles` or `employer_profiles`).
- **Cryptographic Security**: Password hashing using bcrypt with a work factor of 12.
- **Stateless/Stateful Token Lifecycle**: Short-lived (15-minute) stateless JWT access tokens paired with 7-day stateful refresh tokens stored as SHA-256 hashes with automatic rotation and token-reuse compromise detection.
- **Instant Revocation & JTI Blacklisting**: User logout invalidates the active refresh token and blacklists the access token's `jti` in a `revoked_tokens` table.
- **Zero-Enumeration OTP Password Recovery**: Cryptographically secure 6-digit numeric OTPs, bcrypt-hashed in `password_reset_tokens`, dispatched via `EmailDeliveryService` with a 15-minute expiration and a strict 5-attempt brute-force limit.
- **Account Suspension**: Immediate rejection of login and token rotation when `account_status` is set to `suspended`.

### 4.2 Canonical Batanes Geography
- **Deterministic Geographic Model**: All user profiles and job postings are validated against the canonical geographic structure:
  - **Batan Island**: Basco (6 barangays), Mahatao (4 barangays), Ivana (4 barangays), Uyugan (4 barangays).
  - **Sabtang Island**: Sabtang (6 barangays).
  - **Itbayat Island**: Itbayat (5 barangays).
- **Composite Barangay Handling**: Robust support for canonical composite names (e.g., matching "Kayhuvokan" or "Santa Rosa" to `Kayhuvokan (Santa Rosa)`).

### 4.3 Profile Completeness Scoring
- **100-Point Formula**: Deterministic evaluation of user profile completeness rewarding both core contact info, canonical location, skills, and role-specific fields (bio and education for seekers; company details for employers).

### 4.4 Job Posting & Discovery
- **Full Lifecycle Management**: Creation, viewing, updating, and soft-deletion (`deleted_at IS NULL`) of vacancies.
- **Search & Filtering**: Real-time filtering by search query, municipality, employment type, and salary range.
- **Saved Jobs**: Job seekers can bookmark listings for subsequent review.

### 4.5 Applications & Transactional Notifications
- **Application Submission**: Validates active job status, prevents duplicate active applications, and atomically inserts the application while queuing an in-app notification for the employer.
- **Status State Machine**: Employers can transition applications between `pending`, `accepted`, and `rejected`. Each transition atomically generates a persistent notification for the job seeker.
- **Applicant Contact Reveal**: Job seeker contact details (email and phone) are strictly masked until the candidate formally submits an application to the employer's job posting.

### 4.6 Deterministic Recommendation Engine
- **Transparent Two-Tier Scoring**:
  - **Skill Match (0–70 Points)**: Case-insensitive tokenized bidirectional substring matching between candidate skills and required job skills.
  - **Geographic Proximity (0–30 Points)**: 30 pts for same barangay & municipality, 25 pts for same municipality, 15 pts for same island, 5 pts for inter-island, 0 pts for unknown/invalid.
  - **Tiering**: Candidates with Total Score > 0 are ranked in Tier 1 by Score DESC, then Name/Title ASC; candidates with Score = 0 are placed in Tier 2 sorted alphabetically.

### 4.7 Dedicated Administrative Portal
- **Server-Rendered Jinja2 UI**: Completely isolated under `/admin`, independent of the React client-side bundle.
- **Session-Based Security**: Signed HttpOnly cookies (`batanes_admin_session`) and CSRF tokens (`batanes_admin_csrf`) with a 12-hour expiration window.
- **Moderation Tools**: Search, suspend, and restore users; inspect, disable, and restore job listings; view unhandled 500 error reports; review append-only audit trails.

### 4.8 Observability & Security Perimeter
- **Append-Only Audit Logs**: Logs critical administrative and authentication events with automatic secret/password scrubbing.
- **Sanitized Error Reporting**: Unhandled 500 exceptions are captured in the database with scrubbed request payloads.
- **Zero-Jargon UI Contract**: System components, libraries, and internal architectural names are strictly forbidden from rendering in user-facing views.

---

## 5. Explicit Non-Features & Omissions (Version 2 Scope Boundaries)

To maintain stability, reliability, and security within the Batanes operating environment, the following features are **explicitly excluded** from the Version 2 implementation:

1. **No Real-Time Chat or Instant Messaging**:
   - The platform does **not** implement chat, direct messaging, or instant conversational threads.
   - All communication between employers and applicants occurs via the application status state machine, persistent in-app notifications, and authorized direct contact (email and telephone) once an application is submitted.
2. **No WebSockets or SSE Streaming**:
   - There are no persistent WebSocket connections or Server-Sent Events. All data retrieval relies on standard RESTful HTTP requests and polling where necessary.
3. **No Offline Synchronization or Service Worker Caching**:
   - The application does **not** support offline write-queuing or background synchronization. The system operates as an online web application.
4. **No Opaque AI / Black-Box Machine Learning**:
   - Recommendations do not use black-box neural networks, vector embeddings, or probabilistic models. The scoring engine is entirely deterministic and auditable.

---

## 6. High-Level System Architecture Summary

```
                      +-------------------------------------------------------+
                      |                      WEB CLIENT                       |
                      +-------------------------------------------------------+
                                  |                               |
                      Public Web Traffic                   Admin Web Traffic
                      (HTML/CSS/JS Assets)                (Server-Rendered UI)
                                  |                               |
                                  v                               v
                      +-----------------------+       +-----------------------+
                      |   React 18 SPA        |       |   Jinja2 Admin UI     |
                      |   (Vite + Tailwind)   |       |   (FastAPI SSR)       |
                      +-----------------------+       +-----------------------+
                                  |                               |
                           REST API Calls                    Form Posts
                           (Bearer JWT)                     (Session Cookie)
                                  |                               |
                                  +---------------+---------------+
                                                  |
                                                  v
                                      +-----------------------+
                                      |   FastAPI Application |
                                      |   Backend Gateway     |
                                      +-----------------------+
                                                  |
                     +----------------------------+----------------------------+
                     |                            |                            |
                     v                            v                            v
          +--------------------+        +--------------------+        +--------------------+
          |  Domain Services   |        |  Core Middleware   |        | External Services  |
          |  (Business Logic)  |        |  (CORS, SlowAPI,   |        | (SMTP Email OTP    |
          |                    |        |   Audit, Errors)   |        |  Delivery)         |
          +--------------------+        +--------------------+        +--------------------+
                     |
                     v
          +--------------------+
          | Repository Layer   |
          | (SQLAlchemy 2.0)   |
          +--------------------+
                     |
                     v
          +--------------------+
          | Relational DB      |
          | (PostgreSQL 16     |
          |  / SQLite local)   |
          +--------------------+
```

---

## 7. Next Steps

- For an in-depth architectural breakdown of system tiers, layers, and boundaries, see [**02-Architecture.md**](./02-Architecture.md).
- To examine the exact database schema and relationships, see [**04-Database-and-ERD.md**](./04-Database-and-ERD.md).
- To review the deterministic recommendation formula, see [**09-Recommendation-Engine.md**](./09-Recommendation-Engine.md).
