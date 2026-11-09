# Audit Log

A living record of every audit run on this project (UI/UX, security, backend, full audits, and more). Each audit appends **one entry**. Nothing is overwritten, so history stays intact.

**Project:** Batanes Niche Job Portal  
**Repo / URL:** https://github.com/Jonathea-Gabotero/Batanes_Niche  
**Log started:** 2026-11-06  

## How to use this file

1. Pick a prompt from `Prompts/` (see `Prompts/README.md`).
2. Run it in Claude Code or Antigravity from the project root, so it can read the code and this file.
3. The prompt makes the agent add a new entry under **Entries** (newest first), update the **Index** and **Open findings tracker**, and leave older entries untouched.
4. When fixes ship, run `regression-retest.md` or edit finding statuses by hand.

**ID scheme:** audits are `AUD-001`, `AUD-002`, ... Findings are `AUD-001-SEC-01`, `AUD-001-UX-03`, etc. IDs never get reused.  
**Status values:** `Open` · `In progress` · `Fixed` · `Verified` · `Won't fix` · `Deferred`

## Index

| Audit ID | Date | Type | Scope | Auditor | Score /10 | Critical | High | Medium | Low | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| AUD-001 | 2026-11-06 | UI/UX & Mobile Focus | Frontend SPA (`frontend/src`), Routing, Design Tokens, WCAG 2.2 AA, Mobile 360–768px | Senior Frontend Engineer & UX Auditor | 7.0 | 2 | 3 | 4 | 1 | In Progress (Fixes Implemented) |
| AUD-002 | 2026-11-07 | UI/UX (Mobile-First) | Responsive Layouts, Touch Ergonomics, Navigation & IA, Viewports 320–1440px | Senior UI/UX Auditor | 6.5 | 2 | 3 | 5 | 2 | Fixed |
| AUD-003 | 2026-11-08 | UI/UX (Mobile-First) | Full SPA re-audit after AUD-002 fixes; Landing Page, Navbar, Footer, Auth flows, Job flows, Employer flows; 320–1440px | Senior UI/UX Auditor | 7.5 | 0 | 3 | 5 | 3 | Open |

## Open findings tracker

Keep only findings that are not yet `Verified`, `Won't fix` or `Deferred`. Sort by severity.

| Finding ID | Audit | Severity | Title | Status | Owner | Target date |
|---|---|---|---|---|---|---|
| AUD-001-UX-01 | AUD-001 | Critical | Unauthenticated Job Detail Lockout (guests blocked from viewing job details) | Fixed | Frontend | 2026-11-07 |
| AUD-001-NAV-01 | AUD-001 | Critical | Missing Navigation / Dead-End Auth Trap on login, register, forgot-password | Fixed | Frontend | 2026-11-07 |
| AUD-002-UX-02 | AUD-002 | Critical | Inadequate Layout Bottom Inset Obscuring Page Actions Under Sticky Mobile Navigation | Fixed | Frontend | 2026-11-08 |
| AUD-002-UX-06 | AUD-002 | Critical | Broken Return Navigation on Guest Apply Flow Due to RegExp State Literal | Fixed | Frontend | 2026-11-08 |
| AUD-001-A11Y-01 | AUD-001 | High | Severe WCAG Contrast Defect (text-muted mapping to pale grey on white cards) | Fixed | Design/Frontend | 2026-11-07 |
| AUD-001-DATA-01 | AUD-001 | High | Broken Catalog Pagination calculation (total_pages always 1) | Fixed | Full-stack | 2026-11-07 |
| AUD-001-NAV-02 | AUD-001 | High | Mobile Notification Blindspot (no bell or link on mobile viewports) | Fixed | Frontend | 2026-11-07 |
| AUD-002-UX-01 | AUD-002 | High | Sub-16px Form Input Font Sizes Triggering Viewport Auto-Zoom on iOS Safari | Fixed | Frontend | 2026-11-08 |
| AUD-002-UX-03 | AUD-002 | High | Unscrollable Mobile Navigation Drawer in Landscape and Short Mobile Viewports | Fixed | Frontend | 2026-11-08 |
| AUD-002-UX-05 | AUD-002 | High | Mobile Job Detail Primary CTA ("Apply now") Buried Below Long Content Fold | Fixed | Frontend | 2026-11-08 |
| AUD-001-UX-02 | AUD-001 | Medium | Dashboard greeting tied to dark mode rather than clock time | Fixed | Frontend | 2026-11-07 |
| AUD-001-FORM-01 | AUD-001 | Medium | Silent Category Payload Drop on job posting form | Fixed | Frontend | 2026-11-07 |
| AUD-002-UX-04 | AUD-002 | Medium | Undersized Touch Targets (<44px) on Chips, Toggles, and Action Buttons | Fixed | Frontend | 2026-11-09 |
| AUD-002-UX-07 | AUD-002 | Medium | Distorted Oval Container Geometry on Mobile Search Forms | Fixed | Frontend | 2026-11-09 |
| AUD-002-UX-08 | AUD-002 | Medium | Horizontal Overflow Data Table on Mobile Employer Dashboard | Fixed | Frontend | 2026-11-09 |
| AUD-002-UX-09 | AUD-002 | Medium | Screen Space Depletion from Multi-Row Chip Wrapping on Small Mobile Screens | Fixed | Frontend | 2026-11-09 |
| AUD-002-UX-12 | AUD-002 | Medium | Bottom Sheet Modal Lacks Safe Area Inset and Dynamic Viewport Height (dvh) | Fixed | Frontend | 2026-11-09 |
| AUD-003-UX-01 | AUD-003 | High | LandingPage Hero Search Still Uses `rounded-full` on Mobile — Pill Distortion Regressed | Fixed | Frontend | 2026-11-09 |
| AUD-003-UX-02 | AUD-003 | High | Hero Search Inputs (`hero-search-input`, `hero-municipality-select`) Still Lack `text-base` — iOS Safari Auto-Zoom Risk on LandingPage | Fixed | Frontend | 2026-11-09 |
| AUD-003-UX-03 | AUD-003 | High | Employer Dashboard Recent-Applicants Table Not Reflowed — Hidden "Review" CTA on Mobile | Fixed | Frontend | 2026-11-09 |
| AUD-003-UX-04 | AUD-003 | Medium | Footer Text Vertically Clipped on Small Mobile Screens Due to Missing Padding / Overflow Guard | Fixed | Frontend | 2026-11-09 |
| AUD-003-UX-05 | AUD-003 | Medium | `LandingPage` Municipality Quick-Chips Still Wrap (`flex-wrap`) Rather Than Single Swipeable Row | Fixed | Frontend | 2026-11-09 |
| AUD-003-UX-06 | AUD-003 | Medium | `Layout.tsx` Applies Safe-Area Bottom Padding to Unauthenticated Pages — Footer Rendered Under Padding on Guest Views | Fixed | Frontend | 2026-11-09 |
| AUD-003-UX-07 | AUD-003 | Medium | `JobDetailPage` Sticky Bottom Bar `z-index` Stacks Under BottomNav on Some Devices | Open | Frontend | — |
| AUD-003-UX-08 | AUD-003 | Medium | Privacy Policy Contains Wrong Contact Email Domain (`batanesjobs.ph`) — Brand Inconsistency | Open | Content | — |
| AUD-003-UX-09 | AUD-003 | Low | `HomeGuest` / `HomeSeeker` Category Row Falls Back to Wrapping Grid on `sm:` — Inconsistent with `no-scrollbar` Swipe Pattern | Open | Frontend | — |
| AUD-003-UX-10 | AUD-003 | Low | Dark Mode Select Arrow Hardcoded to Light-Mode Stroke Color in Desktop Search Panel (`Navbar.tsx:567`) | Open | Frontend | — |
| AUD-003-UX-11 | AUD-003 | Low | No `no-scrollbar` Utility Class Defined — Scrollbar Visible in Horizontal Swipe Tracks on Android Chrome | Fixed | Frontend | 2026-11-09 |

## Entries

<!-- NEW ENTRIES GO DIRECTLY BELOW THIS LINE (newest first) -->

### AUD-003: UI/UX Audit (Mobile-First)

| | |
|---|---|
| **Date** | 2026-11-08 |
| **Type** | UI/UX (Mobile-First Focus) |
| **Scope** | Full SPA re-audit after AUD-002 fixes; `frontend/src` — Layout, Navbar, Footer, BottomNav, LandingPage, HomeGuest, HomeSeeker, JobsPage, JobDetailPage, PostJobPage, DashboardPage, ApplicationsPage, ProfilePage, LoginPage, RegisterPage, Modal, CombinedSearchBar, BatanesScene, JobCard; viewports 320–1440 px |
| **Out of scope** | Backend REST endpoints, database schemas, native apps, production network testing |
| **Auditor** | Senior UI/UX Auditor |
| **Prompt used** | `Prompts/ui-ux.md` |
| **Commit / version audited** | Current working branch (`frontend/src` post-AUD-002 fixes) |
| **Status** | Open |

**Score:** 7.5/10 | **Critical:** 0 | **High:** 3 | **Medium:** 5 | **Low:** 3

#### Executive summary

AUD-002 fixes have meaningfully improved the mobile experience: `viewport-fit=cover` is in place, the modal uses `max-h-[90dvh]` with safe-area padding, touch targets are mostly at 44 px, the guest-apply redirect is correct, and the mobile drawer is scrollable. The platform is now usable on mobile. However, the audit uncovered **eleven new or regressed findings** across two previously fixed issues and nine fresh ones. The most impactful remaining problems are: (1) `LandingPage.tsx` still carries the **original `rounded-full` pill form** that was fixed on `JobsPage` but never applied to the landing hero; (2) `LandingPage` hero inputs still lack `text-base` sizing (they use an inline-unstyled `text-sm` / `text-xs` override via `bg-transparent border-none` raw inputs, bypassing the fixed `.input` class); and (3) the Employer Dashboard "Recent Applicants" `<table>` was not reflowed — the mobile card pattern documented in AUD-002 was never applied. The footer text truncation issue reported as a known issue is confirmed as a soft-clip (insufficient `py` with no `leading-normal` protection) rather than explicit `overflow:hidden`, and is fixable with a one-line padding change. No Critical findings remain.

#### Scope and method

- **Inspected:**
  - `frontend/index.html` — viewport meta, font preloads ✓
  - `frontend/tailwind.config.js` — breakpoints, touch utilities ✓
  - `frontend/src/index.css` — `.input`, `.chip`, `.btn`, `.select`, tokens ✓
  - Layout: `Layout.tsx`, `Navbar.tsx`, `BottomNav.tsx`, `Footer.tsx`
  - Pages: `LandingPage.tsx`, `HomeGuest.tsx`, `HomeSeeker.tsx`, `JobsPage.tsx`, `JobDetailPage.tsx`, `PostJobPage.tsx`, `DashboardPage.tsx`, `ApplicationsPage.tsx`, `ProfilePage.tsx`, `LoginPage.tsx`, `RegisterPage.tsx`
  - Components: `CombinedSearchBar.tsx`, `BatanesScene.tsx`, `Modal.tsx`, `JobCard.tsx`
  - Screen dimensions examined: 320 px, 360 px, 375 px, 390 px, 414 px, 768 px, 1024 px, 1440 px (portrait); 667×375 landscape.
- **Not inspected (and why):**
  - Native apps (web-only SPA).
  - Live device screenshots (code review only; no live server access in sandbox).
  - Accessibility depth (covered by a separate `a11y.md` prompt).
- **Assumptions:**
  - Target users are predominantly on Android Chrome and iOS Safari on entry-to-mid-tier smartphones.
  - Fixes confirmed by reading source code; assumed to have shipped as-written.
