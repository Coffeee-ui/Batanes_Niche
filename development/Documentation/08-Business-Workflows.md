# 08 - Business Workflows

## 1. Overview of Core Workflows

The **Batanes Niche Job Portal** manages all platform interactions through deterministic, auditable business workflows. This document details the step-by-step logic, transaction boundaries, and state transitions for all core operations.

---

## 2. User Registration Workflow

Public registration accommodates both job seekers and local employers while enforcing canonical location validation and role-specific profile entity generation.

```mermaid
flowchart TD
    Start([User Submits Registration Form]) --> RoleCheck{Role == 'job_seeker' or 'employer'?}
    RoleCheck -- No --> RejectRole[Return HTTP 400 Bad Request]
    RoleCheck -- Yes --> GeoVal[Validate Municipality & Barangay against Canonical Geography]
    
    GeoVal --> GeoValid{Is Location Canonical?}
    GeoValid -- No --> RejectGeo[Return HTTP 400: Invalid Batanes Location]
    GeoValid -- Yes --> UniqCheck{Username or Email Already Exists?}
    
    UniqCheck -- Yes --> RejectUniq[Return HTTP 400: Already Registered]
    UniqCheck -- No --> HashPwd[Compute bcrypt Hash of Password rounds=12]
    
    HashPwd --> StartTxn[Begin DB Transaction]
    StartTxn --> InsertUser[INSERT INTO users account_status='active']
    
    InsertUser --> ProfileSplit{User Role?}
    ProfileSplit -- job_seeker --> InsertSeeker[INSERT INTO job_seeker_profiles bio, edu, exp]
    ProfileSplit -- employer --> InsertEmp[INSERT INTO employer_profiles company_name, addr, desc]
    
    InsertSeeker --> IssueTokens[Issue 15m JWT Access Token & 7d Refresh Token]
    InsertEmp --> IssueTokens
    
    IssueTokens --> SaveToken[INSERT INTO refresh_tokens token_hash]
    SaveToken --> CommitTxn[Commit Transaction]
    CommitTxn --> ReturnRes([Return HTTP 201 Created with Access & Refresh Tokens])
```

---

## 3. Job Posting Lifecycle Workflow

Employers create, update, and manage vacancies. Vacancy availability is controlled via status and soft-deletion.

```mermaid
stateDiagram-v2
    [*] --> Active : Employer Posts Job (Validates Canonical Geography)
    Active --> Active : Employer Updates Details (Title, Salary, Skills)
    Active --> Closed : Employer Closes Job (status = 'closed')
    Closed --> Active : Employer Re-opens Job (status = 'active')
    Active --> SoftDeleted : Employer or Admin Deletes (deleted_at = now())
    Closed --> SoftDeleted : Employer or Admin Deletes (deleted_at = now())
    SoftDeleted --> Active : Administrator Restores (deleted_at = NULL)
    SoftDeleted --> [*]

    note right of Active
        Visible in public search catalog
        Accepts new applications
        Included in recommendation calculations
    end note

    note right of SoftDeleted
        Hidden from public catalog
        Rejects new applications
        Preserved for historical audit trail
    end note
```

---

## 4. Job Application Submission & Notification Workflow

Job application submission is governed by an **Explicit Transaction Boundary** that couples application persistence with instant employer notification.

```mermaid
flowchart TD
    Seeker([Seeker Submits Application]) --> RoleGate{User Role == 'job_seeker'?}
    RoleGate -- No --> ErrRole[HTTP 403: Only seekers can apply]
    RoleGate -- Yes --> JobStatusCheck{Job Status == 'active' & deleted_at IS NULL?}
    
    JobStatusCheck -- No --> ErrJob[HTTP 400: Job is closed or inactive]
    JobStatusCheck -- Yes --> SelfCheck{Job Employer ID == Seeker ID?}
    
    SelfCheck -- Yes --> ErrSelf[HTTP 400: Cannot apply to own job]
    SelfCheck -- No --> DupCheck{Active Application Exists for Job + Seeker?}
    
    DupCheck -- Yes --> ErrDup[HTTP 400: Already applied for this job]
    DupCheck -- No --> BeginTxn[Begin Atomic DB Transaction]
    
    BeginTxn --> InsertApp[INSERT INTO applications status='pending']
    InsertApp --> InsertNotif[INSERT INTO notifications recipient=employer_id, type='new_application']
    InsertNotif --> CommitTxn[Commit DB Transaction]
    
    CommitTxn --> ReturnOut([Return HTTP 201 Created SeekerApplicationOut])
    
    BeginTxn -.-> OnFailure[On Any Exception: Rollback Transaction]
    OnFailure -.-> ErrRollback[HTTP 400: Failed to submit application]
```

---

## 5. Application Status Transition & Applicant Notification Workflow

Employers review applications and update candidate statuses (`pending` -> `accepted` / `rejected`). Each status change atomically notifies the candidate.

```mermaid
flowchart TD
    Emp([Employer Updates Application Status]) --> AuthGate{Employer Owns Job or Is Admin?}
    AuthGate -- No --> ErrAuth[HTTP 403: Forbidden]
    AuthGate -- Yes --> ExistCheck{Application Exists?}
    
    ExistCheck -- No --> ErrExist[HTTP 404: Application not found]
    ExistCheck -- Yes --> TransCheck{Allowed Status Transition?}
    
    TransCheck -- No --> ErrTrans[HTTP 400: Invalid status transition]
    TransCheck -- Yes --> BeginTxn[Begin Atomic DB Transaction]
    
    BeginTxn --> UpdateStatus[UPDATE applications SET status = new_status]
    UpdateStatus --> CreateSeekerNotif[INSERT INTO notifications recipient=seeker_id, type='application_status_updated']
    CreateSeekerNotif --> CommitTxn[Commit DB Transaction]
    
    CommitTxn --> ReturnEmpOut([Return HTTP 200 OK with Authorized Applicant Contact Info])
    
    BeginTxn -.-> OnFailure[On Exception: Rollback Transaction]
    OnFailure -.-> ErrRollback[HTTP 400: Failed to update status]
```

