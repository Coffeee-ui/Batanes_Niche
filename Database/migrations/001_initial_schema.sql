-- ==============================================================================
-- Batanes Niche Job Portal - Supabase / PostgreSQL Initial Schema
-- Migration: 001_initial_schema.sql
-- Compatible with PostgreSQL 15+ / Supabase PostgreSQL
-- Source of Truth: backend/prisma/schema.prisma
-- Last updated: synced with Prisma schema (November 2026 implementation)
-- NOTE: This file is a PostgreSQL/Supabase production initialization reference.
--       It is NOT the migration mechanism — Prisma migrations handle local/dev changes.
-- ==============================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id                       SERIAL PRIMARY KEY,
    username                 TEXT NOT NULL UNIQUE,
    email                    TEXT NOT NULL UNIQUE,
    password_hash            TEXT NOT NULL,
    full_name                TEXT NOT NULL,
    phone_number             TEXT,
    municipality             TEXT NOT NULL,
    barangay                 TEXT,
    skills                   TEXT,
    profile_pic              TEXT,
    resume_url               TEXT,
    role                     TEXT NOT NULL,
    account_status           TEXT NOT NULL,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Extended profile fields
    date_of_birth            TEXT,
    desired_employment_type  TEXT,
    work_experience          TEXT,
    is_discoverable          BOOLEAN NOT NULL DEFAULT TRUE,
    onboarding_completed     BOOLEAN NOT NULL DEFAULT FALSE,
    walkthrough_dismissed    BOOLEAN NOT NULL DEFAULT FALSE,
    notification_preferences TEXT,
    language_preference      TEXT NOT NULL DEFAULT 'en',
    deactivated_at           TIMESTAMPTZ,
    deletion_requested_at    TIMESTAMPTZ
);

-- 2. Employer Profiles Table
CREATE TABLE IF NOT EXISTS employer_profiles (
    user_id               INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    company_name          TEXT NOT NULL,
    company_address       TEXT NOT NULL,
    company_description   TEXT,
    business_type         TEXT NOT NULL,
    industry              TEXT,
    onboarding_completed  BOOLEAN NOT NULL DEFAULT FALSE,
    walkthrough_dismissed BOOLEAN NOT NULL DEFAULT FALSE
);

-- 3. Job Seeker Profiles Table
CREATE TABLE IF NOT EXISTS job_seeker_profiles (
    user_id          INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    bio              TEXT,
    education        TEXT,
    experience_years INT NOT NULL DEFAULT 0
);

-- 4. Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
    id                    SERIAL PRIMARY KEY,
    employer_id           INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title                 TEXT NOT NULL,
    description           TEXT NOT NULL,
    municipality          TEXT NOT NULL,
    barangay              TEXT,
    salary_min            DECIMAL(12, 2) NOT NULL,
    salary_max            DECIMAL(12, 2) NOT NULL,
    employment_type       TEXT NOT NULL,
    required_skills       TEXT NOT NULL,
    status                TEXT NOT NULL DEFAULT 'active',
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at            TIMESTAMPTZ,

    -- Extended job fields
    work_arrangement      TEXT,
    street_or_landmark    TEXT,
    multiple_locations    TEXT,
    experience_level      TEXT,
    salary_type           TEXT NOT NULL DEFAULT 'range',
    salary_period         TEXT NOT NULL DEFAULT 'monthly',
    benefits              TEXT,
    application_deadline  TIMESTAMPTZ,
    application_questions TEXT,
    is_featured           BOOLEAN NOT NULL DEFAULT FALSE,
    close_option          TEXT
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_municipality ON jobs(municipality);
CREATE INDEX IF NOT EXISTS idx_jobs_title ON jobs(title);
CREATE INDEX IF NOT EXISTS idx_jobs_status_municipality ON jobs(status, municipality);
CREATE INDEX IF NOT EXISTS idx_jobs_employer_id ON jobs(employer_id);

-- 5. Applications Table
CREATE TABLE IF NOT EXISTS applications (
    id                   SERIAL PRIMARY KEY,
    job_id               INT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    seeker_id            INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cover_letter         TEXT,
    resume_url           TEXT,
    status               TEXT NOT NULL DEFAULT 'new',
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Extended application fields
    answers              TEXT,
    stage                TEXT DEFAULT 'new',
    rejection_template   TEXT,
    rejection_message    TEXT,
    interview_date       TIMESTAMPTZ,
    interview_type       TEXT,
    interview_location   TEXT,
    interview_message    TEXT,
    interview_status     TEXT,
    withdrawn_at         TIMESTAMPTZ
);

