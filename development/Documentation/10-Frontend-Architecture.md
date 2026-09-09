# 10 - Frontend Architecture

## 1. Technology Stack & Tooling

The frontend of the **Batanes Niche Job Portal** is implemented as a modern, high-performance Single Page Application (SPA).

| Tool / Technology | Version | Purpose |
|---|---|---|
| **React** | `18.3.x` | Declarative component UI library |
| **Vite** | `5.4.x` | Development server, HMR, and production bundler |
| **TypeScript** | `5.9.x` (installed; `package.json` specifies `^5.4.5`) | Static type safety across components and API models |
| **Tailwind CSS** | `3.4.x` | Utility-first styling integrated with CSS design tokens |
| **Axios** | `1.7.x` | HTTP client with request/response interceptors |
| **React Router** | `6.23.x` | Declarative client-side routing and protected route guards |
| **Lucide React** | `0.395.x` | Accessible icon library |

---

## 2. Definitive Route Map & Navigation Guards

The routing topology is declared in `frontend/src/App.tsx`. All routes are grouped by access permission:

```
                                    +-----------------------------------------+
                                    |                 BROWSER                 |
                                    +-----------------------------------------+
                                                         |
                                                         v
                                    +-----------------------------------------+
                                    |             React Router DOM            |
                                    +-----------------------------------------+
                                                         |
                   +-------------------------------------+-------------------------------------+
                   |                                     |                                     |
                   v                                     v                                     v
       +-----------------------+             +-----------------------+             +-----------------------+
       |     Public Routes     |             |  Seeker-Only Routes   |             | Employer-Only Routes  |
       +-----------------------+             +-----------------------+             +-----------------------+
       | /                     |             | /dashboard            |             | /employer             |
       | /jobs                 |             | /profile              |             | /employer/jobs/new    |
       | /jobs/:id             |             | /notifications        |             | /employer/jobs/:id/edit|
       | /login                |             +-----------------------+             | /candidates           |
       | /register             |                                                   | /profile              |
       | /forgot-password      |                                                   | /notifications        |
       | /reset-password       |                                                   +-----------------------+
       | * (404 Not Found)     |
       +-----------------------+
```

### Route Guard Implementation
- **`ProtectedRoute`**: Verifies `isAuthenticated == true`. If unauthenticated, saves current location and redirects to `/login`.
- **Role Verification**:
  - `SeekerOnly`: Redirects employers attempting to access `/dashboard` to `/employer`.
  - `EmployerOnly`: Redirects seekers attempting to access `/employer/*` or `/candidates` to `/dashboard`.

---

## 3. State Management & Authentication Lifecycle

Application state is managed via specialized **React Context Providers** without the overhead of heavy external state libraries:
- `AuthContext`: Centralizes session authentication, token refresh, and user profile state.
- `ToastContext`: Manages transient notification toasts across screens.

### Token Management Strategy
- **Access Token (In-Memory)**: Stored strictly within a module-scoped variable in `frontend/src/api/client.ts`. It is **never** written to `localStorage` or `sessionStorage`, mitigating Cross-Site Scripting (XSS) credential theft.
- **Refresh Token (`localStorage`)**: Persisted in `localStorage` under the key `batanes_refresh_token` to maintain session continuity across browser tabs and reloads.

### Axios Silent Refresh Interceptor
When an API request returns an `HTTP 401 Unauthorized`:
1. The Axios response interceptor intercepts the failure before throwing to the calling component.
2. If a refresh token is present in `localStorage`, the interceptor queues any concurrent outgoing requests.
3. The client calls `/api/v1/auth/refresh` with the stored refresh token.
4. Upon success:
   - Updates the in-memory access token.
   - Replays all queued requests with the updated `Authorization: Bearer` header.
5. If the refresh fails (e.g., expired or revoked):
   - Wipes tokens from memory and storage.
   - Flushes user state to `null`.
   - Re-routes the user to `/login`.

---

## 4. Design System, Design Tokens & Theming

The UI styling marries **Tailwind CSS** with **CSS Custom Properties (HSL)** defined in `frontend/src/index.css`.

All token values are stored as raw HSL components (e.g. `214 89% 52%`) and must be consumed with `hsl(var(--token-name))`.

### Light Mode Tokens (`:root`)

