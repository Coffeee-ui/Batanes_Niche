# 18 - Architecture Decision Records (ADRs)

This document chronicles the **14 foundational Architectural Decision Records (ADRs)** governing the design, implementation, and operational boundaries of the **Batanes Niche Job Portal (Version 2)**.

---

## ADR Index

| ADR # | Decision Title | Status | Date |
|---|---|---|---|
| **ADR-001** | [Modular Monolith Architecture](#adr-001-modular-monolith-architecture) | Accepted | 2026-09 |
| **ADR-002** | [React 18 Single-Page Application for Public Experience](#adr-002-react-18-single-page-application-for-public-experience) | Accepted | 2026-09 |
| **ADR-003** | [Backend-Owned Server-Rendered Jinja2 Admin Portal](#adr-003-backend-owned-server-rendered-jinja2-admin-portal) | Accepted | 2026-09 |
| **ADR-004** | [RESTful API Protocol with Pydantic & SlowAPI](#adr-004-restful-api-protocol-with-pydantic--slowapi) | Accepted | 2026-09 |
| **ADR-005** | [Stateless Access JWTs with Stateful Refresh Token Rotation](#adr-005-stateless-access-jwts-with-stateful-refresh-token-rotation) | Accepted | 2026-09 |
| **ADR-006** | [6-Digit Email OTP Password Recovery](#adr-006-6-digit-email-otp-password-recovery) | Accepted | 2026-09 |
| **ADR-007** | [Dual Database Strategy: PostgreSQL Production, SQLite Local/Testing](#adr-007-dual-database-strategy-postgresql-production-sqlite-localtesting) | Accepted | 2026-09 |
| **ADR-008** | [Repository Pattern and Decoupled Domain Services](#adr-008-repository-pattern-and-decoupled-domain-services) | Accepted | 2026-09 |
| **ADR-009** | [Deterministic Two-Tier Recommendation Algorithm](#adr-009-deterministic-two-tier-recommendation-algorithm) | Accepted | 2026-09 |
| **ADR-010** | [Intentional Exclusion of Real-Time Chat and Offline Sync in V2](#adr-010-intentional-exclusion-of-real-time-chat-and-offline-sync-in-v2) | Accepted | 2026-09 |
| **ADR-011** | [Semantic HSL Design Tokens and Native Dark Mode](#adr-011-semantic-hsl-design-tokens-and-native-dark-mode) | Accepted | 2026-09 |
| **ADR-012** | [Append-Only Audit Logging and Redacted Error Reporting](#adr-012-append-only-audit-logging-and-redacted-error-reporting) | Accepted | 2026-09 |
| **ADR-013** | [Canonical Batanes Geographic Hierarchy Enforcement](#adr-013-canonical-batanes-geographic-hierarchy-enforcement) | Accepted | 2026-09 |
| **ADR-014** | [Transactional Coupling of Application Status and Notifications](#adr-014-transactional-coupling-of-application-status-and-notifications) | Accepted | 2026-09 |

---

## ADR-001: Modular Monolith Architecture

### Context
The platform serves a regional provincial population across three islands. Developing distributed microservices would introduce excessive network complexity, distributed transactions, and high infrastructure costs disproportionate to traffic volumes.

### Decision
Implement the backend as a **Modular Monolith** in FastAPI, structured into clear vertical domain slices (Auth, Users, Jobs, Applications, Recommendations) backed by decoupled domain services and repositories.

### Consequences
- **Positive**: Single codebase, straightforward local debugging, atomic ACID database transactions, simple single-container deployment.
- **Negative**: Monolithic scaling, though entirely adequate for provincial scale.

### Alternatives Considered
- Microservices architecture (rejected: unnecessary complexity, operational burden).

---

## ADR-002: React 18 Single-Page Application for Public Experience

### Context
Public job seekers and employers require a fluid, responsive client-side interface with real-time filtering, interactive modal dialogues, instant client-side validation, and accessible bookmarking.

### Decision
Build the public web application as a Single Page Application (SPA) using React 18, Vite, TypeScript, and Tailwind CSS, compiled to static assets served via Nginx.

### Consequences
- **Positive**: Rich user experience, instant route transitions, offline-capable asset caching.
- **Negative**: Requires client-side routing fallback in Nginx (`try_files $uri $uri/ /index.html`).

---

## ADR-003: Backend-Owned Server-Rendered Jinja2 Admin Portal

### Context
Including administrative moderation logic, user suspension screens, and database error inspectors in the client-side JavaScript bundle creates security vulnerabilities and leaks internal administrative structures.

### Decision
Host the administrative portal under `/admin` as a server-side rendered (SSR) Jinja2 interface directly within FastAPI, completely separate from the React SPA.

### Consequences
- **Positive**: Zero administrative bundle leakage, reduced attack surface, independent of frontend builds.
- **Negative**: Requires maintaining Jinja2 HTML templates alongside React components.

---

## ADR-004: RESTful API Protocol with Pydantic & SlowAPI

### Context
Client-server communication requires strict type validation, predictable HTTP status codes, and rate-limiting to prevent automated scraping or denial of service.

### Decision
Standardize on RESTful JSON over HTTP mounted at `/api/v1`. Enforce request/response serialization using Pydantic v2 and apply route-level rate limits via SlowAPI.

### Consequences
- **Positive**: Auto-generated Swagger documentation, deterministic validation errors, bot protection.
- **Negative**: Requires synchronizing TypeScript types with Pydantic schemas.

---

## ADR-005: Stateless Access JWTs with Stateful Refresh Token Rotation

### Context
Purely stateless JWTs cannot be revoked upon logout or account suspension. Purely session-based authentication requires distributed session stores that complicate multi-worker deployments.

### Decision
Adopt a hybrid approach:
- Short-lived (15-minute) stateless JWT access tokens for high performance.
- Stateful, rotating refresh tokens stored as SHA-256 hashes in `refresh_tokens`.
- Compromise detection: Reusing an already-revoked refresh token immediately terminates all user sessions.
- Blacklisting: Logging out adds the access token's `jti` to `revoked_tokens`.

### Consequences
- **Positive**: Resilient token lifecycle, instantaneous compromise containment, fast stateless authorization.
- **Negative**: Requires periodic pruning of expired `revoked_tokens`.

---

## ADR-006: 6-Digit Email OTP Password Recovery

### Context
Complex password reset links with long query tokens often break in mobile email clients or SMS gateways, while exposing users to URL-based token leakage.

### Decision
Implement password reset via a 6-digit numeric OTP generated via CSPRNG, stored as a bcrypt hash in `password_reset_tokens`, expiring in 15 minutes, with a strict 5-attempt brute-force limit. Dispatched via SMTP with generic HTTP 200 responses to prevent account enumeration.

### Consequences
- **Positive**: Mobile-friendly, auditable, zero token leakage in URLs, brute-force resistant.
- **Negative**: Requires operational SMTP mail relay.

---

## ADR-007: Dual Database Strategy: PostgreSQL Production, SQLite Local/Testing

### Context
Developers need to bootstrap local development and run 40+ unit tests in seconds without configuring an external PostgreSQL database server, while production requires rock-solid concurrency and WAL backups.

### Decision
Use SQLAlchemy 2.0 with PostgreSQL 16 in production (`postgresql+asyncpg://`) and SQLite in local development and automated testing (`sqlite:///./batanes_niche.db` and `sqlite:///:memory:`).

### Consequences
- **Positive**: Rapid local onboarding, sub-second test runs in CI, enterprise durability in production.
- **Negative**: Requires adhering to portable SQL constructs avoiding PostgreSQL-only proprietary syntax.

---

## ADR-008: Repository Pattern and Decoupled Domain Services

### Context
Writing SQL queries or ORM calls directly inside route handlers couples transport protocols to data storage, making automated testing and business logic reuse difficult.

### Decision
Enforce a four-tier separation: `Router -> Domain Service -> Repository -> Data Model`. Route handlers only parse HTTP and invoke services; services execute business logic and call repositories; repositories execute SQLAlchemy queries.

### Consequences
- **Positive**: Clean unit testing via mock repositories, centralized query optimization, clean architecture.
- **Negative**: Additional boilerplate files for simple CRUD actions.

---

## ADR-009: Deterministic Two-Tier Recommendation Algorithm

### Context
Opaque AI models or vector embeddings can unfairly rank non-technical trade workers and fail to represent the physical transit reality of island geography.

### Decision
Implement a deterministic matching formula:
- **Skill Score (0–70 pts)**: Tokenized bidirectional substring match.
- **Geographic Distance Score (0–30 pts)**: Explicit transit accessibility (30 same bgy, 25 same mun, 15 same island, 5 inter-island, 0 unknown).
- **Two-Tier Sorting**: Tier 1 (Score > 0) ordered by Score DESC; Tier 2 (Score == 0) ordered alphabetically.

### Consequences
- **Positive**: 100% explainable, deterministic, zero AI infrastructure costs, respects island geography.
- **Negative**: Requires accurate self-reporting of trade skills.

---

## ADR-010: Intentional Exclusion of Real-Time Chat and Offline Sync in V2

### Context
Version 2 is focused on delivering a rock-solid, production-grade core matching engine. Real-time chat, WebSocket connection pools, and offline data synchronization introduce significant complexity and potential instability.

### Decision
Explicitly exclude real-time chat, WebSockets, and offline background synchronization from Version 2. Facilitate communication via persistent in-app notifications, structured status updates, and authorized direct telephone/email contact.

### Consequences
- **Positive**: Highly stable system, minimal moving parts, rapid operational debugging.
- **Negative**: Users must communicate outside the portal once an application is accepted.

---

## ADR-011: Semantic HSL Design Tokens and Native Dark Mode

### Context
Hardcoding hex codes in UI components causes styling fragmentation and makes accessible theme switching cumbersome.

### Decision
Establish CSS Custom Properties using HSL values in `index.css`, mapped to Tailwind CSS semantic utilities (`bg-surface`, `text-primary`), with native dark mode toggled via `[data-theme='dark']`.

### Consequences
- **Positive**: Consistent branding, effortless dark theme toggling, clean component styles.
- **Negative**: Requires adhering to CSS variable naming conventions.

---

## ADR-012: Append-Only Audit Logging and Redacted Error Reporting

### Context
Administrators require full visibility into sensitive actions (user suspensions, job disabling) and unhandled 500 exceptions without risking the accidental logging of user passwords or tokens.

### Decision
Implement `AuditService` and `ErrorLoggingService` with automatic recursive scrubbing that replaces any key containing `password`, `token`, `otp`, `secret`, `hash` with `[REDACTED]`. Audit logs are append-only.

### Consequences
- **Positive**: Comprehensive compliance trail, zero secret leakage, safe debugging.
- **Negative**: Slight overhead on error logging to perform payload scrubbing.

---

## ADR-013: Canonical Batanes Geographic Hierarchy Enforcement

### Context
User typos in municipality and barangay names cause broken geographic distance scoring and fragmented search filters.

### Decision
Enforce a canonical hierarchy of 3 islands, 6 municipalities, and 29 barangays in `backend/app/core/geography.py`. Validate all profile updates and job postings against this hierarchy, supporting canonical composite aliases (e.g., *Kayhuvokan (Santa Rosa)*).

### Consequences
- **Positive**: Perfect data integrity, reliable distance scoring, clean search facets.
- **Negative**: Requires updating code if provincial barangay boundaries are altered.

---

## ADR-014: Transactional Coupling of Application Status and Notifications

### Context
If a job application succeeds but notification generation fails, employers are unaware of incoming candidates. If an applicant is accepted but not notified, hiring stalls.

### Decision
Enforce explicit database transaction boundaries (`db.commit()` with rollback on exception) coupling application mutations with recipient in-app notifications.

### Consequences
- **Positive**: Zero dropped notifications, strict data consistency, predictable state.
- **Negative**: A failure in notification creation aborts the application action.

---

## Next Steps

- To explore system implementation details, return to the [**Documentation Index**](./README.md).
- To begin local development, follow the [**Developer Guide**](./17-Developer-Guide.md).