-- Partial unique index ensures only one active (non-withdrawn, non-rejected) application per seeker per job,
-- allowing reapplication after withdrawal or rejection while preserving application history.
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_applications ON applications (job_id, seeker_id) WHERE status NOT IN ('withdrawn', 'rejected');

CREATE INDEX IF NOT EXISTS idx_applications_job_seeker ON applications(job_id, seeker_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_seeker_id ON applications(seeker_id);

-- 6. Saved Jobs (Bookmarks) Table
CREATE TABLE IF NOT EXISTS saved_jobs (
    id        SERIAL PRIMARY KEY,
    seeker_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id    INT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    saved_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_saved_jobs_seeker_job UNIQUE (seeker_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_jobs_seeker_id ON saved_jobs(seeker_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_id ON saved_jobs(job_id);

-- 7. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id         SERIAL PRIMARY KEY,
    user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      TEXT NOT NULL,
    message    TEXT NOT NULL,
    type       TEXT NOT NULL,
    is_read    BOOLEAN NOT NULL DEFAULT FALSE,
    link       TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- 8. Refresh Tokens Table (JWT session rotation & compromise detection)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         SERIAL PRIMARY KEY,
    user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- 9. Revoked Tokens Table (Access token JTI denylist on logout)
CREATE TABLE IF NOT EXISTS revoked_tokens (
    id         SERIAL PRIMARY KEY,
    token_jti  TEXT NOT NULL UNIQUE,
    revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- 10. Password Reset Tokens Table (6-digit OTP delivery)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id             SERIAL PRIMARY KEY,
    user_id        INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    identifier     TEXT NOT NULL,
    otp_hash       TEXT NOT NULL,
    expires_at     TIMESTAMPTZ NOT NULL,
    used           BOOLEAN NOT NULL DEFAULT FALSE,
    attempts_count INT NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_identifier ON password_reset_tokens(identifier);

-- 11. Error Reports Table (Platform error logging)
CREATE TABLE IF NOT EXISTS error_reports (
    id            SERIAL PRIMARY KEY,
    timestamp     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    username      TEXT,
    endpoint      TEXT,
    error_message TEXT NOT NULL,
    stack_trace   TEXT,
    request_data  TEXT
);

CREATE INDEX IF NOT EXISTS idx_error_reports_timestamp ON error_reports(timestamp);

-- 12. Audit Logs Table (Administrative audit trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id          SERIAL PRIMARY KEY,
    timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actor_id    INT REFERENCES users(id) ON DELETE SET NULL,
    actor_role  TEXT NOT NULL,
    ip_address  TEXT,
    action      TEXT NOT NULL,
    target_type TEXT,
    target_id   INT,
    details     TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- 13. Followed Employers Table (Seeker follows an employer)
CREATE TABLE IF NOT EXISTS followed_employers (
    id          SERIAL PRIMARY KEY,
    seeker_id   INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_followed_employers_seeker_employer UNIQUE (seeker_id, employer_id)
);

CREATE INDEX IF NOT EXISTS idx_followed_employers_seeker_id ON followed_employers(seeker_id);
CREATE INDEX IF NOT EXISTS idx_followed_employers_employer_id ON followed_employers(employer_id);

-- 14. Saved Candidates Table (Employer saves a job seeker)
CREATE TABLE IF NOT EXISTS saved_candidates (
    id           SERIAL PRIMARY KEY,
    employer_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    candidate_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_saved_candidates_employer_candidate UNIQUE (employer_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_candidates_employer_id ON saved_candidates(employer_id);
CREATE INDEX IF NOT EXISTS idx_saved_candidates_candidate_id ON saved_candidates(candidate_id);

-- 15. User Reports Table (User reports content / another user)
CREATE TABLE IF NOT EXISTS user_reports (
    id          SERIAL PRIMARY KEY,
    reporter_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL,
    target_id   INT NOT NULL,
    reason      TEXT NOT NULL,
    details     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_reports_reporter_id ON user_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_target ON user_reports(target_type, target_id);
