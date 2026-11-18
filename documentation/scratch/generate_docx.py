"""
Generate comprehensive academic technical documentation DOCX for
Batanes Niche Job Portal v2.0
"""

from docx import Document
from docx.shared import Pt, Inches, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.style import WD_STYLE_TYPE
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import os

OUTPUT_PATH = r"c:\Users\Jonathea Gabotero\Documents\GitHub\Batanes_Niche\documentation\Project-Technical-Documentation.docx"
DIAGRAMS_DIR = r"c:\Users\Jonathea Gabotero\Documents\GitHub\Batanes_Niche\documentation\diagrams"
ADD_DIR = os.path.join(DIAGRAMS_DIR, "additional-diagrams")

doc = Document()

# ─────────────────────────────────────────────────────────────────────
# Document-wide styling
# ─────────────────────────────────────────────────────────────────────
sections = doc.sections
section = sections[0]
section.page_width  = Inches(8.5)
section.page_height = Inches(11)
section.left_margin   = Inches(1.25)
section.right_margin  = Inches(1.0)
section.top_margin    = Inches(1.0)
section.bottom_margin = Inches(1.0)

BRAND   = RGBColor(0x0D, 0x47, 0xA1)   # Deep Blue
ACCENT  = RGBColor(0x15, 0x65, 0xC0)   # Lighter Blue
GRAY    = RGBColor(0x55, 0x55, 0x55)
BLACK   = RGBColor(0x11, 0x11, 0x11)

styles = doc.styles

def set_heading_style(style_name, size, color, bold=True, space_before=14, space_after=6):
    try:
        st = styles[style_name]
    except KeyError:
        return
    st.font.size = Pt(size)
    st.font.color.rgb = color
    st.font.bold = bold
    st.paragraph_format.space_before = Pt(space_before)
    st.paragraph_format.space_after  = Pt(space_after)

set_heading_style('Heading 1', 18, BRAND, space_before=18, space_after=8)
set_heading_style('Heading 2', 14, ACCENT, space_before=14, space_after=6)
set_heading_style('Heading 3', 12, ACCENT, bold=False, space_before=10, space_after=4)

normal = styles['Normal']
normal.font.name = 'Calibri'
normal.font.size = Pt(11)
normal.font.color.rgb = BLACK
normal.paragraph_format.space_after  = Pt(6)
normal.paragraph_format.line_spacing = Pt(14)

# ─────────────────────────────────────────────────────────────────────
# Helper functions
# ─────────────────────────────────────────────────────────────────────
def add_heading(text, level=1):
    h = doc.add_heading(text, level=level)
    return h

def add_para(text, bold=False, italic=False, size=11, color=None, align=None):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.bold   = bold
    run.italic = italic
    run.font.size = Pt(size)
    if color:
        run.font.color.rgb = color
    if align:
        p.alignment = align
    return p

def add_bullet(text, level=0):
    p = doc.add_paragraph(style='List Bullet')
    p.add_run(text)
    return p

def add_numbered(text):
    p = doc.add_paragraph(style='List Number')
    p.add_run(text)
    return p

def add_hr():
    p = doc.add_paragraph()
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'), 'single')
    bottom.set(qn('w:sz'), '6')
    bottom.set(qn('w:space'), '1')
    bottom.set(qn('w:color'), '0D47A1')
    pBdr.append(bottom)
    pPr.append(pBdr)
    return p

def add_table(headers, rows, col_widths=None):
    n_cols = len(headers)
    table = doc.add_table(rows=1, cols=n_cols)
    table.style = 'Table Grid'
    # Header row
    hdr_cells = table.rows[0].cells
    for i, h in enumerate(headers):
        hdr_cells[i].text = h
        tc = hdr_cells[i]._tc
        tcPr = tc.get_or_add_tcPr()
        shd = OxmlElement('w:shd')
        shd.set(qn('w:val'), 'clear')
        shd.set(qn('w:color'), 'auto')
        shd.set(qn('w:fill'), '1565C0')
        tcPr.append(shd)
        for para in hdr_cells[i].paragraphs:
            for run in para.runs:
                run.bold = True
                run.font.size = Pt(10)
                run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    # Data rows
    for row_data in rows:
        row_cells = table.add_row().cells
        for i, cell_text in enumerate(row_data):
            row_cells[i].text = str(cell_text)
            for para in row_cells[i].paragraphs:
                for run in para.runs:
                    run.font.size = Pt(9)
    # Column widths
    if col_widths:
        for row in table.rows:
            for i, cell in enumerate(row.cells):
                cell.width = Inches(col_widths[i])
    return table

def add_code_block(text):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.25)
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after  = Pt(4)
    run = p.add_run(text)
    run.font.name = 'Courier New'
    run.font.size = Pt(9)
    run.font.color.rgb = RGBColor(0x1A, 0x23, 0x7E)
    return p

def add_note_box(text, label="NOTE"):
    p = doc.add_paragraph()
    run = p.add_run(f"▶ {label}: {text}")
    run.font.size = Pt(9)
    run.font.italic = True
    run.font.color.rgb = RGBColor(0x0D, 0x47, 0xA1)
    p.paragraph_format.left_indent = Inches(0.25)
    return p

def add_figure(img_path, caption):
    if os.path.exists(img_path):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run()
        run.add_picture(img_path, width=Inches(6.2))
        cp = doc.add_paragraph()
        cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        c_run = cp.add_run(caption)
        c_run.font.size = Pt(9.5)
        c_run.font.italic = True
        c_run.font.color.rgb = GRAY
        cp.paragraph_format.space_after = Pt(12)

# ═══════════════════════════════════════════════════════════════════
# COVER PAGE
# ═══════════════════════════════════════════════════════════════════
doc.add_paragraph()
doc.add_paragraph()

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("BATANES NICHE JOB PORTAL")
run.bold = True
run.font.size = Pt(26)
run.font.color.rgb = BRAND

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("Version 2.0")
run.font.size = Pt(16)
run.font.color.rgb = ACCENT

doc.add_paragraph()
add_hr()
doc.add_paragraph()

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("Comprehensive Technical Documentation")
run.bold = True
run.font.size = Pt(18)
run.font.color.rgb = BLACK

doc.add_paragraph()

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run(
    "A Production-Ready Hyper-Local Employment Marketplace\n"
    "Engineered for the Province of Batanes, Philippines"
)
run.font.size = Pt(12)
run.font.italic = True
run.font.color.rgb = GRAY

doc.add_paragraph()
doc.add_paragraph()

meta = [
    ("Project", "Batanes Niche Job Portal"),
    ("Version", "2.0.0"),
    ("Documentation Version", "1.0.0"),
    ("Analysis Date", "November 18, 2026"),
    ("Repository Branch", "New-Features"),
    ("Latest Commit Analyzed", "d2bac96"),
]
for label, value in meta:
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run1 = p.add_run(f"{label}: ")
    run1.bold = True
    run1.font.size = Pt(11)
    run2 = p.add_run(value)
    run2.font.size = Pt(11)

doc.add_paragraph()
add_hr()
doc.add_paragraph()

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run(
    "For Academic Submission · Technical Evaluation · Project Defense\n"
    "All rights reserved. Developed for the Province of Batanes."
)
run.font.size = Pt(10)
run.font.color.rgb = GRAY

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════════
# TABLE OF CONTENTS (manual)
# ═══════════════════════════════════════════════════════════════════
add_heading("Table of Contents", 1)

toc_entries = [
    ("1",  "Project Title and System Overview"),
    ("2",  "Background of the Project and Problem Statement"),
    ("3",  "Project Objectives"),
    ("4",  "Scope and Limitations"),
    ("5",  "Functional and Non-Functional Requirements"),
    ("6",  "System Architecture Diagram"),
    ("7",  "System Design and Component Descriptions"),
    ("8",  "Database Design and Entity Relationship Diagram"),
    ("9",  "System Integration and Communication"),
    ("10", "APIs, Middleware, Protocols, and Integration Technologies"),
    ("11", "Security Implementation"),
    ("12", "Testing Procedures and Results"),
    ("13", "Deployment Information and User Instructions"),
    ("14", "Conclusion and Recommendations"),
    ("",   "References"),
    ("",   "Appendices"),
]
for num, title in toc_entries:
    p = doc.add_paragraph()
    if num:
        run = p.add_run(f"Chapter {num}. {title}")
    else:
        run = p.add_run(title)
    run.font.size = Pt(11)
    p.paragraph_format.space_after = Pt(3)

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════════
# SECTION 1: PROJECT TITLE AND SYSTEM OVERVIEW
# ═══════════════════════════════════════════════════════════════════
add_heading("Chapter 1: Project Title and System Overview", 1)

add_heading("1.1 Official Project Title", 2)
add_para("Batanes Niche Job Portal – Version 2", bold=True, size=14)

add_heading("1.2 Project Description", 2)
add_para(
    "The Batanes Niche Job Portal is a production-ready, hyper-localized employment marketplace "
    "engineered specifically for the province of Batanes, Philippines. The platform connects local "
    "job seekers across the three permanently inhabited islands — Batan Island, Sabtang Island, and "
    "Itbayat Island — with verified local enterprises and municipal initiatives through deterministic "
    "skill and transit-aware matching."
)
add_para(
    "Unlike generic national job boards, the system is designed from the ground up for the unique "
    "labor market characteristics of Batanes: ocean water barriers between islands, seasonal monsoonal "
    "disruptions to sea transit, an economy dominated by micro-enterprises in tourism and traditional "
    "trades, and high outward migration of skilled Ivatan workers."
)

add_heading("1.3 Purpose of the System", 2)
add_para("The Batanes Niche Job Portal serves four core purposes:")
add_bullet("Hyper-Local Matching: Transparent transit accessibility calculations across 6 municipalities and 29 barangays.")
add_bullet("Explainable Recommendations: A deterministic two-tier matching engine weighting trade skills (0–70 pts) and geographic distance (0–30 pts).")
add_bullet("Zero-Jargon Public Experience: Clean, accessible interfaces tailored for local trade workers and enterprise proprietors.")
add_bullet("Isolated Server-Rendered Administration: A secure Nunjucks administrative portal completely decoupled from the client-side single-page application.")

add_heading("1.4 Intended Users", 2)
table_users = [
    ["Guest (Unauthenticated)", "Any web visitor. Browse job listings, view job details, register, request OTP password reset."],
    ["Job Seeker", "Registered Ivatan workers seeking employment. Apply for jobs, manage profile, upload resume, track applications, receive notifications."],
    ["Employer", "Local businesses and enterprises. Post job listings, review applicants, manage application statuses, search candidate directory."],
    ["Platform Administrator", "System operations staff. Access backend admin portal, monitor system metrics, moderate users and listings, review audit logs."],
]
add_table(["User Role", "Description and Scope"], table_users, [2.0, 4.5])

