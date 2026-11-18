# Testing Documentation – Batanes Niche Job Portal v2.0

**Analysis Date:** 2026-11-18  
**Branch:** New-Features

> **Verification Note:** Test documentation is based on actual test infrastructure found in the repository. Test execution results are marked as "Not Executed in this analysis session" unless specific evidence of passing results is cited.

---

## 1. Testing Strategy Overview

The project employs a **multi-layer quality assurance** approach:

| Layer | Tool | Scope | Status |
|---|---|---|---|
| Static Type Checking | TypeScript Compiler (`tsc --noEmit`) | Backend + Frontend | ✅ Implemented (CI gate) |
| Unit / Component Tests | Vitest 1.6 + JSDOM | Frontend components and utilities | ✅ Implemented |
| Zero-Jargon Audit | Vitest custom test suite | UI text contract verification | ✅ Implemented |
| Integration / API Testing | Not found in repository | Backend API endpoints | ❌ Not Implemented |
| End-to-End Testing | Not found in repository | Full user flows | ❌ Not Implemented |

---

## 2. Test Execution Commands

```bash
# 1. TypeScript type verification (backend + frontend)
pnpm typecheck
# Runs: tsc --noEmit in both packages

# 2. Frontend Vitest suite + zero-jargon audit
pnpm test
# Runs: vitest run in frontend package

# 3. Windows batch automation
development\scripts\test.bat
```

---

## 3. Zero-Jargon Contract Test

**File:** `frontend/src/test/zero_jargon.test.ts`  
**Purpose:** Enforces that the frontend UI contains no technical jargon that would intimidate local trade workers and enterprise proprietors unfamiliar with technology.

The zero-jargon contract test scans UI component text against a blocklist of technical terms to ensure the application language remains accessible to Ivatan users. This is a custom quality gate unique to the platform's hyper-local design mandate.

---

## 4. Test Cases

### 4.1 TypeScript Compilation Verification

| Test ID | Feature/Module | Test Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-001 | Backend (TypeScript) | `tsc --noEmit` on `backend/src/` | Zero type errors | Not executed in this session | Not Verified |
| TC-002 | Frontend (TypeScript) | `tsc --noEmit` on `frontend/src/` | Zero type errors | Not executed in this session | Not Verified |

### 4.2 Authentication Tests (Manual / Not Automated)

| Test ID | Feature/Module | Test Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-010 | User Registration | Register with valid seeker data | 201 Created, JWT pair returned | Not verified | Not Verified |
| TC-011 | User Registration | Register with existing username | 409 Conflict | Not verified | Not Verified |
| TC-012 | User Login | Login with valid credentials | 200 OK, JWT pair returned | Not verified | Not Verified |
| TC-013 | User Login | Login with wrong password | 401 Unauthorized | Not verified | Not Verified |
| TC-014 | Token Refresh | POST /auth/refresh with valid token | 200 OK, new token pair | Not verified | Not Verified |
| TC-015 | Token Refresh | POST /auth/refresh with revoked token | 401 Unauthorized, all sessions revoked | Not verified | Not Verified |
| TC-016 | Logout | POST /auth/logout with valid token | 200 OK, JTI blocklisted | Not verified | Not Verified |
| TC-017 | Rate Limiting | POST /auth/login >5 times in 60s | 429 Too Many Requests | Not verified | Not Verified |
| TC-018 | OTP Reset | Request password reset for valid email | 200, OTP email sent | Not verified | Not Verified |
| TC-019 | OTP Reset | Submit expired OTP | 400 Bad Request | Not verified | Not Verified |
| TC-020 | OTP Reset | Submit OTP >5 attempts | 400 (max attempts) | Not verified | Not Verified |

### 4.3 Job Management Tests (Manual / Not Automated)

| Test ID | Feature/Module | Test Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-030 | Job Listing (Guest) | GET /api/v1/jobs without token | 200, preview cards only | Not verified | Not Verified |
| TC-031 | Job Listing (Seeker) | GET /api/v1/jobs with seeker JWT | 200, full job data | Not verified | Not Verified |
| TC-032 | Job Listing (Employer) | GET /api/v1/jobs with employer JWT | 403 Forbidden | Not verified | Not Verified |
| TC-033 | Job Filtering | GET /api/v1/jobs?municipality=Basco | 200, filtered results | Not verified | Not Verified |
| TC-034 | Create Job | POST /api/v1/jobs as employer | 201, job created | Not verified | Not Verified |
| TC-035 | Create Job | POST /api/v1/jobs as seeker | 403 Forbidden | Not verified | Not Verified |
| TC-036 | Soft Delete Job | DELETE /api/v1/jobs/:id as job owner | 200, status=closed, deleted_at set | Not verified | Not Verified |
| TC-037 | Soft Delete Job | DELETE /api/v1/jobs/:id by another employer | 403 Forbidden | Not verified | Not Verified |

