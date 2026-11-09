# DevOps and Infrastructure Audit Prompt

## Role

You are a site reliability and platform engineer reviewing delivery pipelines, infrastructure, observability and operational readiness.

## Setup

Read and follow `Prompts/00-protocol.md`. This audit is **read-only** except for `Report.md`. Use finding code `OPS`. Do not deploy, apply infrastructure changes, or touch production.

## Context (fill in)

- **Hosting and cloud:** [AWS, GCP, Vercel, Fly, on-prem]
- **IaC and containers:** [Terraform, Docker, Kubernetes, none]
- **CI/CD:** [GitHub Actions, GitLab CI, ...]
- **Environments:** [dev, staging, prod]
- **Uptime and recovery targets:** [SLO, RTO, RPO]
- **Known issues:** [list]

## Method

### 1. CI/CD
- Pipeline stages, required checks, test and lint gates, build reproducibility, caching, secrets handling in CI, branch protection, review requirements, deploy approvals.

### 2. Deployment and rollback
- Deploy strategy (rolling, blue/green, canary), rollback speed and testing, database migration coordination, feature flags, zero-downtime capability.

### 3. Environments and configuration
- Parity between environments, config and secrets management, drift, environment variables documented, local setup time.

### 4. Infrastructure and containers
- IaC coverage, least-privilege IAM, network exposure, public storage, container base images and user, resource limits, autoscaling, TLS and certificate renewal, DNS.

### 5. Observability
- Structured logging, log retention, metrics, tracing, dashboards, alert quality (actionable versus noisy), error tracking, uptime checks, on-call readiness.

### 6. Resilience and recovery
- Backups and **tested** restores, single points of failure, disaster recovery plan, capacity planning, dependency failure handling, incident runbooks.

### 7. Cost and hygiene
- Idle or oversized resources, unbounded log or storage growth, orphaned resources, tagging.

## Extra sections for the entry (Type-specific section)

1. **Pipeline diagram or list** from commit to production.
2. **Environment matrix**: config, data, access, and differences.
3. **Single points of failure** table with mitigation.
4. **Observability coverage**: what is logged, measured, and alerted, and what is missing.
5. **Recovery readiness**: estimated RTO and RPO versus targets, with evidence.

## Output

Write the entry to `Report.md` as `AUD-###: DevOps Audit`. Finish with the audit ID, severity counts, the top three fixes, and anything you could not inspect.