add_heading("1.5 Main Features", 2)
features = [
    "User registration and authentication (JWT + bcrypt)",
    "OTP-based password reset via email",
    "Job seeker profile management with completeness gauge (100-point system)",
    "Resume upload, storage, and access-controlled download (PDF/DOCX)",
    "Job posting, editing, and soft-deletion by employers",
    "Job search and filtering (municipality, island, keyword, employment type, category)",
    "Application submission and status tracking (pending/accepted/rejected/withdrawn)",
    "Job bookmarking (saved jobs) for job seekers",
    "In-app notification system (transactional, persistent)",
    "Deterministic two-tier recommendation engine (skill score + geographic score)",
    "Candidate directory with recommendation ranking for employers",
    "Demo mode with one-click seeker/employer login for testing",
    "Administrative SSR portal (dashboard, users, jobs, error reports, audit trail)",
    "Canonical Batanes geography (3 islands, 6 municipalities, 29 barangays)",
    "Environment-switchable database (SQLite for dev, PostgreSQL for production)",
]
for f in features:
    add_bullet(f)

add_heading("1.6 Technology Stack Summary", 2)
tech_rows = [
    ["Frontend SPA", "React 18.3, TypeScript 5.4+, Vite 5.3+, Tailwind CSS 3.4, Axios, Lucide React"],
    ["Backend API", "Node.js 20+, Express.js 4.19, TypeScript 5.4+, Zod (validation), Nodemailer"],
    ["Admin UI (SSR)", "Nunjucks 3.2 templates, HMAC-SHA256 signed cookies, Double-Submit CSRF"],
    ["Security Middleware", "Helmet, express-rate-limit, bcryptjs, jsonwebtoken"],
    ["Database ORM", "Prisma ORM 5.15"],
    ["Database (Production)", "PostgreSQL 16 (Supabase managed)"],
    ["Database (Development)", "SQLite (zero-setup local dev)"],
    ["Workspace / Packages", "pnpm 12+ Monorepo Workspace"],
    ["Containerization", "Docker Compose, Nginx 1.27 Reverse Proxy, Node 20 Alpine"],
    ["Testing & Quality", "TypeScript Compiler (tsc --noEmit), Vitest 1.6 + JSDOM"],
    ["Deployment (Frontend)", "Vercel (React SPA, global CDN)"],
    ["Deployment (Backend)", "Render.com (Node.js 20, Singapore region)"],
    ["Deployment (Database)", "Supabase (PostgreSQL 15+, ap-southeast-1)"],
]
add_table(["Category", "Technologies"], tech_rows, [2.2, 4.3])

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════════
# SECTION 2: BACKGROUND AND PROBLEM STATEMENT
# ═══════════════════════════════════════════════════════════════════
add_heading("Chapter 2: Background of the Project and Problem Statement", 1)

add_heading("2.1 Background", 2)
add_para(
    "Batanes is the northernmost province of the Philippines, comprising three permanently inhabited "
    "islands: Batan Island (the administrative center), Sabtang Island to the south, and Itbayat Island "
    "to the north. The province is characterized by a unique geography that creates significant challenges "
    "for traditional employment systems designed for land-connected regions."
)
add_para(
    "The Ivatan people — the indigenous inhabitants of Batanes — have a distinct culture, traditional "
    "trades, and a local economy heavily dependent on agriculture, fishing, and tourism. The province "
    "hosts 6 municipalities across its three islands: Basco, Mahatao, Ivana, and Uyugan on Batan Island; "
    "Sabtang municipality on Sabtang Island; and Itbayat municipality on Itbayat Island."
)

add_heading("2.2 Existing Situation and Problems", 2)
add_para("The province of Batanes faces distinct labor market challenges that generic national job portals fail to address:")

problems = [
    ("Island Isolation", 
     "Open ocean water barriers between islands make inter-island commuting impractical. A job posting without island context may attract applicants who cannot physically reach the work location during monsoon season."),
    ("Seasonal Transit Disruptions",
     "Monsoonal weather frequently disrupts sea transit between islands, making island-aware job matching a practical necessity rather than a convenience."),
    ("Micro-Enterprise Dominance",
     "Batanes' economy is dominated by micro-enterprises in tourism and traditional trades (stone wall construction, weaving, fishing). Generic job categories and skill taxonomies do not adequately represent local occupational skills."),
    ("Outward Migration",
     "High outward migration of skilled Ivatan workers leaves local employers struggling to fill positions. Local enterprises lack a dedicated platform to reach Ivatan workers who may be willing to return."),
    ("Lack of Geographic Precision",
     "Without barangay-level geographic precision, employers cannot communicate transit accessibility, and seekers cannot assess whether a position is reachable from their home community."),
    ("Technical Intimidation",
     "Generic job portals use technical language and complex workflows that intimidate rural workers and small business proprietors unfamiliar with digital employment platforms."),
]
for title, desc in problems:
    p = doc.add_paragraph()
    run1 = p.add_run(f"{title}: ")
    run1.bold = True
    run1.font.size = Pt(11)
    run2 = p.add_run(desc)
    run2.font.size = Pt(11)

add_heading("2.3 How the Proposed System Addresses These Problems", 2)
solutions = [
    "Three-island geographic hierarchy with 6 municipalities and 29 barangays enables transit-aware job matching.",
    "Deterministic geographic scoring (30 pts max) explicitly quantifies proximity: same barangay (30 pts) → same municipality (25 pts) → same island (15 pts) → cross-island (5 pts).",
    "A standardized Batanes-specific skill and business type taxonomy accurately represents local occupational trades and industries.",
    "Zero-jargon UI contract enforced by automated testing removes technical terminology that alienates Ivatan workers.",
    "In-app notification system eliminates dependence on external communication for application status updates.",
    "Employer candidate directory with recommendation scoring helps local enterprises identify locally-available skilled workers.",
    "Demo mode with one-click login reduces registration friction for evaluating the platform.",
]
for s in solutions:
    add_bullet(s)

add_note_box(
    "No fabricated research statistics, interview data, or external citations have been added to this section. "
    "All background information is derived from publicly known characteristics of Batanes province and the actual "
    "system design decisions documented in the repository.",
    "DOCUMENTATION INTEGRITY NOTICE"
)

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════════
# SECTION 3: PROJECT OBJECTIVES
# ═══════════════════════════════════════════════════════════════════
add_heading("Chapter 3: Project Objectives", 1)

add_heading("3.1 General Objective", 2)
add_para(
    "To design, develop, and deploy a production-ready, hyper-local employment marketplace that connects "
    "job seekers and employers within the province of Batanes, Philippines, through deterministic skill-based "
    "and geography-aware matching, while maintaining a zero-jargon accessible user experience suitable for "
    "local trade workers and micro-enterprise proprietors."
)

add_heading("3.2 Specific Objectives", 2)
specific = [
    "Implement a secure full-stack web application with JWT-based authentication, bcrypt password hashing, "
    "OTP email verification, and role-based access control for guest, job seeker, employer, and administrator roles.",
    
    "Build a canonical Batanes geographic data model encoding all 3 islands, 6 municipalities, and 29 barangays "
    "as a deterministic reference dataset for geographic scoring and location validation.",
    
    "Design and implement a deterministic two-tier recommendation engine that scores candidates and jobs using "
    "a 100-point composite: 70 points for skill overlap and 30 points for geographic proximity.",
    
    "Develop a React 18 single-page application with mobile-responsive design, sticky bottom navigation, "
    "real-time notification badges, and WCAG 2.2 AA contrast compliance.",
    
    "Create a secure server-rendered administrative portal using Nunjucks templates, HMAC-SHA256 session cookies, "
    "and double-submit CSRF protection, completely isolated from the public SPA.",
    
    "Implement a resume upload system with magic byte file verification, extension whitelisting, 5 MB size limits, "
    "and access-controlled download endpoints.",
    
    "Deploy the application on a modern cloud infrastructure stack using Vercel for frontend hosting, "
    "Render for backend API hosting, and Supabase/PostgreSQL for managed database services.",
    
    "Maintain an environment-switchable database layer using Prisma ORM that supports both SQLite (local development) "
    "and PostgreSQL (production) with no application code changes.",
    
    "Establish a comprehensive audit logging system that records all administrative actions in an append-only "
    "database table with actor, IP address, timestamp, and action details.",
    
    "Enforce a zero-jargon UI contract through automated Vitest testing to ensure the platform language "
    "remains accessible to Ivatan users without prior technology experience.",
]
for i, obj in enumerate(specific, 1):
    p = doc.add_paragraph()
    p.style = 'List Number'
    p.add_run(obj)

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════════
# SECTION 4: SCOPE AND LIMITATIONS
# ═══════════════════════════════════════════════════════════════════
add_heading("Chapter 4: Scope and Limitations", 1)

add_heading("4.1 System Scope", 2)
add_para("The Batanes Niche Job Portal Version 2 covers the following:")

scope_items = [
    "Geographic Coverage: Province of Batanes, Philippines — 3 islands, 6 municipalities, 29 barangays.",
    "User Roles: Job Seekers, Employers, and Platform Administrators.",
    "Authentication: Registration, login, JWT token management, OTP password reset, demo login.",
    "Job Management: Job posting, search, filtering, sorting, job details, soft-deletion.",
    "Applications: Submission, status tracking, employer review, withdrawal.",
    "Profiles: Job seeker profile with skills, resume upload/download; employer profile with company data.",
    "Notifications: In-app transactional notifications for application events.",
    "Recommendations: Skill-and-geography scoring engine for both job seekers and employers.",
    "Bookmarks: Job seeker saved jobs functionality.",
    "Administration: User management, job moderation, error monitoring, audit trails.",
    "Platform Support: Web browsers (desktop and mobile-responsive).",
    "Deployment: Cloud-hosted SPA + REST API + managed PostgreSQL.",
]
for item in scope_items:
    add_bullet(item)