### 4.4 Application Tests (Manual / Not Automated)

| Test ID | Feature/Module | Test Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-040 | Submit Application | POST /api/v1/applications as seeker | 201, application created, notifications sent | Not verified | Not Verified |
| TC-041 | Duplicate Application | Submit same seeker+job twice | 409 Conflict (unique constraint) | Not verified | Not Verified |
| TC-042 | Employer Review | PUT /api/v1/applications/:id status=accepted | 200, status updated, seeker notified | Not verified | Not Verified |
| TC-043 | Withdraw Application | POST /api/v1/applications/:id/withdraw | 200, application withdrawn | Not verified | Not Verified |

### 4.5 File Upload Tests (Manual / Not Automated)

| Test ID | Feature/Module | Test Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-050 | Resume Upload | POST valid PDF (<5MB) | 200, resume_url updated | Not verified | Not Verified |
| TC-051 | Resume Upload | POST file >5MB | 400, size rejected | Not verified | Not Verified |
| TC-052 | Resume Upload | POST .exe file with .pdf extension | 400, magic byte mismatch | Not verified | Not Verified |
| TC-053 | Resume Access | Employer retrieves resume of non-applicant | 403 Forbidden | Not verified | Not Verified |

### 4.6 Recommendation Engine Tests (Manual / Not Automated)

| Test ID | Feature/Module | Test Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-060 | Skill Score | Candidate with all required skills | skillScore = 70.0 | Not verified | Not Verified |
| TC-061 | Skill Score | Candidate with no matching skills | skillScore = 0.0 | Not verified | Not Verified |
| TC-062 | Geo Score | Same municipality and barangay | geoScore = 30.0 | Not verified | Not Verified |
| TC-063 | Geo Score | Same municipality, different barangay | geoScore = 25.0 | Not verified | Not Verified |
| TC-064 | Geo Score | Different municipalities, same island | geoScore = 15.0 | Not verified | Not Verified |
| TC-065 | Geo Score | Different islands | geoScore = 5.0 | Not verified | Not Verified |

### 4.7 Admin Portal Tests (Manual / Not Automated)

| Test ID | Feature/Module | Test Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-070 | Admin Login | Valid admin credentials | Redirect to /admin/dashboard | Not verified | Not Verified |
| TC-071 | Admin Login | Invalid credentials | 401 with error message | Not verified | Not Verified |
| TC-072 | Admin Login | Suspended admin | 403 with suspended message | Not verified | Not Verified |
| TC-073 | CSRF Protection | POST /admin/users/:id/suspend without CSRF token | 403 Forbidden | Not verified | Not Verified |
| TC-074 | Suspend User | Suspend active user | user.account_status=suspended, tokens revoked | Not verified | Not Verified |
| TC-075 | Self-Suspend Guard | Admin tries to suspend themselves | 400 "You cannot suspend yourself" | Not verified | Not Verified |

---

## 5. Known Issues and Limitations

| Issue | Severity | Notes |
|---|---|---|
| No integration test suite | Medium | Backend API endpoints lack automated integration tests. All API test cases are manual/unverified. |
| No end-to-end test framework | Medium | No Cypress, Playwright, or similar framework found in repository. |
| Resume storage ephemeral on Render | High | Files lost on each redeploy. No test infrastructure for cloud storage paths. |
| Zero-jargon test coverage | Medium | Extent of zero-jargon audit coverage is not fully documented without test execution. |

---

## 6. Test Infrastructure Reference

| File/Directory | Purpose |
|---|---|
| `frontend/src/test/` | Frontend test files (Vitest) |
| `frontend/src/test/zero_jargon.test.ts` | Zero-jargon UI contract tests |
| `development/testing/TESTING.md` | Testing strategy documentation |
| `frontend/vite.config.ts` | Vitest configuration |
| `development/scripts/test.bat` | Windows batch test runner |

---

## 7. Recommended Testing Improvements

1. **Backend Integration Tests:** Add Vitest or Jest-based integration tests for all `/api/v1` endpoints using a test SQLite database.
2. **End-to-End Tests:** Implement Playwright or Cypress tests for critical user journeys: register → login → apply → employer review.
3. **Recommendation Engine Unit Tests:** Add isolated unit tests for `calculateSkillScore()` and `calculateGeographicScore()` with verified expected outputs.
4. **Resume Upload Security Tests:** Automate magic-byte verification tests with crafted test files.
5. **CI Pipeline:** Configure GitHub Actions to run `pnpm typecheck && pnpm test` on every pull request.
