import { prisma } from './client';
import { settings } from '../core/config';

const POSTGRES_FORWARD_MIGRATIONS = [
  // 1. users table — extended profile fields
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS desired_employment_type TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS work_experience TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_discoverable BOOLEAN NOT NULL DEFAULT TRUE`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS walkthrough_dismissed BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS language_preference TEXT NOT NULL DEFAULT 'en'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ`,

  // 2. employer_profiles table — extended employer fields
  `ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS industry TEXT`,
  `ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS walkthrough_dismissed BOOLEAN NOT NULL DEFAULT FALSE`,

  // 3. jobs table — extended job fields
  `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS work_arrangement TEXT`,
  `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS street_or_landmark TEXT`,
  `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS multiple_locations TEXT`,
  `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS experience_level TEXT`,
  `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_type TEXT NOT NULL DEFAULT 'range'`,
  `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_period TEXT NOT NULL DEFAULT 'monthly'`,
  `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS benefits TEXT`,
  `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS application_deadline TIMESTAMPTZ`,
  `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS application_questions TEXT`,
  `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS close_option TEXT`,

  // 4. applications table — extended application fields
  `ALTER TABLE applications ADD COLUMN IF NOT EXISTS answers TEXT`,
  `ALTER TABLE applications ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'new'`,
  `ALTER TABLE applications ADD COLUMN IF NOT EXISTS rejection_template TEXT`,
  `ALTER TABLE applications ADD COLUMN IF NOT EXISTS rejection_message TEXT`,
  `ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_date TIMESTAMPTZ`,
  `ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_type TEXT`,
  `ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_location TEXT`,
  `ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_message TEXT`,
  `ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_status TEXT`,
  `ALTER TABLE applications ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMPTZ`,

  // 5. Create new tables
  `CREATE TABLE IF NOT EXISTS followed_employers (
    id          SERIAL PRIMARY KEY,
    seeker_id   INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_followed_employers_seeker_employer UNIQUE (seeker_id, employer_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_followed_employers_seeker_id ON followed_employers(seeker_id)`,
  `CREATE INDEX IF NOT EXISTS idx_followed_employers_employer_id ON followed_employers(employer_id)`,

  `CREATE TABLE IF NOT EXISTS saved_candidates (
    id           SERIAL PRIMARY KEY,
    employer_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    candidate_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_saved_candidates_employer_candidate UNIQUE (employer_id, candidate_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_saved_candidates_employer_id ON saved_candidates(employer_id)`,
  `CREATE INDEX IF NOT EXISTS idx_saved_candidates_candidate_id ON saved_candidates(candidate_id)`,

  `CREATE TABLE IF NOT EXISTS user_reports (
    id          SERIAL PRIMARY KEY,
    reporter_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL,
    target_id   INT NOT NULL,
    reason      TEXT NOT NULL,
    details     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_user_reports_reporter_id ON user_reports(reporter_id)`,
  `CREATE INDEX IF NOT EXISTS idx_user_reports_target ON user_reports(target_type, target_id)`,

  // 6. Partial unique index for active applications
  `CREATE UNIQUE INDEX IF NOT EXISTS uq_active_applications ON applications (job_id, seeker_id) WHERE status NOT IN ('withdrawn', 'rejected')`,

  // 7. Additional performance indexes
  `CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)`,
  `CREATE INDEX IF NOT EXISTS idx_jobs_municipality ON jobs(municipality)`,
  `CREATE INDEX IF NOT EXISTS idx_jobs_title ON jobs(title)`,
  `CREATE INDEX IF NOT EXISTS idx_jobs_status_mun ON jobs(status, municipality)`,
  `CREATE INDEX IF NOT EXISTS idx_jobs_employer_id ON jobs(employer_id)`,
  `CREATE INDEX IF NOT EXISTS idx_applications_job_seeker ON applications(job_id, seeker_id)`,
  `CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id)`,
  `CREATE INDEX IF NOT EXISTS idx_applications_seeker_id ON applications(seeker_id)`,
];

export async function ensurePostgresSchema(): Promise<void> {
  if (settings.DB_PROVIDER !== 'postgresql') {
    return;
  }

  console.log('[Schema Sync] Verifying PostgreSQL database schema compatibility...');
  let successCount = 0;
  for (const statement of POSTGRES_FORWARD_MIGRATIONS) {
    try {
      await prisma.$executeRawUnsafe(statement);
      successCount++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[Schema Sync] Warning on statement: ${msg.split('\n')[0]}`);
    }
  }
  console.log(`[Schema Sync] Schema compatibility verified (${successCount}/${POSTGRES_FORWARD_MIGRATIONS.length} operations confirmed).`);
}