```css
:root {
  /* Brand palette */
  --color-primary: 214 89% 52%;        /* vivid ocean blue */
  --color-primary-dark: 214 89% 42%;
  --color-secondary: 168 76% 42%;      /* Batanes sea teal */
  --color-accent: 35 95% 58%;          /* golden sunrise */

  /* Surfaces — stepped so cards stand out from the page canvas */
  --color-bg: 214 22% 97%;             /* page canvas: near-white with blue tint */
  --color-bg-alt: 214 18% 93%;         /* alternating sections, auth page background */
  --color-surface: 0 0% 100%;          /* cards and panels: pure white */
  --color-surface-hover: 214 20% 98%;  /* hover wash on menu items */
  --color-border: 214 20% 83%;         /* visible card/input borders */
  --color-border-subtle: 214 20% 89%;  /* soft card boundary */

  /* Text — calibrated for readable contrast hierarchy on white surfaces */
  --color-text: 215 25% 12%;           /* primary content (~14:1 on white) */
  --color-text-muted: 215 18% 38%;     /* secondary labels, metadata (~4.6:1) */
  --color-text-faint: 215 12% 52%;     /* helper text, timestamps (~4.1:1) */

  /* Status */
  --color-success: 145 63% 42%;
  --color-warning: 38 95% 55%;
  --color-warning-text: 35 75% 34%;    /* badge text on pale warning bg */
  --color-danger: 3 87% 56%;
  --color-info: 199 89% 48%;
}
```

### Dark Mode Overrides (`[data-theme='dark']`)

```css
[data-theme='dark'] {
  --color-bg: 222 27% 9%;
  --color-bg-alt: 222 25% 12%;
  --color-surface: 222 25% 14%;
  --color-surface-hover: 222 25% 17%;
  --color-border: 222 20% 26%;
  --color-border-subtle: 222 20% 20%;
  --color-text: 210 20% 92%;
  --color-text-muted: 210 14% 64%;
  --color-text-faint: 210 10% 48%;
  --color-warning-text: 35 90% 68%;    /* bright amber — readable on dark bg */
}
```

> [!IMPORTANT]
> Brand palette tokens (`--color-primary`, `--color-secondary`, `--color-accent`, and status tokens) are **not overridden** in Dark Mode. Only surface, border, and text tokens change between themes.

### Theme Toggle Mechanism

Theme switching is controlled by `Navbar.tsx` which sets `document.documentElement.setAttribute('data-theme', 'dark' | 'light')`. The entire theme change occurs via CSS cascade — no JavaScript re-rendering is required.

### Tailwind Integration

`tailwind.config.js` extends Tailwind's color palette with semantic aliases that reference the same CSS custom properties:

```js
colors: {
  app: 'hsl(var(--color-bg))',
  surface: { DEFAULT: 'hsl(var(--color-surface))', muted: 'hsl(var(--color-bg-alt))' },
  brand: { primary: 'hsl(var(--color-primary))', hover: 'hsl(var(--color-primary-dark))' },
  content: { primary: 'hsl(var(--color-text))', secondary: 'hsl(var(--color-text-muted))', muted: 'hsl(var(--color-text-faint))' },
  edge: { subtle: 'hsl(var(--color-border-subtle))', strong: 'hsl(var(--color-border))' },
  feedback: { success, warning, error: '--color-danger', info },
}
```

> [!NOTE]
> The `darkMode` config is set to `['class', '[data-theme="dark"]']`. Tailwind `dark:` variants work correctly but are not required — components use inline `style={{ color: 'hsl(var(--color-*))' }}` to consume tokens directly.

### Typography
- **Headings (`h1`–`h4`)**: `Outfit, sans-serif` (warm, rounded, modern).
- **Body & Controls**: `Inter, system-ui, sans-serif` (clean, highly legible).

