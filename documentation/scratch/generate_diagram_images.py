"""
Generate high-resolution PNG and SVG diagrams for Batanes Niche Job Portal v2.0
"""

import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

OUT_DIR = r"c:\Users\Jonathea Gabotero\Documents\GitHub\Batanes_Niche\documentation\diagrams"
ADD_DIR = os.path.join(OUT_DIR, "additional-diagrams")
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(ADD_DIR, exist_ok=True)

# 1. System Architecture Diagram
def draw_system_architecture():
    fig, ax = plt.subplots(figsize=(14, 10), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    plt.title("Figure 6.1: Batanes Niche Job Portal – Four-Tier System Architecture", 
              fontsize=16, fontweight='bold', pad=20, color='#0D47A1')

    # Tier 1: Client Tier
    ax.add_patch(patches.FancyBboxPatch((5, 82), 90, 12, boxstyle="round,pad=1", fc="#E3F2FD", ec="#1976D2", lw=2))
    ax.text(50, 91, "1. CLIENT PRESENTATION TIER", ha='center', va='center', fontsize=12, fontweight='bold', color="#0D47A1")
    ax.text(25, 85.5, "Job Seekers / Employers\n(Desktop / Mobile Web Browser)", ha='center', va='center', fontsize=10, color="#1A237E")
    ax.text(75, 85.5, "Platform Administrators\n(Administrative Browser Session)", ha='center', va='center', fontsize=10, color="#1A237E")

    # Arrows 1 -> 2
    ax.annotate("", xy=(30, 68), xytext=(30, 81), arrowprops=dict(arrowstyle="->", lw=2, color="#1565C0"))
    ax.text(31, 74.5, "HTTPS + Bearer JWT\n(REST API Calls)", fontsize=9, color="#0D47A1", va='center')

    ax.annotate("", xy=(70, 68), xytext=(70, 81), arrowprops=dict(arrowstyle="->", lw=2, color="#C2185B"))
    ax.text(71, 74.5, "HTTPS Form Posts\n(Signed Session Cookie)", fontsize=9, color="#880E4F", va='center')

    # Tier 2: Frontend & Admin SSR Tier
    ax.add_patch(patches.FancyBboxPatch((5, 54), 42, 14, boxstyle="round,pad=1", fc="#E8F5E9", ec="#388E3C", lw=2))
    ax.text(26, 64, "React 18 SPA (Vercel CDN)", ha='center', va='center', fontsize=11, fontweight='bold', color="#1B5E20")
    ax.text(26, 58, "Vite 5.3+ | TypeScript | Tailwind CSS 3.4\nAxios Client (In-Memory JWT & Refresh)", ha='center', va='center', fontsize=9, color="#2E7D32")

    ax.add_patch(patches.FancyBboxPatch((53, 54), 42, 14, boxstyle="round,pad=1", fc="#FCE4EC", ec="#D81B60", lw=2))
    ax.text(74, 64, "Admin SSR Portal (/admin)", ha='center', va='center', fontsize=11, fontweight='bold', color="#880E4F")
    ax.text(74, 58, "Nunjucks 3.2 Server-Rendered Views\nHMAC-SHA256 Session Cookie + CSRF Tokens", ha='center', va='center', fontsize=9, color="#AD1457")

    # Arrows 2 -> 3
    ax.annotate("", xy=(35, 41), xytext=(26, 53), arrowprops=dict(arrowstyle="->", lw=2, color="#2E7D32"))
    ax.annotate("", xy=(65, 41), xytext=(74, 53), arrowprops=dict(arrowstyle="->", lw=2, color="#AD1457"))

    # Tier 3: Application Server Tier (Render)
    ax.add_patch(patches.FancyBboxPatch((5, 23), 90, 18, boxstyle="round,pad=1", fc="#FFF3E0", ec="#F57C00", lw=2))
    ax.text(50, 38, "3. APPLICATION SERVER TIER – Node.js 20+ / Express.js 4.19 (Render Cloud)", ha='center', va='center', fontsize=12, fontweight='bold', color="#E65100")
    
    # Sub-boxes inside backend
    ax.add_patch(patches.Rectangle((7, 25), 26, 10, fc="#FFE0B2", ec="#FB8C00", lw=1))
    ax.text(20, 32, "Middleware Pipeline", ha='center', va='center', fontsize=9, fontweight='bold', color="#BF360C")
    ax.text(20, 28, "Helmet | CORS Whitelist\nRateLimit | ErrorHandler", ha='center', va='center', fontsize=8, color="#5D4037")

    ax.add_patch(patches.Rectangle((37, 25), 26, 10, fc="#FFE0B2", ec="#FB8C00", lw=1))
    ax.text(50, 32, "Domain Services", ha='center', va='center', fontsize=9, fontweight='bold', color="#BF360C")
    ax.text(50, 28, "Auth | Job | Application\nRecommendation (70/30)", ha='center', va='center', fontsize=8, color="#5D4037")

    ax.add_patch(patches.Rectangle((67, 25), 26, 10, fc="#FFE0B2", ec="#FB8C00", lw=1))
    ax.text(80, 32, "Persistence Access", ha='center', va='center', fontsize=9, fontweight='bold', color="#BF360C")
    ax.text(80, 28, "Prisma ORM 5.15 Client\n12-Table Repositories", ha='center', va='center', fontsize=8, color="#5D4037")

    # Arrows 3 -> 4
    ax.annotate("", xy=(50, 13), xytext=(50, 22), arrowprops=dict(arrowstyle="->", lw=2, color="#E65100"))
    ax.text(52, 17.5, "Prisma TCP Client Connection (Port 6543)", fontsize=9, color="#BF360C")

    # Tier 4: Database Tier
    ax.add_patch(patches.FancyBboxPatch((15, 2), 70, 10, boxstyle="round,pad=1", fc="#EDE7F6", ec="#512DA8", lw=2))
    ax.text(50, 8.5, "4. DATABASE PERSISTENCE TIER", ha='center', va='center', fontsize=11, fontweight='bold', color="#311B92")
    ax.text(50, 4.5, "PostgreSQL 16 (Supabase Managed - Singapore) / SQLite (Dev Mode)\nPgBouncer Pooler (:6543) | Direct Migration Connection (:5432)", ha='center', va='center', fontsize=9, color="#4527A0")

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, "system-architecture.png"), dpi=300)
    plt.savefig(os.path.join(OUT_DIR, "system-architecture.svg"))
    plt.close()
    print("Generated system-architecture.png & .svg")

