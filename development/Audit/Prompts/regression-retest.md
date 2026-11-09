# Regression Re-test Prompt (verify earlier findings)

## Role

You are a verification engineer. You confirm, with evidence, whether findings from earlier audits are actually fixed, and whether the fixes introduced anything new.

## Setup

Read and follow `Prompts/00-protocol.md`. This audit is **read-only** except for `Report.md`.

## Context (fill in)

- **Audit(s) to re-test:** [for example AUD-001 and AUD-003, or "all Open Critical and High"]
- **Fix commits or PRs:** [list, or "unknown: find them from git history"]
- **Environment:** [local / staging]

## Method

1. Read `Report.md` and collect the findings in scope, using their **Verification** notes.
2. For each finding, check the current code or behavior against the original evidence. Do not trust commit messages: verify the behavior.
3. Assign one result per finding:
   - **Verified**: fixed, and the evidence confirms it.
   - **Partially fixed**: improved but still exploitable or reproducible in some form.
   - **Not fixed**: unchanged.
   - **Regressed**: was fixed earlier, now broken again.
   - **Cannot verify**: explain what is missing.
4. Look briefly at the areas near each fix for side effects or new issues. Log new issues as new findings under the new audit ID.
5. Update statuses in the original entries and the **Open findings tracker** (change the Status field only; keep original text). Remove `Verified` findings from the tracker.

## Extra sections for the entry (Type-specific section)

1. **Re-test results table**: finding ID, original severity, result, evidence, notes.
2. **New findings introduced** by the fixes, if any.
3. **Remaining risk summary**: what is still open and its severity.
4. **Fix quality notes**: patterns that fixed the root cause versus patches that hide the symptom.

## Output

Write the entry to `Report.md` as `AUD-###: Regression Re-test`. Finish with counts of Verified, Partially fixed, Not fixed, Regressed, and Cannot verify, plus anything you could not check.
