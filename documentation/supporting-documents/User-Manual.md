# User Manual – Batanes Niche Job Portal v2.0

**Version:** 2.0.0  
**Date:** 2026-11-18

---

## Introduction

The **Batanes Niche Job Portal** is a hyper-local employment marketplace designed specifically for the province of Batanes, Philippines. It connects job seekers across Batan Island, Sabtang Island, and Itbayat Island with verified local employers across all 6 municipalities and 29 barangays.

The portal has three user types: **Job Seekers**, **Employers**, and **Platform Administrators**.

---

## Part 1: Guest Access (No Account Required)

Guests can browse job listings without registering.

### Browse Job Listings
1. Navigate to the portal homepage.
2. Click **Browse Jobs** or navigate to the Jobs section.
3. Use the filter controls to narrow results by:
   - Municipality (Basco, Mahatao, Ivana, Uyugan, Sabtang, Itbayat)
   - Employment Type (Full-Time, Part-Time, etc.)
   - Keywords
4. Click any job card to view full job details.

> **Note:** Guests see **preview cards** only. Register as a Job Seeker to view complete job details and apply.

### Register an Account
1. Click **Register** or **Sign Up**.
2. Select your role: **Job Seeker** or **Employer**.
3. Fill in your details:
   - Username, email address, password
   - Full name, phone number (optional)
   - Municipality (required) and Barangay (optional)
4. Click **Create Account**.
5. You will be automatically logged in.

---

## Part 2: Job Seeker Guide

### 2.1 Logging In
1. Click **Login**.
2. Enter your username or email and password.
3. Click **Sign In**.

**Forgot Password?**
1. Click **Forgot Password** on the login page.
2. Enter your registered email address.
3. Check your email for a 6-digit OTP code (valid for 15 minutes).
4. Enter the OTP code and your new password on the reset page.

**Demo Access:** If the platform has demo mode enabled, click **Try as Job Seeker** to log in with a demo account.

---

### 2.2 Dashboard and Navigation

After logging in, the **Job Seeker Dashboard** provides:
- Quick links to browse jobs, view applications, notifications, and saved jobs.
- On mobile, a **bottom navigation bar** provides quick access to Home, Jobs, Applications, Notifications, and Profile.
- A real-time **notification badge** shows unread notifications.

---

### 2.3 Completing Your Profile

A stronger profile improves your visibility to employers and your recommendation score.

1. Navigate to **Profile**.
2. Complete all profile sections:
   - Personal information (full name, phone number, municipality, barangay)
   - Skills (select from the standard Batanes skill catalog)
   - Bio, education level, and years of experience
   - Upload a profile photo
3. Upload your **Resume** (PDF or DOCX, maximum 5 MB).
4. A **profile completeness gauge** (0–100 points) shows your progress.

---

### 2.4 Browsing and Applying for Jobs

**Browse Jobs:**
1. Navigate to **Jobs**.
2. Use filters: municipality, island, employment type, keyword.
3. Sort by: Newest, Salary (High–Low), Salary (Low–High).

**View Job Details:**
1. Click a job card to open the full job description.
2. The job shows: title, company, location (municipality/barangay), salary range, employment type, required skills, and description.

**Apply for a Job:**
1. On the Job Details page, click **Apply**.
2. In the application modal:
   - Add an optional cover letter.
   - Your uploaded resume is automatically attached.
3. Click **Submit Application**.
4. You will receive a confirmation notification.

---

### 2.5 Tracking Applications

1. Navigate to **My Applications**.
2. View all submitted applications with their current status:
   - **Pending** — Under employer review.
   - **Accepted** — Employer has accepted your application. Contact details revealed.
   - **Rejected** — Application was not selected.
   - **Withdrawn** — You or the employer withdrew the application.
3. Click **Withdraw** to withdraw a pending application.

---

### 2.6 Saved Jobs (Bookmarks)

1. On any job listing, click the **Bookmark** icon to save it.
2. Navigate to **Saved Jobs** to view all bookmarked positions.
3. Click the bookmark icon again or use the **Remove** button to unbookmark.

---

### 2.7 Notifications

1. Navigate to **Notifications** (or tap the bell icon in mobile bottom nav).
2. Notifications are generated for:
   - Application submitted confirmation.
   - Application status changes (accepted/rejected).
   - Employer actions on your applications.
3. Click **Mark All as Read** to clear the notification badge.
4. Click an individual notification to mark it as read.

---

## Part 3: Employer Guide

### 3.1 Logging In

