# 24. PNPM Monorepo Migration Guide

> [!IMPORTANT]
> The repository has been migrated from standalone `npm` installations to a unified **pnpm workspace** (`pnpm@12.4.2`). This document records the architecture decisions, workspace layout, configuration settings, and developer workflows.

---

## 1. Executive Summary

| Attribute | Prior Configuration (`npm`) | New Configuration (`pnpm`) |
| :--- | :--- | :--- |
| **Package Manager** | `npm` 10.x | `pnpm` 12.4.2 |
| **Repository Structure** | Two unlinked standalone directories (`backend-ts/`, `frontend/`) | Coordinated **pnpm workspace** with root orchestration |
| **Lockfiles** | `backend-ts/package-lock.json`, `frontend/package-lock.json` | Single root `pnpm-lock.yaml` (v9 format) |
| **Workspace Manifest** | None | [`pnpm-workspace.yaml`](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/pnpm-workspace.yaml) |
| **Node Modules Architecture** | Flat, unisolated `node_modules` susceptible to phantom dependencies | Content-addressable hard links + strict isolated virtual store (`node_modules/.pnpm`) |
| **Disk Space Efficiency** | Duplicate packages duplicated across packages | Deduplicated via shared content-addressable store |

---

## 2. Workspace Architecture

The workspace is defined in `pnpm-workspace.yaml`:
```yaml
packages:
  - 'backend-ts'
  - 'frontend'
```

### 2.1 Workspace Member Packages
1. **`batanes-niche-backend-ts`** ([`backend-ts/package.json`](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/backend-ts/package.json)):
   - Express.js + Prisma ORM + TypeScript backend.
   - Built dependencies approved: `@prisma/client`, `@prisma/engines`, `prisma`.
2. **`batanes-niche-frontend`** ([`frontend/package.json`](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/frontend/package.json)):
   - React 18 + Vite + Tailwind CSS SPA.
   - Built dependencies approved: `esbuild`.

---

## 3. Configuration Details

### 3.1 Root `.npmrc`
```ini
# pnpm workspace configuration
shamefully-hoist=false
auto-install-peers=true
public-hoist-pattern[]=*prisma*
public-hoist-pattern[]=@prisma/*

only-built-dependencies[]=@prisma/client
only-built-dependencies[]=@prisma/engines
only-built-dependencies[]=prisma
only-built-dependencies[]=esbuild
```

**Key Rationale**:
- `shamefully-hoist=false`: Preserves pnpm's strict isolation, guaranteeing no phantom dependencies can leak.
- `public-hoist-pattern[]=*prisma*`: Ensures Prisma engine binaries and client generators resolve reliably without path breakages across the monorepo.
- `only-built-dependencies`: In pnpm v12+, build scripts (lifecycle postinstall scripts) are blocked by default for supply-chain security. Explicitly whitelisting Prisma and ESBuild allows unattended CI and Docker builds to succeed deterministically.

---

## 4. Root Orchestration Scripts

From the repository root, developers can orchestrate services using:

```bash
# Install all dependencies across all packages:
pnpm install

# Start backend-ts development server:
pnpm dev:backend

# Start frontend development server:
pnpm dev:frontend

# Build all packages:
pnpm build

# Run type checking across packages:
pnpm typecheck

# Run frontend tests:
pnpm test
```

---

## 5. Dockerfile Integration

Both production Dockerfiles have been updated for pnpm:
- [`docker/frontend.Dockerfile`](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/docker/frontend.Dockerfile): Uses `corepack enable && corepack prepare pnpm@12.4.2 --activate` with `pnpm --filter batanes-niche-frontend install --frozen-lockfile`.
- [`docker/backend-ts.Dockerfile`](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/docker/backend-ts.Dockerfile): Multi-stage container generating Prisma client and compiling TypeScript with `pnpm --prod deploy`.

---

## 6. Verification Status

| Step | Command | Result |
| :--- | :--- | :--- |
| **Clean Install** | `pnpm install` | **Passed** (0 warnings, 0 prompt blocks) |
| **Prisma Generation** | `pnpm --filter batanes-niche-backend-ts prisma:generate` | **Passed** (Generated Prisma Client v5.22.0 in 85ms) |
| **Backend Type Check** | `pnpm --filter batanes-niche-backend-ts typecheck` | **Passed** (Exit code 0, 0 TypeScript errors) |
| **Backend Compilation** | `pnpm --filter batanes-niche-backend-ts build` | **Passed** (`dist/main.js` compiled cleanly) |
| **Frontend Compilation** | `pnpm --filter batanes-niche-frontend build` | **Passed** (1589 modules transformed, dist/ built cleanly) |
| **Zero-Jargon Audit** | `pnpm --filter batanes-niche-frontend exec vitest run src/test/zero_jargon.test.ts` | **Passed** (100% compliance) |
