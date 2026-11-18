# Documentation Changelog – Batanes Niche Job Portal

All documentation changes are tracked in this file.

Format:
```
## [version] – YYYY-MM-DD
### Changed
- Description of change, affected section, reason.
```

---

## [1.1.0] – 2026-11-19

### Final Audit Corrections & Deployment Documentation Update

#### 1.1 Application Status Labels – Code Fix
- **Issue**: `rejected` pipeline stage displayed as "Not Selected" in `ApplicationsPage.tsx` in both the `PIPELINE_STAGES` tab label and the `renderStatusBadge()` switch case. The approved label is "Rejected".
- **Fix**: Updated `frontend/src/pages/ApplicationsPage.tsx` — changed `{ key: 'rejected', label: 'Not Selected' }` to `{ key: 'rejected', label: 'Rejected' }` and updated the badge renderer and toast message accordingly.
- **Verification**: All 21 frontend tests pass. TypeScript typecheck passes.

#### 1.2 Git Ignore — Reference-UI/New-Ui/ Duplicate Entry
- **Issue**: `.gitignore` contained a redundant second entry `Reference-UI/New-Ui/` alongside the existing wildcard `Reference-UI/*`. The separate entry was both redundant and had incorrect casing (`New-Ui` instead of `New-UI`).
- **Fix**: Replaced the two-line block with a single consolidated `Reference-UI/*` entry and an explanatory comment clarifying that reference images are preserved on disk but excluded from git tracking to avoid binary file bloat.
- **Verification**: `git check-ignore` confirms `Reference-UI/New-UI/` is still correctly excluded by the wildcard. All reference images remain on disk and are unmodified.

#### 1.3 Email Delivery — Documentation Corrected
- **Issue**: `ENVIRONMENT_VARIABLES.md` and `DEPLOYMENT.md` documented SMTP/nodemailer variables (`MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_STARTTLS`, `MAIL_SSL_TLS`) as the OTP email delivery mechanism. The actual implementation in `backend/src/services/emailDeliveryService.ts` uses the **Resend HTTP API** (`RESEND_API_KEY`), not SMTP. SMTP config vars exist in `config.ts` but are not read by the email delivery service.
- **Fix**: Updated `ENVIRONMENT_VARIABLES.md` to document `RESEND_API_KEY` and `RESEND_FROM_EMAIL` as the correct email delivery variables, with an explicit note that SMTP vars are not currently used by the email service. Updated `DEPLOYMENT.md` Phase 2.2 environment variable table to replace SMTP vars with Resend vars. Added a Note callout clarifying email delivery mode (live vs. simulation).
- **Verification**: IMPLEMENTED. Resend API integration code exists and is correctly documented. Live email delivery requires a valid `RESEND_API_KEY` and cannot be verified without an active Resend account and deployed backend.

#### 1.4 Deployment Documentation — Typo Fixed
- **Issue**: `DEPLOYMENT.md` Step 2.3 had "Advance Settings" (typo) instead of "Advanced Settings".
- **Fix**: Corrected typo in `DEPLOYMENT.md`.

#### Schema Table Count — Documentation Correction
- **Issue**: CHANGELOG v1.0.0 referenced "12-table ERD" for the database diagram. The actual Prisma schema has 15 tables.
- **Fix**: Corrected count in CHANGELOG from "12-table" to "15-table".

### Verified Against Code (This Audit Session)
- **Account Roles**: Registration schema (`schemas/auth.ts`) strictly enforces `job_seeker` or `employer` only. Admin role exists only in the internal SSR portal (`admin/routes.ts`, `admin/auth.ts`) — no public registration path for `admin`. **VERIFIED**.
- **Application Pipeline**: Employer-side stages are `new → reviewing → shortlisted → interview → hired → rejected`. Job Seeker view maps `new` → `Submitted`. `withdrawn` is a separate terminal outcome. Now correctly shows `Rejected` (not "Not Selected"). **VERIFIED (after fix)**.
- **Password Recovery OTP**: 6-digit OTP, bcrypt hash storage, 15-minute expiry, 5-attempt lockout, single-use token, prior OTP invalidation on new request, all sessions revoked on successful reset. **IMPLEMENTED** in `authService.ts` and `passwordResetRepository.ts`.
- **Admin Access**: Internal-only at `/admin/*` on the backend. Session cookie auth (HMAC-SHA256), CSRF double-submit, rate-limited login. No public registration for admin role. **VERIFIED**.
- **Database Schema**: 15 tables confirmed in `backend/prisma/schema.prisma` and `Database/migrations/001_initial_schema.sql`. Both are synchronized. **VERIFIED**.

