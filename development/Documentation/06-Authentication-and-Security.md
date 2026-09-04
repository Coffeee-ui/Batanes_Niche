# 06 - Authentication and Security

## 1. Cryptographic Security Standards

Security in the **Batanes Niche Job Portal** is engineered with zero trust in client inputs and strict cryptographic standards across passwords, tokens, session cookies, and temporary credentials.

### Cryptographic Primitives

| Component | Primitive / Algorithm | Parameters / Work Factor | Storage Format |
|---|---|---|---|
| **User Passwords** | bcrypt | Work factor (salt rounds) = 12 | Modular Crypt Format (`$2b$12$...`) in `users.password_hash` |
| **Access Tokens** | HMAC-SHA256 (HS256) | High-entropy 64+ char secret key | Signed JWT string passed via `Authorization: Bearer` |
| **Refresh Tokens** | Raw: CSPRNG 32-byte URL-safe<br/>Stored: SHA-256 | `secrets.token_urlsafe(32)`<br/>`hashlib.sha256()` | 64-character lowercase hex digest in `refresh_tokens.token_hash` |
| **Password Reset OTP** | Raw: CSPRNG 6-digit numeric<br/>Stored: bcrypt | `secrets.randbelow(900000) + 100000`<br/>Work factor = 10 | Modular Crypt Format in `password_reset_tokens.otp_hash` |
| **Admin Session Cookie** | Itsdangerous Serializer | HMAC-SHA1 signed + timestamped | Signed cookie `batanes_admin_session` |
| **Admin CSRF Token** | CSPRNG 32-byte hex | `secrets.token_hex(32)` | Double-submit cookie `batanes_admin_csrf` |

---

## 2. JWT Access Token Architecture

Access tokens are short-lived, stateless credentials issued upon successful login or refresh token exchange.

### JWT Structure & Claims
```json
{
  "sub": "42",
  "username": "ivatan_guide",
  "role": "job_seeker",
  "jti": "550e8400-e29b-41d4-a716-446655440000",
  "iat": 1725450000,
  "exp": 1725450900
}
```

- `sub`: Subject ID (User ID as a string).
- `username`: Public username handle.
- `role`: Role claim (`job_seeker`, `employer`, `admin`).
- `jti`: JWT ID (UUIDv4) uniquely identifying the token instance. Enables immediate revocation upon logout.
- `iat`: Issued At timestamp (Unix epoch).
- `exp`: Expiration timestamp (15 minutes from issuance).

### Validation Pipeline (`backend/app/api/deps.py`)
1. Extract token from `Authorization: Bearer <token>` header.
2. Decode and verify signature with `JWT_SECRET_KEY` and `HS256`.
3. Verify `exp` claim against current UTC time.
4. Check whether `jti` exists in the `revoked_tokens` table. If present, immediately reject with `HTTP 401 Unauthorized`.
5. Retrieve user entity by `sub` (User ID). Verify `account_status == 'active'`. If suspended, immediately reject with `HTTP 403 Forbidden`.

---

## 3. Stateful Refresh Token Rotation & Reuse Detection

The system pairs short-lived stateless access tokens with **stateful rotating refresh tokens** stored in `refresh_tokens`.

### Rotation Lifecycle
1. When `/api/v1/auth/refresh` is called, the client provides the raw refresh token.
2. The server computes `hashlib.sha256(raw_token).hexdigest()` and queries `refresh_tokens`.
3. If not found or expired: Return `HTTP 401 Unauthorized`.
4. **Compromise Detection Rule**:
   - If the stored token record has `revoked == True`, an attacker or stale client is attempting to reuse an already-rotated token.
   - The server **immediately revokes all active refresh tokens** for that user (`TokenRepository.revoke_all_user_refresh_tokens`).
   - Appends an audit log: `REFRESH_TOKEN_COMPROMISE_DETECTED`.
   - Returns `HTTP 401 Unauthorized: Refresh token reuse detected. All sessions terminated for security.`
5. If the token is valid and unrevoked:
   - Mark current token `revoked = True`.
   - Generate a new 32-byte raw refresh token and compute its SHA-256 hash.
   - Insert new `refresh_tokens` record with 7-day expiration.
   - Issue new 15-minute JWT access token.
   - Return both to client.

---

## 4. Immediate Token Revocation & JTI Blacklisting

