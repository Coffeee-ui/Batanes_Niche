# 20 - System Flowcharts

## 1. Overview & Visual Conventions

This document provides visual flowcharts modeling the operational journeys and multi-layer technical execution paths of the **Batanes Niche Job Portal (Version 2)**.

To serve both non-technical stakeholders (evaluators, municipal partners, administrators) and software engineers, these flowcharts are divided into three distinct levels:
1. **Level 1 — General User Journey Flowchart**: A non-technical, high-level perspective mapping how users interact with the system without exposing backend internals.
2. **Level 2 — Specific User Workflows**: Dedicated role-based and task-focused journeys for Job Seekers, Employers, Authentication/Password Reset, Job Applications, Bookmarks, Notifications, Candidate Recommendations, and Administrative Moderation.
3. **Level 3 — Complete Multi-Tier System Flow**: An end-to-end technical execution pipeline tracing user interactions through the React SPA, Axios client, FastAPI routers, authentication dependencies, domain services, repositories, SQLAlchemy ORM, and the database.

### Standard Flowchart Conventions

All flowcharts adhere to standard flowchart symbology:

| Shape Name | Mermaid Syntax | Visual Representation | Standard Purpose |
|---|---|---|---|
| **Terminator** | `([Text])` | Rounded rectangle / oval | Indicates the Start or End point of a workflow. |
| **Process** | `[Text]` | Rectangle | Represents an action, system task, or state computation. |
| **Decision** | `{Text?}` | Diamond | Represents a conditional check branching the flow based on a boolean or choice. |
| **Input / Output** | `[\Text/]` | Parallelogram | Denotes user data entry (forms) or user-facing display (pages, dialogs, banners). |
| **Connector** | `-->` | Directed line with arrowhead | Establishes the direction of flow and sequence of execution. |

---

## 2. Flowchart 1: General User Journey Flowchart

> [!NOTE]
> This flowchart is designed for non-technical audiences, presentations, and product demonstrations. It focuses purely on user actions, decisions, and outcomes without technical jargon, SQL queries, or HTTP status codes.

```mermaid
flowchart TD
    Start([Start: Open Batanes Niche Job Portal]) --> LandingPage[\View Landing Page/]
    LandingPage --> HasAccount{Already have an account?}

    %% Registration Path
    HasAccount -- No --> ClickRegister[Click 'Create Account']
    ClickRegister --> ChooseRole[\Choose Role: Job Seeker or Employer/]
    ChooseRole --> FillRegForm[\Enter Name, Email, Password, Municipality, and Barangay/]
    FillRegForm --> ValidRegInfo{Valid Information & Matching Passwords?}
    ValidRegInfo -- No --> RegError[\Display Form Correction Message/]
    RegError --> FillRegForm
    ValidRegInfo -- Yes --> AccountCreated[Account Created & Signed In Automatically]
    AccountCreated --> RouteByRole

    %% Login Path
    HasAccount -- Yes --> ClickLogin[Click 'Sign In']
    ClickLogin --> EnterCredentials[\Enter Username or Email & Password/]
    EnterCredentials --> ValidCredentials{Valid Credentials?}
    ValidCredentials -- No --> LoginError[\Display Invalid Credentials Message/]
    LoginError --> RetryLogin{Forgot Password?}
    RetryLogin -- Yes --> ResetPasswordFlow[\Enter Email to Receive 6-Digit Reset Code/]
    ResetPasswordFlow --> ClickLogin
    RetryLogin -- No --> EnterCredentials
    ValidCredentials -- Yes --> AccessDashboard[Access Platform Dashboard]
    AccessDashboard --> RouteByRole{User Role?}

    %% Job Seeker Flow
    RouteByRole -- Job Seeker --> SeekerHub[\Job Seeker Dashboard/]
    SeekerHub --> SeekerAction{Choose Action}
    
    SeekerAction --> CompleteProfile[\Update Skills, Bio & Education in Profile/]
    CompleteProfile --> SeekerHub
    
    SeekerAction --> BrowseJobs[\Search & Filter Jobs by Municipality or Keywords/]
    BrowseJobs --> SelectJob[\Select Job Listing to View Details/]
    SelectJob --> CheckApply{Already Applied?}
    CheckApply -- Yes --> ViewAppliedBadge[\Show 'Applied' Status/]
    CheckApply -- No --> WantToApply{Interested in applying?}
    WantToApply -- No --> BookmarkJob[Bookmark Job for Later Review]
    WantToApply -- Yes --> OpenApplyModal[\Enter Optional Cover Letter/]
    OpenApplyModal --> SubmitApp[Submit Application]
    SubmitApp --> AppConfirmation[\Display 'Application Submitted' Confirmation/]
    AppConfirmation --> SeekerHub

    SeekerAction --> TrackApps[\View 'My Applications' Page/]
    TrackApps --> CheckStatusUpdate{Employer Reviewed Application?}
    CheckStatusUpdate -- Yes --> ViewNotif[\Receive In-App Notification: Accepted or Rejected/]
    CheckStatusUpdate -- No --> WaitReview[Status Remains 'Pending']

    %% Employer Flow
    RouteByRole -- Employer --> EmployerHub[\Employer Dashboard/]
    EmployerHub --> EmployerAction{Choose Action}

    EmployerAction --> ManageCompanyProfile[\Update Company Profile & Business Details/]
    ManageCompanyProfile --> EmployerHub

    EmployerAction --> PostNewJob[\Open 'Post New Job' Form/]
    PostNewJob --> FillJobDetails[\Enter Job Title, Municipality, Salary, Skills & Type/]
    FillJobDetails --> SubmitJobListing[Publish Vacancy]
    SubmitJobListing --> ManageJobs[\View in 'My Job Listings'/]

    EmployerAction --> ReviewCandidates[\Browse Candidate Directory or View Recommendations/]
    ReviewCandidates --> EmployerHub

    EmployerAction --> ManageApplications[\Open Received Applications/]
    ManageApplications --> InspectApplicant[\Inspect Candidate Qualifications, Skills & Cover Letter/]
    InspectApplicant --> ContactRevealed[\Access Revealed Candidate Phone & Email/]
    ContactRevealed --> DecideCandidate{Candidate Decision?}
    DecideCandidate -- Accept --> MarkAccepted[Update Status to 'Accepted']
    DecideCandidate -- Reject --> MarkRejected[Update Status to 'Rejected']
    DecideCandidate -- Hold --> KeepPending[Keep Application 'Pending']
    
    MarkAccepted --> NotifyApplicant[Applicant Receives Status Notification]
    MarkRejected --> NotifyApplicant
    NotifyApplicant --> DirectInterview[\Direct Contact via Phone or Email for Interview/]

    %% Session End
    SeekerHub --> SignOut([Sign Out / End Session])
    EmployerHub --> SignOut
```