add_heading("4.2 Intentional Exclusions (Version 2 Design Decisions)", 2)
add_note_box(
    "The following are intentional Version 2 scope exclusions documented in README.md, not unimplemented features.",
    "SCOPE BOUNDARY"
)
exclusions = [
    "Real-time chat or instant messaging between seekers and employers.",
    "WebSocket-based real-time push notifications (replaced by in-app polling).",
    "Offline background synchronization (PWA/Service Worker).",
    "Payment processing or premium job posting tiers.",
    "Video resume or media portfolio uploads (resume limited to PDF/DOCX).",
    "Multi-language support (interface is in English).",
    "Mobile native applications (iOS/Android).",
    "Third-party OAuth login (Google, Facebook, etc.).",
    "Automated email campaigns or marketing tools.",
]
for ex in exclusions:
    add_bullet(ex)

add_heading("4.3 Technical Limitations", 2)
limitations = [
    ("Resume Storage — Ephemeral on Render",
     "Resume files are stored on the local filesystem. On Render's free tier, the filesystem is ephemeral — "
     "files are permanently lost on each redeploy. The codebase explicitly documents this limitation and recommends "
     "migration to cloud object storage (Supabase Storage, S3, or Cloudflare R2). Status: Known Limitation."),
    ("No Backend Integration Tests",
     "The backend REST API endpoints do not have automated integration tests. Manual testing is required "
     "for API verification. Status: Not Implemented."),
    ("No End-to-End Test Framework",
     "No Playwright, Cypress, or similar end-to-end testing framework is present in the repository. "
     "Status: Not Implemented."),
    ("Rate Limiting Scope",
     "Rate limiting is applied only to authentication-related endpoints. General API endpoints do not "
     "have per-endpoint rate limiting applied. Status: Partial."),
    ("Database Migration System",
     "The project uses `prisma db push` for schema synchronization rather than versioned Prisma migrations. "
     "This is appropriate for the current development phase but may require migration to `prisma migrate dev` "
     "for more controlled production schema evolution. Status: Known Limitation."),
]
for title, desc in limitations:
    p = doc.add_paragraph()
    run1 = p.add_run(f"{title}: ")
    run1.bold = True
    run2 = p.add_run(desc)

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════════
# SECTION 5: FUNCTIONAL AND NON-FUNCTIONAL REQUIREMENTS
# ═══════════════════════════════════════════════════════════════════
add_heading("Chapter 5: Functional and Non-Functional Requirements", 1)

add_heading("5.1 Functional Requirements", 2)

fr_rows = [
    ["FR-001", "User Registration", "Users shall register with username, email, password, full name, role (seeker/employer), and municipality.", "Implemented"],
    ["FR-002", "User Authentication", "Users shall authenticate with username/email and password. System returns JWT access + refresh token pair.", "Implemented"],
    ["FR-003", "Token Refresh", "Access tokens (15 min) shall be silently refreshed using valid refresh tokens (7 days) via Axios interceptor.", "Implemented"],
    ["FR-004", "Logout", "Users shall be able to log out, revoking the current access token JTI and all refresh tokens.", "Implemented"],
    ["FR-005", "OTP Password Reset", "Users shall request a 6-digit email OTP for password reset. OTP expires in 15 minutes, max 5 attempts.", "Implemented"],
    ["FR-006", "Demo Login", "When DEMO_MODE=true, users shall access one-click demo login for seeker or employer roles.", "Implemented"],
    ["FR-007", "Profile Management", "Authenticated users shall view and update their profile (name, phone, municipality, barangay, skills, bio, education, experience).", "Implemented"],
    ["FR-008", "Resume Upload", "Job seekers shall upload a resume file (PDF/DOCX, max 5 MB) with magic byte verification.", "Implemented"],
    ["FR-009", "Resume Download", "Resume files shall be downloadable by the owner, admins, or employers reviewing applicants from that seeker.", "Implemented"],
    ["FR-010", "Resume Delete", "Job seekers shall delete their uploaded resume file.", "Implemented"],
    ["FR-011", "Job Listing (Guest)", "Guests shall browse active job preview cards without authentication.", "Implemented"],
    ["FR-012", "Job Listing (Seeker)", "Authenticated seekers shall browse full active job listings with filtering by municipality, island, keyword, employment type, category, and sorting.", "Implemented"],
    ["FR-013", "Job Details", "Any user (guest or authenticated) shall view full job details by ID.", "Implemented"],
    ["FR-014", "Job Creation", "Authenticated employers shall create job postings with title, description, location, salary range, employment type, and required skills.", "Implemented"],
    ["FR-015", "Job Update", "Employers shall edit their own job postings.", "Implemented"],
    ["FR-016", "Job Soft-Delete", "Employers shall archive (soft-delete) their own job postings. Status set to closed, deleted_at recorded.", "Implemented"],
    ["FR-017", "My Jobs", "Employers shall list their own job postings, optionally including closed/archived listings.", "Implemented"],
    ["FR-018", "Application Submission", "Job seekers shall submit applications to active jobs with optional cover letter. Notifications sent to both seeker and employer.", "Implemented"],
    ["FR-019", "Application Listing", "Seekers view their own applications. Employers view applicants for their own jobs.", "Implemented"],
    ["FR-020", "Application Status Update", "Employers shall update application status (pending → accepted/rejected). Notification sent to seeker on change.", "Implemented"],
    ["FR-021", "Application Withdrawal", "Job seekers shall withdraw their own pending applications.", "Implemented"],
    ["FR-022", "Job Bookmarks", "Job seekers shall bookmark/unbookmark active job listings and view their saved jobs list.", "Implemented"],
    ["FR-023", "Notifications", "Users shall receive in-app notifications for application events. Notifications can be marked as read (individual or all).", "Implemented"],
    ["FR-024", "Candidate Recommendations", "Employers shall receive a two-tier ranked candidate list scored by skill overlap (0–70) + geographic proximity (0–30).", "Implemented"],
    ["FR-025", "Job Recommendations", "Job seekers shall receive a two-tier ranked job list scored by skill match + geographic proximity.", "Implemented"],
    ["FR-026", "Candidate Directory", "Employers shall search job seekers by municipality, island, and skill.", "Implemented"],
    ["FR-027", "Reference Data API", "Any user shall retrieve canonical reference data: geography hierarchy, skill catalog, education levels, employment types, business types.", "Implemented"],
    ["FR-028", "Admin Authentication", "Platform administrators shall authenticate via SSR login form. Session expires after 12 hours.", "Implemented"],
    ["FR-029", "User Moderation", "Administrators shall suspend and restore user accounts. Suspension immediately revokes all sessions.", "Implemented"],
    ["FR-030", "Job Moderation", "Administrators shall disable and restore job listings. All moderation actions are audit-logged.", "Implemented"],
]
add_table(
    ["ID", "Feature", "Description", "Status"],
    fr_rows,
    [0.6, 1.5, 3.3, 1.1]
)

add_heading("5.2 Non-Functional Requirements", 2)
nfr_rows = [
    ["NFR-001", "Security", "All API endpoints enforce authentication and RBAC. Passwords hashed with bcrypt (12 rounds). JWTs signed with HS256.", "Implemented"],
    ["NFR-002", "Security", "SQL injection prevented via 100% parameterized Prisma ORM queries. No raw SQL string interpolation.", "Implemented"],
    ["NFR-003", "Security", "HTTP security headers applied: X-Content-Type-Options, X-Frame-Options, HSTS (production), CSP, Referrer-Policy.", "Implemented"],
    ["NFR-004", "Security", "Input validation on all API endpoints using Zod schemas. Unrecognized fields stripped.", "Implemented"],
    ["NFR-005", "Performance", "Paginated API responses with configurable limit/offset. Max 100 records per page.", "Implemented"],
    ["NFR-006", "Performance", "Database indexes on high-frequency query columns: job status, municipality, employer_id, user_id, notification is_read.", "Implemented"],
    ["NFR-007", "Usability", "Zero-jargon UI contract enforced by automated Vitest tests to ensure accessible language.", "Implemented"],
    ["NFR-008", "Usability", "Mobile-responsive layout with sticky bottom navigation (md:hidden breakpoint) for phone users.", "Implemented"],
    ["NFR-009", "Maintainability", "TypeScript used throughout backend and frontend. Strict type checking via tsc --noEmit as CI gate.", "Implemented"],
    ["NFR-010", "Maintainability", "Repository pattern isolates all database queries. Domain services contain all business logic.", "Implemented"],
    ["NFR-011", "Scalability", "Environment-switchable database (SQLite ↔ PostgreSQL) with no application code changes.", "Implemented"],
    ["NFR-012", "Availability", "Liveness (/health) and readiness (/ready with DB probe) endpoints for container orchestration health checks.", "Implemented"],
]
add_table(
    ["ID", "Category", "Requirement", "Status"],
    nfr_rows,
    [0.6, 1.3, 3.8, 0.8]
)

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════════
# SECTION 6: SYSTEM ARCHITECTURE DIAGRAM
# ═══════════════════════════════════════════════════════════════════
add_heading("Chapter 6: System Architecture Diagram", 1)

add_para(
    "The Batanes Niche Job Portal is built as a Modular Monolith with four strictly decoupled tiers:"
)

tiers = [
    ("Client Presentation Tier",
     "React 18 SPA hosted on Vercel CDN. Handles all public-facing UI: job search, seeker dashboard, "
     "employer applicant review. Communicates with the backend exclusively via REST API calls with Bearer JWT authentication."),
    ("Server-Side Rendering Tier (Admin)",
     "Nunjucks template-rendered admin portal served directly by the Express.js backend at /admin. "
     "Uses HMAC-SHA256 signed session cookies and double-submit CSRF tokens. Completely isolated from the SPA."),
    ("Application Server Tier",
     "Express.js backend (Node.js 20+, TypeScript) exposes the REST API at /api/v1. Contains middleware stack, "
     "domain services, and repository layer. Handles all business logic, authentication, and data processing."),
    ("Persistence Tier",
     "Prisma ORM provides a database-agnostic access layer. SQLite is used for zero-setup local development; "
     "PostgreSQL 16 (Supabase managed) is used in production with connection pooling via PgBouncer on port 6543."),
]
for name, desc in tiers:
    p = doc.add_paragraph()
    run1 = p.add_run(f"• {name}: ")
    run1.bold = True
    run2 = p.add_run(desc)

doc.add_paragraph()
add_figure(os.path.join(DIAGRAMS_DIR, "system-architecture.png"), "Figure 6.1: Batanes Niche Job Portal – Four-Tier System Architecture Diagram")
add_note_box("Editable Mermaid source code is available at: documentation/diagram-sources/system-architecture.mmd", "DIAGRAM SOURCE")

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════════
# SECTION 7: SYSTEM DESIGN AND COMPONENT DESCRIPTIONS
# ═══════════════════════════════════════════════════════════════════
add_heading("Chapter 7: System Design and Component Descriptions", 1)

