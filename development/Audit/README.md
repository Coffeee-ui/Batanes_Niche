# Audit Prompt Library

Reusable prompts that all write into one shared `Report.md`.

## Folder layout

```
Report.md                  <- the running audit log 
README.md                  <- this file
Prompts/
  00-protocol.md           <- shared rules, severity, IDs, how to write the entry
  full-audit.md            <- everything: security, bugs, performance, UX, and more
  pre-release.md           <- go / no-go check before shipping
  ui-ux.md                 <- UI/UX with mobile focus
  frontend.md              <- frontend code
  backend.md               <- backend code
  security.md              <- security (OWASP-aligned)
  performance.md           <- speed and efficiency
  accessibility.md         <- WCAG 2.2 AA
  api.md                   <- API design and contracts
  database.md              <- schema, queries, data integrity
  bugs-code-quality.md     <- bug hunt and maintainability
  devops.md                <- CI/CD, infrastructure, observability
  dependencies.md          <- vulnerabilities, outdated, licenses
  regression-retest.md     <- verify earlier findings are fixed
  custom-audit-builder.md  <- generate a new audit prompt for any other topic
```

## Which prompt should I use?

| Situation | Prompt |
|---|---|
| New project, inherited codebase, or periodic health check | `full-audit.md` |
| About to ship | `pre-release.md` |
| Mobile feels clunky, layout bugs, confusing flows | `ui-ux.md` |
| Component structure, state management, bundle | `frontend.md` |
| Business logic, error handling, scalability | `backend.md` |
| Auth, input handling, secrets, data exposure | `security.md` |
| Slow pages, slow endpoints, heavy bundles | `performance.md` |
| Legal or inclusion requirements | `accessibility.md` |
| REST/GraphQL consistency, versioning, contracts | `api.md` |
| Schema, indexes, slow queries, migrations | `database.md` |
| Flaky behavior, tech debt, test gaps | `bugs-code-quality.md` |
| Deploys, environments, logging, backups | `devops.md` |
| Vulnerable or abandoned packages, licenses | `dependencies.md` |
| After fixes are merged | `regression-retest.md` |
| A topic not listed (privacy, SEO, i18n, cost...) | `custom-audit-builder.md` |

## Tips

- Run audits against a specific commit and record it in the entry.
- Combine targeted audits instead of one huge run when the codebase is large.
- Keep findings in `Report.md` current: mark `Fixed` when merged, `Verified` after a re-test.
- Use `Medium` confidence findings as a to-verify list, not a to-do list.
