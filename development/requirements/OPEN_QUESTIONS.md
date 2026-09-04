# Open Questions & Verification Tracking

This document tracks items marked `[REQUIRES VERIFICATION]` in accordance with Section 4.6 and Section 35 of the Version 2 Recreation Blueprint.

---

## 1. Offsite Automated Backup Storage Provider (Section 35.4)
- **Status:** `[REQUIRES VERIFICATION]`
- **Description:** While local automated daily `pg_dump` and retention rotations (7 days daily, 4 weeks weekly, 12 months monthly) are fully configured and documented in `PRODUCTION_SETUP.md`, the external cloud storage provider (e.g. AWS S3, Cloudflare R2, or remote SFTP vault) must be provisioned and configured according to the production organization's infrastructure policies.
- **Interim Implementation:** The production runbook defines the local backup dump procedure and cron schedule, with placeholders for `S3_BUCKET` / `R2_ENDPOINT`.

## 1. Offsite Automated Backup Storage Provider — RECOMMENDED DECISION

**Status:** `APPROVED — REFERENCE IMPLEMENTATION: S3-COMPATIBLE OBJECT STORAGE`

Version 2 will use **S3-compatible object storage** as the reference implementation for offsite PostgreSQL backups.

The production backup pipeline must:

1. Generate PostgreSQL backups using `pg_dump` in custom format.
2. Store the primary backup temporarily on the production server.
3. Upload completed backups to a private S3-compatible bucket.
4. Encrypt backups in transit and at rest.
5. Prevent public bucket/object access.
6. Use a dedicated backup credential with the minimum permissions required to upload and manage backup objects.
7. Apply the required retention policy:

   * Daily backups: 7 days
   * Weekly backups: 4 weeks
   * Monthly backups: 12 months
8. Keep offsite backups independent from the application server and PostgreSQL container.
9. Document and test restoration from an offsite backup.
10. Never store cloud credentials in source code or Docker images.

The exact provider, bucket name, region, endpoint, access credentials, and organizational cloud account remain environment-specific configuration values.

The application repository must use placeholders such as:

`BACKUP_S3_BUCKET=<private-backup-bucket>`

`BACKUP_S3_ENDPOINT=<s3-compatible-endpoint>`

`BACKUP_S3_ACCESS_KEY=<secret>`

`BACKUP_S3_SECRET_KEY=<secret>`

The coding agent may implement the upload mechanism using the simplest reliable S3-compatible tooling available in the approved production environment.

The backup system must remain operationally separate from the application's runtime request path. A backup failure must not break normal application requests, but it must generate an operational alert/error that is visible to the deployment operator.

The application must never depend on the offsite provider for normal user-facing functionality.


---

## 2. Production SMTP Provider Credentials (Section 11.2 & 33)
- **Status:** `[REQUIRES VERIFICATION]`
- **Description:** The system baseline specifies Google Workspace / Gmail SMTP (`smtp.gmail.com:587`). In production, this requires an active Google App Password or dedicated transactional SMTP service (such as SendGrid or Postmark) with verified SPF/DKIM records.
- **Interim Implementation:** `EmailDeliveryService` provides full SMTP integration when `MAIL_PASSWORD` and `MAIL_USERNAME` are configured; in local/development mode without credentials, it safely logs OTP dispatch events to the development console for instant developer testing without crashing or blocking.

## 2. Production SMTP Provider — RECOMMENDED DECISION

**Status:** `APPROVED — GMAIL / GOOGLE WORKSPACE SMTP`

Version 2 will use **Gmail / Google Workspace SMTP** as the reference production email provider.

Reference configuration:

`MAIL_HOST=smtp.gmail.com`

`MAIL_PORT=587`

`MAIL_STARTTLS=True`

`MAIL_USERNAME=<verified-sender>`

`MAIL_PASSWORD=<application-password-or-provider-secret>`

`MAIL_FROM=<verified-sender>`

`MAIL_FROM_NAME="Batanes Niche Job Portal"`

The production organization must provide a verified sender identity and the required SMTP credential through environment configuration or an approved secret-management mechanism.

The production organization must also configure the required domain email-authentication records and provider policies appropriate to the selected sender domain.

`EmailDeliveryService` must isolate SMTP implementation from `AuthService`. `AuthService` remains responsible for OTP generation, expiration, hashing, verification, attempt limits, and password-reset business rules.

### Development and Testing

When real SMTP credentials are unavailable:

* local development may use a mock email transport;
* automated tests must use a test/dummy email transport;
* the raw OTP may be captured only inside the isolated test/mock layer required to verify the reset flow;
* the raw OTP must never be written to application logs, browser console, API responses, database records, Docker logs, or `error_reports`.

A missing production SMTP configuration must not silently pretend that an email was successfully delivered. Production configuration validation should report the missing configuration clearly to the operator.

The password-reset API must continue to return a generic account-independent response so that account enumeration is prevented.

### Provider Portability

Gmail / Google Workspace is the Version 2 reference provider.

The email abstraction must remain provider-independent enough that a future provider such as a transactional SMTP service can replace Gmail without changing OTP business logic.

No provider-specific API dependency is required for Version 2.
