# Documentation – Batanes Niche Job Portal v2.0

This directory contains the complete technical documentation package for the **Batanes Niche Job Portal** (Version 2).

## Directory Structure

```
documentation/
├── Project-Technical-Documentation.docx   ← Primary academic submission document
├── README.md                               ← This file
├── CHANGELOG.md                            ← Documentation version history
│
├── diagrams/                               ← Rendered diagram images (PNG/SVG)
│   ├── system-architecture.png
│   ├── component-diagram.png
│   ├── database-erd.png
│   ├── data-flow-diagram.png
│   ├── integration-diagram.png
│   └── additional-diagrams/
│       ├── authentication-workflow.png
│       └── recommendation-engine.png
│
├── diagram-sources/                        ← Editable Mermaid source files
│   ├── system-architecture.mmd
│   ├── component-diagram.mmd
│   ├── database-erd.mmd
│   ├── data-flow-diagram.mmd
│   ├── integration-diagram.mmd
│   ├── authentication-workflow.mmd
│   └── recommendation-engine.mmd
│
├── screenshots/                            ← Application screenshots
│   └── [capture from running app]
│       Note: See Reference-UI/ in project root for design mockups
│
├── supporting-documents/                   ← Technical reference documents
│   ├── API-Reference.md
│   ├── Installation-Guide.md
│   ├── User-Manual.md
│   ├── Security-Analysis.md
│   └── Testing-Documentation.md
│
└── appendices/                             ← Additional technical references
```

## Primary Document

**`Project-Technical-Documentation.docx`** is the main academic submission document containing all 14 required sections:

1. Project Title and System Overview
2. Background and Problem Statement
3. Project Objectives
4. Scope and Limitations
5. Functional and Non-Functional Requirements
6. System Architecture Diagram
7. System Design and Component Descriptions
8. Database ERD
9. System Integration and Communication
10. APIs, Middleware, and Protocols
11. Security Implementation
12. Testing Procedures and Results
13. Deployment Information and User Instructions
14. Conclusion and Recommendations

## Diagram Sources

All diagrams are authored in **Mermaid** format (`.mmd` files) for editability and version control compatibility. Render PNG/SVG exports using:

```bash
# Install Mermaid CLI
npm install -g @mermaid-js/mermaid-cli

# Render all diagram sources
cd documentation/diagram-sources
mmdc -i system-architecture.mmd -o ../diagrams/system-architecture.png -w 1600 -H 1200
mmdc -i database-erd.mmd -o ../diagrams/database-erd.png -w 1600 -H 2000
mmdc -i component-diagram.mmd -o ../diagrams/component-diagram.png -w 1600 -H 1400
mmdc -i data-flow-diagram.mmd -o ../diagrams/data-flow-diagram.png -w 1200 -H 1600
mmdc -i integration-diagram.mmd -o ../diagrams/integration-diagram.png -w 1600 -H 900
mmdc -i authentication-workflow.mmd -o ../diagrams/additional-diagrams/authentication-workflow.png -w 1200 -H 2000
mmdc -i recommendation-engine.mmd -o ../diagrams/additional-diagrams/recommendation-engine.png -w 1000 -H 1200
```

## Documentation Version

| Field | Value |
|---|---|
| Documentation Version | 1.0.0 |
| Analysis Date | 2026-11-18 |
| Repository Branch | New-Features |
| Latest Commit Analyzed | d2bac96 |
| Project Version | 2.0.0 |

## Maintenance

See `CHANGELOG.md` for version history and future update instructions.

When the application changes, update only the affected sections rather than regenerating the entire documentation.
