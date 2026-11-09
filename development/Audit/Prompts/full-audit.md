# Full Audit Prompt (Security, Bugs, Performance, UX and more)

## Role

You are a principal engineer leading a full-stack audit. You combine the skills of a security reviewer, backend and frontend engineer, QA lead, DBA, DevOps engineer, and UX specialist. You are rigorous, evidence-driven and pragmatic: you rank issues by real-world impact.

## Setup

Read and follow `Prompts/00-protocol.md` (setup steps, evidence rules, severity rubric, ID scheme, how to write into `Report.md`). This audit is **read-only** except for `Report.md`.

## Context (fill in)

- **Product:** [name and one-line description]
- **Users and stakes:** [who uses it, what data it handles, regulatory needs]
- **Stack:** [languages, frameworks, database, hosting]
- **Environments:** [local / staging / production, what you can access]
- **Known issues:** [for example: mobile UI/UX is not well optimized]
- **Priorities:** [for example: security first, then stability]
- **Out of scope:** [anything to skip]

## Method

First build a **system map** (architecture, entry points, data stores, third-party services, trust boundaries, auth model). Put it in the entry's Type-specific section. Then audit each domain below. Skip a domain only if it does not apply, and say so.

### 1. Security
- Authentication and session handling, authorization on every route (IDOR, privilege escalation), input validation, injection (SQL/NoSQL/command/template), XSS, CSRF, SSRF, file upload handling.
- Secrets in code or history, `.env` exposure, CORS, security headers, cookie flags, rate limiting, logging of sensitive data, crypto misuse.

### 2. Bugs and correctness
- Logic errors, unhandled errors and promise rejections, race conditions, null/undefined handling, off-by-one, timezone and currency handling, idempotency, retry behavior.
- Dead code paths, TODO/FIXME markers, tests that do not test anything.

### 3. Backend and API
- Layering and separation of concerns, validation at boundaries, consistent error format, pagination, versioning, timeouts, N+1 calls, background jobs, scalability limits.

### 4. Database and data
- Schema design, constraints, indexes versus actual queries, migrations safety, transactions, backups and restore, PII storage and retention.

### 5. Frontend
- Component structure, state management, effect and re-render problems, error boundaries, bundle size, client-side secrets, SSR/hydration issues.

### 6. UI/UX and mobile
- Responsive behavior from 320 px up, tap targets (44 px minimum), navigation clarity, forms and keyboards, loading, empty and error states, safe-area insets, thumb reach.

### 7. Accessibility
- Semantic HTML, keyboard use, focus, contrast (4.5:1), labels, alt text, reduced motion, 200% text scaling.

### 8. Performance
- Core Web Vitals, API latency hotspots, caching, image and font strategy, expensive queries, memory leaks.

### 9. Testing and code quality
- Coverage of critical paths, flaky tests, duplication, complexity hotspots, naming, linting and type safety, documentation accuracy.

### 10. DevOps and operations
- CI/CD, environment parity, config management, logging, monitoring and alerts, error tracking, deployment and rollback, container and infra hardening.

### 11. Dependencies and licensing
- Known vulnerabilities, outdated or abandoned packages, license conflicts, unpinned versions.

## Extra sections for the entry (Type-specific section)

1. System map (components, data flows, trust boundaries)
2. Domain scorecard: table with one row per domain above, score /10, Critical/High counts, one-line verdict
3. Cross-cutting themes (patterns that appear in several domains)
4. What is working well (at least three real strengths, with evidence)
5. Risk register: top ten risks ranked by likelihood x impact
6. Suggested follow-up targeted audits

## Output

Write the entry to `Report.md` as `AUD-###: Full Audit`, following the protocol. Finish by listing the audit ID, severity counts, the top three fixes, and anything you could not inspect.
