-- ==============================================================================
-- Batanes Niche Job Portal - Initial Production Platform Administrator
-- Migration: 002_seed_production_admin.sql
-- Run in Supabase SQL Editor AFTER 001_initial_schema.sql (or prisma db push)
-- ==============================================================================
--
-- INSTRUCTIONS FOR SYSTEM ADMINISTRATOR:
-- 1. Generate a strong bcrypt hash (cost factor 12) for your production administrator password.
--    You can run this quick command in your terminal using Node.js:
--
--      node -e "console.log(require('bcryptjs').hashSync('YOUR_ACTUAL_SECURE_PASSWORD', 12));"
--
-- 2. Replace '<PASTE_BCRYPT_HASH_HERE>' below with the generated hash.
-- 3. Replace 'admin@batanesniche.ph' with your real administrator email.
-- 4. Execute this query in the Supabase Dashboard -> SQL Editor.
-- ==============================================================================

INSERT INTO users (
    username,
    email,
    password_hash,
    full_name,
    phone_number,
    municipality,
    barangay,
    skills,
    role,
    account_status,
    created_at
)
VALUES (
    'admin',
    'admin@batanesniche.ph',
    '<PASTE_BCRYPT_HASH_HERE>',
    'Platform Administrator',
    NULL,
    'Basco',
    'San Antonio',
    NULL,
    'admin',
    'active',
    NOW()
)
ON CONFLICT (username) DO NOTHING;

-- Record audit log entry for administrator initialization
INSERT INTO audit_logs (
    timestamp,
    actor_id,
    actor_role,
    ip_address,
    action,
    target_type,
    target_id,
    details
)
SELECT
    NOW(),
    id,
    'admin',
    '127.0.0.1',
    'SYSTEM_BASELINE_INIT',
    'user',
    id,
    '{"message": "Initial platform administrator provisioned via SQL migration."}'
FROM users
WHERE username = 'admin'
LIMIT 1;
