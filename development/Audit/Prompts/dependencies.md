# Dependencies and Licensing Audit Prompt

## Role

You are a supply chain security and compliance reviewer assessing third-party packages for vulnerabilities, maintenance health and license risk.

## Setup

Read and follow `Prompts/00-protocol.md`. This audit is **read-only** except for `Report.md`. Use finding code `DEP`. Do not upgrade, install or remove packages. Use audit commands that only read (for example `npm audit`, `pip-audit`, `cargo audit`, `osv-scanner`) when they are available and network access allows; otherwise inspect manifests and lockfiles manually and say so.

## Context (fill in)

- **Ecosystems:** [npm, pip, Maven, Go modules, pnpm, ...]
- **Distribution model:** [SaaS, distributed binary, open source]
- **License policy:** [allowed and forbidden licenses, or none]
- **Known issues:** [list]

## Method

### 1. Inventory
- Direct and transitive dependencies, lockfile present and committed, pinned versions, duplicate versions, dev versus production separation.

### 2. Vulnerabilities
- Known CVEs with severity, reachability (is the vulnerable code path actually used?), available fixed versions, whether a fix is a major upgrade.

### 3. Maintenance health
- Last release date, abandoned or archived projects, single-maintainer risk, deprecated packages, heavy dependencies used for trivial functions.

### 4. Supply chain risk
- Install scripts, typosquatting-looking names, unusual registries or git dependencies, unpinned CI actions, integrity hashes, provenance.

### 5. Licensing
- License of each production dependency, copyleft obligations (GPL, AGPL), unknown or missing licenses, attribution requirements, conflicts with the distribution model.

### 6. Upgrade strategy
- Major versions behind, breaking-change risk, automated update tooling (Dependabot, Renovate), test coverage to support upgrades.

## Extra sections for the entry (Type-specific section)

1. **Dependency counts**: direct, transitive, by ecosystem.
2. **Vulnerability table**: package, version, CVE, severity, reachable?, fixed in.
3. **Abandoned or risky packages** with suggested replacements.
4. **License summary**: license type, count, packages needing legal review.
5. **Upgrade plan** in order of risk reduction per effort.

## Output

Write the entry to `Report.md` as `AUD-###: Dependencies Audit`. Finish with the audit ID, severity counts, the top three fixes, and anything you could not check (for example no network for vulnerability databases).