add_heading("7.1 Major Modules", 2)

modules = [
    ("Authentication Module", "backend/src/api/v1/auth.ts + services/authService.ts",
     "Handles all authentication flows: registration, login, token rotation, logout, OTP generation/verification, demo login. "
     "Implements dual-channel authentication (JWT for SPA, session cookies for admin)."),
    ("User Management Module", "backend/src/api/v1/users.ts + services/userService.ts",
     "Manages user profiles, resume upload/download/delete, candidate directory search. "
     "Enforces access-controlled resume downloads (owner/admin/employer-applicant only)."),
    ("Job Management Module", "backend/src/api/v1/jobs.ts + services/jobService.ts",
     "Full job posting lifecycle: create, list (with multi-filter and pagination), view by ID, update, soft-delete. "
     "Guest access to previews; full data for authenticated seekers. Employer-restricted write operations."),
    ("Application Management Module", "backend/src/api/v1/applications.ts + services/applicationService.ts",
     "Application submission with automatic notification dispatch (to both seeker and employer). "
     "Status update workflow (pending → accepted/rejected). Withdrawal by seeker or employer. "
     "Unique constraint enforces one application per seeker-job pair."),
    ("Recommendation Engine", "backend/src/api/v1/recommendations.ts + services/recommendationService.ts",
     "Deterministic two-tier scoring: Tier 1 (scored candidates/jobs, sorted by total_score DESC), "
     "Tier 2 (unscored, alphabetical). Skill score max 70 pts, geographic score max 30 pts."),
    ("Notification Module", "backend/src/api/v1/notifications.ts + services/notificationService.ts",
     "Persistent in-app notifications. List, mark-single-read, mark-all-read operations. "
     "Notifications created by application and job services as side effects of state transitions."),
    ("Saved Jobs Module", "backend/src/api/v1/savedJobs.ts + services/jobService.ts",
     "Job seeker bookmarking. Unique seeker-job constraint prevents duplicate saves. List/add/remove operations."),
    ("Geography Module", "backend/src/core/geography.ts + services/geographyService.ts",
     "Canonical Batanes geographic data: 3 islands, 6 municipalities, 29 barangays with alternate name aliases. "
     "Location validation, island resolution, geographic distance scoring."),
    ("Admin SSR Module", "backend/src/admin/routes.ts + auth.ts + templates/*.njk",
     "Nunjucks server-rendered admin portal. Dashboard metrics, user moderation, job moderation, "
     "error report inspection, append-only audit trail review. CSRF-protected state modifications."),
    ("Audit Service", "backend/src/services/auditService.ts + repositories/auditLogRepository.ts",
     "Append-only audit event logging for all administrative actions. Records actor, role, IP address, action, target, and details."),
    ("Email Delivery Service", "backend/src/services/emailDeliveryService.ts",
     "Nodemailer-based SMTP email delivery for OTP password reset codes. Configurable via environment variables."),
]

for name, path, desc in modules:
    add_heading(name, 3)
    p = doc.add_paragraph()
    run1 = p.add_run("Files: ")
    run1.bold = True
    run1.font.size = Pt(9)
    run2 = p.add_run(path)
    run2.font.name = 'Courier New'
    run2.font.size = Pt(9)
    add_para(desc)

add_heading("7.2 Frontend Architecture", 2)
add_para(
    "The frontend is a React 18 Single Page Application (SPA) built with TypeScript and Vite. "
    "It uses Tailwind CSS for styling with WCAG 2.2 AA compliant HSL design tokens."
)
frontend_items = [
    "AuthContext: Manages authentication state, in-memory token storage, and automatic login/logout.",
    "Axios Client (client.ts): Configures base URL, Bearer token injection, and silent 401 → refresh interceptor.",
    "React Router v6: Client-side SPA routing with route guards for authenticated/role-specific pages.",
    "Mobile Bottom Navigation: Sticky bottom nav (BottomNav) hidden at md breakpoint for desktop, visible on mobile.",
    "Profile Completeness Gauge: 100-point system displayed as visual progress indicator.",
    "Real-time Notification Badge: Unread notification count displayed on bell icon in navigation.",
    "Tailwind CSS: Utility-first responsive design. Mobile-first breakpoints. HSL custom design tokens.",
]
for item in frontend_items:
    add_bullet(item)

add_figure(os.path.join(DIAGRAMS_DIR, "component-diagram.png"), "Figure 7.1: Batanes Niche Job Portal – System Component Diagram")
add_note_box("Editable Mermaid source code is available at: documentation/diagram-sources/component-diagram.mmd", "DIAGRAM SOURCE")

add_heading("7.3 Recommendation Engine Algorithm", 2)
add_para("The recommendation engine implements a deterministic (non-machine-learning) two-tier scoring formula:")

add_figure(os.path.join(ADD_DIR, "recommendation-engine.png"), "Figure 7.2: Recommendation Engine Scoring Algorithm Flowchart")
add_note_box("Editable Mermaid source code is available at: documentation/diagram-sources/recommendation-engine.mmd", "DIAGRAM SOURCE")

formula_text = """Total Score (max 100) = Skill Score (0–70) + Geographic Score (0–30)

Skill Score Calculation:
  neededTokens = tokenize(job.required_skills)
  candidateTokens = tokenize(seeker.skills)
  matchedCount = |intersection(neededTokens, candidateTokens)|
  skillScore = (matchedCount / len(neededTokens)) × 70

Geographic Score Thresholds:
  Same municipality AND same barangay  → 30 pts
  Same municipality (different barangay) → 25 pts
  Same island (different municipality)   → 15 pts
  Different islands (both in Batanes)    → 5 pts
  Invalid location                       → 0 pts

Ranking:
  Tier 1: All candidates/jobs with totalScore > 0
           Sorted: totalScore DESC, name/title ASC (tiebreak)
  Tier 2: All remaining (totalScore = 0)
           Sorted: name/title ASC (alphabetical)
"""
add_code_block(formula_text)

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════════
# SECTION 8: DATABASE DESIGN AND ERD
# ═══════════════════════════════════════════════════════════════════
add_heading("Chapter 8: Database Design and Entity Relationship Diagram", 1)

add_heading("8.1 Database Management System", 2)
add_para(
    "The Batanes Niche Job Portal uses Prisma ORM 5.15 as the database access layer. "
    "The active database provider is controlled entirely via environment variables:"
)
db_rows = [
    ["Development / Testing", "SQLite", "file:../../Database/batanes_niche.db", "DB_PROVIDER=sqlite"],
    ["Production", "PostgreSQL 16", "Supabase managed (ap-southeast-1)", "DB_PROVIDER=postgres"],
]
add_table(
    ["Environment", "Database", "Connection", "Config"],
    db_rows,
    [1.3, 1.3, 2.3, 1.6]
)

add_heading("8.2 Database Entities and Schema", 2)
add_para(
    "The database comprises 12 tables derived from the actual Prisma schema (backend/prisma/schema.prisma). "
    "All entity definitions below are verified against the actual schema file."
)

add_figure(os.path.join(DIAGRAMS_DIR, "database-erd.png"), "Figure 8.1: Batanes Niche Job Portal – Entity Relationship Diagram (12 Tables)")
add_note_box("Editable Mermaid source code is available at: documentation/diagram-sources/database-erd.mmd", "DIAGRAM SOURCE")

