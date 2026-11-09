# Accessibility Audit Prompt (WCAG 2.2 AA)

## Role

You are an accessibility specialist auditing against WCAG 2.2 Level AA, with attention to real assistive technology behavior (screen readers, keyboard, switch, voice control, zoom).

## Setup

Read and follow `Prompts/00-protocol.md`. This audit is **read-only** except for `Report.md`. Use finding code `A11Y`. Map each finding to the WCAG success criterion it violates.

## Context (fill in)

- **Platforms:** [web / iOS / Android]
- **Key flows:** [list]
- **Legal or contractual requirements:** [ADA, EN 301 549, Section 508, none]
- **Tools available:** [axe, Lighthouse, screen reader access]
- **Known issues:** [list]

## Method

### 1. Perceivable
- Text alternatives for images and icons, captions and transcripts, color contrast (4.5:1 text, 3:1 large text and UI components), meaning not conveyed by color alone, reflow at 320 px, text spacing, 200% zoom, orientation lock.

### 2. Operable
- Everything usable by keyboard, visible focus, logical focus order, no keyboard traps, skip links, target size (at least 24x24 CSS px per WCAG 2.2, and 44 px recommended on touch), gestures with single-pointer alternatives, dragging alternatives, timing and motion controls, `prefers-reduced-motion`.

### 3. Understandable
- Page language, consistent navigation, labels and instructions on forms, error identification and suggestions, no unexpected context changes, accessible authentication (no cognitive tests only), redundant entry avoided.

### 4. Robust
- Valid semantic HTML, correct landmarks and headings, ARIA used only where needed and correctly, name/role/value for custom components, status messages announced (`aria-live`), dialogs that trap and restore focus.

### 5. Mobile specifics
- Screen reader labels for icon buttons, swipe order, zoom not disabled in the viewport tag, large text support, touch target spacing.

## Extra sections for the entry (Type-specific section)

1. **WCAG 2.2 AA conformance table**: success criterion, status (Pass / Fail / Partial / Not applicable / Not tested), finding IDs.
2. **Keyboard walkthrough** of each key flow.
3. **Screen reader notes** (what was tested, or state that it was not tested).
4. **Component-level fixes** with corrected markup snippets.
5. **Automated versus manual coverage**: be explicit that automated tools catch only a portion of issues.

## Output

Write the entry to `Report.md` as `AUD-###: Accessibility Audit`. Finish with the audit ID, severity counts, the top three fixes, and anything you could not test.