---

## 3. Flowchart 2: Specific User Workflows

### 3.1 Job Seeker Workflow

This diagram models the entire lifecycle of an Ivatan job seeker from account access to job hunting, application tracking, and profile optimization.

```mermaid
flowchart TD
    StartSeeker([Start: Job Seeker Login]) --> EnterLogin[\Enter Username/Email & Password/]
    EnterLogin --> CheckAuth{Credentials Correct & Account Active?}
    CheckAuth -- No --> ShowAuthError[\Show Error Message/]
    ShowAuthError --> EnterLogin
    CheckAuth -- Yes --> LoadDashboard[\Load Seeker Dashboard/]

    LoadDashboard --> CheckCompleteness{Profile Completeness < 100%?}
    CheckCompleteness -- Yes --> ProfilePrompt[\View Completeness Gauge & Suggestion/]
    ProfilePrompt --> EditProfile[\Edit Profile: Add Bio, Education, Phone, Skills/]
    EditProfile --> SaveProfile[Save Changes]
    SaveProfile --> LoadDashboard
    CheckCompleteness -- No --> ViewDashboardRecs[\Review Recommended Jobs Tailored by Island & Skills/]

    ViewDashboardRecs --> JobSearchChoice{Find Jobs Method}
    JobSearchChoice -- View Recommendations --> ClickRecJob[\Select Recommended Job/]
    JobSearchChoice -- Search Catalog --> GoToJobsPage[\Open Jobs Catalog/]
    
    GoToJobsPage --> ApplyFilters[\Filter by Municipality, Island, Type, Keyword/]
    ApplyFilters --> InspectResults[\Browse Job Cards/]
    InspectResults --> ClickRecJob

    ClickRecJob --> ViewJobDetail[\View Job Detail Page/]
    ViewJobDetail --> CheckJobActive{Job Status == 'Active'?}
    CheckJobActive -- No --> ShowClosedListing[\Show 'This listing is closed' - Cannot Apply/]
    ShowClosedListing --> GoToJobsPage

    CheckJobActive -- Yes --> CheckAlreadyApplied{Already Applied to this Job?}
    CheckAlreadyApplied -- Yes --> ShowAlreadyApplied[\Show 'Application Sent' Banner/]
    ShowAlreadyApplied --> ViewApplicationsPage[\Open 'My Applications' Page/]

    CheckAlreadyApplied -- No --> DecideAction{Action?}
    DecideAction -- Save Job --> ClickSave[Click 'Save Job']
    ClickSave --> SavedConfirmation[\Show 'Job saved!' Toast/]
    SavedConfirmation --> ViewJobDetail

    DecideAction -- Apply Now --> ClickApply[Click 'Apply Now']
    ClickApply --> OpenModal[\Open Application Modal/]
    OpenModal --> EnterCoverLetter[\Enter Optional Cover Letter/]
    EnterCoverLetter --> ClickSubmitApplication[Click 'Submit Application']
    
    ClickSubmitApplication --> SubmissionSuccess{Submission Successful?}
    SubmissionSuccess -- No --> ShowAppError[\Display Failure Reason/]
    ShowAppError --> OpenModal
    SubmissionSuccess -- Yes --> ShowAppSuccess[\Display 'Application submitted successfully!' Toast/]
    ShowAppSuccess --> TrackInApplications[\View Record in 'My Applications'/]

    TrackInApplications --> MonitorStatus{Wait for Employer Review}
    MonitorStatus --> NotificationEvent[\In-App Notification Received/]
    NotificationEvent --> OpenNotifications[\Open Notifications Page/]
    OpenNotifications --> ReadStatus[\Read Status Update: 'Accepted' or 'Rejected'/]
    ReadStatus --> Finish([End Workflow])
```

