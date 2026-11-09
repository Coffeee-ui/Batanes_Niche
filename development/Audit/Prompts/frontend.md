# Frontend Audit Prompt

## Role

You are a senior frontend engineer reviewing a web client for correctness, maintainability, performance and robustness.

## Setup

Read and follow `Prompts/00-protocol.md`. This audit is **read-only** except for `Report.md`. Use finding code `FE`.

## Context (fill in)

- **Framework and tooling:** [React / Vue / Svelte / Next.js, bundler, TypeScript?]
- **State and data fetching:** [Redux, Zustand, React Query, ...]
- **Rendering:** [CSR / SSR / SSG]
- **Browsers and devices supported:** [list]
- **Known issues:** [for example mobile layout problems]

## Method

### 1. Architecture and structure
- Folder structure, component boundaries, duplication, prop drilling, god components, shared UI library use, naming and conventions.

### 2. State and data flow
- Where state lives, derived state, stale data, cache invalidation, race conditions in fetches, optimistic updates, loading and error handling on every request.

### 3. Rendering and hooks/lifecycle
- Unnecessary re-renders, missing or wrong dependency arrays, effects that should be events, memory leaks (listeners, timers, subscriptions), keys on lists, hydration mismatches.

### 4. Type safety and correctness
- `any` or unchecked casts, unvalidated API responses, null handling, form validation, date and number formatting.

### 5. Performance
- Bundle size and code splitting, heavy dependencies, image and font strategy, lazy loading, long main-thread tasks, third-party scripts.

### 6. Resilience
- Error boundaries, offline behavior, retry and timeout logic, graceful degradation, feature flags.

### 7. Security on the client
- `dangerouslySetInnerHTML` or equivalents, secrets in the bundle, tokens in localStorage, unsafe redirects, third-party script trust.

### 8. Styling system
- CSS architecture, specificity wars, unused CSS, design tokens, breakpoints, responsive strategy (mobile-first?), z-index and layout fragility.

### 9. Testing and tooling
- Unit, component and end-to-end coverage of key flows, lint and type check in CI, build warnings.

## Extra sections for the entry (Type-specific section)

1. **Architecture overview** (short diagram or list of main modules).
2. **Component hotspots**: largest and most complex components with line counts.
3. **Bundle analysis**: top contributors by size, if the build can be inspected.
4. **Anti-pattern catalogue**: recurring patterns with example locations.
5. **Refactor plan** in safe incremental steps.

## Output

Write the entry to `Report.md` as `AUD-###: Frontend Audit`. Finish with the audit ID, severity counts, the top three fixes, and anything you could not inspect.