### Permitted Status Transitions
- `pending` -> `accepted` (Applicant approved for hiring)
- `pending` -> `rejected` (Applicant not selected)
- `accepted` -> `pending` (Status re-opened for evaluation)
- `rejected` -> `pending` (Application reconsidered)

---

## 6. Password Reset via 6-Digit Email OTP Workflow

Ensures zero account enumeration, brute-force defense, and automated session invalidation.

```mermaid
flowchart TD
    subgraph Phase1["Phase 1: OTP Dispatch"]
        UserReq([User Requests Reset with Email]) --> FindUser{Active User Exists?}
        FindUser -- No --> SilentSuccess[Return HTTP 200 Generic Message]
        FindUser -- Yes --> InvalidateOld[Set used=True on existing active OTPs for user]
        InvalidateOld --> GenOTP[Generate CSPRNG 6-digit OTP]
        GenOTP --> HashOTP[Compute bcrypt hash of OTP]
        HashOTP --> SaveResetToken[INSERT INTO password_reset_tokens expires_at=now+15m, attempts=0]
        SaveResetToken --> DispatchEmail[EmailDeliveryService: Send OTP via SMTP]
        DispatchEmail --> ReturnGeneric([Return HTTP 200 Generic Message])
    end

    subgraph Phase2["Phase 2: OTP Verification & Password Update"]
        SubmitNew([User Submits Email, OTP Code, New Password]) --> GetToken{Active Reset Token Exists?}
        GetToken -- No --> ErrToken[HTTP 400: Invalid or expired reset code]
        GetToken -- Yes --> VerifHash{verify_otp code, stored_hash?}
        
        VerifHash -- No --> IncAttempts[attempts_count += 1]
        IncAttempts --> AttemptCheck{attempts_count >= 5?}
        AttemptCheck -- Yes --> ErrLockout[HTTP 400: Too many failed attempts. Code invalidated]
        AttemptCheck -- No --> ErrInvalid[HTTP 400: Invalid or expired reset code]
        
        VerifHash -- Yes --> BeginAtomic[Begin Atomic DB Transaction]
        BeginAtomic --> UpdPwd[UPDATE users SET password_hash = bcrypt new_password]
        UpdPwd --> MarkUsed[UPDATE password_reset_tokens SET used = True]
        MarkUsed --> TermSessions[UPDATE refresh_tokens SET revoked = True WHERE user_id = user.id]
        TermSessions --> LogAudit[INSERT INTO audit_logs action='PASSWORD_RESET_COMPLETE']
        LogAudit --> CommitAtomic[Commit Transaction]
        CommitAtomic --> Done([Return HTTP 200 OK: Password successfully reset])
    end
```

---

## 7. Saved Jobs (Bookmarks) Workflow

Job seekers bookmark vacancies for future reference.

```mermaid
flowchart TD
    SeekerAction([Seeker clicks Bookmark Job]) --> RoleGuard{Role == 'job_seeker'?}
    RoleGuard -- No --> ErrRole[HTTP 403: Forbidden]
    RoleGuard -- Yes --> ExistsGuard{Saved Job Record Exists?}
    
    ExistsGuard -- Yes (Action: Save) --> ErrDup[HTTP 400: Job already saved]
    ExistsGuard -- No (Action: Save) --> InsertSaved[INSERT INTO saved_jobs user_id, job_id]
    InsertSaved --> DoneSave([Return HTTP 201 Created SavedJobOut])
    
    ExistsGuard -- Yes (Action: Delete) --> DeleteSaved[DELETE FROM saved_jobs WHERE id = id AND user_id = user.id]
    DeleteSaved --> DoneDel([Return HTTP 200 OK])
```

---

## 8. Administrative User Moderation Workflow

Administrators can search, inspect, suspend, and restore platform accounts via the Jinja2 interface.

```mermaid
flowchart TD
    Admin([Administrator in /admin/users]) --> ActionChoice{Admin Action?}
    
    ActionChoice -- Suspend User --> PostSuspend[POST /admin/users/id/suspend with CSRF token]
    PostSuspend --> UpdSuspend[UPDATE users SET account_status = 'suspended']
    UpdSuspend --> RevokeTokens[UPDATE refresh_tokens SET revoked = True WHERE user_id = target_id]
    RevokeTokens --> AuditSuspend[INSERT INTO audit_logs action='USER_SUSPENDED']
    AuditSuspend --> Redirect1([Redirect to /admin/users with success banner])
    
    ActionChoice -- Restore User --> PostRestore[POST /admin/users/id/restore with CSRF token]
    PostRestore --> UpdRestore[UPDATE users SET account_status = 'active']
    UpdRestore --> AuditRestore[INSERT INTO audit_logs action='USER_RESTORED']
    AuditRestore --> Redirect2([Redirect to /admin/users with success banner])
```

---

## 9. Next Steps

- For mathematical formulas and calculation steps of the recommendation algorithm, see [**09-Recommendation-Engine.md**](./09-Recommendation-Engine.md).
- To examine how the frontend React SPA renders these workflows, see [**10-Frontend-Architecture.md**](./10-Frontend-Architecture.md).
- For complete operational coverage of the administrative portal, see [**11-Administrative-UI.md**](./11-Administrative-UI.md).