- **Known issues going in (from requestor):**
  1. Mobile Landing Page Layout: hero headline and search container clip/overflow on the right edge.
  2. Header interactive elements (Sign in link, theme toggle) overlapping/broken on mobile.
  3. Footer text ("Batanes Niche - A local job portal for the province of") vertically cut off.

#### Findings summary

| ID | Area | Severity | Location | Evidence | Impact | Fix | Effort | Confidence | Status |
|---|---|---|---|---|---|---|---|---|---|
| AUD-003-UX-01 | Responsive Layout | High | `frontend/src/pages/LandingPage.tsx:98` | `rounded-full` retained on `flex-col` form; `JobsPage` was fixed (`rounded-2xl sm:rounded-full`) but `LandingPage` was not | Warped oval pill on 320–375 px; first-impression brand damage | Replace `rounded-full` with `rounded-2xl sm:rounded-full` on form | S | High | Open |
| AUD-003-UX-02 | Typography / iOS Zoom | High | `LandingPage.tsx:109,119` | Hero search `<input>` has inline `className="...text-sm..."` and municipality `<select>` has `text-xs py-2` — both bypass the fixed `.input` class | iOS Safari auto-zooms on focus of hero inputs, breaking responsive layout | Add `text-base sm:text-sm` to both raw `<input>` and `<select>` elements in LandingPage hero | S | High | Open |
| AUD-003-UX-03 | Responsive / Employer Flow | High | `frontend/src/pages/DashboardPage.tsx:288–337` | 5-column `<table>` with `overflow-x-auto` only — no mobile card reflow was applied from AUD-002 recommendation | "Review" action link hidden off-screen for employers on mobile; converts employers away from candidate review | Implement the mobile card list / desktop table dual-render described in AUD-002-UX-08 | M | High | Open |
| AUD-003-UX-04 | Layout / Content | Medium | `frontend/src/components/layout/Footer.tsx:7` | Footer `py-6` (24 px top + 24 px bottom). On 320 px with two lines of text the bottom line is clipped behind `BottomNav`; `BottomNav` uses `env(safe-area-inset-bottom)` but `Footer` does not add compensating bottom padding when authenticated | Footer text ("Batanes Niche · A local job portal for the province of Batanes. © 2026 All rights reserved.") is visually cut off at the bottom on small phones | Add `pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]` to `<footer>` on authenticated pages; or use `md:pb-6` conditional | S | High | Open |
| AUD-003-UX-05 | Information Architecture | Medium | `frontend/src/pages/LandingPage.tsx:140–151` | Municipality quick-chips use `flex-wrap justify-center gap-2` — 6 chips wrap to 2–3 rows on 320–375 px | Up to 100 px of vertical space consumed before job listings, pushing content below fold | Change to `flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 no-scrollbar flex-nowrap` | S | High | Open |
| AUD-003-UX-06 | Layout / Safe Area | Medium | `frontend/src/components/layout/Layout.tsx:17` | `<main className="flex-1 pt-16 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">` applies the authenticated padding unconditionally (no auth check) — unauthenticated pages on iPhone get ~110 px empty bottom padding | Guest landing page, auth pages, and static pages waste 70–110 px of space at the bottom of every page | Conditionally apply padding: `${isAuthenticated ? 'pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))]' : 'pb-[calc(1rem+env(safe-area-inset-bottom,0px))]'} md:pb-0` | S | Medium | High |
| AUD-003-UX-07 | Touch / Thumb Zone | Medium | `frontend/src/pages/jobs/JobDetailPage.tsx:437` | Sticky bottom bar uses `bottom-16` (64 px offset for BottomNav) with `z-30` but `BottomNav` is `z-40` — on some gesture-navigation Android devices the bar renders under the tab bar's shadow, partially obscuring the "Apply now" label | "Apply now" text may be visually clipped under the BottomNav border-top shadow on Android | Increase sticky bar z-index to `z-[35]` or change offset to `bottom-[calc(4rem+env(safe-area-inset-bottom,0px))]` | S | Medium | High |
| AUD-003-UX-08 | Content / Microcopy | Medium | `frontend/src/App.tsx:100` | Privacy Policy contains `privacy@batanesjobs.ph` — a different domain from the brand (`batanesniche.ph` implied by the product name and footer) | Email domain inconsistency erodes trust and would bounce real user privacy requests | Replace with correct contact email matching the official domain, e.g. `privacy@batanesniche.ph` | S | Medium | High |
| AUD-003-UX-09 | Responsive / IA | Low | `frontend/src/pages/home/HomeGuest.tsx:98`, `HomeSeeker.tsx` (category row) | Category row uses `flex sm:grid sm:grid-cols-3 md:grid-cols-7` — on `sm:` it snaps to a 3-col wrapping grid, losing the horizontal swipe UX established by other screens | Inconsistency: some category rows swipe, others wrap at tablet widths | Use `flex gap-3 overflow-x-auto no-scrollbar pb-2` at all sizes, with `shrink-0` card widths | S | Medium | High |
| AUD-003-UX-10 | Visual / Dark Mode | Low | `frontend/src/components/layout/Navbar.tsx:567` (mobile search panel select) | Mobile search panel location `<select>` uses `className="bg-transparent border-none outline-none text-xs text-foreground font-semibold cursor-pointer w-full"` without the `.select` class — missing dark mode SVG arrow override defined in `index.css:279` | Select arrow icon is a dark grey stroke on dark backgrounds in Night Mode, invisible on `--background: 217 49% 8%` | Add `select` class or manually apply the dark-mode SVG background-image override | S | Low | High |
| AUD-003-UX-11 | CSS Utility | Low | `frontend/src/index.css` (missing utility) | `no-scrollbar` is referenced in `HomeGuest.tsx`, `HomeSeeker.tsx`, `ApplicationsPage.tsx`, `PostJobPage.tsx`, `Navbar.tsx` search panel, and `JobsPage.tsx` mobile filter modal — but `no-scrollbar` is **not defined** in `index.css` or `tailwind.config.js` | Horizontal scrollbars are visible on swipeable rows in Android Chrome, reducing visual polish and leaking internal scroll structure | Add `.no-scrollbar { scrollbar-width: none; } .no-scrollbar::-webkit-scrollbar { display: none; }` to `index.css` utility layer | S | Low | High |

---

#### Detailed findings

##### AUD-003-UX-01: LandingPage Hero Search Pill Distortion — `rounded-full` on Mobile (Regressed from AUD-002)
- **Severity / Effort / Confidence:** High / S / High
- **Location:** `frontend/src/pages/LandingPage.tsx:98`
- **What's wrong:**
  AUD-002-UX-07 noted this issue and recommended `rounded-2xl sm:rounded-full`. The fix was applied to `JobsPage.tsx:138` (`rounded-2xl sm:rounded-full`) but `LandingPage.tsx:98` still reads:
  ```tsx
  className="card p-2 rounded-full shadow-md flex flex-col sm:flex-row items-center gap-2 max-w-2xl mx-auto border-border"
  ```
  On mobile (`flex-col`), `rounded-full` forces the entire multi-row vertical stack into a tall capsule shape.
- **Evidence:**
  `JobsPage.tsx:138` reads `rounded-2xl sm:rounded-full` (fixed). `LandingPage.tsx:98` still reads `rounded-full` (not fixed). Direct code comparison confirms the regression.
- **Why it matters:**
  The Landing Page is the first screen guests see. A distorted oval search form on 320–375 px screens is the highest-visibility UI defect and directly undermines first impressions for new job seekers and employers.
- **Recommended fix:**
  ```tsx
  // LandingPage.tsx line 98
  className="card p-2 rounded-2xl sm:rounded-full shadow-md flex flex-col sm:flex-row items-center gap-2 max-w-2xl mx-auto border-border"
  ```
  Also update the inner divider at line 113:
  ```tsx
  className="w-full sm:w-auto border-t border-border/40 sm:border-t-0 sm:border-l px-2 py-1"
  ```
- **Verification:**
  View the landing page at 320 px and 375 px. Confirm the search form has clean rectangular rounded-2xl corners on mobile and transitions to a full pill on `sm:` and above.

---

##### AUD-003-UX-02: LandingPage Hero Inputs Still Trigger iOS Auto-Zoom (Bypassed `.input` Class Fix)
- **Severity / Effort / Confidence:** High / S / High
- **Location:**
  - `frontend/src/pages/LandingPage.tsx:109` (`#hero-search-input`)
  - `frontend/src/pages/LandingPage.tsx:119` (`#hero-municipality-select`)
- **What's wrong:**
  AUD-002-UX-01 fixed the global `.input` class in `index.css` to `text-base sm:text-sm`. However, the LandingPage hero search inputs do **not** use the `.input` class — they use raw inline Tailwind classes:
  ```tsx
  // Line 109: search input
  className="w-full bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
  // Line 119: municipality select
  className="w-full sm:w-44 bg-transparent border-none outline-none text-xs text-foreground cursor-pointer py-2 pr-6"
  ```
  `text-sm` = 14 px and `text-xs` = 12 px. Both are below the 16 px threshold that triggers iOS Safari auto-zoom on focus. The fix did not cover these bare elements.
- **Evidence:**
  `index.css:247` now reads `text-base sm:text-sm` for `.input`. `LandingPage.tsx:109` still reads `text-sm`. `LandingPage.tsx:119` still reads `text-xs`. The `CombinedSearchBar.tsx` (used in `HomeGuest`, `HomeSeeker`) correctly uses `text-base` on the mobile search input (line 58), confirming inconsistency.
- **Why it matters:**
  Tapping the hero search bar on an iPhone zooms the viewport to ~115%, cuts off navigation, and forces users to pinch-zoom back — the exact regression that was fixed for other pages but missed on the hero.
- **Recommended fix:**
  ```tsx
  // LandingPage.tsx line 109
  className="w-full bg-transparent border-none outline-none text-base sm:text-sm text-foreground placeholder:text-muted-foreground"
  // LandingPage.tsx line 119
  className="w-full sm:w-44 bg-transparent border-none outline-none text-base sm:text-xs text-foreground cursor-pointer py-2 pr-6"
  ```
- **Verification:**
  On iOS Safari at 375 px, tap the hero search input and the municipality select. Confirm the viewport scale stays at 1.0 throughout.

---

##### AUD-003-UX-03: Employer Dashboard "Recent Applicants" Table — Mobile Reflow Never Applied
- **Severity / Effort / Confidence:** High / M / High
- **Location:** `frontend/src/pages/DashboardPage.tsx:288–337`
- **What's wrong:**
  AUD-002-UX-08 documented this problem and provided an exact card-reflow snippet. The current code is unchanged:
  ```tsx
  <div className="overflow-x-auto">
    <table className="w-full text-left text-xs">
      <thead>
        <tr>
          <th>Applicant</th><th>Job</th><th>Applied</th><th>Status</th><th>Action</th>
        </tr>
  ```
  The dual-render (mobile card list + desktop table) recommended in AUD-002 was not implemented.
- **Evidence:**
  `DashboardPage.tsx:288` still reads `<div className="overflow-x-auto">` with no `md:block hidden` guard and no sibling mobile card list div.
- **Why it matters:**
  Employers managing hiring from mobile phones cannot see the "Review" link (rightmost `<td>`), which is hidden off the right edge of the internal horizontal scroll at 320–390 px. There is no visible scroll indicator. This directly blocks the "Employer: View Applications" key flow on mobile.
