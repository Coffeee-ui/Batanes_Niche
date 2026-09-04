# 10 - Frontend Architecture

## 1. Technology Stack & Tooling

The frontend of the **Batanes Niche Job Portal** is implemented as a modern, high-performance Single Page Application (SPA).

| Tool / Technology | Version | Purpose |
|---|---|---|
| **React** | `18.3.x` | Declarative component UI library |
| **Vite** | `5.3.x` | Development server, HMR, and production bundler |
| **TypeScript** | `5.5.x` | Static type safety across components and API models |
| **Tailwind CSS** | `3.4.x` | Utility-first styling integrated with CSS design tokens |
| **Axios** | `1.7.x` | HTTP client with request/response interceptors |
| **React Router** | `6.24.x` | Declarative client-side routing and protected route guards |
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

### HSL Color Palette

```css
:root {
  /* Brand palette */
  --color-primary: 214 89% 52%;        /* vivid ocean blue */
  --color-primary-dark: 214 89% 42%;
  --color-secondary: 168 76% 42%;      /* Batanes sea teal */
  --color-accent: 35 95% 58%;          /* golden sunrise */

  /* Surfaces (Light Theme) */
  --color-bg: 210 20% 98%;
  --color-surface: 0 0% 100%;
  --color-border: 214 20% 88%;
  --color-text: 215 25% 12%;
  --color-text-muted: 215 15% 45%;
}

/* Dark Theme */
[data-theme='dark'] {
  --color-bg: 222 27% 9%;
  --color-surface: 222 25% 14%;
  --color-border: 222 20% 22%;
  --color-text: 210 20% 92%;
  --color-text-muted: 210 12% 60%;
}
```

### Typography
- **Headings (`h1`, `h2`, `h3`, `h4`)**: `Outfit, sans-serif` (Warm, rounded, modern typography).
- **Body & Controls**: `Inter, system-ui, sans-serif` (Clean, highly legible interface font).

### Semantic Utility Classes
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-outline`: Buttons with hover and active micro-animations.
- `.badge`, `.badge-primary`, `.badge-success`: Skill tags and status indicators.
- `.card`: Standard container with border, subtle shadow, and responsive padding.
- `.input`: Form control with standard focus rings using `var(--color-primary)`.

---

## 5. Key Component Hierarchy

```text
src/
├── components/
│   ├── layout/
│   │   ├── Layout.tsx          # App shell (Navbar + Content + Footer)
│   │   ├── Navbar.tsx          # Role-aware navigation bar with theme toggle
│   │   └── Footer.tsx          # Standard footer with platform information
│   ├── jobs/
│   │   ├── JobCard.tsx         # Job vacancy card with badges and bookmarking
│   │   ├── JobFilterBar.tsx    # Multi-facet filters (location, salary, type)
│   │   └── JobForm.tsx         # Reusable creation and edit form for vacancies
│   ├── common/
│   │   ├── Badge.tsx           # Semantic status and skill chips
│   │   ├── Card.tsx            # Card wrapper with theme support
│   │   ├── Modal.tsx           # Accessible dialog backdrop and focus trap
│   │   └── Spinner.tsx         # Circular loading indicator
│   ├── feedback/
│   │   ├── EmptyState.tsx      # Friendly empty illustration and CTA
│   │   └── LoadingSpinner.tsx  # Full-page and section loading indicator
│   └── ui/
│       └── Toast.tsx           # Animated toast alerts (success, error, warning)
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