entities = [
    ("users", "Core user identity table for all roles (job_seeker, employer, admin).",
     [("id", "INT PK", "Auto-increment primary key"),
      ("username", "VARCHAR UK", "Unique login identifier"),
      ("email", "VARCHAR UK", "Unique email address"),
      ("password_hash", "TEXT", "bcrypt hash (12 rounds)"),
      ("full_name", "TEXT", "Display name"),
      ("phone_number", "TEXT?", "Optional contact number"),
      ("municipality", "TEXT", "One of 6 canonical Batanes municipalities"),
      ("barangay", "TEXT?", "One of 29 canonical barangays (optional)"),
      ("skills", "TEXT?", "Comma-delimited skills string"),
      ("profile_pic", "TEXT?", "Profile image URL"),
      ("resume_url", "TEXT?", "Resume file access URL"),
      ("role", "TEXT", "Values: job_seeker | employer | admin"),
      ("account_status", "TEXT", "Values: active | suspended"),
      ("created_at", "DATETIME", "Account creation timestamp"),
     ]),
    ("employer_profiles", "Employer-specific profile data (1:1 with users).",
     [("user_id", "INT PK FK→users", "Cascades on user delete"),
      ("company_name", "TEXT", "Registered company or business name"),
      ("company_address", "TEXT", "Physical business address"),
      ("company_description", "TEXT?", "Optional business description"),
      ("business_type", "TEXT", "From BUSINESS_TYPES constant catalog"),
     ]),
    ("job_seeker_profiles", "Job seeker-specific profile data (1:1 with users).",
     [("user_id", "INT PK FK→users", "Cascades on user delete"),
      ("bio", "TEXT?", "Optional personal bio"),
      ("education", "TEXT?", "Education level"),
      ("experience_years", "INT", "Years of work experience (default 0)"),
     ]),
    ("jobs", "Job postings created by employers.",
     [("id", "INT PK", "Auto-increment"),
      ("employer_id", "INT FK→users", "Cascades on employer delete"),
      ("title", "TEXT", "Job title"),
      ("description", "TEXT", "Job description"),
      ("municipality", "TEXT", "Job location municipality"),
      ("barangay", "TEXT?", "Optional barangay-level location"),
      ("salary_min", "DECIMAL", "Minimum salary"),
      ("salary_max", "DECIMAL", "Maximum salary"),
      ("employment_type", "TEXT", "From EMPLOYMENT_TYPES catalog"),
      ("required_skills", "TEXT", "Comma-delimited required skills"),
      ("status", "TEXT", "Values: active | closed (default: active)"),
      ("created_at", "DATETIME", "Posting timestamp"),
      ("deleted_at", "DATETIME?", "Soft-delete timestamp (null if active)"),
     ]),
    ("applications", "Job applications submitted by seekers to jobs.",
     [("id", "INT PK", "Auto-increment"),
      ("job_id", "INT FK→jobs", "Cascades on job delete"),
      ("seeker_id", "INT FK→users", "Cascades on user delete"),
      ("cover_letter", "TEXT?", "Optional application cover letter"),
      ("resume_url", "TEXT?", "Resume URL at time of application"),
      ("status", "TEXT", "Values: pending | accepted | rejected | withdrawn (default: pending)"),
      ("created_at", "DATETIME", "Application submission timestamp"),
      ("UNIQUE(job_id,seeker_id)", "Constraint", "One application per seeker-job pair"),
     ]),
    ("saved_jobs", "Bookmarked jobs by seekers.",
     [("id", "INT PK", "Auto-increment"),
      ("seeker_id", "INT FK→users", "Cascades on user delete"),
      ("job_id", "INT FK→jobs", "Cascades on job delete"),
      ("saved_at", "DATETIME", "Bookmark timestamp"),
      ("UNIQUE(seeker_id,job_id)", "Constraint", "No duplicate bookmarks"),
     ]),
    ("notifications", "In-app notifications delivered to users.",
     [("id", "INT PK", "Auto-increment"),
      ("user_id", "INT FK→users", "Cascades on user delete"),
      ("title", "TEXT", "Notification title"),
      ("message", "TEXT", "Notification body"),
      ("type", "TEXT", "Notification category"),
      ("is_read", "BOOLEAN", "Read status (default: false)"),
      ("link", "TEXT?", "Optional action URL"),
      ("created_at", "DATETIME", "Delivery timestamp"),
     ]),
    ("refresh_tokens", "Active refresh token records (hashed).",
     [("id", "INT PK", "Auto-increment"),
      ("user_id", "INT FK→users", "Cascades on user delete"),
      ("token_hash", "TEXT UK", "SHA-256 hash of refresh token"),
      ("expires_at", "DATETIME", "Token expiration (7 days)"),
      ("revoked", "BOOLEAN", "Rotation/logout flag (default: false)"),
      ("created_at", "DATETIME", "Token creation timestamp"),
     ]),
    ("revoked_tokens", "JTI blocklist for access token revocation on logout.",
     [("id", "INT PK", "Auto-increment"),
      ("token_jti", "TEXT UK", "JWT ID claim (unique per token)"),
      ("revoked_at", "DATETIME", "Revocation timestamp"),
      ("expires_at", "DATETIME", "Original token expiry (for cleanup)"),
     ]),
    ("password_reset_tokens", "OTP-based password reset records.",
     [("id", "INT PK", "Auto-increment"),
      ("user_id", "INT FK→users", "Cascades on user delete"),
      ("identifier", "TEXT", "Email address used for reset"),
      ("otp_hash", "TEXT", "bcrypt hash of 6-digit OTP"),
      ("expires_at", "DATETIME", "OTP expiry (15 minutes)"),
      ("used", "BOOLEAN", "Prevents OTP reuse (default: false)"),
      ("attempts_count", "INT", "Failed attempt counter (max 5, default: 0)"),
      ("created_at", "DATETIME", "Request timestamp"),
     ]),
    ("error_reports", "Server-side 500 error incident log.",
     [("id", "INT PK", "Auto-increment"),
      ("timestamp", "DATETIME", "Error occurrence time"),
      ("username", "TEXT?", "Authenticated user (if any)"),
      ("endpoint", "TEXT?", "Failing API route"),
      ("error_message", "TEXT", "Sanitized error message"),
      ("stack_trace", "TEXT?", "Stack trace (dev only, not in production response)"),
      ("request_data", "TEXT?", "Sanitized request body (sensitive fields redacted)"),
     ]),
    ("audit_logs", "Append-only administrative action trail.",
     [("id", "INT PK", "Auto-increment"),
      ("timestamp", "DATETIME", "Event timestamp"),
      ("actor_id", "INT? FK→users", "SetNull on user delete"),
      ("actor_role", "TEXT", "Role at time of action"),
      ("ip_address", "TEXT?", "Client IP address"),
      ("action", "TEXT", "Action identifier (e.g., USER_SUSPEND, JOB_DISABLE)"),
      ("target_type", "TEXT?", "Target entity type (user, job)"),
      ("target_id", "INT?", "Target entity ID"),
      ("details", "TEXT?", "JSON-serialized action details"),
     ]),
]

for table_name, description, columns in entities:
    add_heading(f"Table: {table_name}", 3)
    add_para(description, italic=True)
    col_rows = [[col, dtype, note] for col, dtype, note in columns]
    add_table(["Column", "Type / Constraint", "Notes"], col_rows, [1.8, 1.5, 3.2])
    doc.add_paragraph()

add_note_box(
    "Editable ERD source file is available at: documentation/diagram-sources/database-erd.mmd (Mermaid format). "
    "All 12 tables and relationships above are verified directly from backend/prisma/schema.prisma.",
    "DIAGRAM SOURCE"
)

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════════
# SECTION 9: SYSTEM INTEGRATION AND COMMUNICATION
# ═══════════════════════════════════════════════════════════════════
add_heading("Chapter 9: System Integration and Communication", 1)

add_heading("9.1 Frontend-to-Backend Communication", 2)
add_para(
    "The React SPA communicates with the Express.js backend exclusively via REST API calls over HTTPS. "
    "The Axios client (frontend/src/api/client.ts) handles:"
)
items = [
    "Base URL injection from VITE_API_BASE_URL environment variable.",
    "Authorization header injection: 'Bearer <access_token>' on every authenticated request.",
    "Silent refresh interceptor: On receiving HTTP 401, automatically requests a new token pair via POST /auth/refresh, then retries the original request.",
    "In development, Vite proxy forwards /api requests to http://localhost:8000 to avoid CORS issues.",
]
for item in items:
    add_bullet(item)

add_heading("9.2 Backend-to-Database Communication", 2)
add_para(
    "All database operations are performed exclusively through Prisma ORM's generated client. "
    "No raw SQL queries or string interpolation exist in the codebase, preventing SQL injection vulnerabilities. "
    "The repository pattern encapsulates all database interactions:"
)
add_code_block(
    "// Example: Repository pattern (backend/src/repositories/userRepository.ts)\n"
    "static async getByUsernameOrEmail(identifier: string): Promise<User | null> {\n"
    "  return prisma.user.findFirst({\n"
    "    where: {\n"
    "      OR: [{ username: identifier }, { email: identifier }]\n"
    "    }\n"
    "  });\n"
    "}"
)
add_para(
    "In production, Prisma connects to Supabase PostgreSQL via the transaction pooler (PgBouncer) on port 6543 "
    "for runtime queries, and the direct connection on port 5432 for schema pushes."
)

add_heading("9.3 External Service Communication", 2)
add_para(
    "The only external service integration is SMTP email delivery for OTP password resets. "
    "Nodemailer (emailDeliveryService.ts) sends OTP codes via STARTTLS on port 587. "
    "The service is configurable via MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD environment variables."
)

add_heading("9.4 Admin SSR Communication", 2)
add_para(
    "The administrative portal uses traditional HTML form POST requests rather than REST API calls. "
    "Nunjucks server-renders HTML pages with CSRF tokens embedded in hidden form fields. "
    "Session state is maintained via HMAC-SHA256 signed cookies (HttpOnly, SameSite=Lax). "
    "No JavaScript single-page navigation is involved — every admin action triggers a full page refresh."
)

add_heading("9.5 Request/Response Lifecycle", 2)
lifecycle_text = """HTTP Request → Reverse Proxy (Nginx/Render)
  → Express.js App (trust proxy: 1)
    → Helmet (security headers)
    → CORS check (origin whitelist)
    → Body Parser / Cookie Parser
    → Structured Logger (Morgan)
    → Router dispatch (API or Admin)
      → Rate Limiter (auth endpoints)
      → Authentication Middleware (JWT verify / Session verify)
      → Role Middleware (requireEmployer / requireSeeker)
      → Route Handler
        → Zod Schema Validation
        → Domain Service
          → Repository (Prisma ORM)
            → Database (PostgreSQL / SQLite)
          ← Repository returns data
        ← Service returns result
      ← Route Handler sends JSON response
    → (on error) → Global Error Handler
      → Sanitize request body (remove credentials)
      → Log to error_reports table
      → Send { message: "..." } JSON error response
"""
add_code_block(lifecycle_text)

add_figure(os.path.join(DIAGRAMS_DIR, "data-flow-diagram.png"), "Figure 9.1: Job Application Submission Sequence & Data Flow")
add_note_box("Editable Mermaid source code is available at: documentation/diagram-sources/data-flow-diagram.mmd", "DIAGRAM SOURCE")

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════════
# SECTION 10: APIs, MIDDLEWARE, PROTOCOLS
# ═══════════════════════════════════════════════════════════════════
add_heading("Chapter 10: APIs, Middleware, Protocols, and Integration Technologies", 1)

add_heading("10.1 API Architecture", 2)
add_para(
    "The backend exposes a RESTful HTTP API under the base path /api/v1. "
    "All API endpoints return JSON responses. HTTP verbs (GET, POST, PUT, DELETE) follow REST conventions. "
    "No GraphQL, gRPC, or WebSocket communication is implemented in Version 2."
)