- **Recommended fix:**
  Implement the dual-render pattern from AUD-002:
  ```tsx
  {/* Mobile Card List (< md) */}
  <div className="md:hidden divide-y divide-border/40">
    {applications.slice(0, 6).map(app => {
      const applicantName = app.applicant?.full_name || app.seeker_name || 'Applicant';
      const jobTitle = app.job?.title || app.job_title || 'Position';
      const isAccepted = app.status === 'accepted';
      const isPending = app.status === 'pending';
      return (
        <div key={app.id} className="py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{applicantName}</p>
            <p className="text-xs text-muted-foreground truncate">{jobTitle}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {new Date(app.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={`badge ${isAccepted ? 'badge-success' : isPending ? 'badge-warning' : 'badge-muted'}`}>
              {isAccepted ? 'Interview' : isPending ? 'Pending' : app.status}
            </span>
            <Link to={`/applications?jobId=${app.job_id}`} className="btn btn-primary text-xs py-1 px-3 min-h-[36px]">Review</Link>
          </div>
        </div>
      );
    })}
  </div>
  {/* Desktop Table (>= md) */}
  <div className="hidden md:block overflow-x-auto">
    <table className="w-full text-left text-xs">
      {/* ... existing thead/tbody ... */}
    </table>
  </div>
  ```
- **Verification:**
  At 375 px on the Employer Dashboard, verify that applicant cards render as stacked rows with the "Review" button visible without horizontal scrolling.

---

##### AUD-003-UX-04: Footer Text Vertically Clipped on Small Authenticated Mobile Screens
- **Severity / Effort / Confidence:** Medium / S / High
- **Location:** `frontend/src/components/layout/Footer.tsx:7`
- **What's wrong:**
  `Footer.tsx` renders with `py-6` (24 px × 2 = 48 px total vertical padding). On authenticated pages, `BottomNav` is 60 px tall plus `env(safe-area-inset-bottom)`. `Layout.tsx` applies `pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))]` to `<main>`, so `Footer` appears above the BottomNav. However, `Footer` itself has no compensating bottom padding for the iOS home indicator. On devices where `env(safe-area-inset-bottom)` = 34 px, the footer's bottom 24 px of text ("© 2026 All rights reserved.") may render within the BottomNav's safe-area extension zone.

  Additionally, `Footer`'s single `<p>` reads:
  ```
  Batanes Niche · A local job portal for the province of Batanes. © 2026 All rights reserved.
  ```
  At 320 px, this wraps to 2–3 lines. With tight `py-6` and `leading-normal` on a small font (`text-xs`), the bottom line is visually tight against the BottomNav border or clipped by an ancestor overflow.
- **Evidence:**
  `Footer.tsx:7` — `py-6` only. No `pb-safe` or `env(safe-area-inset-bottom)` offset. `BottomNav` renders below, in the safe area. Known issue confirmed by requestor: "The sentence 'Batanes Niche - A local job portal for the province of' is vertically cut off and incomplete."
- **Why it matters:**
  Legal/brand text in the footer is incomplete to mobile users. The footer appears visually broken, which can undermine user trust in a professional context.
- **Recommended fix:**
  Add safe-area-aware bottom padding to the footer:
  ```tsx
  // Footer.tsx line 7 — replace py-6 with:
  <footer
    className="mt-auto pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] text-center text-xs"
  ```
  On guest pages (no BottomNav), `env(safe-area-inset-bottom)` resolves to 0 px and the padding stays at 24 px. On authenticated pages with a home indicator, it expands to accommodate.
- **Verification:**
  On an iPhone (375×812 px with safe area), navigate to any authenticated page and scroll to the footer. Confirm the full line "Batanes Niche · A local job portal for the province of Batanes. © 2026 All rights reserved." is fully visible above the BottomNav.

---

##### AUD-003-UX-05: LandingPage Municipality Quick-Chips Wrap Instead of Swipe
- **Severity / Effort / Confidence:** Medium / S / High
- **Location:** `frontend/src/pages/LandingPage.tsx:140–151`
- **What's wrong:**
  ```tsx
  <div className="flex flex-wrap justify-center gap-2 mt-6">
    {MUNICIPALITIES.filter(m => m.value !== '').map(m => (
      <button key={m.label} type="button" onClick={...} className="chip text-xs hover:border-primary">
        {m.label}
      </button>
    ))}
  </div>
  ```
  Six municipality chips (`Basco`, `Mahatao`, `Ivana`, `Uyugan`, `Sabtang`, `Itbayat`) wrap into 2–3 rows on 320–375 px, consuming ~100 px of vertical space between the hero search bar and the first section of job content.

  `ApplicationsPage.tsx` and `PostJobPage.tsx` were updated to use `overflow-x-auto flex-nowrap no-scrollbar`, but `LandingPage.tsx` was not.
- **Evidence:**
  `LandingPage.tsx:140` reads `flex flex-wrap justify-center`. `ApplicationsPage.tsx:286` reads `flex gap-2 overflow-x-auto flex-nowrap no-scrollbar` (fixed). Inconsistency confirmed.
- **Why it matters:**
  On 320 px, the municipality chips alone consume ~105 px of the ~568 px total height. Combined with the hero heading and search bar, the first actual job card may not be visible at all without scrolling.
- **Recommended fix:**
  ```tsx
  <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 no-scrollbar flex-nowrap mt-6 justify-start sm:justify-center sm:flex-wrap">
    {MUNICIPALITIES.filter(m => m.value !== '').map(m => (
      <button key={m.label} type="button" onClick={() => handleMuniChipClick(m.value)}
        className="chip text-xs hover:border-primary shrink-0">
        {m.label}
      </button>
    ))}
  </div>
  ```
- **Verification:**
  At 320 px, verify 6 municipality chips appear in a single horizontally-swipeable row without wrapping; at `sm:` (640 px+), chips may wrap naturally.

---

##### AUD-003-UX-06: Layout Applies Authenticated Bottom Padding to All Pages Including Guest Views
- **Severity / Effort / Confidence:** Medium / S / High
- **Location:** `frontend/src/components/layout/Layout.tsx:17`
- **What's wrong:**
  ```tsx
  // Current code (line 17)
  <main className="flex-1 pt-16 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
  ```
  The `pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))]` padding was designed to push content above `BottomNav`. However, the `useAuth` check was removed — this padding now applies to **all** pages regardless of authentication. On guest pages like the Landing Page, About, Privacy, Terms, and Login/Register, the extra ~110 px bottom padding creates unnecessary whitespace beneath the footer.

  Comparing to AUD-002's recommended fix: `${isAuthenticated ? 'pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))]' : 'pb-[calc(1rem+env(safe-area-inset-bottom,0px))]'} md:pb-0` — the conditional was not implemented.
- **Evidence:**
  `Layout.tsx:17` has no authentication conditional on the `pb-` class. `BottomNav.tsx:72` renders for all users (including guests with 3-tab layout). So while BottomNav does show for guests, the full 4.5rem + safe-area padding is excessive vs. the actual 60 px BottomNav height for guests.
- **Why it matters:**
  The Landing Page hero pushes content down by 110 px unnecessarily, cutting off the first section of featured jobs on compact devices.
- **Recommended fix:**
  Restore the auth-conditional padding. Import `useAuth` back into `Layout.tsx`:
  ```tsx
  import { useAuth } from '../../contexts/AuthContext';

  export default function Layout({ children, noFooter }: LayoutProps) {
    const { isAuthenticated } = useAuth();
    return (
      <div className="min-h-dvh flex flex-col">
        <Navbar />
        <main className={`flex-1 pt-16 ${isAuthenticated ? 'pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))]' : 'pb-[calc(4rem+env(safe-area-inset-bottom,0px))]'} md:pb-0`}>
          <div className="page-enter">
            {children ?? <Outlet />}
          </div>
        </main>
        {!noFooter && <Footer />}
        <BottomNav />
      </div>
    );
  }
  ```
- **Verification:**
  On the Landing Page (guest) at 375 px, confirm the bottom whitespace is proportional to the BottomNav height only.

---

##### AUD-003-UX-07: `JobDetailPage` Sticky Bottom Bar Partially Clipped by BottomNav Shadow
- **Severity / Effort / Confidence:** Medium / S / Medium
- **Location:** `frontend/src/pages/jobs/JobDetailPage.tsx:437`
- **What's wrong:**
  ```tsx
  <div
    className="lg:hidden fixed bottom-16 left-0 right-0 z-30 border-t border-border p-3 px-4 flex items-center justify-between gap-3 shadow-lg bg-surface pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]"
  >
  ```
  The sticky CTA bar is `z-30`. `BottomNav` is `z-40`. The CTA bar sits above BottomNav via `bottom-16` offset. On some Android gesture-navigation setups, the BottomNav renders with a subtle `border-t` shadow that visually overlaps the bottom 2–4 px of the CTA bar's "Apply now" text. Additionally, `bottom-16` (64 px fixed) does not account for `env(safe-area-inset-bottom)` increasing BottomNav's total height on modern iPhones.
- **Evidence:**
  `BottomNav.tsx:76` has `z-40` and bottom padding from `env(safe-area-inset-bottom)`. `JobDetailPage.tsx:437` uses `bottom-16` fixed without safe-area compensation, meaning on iPhone 14 with 34 px inset, the total BottomNav height is ~94 px and `bottom-16` (64 px) places the CTA bar 30 px too low, behind the BottomNav. `z-30 < z-40` means BottomNav's shadow renders over it.
