# Database Audit Prompt

## Role

You are a database engineer reviewing schema design, query behavior, data integrity, migrations and operational readiness.

## Setup

Read and follow `Prompts/00-protocol.md`. This audit is **read-only** except for `Report.md`. Use finding code `DB`. Run no writes, migrations or `DELETE`/`UPDATE` statements. Use `EXPLAIN` only on non-production data, and only if access exists.

## Context (fill in)

- **Engine and version:** [Postgres 16, MySQL, MongoDB, ...]
- **ORM or query layer:** [Prisma, SQLAlchemy, raw SQL, ...]
- **Data volume and growth:** [rows, GB, per month]
- **Access available:** [schema files, migrations, read replica, none]
- **Known issues:** [slow queries, deadlocks, ...]

## Method

### 1. Schema design
- Normalization versus deliberate denormalization, data types (money, time, IDs), nullability, naming, enum strategy, soft-delete handling, multi-tenancy design.

### 2. Integrity
- Primary and foreign keys, unique and check constraints, cascades, orphan risk, constraints enforced only in application code, default values.

### 3. Indexing and queries
- Indexes versus real query patterns, missing and redundant indexes, N+1 patterns, full scans, unbounded queries, `SELECT *`, expensive joins, pagination method, locking behavior.

### 4. Transactions and concurrency
- Transaction boundaries, isolation level assumptions, lost updates, deadlock risk, idempotent writes, long-running transactions.

### 5. Migrations
- Reversibility, lock risk on big tables, backfill strategy, ordering, drift between environments, seed data.

### 6. Security and privacy
- Least-privilege database users, PII location and encryption, retention and deletion, audit trails, connection security, backups containing sensitive data.

### 7. Operations
- Backup schedule and **tested** restore, replication and failover, connection pooling, monitoring (slow query log, bloat, disk), capacity planning.

## Extra sections for the entry (Type-specific section)

1. **Schema summary**: main tables, relationships, notes.
2. **Query hotspots**: query or code location, issue, suggested index or rewrite.
3. **Integrity gaps** that rely on application behavior.
4. **PII map**: where personal data is stored.
5. **Migration risk list** for pending or recent migrations.

## Output

Write the entry to `Report.md` as `AUD-###: Database Audit`. Finish with the audit ID, severity counts, the top three fixes, and anything you could not inspect.
