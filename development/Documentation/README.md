# Batanes Niche Job Portal – Developer Documentation Package (Version 2)

Welcome to the comprehensive technical documentation for the **Batanes Niche Job Portal (Version 2)**. This package provides an in-depth reference for architects, software engineers, devops practitioners, and data analysts working with the codebase.

The system is a production-ready, hyper-localized employment marketplace engineered specifically for the province of Batanes, Philippines. It connects job seekers across the three inhabited islands (Batan, Sabtang, and Itbayat) with local enterprises and municipal initiatives through deterministic geographic and skill-based matching.

---

## Documentation Index

The documentation suite is structured into 18 specialized modules, each covering a specific architectural, operational, or business domain.

| # | Document | Primary Focus & Scope | Target Audience |
|---|---|---|---|
| **01** | [**System Overview**](./01-System-Overview.md) | Vision, problem statement, core value propositions, target personas, Version 2 feature scope, and explicit non-features. | All Stakeholders, New Engineers |
| **02** | [**Architecture**](./02-Architecture.md) | High-level system architecture, multi-tier layout, layered domain boundaries, cross-cutting middleware, and system Mermaid diagrams. | Architects, Senior Engineers |
| **03** | [**Repository Structure**](./03-Repository-Structure.md) | Complete directory tree breakdown (`backend/`, `frontend/`, `development/`, `docker/`), layer responsibilities, and code organization rules. | Backend & Frontend Engineers |
| **04** | [**Database and ERD**](./04-Database-and-ERD.md) | Full Mermaid Entity-Relationship Diagram (12 tables), schema definitions, constraints, indexes, lifecycle, and complete Data Dictionary. | Database Admins, Backend Engineers |
| **05** | [**API Architecture**](./05-API-Architecture.md) | REST API specifications, `/api/v1` routes, request/response contracts, validation, rate limiting, error handling, and endpoint catalog. | API Developers, Integration Partners |
| **06** | [**Authentication and Security**](./06-Authentication-and-Security.md) | JWT access/refresh token rotation, reuse detection, bcrypt hashing, 6-digit OTP password reset, CSRF, privacy rules, and security diagrams. | Security Engineers, Backend Devs |
| **07** | [**User Roles and Permissions**](./07-User-Roles-and-Permissions.md) | Role taxonomy (Guest, Seeker, Employer, Administrator), RBAC enforcement, capability matrix, and row-level ownership checks. | Backend Devs, QA Engineers |
| **08** | [**Business Workflows**](./08-Business-Workflows.md) | End-to-end operational workflows with detailed Mermaid flowcharts (Auth, Postings, Applications, Notifications, Admin actions). | System Analysts, Developers |
| **09** | [**Recommendation Engine**](./09-Recommendation-Engine.md) | Deterministic matching algorithm: 70-point skill score, 30-point geographic distance score, two-tier ranking formula, and calculation examples. | Data Engineers, Core Developers |
| **10** | [**Frontend Architecture**](./10-Frontend-Architecture.md) | React 18, Vite, TypeScript, Tailwind CSS, routing tables, AuthContext, Axios silent refresh interceptors, and HSL design tokens. | Frontend Engineers, UI/UX Designers |
| **11** | [**Administrative UI**](./11-Administrative-UI.md) | Backend-owned server-rendered Jinja2 admin interface (`/admin`), signed session cookies, CSRF protection, moderation tools, and audit log viewer. | Backend Engineers, Site Operators |
| **12** | [**Notifications and Applications**](./12-Notifications-and-Applications.md) | Application lifecycle state machine, transactional notification coupling, duplicate prevention, and applicant contact privacy reveal. | Full-stack Engineers, QA |
| **13** | [**Geography and Reference Data**](./13-Geography-and-Reference-Data.md) | Canonical Batanes geographic hierarchy (3 islands, 6 municipalities, 29 barangays), normalization algorithms, and seeding CLI. | Backend Devs, Database Maintainers |
| **14** | [**Testing and Quality**](./14-Testing-and-Quality.md) | Testing architecture, backend pytest suite (10 test modules, in-memory SQLite), frontend Vitest suite, zero-jargon tests, and CI gates. | QA Engineers, Full-stack Devs |
| **15** | [**Deployment and Operations**](./15-Deployment-and-Operations.md) | Production Docker compose architecture, Nginx reverse proxy routing, PostgreSQL persistence, database migrations, health probes, and backups. | DevOps, Sysadmins, SREs |
| **16** | [**Data Analysis Reference**](./16-Data-Analysis-Reference.md) | Analytical guide for researchers: Entity mapping, analytical dimensions, derived measures, SQL join recipes, and strict privacy exclusions. | Data Analysts, BI Engineers |
| **17** | [**Developer Guide**](./17-Developer-Guide.md) | Local environment onboarding, virtual environment setup, configuration, CLI tooling, dev servers, and step-by-step recipes for extending the code. | New Engineers, Contributors |
| **18** | [**Architecture Decisions**](./18-Architecture-Decisions.md) | 14 Architectural Decision Records (ADRs) detailing context, rationale, consequences, and alternatives for foundational design choices. | Architects, Lead Developers |

---

## Core System Characteristics

- **Zero-Jargon UI Contract**: The public interface is strictly tailored to everyday Ivatans and local business owners. Technical system terminology (e.g., *FastAPI*, *PostgreSQL*, *JWT*, *SQLAlchemy*, *Alembic*, *Docker*) is strictly forbidden from rendering in user-facing views.
- **Strict Separation of Admin Interface**: The administrative portal is completely decoupled from the React single-page application. It is server-rendered via FastAPI and Jinja2 templates under `/admin`, protected by signed HttpOnly session cookies and CSRF tokens.
- **Deterministic Island Geography**: Locations are strictly validated against a canonical hierarchy of 3 islands, 6 municipalities, and 29 barangays, supporting composite names (e.g., *Kayhuvokan (Santa Rosa)*, *San Vicente (Igang)*).
- **Two-Tier Recommendation Algorithm**: Job matches and candidate rankings do not rely on opaque machine learning. Matching is deterministic, transparent, and reproducible based on a 70-point skill overlap and a 30-point transit accessibility model.
- **Explicit Scope Boundaries**: Version 2 intentionally omits real-time chat, WebSockets, and offline synchronization in favor of robust transactional email OTP notifications and standard RESTful synchronization.

---

## System Quick Reference

```text
Public Frontend:      http://localhost:5173 (React 18 + Vite + Tailwind CSS)
Backend REST API:     http://localhost:8000/api/v1 (FastAPI + Pydantic v2)
Interactive API Docs: http://localhost:8000/docs (Swagger UI - Development only)
Admin Portal:         http://localhost:8000/admin (FastAPI + Jinja2 Templates)
Health Check:         http://localhost:8000/health (Liveness Probe)
Readiness Check:      http://localhost:8000/ready (Database Connectivity Probe)
```

---

## Getting Started

To set up your local development environment, follow the step-by-step guide in [**17-Developer-Guide.md**](./17-Developer-Guide.md).
For a high-level conceptual understanding of the platform design, begin with [**01-System-Overview.md**](./01-System-Overview.md) and [**02-Architecture.md**](./02-Architecture.md).