---

### 3.2 Employer Workflow

This diagram models the enterprise employer journey: maintaining company presence, posting localized vacancies, reviewing matched applicants, and managing candidate progression.

```mermaid
flowchart TD
    StartEmployer([Start: Employer Login]) --> EnterEmpLogin[\Enter Employer Credentials/]
    EnterEmpLogin --> EmpAuth{Valid Employer Account?}
    EmpAuth -- No --> EmpAuthError[\Display Error Message/]
    EmpAuthError --> EnterEmpLogin
    EmpAuth -- Yes --> LoadEmpDashboard[\Load Employer Dashboard/]

    LoadEmpDashboard --> ViewStats[\Inspect Metrics: Active Jobs, Total Applicants/]
    ViewStats --> EmpDecision{Select Employer Workflow}

    %% Post Job Sub-flow
    EmpDecision -- Post a Vacancy --> ClickPostJob[\Navigate to /jobs/post/]
    ClickPostJob --> EnterJobForm[\Fill Job Title, Municipality, Barangay, Salary Range, Employment Type/]
    EnterJobForm --> SelectSkills[\Pick Skills from Catalog or Add Custom Trade Skill/]
    SelectSkills --> ValidateJobForm{Valid Location & Salary Min <= Max?}
    ValidateJobForm -- No --> JobFormError[\Highlight Form Errors/]
    JobFormError --> EnterJobForm
    ValidateJobForm -- Yes --> SubmitPost[Publish Job Listing]
    SubmitPost --> PostSuccessToast[\Display 'Job posted successfully!' Toast/]
    PostSuccessToast --> LoadMyJobs[\Redirect to 'My Job Listings' /jobs/my/]

    %% Manage Jobs Sub-flow
    EmpDecision -- Manage Existing Jobs --> LoadMyJobs
    LoadMyJobs --> SelectMyJob[\Inspect Job Card/]
    SelectMyJob --> JobAction{Listing Action?}
    JobAction -- Close Job --> ConfirmClose[\Confirm 'Close Job Listing' Dialog/]
    ConfirmClose --> JobClosed[Mark Job Status as 'closed']
    JobClosed --> LoadMyJobs
    JobAction -- View Details --> ViewJobPage[\Open Public View of Listing/]
    JobAction -- Review Applicants --> OpenApplicants[\Click 'Applicants' Button/]

    %% Applicant Review Sub-flow
    OpenApplicants --> ViewApplicantList[\Inspect Received Applications/]
    ViewApplicantList --> SelectApplicant[\Select Candidate Application/]
    SelectApplicant --> CheckContactDetails[\View Full Profile + Revealed Email & Phone Number/]
    CheckContactDetails --> ReviewDecision{Evaluation Decision?}
    
    ReviewDecision -- Accept Candidate --> TransitionAccept[Select Status 'Accepted']
    ReviewDecision -- Reject Candidate --> TransitionReject[Select Status 'Rejected']
    ReviewDecision -- Keep Evaluating --> LeavePending[Leave Status as 'Pending']

    TransitionAccept --> SendApplicantNotif[System Automatically Notifies Applicant]
    TransitionReject --> SendApplicantNotif
    SendApplicantNotif --> DirectOutreach[\Call or Email Candidate Directly to Schedule Interview/]
    DirectOutreach --> EmpFinish([End Workflow])

    %% Candidate Directory & Recommendations Sub-flow
    EmpDecision -- Find Candidates --> BrowseCandidatesPage[\Open Candidate Directory /candidates/]
    BrowseCandidatesPage --> FilterCandidates[\Filter by Island, Municipality, or Vocational Skill/]
    FilterCandidates --> ViewTwoTierRankings[\Inspect Two-Tier Ranked Candidates: 70% Skill + 30% Distance/]
    ViewTwoTierRankings --> InspectCandidateCard[\View Sanitized Qualifications/]
    InspectCandidateCard --> EmpFinish
```