add_heading("10.2 API Endpoint Summary", 2)
endpoint_rows = [
    ["POST", "/api/v1/auth/register", "None", "Register new user"],
    ["POST", "/api/v1/auth/login", "None", "Authenticate user, return JWT pair"],
    ["POST", "/api/v1/auth/refresh", "None", "Rotate refresh token"],
    ["POST", "/api/v1/auth/logout", "Bearer JWT", "Revoke tokens"],
    ["POST", "/api/v1/auth/forgot-password", "None", "Send OTP to email"],
    ["POST", "/api/v1/auth/reset-password", "None", "Reset password with OTP"],
    ["GET",  "/api/v1/auth/me", "Bearer JWT", "Get own profile"],
    ["GET",  "/api/v1/auth/demo-status", "None", "Check demo mode"],
    ["POST", "/api/v1/auth/demo-login", "None", "1-click demo login"],
    ["GET",  "/api/v1/users/profile", "Bearer JWT", "Get own profile"],
    ["PUT",  "/api/v1/users/profile", "Bearer JWT", "Update own profile"],
    ["GET",  "/api/v1/users/job-seekers", "Bearer JWT (Employer)", "Search candidate directory"],
    ["POST", "/api/v1/users/resume", "Bearer JWT (Seeker)", "Upload resume (PDF/DOCX)"],
    ["GET",  "/api/v1/users/resume", "Bearer JWT", "Download own resume"],
    ["GET",  "/api/v1/users/resume/:userId", "Bearer JWT", "Download resume by user ID"],
    ["DELETE","/api/v1/users/resume", "Bearer JWT (Seeker)", "Delete own resume"],
    ["GET",  "/api/v1/jobs/preview", "None", "List job preview cards (public)"],
    ["GET",  "/api/v1/jobs", "Optional JWT", "List active jobs"],
    ["POST", "/api/v1/jobs", "Bearer JWT (Employer)", "Create job posting"],
    ["GET",  "/api/v1/jobs/my", "Bearer JWT (Employer)", "List own job postings"],
    ["GET",  "/api/v1/jobs/:jobId", "Optional JWT", "View job details"],
    ["PUT",  "/api/v1/jobs/:jobId", "Bearer JWT (Employer, owner)", "Update job posting"],
    ["DELETE","/api/v1/jobs/:jobId", "Bearer JWT (Employer, owner)", "Soft-delete job posting"],
    ["POST", "/api/v1/applications", "Bearer JWT (Seeker)", "Submit application"],
    ["GET",  "/api/v1/applications", "Bearer JWT", "List applications"],
    ["PUT",  "/api/v1/applications/:appId", "Bearer JWT (Employer)", "Update application status"],
    ["POST", "/api/v1/applications/:appId/withdraw", "Bearer JWT", "Withdraw application"],
    ["GET",  "/api/v1/saved-jobs", "Bearer JWT (Seeker)", "List saved jobs"],
    ["POST", "/api/v1/saved-jobs/:jobId", "Bearer JWT (Seeker)", "Bookmark job"],
    ["DELETE","/api/v1/saved-jobs/:jobId", "Bearer JWT (Seeker)", "Remove bookmark"],
    ["GET",  "/api/v1/recommendations/candidates", "Bearer JWT (Employer)", "Get ranked candidates"],
    ["GET",  "/api/v1/recommendations/jobs-ranked", "Bearer JWT (Seeker)", "Get ranked jobs"],
    ["GET",  "/api/v1/notifications", "Bearer JWT", "List notifications"],
    ["PUT",  "/api/v1/notifications/read", "Bearer JWT", "Mark all notifications read"],
    ["PUT",  "/api/v1/notifications/:id/read", "Bearer JWT", "Mark single notification read"],
    ["GET",  "/api/v1/meta/options", "None", "Get reference data"],
    ["GET",  "/health", "None", "Liveness probe"],
    ["GET",  "/ready", "None", "Readiness probe (DB check)"],
]
add_table(
    ["Method", "Endpoint", "Auth", "Purpose"],
    endpoint_rows,
    [0.6, 2.8, 1.5, 1.6]
)

add_heading("10.3 Middleware Stack", 2)
mw_rows = [
    ["Helmet", "helmet ^7.1.0", "Applies 15+ security headers including CSP, HSTS (prod), X-Frame-Options, Referrer-Policy."],
    ["CORS", "cors ^2.8.5", "Restricts cross-origin requests to ALLOWED_ORIGINS whitelist. Credentials enabled."],
    ["Body Parser", "express built-in", "Parses JSON and URL-encoded request bodies."],
    ["Cookie Parser", "cookie-parser ^1.4.6", "Parses cookies for admin session management."],
    ["Structured Logger", "morgan ^1.10.0", "HTTP request/response logging."],
    ["Rate Limiter", "express-rate-limit ^7.3.1", "Per-endpoint rate limiting on auth routes (5–10 req/60s)."],
    ["requireAuthenticated", "custom deps.ts", "Verifies Bearer JWT, checks revoked_tokens table, attaches user to request."],
    ["requireEmployerContext", "custom deps.ts", "Enforces employer role after authentication."],
    ["requireJobSeekerContext", "custom deps.ts", "Enforces job_seeker role after authentication."],
    ["authenticateOptional", "custom deps.ts", "Attaches user if valid JWT present; allows unauthenticated access."],
    ["requireAdminSession", "custom admin/routes.ts", "Verifies HMAC-SHA256 admin session cookie; redirects to login if invalid."],
    ["Global Error Handler", "middleware/errorHandler.ts", "Catches all unhandled errors, sanitizes request bodies, logs to error_reports, returns JSON error."],
]
add_table(
    ["Middleware", "Library / Location", "Purpose"],
    mw_rows,
    [1.6, 1.8, 3.1]
)

add_heading("10.4 Communication Protocols", 2)
proto_rows = [
    ["HTTPS", "Frontend ↔ Backend", "TLS-encrypted HTTP/1.1. Enforced in production via HSTS header."],
    ["REST / HTTP 1.1", "SPA → /api/v1", "RESTful JSON API. Standard HTTP verbs and status codes."],
    ["HTTP Form POST", "Admin Browser → /admin", "Traditional form submission with CSRF token in body."],
    ["Prisma Protocol", "Backend → Database", "Prisma ORM binary protocol over TCP (PostgreSQL wire protocol or SQLite file I/O)."],
    ["SMTP / STARTTLS", "Backend → Email Provider", "Port 587 with STARTTLS for OTP email delivery."],
    ["PgBouncer / pgwire", "Prisma → Supabase", "PostgreSQL wire protocol through PgBouncer connection pooler on port 6543."],
]
add_table(
    ["Protocol", "Channel", "Details"],
    proto_rows,
    [1.5, 1.8, 3.2]
)

add_figure(os.path.join(DIAGRAMS_DIR, "integration-diagram.png"), "Figure 10.1: Production Cloud Infrastructure and Service Integration")
add_note_box("Editable Mermaid source code is available at: documentation/diagram-sources/integration-diagram.mmd", "DIAGRAM SOURCE")

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════════
# SECTION 11: SECURITY IMPLEMENTATION
# ═══════════════════════════════════════════════════════════════════
add_heading("Chapter 11: Security Implementation", 1)

add_heading("11.1 Authentication — JWT (SPA)", 2)

add_figure(os.path.join(ADD_DIR, "authentication-workflow.png"), "Figure 11.1: Dual-Channel Authentication and Token Lifecycle")
add_note_box("Editable Mermaid source code is available at: documentation/diagram-sources/authentication-workflow.mmd", "DIAGRAM SOURCE")
jwt_rows = [
    ["Access Token Format", "JWT (HS256)", "Implemented"],
    ["Access Token Lifespan", "15 minutes", "Implemented"],
    ["Access Token Storage", "In-memory JavaScript (never localStorage/sessionStorage)", "Implemented"],
    ["Refresh Token Format", "High-entropy random string", "Implemented"],
    ["Refresh Token Lifespan", "7 days", "Implemented"],
    ["Refresh Token Hashing", "SHA-256 before database storage", "Implemented"],
    ["Refresh Token Rotation", "Single-use; each refresh invalidates prior token", "Implemented"],
    ["Reuse Detection", "Re-use of revoked token kills all sessions for that user", "Implemented"],
    ["Access Token Revocation", "JTI stored in revoked_tokens table on logout", "Implemented"],
]
add_table(["Property", "Value", "Status"], jwt_rows, [2.0, 3.0, 1.5])

add_heading("11.2 Authentication — Admin Session Cookie", 2)
admin_rows = [
    ["Session Token", "HMAC-SHA256 signed cookie (batanes_admin_session)", "Implemented"],
    ["Cookie Security", "HttpOnly=true, Secure=true (production), SameSite=Lax", "Implemented"],
    ["Session Lifespan", "12 hours", "Implemented"],
    ["CSRF Token", "Random hex string in separate cookie (batanes_admin_csrf)", "Implemented"],
    ["CSRF Verification", "Double-submit pattern, timing-safe comparison", "Implemented"],
]
add_table(["Property", "Value", "Status"], admin_rows, [2.0, 3.0, 1.5])

add_heading("11.3 Password and Credential Security", 2)
pw_rows = [
    ["Password Hashing", "bcryptjs, 12 rounds (login/registration)", "Implemented"],
    ["OTP Hashing", "bcryptjs, 10 rounds before storage", "Implemented"],
    ["OTP Generation", "crypto.randomInt(100000, 1000000)", "Implemented"],
    ["OTP Expiry", "15 minutes", "Implemented"],
    ["OTP Max Attempts", "5 (tracked in attempts_count column)", "Implemented"],
]
add_table(["Mechanism", "Implementation", "Status"], pw_rows, [2.0, 3.0, 1.5])

add_heading("11.4 Input Validation and Injection Prevention", 2)
valid_rows = [
    ["Request body validation", "Zod schemas (backend/src/schemas/)", "Implemented"],
    ["SQL injection prevention", "Prisma ORM — 100% parameterized queries, no raw SQL", "Implemented"],
    ["Sort parameter whitelist", "Explicit allowlist: newest, salary_desc, salary_asc", "Implemented"],
    ["Log sanitization", "sanitizeRequestBody() redacts: password, token, otp_code, authorization, secret", "Implemented"],
]
add_table(["Mechanism", "Implementation", "Status"], valid_rows, [2.0, 3.0, 1.5])

add_heading("11.5 File Upload Security", 2)
file_rows = [
    ["Extension whitelist", "Only .pdf and .docx accepted", "Implemented"],
    ["Magic byte verification", "PDF: %PDF (0x25,0x50,0x44,0x46); DOCX: PK (0x50,0x4B)", "Implemented"],
    ["Maximum file size", "5 MB strictly enforced", "Implemented"],
    ["Filename sanitization", "User filename discarded; stored as resume_{userId}_{timestamp}.{ext}", "Implemented"],
    ["Access control", "Owner / Admin / Employer reviewing applicant only", "Implemented"],
]
add_table(["Control", "Implementation", "Status"], file_rows, [2.0, 3.0, 1.5])

add_heading("11.6 HTTP Security Headers", 2)
header_rows = [
    ["X-Content-Type-Options", "nosniff", "Custom middleware", "Implemented"],
    ["X-Frame-Options", "DENY", "Custom middleware", "Implemented"],
    ["Strict-Transport-Security", "max-age=31536000; includeSubDomains (production)", "Custom middleware", "Implemented"],
    ["Content-Security-Policy", "default-src 'self', configured for admin SSR", "Helmet", "Implemented"],
    ["Referrer-Policy", "strict-origin-when-cross-origin", "Helmet", "Implemented"],
]
add_table(["Header", "Value", "Applied By", "Status"], header_rows, [2.0, 2.0, 1.5, 1.0])

add_heading("11.7 Security Gaps and Recommendations", 2)
gaps = [
    ("Resume storage ephemeral (Medium)", "Migrate to Supabase Storage, S3, or Cloudflare R2 for production resilience."),
    ("No general API rate limiting (Low)", "Consider global API rate limit (100 req/min per IP) in addition to auth-specific limits."),
    ("DEMO_MODE in production (High)", "Strictly enforce DEMO_MODE=false in Render production. Demo credentials are well-known."),
    ("No backend integration tests (Medium)", "Add automated API integration tests to prevent security regression on future changes."),
]
for title, rec in gaps:
    p = doc.add_paragraph()
    run1 = p.add_run(f"• {title}: ")
    run1.bold = True
    run2 = p.add_run(rec)

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════════
# SECTION 12: TESTING PROCEDURES
# ═══════════════════════════════════════════════════════════════════
add_heading("Chapter 12: Testing Procedures and Results", 1)

