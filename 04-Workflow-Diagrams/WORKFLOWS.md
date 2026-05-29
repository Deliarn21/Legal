# Digital PDF Signoff System - Workflow & User Flow Diagrams

## 1. Document Lifecycle Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    DOCUMENT LIFECYCLE                           │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  ADMIN UPLOADS   │
│  PDF TEMPLATE    │
└────────┬─────────┘
         │
         │ Admin uploads PDF, sets metadata
         │ (name, category, version, dates)
         │
         ▼
┌──────────────────────────────┐
│  DOCUMENT CREATED            │
│  (Initial Status: CREATED)   │
└────────┬─────────────────────┘
         │
         │ System stores file in S3
         │ Creates version record
         │ Calculates file hash
         │
         ▼
┌──────────────────────────────┐
│  ADMIN DISTRIBUTES           │
│  TO TARGETS                  │
└────────┬─────────────────────┘
         │
         │ Admin selects:
         │ • Entities
         │ • Departments
         │ • Specific Users
         │ • Deadline date
         │
         ▼
┌──────────────────────────────┐
│  DISTRIBUTION CREATED        │
│  USER_DOCUMENTS GENERATED    │
└────────┬─────────────────────┘
         │
         │ For each user:
         │ • Create user_document record
         │ • Status: NOT_DOWNLOADED
         │ • Set deadline
         │ • Send notification
         │
         ▼
┌──────────────────────────────┐
│  IN PROGRESS - TRACKING      │
│  (Status: DOWNLOADED)        │
└────────┬─────────────────────┘
         │
         │ User actions:
         │ • Download PDF (no watermark)
         │ • View in system (watermark)
         │ • Record download timestamp
         │ • Increment download count
         │
         ▼
┌──────────────────────────────┐
│  USER SIGNS OFFLINE          │
│  (Process outside system)    │
└────────┬─────────────────────┘
         │
         │ User options:
         │ • Print & hand-sign
         │ • Digital signature
         │ • Esign tool
         │
         ▼
┌──────────────────────────────┐
│  USER UPLOADS SIGNED PDF     │
│  (Status: SUBMITTED)         │
└────────┬─────────────────────┘
         │
         │ User actions:
         │ • Upload signed PDF
         │ • System validates file
         │ • Record upload timestamp
         │ • Calculate file hash
         │ • Store in S3
         │
         ▼
┌──────────────────────────────┐
│  ADMIN REVIEWS               │
│  (Status: IN_REVIEW)         │
└────────┬─────────────────────┘
         │
         ├─ APPROVE
         │  │
         │  ▼
         │  ┌─────────────────────────┐
         │  │ Status: APPROVED        │
         │  │ • Archive document      │
         │  │ • Record timestamp      │
         │  │ • Send confirmation     │
         │  └─────────────────────────┘
         │
         └─ REJECT
            │
            ▼
            ┌─────────────────────────┐
            │ Status: REJECTED        │
            │ • Return to user        │
            │ • Add rejection reason  │
            │ • Send notification     │
            │ • User can resubmit     │
            └─────────────────────────┘
                    │
                    ▼
            (Return to DOWNLOADED state)

┌──────────────────────────────┐
│  COMPLIANCE                  │
│  Ongoing monitoring          │
└────────┬─────────────────────┘
         │
         │ If deadline passes:
         │ • Mark as OVERDUE
         │ • Send reminder
         │ • PIC notification
         │ • Include in reports
         │
         ▼