---

### 3.3 Authentication & Account Access Workflow

This flowchart traces user entry, registration validation, credential authentication, and the 6-digit email OTP password recovery pipeline.

```mermaid
flowchart TD
    StartAuth([User Accesses Portal]) --> AuthChoice{Has Existing Account?}

    %% Public Registration
    AuthChoice -- No --> OpenRegister[\Navigate to /register/]
    OpenRegister --> SelectRoleType[\Select Role: 'I\'m a Job Seeker' or 'I\'m an Employer'/]
    SelectRoleType --> FillBaseFields[\Enter Full Name, Email, Username, Password, Municipality, Barangay, Phone/]
    FillBaseFields --> RoleFields{Role Selected?}
    RoleFields -- Job Seeker --> SeekerFields[\Optional: Enter Bio, Education, Experience/]
    RoleFields -- Employer --> EmployerFields[\Optional: Company Name, Business Type, Company Address/]
    
    SeekerFields --> SubmitReg[Submit Registration]
    EmployerFields --> SubmitReg
    SubmitReg --> CheckMatchPasswords{Passwords Match?}
    CheckMatchPasswords -- No --> PwMismatchError[\Display 'Passwords do not match' Error/]
    PwMismatchError --> FillBaseFields

    CheckMatchPasswords -- Yes --> ValidateGeo{Location in Canonical Batanes Geography?}
    ValidateGeo -- No --> GeoError[\Display 'Invalid Batanes location' Error/]
    GeoError --> FillBaseFields

    ValidateGeo -- Yes --> CheckUnique{Email & Username Available?}
    CheckUnique -- No --> DuplicateError[\Display 'Already registered' Error/]
    DuplicateError --> FillBaseFields

    CheckUnique -- Yes --> CreateAccountDB[Create User & Specific Profile in Database]
    CreateAccountDB --> IssueTokens[Issue 15m Access Token & 7d Refresh Token]
    IssueTokens --> AutoLogin[\Direct Redirect to /dashboard as Authenticated User/]

    %% Login
    AuthChoice -- Yes --> OpenLogin[\Navigate to /login/]
    OpenLogin --> EnterLoginCredentials[\Enter Username or Email & Password/]
    EnterLoginCredentials --> SubmitLogin[Submit Login Request]
    SubmitLogin --> VerifyLoginPass{Password Hash Matches?}
    VerifyLoginPass -- No --> BadLogin[\Display 'Invalid credentials' Error/]
    BadLogin --> CheckForgot{Forgot Password?}
    CheckForgot -- No --> EnterLoginCredentials

    VerifyLoginPass -- Yes --> CheckAccountStatus{Account Status == 'active'?}
    CheckAccountStatus -- Suspended --> ShowSuspendedError[\Display 'Your account has been suspended' Error/]
    ShowSuspendedError --> StopAuth([Access Denied])
    CheckAccountStatus -- Inactive --> ShowInactiveError[\Display 'Account is inactive' Error/]
    ShowInactiveError --> StopAuth

    CheckAccountStatus -- Active --> IssueSessionTokens[Issue Access & Refresh Tokens]
    IssueSessionTokens --> RedirectFrom[\Redirect to Intended Page or /dashboard/]

    %% Password Recovery
    CheckForgot -- Yes --> OpenForgot[\Navigate to /forgot-password/]
    OpenForgot --> EnterEmail[\Enter Account Email Address/]
    EnterEmail --> ClickRequestOtp[Click 'Send OTP']
    ClickRequestOtp --> DispatchOtpService[Generate Cryptographic 6-Digit OTP & Send via Email]
    DispatchOtpService --> ShowOtpForm[\Show OTP Entry Form - Step 2/]
    ShowOtpForm --> EnterOtpAndNewPw[\Enter 6-Digit Code & New Password/]
    EnterOtpAndNewPw --> SubmitReset[Submit Reset Form]
    
    SubmitReset --> VerifyOtp{OTP Code Valid & Expired?}
    VerifyOtp -- Invalid/Expired --> CheckAttempts{Attempts >= 5?}
    CheckAttempts -- Yes --> LockoutError[\Display 'Too many failed attempts. Code invalidated.' Error/]
    LockoutError --> OpenForgot
    CheckAttempts -- No --> OtpMismatchError[\Display 'Invalid or expired reset code' Error/]
    OtpMismatchError --> ShowOtpForm

    VerifyOtp -- Valid --> UpdatePasswordHash[Update Password Hash & Invalidate All Refresh Sessions]
    UpdatePasswordHash --> ShowResetDone[\Display 'Password Reset!' Success Screen/]
    ShowResetDone --> OpenLogin
```

---

