-- Migration 004: Create stored_files table for persistent avatar and CV storage
-- This table stores binary data (BYTEA) directly in Supabase PostgreSQL,
-- ensuring that uploaded profile pictures and resumes persist across
-- Render container restarts, redeployments, and sleeping cycles.

CREATE TABLE IF NOT EXISTS "stored_files" (
  "id" TEXT PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "file_type" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "content_type" TEXT NOT NULL,
  "file_size" INTEGER NOT NULL,
  "data" BYTEA NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_stored_files_user_id_file_type" ON "stored_files"("user_id", "file_type");