┌──────────────────────────────┐
│  ARCHIVED                    │
│  After 30 days               │
└──────────────────────────────┘
```

---

## 2. User Signoff Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER SIGNOFF FLOW                          │
└─────────────────────────────────────────────────────────────────┘

USER LOGIN
    │
    ▼
┌──────────────────────────────┐
│ Dashboard                    │
│ • View assigned documents    │
│ • Filter by status           │
│ • Sort by deadline           │
└────────┬─────────────────────┘
         │
         ├─ Select NOT_DOWNLOADED
         │  │
         │  ▼
         │  ┌──────────────────────────────┐
         │  │ Document Detail Page         │
         │  │ • View metadata              │
         │  │ • Watermarked preview        │
         │  │ • Download link              │
         │  │ • Deadline info              │
         │  │ • FAQ/Help                   │
         │  └────────┬─────────────────────┘
         │           │
         │           ▼
         │  ┌──────────────────────────────┐
         │  │ DOWNLOAD PDF                 │
         │  │ (without watermark)          │
         │  │                              │
         │  │ System actions:              │
         │  │ • Log download               │
         │  │ • Record timestamp           │
         │  │ • Change status → DOWNLOADED │
         │  │ • Increment counter          │
         │  │ • Audit trail entry          │
         │  └────────┬─────────────────────┘
         │           │
         │           ▼
         │  ┌──────────────────────────────┐
         │  │ File saved to user's device  │
         │  │ PDF opens in their editor    │
         │  └──────────────────────────────┘
         │
         ├─ Select DOWNLOADED
         │  │
         │  ▼
         │  ┌──────────────────────────────┐
         │  │ Action Options:              │
         │  │ 1. Download again            │
         │  │ 2. View in-system (watermark)│
         │  │ 3. Upload signed PDF         │
         │  └──────────────────────────────┘
         │
         └─ Select SUBMITTED/APPROVED/REJECTED
            │
            ▼
            ┌──────────────────────────────┐
            │ View Status & History        │
            │ • Timeline of actions        │
            │ • Approval notes             │
            │ • Download submitted file    │
            └──────────────────────────────┘

USER SIGNS DOCUMENT OFFLINE
    │
    ├─ Print & Hand-sign
    │
    ├─ Digital Signature Tool
    │
    └─ E-Sign Service
    
USER RETURNS TO SYSTEM
    │
    ▼
┌──────────────────────────────┐
│ Dashboard - Select Document  │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ UPLOAD SIGNED PDF                    │
│ • Drag & drop or file picker         │
│ • Add optional notes                 │
│ • Confirm submission                 │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ VALIDATION                           │
│ • File type check (PDF only)         │
│ • File size limit (< 50MB)           │
│ • Virus scan (ClamAV)                │
│ • Basic PDF validation               │
└────────┬─────────────────────────────┘
         │
         ├─ VALID
         │  │
         │  ▼
         │  ┌──────────────────────────────┐
         │  │ UPLOAD SUCCESS               │
         │  │                              │
         │  │ System actions:              │
         │  │ • Store in S3                │
         │  │ • Calculate file hash        │
         │  │ • Record upload timestamp    │
         │  │ • Status → SUBMITTED         │
         │  │ • Notify admin               │
         │  │ • Audit log entry            │
         │  └──────────────────────────────┘
         │
         └─ INVALID
            │
            ▼
            ┌──────────────────────────────┐
            │ ERROR MESSAGE                │
            │ • Show error reason          │
            │ • Allow retry                │
            │ • Log failed attempt         │
            └──────────────────────────────┘

USER RECEIVES UPDATE
    │
    ├─ Email notification
    │  │
    │  ▼
    │  Document Approved → Archive
    │
    └─ Document Rejected → Resubmit
       │
       ▼
       Status back to DOWNLOADED
       Can re-upload signed PDF
```

---

## 3. Admin Distribution Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                 ADMIN DISTRIBUTION WORKFLOW                     │
└─────────────────────────────────────────────────────────────────┘

ADMIN LOGIN
    │
    ▼