### 3.4 Job Application Workflow

This diagram models the precise operational rules, precondition gates, atomic transaction boundaries, and state transitions of a job application.

```mermaid
flowchart TD
    StartApp([Job Seeker Clicks 'Apply Now' on /jobs/:id]) --> RoleCheck{User Role == 'job_seeker'?}
    RoleCheck -- No --> RejectRole[\Display: Only job seekers can apply for jobs/]
    RejectRole --> EndApp([Application Halted])

    RoleCheck -- Yes --> CheckJobStatus{Job Status == 'active' & Not Deleted?}
    CheckJobStatus -- No --> RejectClosed[\Display: Applications can only be submitted to active jobs/]
    RejectClosed --> EndApp

    CheckJobStatus -- Yes --> CheckSelfApplication{Job Employer ID == Current User ID?}
    CheckSelfApplication -- Yes --> RejectSelf[\Display: You cannot apply to your own job listing/]
    RejectSelf --> EndApp

    CheckSelfApplication -- No --> CheckDuplicate{Prior Active Application Exists?}
    CheckDuplicate -- Yes --> RejectDuplicate[\Display: You have already applied for this job/]
    RejectDuplicate --> EndApp

    CheckDuplicate -- No --> FillCoverLetter[\Job Seeker Enters Optional Cover Letter in Modal/]
    FillCoverLetter --> ConfirmSubmit[Click 'Submit Application']

    ConfirmSubmit --> StartAppTxn[Begin Atomic Database Transaction]
    StartAppTxn --> InsertApplication[Insert New Record into 'applications' table status='pending']
    InsertApplication --> InsertEmployerNotif[Insert Record into 'notifications' table for Employer]
    InsertEmployerNotif --> CommitAppTxn{Transaction Succeeds?}
    CommitAppTxn -- Fail / Exception --> RollbackAppTxn[Rollback Database Transaction]
    RollbackAppTxn --> ShowAppFailed[\Display 'Failed to submit application' Toast/]
    RollbackAppTxn --> EndApp

    CommitAppTxn -- Success --> CommitDB[Commit Transaction to Database]
    CommitDB --> ShowSuccessToast[\Display 'Application submitted successfully!' Toast/]
    ShowSuccessToast --> AppInReview[\Application Listed as 'pending' in Seeker's Applications/]

    %% Employer Status Transition
    AppInReview --> EmployerReviews[\Employer Opens Application on Dashboard/]
    EmployerReviews --> EmployerContactReveal[\Applicant Phone & Email Revealed to Employer/]
    EmployerContactReveal --> EmployerDecidesStatus{Employer Decision}

    EmployerDecidesStatus -- Accept --> SelectAccepted[Change Status to 'accepted']
    EmployerDecidesStatus -- Reject --> SelectRejected[Change Status to 'rejected']
    EmployerDecidesStatus -- Keep Reviewing --> RemainPending[Keep Status as 'pending']
    RemainPending --> EndApp

    SelectAccepted --> StartStatusTxn[Begin Status Update Transaction]
    SelectRejected --> StartStatusTxn

    StartStatusTxn --> ValidateTransition{Transition Valid?}
    ValidateTransition -- Invalid --> RejectTransition[\Display: Invalid status transition/]
    RejectTransition --> EndApp

    ValidateTransition -- Valid --> UpdateAppRecord[Update application.status to new status]
    UpdateAppRecord --> InsertSeekerNotif[Insert 'application_status_updated' Notification for Seeker]
    InsertSeekerNotif --> CommitStatusTxn{Commit Succeeds?}
    CommitStatusTxn -- Fail --> RollbackStatusTxn[Rollback Status Transaction]
    RollbackStatusTxn --> EndApp
    CommitStatusTxn -- Success --> CommitStatusDB[Commit Transaction to Database]
    CommitStatusDB --> ApplicantNotified[\Seeker Dashboard & Notifications Bell Alerted/]
    ApplicantNotified --> EndAppSuccess([Application Lifecycle Complete])
```

---

### 3.5 Supporting Workflows

#### 3.5.1 Saved Jobs (Bookmarks) Workflow
```mermaid
flowchart TD
    StartBookmark([Job Seeker Views Job Card or Detail]) --> ClickBookmarkBtn{Current Bookmark State?}
    
    ClickBookmarkBtn -- Not Bookmarked --> UserRoleCheck1{Role == 'job_seeker'?}
    UserRoleCheck1 -- No --> RedirectLogin[\Prompt Sign In as Job Seeker/]
    UserRoleCheck1 -- Yes --> SendSaveReq[Send POST /api/v1/saved-jobs/:job_id]
    SendSaveReq --> CheckDbDuplicate{Record Already in saved_jobs?}
    CheckDbDuplicate -- Yes --> ReturnDupErr[\Show 'Job already saved' message/]
    CheckDbDuplicate -- No --> InsertSavedJob[Insert Record into saved_jobs table]
    InsertSavedJob --> ShowSavedSuccess[\Show 'Job saved!' Toast & Fill Bookmark Icon/]

    ClickBookmarkBtn -- Already Bookmarked --> SendRemoveReq[Send DELETE /api/v1/saved-jobs/:job_id]
    SendRemoveReq --> DeleteSavedJob[Delete Record from saved_jobs table]
    DeleteSavedJob --> ShowRemovedSuccess[\Show 'Removed from saved jobs.' Toast & Outline Icon/]
    
    ShowSavedSuccess --> DoneBookmark([Bookmark Updated])
    ShowRemovedSuccess --> DoneBookmark
```

