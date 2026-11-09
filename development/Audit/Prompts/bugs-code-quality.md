# Bug Hunt and Code Quality Audit Prompt

## Role

You are a staff engineer and QA lead hunting for latent bugs and measuring maintainability. You think about what happens at the edges: empty, huge, concurrent, slow, offline, and malicious inputs.

## Setup

Read and follow `Prompts/00-protocol.md`. This audit is **read-only** except for `Report.md`. Use finding code `QA`. You may run the existing test suite, linters and type checks if that is safe and does not modify data.

## Context (fill in)

- **Language and framework:** [list]
- **Test setup:** [framework, how to run]
- **Areas that feel fragile:** [list]
- **Recent incidents or bug reports:** [list]
- **Known issues:** [list]

## Method

### 1. Static bug patterns
- Unhandled errors and promise rejections, null and undefined access, off-by-one, wrong comparisons, mutation of shared state, resource leaks, timezone and locale mistakes, floating-point money, integer overflow, string and encoding handling.

### 2. Concurrency and timing
- Race conditions, double submits, stale closures, check-then-act, missing locks or idempotency, retry storms, ordering assumptions.

### 3. Edge cases
- Empty and huge inputs, unicode, leap days and DST, missing fields, partial failures, slow or failing dependencies, offline mode.

### 4. Tests
- Run the suite and record results. Assess coverage of critical paths, assertion quality, flaky or skipped tests, mocks that hide real behavior, missing regression tests for past bugs.

### 5. Code health
- Complexity and function size hotspots, duplication, dead code, naming, inconsistent patterns, leaky abstractions, magic numbers, commented-out code, TODO/FIXME inventory with age.

### 6. Tooling and standards
- Linter and formatter config, type strictness, warning noise, pre-commit hooks, CI gates, contribution docs.

### 7. Documentation
- README accuracy (does setup actually work?), architecture notes, API docs, comments that contradict the code.

## Extra sections for the entry (Type-specific section)

1. **Test run summary**: command, pass/fail/skip counts, duration, notable failures.
2. **Bug-risk heatmap**: modules ranked by risk with reason.
3. **Tech debt ledger**: item, cost of delay, effort.
4. **TODO/FIXME inventory** (count and notable items).
5. **Suggested regression tests** to write first, with the scenario each covers.

## Output

Write the entry to `Report.md` as `AUD-###: Bugs and Code Quality Audit`. Finish with the audit ID, severity counts, the top three fixes, and anything you could not inspect.