add_note_box(
    "Test results marked 'Not Verified' indicate that the test scenario exists and is logically sound, "
    "but was not executed or verified during this documentation analysis session. "
    "No test results have been fabricated.",
    "TESTING INTEGRITY NOTICE"
)

add_heading("12.1 Testing Strategy", 2)
strategy_rows = [
    ["Static Type Checking", "TypeScript Compiler (tsc --noEmit)", "Backend + Frontend", "Implemented"],
    ["Unit/Component Tests", "Vitest 1.6 + JSDOM", "Frontend components", "Implemented"],
    ["Zero-Jargon Audit", "Vitest custom suite (zero_jargon.test.ts)", "UI text contract", "Implemented"],
    ["Integration Tests", "Not found in repository", "Backend API endpoints", "Not Implemented"],
    ["End-to-End Tests", "Not found in repository", "Full user flows", "Not Implemented"],
]
add_table(
    ["Layer", "Tool", "Scope", "Status"],
    strategy_rows,
    [1.6, 1.8, 1.8, 1.3]
)

add_heading("12.2 Test Cases", 2)

tc_rows = [
    ["TC-001", "TypeScript Backend", "tsc --noEmit on backend/src/", "Zero type errors", "Not Executed in this session", "Not Verified"],
    ["TC-002", "TypeScript Frontend", "tsc --noEmit on frontend/src/", "Zero type errors", "Not Executed in this session", "Not Verified"],
    ["TC-010", "User Registration", "POST /auth/register valid seeker data", "201 Created, JWT pair", "Not Executed", "Not Verified"],
    ["TC-011", "User Registration", "POST /auth/register duplicate username", "409 Conflict", "Not Executed", "Not Verified"],
    ["TC-012", "User Login", "POST /auth/login valid credentials", "200 OK, JWT pair", "Not Executed", "Not Verified"],
    ["TC-013", "User Login", "POST /auth/login wrong password", "401 Unauthorized", "Not Executed", "Not Verified"],
    ["TC-014", "Token Refresh", "POST /auth/refresh valid token", "200 OK, new token pair", "Not Executed", "Not Verified"],
    ["TC-015", "Token Refresh", "POST /auth/refresh revoked token", "401, all sessions killed", "Not Executed", "Not Verified"],
    ["TC-016", "Rate Limiting", "POST /auth/login >5 times in 60s", "429 Too Many Requests", "Not Executed", "Not Verified"],
    ["TC-017", "OTP Reset", "Request password reset valid email", "200, OTP email sent", "Not Executed", "Not Verified"],
    ["TC-018", "OTP Reset", "Submit expired OTP", "400 Bad Request", "Not Executed", "Not Verified"],
    ["TC-019", "OTP Reset", "Submit OTP >5 attempts", "400 Max attempts exceeded", "Not Executed", "Not Verified"],
    ["TC-030", "Job Listing Guest", "GET /jobs without JWT", "200, preview cards only", "Not Executed", "Not Verified"],
    ["TC-031", "Job Listing Seeker", "GET /jobs with seeker JWT", "200, full job data", "Not Executed", "Not Verified"],
    ["TC-032", "Job Listing Employer", "GET /jobs with employer JWT", "403 Forbidden", "Not Executed", "Not Verified"],
    ["TC-033", "Job Soft-Delete", "DELETE /jobs/:id by non-owner employer", "403 Forbidden", "Not Executed", "Not Verified"],
    ["TC-040", "Application Submit", "POST /applications as seeker", "201, notifications sent", "Not Executed", "Not Verified"],
    ["TC-041", "Duplicate Application", "Same seeker+job twice", "409 Conflict", "Not Executed", "Not Verified"],
    ["TC-050", "Resume Upload", "POST valid PDF under 5MB", "200, resume_url updated", "Not Executed", "Not Verified"],
    ["TC-051", "Resume Upload", "POST file >5MB", "400 Size rejected", "Not Executed", "Not Verified"],
    ["TC-052", "Resume Upload", "POST .exe as .pdf extension", "400 Magic byte mismatch", "Not Executed", "Not Verified"],
    ["TC-060", "Skill Score", "All required skills matched", "skillScore = 70.0", "Not Executed", "Not Verified"],
    ["TC-061", "Skill Score", "No matching skills", "skillScore = 0.0", "Not Executed", "Not Verified"],
    ["TC-062", "Geo Score", "Same municipality and barangay", "geoScore = 30.0", "Not Executed", "Not Verified"],
    ["TC-063", "Geo Score", "Same island, different municipality", "geoScore = 15.0", "Not Executed", "Not Verified"],
    ["TC-070", "Admin Login", "Valid admin credentials", "Redirect to /admin/dashboard", "Not Executed", "Not Verified"],
    ["TC-071", "CSRF Protection", "POST /admin/users/:id/suspend without CSRF", "403 Forbidden", "Not Executed", "Not Verified"],
    ["TC-072", "Self-Suspend Guard", "Admin suspends own account", "400 Cannot suspend yourself", "Not Executed", "Not Verified"],
]
add_table(
    ["Test ID", "Module", "Scenario", "Expected", "Actual", "Status"],
    tc_rows,
    [0.6, 1.2, 1.8, 1.4, 1.2, 0.8]
)

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════════
# SECTION 13: DEPLOYMENT AND USER INSTRUCTIONS
# ═══════════════════════════════════════════════════════════════════
add_heading("Chapter 13: Deployment Information and User Instructions", 1)

add_heading("13.1 System Requirements", 2)
req_rows = [
    ["Node.js", "v20.0.0 or higher", "Required"],
    ["pnpm", "v9.0.0 or higher (v12.4.2 recommended)", "Required"],
    ["Git", "Any recent version", "Required"],
    ["PostgreSQL 16", "Required for production (Supabase managed)", "Production"],
    ["Docker", "Optional — for local Postgres simulation", "Optional"],
    ["openssl or Node.js", "For generating cryptographic secrets", "Production"],
]
add_table(["Requirement", "Version", "Environment"], req_rows, [2.0, 2.5, 2.0])

add_heading("13.2 Local Development Setup", 2)
add_para("Step 1: Clone the repository and install dependencies")
add_code_block("git clone https://github.com/your-org/Batanes_Niche.git\ncd Batanes_Niche\npnpm install")

add_para("Step 2: Configure environment variables")
add_code_block("copy .env.example .env\n# Edit backend/.env to set DB_PROVIDER=sqlite and other values")

add_para("Step 3: Initialize the database")
add_code_block("pnpm db:setup\n# Creates SQLite DB, pushes schema, seeds demo data")

add_para("Step 4: Start development servers")
add_code_block("# Terminal 1 — Backend (port 8000)\npnpm dev:backend\n\n# Terminal 2 — Frontend (port 5173)\npnpm dev:frontend")

add_para("Windows automated alternative:")
add_code_block("development\\scripts\\setup.bat\ndevelopment\\scripts\\start.bat")

add_heading("13.3 Production Deployment", 2)
deploy_rows = [
    ["Database (Supabase)", "Create PostgreSQL project in ap-southeast-1 region. Obtain Transaction Pooler URL (port 6543) and Direct Connection URL (port 5432). Apply schema via Prisma or SQL Editor.", "Phase 1"],
    ["Backend (Render)", "Connect GitHub repository. Build: pnpm install && prisma generate && pnpm build:render. Start: node backend/dist/main.js. Configure all environment variables. Health check: /health.", "Phase 2"],
    ["Frontend (Vercel)", "Connect GitHub repository. Root Directory: frontend. Build: pnpm run build. Output: dist. Set VITE_API_BASE_URL to Render backend URL.", "Phase 3"],
    ["CORS Sync", "After Vercel deployment, update ALLOWED_ORIGINS on Render to exact Vercel domain URL.", "Phase 4"],
    ["Verification", "Check /health and /ready endpoints. Test registration, login, and admin portal access.", "Phase 4"],
]
add_table(
    ["Step", "Description", "Phase"],
    deploy_rows,
    [1.5, 4.0, 0.7]
)

add_heading("13.4 Development Accounts (Local Dev Only)", 2)
add_note_box(
    "The following credentials exist in the SQLite seed database only. These accounts must NEVER be "
    "deployed to production. Set DEMO_MODE=false and ADMIN_INITIAL_PASSWORD=removed in production.",
    "SECURITY WARNING"
)
dev_accounts = [
    ["Platform Admin", "admin", "admin@batanesniche.ph", "AdminSecure123!", "/admin (SSR)"],
    ["Demo Employer", "batanes_inn", "manager@batanesinn.ph", "EmployerSecure123!", "Frontend"],
    ["Demo Seeker", "ivatan_guide", "juan@batanesguide.ph", "SeekerSecure123!", "Frontend"],
    ["Employer", "bacasejos", "jesi.bacasejos@gmail.com", "EmployerSecure123!", "Frontend"],
    ["Seeker", "gabotero", "gab.joland@gmail.com", "SeekerSecure123!", "Frontend"],
]
add_table(
    ["Role", "Username", "Email", "Dev Password", "Access"],
    dev_accounts,
    [1.0, 1.1, 1.8, 1.4, 1.2]
)

add_heading("13.5 User Instructions Summary", 2)
add_para("Detailed user instructions are provided in documentation/supporting-documents/User-Manual.md. Summary by role:")

user_guide_rows = [
    ["Guest", "Browse jobs → View job details → Register (seeker or employer)"],
    ["Job Seeker", "Register → Login → Complete profile → Upload resume → Browse/filter jobs → Apply → Track applications → Manage notifications → Bookmark jobs"],
    ["Employer", "Register → Login → Complete company profile → Post jobs → Review applicants → Accept/reject → Search candidate directory"],
    ["Administrator", "Login at /admin → Monitor dashboard → Manage users (suspend/restore) → Moderate jobs → Review error reports → Review audit trail"],
]
add_table(["Role", "Key Workflow Steps"], user_guide_rows, [1.2, 5.3])