#### 3.5.2 In-App Notifications Workflow
```mermaid
flowchart TD
    StartNotif([User Opens Portal]) --> FetchUnread[Query Unread Notifications Count]
    FetchUnread --> HasUnread{Unread Count > 0?}
    HasUnread -- Yes --> ShowBadge[\Render Visual Badge on Bell Icon in Navbar/]
    HasUnread -- No --> ShowPlainBell[\Render Clean Bell Icon without Badge/]

    ShowBadge --> ClickBell[\User Clicks Notification Bell or Opens /notifications/]
    ShowPlainBell --> ClickBell
    ClickBell --> RenderList[\Display Chronological Notification List/]
    RenderList --> UserActionChoice{User Action}
    
    UserActionChoice -- Click Notification Item --> ReadItem[Navigate to Target Link /dashboard]
    UserActionChoice -- Click 'Mark all as read' --> SendMarkRead[Send PUT /api/v1/notifications/read]
    SendMarkRead --> UpdateDbRead[Update notifications SET is_read = true WHERE user_id = current_user]
    UpdateDbRead --> ClearBadge[\Clear Unread Counter & Badge to 0/]
    ClearBadge --> DoneNotif([Notifications Updated])
```

#### 3.5.3 Candidate Recommendation & Two-Tier Ranking Workflow
```mermaid
flowchart TD
    StartRec([Employer Views Candidate Recommendations]) --> GatherTargetCriteria[\Identify Employer Location & Active Job Skills/]
    GatherTargetCriteria --> QueryActiveSeekers[Fetch Active Job Seekers from Database]
    
    QueryActiveSeekers --> LoopCandidate[For Each Candidate in Database]
    LoopCandidate --> CalcSkillScore[Calculate Skill Match Score: 0.0 to 70.0 Points Exact Token Overlap]
    CalcSkillScore --> CalcGeoScore[Calculate Geographic Distance Score: 0.0 to 30.0 Points]
    CalcGeoScore --> SumTotal[Total Score = Skill Score + Geographic Score]

    SumTotal --> TierClassification{Total Score > 0?}
    TierClassification -- Yes --> PutTier1[Assign to Tier 1: Qualified Candidates]
    TierClassification -- No --> PutTier2[Assign to Tier 2: General Candidate Pool]

    PutTier1 --> SortTier1[Sort Tier 1 by Total Score DESC, then Full Name ASC]
    PutTier2 --> SortTier2[Sort Tier 2 Alphabetically by Full Name ASC]

    SortTier1 --> CombineResults[Concatenate Tier 1 + Tier 2]
    SortTier2 --> CombineResults
    CombineResults --> SanitizeProfiles[Sanitize Profiles: Strip Phone Numbers & Email Addresses]
    SanitizeProfiles --> DisplayRankedCandidates[\Render Ranked Candidate Cards in Employer UI/]
    DisplayRankedCandidates --> EndRec([Recommendations Displayed])
```