# 2. Database ERD Diagram
def draw_database_erd():
    fig, ax = plt.subplots(figsize=(15, 11), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    plt.title("Figure 8.1: Batanes Niche Job Portal – Entity Relationship Diagram (12 Tables)", 
              fontsize=16, fontweight='bold', pad=20, color='#0D47A1')

    def entity_box(x, y, w, h, title, fields, color="#E3F2FD", border="#1976D2"):
        ax.add_patch(patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.5", fc=color, ec=border, lw=1.5))
        ax.text(x + w/2, y + h - 2, title, ha='center', va='center', fontsize=10, fontweight='bold', color="#0D47A1")
        ax.plot([x, x + w], [y + h - 4, y + h - 4], color=border, lw=1)
        fy = y + h - 6.5
        for f in fields:
            ax.text(x + 1, fy, f, ha='left', va='center', fontsize=7.5, color="#1A237E")
            fy -= 2.2

    # Entities
    entity_box(38, 62, 24, 34, "users (Core Entity)", [
        "PK id (Int)",
        "UK username (String)",
        "UK email (String)",
        "password_hash (String)",
        "full_name (String)",
        "phone_number (String?)",
        "municipality (String)",
        "barangay (String?)",
        "role (seeker/employer/admin)",
        "account_status (active/susp)",
        "created_at (DateTime)"
    ], color="#E8EAF6", border="#3F51B5")

    entity_box(5, 78, 26, 18, "employer_profiles", [
        "PK/FK user_id (Int)",
        "company_name (String)",
        "company_address (String)",
        "company_description (String?)",
        "business_type (String)"
    ], color="#E1F5FE", border="#0288D1")

    entity_box(5, 54, 26, 18, "job_seeker_profiles", [
        "PK/FK user_id (Int)",
        "bio (String?)",
        "education (String?)",
        "experience_years (Int)",
        "resume_url (String?)"
    ], color="#E1F5FE", border="#0288D1")

    entity_box(72, 66, 24, 28, "jobs", [
        "PK id (Int)",
        "FK employer_id (Int)",
        "title (String)",
        "municipality (String)",
        "barangay (String?)",
        "salary_min / max (Decimal)",
        "employment_type (String)",
        "required_skills (String)",
        "status (active/closed)",
        "created_at / deleted_at"
    ], color="#E8F5E9", border="#388E3C")

    entity_box(72, 34, 24, 24, "applications", [
        "PK id (Int)",
        "FK job_id (Int)",
        "FK seeker_id (Int)",
        "cover_letter (String?)",
        "resume_url (String?)",
        "status (pending/acc/rej)",
        "created_at (DateTime)",
        "UK (job_id, seeker_id)"
    ], color="#FFF9C4", border="#FBC02D")

    entity_box(38, 36, 24, 18, "saved_jobs", [
        "PK id (Int)",
        "FK seeker_id (Int)",
        "FK job_id (Int)",
        "saved_at (DateTime)",
        "UK (seeker_id, job_id)"
    ], color="#FFFDE7", border="#FBC02D")

    entity_box(5, 30, 26, 18, "notifications", [
        "PK id (Int)",
        "FK user_id (Int)",
        "title (String)",
        "message (String)",
        "type (String)",
        "is_read (Boolean)",
        "created_at (DateTime)"
    ], color="#F3E5F5", border="#8E24AA")

    entity_box(5, 4, 26, 20, "refresh_tokens", [
        "PK id (Int)",
        "FK user_id (Int)",
        "UK token_hash (String)",
        "expires_at (DateTime)",
        "revoked (Boolean)",
        "created_at (DateTime)"
    ], color="#FFEBEE", border="#E53935")

    entity_box(38, 12, 24, 18, "password_reset_tokens", [
        "PK id (Int)",
        "FK user_id (Int)",
        "identifier (String)",
        "otp_hash (String)",
        "expires_at (DateTime)",
        "used (Boolean)",
        "attempts_count (Int)"
    ], color="#FFEBEE", border="#E53935")

    entity_box(72, 8, 24, 20, "audit_logs", [
        "PK id (Int)",
        "FK actor_id (Int?)",
        "actor_role (String)",
        "ip_address (String?)",
        "action (String)",
        "target_type (String?)",
        "target_id (Int?)",
        "details (String?)"
    ], color="#ECEFF1", border="#607D8B")

    # Relationships
    ax.annotate("", xy=(38, 86), xytext=(31, 86), arrowprops=dict(arrowstyle="<->", lw=1.5, color="#0288D1"))
    ax.annotate("", xy=(38, 64), xytext=(31, 64), arrowprops=dict(arrowstyle="<->", lw=1.5, color="#0288D1"))
    ax.annotate("", xy=(62, 78), xytext=(72, 78), arrowprops=dict(arrowstyle="<-", lw=1.5, color="#388E3C"))
    ax.annotate("", xy=(62, 70), xytext=(72, 46), arrowprops=dict(arrowstyle="<-", lw=1.5, color="#FBC02D"))
    ax.annotate("", xy=(84, 66), xytext=(84, 58), arrowprops=dict(arrowstyle="<-", lw=1.5, color="#FBC02D"))
    ax.annotate("", xy=(50, 62), xytext=(50, 54), arrowprops=dict(arrowstyle="<-", lw=1.5, color="#FBC02D"))
    ax.annotate("", xy=(38, 40), xytext=(31, 40), arrowprops=dict(arrowstyle="<-", lw=1.5, color="#8E24AA"))
    ax.annotate("", xy=(38, 18), xytext=(31, 18), arrowprops=dict(arrowstyle="<-", lw=1.5, color="#E53935"))
    ax.annotate("", xy=(50, 62), xytext=(50, 30), arrowprops=dict(arrowstyle="<-", lw=1.5, color="#E53935"))
    ax.annotate("", xy=(62, 64), xytext=(72, 22), arrowprops=dict(arrowstyle="<-", lw=1.5, color="#607D8B"))

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, "database-erd.png"), dpi=300)
    plt.savefig(os.path.join(OUT_DIR, "database-erd.svg"))
    plt.close()
    print("Generated database-erd.png & .svg")