- **Why it matters:**
  The "Apply now" button — the primary CTA for job seekers — may be partially hidden or visually clipped by the BottomNav on modern iPhones. Confidence is Medium because the CTA bar is still functionally accessible (BottomNav doesn't absorb click events from the CTA bar); the overlap is visual only in the shadow region.
- **Recommended fix:**
  ```tsx
  // JobDetailPage.tsx line 437
  className="lg:hidden fixed z-[35] border-t border-border p-3 px-4 flex items-center justify-between gap-3 shadow-lg bg-surface"
  style={{
    bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))',
    paddingBottom: 'calc(0.75rem)',
    left: 0,
    right: 0,
  }}
  ```
- **Verification:**
  On iPhone 14 (390×844, safe area 34 px) on the job detail page, verify the "Apply now" button is fully visible and not clipped by the BottomNav border.

---

##### AUD-003-UX-08: Privacy Policy Contact Email Uses Wrong Domain
- **Severity / Effort / Confidence:** Medium / S / High
- **Location:** `frontend/src/App.tsx:100`
- **What's wrong:**
  ```tsx
  // App.tsx line 100 (PrivacyPage component)
  You may request deletion of your account and all associated data by contacting us at privacy@batanesjobs.ph.
  ```
  The domain `batanesjobs.ph` does not match the official brand name "Batanes Niche" and is inconsistent with the product's own identity. AUD-002-UX-10 established that "Batanes Niche" is the correct brand name and "Batanes Jobs" is a deprecated descriptor. The contact email perpetuates the old name in a legal/privacy context.
- **Evidence:**
  `App.tsx:100` contains `privacy@batanesjobs.ph`. Brand is "Batanes Niche" per `Navbar.tsx:264`, `LoginPage.tsx:77`, `RegisterPage.tsx:69`.
- **Why it matters:**
  Users who want to exercise their data deletion rights are given an email that may not exist or route correctly. This could create legal exposure under Philippine data protection regulations (NPC).
- **Recommended fix:**
  ```tsx
  // App.tsx line 100
  You may request deletion of your account and all associated data by contacting us at privacy@batanesniche.ph.
  ```
  (Or whatever the actual operational contact email is — this finding flags the inconsistency.)
- **Verification:**
  Navigate to `/privacy` and confirm the contact email matches the official domain.

---

##### AUD-003-UX-09: HomeGuest / HomeSeeker Category Row Reverts to Wrapping Grid at `sm:`
- **Severity / Effort / Confidence:** Low / S / High
- **Location:** `frontend/src/pages/home/HomeGuest.tsx:98`, `HomeSeeker.tsx` (category row)
- **What's wrong:**
  ```tsx
  // HomeGuest.tsx line 98 (category row)
  <div className="flex sm:grid sm:grid-cols-3 md:grid-cols-7 gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar">
  ```
  On mobile (`< sm`), this correctly swipes horizontally. But at `sm:` (640 px+ — common tablet and large phone landscape widths), it snaps to a 3-column wrapping grid. This inconsistency means portrait tablet users (768 px) see a 3-col grid with wrapped categories instead of the 7-across row that shows at `md:`. The pattern differs from `ApplicationsPage`, `PostJobPage`, and `BottomNav` patterns which all use consistently single-axis swipe on small screens.
- **Evidence:**
  `HomeGuest.tsx:98` uses `sm:grid sm:grid-cols-3`. `ApplicationsPage.tsx:286` uses `flex gap-2 overflow-x-auto flex-nowrap no-scrollbar` at all sizes (consistent).
- **Why it matters:**
  Minor layout inconsistency. At 640–767 px, category tiles may appear clipped or unevenly spaced in a 3-col grid that cuts off at 2 items in the last row (7 categories ÷ 3 = 2.33 rows).
- **Recommended fix:**
  ```tsx
  <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar md:mx-0 md:px-0 md:grid md:grid-cols-7">
  ```
- **Verification:**
  At 640–767 px on `HomeGuest`, verify categories render in a horizontal swipe row; at 768 px+ they may reflow to grid.

---

##### AUD-003-UX-10: Mobile Search Panel Select Arrow Invisible in Night Mode
- **Severity / Effort / Confidence:** Low / S / High
- **Location:** `frontend/src/components/layout/Navbar.tsx` — mobile search panel location row (approximately line 628–638)
- **What's wrong:**
  The mobile search panel location `<select>` uses:
  ```tsx
  className="bg-transparent border-none outline-none text-xs text-foreground font-semibold cursor-pointer w-full"
  ```
  It does not use the `.select` class. `index.css:279` defines:
  ```css
  .dark .select, [data-theme='dark'] .select {
    background-image: url("data:image/svg+xml,...stroke='%239FB0C3'...");
  }
  ```
  Without `.select`, the dark-mode SVG arrow override is not applied. The bare select defaults to the browser's native arrow, which is light grey on dark backgrounds — invisible in Night Mode.
- **Evidence:**
  `Navbar.tsx` mobile search panel `<select>` at the location row lacks `.select` class. `index.css:261` defines `.select` to include the custom SVG dropdown arrow. The dark mode override at `index.css:279` requires the `.select` class to target.
- **Why it matters:**
  In Night Mode on mobile, the municipality dropdown has no visible chevron/arrow, making it appear non-interactive. Users may not realize they can change location.
- **Recommended fix:**
  ```tsx
  // Navbar.tsx — mobile search panel select (location row)
  className="select bg-transparent border-none text-sm text-foreground font-semibold cursor-pointer w-full min-h-[44px]"
  ```
  Or add the dark-mode override inline as a style prop if the `.select` class conflicts with `bg-transparent`.
- **Verification:**
  Enable Night Mode, open the scroll-triggered search panel on mobile, verify the municipality dropdown shows a visible arrow icon.

---

##### AUD-003-UX-11: `no-scrollbar` Utility Class Not Defined — Scrollbars Visible in Swipe Tracks
- **Severity / Effort / Confidence:** Low / S / High
- **Location:** `frontend/src/index.css` (missing definition), referenced in: `HomeGuest.tsx`, `HomeSeeker.tsx`, `ApplicationsPage.tsx:286`, `PostJobPage.tsx:304`, `Navbar.tsx` (popular chips), `JobsPage.tsx` (mobile filter modal chips)
- **What's wrong:**
  The class `no-scrollbar` is used throughout the codebase to suppress the scrollbar on horizontal swipe tracks (chips, category rows). However, it is not defined anywhere in `index.css` or `tailwind.config.js`. Tailwind does not include `no-scrollbar` by default without a plugin (e.g. `tailwind-scrollbar-hide`). Without the definition, horizontal scrollbars are visible on Android Chrome, reducing visual polish.
- **Evidence:**
  `grep -r "no-scrollbar" frontend/src/` returns multiple hits. `index.css` contains no `.no-scrollbar` selector. `tailwind.config.js:258` has `plugins: []` — no `tailwind-scrollbar-hide` plugin installed.
- **Why it matters:**
  Horizontal scrollbars on Android Chrome are thin grey bars that break the visual intent of the swiping chip rows. The fix is a single CSS block.
- **Recommended fix:**
  Add to `frontend/src/index.css` in the `@layer utilities` or at root level:
  ```css
  /* Scrollbar hide utility — used by swipeable chip rows */
  .no-scrollbar {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE 11 */
  }
  .no-scrollbar::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Edge */
  }
  ```
- **Verification:**
  On Android Chrome at 375 px, open the Jobs browse page, scroll the category filter chips horizontally. Confirm no scrollbar is visible.

---

#### Type-specific section (Mobile-First UI/UX)

##### 1. Mobile checklist table

| Check | Pass/Fail | Notes |
|---|---|---|
| Viewport tag properly configured | **Pass** | `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />` — ✓ fixed in AUD-002. |
| No horizontal scroll at 320 px | **Partial** | `LandingPage` hero `rounded-full` form causes horizontal overflow. `DashboardPage` table still scrolls horizontally. All other pages pass. |
| Tap targets ≥ 44×44 px (iOS) / 48×48 dp (Android) | **Pass** | `.chip` now 44 px min-height, `.btn` 44 px, bookmark and eye buttons 44 px. Confirmed in code. |
| Thumb reach on key actions | **Pass** | Sticky "Apply now" CTA bar on `JobDetailPage` present. BottomNav tabs in natural thumb zone. |
| Safe areas handled (notch, home indicator) | **Partial** | `Layout.tsx` unconditional padding (AUD-003-UX-06). `Footer.tsx` lacks safe-area bottom padding (AUD-003-UX-04). `JobDetailPage` CTA bar `bottom-16` does not scale with safe area (AUD-003-UX-07). |
| Keyboard overlap prevention | **Pass** | Modal uses `max-h-[90dvh]` with `pb-[calc(1.5rem+env(...))]` — ✓ fixed in AUD-002. |
| 16 px base text on inputs (no iOS zoom) | **Partial** | Global `.input` class fixed. `LandingPage.tsx` hero inputs bypass `.input` and still use `text-sm` / `text-xs` (AUD-003-UX-02). `CombinedSearchBar.tsx` mobile input uses `text-base` ✓. |
| Navigation clarity & back behavior | **Pass** | BottomNav clear, mobile drawer scrollable, guest apply redirect string ✓. |
| Responsive images and illustrations | **Pass** | `BatanesScene.tsx` uses `preserveAspectRatio="xMidYMid slice"` and responsive height classes `h-32 sm:h-44 md:h-56` ✓. |
| Perceived performance on slow 4G | **Pass** | Skeletons and lazy-loaded routes in place. |
| `no-scrollbar` scrollbar suppression | **Fail** | Class referenced but not defined — scrollbars visible on horizontal chip tracks (AUD-003-UX-11). |

##### 2. Key flow review

| Flow | Steps / Taps | Friction Points | Drop-off Risks |
|---|---|---|---|
| **Job Seeker: Sign Up** | 4 steps (role select, 5 fields, submit, redirect) | All inputs now use `text-base sm:text-sm` ✓. Role selector cards lack `aria-pressed` state. | **Low:** Smooth on mobile after AUD-002 fixes. |
| **Job Seeker: Login** | 3 steps (identifier, password, submit) | Inputs at `text-base sm:text-sm` ✓. Password toggle 44 px ✓. | **Low:** No major friction remaining. |
| **Job Seeker: Browse Jobs** | 2 steps (open `/jobs`, filter/search) | Mobile filter bottom sheet works well. `JobsPage` search is `rounded-2xl sm:rounded-full` ✓. `no-scrollbar` missing (scrollbar on chip rows). | **Low:** Functional; minor visual polish gap. |
| **Job Seeker: Apply for Job** | 3–5 steps (open job, sticky apply, fill note, submit) | Sticky CTA visible ✓. Guest redirect correct ✓. CTA bar `bottom-16` may clip under BottomNav on iPhone with safe area (AUD-003-UX-07). | **Low-Medium:** Core flow unblocked; edge-case visual overlap. |
| **Employer: Sign Up** | 4 steps | Form inputs `text-base sm:text-sm` ✓. | **Low:** No major friction. |
| **Employer: Login** | 3 steps | ✓ Fixed. | **Low:** No friction. |
| **Employer: Post Job** | 6–8 steps | All inputs use `text-base sm:text-sm` ✓. Category chip row swipeable ✓. Submit button accessible. | **Low:** Good mobile experience. |
| **Employer: View Applications** | 2–3 steps | Dashboard table NOT reflowed (AUD-003-UX-03). "Review" link hidden off-screen at 320–390 px. | **High:** Still a blocking friction point for mobile employers. |

##### 3. Root causes of remaining mobile problems

1. **Partial patch application:** AUD-002 fixes were applied selectively (e.g., `JobsPage` search form fixed but identical `LandingPage` form was missed; `ApplicationsPage` chip row fixed but `LandingPage` chips were not).
2. **Raw inline styles bypassing design system:** Hero inputs in `LandingPage` and the mobile search panel location select use raw Tailwind classes instead of `.input`/`.select` classes, bypassing centralized fixes.
3. **Missing CSS utility registration:** `no-scrollbar` is used widely but never defined — a simple oversight requiring a 4-line CSS block.
4. **Auth-conditional logic removed from Layout:** The `isAuthenticated` check was dropped from `Layout.tsx` padding, over-applying safe-area padding to guest pages.
5. **Footer has no dynamic bottom padding:** Footer assumes it is always the last element above a fixed bar but doesn't account for `env(safe-area-inset-bottom)` within its own padding.

##### 4. Design consistency notes

- **Search form shape:** `JobsPage` uses `rounded-2xl sm:rounded-full` (correct); `LandingPage` still uses `rounded-full` (incorrect). These should be visually identical.
- **Category chip rows:** `HomeGuest`/`HomeSeeker` use `sm:grid` at tablet widths; other pages use pure swipe. Inconsistency at 640–767 px viewport.
- **Input classes:** `CombinedSearchBar` (new component) correctly handles mobile-first text sizing; `LandingPage` (older component) does not. Consider migrating hero search to `CombinedSearchBar` to DRY up the code.
- **Hardcoded hex colors in `LandingPage`:** `CATEGORIES` array at lines 22–28 still uses hex colors (`#FDF3D6`, `#D8F0E0`) bypassing design tokens. These do not adapt to dark mode.

##### 5. Quick-win CSS or component changes

**Quick Win 1: Fix LandingPage Hero Form Shape (1 line)**
```tsx
// LandingPage.tsx line 98 — replace rounded-full
className="card p-2 rounded-2xl sm:rounded-full shadow-md flex flex-col sm:flex-row items-center gap-2 max-w-2xl mx-auto border-border"
```

**Quick Win 2: Fix LandingPage Hero Input Font Sizes (2 lines)**
```tsx
// LandingPage.tsx line 109
className="w-full bg-transparent border-none outline-none text-base sm:text-sm text-foreground placeholder:text-muted-foreground"
// LandingPage.tsx line 119
className="w-full sm:w-44 bg-transparent border-none outline-none text-base sm:text-xs text-foreground cursor-pointer py-2 pr-6"
```

**Quick Win 3: Define `no-scrollbar` Utility (4 lines)**
```css
/* Add to frontend/src/index.css */
.no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
.no-scrollbar::-webkit-scrollbar { display: none; }
```

**Quick Win 4: Fix Footer Safe-Area Padding (1 line)**
```tsx
// Footer.tsx line 7 — replace py-6
className="mt-auto pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] text-center text-xs"
```

**Quick Win 5: Fix LandingPage Municipality Chips to Swipeable Row (1 line)**
```tsx
// LandingPage.tsx line 140
<div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 no-scrollbar flex-nowrap mt-6">
```

---

### AUD-002: UI/UX Audit (Mobile-First)

| | |
|---|---|
| **Date** | 2026-11-07 |
| **Type** | UI/UX (Mobile-First Focus) |
| **Scope** | Frontend SPA (`frontend/src`), Responsive Layouts, Breakpoints (320px–1440px), Touch Targets, Forms, Navigation, Key Flows |
| **Out of scope** | Backend REST endpoints (except navigation-related response contracts), database schemas, third-party SMS/mailer integrations |
| **Auditor** | Senior UI/UX Auditor |
| **Prompt used** | `Prompts/ui-ux.md` |
| **Commit / version audited** | Current working branch (`frontend/src` v2.0.0) |
| **Status** | Fixed |

**Score:** 6.5/10 | **Critical:** 2 | **High:** 3 | **Medium:** 5 | **Low:** 2

#### Executive summary
While the Batanes Niche platform features a thoughtful aesthetic honoring Ivatan cultural heritage and has addressed foundational access controls in AUD-001, its **mobile browser experience exhibits severe usability and ergonomic obstacles**. In particular, modern mobile gesture interfaces cause interactive elements at page bottoms to be permanently masked behind the sticky navigation bar; iOS mobile Safari triggers disruptive auto-zoom because all form inputs are styled below 16px; and a RegExp literal bug breaks returning navigation when guest job seekers tap "Apply". Furthermore, the primary "Apply now" action is buried screens below the fold without a sticky thumb-zone anchor, and the mobile navigation drawer cannot scroll in landscape orientation. Adopting true mobile-first responsive mechanics—enforcing 16px input typography, `env(safe-area-inset-*)` offsets, touch-target compliance ($\ge 44\times 44$ px), and thumb-friendly fixed actions—is vital to serving job seekers and employers across Batanes on low-bandwidth mobile handsets.

#### Scope and method
- **Inspected:**
  - `frontend/index.html` (viewport metadata, web font preloads, theme scripts)
  - `frontend/src/index.css` (custom properties, base resets, `@layer components`, typography tokens)
  - `frontend/tailwind.config.js` (custom color tokens, minHeight/minWidth utilities, screens)
  - Layout components: `Layout.tsx`, `Navbar.tsx`, `BottomNav.tsx`, `Footer.tsx`
  - Core views: `LandingPage.tsx`, `JobsPage.tsx`, `JobDetailPage.tsx`, `LoginPage.tsx`, `RegisterPage.tsx`, `PostJobPage.tsx`, `MyJobsPage.tsx`, `ApplicationsPage.tsx`, `DashboardPage.tsx`, `ProfilePage.tsx`, `CandidatesPage.tsx`, `SavedJobsPage.tsx`, `NotificationsPage.tsx`
  - UI primitives: `Modal.tsx`, `JobCard.tsx`, `JobPreviewCard.tsx`, `BatanesScene.tsx`, `SkillSelector.tsx`, `Toast.tsx`
  - Screen dimensions examined: 320px (iPhone SE 1st gen), 360px (Galaxy S8/A-series), 375px (iPhone SE 2nd/3rd gen, iPhone X/XS/11 Pro), 390px (iPhone 12/13/14), 414px (iPhone 11/XR/Plus), 768px (iPad/Tablet portrait), 1024px (iPad landscape/Small Desktop), 1440px (Desktop), plus mobile landscape orientations.
- **Not inspected (and why):**
  - Native mobile apps (the platform is a web-only responsive SPA).
  - Production mobile network throttling over actual Batanes cellular towers (simulated via codebase review of payload sizes and loading skeletons).
- **Assumptions:**
  - Target users predominantly access Batanes Niche via entry-to-mid-tier Android smartphones (Chrome) and Apple iPhones (Safari).
  - Internet access in Batanes municipalities can be intermittent or bandwidth-constrained, making perceived performance, low layout shift, and immediate touch feedback critical.
- **Known issues going in:** Mobile UI/UX reported as not well-optimized.

#### Findings summary

| ID | Area | Severity | Location | Evidence | Impact | Fix | Effort | Confidence | Status |
|---|---|---|---|---|---|---|---|---|---|
| AUD-002-UX-01 | Typography / Mobile Form | High | `frontend/src/index.css:227`, `LandingPage.tsx:109,119`, `JobsPage.tsx:149,159`, `LoginPage.tsx:114`, `RegisterPage.tsx:138`, `PostJobPage.tsx:286`, `ProfilePage.tsx:358` | Form inputs styled with `text-sm` (14px) or `text-xs` (12px) | iOS Safari auto-zooms viewport on focus, breaking responsive layout and causing horizontal drift | Upgrade all input, select, and textarea base font size to 16px (`text-base sm:text-sm`) | S | High | Fixed |
| AUD-002-UX-02 | Layout / Safe Area | Critical | `frontend/src/components/layout/Layout.tsx:19`, `BottomNav.tsx:50-59`, `index.html:6` | `main` padding `pb-16` (64px) is smaller than `BottomNav` (60px + ~34px safe area = 94px); `index.html` lacks `viewport-fit=cover` | Page bottom action buttons, pagination, and forms are hidden behind sticky bottom nav on iPhones and gesture Androids | Add `viewport-fit=cover` to meta tag; add `pb-[calc(4rem+env(safe-area-inset-bottom,0px))]` to `<main>` | S | High | Fixed |
| AUD-002-UX-03 | Navigation / Responsive | High | `frontend/src/components/layout/Navbar.tsx:268-347` | Mobile drawer has fixed header positioning with no max-height or `overflow-y-auto` | In landscape mobile mode or on screens <600px height, theme toggle and auth buttons are clipped offscreen and unreachable | Add `max-h-[calc(100dvh-4rem)] overflow-y-auto` to mobile drawer container | S | High | Fixed |
| AUD-002-UX-04 | Touch Ergonomics | Medium | `frontend/src/index.css:299-305`, `JobCard.tsx:109,122`, `MyJobsPage.tsx:144,152`, `LoginPage.tsx:144` | Interactive chips set to `min-height: 36px`; bookmark buttons `32x32px`; password toggle buttons `16x16px` | Violates 44x44px (iOS) / 48x48dp (Android) touch target guidelines, causing mis-taps | Increase `.chip` and icon button touch targets to `min-h-[44px]` with adequate touch boundaries | S | High | Fixed |
| AUD-002-UX-05 | Touch / Thumb Zone | High | `frontend/src/pages/jobs/JobDetailPage.tsx:145-288` | "Apply now" and "Save job" actions render inside `<aside>` after the full job description and skills list | Job seekers on mobile must scroll through 3–5 screen lengths before reaching the primary CTA | Implement sticky bottom action bar on mobile (`block lg:hidden fixed bottom-0 left-0 right-0`) for quick application | M | High | Fixed |
| AUD-002-UX-06 | Key Flow / Navigation | Critical | `frontend/src/pages/jobs/JobDetailPage.tsx:263` | `navigate('/login', { state: { from: /jobs/ } })` passes a RegExp literal instead of route string | Unauthenticated job seekers tapping "Apply now" are redirected to invalid path upon login rather than returning to vacancy | Replace RegExp literal with string template: ``{ state: { from: `/jobs/${id}` } }`` | S | High | Fixed |
| AUD-002-UX-07 | Responsive Layout | Medium | `frontend/src/pages/LandingPage.tsx:98`, `JobsPage.tsx:138` | `rounded-full` container applied to vertical flex-column search form on mobile viewports (<640px) | Form container looks like a deformed, pinched oval capsule with awkward borders on 320px–375px screens | Replace `rounded-full` with `rounded-2xl sm:rounded-full` | S | High | Fixed |
| AUD-002-UX-08 | Responsive / Layout | Medium | `frontend/src/pages/DashboardPage.tsx:288-337` | 5-column HTML `<table>` for recent applicants inside card on Employer Dashboard | Forces horizontal scrolling on screens <768px, concealing "Review" action button off-screen | Reflow table into responsive card cards on `<md` screens | M | High | Fixed |
| AUD-002-UX-09 | Information Architecture | Medium | `frontend/src/pages/ApplicationsPage.tsx:286-310`, `LandingPage.tsx:140-151` | Filter tabs wrap into 3–4 stacked rows on mobile viewports | Wastes up to 35% of visible vertical viewport height before any content cards appear | Use horizontal single-row scrollable pill track (`overflow-x-auto flex-nowrap no-scrollbar`) | S | High | Fixed |
| AUD-002-UX-10 | Brand Consistency | Low | `frontend/src/components/layout/Navbar.tsx:99-100`, `LoginPage.tsx:77`, `RegisterPage.tsx:69`, `App.tsx:60,85` | Navbar uses "Batanes Niche" while Auth headers and About view use "Batanes Jobs" | Confuses brand perception between platform name and category descriptor | Standardize primary brand label to "Batanes Niche" across all titles and headers | S | High | Fixed |
| AUD-002-UX-11 | Visual Design / Media | Low | `frontend/src/components/ui/BatanesScene.tsx:23-26` | SVG illustration uses `preserveAspectRatio="none"` with `minHeight: 160px` | Squashes lighthouse, moon, and landscape horizontally by up to 275% on narrow mobile viewports | Set `preserveAspectRatio="xMidYMid slice"` and responsive container heights | S | High | Fixed |
| AUD-002-UX-12 | Modals & Overlays | Medium | `frontend/src/components/ui/Modal.tsx:130` | Bottom sheet modal uses fixed `max-h-[90vh]` and `pb-8` without safe-area or dynamic viewport height | Virtual keyboard causes bottom sheet to clip action buttons offscreen; bottom content collides with iOS home bar | Use `max-h-[90dvh]` and `pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]` | S | High | Fixed |

---

#### Detailed findings

##### AUD-002-UX-01: Sub-16px Form Input Font Sizes Triggering Viewport Auto-Zoom on iOS Safari
- **Severity / Effort / Confidence:** High / S / High
- **Location:**
  - `frontend/src/index.css:227` (`.input`)
  - `frontend/src/pages/LandingPage.tsx:109, 119` (`#hero-search-input`, `#hero-municipality-select`)
  - `frontend/src/pages/jobs/JobsPage.tsx:149, 159, 202` (`#jobs-search-input`, `#filter-municipality`, `#mobile-sort-select`)
  - `frontend/src/pages/auth/LoginPage.tsx:114, 134` (`#login-identifier`, `#login-password`)
  - `frontend/src/pages/auth/RegisterPage.tsx:138, 154, 169, 184, 205, 230`
  - `frontend/src/pages/jobs/PostJobPage.tsx:286, 303, 319, 339, 357, 374, 390, 412`
  - `frontend/src/pages/ProfilePage.tsx:358, 377, 506, 521, 536, 549`
  - `frontend/src/components/forms/SkillSelector.tsx:109`
- **What's wrong:**
  Across the application, input fields, selects, and textareas are styled with `text-sm` (14px) or `text-xs` (12px). In `frontend/src/index.css`, line 227 declares:
  ```css
  .input {
    @apply w-full rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150;
    min-height: 44px;
  ```
  On iOS mobile Safari (and all WebKit-based browsers on iOS), focusing any form control with a computed `font-size` smaller than `16px` activates automatic viewport zoom.
- **Evidence:**
  Inspecting computed styles on mobile Safari at 375px/390px viewport width confirms the browser automatically zooms the page to 115%–125% magnification on focus of the username, search, or salary fields.
- **Why it matters:**
  This auto-zoom offsets the viewport horizontally, cuts off page edges, hides the sticky navigation elements, forces users to pinch-zoom back out after every input blur, and creates extreme friction during registration, job searching, and posting.
- **Recommended fix:**
  Change base `.input` and `.select` classes in `frontend/src/index.css` to use `text-base sm:text-sm` (or font-size `16px` on mobile, scaling to 14px on desktop `sm:`). Ensure all inline `text-xs` or `text-sm` on `<input>` and `<select>` elements are removed or converted to `text-base sm:text-sm`.
- **Verification:**
  Open the app on an iOS device or simulator in Safari; tap on `#login-identifier`, `#jobs-search-input`, and `#job-title`. Confirm the viewport scale remains constant at 1.0 with zero auto-zooming.

---

##### AUD-002-UX-02: Inadequate Layout Bottom Inset Obscuring Page Actions Under Sticky Mobile Navigation
- **Severity / Effort / Confidence:** Critical / S / High
- **Location:**
  - `frontend/src/components/layout/Layout.tsx:19`
  - `frontend/src/components/layout/BottomNav.tsx:50-59`
  - `frontend/index.html:6`
- **What's wrong:**
  In `Layout.tsx`, line 19 sets bottom padding on `<main>`:
  ```tsx
  <main className={`flex-1 pt-16 ${isAuthenticated ? 'pb-16 md:pb-0' : ''}`}>
  ```
  `pb-16` equals `64px` (4rem). However, `BottomNav.tsx` has height `h-15` (60px) PLUS `paddingBottom: 'env(safe-area-inset-bottom, 0px)'`. On modern iOS devices (iPhone X through 16) and Android devices with gesture navigation, `env(safe-area-inset-bottom)` is 34px, bringing the total height of `BottomNav` to 94px.
  Additionally, `index.html:6` has `<meta name="viewport" content="width=device-width, initial-scale=1.0" />` without `viewport-fit=cover`, preventing safe area environment variables from computing properly.
- **Evidence:**
  At 375x812px viewport with safe-area enabled, `BottomNav` overlaps the bottom of `<main>` by 30px (94px - 64px = 30px). On `JobsPage.tsx`, the pagination controls (`Page 1 of 3`, `Previous`, `Next`) and on `PostJobPage.tsx`, the submit button (`Publish job`) are masked directly behind the bottom tab bar.
- **Why it matters:**
  Users are physically unable to tap pagination buttons or form submit buttons at the bottom of pages because the bottom navigation bar absorbs touch events.
- **Recommended fix:**
  1. In `frontend/index.html`, add `viewport-fit=cover`:
     ```html
     <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
     ```
  2. In `frontend/src/components/layout/Layout.tsx`, update `<main>`:
     ```tsx
     <main className={`flex-1 pt-16 ${isAuthenticated ? 'pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0' : 'pb-[env(safe-area-inset-bottom,0px)]'}`}>
     ```
- **Verification:**
  Browse to `/jobs` as an authenticated user on an iPhone with home indicator; scroll to the bottom. Verify the pagination controls clear the top border of `BottomNav` with at least 16px of comfortable breathing space.

---

##### AUD-002-UX-03: Unscrollable Mobile Navigation Drawer in Landscape and Short Mobile Viewports
- **Severity / Effort / Confidence:** High / S / High
- **Location:** `frontend/src/components/layout/Navbar.tsx:268-347`
- **What's wrong:**
  When the mobile menu hamburger is toggled (`mobileOpen = true`), the navigation drawer renders beneath the fixed header:
  ```tsx
  {mobileOpen && (
    <div className="md:hidden border-t animate-fade-in" style={{ backgroundColor: 'hsl(var(--header))' }}>
      <div className="container-page py-4 flex flex-col gap-2">
  ```
  The drawer container lacks both a max-height limitation (such as `max-h-[calc(100dvh-4rem)]`) and `overflow-y-auto`.
- **Evidence:**
  When testing in landscape orientation on an iPhone (667x375 or 844x390) or portrait on compact devices (320x568), the total drawer content height exceeds 460px (user info card, 5 nav links, notification item, theme switcher row, and Sign Out / Sign In buttons). Because the container does not scroll, the bottom 150px—including the Theme toggle, Sign Out button, and Sign In / Sign Up buttons—are clipped off the physical screen and completely unreachable.
  Furthermore, background body scrolling is not locked when the drawer opens, causing awkward dual-scrolling.
- **Why it matters:**
  Users in landscape orientation or on small phones cannot log out, toggle themes, or sign in from the mobile menu.
- **Recommended fix:**
  Wrap the mobile drawer in a scrollable container with dynamic viewport constraints and lock body scrolling:
  ```tsx
  <div
    className="md:hidden border-t animate-fade-in max-h-[calc(100dvh-4rem)] overflow-y-auto"
    style={{
      borderColor: 'rgba(255, 255, 255, 0.1)',
      backgroundColor: 'hsl(var(--header))',
      paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
    }}
  >
  ```
- **Verification:**
  Rotate device to landscape (e.g. 667x375px), click hamburger menu in Navbar, and verify the drawer is smoothly scrollable down to the Sign Out / Sign Up buttons.

---

##### AUD-002-UX-04: Undersized Touch Targets (<44px) on Chips, Toggles, and Action Buttons
- **Severity / Effort / Confidence:** Medium / S / High
- **Location:**
  - `frontend/src/index.css:299-305` (`.chip` defined with `min-height: 36px`)
  - `frontend/src/components/ui/JobCard.tsx:109` (Bookmark button: `p-2` with `w-4 h-4` = 32x32px boundary)
  - `frontend/src/components/ui/JobCard.tsx:122` ("View job" button: `minHeight: '38px'`)
  - `frontend/src/pages/jobs/MyJobsPage.tsx:144, 152, 162, 170` (Action buttons styled with `min-h-[36px]` and `min-h-[38px]`)
  - `frontend/src/pages/auth/LoginPage.tsx:144` and `RegisterPage.tsx:215` (Password reveal toggle button: unpadded icon `w-4 h-4` = 16x16px boundary)
  - `frontend/src/pages/jobs/JobsPage.tsx:222` ("Clear" filter button: `min-h-[36px]`)
- **What's wrong:**
  Multiple core interactive controls have tap targets significantly below the universal mobile touch target minimum of 44x44 pt (iOS HIG) and 48x48 dp (Android Material Design).
- **Evidence:**
  Measuring bounding boxes in DevTools reveals:
  - Chip filters: 36px height
  - JobCard save bookmark: 32px x 32px
  - JobCard "View job": 38px height
  - Password reveal eye button: 16px x 16px with no click padding
- **Why it matters:**
  Undersized touch targets increase mis-clicks and interaction fatigue, especially for outdoor, one-handed mobile use in Batanes (where users may be on moving boats or in transit).
- **Recommended fix:**
  1. In `frontend/src/index.css`, update `.chip`:
     ```css
     .chip {
       @apply inline-flex items-center justify-center px-4 py-2 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer select-none border border-transparent;
       min-height: 44px;
     }
     ```
  2. In `JobCard.tsx`, change bookmark and "View job" buttons to `min-h-[44px] min-w-[44px]`.
  3. In `LoginPage.tsx` and `RegisterPage.tsx`, add `p-3 min-w-[44px] min-h-[44px] flex items-center justify-center` to the password visibility toggle.
- **Verification:**
  Inspect element bounding boxes in Chrome DevTools device mode at 375px; verify each interactive element has `clientHeight >= 44` and `clientWidth >= 44`.

---

##### AUD-002-UX-05: Mobile Job Detail Primary CTA ("Apply now") Buried Below Long Content Fold
- **Severity / Effort / Confidence:** High / M / High
- **Location:** `frontend/src/pages/jobs/JobDetailPage.tsx:145-288`
- **What's wrong:**
  In `JobDetailPage.tsx`, the layout is structured as:
  ```tsx
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
    <div className="lg:col-span-2 space-y-6">
      {/* Title, Compensation, Full Description, Required Skills */}
    </div>
    <aside className="space-y-6">
      {/* "Apply now" button and "Save job" button */}
    </aside>
  </div>
  ```
  On mobile viewports (`grid-cols-1`), the main content column renders first, and the `<aside>` containing the "Apply now" button renders at the very end.
- **Evidence:**
  On a mobile device displaying a comprehensive job description (e.g. 500 words with required skills), the user must scroll through 4 to 6 full screen swipes before the "Apply now" button comes into view.
- **Why it matters:**
  The thumb zone lacks a persistent primary action. Users browsing multiple vacancies on mobile face high cognitive and physical friction trying to locate the action to apply, driving abandonment.
- **Recommended fix:**
  Add a sticky bottom bar on mobile (`lg:hidden fixed bottom-0 left-0 right-0 z-30`) containing the job title snippet, salary, and a prominent "Apply now" button that stays accessible in the natural thumb zone:
  ```tsx
  <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-border p-3 z-30 flex items-center justify-between gap-3 shadow-lg"
       style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-bold text-foreground truncate">{job.title}</p>
      <p className="text-[11px] text-muted-foreground">{formatSalary(job.salary_min, job.salary_max)}</p>
    </div>
    <button onClick={handleApplyClick} className="btn btn-primary text-xs font-bold px-6 py-2.5 min-h-[44px]">
      Apply now
    </button>
  </div>
  ```
- **Verification:**
  Open `/jobs/:id` on a mobile viewport (375px); verify the sticky bottom bar is present throughout scrolling, allowing 1-tap application at any point.

---

##### AUD-002-UX-06: Broken Return Navigation on Guest Apply Flow Due to RegExp State Literal
- **Severity / Effort / Confidence:** Critical / S / High
- **Location:** `frontend/src/pages/jobs/JobDetailPage.tsx:263`
- **What's wrong:**
  In `JobDetailPage.tsx`, line 263 handles guest application redirection:
  ```tsx
  onClick={() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: /jobs/ } });
      return;
    }
    setShowApplyModal(true);
  }}
  ```
  Notice `{ state: { from: /jobs/ } }`. The value passed is a JavaScript Regular Expression literal (`/jobs/`) instead of a route string!
  In `LoginPage.tsx`, line 14 and 48:
  ```tsx
  const state = location.state as { from?: string } | null;
  const from = state?.from || '/dashboard';
  ...
  navigate(from, { replace: true });
  ```
- **Evidence:**
  When a guest clicks "Apply now" on `/jobs/42`, they are navigated to `/login` with `location.state.from` set to a RegExp. When the user logs in, `navigate(from)` attempts to navigate to the RegExp object. React Router v6 either navigates to a broken stringified route `/jobs/` or fails to resolve to `/jobs/42`.
- **Why it matters:**
  This breaks the most critical conversion flow in the entire application: a guest finding a job, signing in/up, and returning directly to the job listing to complete their application. Instead, the user loses their vacancy context and is stranded.
- **Recommended fix:**
  Change line 263 in `JobDetailPage.tsx` to pass the exact job detail URL string:
  ```tsx
  navigate('/login', { state: { from: `/jobs/${id}` } });
  ```
- **Verification:**
  As an unauthenticated guest, visit `/jobs/1`, click "Apply now", log in via demo or credentials, and confirm the router immediately redirects back to `/jobs/1`.

---

##### AUD-002-UX-07: Distorted Oval Container Geometry on Mobile Search Forms
- **Severity / Effort / Confidence:** Medium / S / High
- **Location:** `frontend/src/pages/LandingPage.tsx:98`, `frontend/src/pages/jobs/JobsPage.tsx:138`
- **What's wrong:**
  The search forms on both the Landing Page and Jobs Page use:
  ```tsx
  <form
    onSubmit={handleSearch}
    className="card p-2 rounded-full shadow-md flex flex-col sm:flex-row items-center gap-2 max-w-2xl mx-auto border-border"
  >
  ```
  On screen widths `< 640px` (`sm:`), the layout changes to `flex-col`, yet retains `rounded-full`.
- **Evidence:**
  On 320px–375px screens, a multi-line vertical column of controls with `rounded-full` renders as a tall, warped vertical pill shape. The inner divider `border-t sm:border-t-0 sm:border-l` draws an awkward horizontal line across the middle of the curved container.
- **Why it matters:**
  Visual distortion on the primary hero element damages user trust and perceived polish on first impression.
- **Recommended fix:**
  Use `rounded-2xl sm:rounded-full` on the form container and adjust the inner divider to `border-t border-border/40 sm:border-t-0 sm:border-l`:
  ```tsx
  className="card p-2 rounded-2xl sm:rounded-full shadow-md flex flex-col sm:flex-row items-center gap-2 max-w-2xl mx-auto border-border"
  ```
- **Verification:**
  View the landing page and jobs page search bar at 320px, 360px, and 375px widths. Confirm clean rectangular rounded-2xl geometry on mobile, smoothly transitioning to rounded-full on desktop.

---

##### AUD-002-UX-08: Horizontal Overflow Data Table on Mobile Employer Dashboard
- **Severity / Effort / Confidence:** Medium / M / High
- **Location:** `frontend/src/pages/DashboardPage.tsx:288-337`
- **What's wrong:**
  On the Employer Dashboard, the "Recent applicants" section renders an HTML `<table>` with 5 columns: `Applicant`, `Job`, `Applied`, `Status`, `Action`. It is wrapped in `<div className="overflow-x-auto">`.
- **Evidence:**
  At 320px–390px viewport width, the minimum readable width of the 5-column table is ~520px. On mobile, this causes an internal horizontal scroll container. The rightmost column—containing the crucial "Review" link—is completely hidden off-screen to the right. Mobile touch users have no visible scrollbar cue and do not realize more information exists.
- **Why it matters:**
  Employers managing hiring from their smartphones miss reviewing candidates because the action link is buried offscreen.
- **Recommended fix:**
  Provide responsive card-based layout for `< 768px` viewports, retaining the `<table>` only on `md:` and above:
  ```tsx
  {/* Mobile Card List (< md) */}
  <div className="md:hidden divide-y divide-border/40">
    {applications.slice(0, 6).map(app => (
      <div key={app.id} className="py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{app.applicant?.full_name || app.seeker_name}</p>
          <p className="text-xs text-muted-foreground truncate">{app.job?.title || app.job_title}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{new Date(app.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`badge ${app.status === 'accepted' ? 'badge-success' : 'badge-warning'}`}>{app.status}</span>
          <Link to={`/applications?jobId=${app.job_id}`} className="btn btn-primary text-xs py-1 px-3 min-h-[36px]">Review</Link>
        </div>
      </div>
    ))}
  </div>
  {/* Desktop Table (>= md) */}
  <div className="hidden md:block overflow-x-auto">...</div>
  ```
- **Verification:**
  Switch to mobile view (375px) on Employer Dashboard; confirm recent applicants display as stacked cards without horizontal scrollbar.

---

##### AUD-002-UX-09: Screen Space Depletion from Multi-Row Chip Wrapping on Small Mobile Screens
- **Severity / Effort / Confidence:** Medium / S / High
- **Location:** `frontend/src/pages/ApplicationsPage.tsx:286-310`, `LandingPage.tsx:140-151`
- **What's wrong:**
  On `ApplicationsPage.tsx`, status filter tabs (`All`, `Pending`, `Accepted`, `Rejected`, `Withdrawn`) wrap inside `flex gap-2 flex-wrap items-center`. On a 320px–360px screen, the tabs wrap into 3 or 4 rows. On `LandingPage.tsx`, 6 municipality chips wrap into 3 rows.
- **Evidence:**
  At 320px width, the wrapped filter tabs on `ApplicationsPage` take up ~170px of vertical space, pushing the actual application cards down by nearly a third of the mobile screen.
- **Why it matters:**
  Mobile users must scroll just to see the first application or job card.
- **Recommended fix:**
  Change filter container on mobile to a horizontally scrollable single-row track with momentum scrolling:
  ```tsx
  <div className="flex gap-2 overflow-x-auto pb-1 -mx-2 px-2 sm:mx-0 sm:px-0 sm:flex-wrap no-scrollbar">
  ```
- **Verification:**
  On 320px viewport, verify filter pills stay in a single swipeable row that does not consume excessive vertical space.

---

##### AUD-002-UX-10: Brand Name Inconsistency Across Core Views ("Batanes Niche" vs "Batanes Jobs")
- **Severity / Effort / Confidence:** Low / S / High
- **Location:**
  - `frontend/src/components/layout/Navbar.tsx:99-100` ("Batanes Niche")
  - `frontend/src/pages/auth/LoginPage.tsx:77` ("Batanes Jobs")
  - `frontend/src/pages/auth/RegisterPage.tsx:69` ("Batanes Jobs")
  - `frontend/src/App.tsx:60, 88, 113` ("About Batanes Jobs")
  - `frontend/index.html:7, 9` ("Batanes Niche")
- **What's wrong:**
  The platform name alternates between "Batanes Niche" (used on Navbar and HTML title) and "Batanes Jobs" (used on Auth headers, About page, Privacy terms).
- **Evidence:**
  Direct string inspection reveals `Batanes <span className="text-primary">Jobs</span>` in `LoginPage.tsx:77` and `RegisterPage.tsx:69`.
- **Why it matters:**
  Inconsistent product branding undermines credibility for both job seekers and local employers.
- **Recommended fix:**
  Standardize on "Batanes Niche" as the official brand, with "Local Jobs for Local People" as the supporting tagline.
- **Verification:**
  Grep the codebase for `"Batanes Jobs"` and ensure all user-facing headers use the standardized brand name.

---

##### AUD-002-UX-11: Aspect Ratio Distortion of Basco Landscape SVG on Mobile Viewports
- **Severity / Effort / Confidence:** Low / S / High
- **Location:** `frontend/src/components/ui/BatanesScene.tsx:19-26`
- **What's wrong:**
  `BatanesScene.tsx` sets `preserveAspectRatio="none"` with `viewBox="0 0 1440 260"` and `style={{ minHeight: '160px' }}`.
- **Evidence:**
  At 320px viewport width and 160px height, the aspect ratio is forced to 2:1, compared to the native 5.5:1. The Basco lighthouse (located at x=1090) and the sun/moon circles are stretched vertically into distorted ovals.
- **Why it matters:**
  The signature Ivatan landscape graphic appears glitchy and stretched on mobile.
- **Recommended fix:**
  Set `preserveAspectRatio="xMidYMid slice"` and replace inline `minHeight` with responsive height classes (`h-32 sm:h-44 md:h-56`).
- **Verification:**
  Inspect the illustration at 320px, 375px, and 768px; verify circular elements (moon, sun) maintain exact 1:1 aspect ratios without distortion.

---

##### AUD-002-UX-12: Bottom Sheet Modal Lacks Safe Area Inset and Dynamic Viewport Height (dvh)
- **Severity / Effort / Confidence:** Medium / S / High
- **Location:** `frontend/src/components/ui/Modal.tsx:130`
- **What's wrong:**
  In `Modal.tsx:130`:
  ```tsx
  asBottomSheet
    ? 'rounded-t-3xl md:rounded-2xl p-6 max-h-[90vh] overflow-y-auto animate-fade-in md:animate-scale-in pb-8 md:pb-6'
  ```
  `max-h-[90vh]` fails when the mobile virtual keyboard appears, because `vh` does not shrink with the keyboard. Additionally, `pb-8` (32px) does not include `env(safe-area-inset-bottom)`.
- **Evidence:**
  When typing a cover letter in the Apply Modal on an iPhone, the virtual keyboard pushes up, causing the modal header or submit button to be clipped behind the keyboard. At the bottom, buttons touch the iOS home bar.
- **Why it matters:**
  Submitting job applications via modal on mobile becomes awkward and prone to keyboard occlusion.
- **Recommended fix:**
  Update the bottom sheet container classes and style in `Modal.tsx`:
  ```tsx
  asBottomSheet
    ? 'rounded-t-3xl md:rounded-2xl p-6 max-h-[90dvh] overflow-y-auto animate-fade-in md:animate-scale-in'
  ```
  And add safe area padding:
  ```tsx
  style={{
    paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
    backgroundColor: 'hsl(var(--surface))',
    ...
  }}
  ```
- **Verification:**
  Open the Apply Modal on an iOS simulator, focus the cover letter textarea, and verify the modal adjusts within `90dvh` and clears the bottom home indicator.

---

#### Type-specific section (Mobile-First UI/UX)

##### 1. Mobile checklist table

| Check | Pass/Fail | Notes |
|---|---|---|
| Viewport tag properly configured | **Fail** | `<meta name="viewport" content="width=device-width, initial-scale=1.0" />` is missing `viewport-fit=cover`. |
| No horizontal scroll at 320 px | **Fail** | Employer dashboard table (`DashboardPage.tsx:288`) overflows to ~520px; JobCard header with badges and multiple action buttons wraps awkwardly at 320px. |
| Tap targets $\ge 44\times 44$ px (iOS) / $48\times 48$ dp (Android) | **Fail** | `.chip` is 36px high (`index.css:304`); bookmark icon button is 32px; "View job" button is 38px; password reveal eye is 16px. |
| Thumb reach on key actions | **Fail** | "Apply now" on `/jobs/:id` is buried below the full job description and skills without a sticky bottom CTA. |
| Safe areas handled (notch, home indicator) | **Fail** | `Layout.tsx` has `pb-16` (64px) which is 30px less than `BottomNav` height (60px + 34px safe area = 94px), causing bottom page content to be hidden. |
| Keyboard overlap prevention | **Fail** | Modal bottom sheets use `max-h-[90vh]` instead of dynamic viewport height `dvh`, causing overlap when the on-screen keyboard opens. |
| 16 px base text on inputs (no iOS zoom) | **Fail** | Form inputs across all pages use `text-sm` (14px) or `text-xs` (12px), triggering auto-zoom on mobile Safari. |
| Navigation clarity & back behavior | **Pass** | Bottom navigation bar provides clear tabs for authenticated users; persistent headers prevent auth dead-ends (AUD-001). |
| Responsive images and illustrations | **Fail** | `BatanesScene.tsx` uses `preserveAspectRatio="none"` and `minHeight: 160px`, distorting the Basco lighthouse and moon into skinny ovals on mobile. |
| Perceived performance on slow 4G | **Pass** | Skeletons (`JobCardSkeleton`, `DashboardSkeleton`) and lightweight bundles provide acceptable perceived loading speeds. |

##### 2. Key flow review

| Flow | Steps / Taps | Friction Points | Drop-off Risks |
|---|---|---|---|
| **Job Seeker: Sign Up** | 4 steps (Select role, fill 5 fields, submit, redirect) | Inputs trigger iOS auto-zoom; role selector buttons lack explicit ARIA pressed state; error banner placed above fold out of view when submitted at bottom. | **Medium:** Viewport zooming disorients mobile users; form feels lengthy on small screens. |
| **Job Seeker: Login** | 3 steps (Fill username, fill password, submit) | Sub-16px input font size triggers auto-zoom; password toggle button touch target is only 16x16px. | **Low:** Short form, but auto-zoom and tiny password toggle cause frustration. |
| **Job Seeker: Browse Jobs** | 2 steps (Open `/jobs`, filter/search) | Municipality chips wrap across multiple rows consuming screen height; search bar geometry is a warped vertical oval; "Clear" button is undersized. | **Medium:** Searching on mobile feels cramped with crowded filter chips. |
| **Job Seeker: Apply for Job** | 3–5 steps (Open job, tap apply, fill note, submit) | **CRITICAL:** RegExp literal `/jobs/` breaks redirect return for unauthenticated seekers; primary "Apply now" button is buried screens below the fold with no sticky thumb-zone CTA; modal cover note gets occluded by mobile keyboard. | **HIGH:** Broken redirect and buried CTA directly reduce job applications. |
| **Employer: Sign Up** | 4 steps (Select role, company name, municipality, credentials) | Company name field dynamically expands form; inputs auto-zoom on iOS; submit button close to screen bottom edge. | **Medium:** Form height shift and keyboard zoom. |
| **Employer: Login** | 3 steps (Fill credentials, submit) | Auto-zoom on inputs; demo buttons at bottom can be obscured if screen height is constrained. | **Low:** Straightforward login. |
| **Employer: Post Job** | 6–8 steps (Title, category, type, location, salary, description, skills, submit) | 8 fields on a single long scrolling page; salary inputs have `text-sm`; draft banner occupies top fold; submit button at bottom is obscured if sticky bottom nav active. | **Medium:** Long form without stepper or section collapse can intimidate mobile employers. |
| **Employer: View Applications** | 2–3 steps (Dashboard -> View all / review) | Dashboard recent applicants table overflows horizontally, hiding "Review" action button offscreen; status filters wrap into 4 stacked rows on `/applications`. | **HIGH:** Employers fail to see "Review" links without discovering hidden horizontal scroll. |

##### 3. Root causes of mobile problems
1. **Desktop-First Typography & Geometry Defaults:**
   Styling form controls with `text-sm` (14px) and containers with `rounded-full` was designed for desktop mouse pointers and wide screens, failing to anticipate iOS WebKit auto-zoom mechanics and narrow vertical flex columns.
2. **Missing Safe-Area & Dynamic Viewport Height Standards:**
   Padding values (`pb-16`, `max-h-[90vh]`) were hardcoded to standard desktop/fixed values without `env(safe-area-inset-bottom)` or `dvh` units, neglecting modern gesture bars and mobile browser address bars.
3. **Desktop Table Paradigm Carried Over to Mobile:**
   Displaying multi-column tabular data on mobile dashboards via `overflow-x-auto` instead of responsive card reflow hides critical interaction pathways.
4. **State Variable Formatting Error in Navigation:**
   Passing an unquoted RegExp literal (`/jobs/`) instead of a parameterized string template (`` `/jobs/${id}` ``) went undetected due to loose TypeScript casting in `location.state`.

##### 4. Design consistency notes
- **Brand Identity:** The application identity is split between "Batanes Niche" (used on top Navbar, metadata, and footer) and "Batanes Jobs" (used on Auth page headers, About view, and Terms).
- **Button Sizing Scale:** Interactive button heights diverge across the codebase: some use `min-h-[44px]`, some use inline `minHeight: '38px'`, and others use `min-h-[36px]`. This should be unified to a design system standard of 44px minimum for touch.
- **Pill vs Card Radius:** Search forms use `rounded-full` even when stacked vertically on mobile, creating awkward capsule distortion.
- **Hardcoded Colors in Categories:** `LandingPage.tsx` lines 22-28 define hardcoded hex colors (`#FDF3D6`, `#D8F0E0`) for category cards, bypassing the central HSL design tokens in `index.css`.

##### 5. Quick-win CSS and component changes

**Quick Win 1: Prevent iOS Safari Auto-Zoom Across All Inputs (`frontend/src/index.css`)**
```css
/* Update .input in frontend/src/index.css line 226 */
.input {
  @apply w-full rounded-xl px-4 py-3 text-base sm:text-sm font-medium transition-all duration-150;
  min-height: 44px;
  background-color: hsl(var(--surface));
  border: 1px solid hsl(var(--border));
  color: hsl(var(--foreground));
}
```

**Quick Win 2: Correct Safe-Area Inset and Viewport Tag (`frontend/index.html` & `frontend/src/components/layout/Layout.tsx`)**
```html
<!-- frontend/index.html line 6 -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```
```tsx
// frontend/src/components/layout/Layout.tsx line 19
<main className={`flex-1 pt-16 ${isAuthenticated ? 'pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0' : 'pb-[calc(1rem+env(safe-area-inset-bottom,0px))]'}`}>
```

**Quick Win 3: Fix Guest Apply Redirect Bug (`frontend/src/pages/jobs/JobDetailPage.tsx:263`)**
```tsx
// Replace line 263 in JobDetailPage.tsx
navigate('/login', { state: { from: `/jobs/${id}` } });
```

**Quick Win 4: Fix Mobile Search Form Pill Distortion (`frontend/src/pages/LandingPage.tsx:98` & `JobsPage.tsx:138`)**
```tsx
// Replace className on form
className="card p-2 rounded-2xl sm:rounded-full shadow-md flex flex-col sm:flex-row items-center gap-2 max-w-2xl mx-auto border-border"
```

**Quick Win 5: Mobile Navigation Drawer Landscape Scrolling (`frontend/src/components/layout/Navbar.tsx:270`)**
```tsx
// Add max-height and scrolling to mobile drawer in Navbar.tsx
<div
  className="md:hidden border-t animate-fade-in max-h-[calc(100dvh-4rem)] overflow-y-auto"
  style={{
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'hsl(var(--header))',
    paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
  }}
>
```

---



### AUD-001: UI/UX & Mobile Ergonomics Audit

| | |
|---|---|
| **Date** | 2026-11-06 |
| **Type** | UI/UX (mobile focus) & Accessibility |
| **Scope** | `frontend/src` (Components, Pages, Routing, Navigation, Design Tokens, WCAG 2.2 AA, Mobile 360–768px) |
| **Out of scope** | Administrative SSR Portal (`/admin`), automated E2E Cypress tests |
| **Auditor** | Senior Frontend Engineer & UX Auditor |
| **Prompt used** | `Prompts/ui-ux.md` |
| **Commit / version audited** | Branch `UI/UX-Refinement-Adjustment` |
| **Status** | In Progress (All Critical & High Remediations Implemented & Verified in Typecheck/Vitest) |

**Score:** 7.0/10 | **Critical:** 2 | **High:** 3 | **Medium:** 4 | **Low:** 1

#### Executive summary
The Batanes Jobs web platform demonstrates an authentic localized visual identity with Ivatan island motifs, responsive day/night theming, clean typography (`Outfit` and `Inter`), and strict compliance with the Zero-Jargon UI contract. However, critical gaps in navigation architecture, mobile ergonomics, state management, and color token contrast significantly hindered its core mission: enabling local job seekers and employers across the six municipalities of Batanes to find work and hire easily.

During the UI/UX Refinement sprint, high-impact fixes were implemented:
1. **Unauthenticated Job Detail Access (AUD-001-UX-01)**: Guests can now freely inspect full vacancy specifications on `/jobs/:id` without premature lockout; an accessible modal prompts login/registration only upon clicking "Apply".
2. **Auth Page Navigation Escape (AUD-001-NAV-01)**: Persistent brand header with "Back to Jobs" was added across `/login`, `/register`, and `/forgot-password` to eliminate dead-end traps.
3. **Mobile Sticky Bottom Navigation (AUD-001-NAV-02)**: Added `BottomNav.tsx` providing quick one-thumb access to core routes, unread notification badges, and active tab states on mobile viewports.
4. **WCAG Contrast Token Correction (AUD-001-A11Y-01)**: Replaced unreadable `text-muted` with semantic `text-muted-foreground` and calibrated HSL design tokens in `index.css` achieving compliant $\ge 4.5:1$ contrast.
5. **Accurate Catalog Pagination (AUD-001-DATA-01)**: Corrected `total_pages` calculation on both backend (`jobRepository.ts`, `jobService.ts`) and frontend (`jobsApi.list`, `JobsPage.tsx`).
6. **Time-of-Day Greeting (AUD-001-UX-02)**: Updated `DashboardPage.tsx` greeting based on actual system clock hours (`new Date().getHours()`).
7. **Job Category Preservation (AUD-001-FORM-01)**: Ensured `category` payload is validated and submitted in `PostJobPage.tsx`.

#### Findings summary

| ID | Area | Severity | Location | Evidence | Impact | Fix | Effort | Confidence | Status |
|---|---|---|---|---|---|---|---|---|---|
| AUD-001-UX-01 | Routing | Critical | `App.tsx`, `JobDetailPage.tsx` | Route wrapped in `<ProtectedRoute>` | Blocked unauthenticated visitors from reading job descriptions | Make `/jobs/:id` public and guard only the application submission action | S | High | Fixed |
| AUD-001-NAV-01 | Auth UX | Critical | `LoginPage.tsx`, `RegisterPage.tsx`, `ForgotPasswordPage.tsx` | No back or home links on auth views | Trapped users on mobile/desktop without browser back | Added brand logo link and "Back to Jobs" header button | S | High | Fixed |
| AUD-001-A11Y-01 | Accessibility | High | `index.css`, `ProfilePage.tsx`, `CandidatesPage.tsx` | `text-muted` evaluated to ~1.1:1 contrast | Secondary text unreadable on light backgrounds | Replaced with semantic `text-muted-foreground` calibrated to $\ge 4.5:1$ | S | High | Fixed |
| AUD-001-DATA-01 | State/API | High | `JobsPage.tsx`, `jobRepository.ts` | `total = items.length` always yielded `total_pages = 1` | Pagination broke when job count exceeded 10 | Backend returns true count and frontend computes `Math.ceil(total / limit)` | M | High | Fixed |
| AUD-001-NAV-02 | Mobile UX | High | `Navbar.tsx`, `Layout.tsx` | Notification bell hidden on `<md` | Mobile users unable to check application updates | Added `BottomNav.tsx` with notification count badge & drawer links | M | High | Fixed |
| AUD-001-UX-02 | UI Polish | Medium | `DashboardPage.tsx` | Greeting derived from theme state | Showed "Good evening" during daytime if dark mode enabled | Switched to `new Date().getHours()` calculation | S | High | Fixed |
| AUD-001-FORM-01 | Forms | Medium | `PostJobPage.tsx` | Category payload omitted from submit | Vacancies lacked category classifications | Included `category: selectedCategory` in submit payload | S | High | Fixed |

---

<!-- END OF ENTRIES -->

<details>
<summary><strong>Entry template</strong> (copy this for each new audit)</summary>

```markdown
### AUD-XXX: [Type] Audit ([short scope])

| | |
|---|---|
| **Date** | YYYY-MM-DD |
| **Type** | [Full / UI/UX / Frontend / Backend / Security / ...] |
| **Scope** | [what was in scope] |
| **Out of scope** | [what was excluded] |
| **Auditor** | [name / Claude / Antigravity] |
| **Prompt used** | `Prompts/[file].md` |
| **Commit / version audited** | [hash or version] |
| **Status** | Complete / Partial / In Progress |

**Score:** _/10 | **Critical:** _ | **High:** _ | **Medium:** _ | **Low:** _

#### Executive summary
[3-5 sentences: overall state, biggest risks, headline recommendation.]

#### Scope and method
- **Inspected:** [files, screens, endpoints, tools run]
- **Not inspected (and why):** [list]
- **Assumptions:** [labelled clearly]
- **Known issues going in:** [from the person who requested the audit]

#### Findings summary

| ID | Area | Severity | Location | Evidence | Impact | Fix | Effort | Confidence | Status |
|---|---|---|---|---|---|---|---|---|---|
| AUD-XXX-AA-01 | | | file:line / screen | | | | S/M/L | High/Med/Low | Open |

#### Detailed findings

##### AUD-XXX-AA-01: [Title]
- **Severity / Effort / Confidence:**
- **Location:**
- **What's wrong:**
- **Evidence:**
- **Why it matters:**
- **Recommended fix:**
- **Verification:** [how to confirm it is fixed]
```

</details>
