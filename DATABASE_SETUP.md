# Supabase PostgreSQL Database Setup & Operations Guide

This guide details the complete database configuration, schema deployment, connection pooling, and maintenance procedures for the **Batanes Niche Job Portal** using **Supabase PostgreSQL**.

---

## 1. Supabase Architecture & Connection Strategy

The application uses **Prisma ORM (v5.15+)** with two distinct connection channels to Supabase:

```
                   +-----------------------------------------------+
                   |             RENDER BACKEND API                |
                   +-----------------------------------------------+
                       /                                       \
           Runtime App Traffic                           Schema Operations
         (Queries, Transactions)                        (Push, Migrations)
                     /                                           \
                    v                                             v
        +-----------------------+                     +-----------------------+
        |  TRANSACTION POOLER   |                     |   DIRECT CONNECTION   |
        |  Port: 6543           |                     |   Port: 5432          |
        |  pgbouncer=true       |                     |   Full DDL support    |
        +-----------------------+                     +-----------------------+
                    \                                             /
                     \                                           /
                      v                                         v
                   +-----------------------------------------------+
                   |            SUPABASE POSTGRESQL 15+            |
                   |               (Primary Database)              |
                   +-----------------------------------------------+
```

### Connection Strings Overview

1. **`DATABASE_URL` (Runtime Application Connection)**:
   - Connects to Supabase's transaction pooler (PgBouncer) on port `6543`.
   - Reuses connections efficiently across serverless/container instances without exhausting connection limits.
   - **Must include** `?pgbouncer=true` parameter:
     ```text
     postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
     ```

2. **`DIRECT_URL` (Schema Management & DDL Operations)**:
   - Connects directly to the PostgreSQL engine on port `5432`.
   - Required by Prisma because DDL operations (`CREATE TABLE`, `ALTER TABLE`, `CREATE INDEX`) and schema reflection cannot run through a transaction-mode connection pooler:
     ```text
     postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
     ```

---

## 2. Step-by-Step Initial Setup

### Step 2.1: Provision Supabase Instance
1. Create an account at [supabase.com](https://supabase.com).
2. Click **New Project** and name it `batanes-niche-prod`.
3. Set a strong master database password (minimum 20 characters).
4. Select `Singapore (ap-southeast-1)` or `Tokyo (ap-northeast-1)` as the region.
5. Once provisioned, navigate to **Project Settings -> Database** to copy your pooled and direct URIs.

### Step 2.2: Apply Database Schema

#### Option 1: Using Prisma CLI (Recommended)
Set the Supabase direct connection URL in your terminal and execute:
```bash
cd backend
npx prisma db push --schema=prisma/schema.prisma
```
Prisma will connect to Supabase, create all 12 tables, apply composite unique constraints, and build all indexes in under 10 seconds.

#### Option 2: Using the Supabase SQL Editor
1. In the Supabase Dashboard, open **SQL Editor**.
2. Open [001_initial_schema.sql](./Database/migrations/001_initial_schema.sql) from the repository.
3. Paste the complete SQL and click **Run**.
4. Confirm success: 12 tables will appear under **Database -> Tables**.

---

## 3. Production Data Seeding & Bootstrap

In production, test data (mock job postings and candidate records) **must never be inserted**. Only the platform administrator account should be seeded.

### Method 1: Automated Script
Run the initialization script with production flags:
```bash
ENVIRONMENT=production \
DATABASE_URL="<YOUR_SUPABASE_POOLED_URL>" \
DIRECT_URL="<YOUR_SUPABASE_DIRECT_URL>" \
ADMIN_INITIAL_EMAIL="admin@yourdomain.ph" \
ADMIN_INITIAL_PASSWORD="YourStrongPassword123!" \
pnpm db:setup
```
The script will:
- Validate that `ENVIRONMENT=production`.
- Verify the connection to Supabase.
- Seed the baseline administrator account.
- **Automatically skip sample data seeding** (`seedSampleData`), leaving the job and candidate directory clean for real users.

### Method 2: Manual SQL Seed
Execute `Database/migrations/002_seed_production_admin.sql` in the Supabase SQL Editor after generating a bcrypt hash:
```bash
node -e "console.log(require('bcryptjs').hashSync('YourStrongPassword123!', 12));"
```

---

## 4. Database Schema Structure & Indexes

| Table Name | Primary Key | Key Foreign Keys | Key Indexes | Purpose |
|---|---|---|---|---|
| `users` | `id` (Serial) | None | `username` (UQ), `email` (UQ) | Platform accounts (job seekers, employers, admin) |
| `employer_profiles` | `user_id` | `user_id` -> `users(id)` ON DELETE CASCADE | Primary key | Enterprise details, company name, business type |
| `job_seeker_profiles` | `user_id` | `user_id` -> `users(id)` ON DELETE CASCADE | Primary key | Bio, education, years of experience |
| `jobs` | `id` (Serial) | `employer_id` -> `users(id)` ON DELETE CASCADE | `status`, `municipality`, `title`, `(status, municipality)`, `employer_id` | Job postings, requirements, compensation |
| `applications` | `id` (Serial) | `job_id` -> `jobs(id)`, `seeker_id` -> `users(id)` | `job_id`, `seeker_id`, `(job_id, seeker_id)` (UQ) | Job applications, cover letters, status lifecycle |
| `saved_jobs` | `id` (Serial) | `job_id` -> `jobs(id)`, `seeker_id` -> `users(id)` | `job_id`, `seeker_id`, `(seeker_id, job_id)` (UQ) | Bookmarked job postings |
| `notifications` | `id` (Serial) | `user_id` -> `users(id)` ON DELETE CASCADE | `user_id`, `is_read` | User notification inbox and unread counts |
| `refresh_tokens` | `id` (Serial) | `user_id` -> `users(id)` ON DELETE CASCADE | `token_hash` (UQ), `user_id` | JWT refresh tokens with rotation & revocation tracking |
| `revoked_tokens` | `id` (Serial) | None | `token_jti` (UQ) | Access token JTI denylist on explicit logout |
| `password_reset_tokens`| `id` (Serial) | `user_id` -> `users(id)` ON DELETE CASCADE | `user_id`, `identifier` | 6-digit bcrypt-hashed OTPs with 15-minute expiry |
| `error_reports` | `id` (Serial) | None | `timestamp` | Platform error logs with sanitized request data |
| `audit_logs` | `id` (Serial) | `actor_id` -> `users(id)` ON DELETE SET NULL | `actor_id`, `timestamp` | Security events and administrative audit trail |

---

## 5. Backup, Disaster Recovery & Maintenance

### 5.1 Automated Supabase Backups
- Supabase automatically executes daily physical database backups.
- On Supabase Pro, **Point-in-Time Recovery (PITR)** enables restoring database state to any specific second within the retention window (up to 7–30 days).

### 5.2 Manual Logical Backup (`pg_dump`)
To take an immediate offsite snapshot of your production data:
```bash
# Export compressed PostgreSQL dump
pg_dump "postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres" \
  --format=custom \
  --file=batanes_niche_backup_$(date +%Y%m%d_%H%M%S).dump
```

### 5.3 Disaster Recovery Restoration
To restore a snapshot into a clean Supabase database:
```bash
pg_restore --clean --if-exists \
  --dbname="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres" \
  batanes_niche_backup_20261118_120000.dump
```