# 3. Component Diagram
def draw_component_diagram():
    fig, ax = plt.subplots(figsize=(14, 9), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    plt.title("Figure 7.1: Batanes Niche Job Portal – System Component Diagram", 
              fontsize=16, fontweight='bold', pad=20, color='#0D47A1')

    # Frontend Components
    ax.add_patch(patches.FancyBboxPatch((3, 10), 28, 82, boxstyle="round,pad=1", fc="#E3F2FD", ec="#1976D2", lw=2))
    ax.text(17, 88, "FRONTEND SPA (React 18)", ha='center', va='center', fontsize=11, fontweight='bold', color="#0D47A1")
    
    fe_items = [
        "React Router v6",
        "AuthContext (In-Memory JWT)",
        "Axios API Client (Interceptor)",
        "Pages (Jobs, Profile, Dashboard)",
        "BottomNav (Mobile Ergonomics)",
        "Profile Completeness Gauge",
        "Notification Badge & Drawer",
        "Application Submission Modal",
        "Toast & Confirmation Alerts"
    ]
    y = 80
    for item in fe_items:
        ax.add_patch(patches.Rectangle((5, y-5), 24, 6, fc="#BBDEFB", ec="#1976D2", lw=1))
        ax.text(17, y-2, item, ha='center', va='center', fontsize=8, color="#0D47A1")
        y -= 8

    # Backend Routes
    ax.add_patch(patches.FancyBboxPatch((35, 52), 28, 40, boxstyle="round,pad=1", fc="#E8F5E9", ec="#388E3C", lw=2))
    ax.text(49, 88, "BACKEND ROUTERS (/api/v1)", ha='center', va='center', fontsize=11, fontweight='bold', color="#1B5E20")
    
    routes = [
        "authRouter (Login/Register/OTP)",
        "jobsRouter (CRUD/Preview/Filters)",
        "applicationsRouter (Submit/Review)",
        "usersRouter (Profile/Resume File)",
        "recommendationsRouter (Scoring)",
        "notificationsRouter (In-App)",
        "savedJobsRouter (Bookmarks)",
        "metaRouter (Geography/Catalog)"
    ]
    y = 82
    for r in routes[:4]:
        ax.add_patch(patches.Rectangle((37, y-5), 24, 5.5, fc="#C8E6C9", ec="#388E3C", lw=1))
        ax.text(49, y-2.2, r, ha='center', va='center', fontsize=7.5, color="#1B5E20")
        y -= 7
    y = 82
    # Second column of routes or below
    ax.add_patch(patches.FancyBboxPatch((35, 10), 28, 38, boxstyle="round,pad=1", fc="#FCE4EC", ec="#D81B60", lw=2))
    ax.text(49, 44, "ADMIN SSR MODULE (/admin)", ha='center', va='center', fontsize=11, fontweight='bold', color="#880E4F")
    admin_items = [
        "Nunjucks Template Engine",
        "Signed Session Cookie Auth",
        "Double-Submit CSRF Verification",
        "Dashboard Metrics & Charts",
        "User Moderation (Suspend/Restore)",
        "Job Moderation (Disable/Restore)",
        "Error Report Log Viewer",
        "Append-Only Audit Log Viewer"
    ]
    y = 38
    for item in admin_items[:5]:
        ax.add_patch(patches.Rectangle((37, y-4.5), 24, 5, fc="#F8BBD0", ec="#D81B60", lw=1))
        ax.text(49, y-2, item, ha='center', va='center', fontsize=7.5, color="#880E4F")
        y -= 6

    # Backend Services & Repositories
    ax.add_patch(patches.FancyBboxPatch((67, 10), 30, 82, boxstyle="round,pad=1", fc="#FFF3E0", ec="#F57C00", lw=2))
    ax.text(82, 88, "DOMAIN SERVICES & DATA", ha='center', va='center', fontsize=11, fontweight='bold', color="#E65100")
    
    services = [
        "AuthService (JWT + bcrypt)",
        "JobService (Catalog & Filtering)",
        "ApplicationService (State Machine)",
        "RecommendationService (70/30)",
        "GeographyService (Batanes Rules)",
        "NotificationService (Dispatch)",
        "EmailDeliveryService (SMTP)",
        "Prisma Client ORM Layer",
        "PostgreSQL 16 / SQLite Database"
    ]
    y = 80
    for s in services:
        ax.add_patch(patches.Rectangle((69, y-5), 26, 6, fc="#FFE0B2", ec="#FB8C00", lw=1))
        ax.text(82, y-2, s, ha='center', va='center', fontsize=8, color="#BF360C")
        y -= 8

    # Connecting Arrows
    ax.annotate("", xy=(35, 68), xytext=(31, 68), arrowprops=dict(arrowstyle="->", lw=2, color="#1976D2"))
    ax.annotate("", xy=(67, 68), xytext=(63, 68), arrowprops=dict(arrowstyle="->", lw=2, color="#388E3C"))
    ax.annotate("", xy=(67, 28), xytext=(63, 28), arrowprops=dict(arrowstyle="->", lw=2, color="#D81B60"))

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, "component-diagram.png"), dpi=300)
    plt.savefig(os.path.join(OUT_DIR, "component-diagram.svg"))
    plt.close()
    print("Generated component-diagram.png & .svg")

