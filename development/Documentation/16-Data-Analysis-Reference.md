# 16 - Data Analysis Reference

## 1. Overview for Analysts & Researchers

This document serves as an authoritative guide for **data analysts, economic researchers, and municipal planners** querying the **Batanes Niche Job Portal** database. It provides entity definitions, key dimensions, derived metrics, and production-tested SQL queries without requiring the analyst to inspect application source code.

---

## 2. Core Relational Entities & Join Mapping

```
users (id) 
  ├── 1:1 ── employer_profiles (user_id)
  ├── 1:1 ── job_seeker_profiles (user_id)
  ├── 1:N ── jobs (employer_id) ── 1:N ── applications (job_id)
  ├── 1:N ── applications (seeker_id)
  ├── 1:N ── saved_jobs (user_id)
  ├── 1:N ── notifications (user_id)
  └── 1:N ── audit_logs (actor_id)
```

---

## 3. Key Analytical Dimensions

| Dimension | Source Field | Description & Categorization |
|---|---|---|
| **Island** | Derived via `CASE` on `municipality` | `Batan Island` (Basco, Mahatao, Ivana, Uyugan), `Sabtang Island` (Sabtang), `Itbayat Island` (Itbayat). |
| **Municipality** | `users.municipality`, `jobs.municipality` | The 6 canonical Batanes municipalities. |
| **Barangay** | `users.barangay`, `jobs.barangay` | The 29 canonical barangays. |
| **User Role** | `users.role` | `'job_seeker'`, `'employer'`, `'admin'`. |
| **Account Standing** | `users.account_status` | `'active'`, `'suspended'`. |
| **Employment Type** | `jobs.employment_type` | `'Full-time'`, `'Part-time'`, `'Contract'`, `'Seasonal'`, `'Internship'`. |
| **Job Status** | `jobs.status` | `'active'`, `'closed'`. Active vacancies must also satisfy `jobs.deleted_at IS NULL`. |
| **Application Status**| `applications.status` | `'pending'`, `'accepted'`, `'rejected'`. |
| **Cohort Date** | `DATE_TRUNC('month', created_at)` | Time dimension for registrations, postings, and submissions. |

---

## 4. Strict Data Privacy & Sensitivity Exclusions

> [!CAUTION]
> Under Philippine Data Privacy laws and platform security requirements, the following columns are **strictly classified as Secrets or Sensitive PII** and must **NEVER** be exported, displayed in dashboards, or shared in unanonymized reports:
> - `users.password_hash`
> - `refresh_tokens.token_hash`
> - `password_reset_tokens.otp_hash`
> - `users.email` and `users.phone_number` (must be masked or excluded)
> - `error_reports.request_data` and `error_reports.stack_trace`

---

## 5. Verified Production SQL Queries

The following queries are validated against the actual database schema and are compatible with both **PostgreSQL 16** and **SQLite**.

### 5.1 User Distribution & Island Breakdown
Measures labor supply and enterprise density across the three inhabited islands:

```sql
SELECT 
    CASE 
        WHEN u.municipality IN ('Basco', 'Mahatao', 'Ivana', 'Uyugan') THEN 'Batan Island'
        WHEN u.municipality = 'Sabtang' THEN 'Sabtang Island'
        WHEN u.municipality = 'Itbayat' THEN 'Itbayat Island'
        ELSE 'Other / Unknown'
    END AS island,
    u.municipality,
    u.role,
    COUNT(u.id) AS total_users,
    SUM(CASE WHEN u.account_status = 'active' THEN 1 ELSE 0 END) AS active_users,
    SUM(CASE WHEN u.account_status = 'suspended' THEN 1 ELSE 0 END) AS suspended_users
FROM users u
GROUP BY island, u.municipality, u.role
ORDER BY island, u.municipality, u.role;
```

---

### 5.2 Active Vacancies & Compensation Statistics by Municipality
Analyzes job availability, average compensation, and contract types across local labor markets:

