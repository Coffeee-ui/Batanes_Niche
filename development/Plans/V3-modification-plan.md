Batanes Niche Job Portal — Prototype Modification Prompt V3

## 1. Modification Objective

Modify the **existing Batanes Niche Job Portal prototype** to resolve the identified bugs, standardize skill and business-type data, connect standardized skills to the existing recommendation engine, and enforce strict separation between user roles.

This is a **modification, integration, and bug-fixing task**.

It is **NOT** a redesign, rewrite, replatforming, or architectural replacement.

The finished application must continue to look and behave like the same existing Batanes Niche Job Portal prototype, with only the necessary functional, data, security, and layout corrections.

---

# 2. Critical Change-Control Rules

Before changing anything, inspect the existing implementation and understand how it currently works.

Preserve the existing:

- UI design and visual identity
- page layouts
- navigation structure where still valid
- component structure
- backend architecture
- database architecture and relationships where practical
- authentication mechanisms
- recommendation engine
- established routes
- APIs
- responsive behavior
- existing business logic
- existing validation
- existing security controls

Do not replace working implementations merely because another implementation would be cleaner or more modern.

Do not introduce unrelated features.

Do not introduce a new design system.

Do not upgrade dependencies unless an existing dependency directly prevents one of the required fixes.

### Meaning of "minimal modification"

Minimal modification does **not** mean avoiding necessary cross-cutting changes.

If establishing one canonical skill system requires changes across the profile, employer, job-posting, API, database, and recommendation layers, make those necessary integrations.

"Minimal" means:

> Make every change necessary to satisfy this specification, but make no unrelated changes.

---

# 3. Inspect Before Modifying

Inspect the actual prototype before implementing changes.

At minimum, inspect:

1. Landing-page dropdown implementation.
2. Cause of the dropdown visibility problem.
3. Current skill storage.
4. Current skill selection/input mechanism.
5. Existing predefined skill data, if any.
6. Existing Business/Enterprise Type storage.
7. Existing Business/Enterprise Type selector/input.
8. Existing job-required-skill representation.
9. Existing recommendation scoring implementation.
10. Existing skill matching logic.
11. Existing authentication/session representation.
12. Existing user-role representation.
13. Existing frontend route guards.
14. Existing backend/API authorization.
15. Existing resource ownership checks.
16. Existing footer shortcut links.
17. Existing footer layout.
18. Existing database structures affected by the changes.
19. Existing normalization/matching logic.
20. Existing data that may require migration or compatibility handling.

The current implementation is the source of truth for architecture.

Do not assume that the existing code uses the exact names or structures described in this prompt.

Adapt the implementation to the existing architecture instead of creating duplicate systems.

---

# 4. Fix the Existing Landing-Page Dropdown

The landing page contains an existing dropdown that becomes invisible or visually inaccessible when opened.

Inspect the actual cause.

Check for:

- `z-index`
- stacking contexts
- `overflow: hidden`
- parent clipping
- positioning
- portal/popover behavior
- background/foreground conflicts
- opacity
- visibility/display state
- Tailwind utility conflicts
- container boundaries
- responsive CSS
- viewport positioning

Fix the underlying problem while preserving the existing dropdown's design and behavior.

Do not solve the issue solely by assigning an arbitrarily large `z-index`.

Do not replace the dropdown unless the existing implementation is genuinely unusable.

### Required result

The existing dropdown must:

- open normally;
- remain visible;
- remain selectable;
- not be clipped;
- not be hidden behind other content;
- not disturb surrounding layout;
- work on desktop;
- work on mobile;
- preserve its existing appearance.

Test it within the actual surrounding layout and stacking/overflow contexts, not only in isolation.

If the existing component supports keyboard interaction or touch selection, ensure the fix does not break those behaviors.

---

# 5. Establish One Authoritative Canonical Skill Catalog

Create or reuse **one authoritative canonical skill catalog**.

This catalog is the single source of truth for standardized skills throughout the system.

It must be used consistently for:

- Job-seeker skills
- Employer job-required skills
- Recommendation matching
- Business/Enterprise Type → Suggested Skills relationships
- Any other standardized skill functionality introduced by this modification