# 4. Data Flow Diagram (Application Submission)
def draw_data_flow_diagram():
    fig, ax = plt.subplots(figsize=(14, 8), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    plt.title("Figure 9.1: Batanes Niche Job Portal – Job Application Data Flow", 
              fontsize=16, fontweight='bold', pad=20, color='#0D47A1')

    steps = [
        ("1. Job Seeker", "Browses job details and clicks 'Apply'. Adds optional cover letter in ApplicationModal.", 10, 50, "#E3F2FD", "#1976D2"),
        ("2. React SPA", "Validates input locally and injects Bearer JWT via Axios interceptor.", 30, 50, "#E8F5E9", "#388E3C"),
        ("3. REST API Gateway", "Verifies JWT token, checks role ('job_seeker'), applies rate limiting.", 50, 50, "#FFF3E0", "#F57C00"),
        ("4. ApplicationService", "Validates job active state, checks unique constraint, creates record.", 70, 50, "#FCE4EC", "#D81B60"),
        ("5. Persistence & Notif", "Inserts application in DB, creates notifications for Seeker and Employer.", 90, 50, "#EDE7F6", "#512DA8")
    ]

    for title, desc, cx, cy, fc, ec in steps:
        ax.add_patch(patches.FancyBboxPatch((cx-8, cy-20), 16, 40, boxstyle="round,pad=1", fc=fc, ec=ec, lw=2))
        ax.text(cx, cy+14, title, ha='center', va='center', fontsize=9.5, fontweight='bold', color=ec)
        ax.text(cx, cy-3, desc, ha='center', va='center', fontsize=8, color="#37474F", wrap=True)

    # Sequence arrows
    for i in range(len(steps)-1):
        x1 = steps[i][2] + 8
        x2 = steps[i+1][2] - 8
        ax.annotate("", xy=(x2, 50), xytext=(x1, 50), arrowprops=dict(arrowstyle="->", lw=2, color="#0D47A1"))

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, "data-flow-diagram.png"), dpi=300)
    plt.savefig(os.path.join(OUT_DIR, "data-flow-diagram.svg"))
    plt.close()
    print("Generated data-flow-diagram.png & .svg")

