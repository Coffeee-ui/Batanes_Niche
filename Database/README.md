# Batanes Niche Job Portal - Database Architecture & Migrations

This directory contains database documentation, local SQLite development assets, and raw SQL migration scripts for Supabase PostgreSQL.

---

## 1. Schema Authority & Workflow

- **Prisma Schema (`backend/prisma/schema.prisma`)**: Single source of truth for all application data models, field types, and relationships.
- **Local Development**: Uses SQLite stored in `Database/batanes_niche.db` (gitignored). Zero configuration required.
- **Production Deployment**: Uses **Supabase PostgreSQL** via connection pooling (`DATABASE_URL`, port 6543) and direct connection (`DIRECT_URL`, port 5432).

---

## 2. Directory Contents

```
Database/
├── batanes_niche.db          # Local SQLite development database (gitignored)
├── migrations/
│   ├── 001_initial_schema.sql         # Full PostgreSQL DDL (PostgreSQL 15+ / Supabase)
│   └── 002_seed_production_admin.sql  # Secure platform administrator bootstrap script
└── README.md                          # This documentation
```

---

## 3. Applying Schema to Supabase

You can apply the database schema using either of two methods:

### Method A: Automated via Prisma CLI (Recommended)
From your terminal, set your Supabase `DIRECT_URL` and push the schema directly:
```bash
cd backend
npx prisma db push --schema=prisma/schema.prisma
```

### Method B: Manual via Supabase SQL Editor
1. Log into your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open your project and select **SQL Editor** from the left navigation.
3. Paste the contents of `Database/migrations/001_initial_schema.sql` and click **Run**.
4. Generate a password hash and run `Database/migrations/002_seed_production_admin.sql` to initialize the administrative account.

---

## 4. Connection Pooling Configuration

When deploying on **Render** connecting to **Supabase**:
- **Application Runtime (`DATABASE_URL`)**:
  Connects to Supabase Transaction Mode Pooler (port 6543). Append `?pgbouncer=true`.
  ```
  postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
  ```
- **Schema Management (`DIRECT_URL`)**:
  Connects directly to the PostgreSQL instance (port 5432) for running migrations and schema synchronization.
  ```
  postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
  ```