1. Click **Login** and enter your employer credentials.
2. If demo mode is active, click **Try as Employer**.

---

### 3.2 Employer Dashboard

The **Employer Dashboard** shows:
- Active job postings and application counts.
- Recent applicant activity.
- Quick links to post jobs, review applicants, and browse candidates.

---

### 3.3 Posting a Job

1. Click **Post a Job** or navigate to **My Vacancies → Post New**.
2. Fill in the job details:
   - Job Title
   - Description
   - Municipality and Barangay (where the job is located)
   - Salary Range (minimum and maximum)
   - Employment Type (Full-Time, Part-Time, Seasonal, etc.)
   - Required Skills (select from the Batanes skill catalog)
3. Click **Post Job**.
4. The job will appear in the active listings immediately.

---

### 3.4 Managing Your Job Listings

1. Navigate to **My Vacancies**.
2. For each listing, you can:
   - **Edit** the job details.
   - **Archive (Close)** the job. Closed jobs are soft-deleted (not permanently removed) and can be restored by an administrator if needed.
3. Toggle **Show Closed Jobs** to view archived listings.

---

### 3.5 Reviewing Applicants

1. Navigate to **My Vacancies** → click a job → **View Applicants**.
2. Each applicant shows:
   - Full name, municipality, island.
   - Skills profile.
   - Cover letter (if submitted).
   - Resume download link (PDF/DOCX).
3. Update application status:
   - **Accept** — Marks applicant as accepted. Reveals seeker's contact details (phone/email). Sends notification to seeker.
   - **Reject** — Marks applicant as not selected. Sends notification to seeker.

---

### 3.6 Candidate Directory and Recommendations

1. Navigate to **Find Candidates** or **Recommendations**.
2. The system returns a **two-tier ranked list**:
   - **Tier 1:** Candidates with matching skills or geography (scored 0–100 total).
   - **Tier 2:** Remaining candidates (unscored, alphabetical).
3. The recommendation score = **Skill Score (0–70)** + **Geographic Score (0–30)**:
   - Skill score based on % overlap between job required skills and candidate skills.
   - Geographic score: Same barangay = 30 pts; Same municipality = 25 pts; Same island = 15 pts; Different islands = 5 pts.
4. Filter candidates by municipality, island, or specific skill.

---

## Part 4: Administrator Guide

> Admin access is through the **backend server** only: `http://localhost:8000/admin` (dev) or `https://your-backend.onrender.com/admin` (production).

### 4.1 Logging In

1. Navigate to the Admin login page.
2. Enter administrator credentials.
3. The session lasts 12 hours. Idle sessions require re-login.

### 4.2 Dashboard

The admin dashboard shows real-time system metrics:
- Total active users.
- Active job listings count.
- Total applications submitted.
- Number of error reports.
- Recent audit log entries.

### 4.3 User Management

1. Navigate to **Users**.
2. Search by username, email, name; filter by role (seeker/employer/admin) or status (active/suspended).
3. **Suspend User:** Immediately deactivates the account and revokes all sessions. The user cannot log in until restored.
4. **Restore User:** Re-activates a suspended account.

> You cannot suspend your own account.

### 4.4 Job Moderation

1. Navigate to **Jobs**.
2. Filter by status (active/closed).
3. **Disable:** Closes the listing and removes it from public search.
4. **Restore:** Re-activates a disabled listing.

### 4.5 Error Reports

1. Navigate to **Error Reports**.
2. View the last 100 server error incidents (500 errors) with:
   - Timestamp, endpoint, error message.
   - Sanitized request data (passwords and tokens redacted).

### 4.6 Audit Trail

1. Navigate to **Audit Logs**.
2. View the append-only record of all administrative actions:
   - Admin logins (success and failures).
   - User suspensions and restorations.
   - Job disabling and restoring.
3. Each entry includes: timestamp, actor, actor role, IP address, action, and target.

---

## Screenshots Reference

Screenshots of the actual application interface are available in the `Reference-UI/` directory:

| Directory | Contents |
|---|---|
| `Reference-UI/Desktop-UI/` | Desktop interface mockups (light and night themes) |
| `Reference-UI/Mobile-UI/` | Mobile-responsive interface mockups (light and night themes) |
| `Reference-UI/New-UI/` | Current UI design screenshots |
| `Reference-UI/Other-UI/` | Confirmation dialogs, toast notifications |

> **Note on Screenshots:** The `Reference-UI/` folder contains design reference images. Live application screenshots should be captured from the running application for final documentation submission. See `documentation/screenshots/` for the designated capture location.