### Files Changed
- `frontend/src/pages/ApplicationsPage.tsx` — Status label fix (Rejected)
- `.gitignore` — Consolidated Reference-UI ignore rule, removed redundant duplicate entry
- `ENVIRONMENT_VARIABLES.md` — Replaced SMTP vars with Resend vars; added email delivery clarification note
- `DEPLOYMENT.md` — Replaced SMTP env table with Resend; fixed typo; added email delivery note
- `documentation/CHANGELOG.md` — This entry; corrected schema table count from 12 to 15

---

## [1.0.0] – 2026-11-18

### Initial Release
- **Analysis Date:** 2026-11-18
- **Repository Branch:** New-Features
- **Latest Commit:** d2bac96 (feat: add production readiness, database setup, deployment guides)
- **Documentation Author:** Automated analysis (Antigravity AI)

### Sections Documented
- Section 1: Project Title and System Overview
- Section 2: Background and Problem Statement
- Section 3: Project Objectives
- Section 4: Scope and Limitations
- Section 5: Functional and Non-Functional Requirements (FR-001–FR-030, NFR-001–NFR-012)
- Section 6: System Architecture Diagram (Mermaid source: `diagram-sources/system-architecture.mmd`)
- Section 7: System Design and Component Descriptions
- Section 8: Database ERD (15 tables — Prisma schema verified; Mermaid source: `diagram-sources/database-erd.mmd`)
- Section 9: System Integration and Communication
- Section 10: APIs, Middleware, Protocols (all 8 route modules documented)
- Section 11: Security Implementation (all mechanisms verified against source code)
- Section 12: Testing Procedures (typecheck + vitest infrastructure documented; API test cases marked Not Verified)
- Section 13: Deployment Information (Vercel + Render + Supabase stack documented)
- Section 14: Conclusion and Recommendations

### Diagrams Created
- `diagram-sources/system-architecture.mmd` — Full 4-tier architecture
- `diagram-sources/database-erd.mmd` — 15-table ERD from actual Prisma schema
- `diagram-sources/component-diagram.mmd` — Backend services, routes, repositories
- `diagram-sources/data-flow-diagram.mmd` — Application submission sequence diagram
- `diagram-sources/integration-diagram.mmd` — Vercel/Render/Supabase integration
- `diagram-sources/authentication-workflow.mmd` — JWT + OTP auth sequence
- `diagram-sources/recommendation-engine.mmd` — Scoring algorithm flowchart

### Supporting Documents Created
- `supporting-documents/API-Reference.md`
- `supporting-documents/Installation-Guide.md`
- `supporting-documents/User-Manual.md`
- `supporting-documents/Security-Analysis.md`
- `supporting-documents/Testing-Documentation.md`

### Implementation Status at Time of Analysis
| Feature | Status |
|---|---|
| User Registration + Login (JWT) | Implemented |
| OTP Password Reset | Implemented |
| Job Seeker Profile + Resume Upload | Implemented |
| Employer Profile + Job Posting | Implemented |
| Application Submission + Status Tracking | Implemented |
| Job Bookmarks (Saved Jobs) | Implemented |
| In-app Notifications | Implemented |
| Deterministic Recommendation Engine | Implemented |
| Admin SSR Portal (Nunjucks) | Implemented |
| Audit Logging | Implemented |
| Error Report Logging | Implemented |
| SQLite ↔ PostgreSQL Switching | Implemented |
| Docker Compose Deployment Config | Implemented |
| Rate Limiting (Auth Endpoints) | Implemented |
| File Upload Security (Magic Bytes) | Implemented |
| Real-time Chat / WebSockets | Not Implemented (intentionally excluded in V2 scope) |
| Offline Background Sync | Not Implemented (intentionally excluded in V2 scope) |
| Cloud Object Storage for Resumes | Not Implemented (filesystem only — ephemeral on Render) |
| Backend Integration Tests | Not Implemented |
| End-to-End Tests (Playwright/Cypress) | Not Implemented |

---

## Future Change Instructions

When implementing new features or modifying the application:

1. Update this CHANGELOG with the new version entry.
2. Identify which of the 14 documentation sections are affected.
3. Update affected sections in `Project-Technical-Documentation.docx`.
4. Update relevant Mermaid diagram sources and regenerate PNG/SVG exports.
5. Update API-Reference.md if endpoints change.
6. Update Security-Analysis.md if security mechanisms change.
7. Update the ERD source if database schema changes.
8. Update Testing-Documentation.md with new test cases.
9. Record the implementation status change in this CHANGELOG.
