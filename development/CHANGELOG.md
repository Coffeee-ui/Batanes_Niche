# Changelog

All meaningful development changes to the Batanes Niche Job Portal are recorded here.

---

## [Unreleased]

### Fixed

- **Frontend — Light/Dark Mode: faint browser-native dropdown arrow on all `<select>` elements**
  - Root cause: No `appearance: none` was set on `<select>` elements, so browsers rendered their own OS-level chevron arrow using system control colors (a muted gray). This made the dropdown icon visually indistinct from the input background — particularly on the hero landing-page municipality selector — causing the control to appear disabled even when active.
  - Resolution: Added a centralized `.select` utility class to `index.css` that sets `appearance: none`, injects a custom URL-encoded SVG chevron via `background-image` at the semantic muted-text color (`#6b7280` in Light Mode, `#9ca3af` in Dark Mode), and reserves right-padding for the arrow. Applied `className="input select"` to all `<select>` elements across `JobsPage`, `CandidatesPage`, `PostJobPage`, `ProfilePage`, and `RegisterPage`. The hero `LandingPage` municipality selector uses identical inline styles (it has a non-standard white background) and was fixed inline.

- **Frontend — LandingPage hero: Search icon used `--color-text-faint` instead of `--color-text-muted`**
  - Root cause: The search icon inside the hero search bar was rendered at `hsl(var(--color-text-faint))` — appropriate for secondary metadata text but too pale for a functional control icon on a white input background.
  - Resolution: Changed the hero search icon color to `hsl(var(--color-text-muted))` for clearly visible but still visually secondary rendering.

- **Frontend — Light/Dark Mode: `.card` leaked hard-coded Tailwind utilities**
  - Root cause: `.card` in `index.css` used `@apply bg-white border border-slate-100`, injecting hard-coded theme-insensitive classes that conflicted with the semantic token properties declared below them.
  - Resolution: Removed `bg-white border border-slate-100` from the `@apply` directive; `background-color` and `border` are now declared exclusively via CSS custom properties, eliminating the latent dark-mode override risk.

- **Frontend — Light/Dark Mode: `badge-warning` used a hard-coded HSL color**
  - Root cause: `.badge-warning` in `index.css` used `color: hsl(35 80% 38%)` — a raw literal that never adapted to the active theme. In Dark Mode, dark amber text on the pale warning background was low-contrast.
  - Resolution: Introduced `--color-warning-text` semantic token defined separately in `:root` (dark amber for Light Mode: `35 75% 34%`) and `[data-theme='dark']` (bright amber for Dark Mode: `35 90% 68%`). `.badge-warning` now uses `color: hsl(var(--color-warning-text))`.

- **Frontend — Light/Dark Mode: Tailwind config referenced non-existent CSS variable names**
  - Root cause: `tailwind.config.js` extended colors using variable names that were never defined in `index.css` (e.g. `--bg-app`, `--text-primary`, `--border-subtle`, `--brand-primary`, `--color-error`). Every extended Tailwind utility class (`text-content-primary`, `bg-surface`, `bg-app`, `feedback-error`) resolved to `undefined` — producing no color output and potentially causing invisible text in either theme.
  - Resolution: Corrected all variable references to match the actual names defined in `index.css` (`--color-bg`, `--color-surface`, `--color-bg-alt`, `--color-text`, `--color-text-muted`, `--color-text-faint`, `--color-border-subtle`, `--color-border`, `--color-primary`, `--color-primary-dark`, `--color-success`, `--color-warning`, `--color-danger`, `--color-info`). Added `hsl()` wrappers since tokens are stored as raw HSL components. Fixed `--color-error` → `--color-danger`. Removed the undefined `--brand-surface` entry.

- **Frontend — Light Mode: `--color-text-faint` had critically low contrast (~2.6:1)**
  - Root cause: `--color-text-faint: 215 10% 68%` on near-white surfaces produced approximately 2.6:1 contrast ratio — far below WCAG AA (4.5:1 for normal text). Helper text, posted-date metadata, and placeholder colors were very pale and difficult to read, especially for users in bright environments.
  - Resolution: Changed to `215 12% 52%` (~4.1:1 contrast on white), improving readability of all timestamps, helper text, and input placeholders while remaining clearly distinct from primary and muted text.

- **Frontend — Dark Mode: `--color-text-faint` was too dark at 40% lightness**
  - Root cause: `--color-text-faint: 210 10% 40%` on dark surfaces (`222 25% 14%`) produced approximately 3.3:1 contrast — borderline for small metadata text.
  - Resolution: Changed to `210 10% 48%` — approximately 3.9–4.4:1 depending on surface, meaningfully improving readability of timestamps and faint text in Dark Mode.

### Changed

- **Frontend — Light Mode visual quality: surface separation improved**
  - `--color-bg` adjusted from `210 20% 98%` to `214 22% 97%` (adds a cooler blue-grey identity to the page canvas, clearly distinguishable from white card surfaces).
  - `--color-bg-alt` adjusted from `210 14% 95%` to `214 18% 93%` (creates a clear visual step for alternating sections and auth page backgrounds).
  - `--color-surface-hover` adjusted from `210 20% 97%` to `214 20% 98%` (aligned hue with new surface system).

- **Frontend — Light Mode visual quality: borders made more visible**
  - `--color-border` adjusted from `214 20% 88%` to `214 20% 83%` (card and input borders are now clearly visible without being heavy).
  - `--color-border-subtle` adjusted from `214 20% 93%` to `214 20% 89%` (card boundary is present and readable).

- **Frontend — Dark Mode visual quality: borders and muted text refined**
  - `--color-border` adjusted from `222 20% 22%` to `222 20% 26%` (slightly stronger surface separation in dark panels).
  - `--color-border-subtle` adjusted from `222 20% 18%` to `222 20% 20%`.
  - `--color-text-muted` adjusted from `210 12% 60%` to `210 14% 64%` (secondary text slightly more comfortable to read in dark context).

- **Frontend — Light Mode visual quality: secondary text contrast improved**
  - `--color-text-muted` adjusted from `215 15% 45%` to `215 18% 38%` — approximately 4.6:1 contrast on white, up from 3.8:1. Company names, section labels, and metadata are now reliably readable.

- **Frontend — Light Mode visual quality: card shadows slightly strengthened**
  - `--shadow-sm` updated from `0 1px 3px 0 rgb(0 0 0 / 0.06)` to `0 1px 4px 0 rgb(0 0 0 / 0.08)` — cards lift more clearly from the page background.
  - `--shadow-md` and `--shadow-lg` updated proportionally.

### Files Changed

- `frontend/src/index.css`
- `frontend/tailwind.config.js`