Do not create separate independent skill lists for:

- job seekers;
- employers;
- jobs;
- recommendations.

Conceptually:

```text
                 Canonical Skill Catalog
                         │
               ┌─────────┴─────────┐
               ↓                   ↓
       Job-Seeker Skills     Job Required Skills
               │                   │
               └─────────┬─────────┘
                         ↓
              Existing Recommendation
                     Engine

```

## Authoritative source

If the existing architecture supports a backend/database representation, the authoritative catalog should exist there rather than making a frontend array the sole source of truth.

Frontend selectors may consume data from the authoritative source.

Do not create duplicated hard-coded copies of the catalog across unrelated files.

Prefer stable canonical identifiers where the existing architecture allows this without unnecessary restructuring.

A canonical skill should conceptually have:

```text
id
name
normalized_value

```

Example:

```text
id: 17
name: "Carpentry"
normalized_value: "carpentry"

```

Adapt this structure to the existing schema rather than blindly creating a new database architecture.

---

# 6. Special Rule for "Other"

The canonical skill selector must provide an **Other** option.

However:

> `Other` is a UI mechanism for entering a custom semantic skill. It is NOT itself a meaningful skill.

If the existing architecture requires `Other` to have an internal identifier, that identifier must only trigger custom-value handling.

It must never participate in recommendation matching as a normal skill.

For example:

```text
selection: Other
custom_value: Boat Repair

```

means the semantic skill is:

```text
Boat Repair

```

not:

```text
Other

```

Never persist only:

```text
skill = "Other"

```

when the user actually supplied a custom value.

---

# 7. Job-Seeker Skills

Replace unrestricted normal free-text skill entry with the existing application's form pattern adapted to a standardized skill selector.

Job seekers must be able to:

- select predefined canonical skills;
- select multiple skills;
- see selected skills;
- remove selected skills;
- edit selections;
- use `Other`;
- enter a custom skill when `Other` is selected;
- preserve the custom value when editing;
- save the selections correctly.

The new selector must visually belong to the existing prototype.

Do not introduce a completely new design system.

---

# 8. Custom Skill Handling

When `Other` is selected, provide controlled custom-value input.

Example:

```text
selection: Other
custom_value: Boat Repair

```

The system must:

- preserve the actual custom value;
- persist it;
- load it during editing;
- display it correctly;
- allow it to be edited;
- avoid replacing it with the literal `Other`;
- prevent accidental duplication where practical.

### Canonical duplicate prevention

If a custom value exactly corresponds to an existing canonical skill after deterministic normalization:

```text
Canonical:
Carpentry

Custom:
Other → "  carpentry "

```

do not store it as an unnecessary duplicate custom skill.

Resolve it to the canonical skill where practical.

---

# 9. Deterministic Skill Normalization

Custom values may use deterministic normalization.

Allowed normalization includes:

- trimming leading/trailing whitespace;
- consistent capitalization/case normalization;
- collapsing repeated whitespace;
- basic consistent punctuation normalization.

Example:

```text
"carpentry"
"Carpentry"
"  Carpentry  "

```

may resolve to the same comparison value.

However:

```text
"Carpentry"
"Construction"

```

must not be considered equivalent unless an explicit existing association or alias already exists.

Do not introduce:

- AI matching;
- semantic similarity;
- embeddings;
- fuzzy matching;
- machine-learning inference;
- automatic synonym generation.

Do not silently infer that unrelated skills are equivalent.

---

# 10. Custom Skill Matching Rule

Custom skills must use **deterministic normalized exact comparison**.

If both values normalize to the same comparison value:

```text
Job Seeker:
Other → boat repair

Job:
Other → Boat Repair

```

then:

```text
normalized value:
boat repair
=
boat repair

→ Match

```

If normalized values differ:

```text
Boat Repair
≠
Plumbing

```

then:

```text
→ No match

```

The literal `Other` option must never generate a match.

Therefore:

```text
Job Seeker:
Other

Job:
Other

```

must produce:

```text
No skill match

```