┌──────────────────────────┐
│ Admin Dashboard          │
│ • Documents list         │
│ • Create distribution    │
│ • Monitor progress       │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ SELECT DOCUMENT TO DISTRIBUTE        │
│ • Recent documents                   │
│ • Search by name                     │
│ • Filter by category                 │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ DISTRIBUTION WIZARD                  │
│ Step 1: Select Recipients            │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ TARGET SELECTION                     │
│                                      │
│ ☐ All Company                        │
│ ☐ Specific Entity/Entities:          │
│   ☑ Head Office                      │
│   ☐ Branch Jakarta                   │
│                                      │
│ ☐ Specific Department(s):            │
│   ☑ Finance                          │
│   ☑ HR                               │
│                                      │
│ ☐ Specific User(s):                  │
│   • Add/Select users                 │
│                                      │
│ ☐ Exclude Users:                     │
│   • On leave, etc.                   │
│                                      │
│ Preview: 150 users will receive     │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Step 2: Set Deadline                 │
│                                      │
│ Deadline: [30 days from today]       │
│ Reminder Schedule:                   │
│  ☑ H-7 (7 days before)              │
│  ☑ H-3 (3 days before)              │
│  ☑ H-1 (1 day before)               │
│                                      │
│ [Calendar picker]                    │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Step 3: Additional Options           │
│                                      │
│ ☑ Send email notification            │
│ ☐ Request signature                  │
│ ☐ Digital signature required         │
│                                      │
│ Notes to users:                      │
│ [Text area]                          │
│ "Please review and sign"             │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Step 4: Review & Confirm             │
│                                      │
│ Document: Annual Report 2024         │
│ Recipients: 150 users                │
│ Deadline: 2024-06-30                 │
│ Reminders: H-7, H-3, H-1            │
│                                      │
│ [Back] [Cancel] [Distribute]        │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ DISTRIBUTION INITIATED               │
│                                      │
│ System actions:                      │
│ • Create distribution record         │
│ • Create 150 user_documents          │
│ • Queue email notifications          │
│ • Schedule reminders                 │
│ • Log audit trail                    │
│ • Show success message               │
│                                      │
│ Distribution ID: DIST-2024-0001      │
│ Status: Active                       │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ ADMIN REDIRECTED TO MONITORING       │
│ • Real-time progress tracking        │
│ • User-by-user status                │
│ • Department analytics               │
│ • Overdue tracking                   │
│ • Reminder management                │
└──────────────────────────────────────┘
```

---

## 4. Monitoring & PIC Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│              PIC MONITORING WORKFLOW                            │
└─────────────────────────────────────────────────────────────────┘

PIC LOGIN
    │
    ▼
┌──────────────────────────────────┐
│ PIC DASHBOARD                    │
│ Summary for their entity/dept     │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ MONITORING SUMMARY               │
│                                  │
│ Finance Department               │
│ └─ Head Office, PT Comp          │
│                                  │
│ Total Users: 50                  │
│ Active Assignments: 75           │
│ • Not Downloaded: 15             │
│ • Downloaded: 30                 │
│ • Submitted: 25                  │
│ • Overdue: 5                     │
│ Completion Rate: 50%             │
│                                  │
│ [View Details] [Send Reminders]  │
└────────┬─────────────────────────┘
         │
         ├─ Select "View Details"
         │  │
         │  ▼
         │  ┌──────────────────────────────┐
         │  │ DOCUMENT PROGRESS            │
         │  │ Filter options:              │
         │  │ • Document type              │
         │  │ • Status                     │
         │  │ • Date range                 │
         │  │ • Overdue only               │
         │  │                              │
         │  │ Results:                     │
         │  │ [Table with users/status]    │
         │  │ • Name, Email                │
         │  │ • Department                 │
         │  │ • Document status            │
         │  │ • Days remaining             │
         │  │ • Actions (Send reminder)    │
         │  └──────────────────────────────┘
         │
         ├─ Select "Send Reminders"
         │  │
         │  ▼
         │  ┌──────────────────────────────┐
         │  │ REMINDER SETUP               │
         │  │                              │
         │  │ Send to:                     │
         │  │ ☑ Not Downloaded (15)        │
         │  │ ☑ Downloaded (30)            │
         │  │ ☑ Overdue (5)                │
         │  │                              │
         │  │ Message Template:            │
         │  │ [Select template or custom]  │
         │  │                              │
         │  │ [Send] [Preview]             │
         │  └──────────────────────────────┘
         │
         └─ Select "Analytics"
            │
            ▼
            ┌──────────────────────────────┐
            │ ANALYTICS DASHBOARD          │
            │                              │
            │ Charts:                      │
            │ • Submission trend (line)    │
            │ • Status distribution (pie)  │
            │ • Department comparison (bar)│
            │                              │
            │ KPIs:                        │
            │ • Avg submission time        │
            │ • Fastest users              │
            │ • Slowest users              │
            │ • Completion rate trend      │
            │                              │
            │ Export options:              │
            │ • PDF Report                 │
            │ • Excel Spreadsheet          │
            │ • Email to supervisor        │
            └──────────────────────────────┘

ADMIN WORKFLOW (Extended)
    │
    ├─ View All Progress
    │  │
    │  ▼
    │  Dashboard with all entities
    │  Drill down to specific entity/dept
    │
    ├─ Export Reports
    │  │
    │  ▼
    │  Select date range
    │  Choose format (PDF/Excel/CSV)
    │  Schedule recurring reports
    │
    └─ Manage Reminders
       │
       ▼
       • Auto-reminders (scheduled)
       • Manual reminders (PIC sends)
       • Track notification status
       • Failed attempts retry
```

