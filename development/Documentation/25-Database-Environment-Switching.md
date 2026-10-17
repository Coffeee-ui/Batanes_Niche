# 25 — Database Environment Switching

> **Scope**: TypeScript backend (`backend-ts/`) + Python backend (`backend/`).
> Both backends read the same `.env` variables; only the TypeScript backend performs Prisma schema synchronization automatically.

---

## Overview

The database layer is **environment-switchable** — no code changes are ever needed to move between SQLite and PostgreSQL. The active database is controlled entirely through `.env`.

| Mode | Provider | Typical Use |
|---|---|---|
| Development (default) | SQLite | Local development, zero setup, no external service |
| Production simulation | PostgreSQL / Supabase | Staging, production, or local Docker Compose |

---

## Architecture

```
.env (DB_PROVIDER + DATABASE_URL)
        │
        ▼
syncProvider.ts          ← runs before dev / db:push / db:seed
  - reads DB_PROVIDER (or infers from DATABASE_URL protocol)
  - rewrites prisma/schema.prisma datasource provider
  - runs `prisma generate` to regenerate the Prisma Client
        │
        ▼
client.ts (PrismaClient)
  - health probe on startup ($queryRaw SELECT 1)
  - pool settings from DB_POOL_MIN / DB_POOL_MAX / DB_TIMEOUT_SEC
  - SSL from DB_SSL
  - graceful disconnect on SIGINT / SIGTERM
        │
        ▼
main.ts
  - GET /ready → { status, database, provider, latencyMs }
  - GET /health → { status, app, version, timestamp }
```

For the Python backend, `session.py` reads the same `.env` and selects the correct SQLAlchemy engine factory:

```
.env (DATABASE_URL)
        │
        ▼
session.py (create_engine)
  - postgresql:// → QueuePool + SSL for Supabase
  - sqlite:///    → StaticPool + PRAGMA foreign_keys = ON
```

---

## Configuration Reference

All variables live in `.env` (root) and/or `backend-ts/.env`.

### Required

| Variable | SQLite example | PostgreSQL example |
|---|---|---|
| `DB_PROVIDER` | `sqlite` | `postgres` |
| `DATABASE_URL` | `file:../../Database/batanes_niche.db` | `postgresql://user:pass@host:6543/db?pgbouncer=true` |

### PostgreSQL / Supabase only

| Variable | Purpose | Default |
|---|---|---|
| `DIRECT_URL` | Direct connection URL for `prisma db push` (bypasses PgBouncer) | — |
| `DB_SSL` | Enable SSL (`true` / `false`) | `true` when provider is `postgres` |
| `DB_POOL_MIN` | Minimum pool connections | `2` |
| `DB_POOL_MAX` | Maximum pool connections | `10` |
| `DB_TIMEOUT_SEC` | Connection timeout in seconds | `30` |

> **Why two URLs for Supabase?**
> Supabase uses PgBouncer as a transaction-mode pooler on port 6543. Prisma schema push requires a session-mode direct connection (port 5432). `DATABASE_URL` goes to the pooler (used at runtime); `DIRECT_URL` goes directly (used by `prisma db push` only).

---

## Switching Databases

### → SQLite (default)

```env
# backend-ts/.env
DB_PROVIDER=sqlite
DATABASE_URL="file:../../Database/batanes_niche.db"
```

```cmd
:: From project root — first run
pnpm --filter batanes-niche-backend-ts db:migrate

:: Subsequent runs — just start
start-ts.bat
```

Verify: `GET http://localhost:8000/ready`
```json
{ "status": "ready", "database": "connected", "provider": "sqlite", "latencyMs": 12 }
```

---

### → PostgreSQL / Supabase

#### Step 1 — Update `backend-ts/.env`

```env
DB_PROVIDER=postgres

# Supabase Transaction Pooler (runtime):
DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Direct Connection (schema push only):
DIRECT_URL="postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

For a **local Docker Postgres** instead:
```env
DB_PROVIDER=postgres
DATABASE_URL="postgresql://batanes_user:change_me@localhost:5432/batanes_niche"
DB_SSL=false
```

#### Step 2 — Push schema and seed

```cmd
cd backend-ts
pnpm db:migrate
```

This runs in sequence:
1. `syncProvider.ts` detects `DB_PROVIDER=postgres`, updates `schema.prisma`, regenerates Prisma Client
2. `prisma db push` creates/updates tables on the target database
3. `seed.ts` inserts admin, demo employer, demo job seeker, and sample jobs (idempotent)

#### Step 3 — Start

```cmd
pnpm dev
```

Verify: `GET http://localhost:8000/ready`
```json
{ "status": "ready", "database": "connected", "provider": "postgresql", "latencyMs": 43 }
```

---