because there is no actual semantic skill value.

Do not make custom matching fuzzy or semantic.

---

# 11. Standardize Business / Enterprise Type

Inspect the existing Business/Enterprise Type implementation and taxonomy before changing it.

If an existing valid taxonomy already exists, preserve and reuse it.

Do not blindly replace an existing taxonomy with illustrative categories from this prompt.

Employers must be able to:

- select a predefined business/enterprise type;
- clearly see the selected value;
- change the selection;
- choose `Other`;
- provide a custom value when `Other` is selected.

The selector should follow the existing application's visual language.

---

# 12. Business / Enterprise Type "Other"

`Other` is a UI selection mechanism and must not replace the user's actual semantic value.

Example:

```text
selection: Other
custom_value: Island-Based Marine Services

```

The custom value must:

- persist;
- remain visible during editing;
- remain retrievable;
- not be silently deleted;
- not be replaced with the literal `Other`.

Apply deterministic normalization to custom business-type values where appropriate.

Do not introduce semantic or AI-based classification.

---

# 13. Business Type → Suggested Skills

Connect the standardized Business/Enterprise Type system to the canonical Skill Catalog.

Conceptually:

```text
Business / Enterprise Type
            ↓
Relevant / Suggested Skills
            ↓
Employer selects actual skills
            ↓
Job Requirements
            ↓
Candidate Skills
            ↓
Existing Recommendation Engine

```

The Business Type → Skill relationship must have one deterministic authoritative representation.

Do not duplicate business-type/skill mapping rules across multiple UI components.

If an existing association system already exists, reuse it.

### Critical distinction

Business type provides **contextual suggestions**, not mandatory requirements.

Selecting a business type may:

- suggest relevant skills;
- organize relevant skills;
- expose commonly associated skills;
- assist consistency.

It must NOT:

- automatically force skills;
- automatically remove existing skills;
- make suggested skills mandatory;
- automatically award recommendation points for merely being suggested;
- prevent users from selecting valid skills outside the suggested group.

Suggested skills become meaningful to the user's profile/job only when they are actually selected according to the existing workflow.

Do not introduce AI or machine learning for this relationship.

---

# 14. Job-Required Skills

Job posting Required Skills must use the **same canonical skill system** as Job-Seeker Skills.

Employers must be able to:

- select multiple predefined required skills;
- view selected skills;
- remove selected skills;
- edit selected skills;
- use `Other` if custom required skills are permitted by the existing business rules;
- preserve custom values correctly if `Other` is supported.

Do not create a second incompatible skill vocabulary.

Conceptually:

```text
             Canonical Skill Catalog
                    /        \
                   /          \
                  ↓            ↓
        Job-Seeker Skills   Job Required Skills

```

### Important

Do not interpret “same canonical system” as permission to create two separate lists that happen to contain the same names.

Both systems must reference the same authoritative catalog.

---

# 15. Preserve the Existing Recommendation Engine

The existing recommendation engine must remain intact.

The current architecture uses:

```text
Skill Match          = maximum 70 points
Geographic Proximity = maximum 30 points
Total                 = maximum 100 points

```

Do not replace this engine.

Do not redesign its ranking architecture.

Do not introduce:

- AI recommendation;
- machine learning;
- embeddings;
- semantic similarity;
- fuzzy skill matching.

The standardization work should change the **input representation and comparison consistency**, not the fundamental recommendation architecture.

---

# 16. Preserve the Existing Skill-Scoring Formula

Canonicalization must not change the existing mathematical scoring behavior.

If the existing implementation calculates the Skill Match score using a particular formula, preserve that formula.

For example, if it currently performs:

```text
matched required skills
        ÷
total required skills
        ×
70

```

then retain that calculation unless a minimal technical adjustment is required to consume canonical skill identifiers.

The goal is:

```text
Existing Skill Scoring Formula
            +
Canonicalized Skill Inputs
            =
Existing Recommendation Architecture

```

Do not “improve” the scoring formula during this modification.

---

# 17. Canonical Skill Matching

For predefined skills:

```text
Job Seeker:
Carpentry

Job:
carpentry

```