Standard stateless JWTs cannot be revoked until natural expiration without a revocation index. The Batanes Niche Portal solves this via the `revoked_tokens` table:

- Upon calling `/api/v1/auth/logout`:
  1. The access token's `jti` is inserted into `revoked_tokens` along with its expiration timestamp.
  2. The active refresh token is marked `revoked = True`.
- During every authenticated request, `get_current_user` performs an indexed O(1) check on `revoked_tokens.jti`. If found, the request is immediately rejected.
- Expired rows in `revoked_tokens` can be pruned safely after their `expires_at` date without compromising security.

---

## 5. Password Reset via 6-Digit Email OTP

Password recovery avoids long, error-prone token links in favor of an auditable, brute-force-resistant 6-digit OTP protocol.

### Step 1: Request Password Reset (`/api/v1/auth/forgot-password`)
- Client submits `{ "email": "user@example.com" }`.
- Server performs lookup. If the user does not exist or is suspended:
  - **Zero-Enumeration Guarantee**: Returns generic `{"detail": "If your account is registered, a 6-digit reset code has been sent to your email."}` without revealing user existence.
- If user exists and is active:
  - Invalidates any existing unexpired reset tokens for this user (`used = True`).
  - Generates a 6-digit numeric code: `secrets.randbelow(900000) + 100000`.
  - Computes bcrypt hash of the OTP (`hash_otp(plain_otp)`).
  - Inserts `password_reset_tokens` record with `expires_at = now() + 15 minutes` and `attempts_count = 0`.
  - Dispatches OTP email via `EmailDeliveryService.send_otp_email()`.

### Step 2: Verify OTP & Reset Password (`/api/v1/auth/reset-password`)
- Client submits `{ "email": "...", "otp_code": "123456", "new_password": "..." }`.
- Server retrieves the latest active token for the email.
- Verifies `verify_otp(plain_otp, stored_hash)`.
- If OTP does **not** match:
  - Increments `attempts_count` in database.
  - If `attempts_count >= 5`: Permanently invalidates the token and returns `HTTP 400: Too many failed attempts. This reset code has been invalidated.`
  - Else returns `HTTP 400: Invalid or expired reset code.`
- If OTP matches:
  - Executes an **Atomic Transaction Boundary**:
    1. Updates `user.password_hash` with bcrypt hash of `new_password`.
    2. Sets `reset_token.used = True`.
    3. Revokes all active refresh tokens for the user in `refresh_tokens`.
    4. Records an audit event: `PASSWORD_RESET_COMPLETE`.
    5. Commits transaction.

---

## 6. Account Suspension Enforcement

When an administrator suspends an account (`account_status = 'suspended'`):
1. The user's active refresh tokens are revoked.
2. Any subsequent attempt to authenticate via `/api/v1/auth/login` returns `HTTP 403 Forbidden`.
3. Any subsequent attempt to rotate tokens via `/api/v1/auth/refresh` returns `HTTP 401 Unauthorized`.
4. Any API request presenting an access token belonging to a suspended user is rejected during dependency validation (`HTTP 403 Forbidden`).
5. In the Jinja2 admin interface, any active session for a suspended user is rejected upon page load.

---

## 7. Applicant Contact Information Privacy Model

To protect Ivatan job seekers from unsolicited contact and identity harvesting:
- The public candidate search directory (`/api/v1/users/job-seekers`) returns only **sanitized summaries**:
  - Full name, municipality, island, barangay, skills, education, experience years, bio, avatar URL.
  - **Strictly Omitted**: `email`, `phone_number`, `username`.
- **Contact Reveal Authorization**:
  - A seeker's email and phone number are revealed to an employer **only when the seeker voluntarily submits an application** to a job listing owned by that employer (`/api/v1/applications`).
  - The `ApplicationService._to_employer_application_out` method constructs the authorized profile only after verifying employer job ownership.

---

## 8. Sensitive Data Redaction in Logging & Errors

All audit events and unhandled 500 error logs pass through automatic recursive scrubbing:
- Any dictionary key or string containing substrings `password`, `token`, `otp`, `secret`, `hash` is replaced with `[REDACTED]`.
- Request bodies captured in `error_reports` are heuristically scrubbed to prevent password or session token persistence.

---

## 9. Mermaid Authentication & Security Sequence Diagrams