## Database Scripts Reference

Run from `backend-ts/` or via root workspace (`pnpm --filter batanes-niche-backend-ts <script>`):

| Script | Command | Description |
|---|---|---|
| `db:setup` | `ts-node development/scripts/init-db.ts` | 1-command complete initialization: creates SQLite DB, pushes schema, seeds data |
| `db:sync` | `ts-node src/database/syncProvider.ts` | Sync `schema.prisma` provider, regenerate client |
| `db:push` | `db:sync && prisma db push` | Sync + push schema to active database |
| `db:seed` | `ts-node development/scripts/init-db.ts --seed-only` | Idempotent baseline + sample data seed |
| `db:migrate` | Alias for `db:setup` | Full first-run or post-switch setup |
| `db:reset` | `ts-node development/scripts/init-db.ts --reset` | Drop all data, recreate tables, re-seed (dev only) |
| `init-db.bat` | `development\scripts\init-db.bat` | Windows batch 1-click database setup |

---

## `syncProvider.ts` — How It Works

**File**: `backend-ts/src/database/syncProvider.ts`

1. Reads `DB_PROVIDER` from `process.env`. If unset, infers from `DATABASE_URL` protocol:
   - `postgresql://` or `postgres://` → `postgres`
   - `file:` → `sqlite`
2. Reads `prisma/schema.prisma`, locates the `datasource db { ... }` block.
3. Replaces `provider = "..."` with the correct value (`"sqlite"` or `"postgresql"`).
4. If `DIRECT_URL` is set and provider is `postgresql`, injects `directUrl = env("DIRECT_URL")` into the datasource block.
5. Writes the modified schema back to disk.
6. Spawns `prisma generate` to regenerate the Prisma Client for the new provider.

> `syncProvider.ts` is non-destructive — it only modifies the `provider` and `directUrl` lines inside the datasource block, leaving all models untouched.

---

## `seed.ts` — Idempotent Seed

**File**: `backend-ts/src/database/seed.ts`

Seeds the following canonical records (skips any that already exist by username/email):

| Record | Role | Username |
|---|---|---|
| Platform Administrator | `admin` | `admin` |
| Batanes Seaside Inn & Tours | `employer` | `batanes_inn` |
| Juan Abad | `job_seeker` | `ivatan_guide` |

Also seeds a small set of sample job postings linked to the demo employer. Safe to run repeatedly — existing records are never overwritten.

---

## `reset.ts` — Development Reset

**File**: `backend-ts/src/database/reset.ts`

- Refuses to run if `NODE_ENV=production` (exits with a non-zero code and an error message).
- Deletes all rows from all tables in dependency order.
- Calls `seed.ts` to restore the canonical demo state.

Use when you need a clean slate locally:
```cmd
pnpm db:reset
```

---

## Python Backend (`backend/`)

The Python/FastAPI backend uses SQLAlchemy and reads the same `DATABASE_URL`.

**File**: `backend/app/database/session.py`

| Provider | Engine Config |
|---|---|
| `postgresql://` | `QueuePool`, `pool_pre_ping=True`, SSL args for Supabase (`?sslmode=require`) |
| `sqlite:///` | `StaticPool`, `check_same_thread=False`, `PRAGMA foreign_keys = ON` via event listener |

**File**: `backend/app/core/config.py` — additional fields:

| Variable | Type | Default |
|---|---|---|
| `DB_PROVIDER` | `str` | inferred from `DATABASE_URL` |
| `DB_POOL_MIN` | `int` | `2` |
| `DB_POOL_MAX` | `int` | `10` |
| `DB_TIMEOUT_SEC` | `int` | `30` |
| `DB_SSL` | `bool` | `True` (PostgreSQL) |

---

## Health & Readiness Probes

| Endpoint | Description |
|---|---|
| `GET /health` | Always returns `200 OK` — liveness only |
| `GET /ready` | Performs a live `SELECT 1` and returns DB status and provider |

Example `/ready` response:
```json
{
  "status": "ready",
  "database": "connected",
  "provider": "sqlite",
  "latencyMs": 12
}
```

If the database is unreachable, `/ready` returns `503 Service Unavailable`.

---

## Notes & Caveats

- **Admin sessions are not portable** across backends (FastAPI vs TypeScript) or across database switches — re-login at `/admin` after any switch.
- **`prisma db push` is not `migrate`** — it applies schema changes directly without a migration history. For a production migration history use `prisma migrate deploy` (requires `DIRECT_URL`).
- **SQLite does not enforce foreign keys by default** — `session.py` enables them via `PRAGMA foreign_keys = ON` on every connection.
- **`schema.prisma` is modified in place** by `syncProvider.ts` — commit the file after switching if you intend to share the provider setting with your team via version control.