must resolve to the same canonical skill.

Prefer comparison by canonical identifier rather than display text wherever practical.

For example:

```text
Job Seeker → canonical_skill_id = 17
Job         → canonical_skill_id = 17

→ Match

```

Display capitalization must not affect canonical matching.

---

# 18. "Other" and Recommendation Scoring

The recommendation engine must distinguish between:

1. canonical predefined skills;
2. custom semantic skills;
3. the literal `Other` selector state.

### Canonical

```text
Carpentry

```

→ compare through canonical identity.

### Custom

```text
Other → Boat Repair

```

→ compare normalized custom values.

### Empty `Other`

```text
Other

```

without a semantic custom value

→ must not generate skill-match points.

Never award skill points simply because:

```text
Other = Other

```

---

# 19. Strict User Role Separation

The prototype currently has an authorization issue where one role can access another role's functionality.

Fix this at multiple layers.

The intended boundary is:

```text
job_seeker
    → job-seeker protected functionality

employer
    → employer protected functionality

```

A job seeker must not access employer-only functionality.

An employer must not access job-seeker-only functionality.

This restriction must work even when users attempt to bypass the normal UI.

---

# 20. Frontend Route Protection

Use the existing frontend authentication/navigation conventions.

Unauthorized access to a protected route must:

- be blocked;
- not render protected content before authorization succeeds;
- redirect appropriately;
- preserve existing authentication behavior.

Do not merely hide unauthorized navigation links.

A user must not gain access through:

- manually entering URLs;
- browser navigation;
- client-side navigation;
- modified local state;
- manipulated role values.

Frontend guards improve user experience but are not the actual security boundary.

---

# 21. Backend/API Authorization

Backend/API authorization must independently verify authorization.

Do not rely on:

- hidden links;
- frontend route guards;
- localStorage role values;
- client-side state;
- request-body role values;
- query-string role values;
- frontend-supplied authorization claims.

The trusted authenticated role must come from the existing validated authentication/session/token mechanism.

Conceptually:

```text
Authenticated Job Seeker
        ↓
Employer-only API
        ↓
Authorization Check
        ↓
Rejected

```

and:

```text
Authenticated Employer
        ↓
Job-Seeker-only API
        ↓
Authorization Check
        ↓
Rejected

```

Where the existing API convention permits it:

```text
Unauthenticated → 401
Authenticated but unauthorized → 403

```

Follow the application's existing error-handling conventions if they differ.

---

# 22. Never Trust Client-Supplied Role State

The backend must not authorize a user based on a role supplied by the client.

Do not use values such as:

```text
localStorage.role

```

or:

```text
request.body.role

```

as the authoritative authorization source.

The backend must derive the effective role from the trusted authenticated identity/session/token.

Client-provided role values may be treated as untrusted informational data only.

Do not implement client-side role switching.

---

# 23. Resource Ownership Authorization

Role checking alone is not sufficient when an operation concerns a specific user's or employer's resource.

Preserve and enforce existing ownership rules.

For example:

```text
Employer A
→ attempts to edit Employer B's job
→ reject unless existing authorization explicitly permits it

```

Likewise:

```text
Job Seeker A
→ attempts to access Job Seeker B's protected profile/resource
→ reject unless explicitly permitted

```

For protected operations, verify the appropriate combination of:

```text
Authenticated identity
+
Correct role
+
Resource ownership/allowed relationship

```

Do not weaken existing ownership controls while adding role authorization.

---

# 24. Preserve Existing Authentication and Security

Do not redesign the existing authentication architecture.

Preserve existing mechanisms such as:

- bcrypt password hashing;
- JWT access tokens;
- refresh tokens;
- token rotation;
- token revocation;
- account suspension;
- password recovery;
- existing sessions;
- existing CSRF protection;
- existing security middleware.

Only extend authorization where required by this specification.

Do not weaken existing controls.

---

# 25. Remove Inappropriate Footer Shortcuts

Remove footer shortcuts that provide access to role-specific protected functionality involved in the current issue.

In particular, prevent paths such as:

```text
Employer
   ↓
Footer shortcut
   ↓
Job-Seeker Dashboard

```

and the reverse.

Remove inappropriate role-specific authenticated dashboard shortcuts from the footer.

Do not remove legitimate public informational/navigation links.

Do not add replacement shortcuts merely to fill the removed space.

---

# 26. Minimal Footer Layout Adjustment

After removing the inappropriate footer content, make only the layout adjustments necessary to keep the existing footer visually complete.

Permitted changes include:

- removing empty spaces;
- re-aligning remaining columns;
- adjusting affected column widths;
- correcting gaps;
- adjusting margins/padding;
- maintaining alignment;
- correcting responsive wrapping;
- preserving desktop balance;
- preserving mobile readability.

Preserve:

- existing footer visual identity;
- typography;
- colors;
- icons;
- remaining legitimate links;
- general structure;
- visual style.

This is **not a footer redesign**.

Do not introduce a new footer design.

Do not add unrelated content.

---

# 27. Backward Compatibility

Inspect existing data before modifying schemas or APIs.

Existing records may contain:

- free-text skills;
- old skill formats;
- legacy business-type values;
- legacy job-required skills.

Do not delete existing valid data simply because standardized selectors are being introduced.

---

# 28. Legacy Skill Migration

Use the smallest safe migration/normalization strategy.

A legacy value may be migrated to a canonical skill only when the match is deterministic and unambiguous.

Example:

```text
Legacy:
"Carpentry"

Canonical:
"Carpentry"

→ Canonical Skill ID

```

If an existing value is unknown or ambiguous:

```text
Legacy:
"Boat Engine Specialist"

No unambiguous canonical equivalent

```

preserve it as a custom value rather than deleting it.

Do not use:

- fuzzy matching;
- substring inference;
- semantic similarity;
- AI;
- embeddings;
- guessed synonyms.

For example:

```text
"JS"

```

must not automatically become:

```text
"JavaScript"

```

unless the existing application already has an explicit alias/mapping for that value.

---

# 29. Idempotent Migration

Any migration or normalization process must be idempotent.

Running it multiple times must not create:

- duplicate canonical skills;
- duplicate custom skills;
- duplicate associations;
- duplicate mappings;
- repeated values.

Do not perform destructive migration when compatibility handling can preserve existing records safely.

---

# 30. Preserve Existing Records During Editing

Existing profiles, employers, and jobs must load correctly into the new UI.

For existing records containing:

```text
Canonical Skills
+
Custom Skills

```

the edit form must:

- load the values;
- display them correctly;
- preserve unchanged selections;
- allow normal editing;
- prevent accidental duplicates;
- preserve custom values;
- save correctly.

Saving a record without modifying its selections must not unexpectedly alter or delete data.

Existing business-type values must also remain usable.

---

# 31. UI/UX Preservation

The new functionality must visually belong to the existing Batanes Niche prototype.

Do not:

- redesign the landing page;
- redesign navigation;
- replace working components unnecessarily;
- introduce a new design system;
- change unrelated styling;
- add excessive animations;
- add unrelated pages;
- replace working UI patterns for aesthetic preference.

Minor UI changes are permitted only when directly necessary for:

- fixing the dropdown;
- fitting standardized selectors into existing forms;
- supporting custom `Other` input;
- adjusting footer layout;
- maintaining responsive behavior.

Primary objectives:

> Functional correctness
> Data consistency
> Security
> Compatibility
> Preservation of existing design

---

# 32. No Unrelated Changes

Do not modify unrelated:

- components;
- styles;
- routes;
- APIs;
- database tables;
- authentication logic;
- recommendation logic;
- dependencies;
- configuration;
- business rules.

Do not rewrite working implementations unnecessarily.

Keep the implementation diff focused.

---

# 33. Validation Requirements

After implementation, actually test the following.

Do not claim a test passed unless it was actually performed.

## A. Landing Page

Verify:

- dropdown opens;
- options are visible;
- options are selectable;
- dropdown is not clipped;
- dropdown is not hidden behind surrounding content;
- desktop works;
- mobile works;
- surrounding layout remains intact.