### Semantic Utility Classes
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger`: Buttons with hover and active micro-animations.
- `.badge`, `.badge-primary`, `.badge-success`, `.badge-warning`, `.badge-danger`, `.badge-muted`: Skill tags and status indicators. All badge text uses semantic token colors that adapt to the active theme.
- `.card`: Standard container with semantic border, shadow, and background via CSS custom properties. Does **not** use hard-coded Tailwind color utilities.
- `.input`: Form control with focus ring using `var(--color-primary)`.
- `.select`: Extends `.input` for `<select>` elements. Resets the browser-native OS dropdown arrow (`appearance: none`) and injects a custom SVG chevron at the semantic muted-text color — clearly visible in both Light and Dark Mode. **Always combine with `.input` on `<select>` elements:** `className="input select"`.
- `.label`: Semibold field label.
- `.skeleton`: Animated loading placeholder.
- `.glass`: Glassmorphism surface.
- `.gradient-text`: Brand gradient on text.

---

## 5. Frontend Styling Conventions

These rules apply to all theme-sensitive UI work in this codebase:

1. **Use semantic CSS custom properties for all theme-sensitive values.**
   Always write `color: hsl(var(--color-text-muted))` — never hardcode hex, RGB, or raw HSL literals for colors that must change between Light and Dark Mode.

2. **Do not add hard-coded Tailwind color utilities to shared component classes.**
   Classes like `.card`, `.btn`, `.input` must only use semantic tokens. Using `@apply bg-white` or `@apply border-slate-100` inside these classes creates a theme override that cannot be corrected by the token system.

3. **New status/semantic colors belong in `:root` and `[data-theme='dark']`.**
   If a component needs a color for a new state (e.g. a new badge variant), add the appropriate token pair to both the `:root` block and the `[data-theme='dark']` block in `index.css` before using it.

4. **Tailwind extended color utilities must reference actual CSS variable names.**
   When adding Tailwind color aliases in `tailwind.config.js`, verify the CSS variable name exists in `index.css` and wrap the value in `hsl()` since tokens are stored as raw HSL components.

5. **Text on gradient/colored backgrounds is intentionally white.**
   Elements such as the hero section, CTA banner, and dashboard welcome banner use explicit `text-white` — this is correct and should not be changed. The token system applies only to page-level and component-level surfaces.

6. **`--color-warning-text` controls badge-warning and similar amber text.**
   Do not use a raw HSL literal for warning-colored text. Use `hsl(var(--color-warning-text))`, which resolves correctly in both themes.

7. **All `<select>` elements must use `className="input select"`.**
   Browser-native `<select>` widgets render their dropdown arrow using OS system control colors, which are often a muted gray regardless of any `color` or `background` CSS applied. Without `appearance: none`, the arrow appears faint and the control can look disabled. The `.select` class suppresses the native arrow and replaces it with a custom SVG chevron that adapts to the active theme. Do not omit `.select` from any `<select>` element — including those inside hero sections or modal forms.

---

## 5. Key Component Hierarchy

```text
src/
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.tsx     # Role-aware route guard (authentication + role check)
│   ├── forms/
│   │   └── SkillSelector.tsx      # Canonical skill picker with custom-value (Other) support
│   ├── layout/
│   │   ├── Layout.tsx             # App shell (Navbar + Content + Footer)
│   │   ├── Navbar.tsx             # Role-aware navigation bar with theme toggle
│   │   └── Footer.tsx             # Standard footer with platform information
│   └── ui/
│       ├── JobCard.tsx            # Job vacancy card with badges and bookmarking
│       ├── Toast.tsx              # Animated toast alerts (success, error, warning)
│       └── index.tsx              # Barrel exports: Spinner, ProgressBar, PageSpinner, Skeletons
```

---

## 6. Zero-Jargon UI Contract

The frontend strictly enforces a **Zero-Jargon User Interface Contract**:
- Internal technical and architectural terms are **strictly forbidden** from rendering in any user-facing template or string:
  - Prohibited terms include: *FastAPI*, *PostgreSQL*, *SQLAlchemy*, *Alembic*, *Pydantic*, *JWT*, *Bearer*, *Docker*, *SlowAPI*, *CORS*, *RBAC*, *WebSockets*.
- User communications use friendly, plain-English phrasing:
  - Instead of *"Database connection failed"*, the UI displays *"Unable to load listings right now. Please check your internet connection."*
  - Instead of *"JWT token expired"*, the UI displays *"Your session has timed out. Please sign in again."*
- Compliance is verified by an automated test suite (`frontend/src/test/zero_jargon.test.ts`).

---

## 7. Next Steps

- To inspect the server-rendered administrative UI, see [**11-Administrative-UI.md**](./11-Administrative-UI.md).
- To examine application lifecycle and notifications, see [**12-Notifications-and-Applications.md**](./12-Notifications-and-Applications.md).
- For instructions on running frontend tests, see [**14-Testing-and-Quality.md**](./14-Testing-and-Quality.md).