#### 3.5.4 Administrative User Moderation & Oversight Workflow
```mermaid
flowchart TD
    StartAdmin([Administrator Opens /admin]) --> CheckAdminCookie{Valid 'batanes_admin_session' Cookie?}
    CheckAdminCookie -- No --> ShowAdminLogin[\Display Server-Rendered Jinja2 Login Form/]
    ShowAdminLogin --> EnterAdminCreds[\Enter Admin Username & Password/]
    EnterAdminCreds --> VerifyAdmin[Verify Role == 'admin' & Password Hash]
    VerifyAdmin -- Invalid --> AdminLoginErr[\Display 'Invalid administrator credentials' Banner/]
    AdminLoginErr --> ShowAdminLogin
    VerifyAdmin -- Valid --> SetAdminCookies[Set HttpOnly Session Cookie & CSRF Cookie]
    SetAdminCookies --> AdminDashboard[\Render Server-Side Admin Dashboard /admin/dashboard/]

    CheckAdminCookie -- Yes --> AdminDashboard
    AdminDashboard --> ChooseAdminTool{Choose Admin Module}

    %% User Moderation
    ChooseAdminTool -- User Moderation --> OpenUsersList[\Open /admin/users/]
    OpenUsersList --> SearchUsers[\Filter by Search Keyword, Role, or Account Status/]
    SearchUsers --> UserActionChoice{Select User Action}
    
    UserActionChoice -- Suspend Account --> PostSuspend[POST /admin/users/:id/suspend with CSRF Token]
    PostSuspend --> SetSuspended[UPDATE users SET account_status = 'suspended']
    SetSuspended --> InvalidateUserSessions[Revoke All Active Refresh Tokens for User]
    InvalidateUserSessions --> AuditSuspend[Append Record to audit_logs: USER_SUSPEND]
    AuditSuspend --> RedirectUsers[\Redirect to /admin/users with Success Notice/]

    UserActionChoice -- Restore Account --> PostRestore[POST /admin/users/:id/restore with CSRF Token]
    PostRestore --> SetActive[UPDATE users SET account_status = 'active']
    SetActive --> AuditRestore[Append Record to audit_logs: USER_RESTORE]
    AuditRestore --> RedirectUsers

    %% Job Moderation
    ChooseAdminTool -- Job Moderation --> OpenJobsList[\Open /admin/jobs/]
    OpenJobsList --> FilterJobs[\Filter Listings by Status/]
    FilterJobs --> JobActionChoice{Job Action?}
    JobActionChoice -- Disable Job --> PostDisableJob[POST /admin/jobs/:id/disable with CSRF Token]
    PostDisableJob --> SetJobClosed[UPDATE jobs SET status = 'closed', deleted_at = now()]
    SetJobClosed --> AuditJobDisable[Append Record to audit_logs: JOB_DISABLED]
    AuditJobDisable --> RedirectJobs[\Redirect to /admin/jobs with Notice/]

    %% Audit Logs & Error Reports
    ChooseAdminTool -- Review Audit Logs --> OpenAuditLogs[\Open /admin/audit-logs: Inspect Actor, Action, IP, Timestamps/]
    ChooseAdminTool -- Inspect Errors --> OpenErrorReports[\Open /admin/error-reports: Inspect Scrubbed 500 Stack Traces/]

    RedirectUsers --> AdminDashboard
    RedirectJobs --> AdminDashboard
    OpenAuditLogs --> AdminDashboard
    OpenErrorReports --> AdminDashboard
    AdminDashboard --> AdminSignOut([Sign Out: Clear Session Cookie])
```

---

## 4. Flowchart 3: Complete Multi-Tier System Flow

> [!NOTE]
> This comprehensive flowchart models the end-to-end technical architecture. It demonstrates how user gestures propagate through the frontend SPA, cross the network boundary via Axios, trigger FastAPI route controllers and dependency guards, invoke domain services and repositories, execute SQL transactions, and return structured JSON responses that update reactive frontend state.