---

## 5. Exception Handling Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│              EXCEPTION HANDLING WORKFLOW                        │
└─────────────────────────────────────────────────────────────────┘

EVENT: USER MARKED OVERDUE
    │
    ▼
┌────────────────────────────────────┐
│ Overdue Detection (Daily Batch)    │
│ Check deadline vs current date     │
└────────┬─────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Update Status to OVERDUE           │
│ • Mark is_overdue = true           │
│ • Record notification sent         │
│ • Increment retry counter          │
└────────┬─────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Send Notifications:                │
│ • Email to user                    │
│ • Notify PIC                       │
│ • Alert admin                      │
└────────┬─────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Add to Monitoring Reports          │
│ • Overdue list updated             │
│ • Dashboard highlights             │
│ • PIC dashboard alerts             │
└────────────────────────────────────┘

EVENT: FILE UPLOAD FAILURE
    │
    ▼
┌────────────────────────────────────┐
│ Validation Failed                  │
│ • Virus detected                   │
│ • File corrupted                   │
│ • Invalid format                   │
│ • Size exceeded                    │
└────────┬─────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Log Error                          │
│ • Record failure reason            │
│ • Store in audit log               │
│ • Retry count increment            │
└────────┬─────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Return Error to User               │
│ • User-friendly message            │
│ • Retry guidance                   │
│ • Support contact info             │
└────────┬─────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ User Can Retry                     │
│ Fix issue and re-upload            │
└────────────────────────────────────┘

EVENT: DOCUMENT REJECTED BY ADMIN
    │
    ▼
┌────────────────────────────────────┐
│ Rejection Recorded                 │
│ • Set status to REJECTED           │
│ • Store rejection reason           │
│ • Revert to DOWNLOADED state       │
└────────┬─────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Notify User                        │
│ • Email with reason                │
│ • Display in dashboard             │
│ • Allow resubmission               │
└────────┬─────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ User Re-uploads                    │
│ Repeat submission process          │
└────────────────────────────────────┘
```

---

## 6. Integration Points

```
┌──────────────────────────────────────────────────────────────┐
│           EXTERNAL SYSTEM INTEGRATIONS                       │
└──────────────────────────────────────────────────────────────┘

┌─ Email Service (SMTP/SendGrid) ──────┐
│ • Notification sending                │
│ • Reminder scheduling                 │
│ • Bulk email delivery                 │
│ • Bounce handling                     │
└───────────────────────────────────────┘

┌─ LDAP/Active Directory ───────────────┐
│ • User authentication                 │
│ • Department mapping                  │
│ • User sync (daily)                   │
│ • Permission inheritance              │
└───────────────────────────────────────┘

┌─ S3/MinIO Storage ────────────────────┐
│ • PDF file storage                    │
│ • Watermarked version storage         │
│ • Archive storage                     │
│ • Backup & replication                │
└───────────────────────────────────────┘

┌─ Digital Signature Service ───────────┐
│ • Digital signature verification      │
│ • Certificate management              │
│ • Timestamp authority                 │
│ • Compliance support                  │
└───────────────────────────────────────┘

┌─ Virus Scanner (ClamAV) ──────────────┐
│ • File scanning on upload             │
│ • Quarantine infected files           │
│ • Regular definition updates          │
│ • Scan reporting                      │
└───────────────────────────────────────┘

┌─ ERP System (SAP/Oracle) ─────────────┐
│ • User & department data sync         │
│ • Organization hierarchy              │
│ • Role mapping                        │
│ • Cost center allocation              │
└───────────────────────────────────────┘
```

All flow diagrams are implemented in the system with proper state management, error handling, and audit logging throughout.
