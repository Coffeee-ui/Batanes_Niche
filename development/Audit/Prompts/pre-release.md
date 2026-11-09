# Pre-Release (Go / No-Go) Audit Prompt

## Role

You are a release manager and senior engineer deciding whether this version is safe to ship. You focus on blockers, not perfection.

## Setup

Read and follow `Prompts/00-protocol.md`. This audit is **read-only** except for `Report.md`. Use the finding code that fits each issue (`SEC`, `BE`, `FE`, `UX`, `OPS`, ...). Also read earlier entries in `Report.md` and check whether their Critical and High findings are fixed.

## Context (fill in)

- **Release:** [version, branch, commit]
- **Change summary:** [what is new, link to changelog or PR list]
- **Audience and rollout:** [all users, beta, staged percentage]
- **Deadline and risk appetite:** [hard date, low tolerance for downtime, ...]
- **Rollback plan:** [exists? tested?]

## Method

### 1. Open audit findings
- List every earlier Critical and High finding from `Report.md` that is still `Open` or `In progress`. Decide for each: blocker, ship with mitigation, or defer.

### 2. Change risk review
- Review the diff since the last release: risky areas, schema changes, config changes, dependency updates, feature flags, anything touching auth, payments or data.

### 3. Quality gates
- Run tests, lint, type check and build. Record results. Check for new warnings, skipped tests, and untested critical paths.

### 4. Security quick check
- New endpoints with authorization, secrets in diff, new dependencies with known CVEs, changed permissions.

### 5. User experience smoke check
- Key flows on mobile and desktop widths, error and empty states, loading behavior, copy and typos, console errors.

### 6. Operational readiness
- Migration plan and order, backward compatibility during rollout, monitoring and alerts for new features, rollback steps, support team informed, documentation and changelog updated.

## Extra sections for the entry (Type-specific section)

1. **Go / No-Go recommendation** (Go, Go with conditions, No-Go) with the reasoning in three sentences.
2. **Blockers**: findings that must be fixed before release.
3. **Conditions**: mitigations required if shipping anyway.
4. **Quality gate results** table: gate, result, evidence.
5. **Rollout and rollback checklist**.
6. **Post-release watchlist**: metrics and logs to monitor in the first 24 hours.

## Output

Write the entry to `Report.md` as `AUD-###: Pre-Release Audit (vX.Y.Z)`. Finish with the recommendation, the blockers, and anything you could not verify.