# 5. Integration Diagram
def draw_integration_diagram():
    fig, ax = plt.subplots(figsize=(13, 8), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    plt.title("Figure 10.1: Production Cloud Infrastructure and Service Integration", 
              fontsize=16, fontweight='bold', pad=20, color='#0D47A1')

    # Cloud providers
    ax.add_patch(patches.FancyBboxPatch((4, 20), 26, 60, boxstyle="round,pad=1", fc="#E3F2FD", ec="#0288D1", lw=2))
    ax.text(17, 74, "FRONTEND HOSTING\nVercel Cloud Edge", ha='center', va='center', fontsize=11, fontweight='bold', color="#01579B")
    ax.text(17, 50, "React 18 SPA Build\nGlobal CDN Distribution\nClient-Side SPA Routing\nHTTPS Termination\nCustom Domain Support", ha='center', va='center', fontsize=9, color="#0277BD")

    ax.add_patch(patches.FancyBboxPatch((37, 20), 26, 60, boxstyle="round,pad=1", fc="#E8F5E9", ec="#388E3C", lw=2))
    ax.text(50, 74, "BACKEND HOSTING\nRender Web Service", ha='center', va='center', fontsize=11, fontweight='bold', color="#1B5E20")
    ax.text(50, 50, "Node.js 20+ Runtime\nExpress.js REST Gateway\nNunjucks Admin SSR\nHealth Probes (/health)\nAuto-Deploy on Git Push", ha='center', va='center', fontsize=9, color="#2E7D32")

    ax.add_patch(patches.FancyBboxPatch((70, 52), 26, 28, boxstyle="round,pad=1", fc="#EDE7F6", ec="#512DA8", lw=2))
    ax.text(83, 74, "MANAGED DATABASE\nSupabase (Singapore)", ha='center', va='center', fontsize=10, fontweight='bold', color="#311B92")
    ax.text(83, 62, "PostgreSQL 16 DB\nPgBouncer Pooler (:6543)\nDirect Schema Push (:5432)", ha='center', va='center', fontsize=8.5, color="#4527A0")

    ax.add_patch(patches.FancyBboxPatch((70, 20), 26, 26, boxstyle="round,pad=1", fc="#FFF3E0", ec="#F57C00", lw=2))
    ax.text(83, 40, "EMAIL DELIVERY\nSMTP Gateway", ha='center', va='center', fontsize=10, fontweight='bold', color="#E65100")
    ax.text(83, 29, "Nodemailer Client\nSTARTTLS Port 587\n6-Digit OTP Delivery", ha='center', va='center', fontsize=8.5, color="#BF360C")

    # Connectors
    ax.annotate("", xy=(37, 52), xytext=(30, 52), arrowprops=dict(arrowstyle="<->", lw=2, color="#01579B"))
    ax.text(33.5, 55, "REST\nCORS", ha='center', fontsize=7.5, color="#01579B")

    ax.annotate("", xy=(70, 66), xytext=(63, 66), arrowprops=dict(arrowstyle="<->", lw=2, color="#1B5E20"))
    ax.text(66.5, 69, "TCP :6543\nPrisma", ha='center', fontsize=7.5, color="#1B5E20")

    ax.annotate("", xy=(70, 33), xytext=(63, 33), arrowprops=dict(arrowstyle="->", lw=2, color="#E65100"))
    ax.text(66.5, 36, "SMTP\n:587", ha='center', fontsize=7.5, color="#E65100")

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, "integration-diagram.png"), dpi=300)
    plt.savefig(os.path.join(OUT_DIR, "integration-diagram.svg"))
    plt.close()
    print("Generated integration-diagram.png & .svg")