add_heading("13.6 Application Screenshots", 2)
add_para(
    "Design reference images for the application interface are available in the Reference-UI/ directory "
    "in the repository root, organized by platform (Desktop-UI, Mobile-UI) and theme (day/night)."
)
add_note_box(
    "Live application screenshots should be captured from the running application and stored in "
    "documentation/screenshots/ for the final academic submission. The Reference-UI/ mockups "
    "accurately represent the designed application interface.",
    "SCREENSHOT NOTE"
)

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════════
# SECTION 14: CONCLUSION AND RECOMMENDATIONS
# ═══════════════════════════════════════════════════════════════════
add_heading("Chapter 14: Conclusion and Recommendations", 1)

add_heading("14.1 Project Summary", 2)
add_para(
    "The Batanes Niche Job Portal Version 2 is a production-ready, full-stack web application that "
    "successfully addresses the unique employment marketplace challenges of the province of Batanes, "
    "Philippines. The system delivers a hyper-local job matching platform built on a robust technology "
    "stack: React 18 SPA for public user interfaces, Express.js with TypeScript for the REST API backend, "
    "Nunjucks SSR for a secure administrative portal, Prisma ORM for database abstraction, and PostgreSQL "
    "(Supabase) for managed cloud data persistence."
)

add_heading("14.2 Achievement Summary", 2)
achievements = [
    "Full dual-channel authentication implemented: JWT rotation with in-memory storage for the public SPA, and HMAC-SHA256 session cookies with CSRF protection for the isolated admin portal.",
    "Canonical Batanes geographic data model encoding 3 islands, 6 municipalities, and 29 barangays with alternate name aliases and location validation.",
    "Deterministic two-tier recommendation engine delivering explainable, non-black-box candidate and job matching based on skill overlap (0–70 pts) and geographic proximity (0–30 pts).",
    "Defense-in-depth file upload security: extension whitelist, magic byte verification, 5 MB size limit, filename sanitization, and access-controlled downloads.",
    "Zero-jargon UI contract enforced by automated testing to ensure accessibility for Ivatan users.",
    "Append-only audit trail logging all administrative actions with actor, IP, and target metadata.",
    "Environment-switchable database (SQLite ↔ PostgreSQL) with no application code changes.",
    "Complete cloud deployment stack: Vercel (frontend) + Render (backend API) + Supabase (database).",
    "Comprehensive developer documentation across 23 markdown modules covering architecture, API, security, deployment, testing, and geographic data.",
]
for a in achievements:
    add_bullet(a)

add_heading("14.3 Known Limitations", 2)
known_limitations = [
    "Resume file storage is ephemeral on Render's free tier — files are lost on each deployment.",
    "The backend REST API lacks automated integration tests.",
    "No end-to-end test framework is implemented.",
    "Rate limiting is applied only to authentication endpoints, not general API routes.",
    "Schema management uses prisma db push rather than versioned migrations.",
]
for lim in known_limitations:
    add_bullet(lim)

add_heading("14.4 Recommendations for Future Development", 2)
recommendations = [
    ("Migrate Resume Storage to Cloud Object Storage",
     "Implement Supabase Storage, Amazon S3, or Cloudflare R2 for persistent resume storage. "
     "The codebase is explicitly prepared for this migration."),
    ("Implement Backend Integration Tests",
     "Add Vitest or Jest integration tests for all /api/v1 endpoints using a test SQLite database. "
     "Target >80% endpoint coverage."),
    ("Add End-to-End Testing",
     "Implement Playwright or Cypress tests for critical user journeys: register → login → apply → employer review."),
    ("Migrate to Prisma Migrate",
     "Transition from prisma db push to prisma migrate dev for versioned, auditable database schema evolution as the system matures."),
    ("Implement Cloud Object Storage Before Production Launch",
     "Resume storage must be migrated before widespread production use to prevent user data loss."),
    ("Add General API Rate Limiting",
     "Implement a global rate limit (e.g., 100 requests/min per IP) for all API endpoints as an additional DDoS protection layer."),
    ("Explore Progressive Web App (PWA) Features",
     "Service Worker and offline caching could improve reliability in areas with intermittent internet connectivity — a real concern for outer island users."),
    ("Consider Versioned API",
     "As the system evolves, establish a formal API versioning strategy to prevent breaking changes for existing clients."),
    ("Multi-language Support (Ivatan/Filipino)",
     "Long-term, adding Ivatan or Filipino language options could significantly improve accessibility for older Ivatan users."),
]
for i, (title, desc) in enumerate(recommendations, 1):
    p = doc.add_paragraph()
    run1 = p.add_run(f"{i}. {title}: ")
    run1.bold = True
    run2 = p.add_run(desc)

add_heading("14.5 Documentation Maintenance", 2)
add_para(
    "This documentation is designed to evolve alongside the project. When changes are made to the application:"
)
maintenance_steps = [
    "Consult CHANGELOG.md to identify the current documentation version.",
    "Update only the affected sections — do not regenerate the entire document for minor changes.",
    "Update Mermaid source files in diagram-sources/ and re-render PNG exports when architecture or database schema changes.",
    "Update API-Reference.md when endpoint signatures or request/response formats change.",
    "Update Security-Analysis.md when security mechanisms are added or modified.",
    "Record all documentation changes in CHANGELOG.md with version, date, and affected sections.",
]
for i, step in enumerate(maintenance_steps, 1):
    add_numbered(step)

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════════
# REFERENCES
# ═══════════════════════════════════════════════════════════════════
add_heading("References", 1)
add_para("The following are the actual project documentation sources consulted during this analysis. No external fabricated citations have been added.")

ref_docs = [
    "Batanes Niche Job Portal – README.md (primary project documentation)",
    "backend/prisma/schema.prisma (database schema — ground truth for ERD)",
    "backend/src/main.ts (application entry point and middleware configuration)",
    "backend/src/api/v1/ (all REST API route modules)",
    "backend/src/services/ (all domain service implementations)",
    "backend/src/admin/routes.ts (admin SSR portal implementation)",
    "backend/src/core/geography.ts (canonical Batanes geographic data)",
    "backend/src/services/recommendationService.ts (scoring algorithm implementation)",
    "backend/src/middleware/rateLimiter.ts (rate limiting configuration)",
    "SECURITY.md (application security specification)",
    "DEPLOYMENT.md (production deployment guide)",
    "ENVIRONMENT_VARIABLES.md (environment configuration reference)",
    "DATABASE_SETUP.md (database configuration and migration guide)",
    "PRODUCTION_READINESS.md (production audit findings)",
    "TROUBLESHOOTING.md (operational troubleshooting runbook)",
    "development/Documentation/ (23-module developer documentation library)",
    "Reference-UI/ (design mockups: Desktop-UI, Mobile-UI, New-UI)",
]
for i, ref in enumerate(ref_docs, 1):
    p = doc.add_paragraph()
    p.add_run(f"[{i}] {ref}")
    p.paragraph_format.space_after = Pt(2)

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════════
# APPENDICES
# ═══════════════════════════════════════════════════════════════════
add_heading("Appendices", 1)

add_heading("Appendix A: Supporting Documents Index", 2)
appendix_rows = [
    ["API-Reference.md", "Complete REST API endpoint reference with request/response formats and authentication requirements."],
    ["Installation-Guide.md", "Step-by-step local development setup and cloud production deployment instructions."],
    ["User-Manual.md", "Role-specific user instructions for Job Seekers, Employers, and Administrators."],
    ["Security-Analysis.md", "Detailed security implementation analysis with implementation status per mechanism."],
    ["Testing-Documentation.md", "Testing strategy, test infrastructure documentation, and full test case table."],
]
add_table(["Document", "Purpose"], appendix_rows, [2.0, 4.5])
add_note_box("All supporting documents are located at: documentation/supporting-documents/", "LOCATION")

add_heading("Appendix B: Diagram Sources Index", 2)
diagram_rows = [
    ["system-architecture.mmd", "Full 4-tier system architecture (Client → Frontend → Backend → Database → External)"],
    ["database-erd.mmd", "12-table ERD from actual Prisma schema"],
    ["component-diagram.mmd", "Backend services, routes, repositories, and frontend structure"],
    ["data-flow-diagram.mmd", "Application submission sequence diagram (Seeker → SPA → API → DB)"],
    ["integration-diagram.mmd", "Vercel / Render / Supabase / SMTP deployment integration"],
    ["authentication-workflow.mmd", "JWT login, silent refresh, and OTP password reset sequence"],
    ["recommendation-engine.mmd", "Two-tier scoring algorithm flowchart"],
]
add_table(["Mermaid Source File", "Diagram Description"], diagram_rows, [2.5, 4.0])
add_note_box("All diagram source files are at: documentation/diagram-sources/", "LOCATION")

add_heading("Appendix C: Implementation Status Summary", 2)
status_rows = [
    ["User Registration + Authentication (JWT)", "Implemented"],
    ["OTP Password Reset", "Implemented"],
    ["Job Seeker Profile + Resume Upload", "Implemented"],
    ["Employer Profile + Job Posting", "Implemented"],
    ["Application Submission + Status Tracking", "Implemented"],
    ["Job Bookmarks (Saved Jobs)", "Implemented"],
    ["In-App Notifications", "Implemented"],
    ["Deterministic Recommendation Engine", "Implemented"],
    ["Admin SSR Portal (Nunjucks)", "Implemented"],
    ["Audit Logging (Append-Only)", "Implemented"],
    ["Error Report Logging", "Implemented"],
    ["SQLite ↔ PostgreSQL Switching", "Implemented"],
    ["Docker Compose Deployment Config", "Implemented"],
    ["Rate Limiting (Auth Endpoints)", "Implemented"],
    ["File Upload Security (Magic Bytes)", "Implemented"],
    ["Real-time Chat / WebSockets", "Not Implemented (V2 Intentional Exclusion)"],
    ["Offline Background Sync (PWA)", "Not Implemented (V2 Intentional Exclusion)"],
    ["Cloud Object Storage for Resumes", "Not Implemented (Filesystem — Ephemeral)"],
    ["Backend Integration Tests", "Not Implemented"],
    ["End-to-End Tests (Playwright/Cypress)", "Not Implemented"],
]
add_table(["Feature", "Status"], status_rows, [4.0, 2.5])

doc.add_paragraph()
add_hr()
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run(
    "Batanes Niche Job Portal – Technical Documentation v1.0.0\n"
    "Analysis Date: November 18, 2026 | Branch: New-Features | Commit: d2bac96\n"
    "All rights reserved. Developed for the Province of Batanes, Philippines."
)
run.font.size = Pt(9)
run.font.italic = True
run.font.color.rgb = GRAY

# Save
doc.save(OUTPUT_PATH)
print(f"DOCX saved to: {OUTPUT_PATH}")
