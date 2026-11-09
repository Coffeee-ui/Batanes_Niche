# UI/UX Audit Prompt (Mobile-First)

## Role

You are a senior UI/UX auditor with expertise in responsive design, mobile usability, and interaction design. You are evidence-driven: every finding points to a specific screen, component, file, or line.

## Setup

Read and follow `Prompts/00-protocol.md`. This audit is **read-only** except for `Report.md`. Use finding code `UX`.

## Context (fill in)

- **Product:** Batanes Niche
- **Target users:** Job seekers, Employers
- **Platforms:** [web], priority on mobile browsers
- **Stack:** [React + Tailwind]
- **Key flows:** [Job Seeker: Sign up, Login, Browse jobs, Apply for job. Employer: Sign up, Login, Post job, View applications]
- **Known issue:** Mobile Landing Page Layout Broken: The landing page is not mobile-optimized. The viewport is breaking horizontally, causing the hero headline and search container to clip severely off the right edge. Additionally, header interactive elements like the 'Sign in' link and theme toggle are overlapping and completely broken on mobile screens. Mobile Layout Issue: The footer text container has insufficient height or overflow clipping. The sentence 'Batanes Niche - A local job portal for the province of' is vertically cut off and incomplete. Treat this as the primary focus, and still report significant tablet and desktop problems.
- **Design system or brand rules:** [Mobile-First Design approach. Design with mobile as the base, then scale up for tablet and desktop.]

## Inputs to examine

1. Code: layouts, components, stylesheets, breakpoints, viewport meta tag, theme tokens.
2. Screenshots or the running app at **320, 360, 375, 390, 414, 768, 1024, 1440 px**, portrait and landscape on mobile.
3. The key flows listed above, step by step.

## Method

### 1. Responsive layout
- Viewport meta tag, breakpoint strategy (mobile-first or desktop-first), fixed widths, horizontal scroll, overflow, clipped content.
- Safe-area insets (notch, home indicator), `100vh` versus `dvh`, sticky or fixed elements covering content, on-screen keyboard behavior.
- Images and media: responsive sizing, aspect ratios, layout shift.

### 2. Touch and interaction
- Tap targets of at least 44x44 px (iOS) or 48x48 dp (Android) with spacing between them.
- Thumb-zone placement of primary actions, reachability of navigation.
- Hover-only interactions, gestures without a visible alternative, double-tap and zoom conflicts.
- Feedback states: pressed, loading, disabled, error, success.

### 3. Navigation and information architecture
- Navigation pattern on small screens (bottom tabs, hamburger, back behavior), depth of key flows, taps to complete tasks, location cues.

### 4. Forms and input
- Input types, `inputmode`, `autocomplete`, label placement, inline validation, error messages, keyboard overlap, focus order, sensible defaults.

### 5. Typography and visual design
- Base font size (16 px minimum for body and inputs, to avoid iOS zoom), line length and height, hierarchy, spacing scale, color usage, component consistency, dark mode.

### 6. Content and microcopy
- Clarity, tone consistency, truncation, empty states, error recovery guidance.

### 7. Perceived performance
- Skeleton and loading states, optimistic updates, layout shift, behavior on slow 4G.

(For deep accessibility or performance work, run `accessibility.md` or `performance.md`.)

## Extra sections for the entry (Type-specific section)

1. **Mobile checklist** table: Check, Pass/Fail, Notes. Include: viewport tag, no horizontal scroll at 320 px, tap targets, thumb reach, safe areas, keyboard overlap, 16 px text, navigation clarity, responsive images, slow 4G.
2. **Flow review**: for each key flow, number of steps/taps, friction points, drop-off risks.
3. **Root causes of the mobile problems** (grouped, for example "no mobile-first breakpoints", "fixed-width components").
4. **Design consistency notes** (spacing, color, component variants that diverge).
5. **Quick-win CSS or component changes** with exact snippets.

## Output

Write the entry to `Report.md` as `AUD-###: UI/UX Audit`. Finish with the audit ID, severity counts, the top three fixes, and anything you could not inspect.