```mermaid
flowchart TD
    %% Layer Definitions
    subgraph ClientLayer ["1. CLIENT TIER (Browser & React 18 SPA)"]
        UserGesture[\User Interaction: Click, Form Input, Navigation/]
        PageComponent["Page Component (e.g. JobDetailPage, RegisterPage)"]
        StateHandler["State & Event Handlers (useState, useEffect, useAuth)"]
        ApiClient["Axios API Client (frontend/src/api/client.ts)"]
        RequestInterceptor["Request Interceptor: Injects Authorization: Bearer <access_token>"]
    end

    subgraph NetworkBoundary ["2. NETWORK & HTTP GATEWAY"]
        HttpRequest["HTTP Request: JSON Body / Headers / Cookies"]
        SecurityHeaders["Security Headers Middleware (nosniff, DENY, HSTS)"]
        LoggingMiddleware["StructuredLoggingMiddleware (Request ID, IP, Latency)"]
        RateLimiter{"SlowAPI Limiter: Rate Limit Exceeded?"}
    end

    subgraph BackendApiLayer ["3. FASTAPI PRESENTATION TIER (backend/app/api/)"]
        RouterEntry["APIRouter Dispatcher (app/api/v1/)"]
        DepInjection["Dependency Injection (app/api/deps.py)"]
        AuthGuard{"require_authenticated: Valid JWT & Not in revoked_tokens?"}
        RoleGuard{"Role Guard: require_job_seeker / require_employer / require_admin?"}
        PydanticValidation{"Pydantic Schema Validation (app/schemas/)"}
    end

    subgraph DomainServiceLayer ["4. DOMAIN SERVICE TIER (backend/app/services/)"]
        ServiceDispatcher["Domain Service (Auth, Job, Application, Recommendation)"]
        BusinessValidation{"Domain Rules & Invariant Validation"}
        GeographyCheck["GeographyService: Canonical Location Validation"]
        TxnCoordinator["Transaction Boundary Coordinator"]
    end

    subgraph RepositoryOrmLayer ["5. DATA ACCESS & ORM TIER (backend/app/repositories/)"]
        RepositoryMethod["Repository (UserRepository, JobRepository, ApplicationRepository)"]
        SqlAlchemyOrm["SQLAlchemy 2.0 ORM Entity (Mapped Model)"]
        DbSession["SQLAlchemy db.Session (Unit of Work)"]
    end

    subgraph PersistenceLayer ["6. DATABASE PERSISTENCE TIER (Relational Storage)"]
        SqlExecution["SQL Statements (SELECT, INSERT, UPDATE, DELETE)"]
        DbConstraints{"Database Constraints Checked (PK, FK, UNIQUE, CHECK)"}
        CommitRollback["Commit Transaction / Rollback on Exception"]
        PhysicalDb[("Relational Database: SQLite / PostgreSQL")]
    end

    subgraph ClientUpdateLayer ["7. RESPONSE & REACTIVE UI UPDATE TIER"]
        PydanticSerialization["Pydantic Response Model Serialization"]
        HttpResponse["HTTP Response (200, 201, 400, 401, 403, 404, 429)"]
        ResponseInterceptor{"Response Interceptor: Status 401 & Stored Refresh Token?"}
        TokenRefreshLoop["Call /auth/refresh -> Update In-Memory Token -> Replay Request"]
        StateUpdate["React State Update (setState, AuthContext Provider)"]
        ToastTrigger["Toast Alert Notification (toastSuccess, toastError)"]
        DomRender[\DOM Re-render: Updated View Presented to User/]
    end

    %% Execution Connections
    UserGesture --> PageComponent
    PageComponent --> StateHandler
    StateHandler --> ApiClient
    ApiClient --> RequestInterceptor
    RequestInterceptor --> HttpRequest

    HttpRequest --> SecurityHeaders
    SecurityHeaders --> LoggingMiddleware
    LoggingMiddleware --> RateLimiter
    RateLimiter -- Yes --> Return429[Return HTTP 429 Too Many Requests]
    Return429 --> HttpResponse
    RateLimiter -- No --> RouterEntry

    RouterEntry --> DepInjection
    DepInjection --> AuthGuard
    AuthGuard -- Invalid / Revoked --> Return401[Return HTTP 401 Unauthorized]
    Return401 --> HttpResponse
    AuthGuard -- Valid --> RoleGuard
    RoleGuard -- Forbidden Role --> Return403[Return HTTP 403 Forbidden]
    Return403 --> HttpResponse
    RoleGuard -- Authorized --> PydanticValidation

    PydanticValidation -- Invalid Schema --> Return422[Return HTTP 422 Unprocessable Entity]
    Return422 --> HttpResponse
    PydanticValidation -- Valid Schema --> ServiceDispatcher

    ServiceDispatcher --> BusinessValidation
    BusinessValidation -- Invariant Violated --> ThrowHttpErr[Raise HTTPException 400 Bad Request]
    ThrowHttpErr --> HttpResponse
    BusinessValidation -- Valid --> GeographyCheck
    GeographyCheck --> TxnCoordinator

    TxnCoordinator --> RepositoryMethod
    RepositoryMethod --> SqlAlchemyOrm
    SqlAlchemyOrm --> DbSession
    DbSession --> SqlExecution
    SqlExecution --> DbConstraints
    DbConstraints -- Constraint Violated --> RollbackErr[Rollback & Raise Database Error]
    RollbackErr --> HttpResponse
    DbConstraints -- Passed --> CommitRollback
    CommitRollback --> PhysicalDb
    PhysicalDb --> CommitRollback
    CommitRollback --> PydanticSerialization

    PydanticSerialization --> HttpResponse
    HttpResponse --> ResponseInterceptor
    ResponseInterceptor -- Yes --> TokenRefreshLoop
    TokenRefreshLoop --> RequestInterceptor
    ResponseInterceptor -- No --> StateUpdate
    StateUpdate --> ToastTrigger
    ToastTrigger --> DomRender
```

---

## 5. Next Steps & Cross-References

- To look up the exact files, components, and services to edit for any specific feature, consult [**21-Developer-Architecture-Guide.md**](./21-Developer-Architecture-Guide.md).
- To examine low-level database table definitions, foreign keys, and ERD structures, see [**04-Database-and-ERD.md**](./04-Database-and-ERD.md).
- To inspect REST API endpoints and JSON contract schemas, see [**05-API-Architecture.md**](./05-API-Architecture.md).
- For complete coverage of the recommendation algorithm mathematical formulas, see [**09-Recommendation-Engine.md**](./09-Recommendation-Engine.md).
- For operational runbooks and testing instructions, see [**17-Developer-Guide.md**](./17-Developer-Guide.md).