```sql
SELECT 
    j.municipality,
    j.employment_type,
    COUNT(j.id) AS active_vacancies_count,
    ROUND(AVG(j.salary_min), 2) AS avg_minimum_salary,
    ROUND(AVG(j.salary_max), 2) AS avg_maximum_salary,
    MIN(j.salary_min) AS lowest_salary,
    MAX(j.salary_max) AS highest_salary
FROM jobs j
WHERE j.status = 'active' 
  AND j.deleted_at IS NULL
GROUP BY j.municipality, j.employment_type
ORDER BY j.municipality, active_vacancies_count DESC;
```

---

### 5.3 Application Funnel & Hiring Conversion Rates
Evaluates how efficiently applicants are evaluated and hired across municipalities:

```sql
SELECT 
    j.municipality,
    COUNT(a.id) AS total_applications,
    SUM(CASE WHEN a.status = 'pending' THEN 1 ELSE 0 END) AS pending_applications,
    SUM(CASE WHEN a.status = 'accepted' THEN 1 ELSE 0 END) AS accepted_hires,
    SUM(CASE WHEN a.status = 'rejected' THEN 1 ELSE 0 END) AS rejected_applications,
    ROUND(
        (SUM(CASE WHEN a.status = 'accepted' THEN 1.0 ELSE 0.0 END) / NULLIF(COUNT(a.id), 0)) * 100, 
        2
    ) AS hiring_conversion_rate_pct
FROM applications a
JOIN jobs j ON a.job_id = j.id
GROUP BY j.municipality
ORDER BY total_applications DESC;
```

---

### 5.4 Cross-Island Application Flow
Measures the volume of job applications submitted across different islands (e.g., Sabtang resident applying to Basco):

```sql
SELECT 
    CASE 
        WHEN seeker.municipality IN ('Basco', 'Mahatao', 'Ivana', 'Uyugan') THEN 'Batan Island'
        WHEN seeker.municipality = 'Sabtang' THEN 'Sabtang Island'
        WHEN seeker.municipality = 'Itbayat' THEN 'Itbayat Island'
    END AS seeker_island,
    CASE 
        WHEN job.municipality IN ('Basco', 'Mahatao', 'Ivana', 'Uyugan') THEN 'Batan Island'
        WHEN job.municipality = 'Sabtang' THEN 'Sabtang Island'
        WHEN job.municipality = 'Itbayat' THEN 'Itbayat Island'
    END AS job_island,
    COUNT(app.id) AS application_count,
    SUM(CASE WHEN app.status = 'accepted' THEN 1 ELSE 0 END) AS accepted_count
FROM applications app
JOIN users seeker ON app.seeker_id = seeker.id
JOIN jobs job ON app.job_id = job.id
GROUP BY seeker_island, job_island
ORDER BY application_count DESC;
```

---

### 5.5 Most Saved / Bookmarked Vacancies
Identifies high-interest employment opportunities among job seekers:

```sql
SELECT 
    j.id AS job_id,
    j.title,
    j.municipality,
    emp_p.company_name,
    COUNT(s.id) AS total_bookmarks,
    COUNT(DISTINCT a.id) AS total_applications_received
FROM jobs j
JOIN employer_profiles emp_p ON j.employer_id = emp_p.user_id
LEFT JOIN saved_jobs s ON j.id = s.job_id
LEFT JOIN applications a ON j.id = a.job_id
WHERE j.status = 'active' 
  AND j.deleted_at IS NULL
GROUP BY j.id, j.title, j.municipality, emp_p.company_name
ORDER BY total_bookmarks DESC
LIMIT 10;
```

---

## 6. Next Steps

- For local environment setup and database initialization, see [**17-Developer-Guide.md**](./17-Developer-Guide.md).
- To review the historical design choices and architectural decisions, see [**18-Architecture-Decisions.md**](./18-Architecture-Decisions.md).
- To inspect the complete database schema and column definitions, see [**04-Database-and-ERD.md**](./04-Database-and-ERD.md).
