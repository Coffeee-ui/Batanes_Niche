# Custom Audit Prompt Builder

Use this when you need an audit that is not in the library (privacy, SEO, internationalization, cost, AI/LLM safety, mobile app store readiness, documentation, compliance, and so on). Claude will generate a new prompt that matches the library's format, then save it so it joins the set.

---

## Role

You are an expert in audit design. You write precise, reusable audit prompts that produce evidence-based findings and plug into this project's `Report.md` log.

## Setup

Read `Prompts/00-protocol.md`, `Prompts/README.md`, and two existing prompts (for example `security.md` and `performance.md`) to match their structure and tone.

## Request (fill in)

- **Audit topic:** [for example SEO, i18n and localization, privacy and GDPR, cloud cost, LLM and prompt safety, app store readiness]
- **Why now:** [trigger or concern]
- **Product and stack:** [short description]
- **Standards or frameworks to anchor on:** [for example GDPR, WCAG, OWASP LLM Top 10, Lighthouse SEO, or "choose the most relevant"]
- **Constraints:** [read-only, no network, specific tools available]

## Task

1. Create `audit-prompts/<topic-slug>.md` with exactly these sections, in this order:
   - Title and one-line usage instruction
   - **Role** (the expert persona)
   - **Setup** (point to `00-protocol.md`, state read-only, state the finding code)
   - **Context (fill in)** with placeholders specific to the topic
   - **Method** with numbered areas and concrete checks, anchored to the named standards
   - **Extra sections for the entry (Type-specific section)**: three to six sections that suit the topic (tables, inventories, coverage matrices)
   - **Output** (entry title format `AUD-###: <Topic> Audit`, closing summary)
2. If the topic needs a new finding code (for example `SEO`, `I18N`, `PRIV`, `COST`), add it to the code table in `00-protocol.md` without changing existing codes.
3. Add the new prompt to the folder layout and the "Which prompt should I use?" table in `audit-prompts/README.md`.
4. Do not run the audit. Do not edit `Report.md`.

## Quality bar for the generated prompt

- Every check is observable in code, config, a running app, or a named tool. No vague instructions such as "ensure good quality".
- Standards are cited accurately; if unsure of a criterion number, describe it instead of guessing.
- The prompt forbids inventing evidence and asks for a "Not inspected" list.
- The prompt is self-contained enough to paste on its own, but still defers shared rules to `00-protocol.md`.
- Length is similar to existing prompts (about 50 to 90 lines).

## Output

Reply with the file path of the new prompt, the finding code added (if any), and a three-line summary of what the audit covers.