---

## B. Job-Seeker Skills

Verify:

- predefined skills can be selected;
- multiple skills can be selected;
- selected skills are visible;
- selected skills can be removed;
- selections can be edited;
- existing selections load;
- `Other` works;
- custom values persist;
- custom values load during editing;
- duplicate representations are prevented where practical.

---

## C. Business / Enterprise Type

Verify:

- existing taxonomy was inspected;
- predefined types can be selected;
- selected type displays correctly;
- selection can be changed;
- `Other` works;
- custom values persist;
- custom values load during editing;
- existing business-type values remain usable.

---

## D. Business Type → Skills

Verify:

- relevant skills are suggested/organized deterministically;
- suggestions come from the canonical skill catalog;
- suggestions are not automatically mandatory;
- selecting a business type does not remove user-selected skills;
- users can select valid skills outside suggested skills;
- suggested but unselected skills do not become actual skills automatically.

---

## E. Job Posting

Verify:

- Required Skills uses the canonical selector;
- multiple required skills work;
- skills can be removed;
- skills can be edited;
- canonical values are stored correctly;
- `Other` works if custom job-required skills are supported;
- custom values persist correctly;
- existing job-posting workflows continue working.

---

# 34. Recommendation Engine Tests

## Test 1 — Canonical Match

```text
Job Seeker:
Carpentry

Job:
Carpentry

Expected:
Canonical skill match recognized.

```

## Test 2 — Capitalization Difference

```text
Job Seeker:
carpentry

Job:
Carpentry

Expected:
Same canonical skill.
Match recognized.

```

## Test 3 — Different Custom Values

```text
Job Seeker:
Other → Boat Repair

Job:
Other → Plumbing

Expected:
No match.

```

## Test 4 — Same Normalized Custom Value

```text
Job Seeker:
Other → boat repair

Job:
Other → Boat Repair

Expected:
Normalized values are equal.
Match recognized.

```

## Test 5 — Literal Other

```text
Job Seeker:
Other

Job:
Other

Expected:
No skill-match points solely because both selected Other.

```

## Test 6 — Canonical vs Equivalent Custom Duplicate

```text
Job Seeker:
Canonical → Carpentry

Job:
Other → " carpentry "

```

Expected:

```text
No duplicate semantic representation should be created where the system can safely resolve the custom value to the canonical skill.

```

### Scoring Validation

Verify:

```text
Skill Match          ≤ 70
Geographic Proximity ≤ 30
Total                ≤ 100

```

The existing scoring formula and ranking structure must remain intact.

Do not replace ranking with AI/ML.

---

# 35. Role-Separation Tests

## Job Seeker

Verify:

```text
Job seeker
→ job-seeker functionality
→ allowed

```

and:

```text
Job seeker
→ employer-only page
→ blocked

```

and:

```text
Job seeker
→ employer-only API
→ rejected

```

---

## Employer

Verify:

```text
Employer
→ employer functionality
→ allowed

```

and:

```text
Employer
→ job-seeker dashboard
→ blocked

```

and:

```text
Employer
→ job-seeker-only API
→ rejected

```

---

## Direct URL Navigation

Manually enter unauthorized protected URLs.

Expected:

```text
Unauthorized
→ access blocked or appropriately redirected

```

Protected content must not render before authorization succeeds.

---

## Client-Side Manipulation

Attempt to manipulate:

- localStorage role;
- client-side role state;
- route state;
- request role values.

Expected:

```text
Client-side role manipulation
→ does not grant unauthorized access

```

---

## Resource Ownership

Verify users cannot access or modify another user's/employer's protected resources unless an existing authorized relationship explicitly permits it.

---

# 36. Footer Validation

Verify:

- inappropriate role-specific shortcuts are removed;
- legitimate public links remain;
- remaining content is aligned;
- no broken empty sections remain;
- desktop layout remains balanced;
- mobile layout remains readable;
- no replacement shortcuts were added;
- footer security does not rely solely on link removal.

---

# 37. Existing Data Validation

Verify:

- existing profiles load;
- existing jobs load;
- existing business types load;
- legacy skills are not silently deleted;
- unknown legacy skills remain recoverable as custom values;
- canonicalizable legacy skills are normalized safely;
- existing editing workflows continue working;
- saving unchanged records does not unexpectedly modify their semantic data.

---

# 38. Implementation Report

After completing the work, provide a concise implementation report.

## Inspection Findings

Report the actual causes discovered for:

- landing-page dropdown visibility;
- current skill representation;
- current business-type representation;
- current job-required-skill representation;
- recommendation skill handling;
- role authorization issue;
- footer shortcut/layout issue.

Do not report assumptions as findings.

---

## Changes Made

List only the files, components, routes, APIs, database/schema changes, migrations, and mappings actually modified.

For each change, briefly state why it was necessary.

---

## Data Handling

Explain:

- canonical skill representation;
- custom `Other` representation;
- business-type representation;
- legacy data migration;
- normalization;
- duplicate prevention;
- compatibility handling.

---

## Authorization

Explain:

- frontend route protection;
- backend/API role checks;
- trusted role source;
- resource ownership checks;
- unauthorized access behavior.

---

## Recommendation Integration

Explain:

- how canonical skills feed into the existing recommendation engine;
- how custom skills are normalized;
- how `Other` is prevented from producing false matches;
- how the existing 70-point Skill Match component was preserved;
- how the existing 30-point Geographic Proximity component was preserved;
- how the existing ranking/scoring formula was preserved.

---

## Footer Adjustment

Explain:

- which inappropriate shortcuts were removed;
- which legitimate links remain;
- what minimal layout adjustments were necessary;
- how desktop/mobile balance was preserved.

---

## Validation

Report only tests that were actually performed.

Separate results into:

```text
PASS
FAIL
NOT TESTED

```

Do not claim successful validation without actually executing the corresponding test.

For any failure, report:

- what failed;
- where it failed;
- likely cause;
- whether it was fixed;
- whether retesting was performed.

---

# 39. Final Acceptance Criteria

The modification is considered complete only when the existing prototype provides:

1. Fixed landing-page dropdown visibility.
2. One authoritative canonical skill catalog.
3. Standardized Job-Seeker skill selection.
4. Controlled `Other` custom skill handling.
5. Deterministic custom skill normalization.
6. Deterministic exact custom-skill matching.
7. No false matches from literal `Other`.
8. Standardized Business/Enterprise Type selection.
9. Controlled custom business-type handling.
10. One deterministic Business Type → Suggested Skills relationship.
11. Suggested skills are not automatically mandatory.
12. Standardized Required Skills for job postings.
13. Job requirements and job-seeker skills use the same canonical vocabulary.
14. Canonical skills feed the existing recommendation engine.
15. Existing Skill Match remains capped at 70 points.
16. Existing Geographic Proximity remains capped at 30 points.
17. Existing recommendation scoring/ranking architecture remains intact.
18. No AI/ML replacement of deterministic recommendation logic.
19. Strict frontend role separation.
20. Strict backend/API role authorization.
21. Backend authorization does not trust client-supplied roles.
22. Resource ownership checks remain enforced.
23. Unauthorized direct URL access is blocked.
24. Inappropriate footer shortcuts are removed.
25. Footer receives only minimal layout corrections.
26. Existing authentication/security mechanisms remain intact.
27. Existing data is preserved.
28. Legacy data is safely normalized or retained as custom values.
29. Migration is non-destructive and idempotent.
30. Existing editing workflows continue working.
31. No unrelated redesign, rewrite, restructuring, or dependency changes are introduced.

---

# 40. Final Implementation Principle

**Inspect first. Modify minimally. Integrate where necessary. Preserve working functionality. Use one authoritative source of truth. Normalize deterministically. Enforce authorization at the backend. Preserve existing scoring. Protect resource ownership. Adjust UI only where required. Validate actual behavior. Do not introduce unrelated changes.**

The final result must look and behave like the **same existing Batanes Niche Job Portal prototype**, with the requested bugs, data inconsistencies, recommendation integration issues, role-access vulnerabilities, and footer shortcuts corrected.