# 6. Additional Diagrams: Authentication Workflow & Recommendation Engine
def draw_additional_diagrams():
    # 6A: Recommendation Engine
    fig, ax = plt.subplots(figsize=(12, 8), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    plt.title("Figure 7.2: Deterministic Two-Tier Recommendation Algorithm", 
              fontsize=15, fontweight='bold', pad=15, color='#0D47A1')

    # Skill scoring box
    ax.add_patch(patches.FancyBboxPatch((5, 45), 42, 45, boxstyle="round,pad=1", fc="#E3F2FD", ec="#1976D2", lw=2))
    ax.text(26, 85, "1. Skill Match Score (0 - 70 Points)", ha='center', va='center', fontsize=11, fontweight='bold', color="#0D47A1")
    ax.text(26, 65, "• Tokenize required skills string\n• Tokenize candidate skills string\n• Intersection of normalized tokens\n\nScore = (Matched / Required) × 70 pts\nRounded to 2 decimal places.", ha='center', va='center', fontsize=9, color="#1A237E")

    # Geo scoring box
    ax.add_patch(patches.FancyBboxPatch((53, 45), 42, 45, boxstyle="round,pad=1", fc="#E8F5E9", ec="#388E3C", lw=2))
    ax.text(74, 85, "2. Geographic Distance Score (0 - 30 Points)", ha='center', va='center', fontsize=11, fontweight='bold', color="#1B5E20")
    ax.text(74, 65, "• Same Barangay: 30 Points\n• Same Municipality: 25 Points\n• Same Island: 15 Points\n• Cross-Island (Batanes): 5 Points\n• Non-Batanes / Invalid: 0 Points\nEvaluated against Canonical Geography.", ha='center', va='center', fontsize=9, color="#1B5E20")

    # Composite & Tier ranking
    ax.add_patch(patches.FancyBboxPatch((15, 6), 70, 30, boxstyle="round,pad=1", fc="#FFF3E0", ec="#F57C00", lw=2))
    ax.text(50, 31, "Total Score = Skill Score (0-70) + Geographic Score (0-30)", ha='center', va='center', fontsize=11, fontweight='bold', color="#E65100")
    ax.text(50, 18, "Tier 1: Candidates with Total Score > 0 (Sorted by Score DESC, Name ASC)\nTier 2: Unranked pool with Score = 0 (Sorted alphabetically by Name ASC)\nZero black-box logic — fully explainable to employers and job seekers.", ha='center', va='center', fontsize=9.5, color="#BF360C")

    ax.annotate("", xy=(35, 36), xytext=(26, 45), arrowprops=dict(arrowstyle="->", lw=2, color="#0D47A1"))
    ax.annotate("", xy=(65, 36), xytext=(74, 45), arrowprops=dict(arrowstyle="->", lw=2, color="#388E3C"))

    plt.tight_layout()
    plt.savefig(os.path.join(ADD_DIR, "recommendation-engine.png"), dpi=300)
    plt.savefig(os.path.join(ADD_DIR, "recommendation-engine.svg"))
    plt.close()
    print("Generated recommendation-engine.png & .svg")

    # 6B: Authentication Workflow
    fig, ax = plt.subplots(figsize=(12, 8), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    plt.title("Figure 11.1: Dual-Channel Authentication and Token Lifecycle", 
              fontsize=15, fontweight='bold', pad=15, color='#0D47A1')

    # Channel 1: Public SPA API
    ax.add_patch(patches.FancyBboxPatch((5, 10), 42, 80, boxstyle="round,pad=1", fc="#E3F2FD", ec="#1976D2", lw=2))
    ax.text(26, 85, "CHANNEL 1: PUBLIC SPA (JWT)", ha='center', va='center', fontsize=11, fontweight='bold', color="#0D47A1")
    ax.text(26, 50, "1. POST /auth/login\n   Validate credentials via bcrypt (12 rounds)\n\n2. Issue Token Pair:\n   • Access Token: JWT (HS256, 15 min TTL)\n     Held STRICTLY in-memory (JS variable)\n   • Refresh Token: High-entropy string (7d)\n     Stored as SHA-256 hash in DB\n\n3. Silent Refresh Interceptor:\n   Axios intercepts HTTP 401\n   POST /auth/refresh\n   Rotates refresh token (single use)\n   Re-issues access token without user logout\n\n4. Compromise Detection:\n   Reusing revoked token kills ALL user sessions\n\n5. Logout:\n   JTI blacklisted in revoked_tokens table", ha='left', va='center', fontsize=8.5, color="#1A237E")

    # Channel 2: Admin SSR
    ax.add_patch(patches.FancyBboxPatch((53, 10), 42, 80, boxstyle="round,pad=1", fc="#FCE4EC", ec="#D81B60", lw=2))
    ax.text(74, 85, "CHANNEL 2: ADMIN SSR (SESSION)", ha='center', va='center', fontsize=11, fontweight='bold', color="#880E4F")
    ax.text(74, 50, "1. POST /admin/login\n   Admin credentials verified via bcrypt\n   Requires user.role == 'admin'\n   Rejects suspended accounts immediately\n\n2. Session Cookie:\n   • batanes_admin_session\n   • Signed via HMAC-SHA256\n   • HttpOnly=true (prevents XSS theft)\n   • Secure=true (enforces HTTPS in prod)\n   • SameSite=Lax (anti-CSRF)\n   • 12-hour sliding window\n\n3. State-Modifying Form Posts:\n   • Double-Submit CSRF token verification\n   • Timing-safe comparison\n\n4. Audit Trail:\n   Every admin login & moderation action is\n   recorded in append-only audit_logs table", ha='left', va='center', fontsize=8.5, color="#880E4F")

    plt.tight_layout()
    plt.savefig(os.path.join(ADD_DIR, "authentication-workflow.png"), dpi=300)
    plt.savefig(os.path.join(ADD_DIR, "authentication-workflow.svg"))
    plt.close()
    print("Generated authentication-workflow.png & .svg")

if __name__ == "__main__":
    draw_system_architecture()
    draw_database_erd()
    draw_component_diagram()
    draw_data_flow_diagram()
    draw_integration_diagram()
    draw_additional_diagrams()
    print("All diagrams generated successfully!")