### 9.1 User Login & Token Issuance

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser / React SPA
    participant API as FastAPI Router (/api/v1/auth/login)
    participant AuthSvc as AuthService
    participant UserRepo as UserRepository
    participant TokenRepo as TokenRepository
    participant DB as Relational Database

    User->>API: POST /api/v1/auth/login {username_or_email, password}
    API->>AuthSvc: authenticate_user(db, login_data)
    AuthSvc->>UserRepo: get_by_username_or_email(db, identifier)
    UserRepo->>DB: SELECT * FROM users WHERE ...
    DB-->>UserRepo: user record
    UserRepo-->>AuthSvc: user record

    AuthSvc->>AuthSvc: verify_password(password, user.password_hash)
    alt Invalid Password
        AuthSvc-->>API: raise HTTPException(401, "Invalid credentials.")
        API-->>User: HTTP 401 Unauthorized
    else Account Suspended
        AuthSvc-->>API: raise HTTPException(403, "Account suspended.")
        API-->>User: HTTP 403 Forbidden
    else Valid Credentials
        AuthSvc->>AuthSvc: create_access_token(sub=user.id, role=user.role)
        AuthSvc->>AuthSvc: generate_refresh_token() -> raw_token, token_hash
        AuthSvc->>TokenRepo: create_refresh_token(db, user.id, token_hash)
        TokenRepo->>DB: INSERT INTO refresh_tokens ...
        DB-->>TokenRepo: ok
        AuthSvc-->>API: Token(access_token, refresh_token)
        API-->>User: HTTP 200 OK {access_token, refresh_token, role}
    end
```

### 9.2 Refresh Token Rotation & Compromise Detection

```mermaid
sequenceDiagram
    autonumber
    actor Client as React SPA (Axios Interceptor)
    participant API as FastAPI Router (/api/v1/auth/refresh)
    participant AuthSvc as AuthService
    participant TokenRepo as TokenRepository
    participant AuditSvc as AuditService
    participant DB as Relational Database

    Client->>API: POST /api/v1/auth/refresh {refresh_token: raw_token}
    API->>AuthSvc: rotate_refresh_token(db, raw_token)
    AuthSvc->>AuthSvc: token_hash = sha256(raw_token)
    AuthSvc->>TokenRepo: get_refresh_token_by_hash(db, token_hash)
    TokenRepo->>DB: SELECT * FROM refresh_tokens WHERE token_hash = ...
    DB-->>TokenRepo: stored_token

    alt Stored Token is Revoked (Compromise / Reuse Detected)
        AuthSvc->>TokenRepo: revoke_all_user_refresh_tokens(db, user_id)
        TokenRepo->>DB: UPDATE refresh_tokens SET revoked = True WHERE user_id = ...
        AuthSvc->>AuditSvc: log_event("REFRESH_TOKEN_COMPROMISE_DETECTED")
        AuditSvc->>DB: INSERT INTO audit_logs ...
        AuthSvc-->>API: raise HTTPException(401, "Refresh token reuse detected.")
        API-->>Client: HTTP 401 Unauthorized
    else Stored Token Expired
        AuthSvc->>TokenRepo: revoke_refresh_token(db, stored_token)
        AuthSvc-->>API: raise HTTPException(401, "Refresh token expired.")
        API-->>Client: HTTP 401 Unauthorized
    else Valid Active Token
        AuthSvc->>TokenRepo: revoke_refresh_token(db, stored_token)
        TokenRepo->>DB: UPDATE refresh_tokens SET revoked = True WHERE id = ...
        AuthSvc->>AuthSvc: Issue new access JWT & new raw refresh token
        AuthSvc->>TokenRepo: create_refresh_token(db, user_id, new_token_hash)
        TokenRepo->>DB: INSERT INTO refresh_tokens ...
        AuthSvc-->>API: Token(new_access_token, new_refresh_token)
        API-->>Client: HTTP 200 OK {access_token, refresh_token}
    end
