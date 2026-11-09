# Audit Protocol (shared rules)

Every prompt in this folder follows this protocol. You do not need to paste this file. Each prompt tells Claude to read it.

## Setup steps (always do these first)

1. Read `Report.md` fully. Note the highest existing `AUD-###` number; the new audit is that number plus one.
2. Read the project's top-level files (README, package/dependency manifests, config) to learn the stack.
3. Confirm the scope from the **Context** block of the prompt. If something critical is missing, state your assumption in the report instead of stopping.
4. **Read-only:** do not modify source code, configs, or data during an audit. The only file you may edit is `Report.md`.
5. Do not run destructive commands, load tests against production, or exploit vulnerabilities. Prove issues by reading code or safe, non-destructive checks.

## Evidence rules

- Every finding needs a location (`path/file.ext:line`, URL, screen name, endpoint, or screenshot) and concrete evidence.
- Do not invent findings. If you could not check something, list it under "Not inspected" with the reason.
- Separate **observed facts** from **assumptions**, and label assumptions.
- Give each finding a **Confidence**: High (reproduced or clearly visible in code), Medium (strong indication), Low (suspected, needs verification).
- Never print real secrets in the report. Mask them (`sk-****abcd`) and report the location.
- Prefer exact fixes (code, config values, commands) over general advice.

## Severity rubric

| Level | Meaning |
|---|---|
| **Critical** | Exploitable now, data loss, or blocks a core task for many users. Fix immediately. |
| **High** | Serious risk or major friction on a key flow. Fix this sprint. |
| **Medium** | Real problem with a workaround or limited blast radius. Plan it. |
| **Low** | Polish, minor inconsistency, hardening. Fix opportunistically. |
| **Info** | Observation or good practice worth noting, no action required. |

**Effort:** S (under half a day) · M (1-3 days) · L (more than 3 days).

## Finding IDs

`AUD-<audit number>-<area code>-<sequence>`, for example `AUD-004-SEC-02`.

| Code | Area |
|---|---|
| UX | UI/UX and mobile |
| FE | Frontend code |
| BE | Backend code |
| SEC | Security |
| PERF | Performance |
| A11Y | Accessibility |
| API | API design |
| DB | Database and data |
| QA | Bugs and code quality |
| OPS | DevOps, infrastructure, CI/CD |
| DEP | Dependencies and licensing |
| DOC | Documentation |
| GEN | Anything else |

## Writing the entry into Report.md

1. Copy the **Entry template** from the bottom of `Report.md`.
2. Insert the filled entry directly **below** the line `<!-- NEW ENTRIES GO DIRECTLY BELOW THIS LINE (newest first) -->`. Never edit or delete older entries, except to change a finding's status when asked.
3. Add one row to the **Index** table (keep rows in order, newest last).
4. Add every new `Critical`, `High` and `Medium` finding to the **Open findings tracker**.
5. If an entry for this audit already exists as `Pending` (for example `AUD-001`), fill that entry in instead of creating a new one.
6. Fill the **Type-specific section** with the extra sections the prompt asks for.

## Closing the audit

End your chat reply with:
- The audit ID and where it was written.
- Counts by severity.
- The top three fixes to do first.
- Anything you could not inspect.