```

### 9.3 User Logout & JTI Revocation

```mermaid
sequenceDiagram
    autonumber
    actor Client as Authenticated Client
    participant API as FastAPI Router (/api/v1/auth/logout)
    participant AuthSvc as AuthService
    participant TokenRepo as TokenRepository
    participant DB as Relational Database

    Client->>API: POST /api/v1/auth/logout (Bearer access_token, body: {refresh_token})
    API->>AuthSvc: logout(db, current_user, jti, refresh_token)
    
    opt If Refresh Token Provided
        AuthSvc->>TokenRepo: revoke_refresh_token(db, sha256(refresh_token))
        TokenRepo->>DB: UPDATE refresh_tokens SET revoked = True ...
    end

    opt If Access Token JTI Present
        AuthSvc->>TokenRepo: add_revoked_jti(db, jti, expires_at)
        TokenRepo->>DB: INSERT INTO revoked_tokens (jti, expires_at) VALUES (...)
    end

    AuthSvc-->>API: ok
    API-->>Client: HTTP 200 OK {"detail": "Successfully logged out."}
```

### 9.4 Password Reset Flow (Zero-Enumeration 6-Digit OTP)

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant API as FastAPI Router
    participant AuthSvc as AuthService
    participant UserRepo as UserRepository
    participant ResetRepo as PasswordResetRepository
    participant EmailSvc as EmailDeliveryService
    participant SMTP as SMTP Mail Server
    participant DB as Relational Database

    %% Request OTP
    User->>API: POST /api/v1/auth/forgot-password {email}
    API->>AuthSvc: request_password_reset(db, email)
    AuthSvc->>UserRepo: get_by_email(db, email)
    UserRepo->>DB: SELECT * FROM users WHERE email = ...
    DB-->>UserRepo: user record or None

    alt User Not Found or Suspended
        AuthSvc-->>API: return (silent)
        API-->>User: HTTP 200 OK {"detail": "If registered, reset code has been sent."}
    else Active User Found
        AuthSvc->>ResetRepo: invalidate_active_tokens_for_user(db, user.id)
        AuthSvc->>AuthSvc: plain_otp = generate_six_digit_otp()
        AuthSvc->>AuthSvc: hashed_otp = hash_otp(plain_otp)
        AuthSvc->>ResetRepo: create_token(user_id, email, hashed_otp, exp=15m)
        ResetRepo->>DB: INSERT INTO password_reset_tokens ...
        AuthSvc->>EmailSvc: send_otp_email(email, plain_otp)
        EmailSvc->>SMTP: Dispatch email with plain 6-digit OTP
        AuthSvc-->>API: return
        API-->>User: HTTP 200 OK {"detail": "If registered, reset code has been sent."}
    end

    %% Submit OTP & New Password
    User->>API: POST /api/v1/auth/reset-password {email, otp_code, new_password}
    API->>AuthSvc: reset_password(db, email, otp_code, new_password)
    AuthSvc->>ResetRepo: get_latest_active_by_identifier(db, email)
    ResetRepo->>DB: SELECT * FROM password_reset_tokens WHERE ...
    DB-->>ResetRepo: reset_token

    AuthSvc->>AuthSvc: verify_otp(otp_code, reset_token.otp_hash)
    alt OTP Mismatch
        AuthSvc->>ResetRepo: increment_attempts(db, reset_token)
        alt attempts >= 5
            AuthSvc-->>API: raise HTTPException(400, "Too many failed attempts. Code invalidated.")
        else attempts < 5
            AuthSvc-->>API: raise HTTPException(400, "Invalid or expired reset code.")
        end
        API-->>User: HTTP 400 Bad Request
    else OTP Verified
        AuthSvc->>DB: BEGIN TRANSACTION
        AuthSvc->>DB: UPDATE users SET password_hash = bcrypt(new_password) ...
        AuthSvc->>DB: UPDATE password_reset_tokens SET used = True ...
        AuthSvc->>DB: UPDATE refresh_tokens SET revoked = True WHERE user_id = ...
        AuthSvc->>DB: INSERT INTO audit_logs (action="PASSWORD_RESET_COMPLETE") ...
        AuthSvc->>DB: COMMIT TRANSACTION
        AuthSvc-->>API: return
        API-->>User: HTTP 200 OK {"detail": "Password has been successfully reset."}
    end
```

---

## 10. Next Steps

- For role capabilities and RBAC authorization matrices, see [**07-User-Roles-and-Permissions.md**](./07-User-Roles-and-Permissions.md).
- For operational business flowcharts, see [**08-Business-Workflows.md**](./08-Business-Workflows.md).
- For Jinja2 admin session security and CSRF defense, see [**11-Administrative-UI.md**](./11-Administrative-UI.md).
