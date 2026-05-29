# Digital PDF Signoff System - UI/UX Design Mockups & Specifications

## 1. User Dashboard

### 1.1 Layout Overview

```
┌─────────────────────────────────────────────────────────────┐
│ LOGO          Navigation Menu              User Menu (▼)    │
├──────────────────────────────────────────────────────────────┤
│ Dashboard > My Documents                                     │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  📊 QUICK SUMMARY                                             │
│  ┌──────────┬──────────┬──────────┬──────────┐              │
│  │ Assigned │Downloaded│Submitted│  Overdue │              │
│  │    15    │    10    │    5    │    0     │              │
│  └──────────┴──────────┴──────────┴──────────┘              │
│                                                               │
│  📄 MY DOCUMENTS                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Document Name          Status        Deadline  Actions  ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ Annual Report 2024     NOT_DOWNLOADED  30 days  Download││
│  │                        🔵 Blue Badge    Left    View    ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ Financial Statement    DOWNLOADED      25 days  Upload  ││
│  │                        🟢 Green Badge    Left    View    ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ Compliance Form        SUBMITTED       20 days  View    ││
│  │                        🟡 Yellow Badge   Left    Track   ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ Q1 Report             APPROVED        Completed Download ││
│  │                        🟢 Green Badge            Receipt  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  Filters: [Status ▼] [Department ▼] [Date ▼]              │
│  Sort by: [Deadline ▼]                                      │
│                                                               │
│  [< Previous]  Page 1 of 3  [Next >]                         │
└──────────────────────────────────────────────────────────────┘
```

### 1.2 Document Detail Page

```
┌─────────────────────────────────────────────────────────────┐
│ Dashboard > My Documents > [Annual Report 2024]             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ANNUAL REPORT 2024                                          │
│  Status: NOT_DOWNLOADED  🔵 Due in 30 days                  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ DOCUMENT DETAILS                                     │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ Category: Financial                                 │  │
│  │ Version: 1.0                                        │  │
│  │ File Size: 2.5 MB                                  │  │
│  │ Effective Date: June 1, 2024                       │  │
│  │ Deadline: June 30, 2024                            │  │
│  │                                                     │  │
│  │ Description:                                        │  │
│  │ Annual financial report for FY 2024               │  │
│  │                                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ DOCUMENT PREVIEW                                     │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  [📄 PDF Preview]                                    │  │
│  │  [WATERMARK: "FOR INTERNAL USE ONLY"]              │  │
│  │  [This watermark appears here in-system]           │  │
│  │                                                     │  │
│  │  Page 1 of 10                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ACTIONS                                              │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ [📥 Download PDF]  [👁️ View Full]  [❌ Close]      │  │
│  │                                                     │  │
│  │ After Download:                                     │  │
│  │ [✍️ Upload Signed PDF]  [📋 View Instructions]     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  SUBMISSION TIMELINE:                                       │
│  ├─ Assigned: 2024-05-29                                  │
│  ├─ Expected Download: —                                  │
│  ├─ Expected Submit: —                                    │
│  ├─ Approval: —                                           │
│  └─ Archive: —                                            │
│                                                              │
│  💡 TIPS:                                                   │
│  • Download the PDF and sign it                            │
│  • You can sign digitally or print & scan                 │
│  • Upload the signed PDF using the form below              │
│  • Admin will review and approve/reject                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Upload Signed Document Page

```
┌─────────────────────────────────────────────────────────────┐
│ Dashboard > [Annual Report 2024] > Upload                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  UPLOAD SIGNED DOCUMENT                                     │
│                                                              │
│  Document: Annual Report 2024                              │
│  Current Status: DOWNLOADED                                 │
│  Deadline: June 30, 2024 (30 days remaining)               │
│                                                              │
│  ┌────────────────────────────────────────────────────┐   │
│  │ SELECT FILE                                        │   │
│  ├────────────────────────────────────────────────────┤   │
│  │ ┌──────────────────────────────────────────────┐  │   │
│  │ │ 📁 Drag & drop your signed PDF here          │  │   │
│  │ │    or click to browse                        │  │   │
│  │ │                                              │  │   │
│  │ │ [Browse Files]                               │  │   │
│  │ └──────────────────────────────────────────────┘  │   │
│  │                                                    │   │
│  │ File requirements:                                │   │
│  │ • Format: PDF only                               │   │
│  │ • Max size: 50 MB                                │   │
│  │ • Must be signed                                 │   │
│  └────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌────────────────────────────────────────────────────┐   │
│  │ ADDITIONAL INFORMATION                             │   │
│  ├────────────────────────────────────────────────────┤   │
│  │ Notes (optional):                                  │   │
│  │ [Text area for submission notes]                  │   │
│  │ [Max 500 characters]                              │   │
│  │                                                    │   │
│  │ ☐ I confirm this is my signed document            │   │
│  │ ☐ I acknowledge the deadline                      │   │
│  └────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌────────────────────────────────────────────────────┐   │
│  │ [Cancel]  [Upload & Submit]                        │   │
│  └────────────────────────────────────────────────────┘   │
│                                                              │
│  UPLOAD PROGRESS:                                           │
│  [████████░░░░░░░░░░] 50% - Uploading...                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Admin Dashboard

### 2.1 Overview

```
┌──────────────────────────────────────────────────────────────┐
│ Admin Dashboard > Overview                                  │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  📊 KEY METRICS                                               │
│  ┌─────────────┬─────────────┬──────────────┬──────────────┐│
│  │   Active    │  Assigned   │  Submitted   │   Pending    ││
│  │ Documents   │    Users    │  Documents   │  Documents   ││
│  │     45      │    2,500    │     750      │    1,200     ││
│  └─────────────┴─────────────┴──────────────┴──────────────┘│
│                                                               │
│  ┌──────────────┬──────────────────────────────────────────┐│
│  │ Completion   │  Overdue  │  Rejection  │  Avg Time    ││
│  │    Rate      │ Documents │    Rate     │  to Submit   ││
│  │    30%       │    550    │    2.5%     │   2.5 days   ││
│  └──────────────┴──────────────┴──────────────┴──────────────┘│
│                                                               │
│  📈 RECENT ACTIVITY                                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Time         Action         Document      User       │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ 10:30 AM     Downloaded     Annual Report John Doe    │ │
│  │ 10:15 AM     Submitted       Q1 Report    Jane Smith  │ │
│  │ 10:00 AM     Distributed    Compliance   Admin User  │ │
│  │ 09:45 AM     Approved        Year Report Mike Brown  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  📄 RECENT DOCUMENTS                                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Document            Assigned  Submitted  Rate  Actions│ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ Annual Report 2024     150       45      30%   Track  │ │
│  │ Financial Statement    100       40      40%   Track  │ │
│  │ Compliance Form        200       120     60%   Track  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  Navigation: [Upload Document] [Create Distribution]       │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Upload Document Page

```
┌──────────────────────────────────────────────────────────────┐
│ Admin > Upload Document                                      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  UPLOAD NEW DOCUMENT TEMPLATE                               │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ DOCUMENT INFORMATION                                │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ Document Name *                                     │   │
│  │ [Annual Report 2024                             ]   │   │
│  │                                                     │   │
│  │ Description                                         │   │
│  │ [Annual financial report for FY 2024            ]   │   │
│  │ [Max 500 characters]                            │   │   │
│  │                                                     │   │
│  │ Category *                                          │   │
│  │ [Select: Financial ▼]                             │   │
│  │ [Financial | Legal | HR | Compliance | Other]      │   │
│  │                                                     │   │
│  │ Version *                                           │   │
│  │ [1.0                                            ]   │   │
│  │                                                     │   │
│  │ Effective Date *                                    │   │
│  │ [📅 2024-06-01]                                    │   │
│  │                                                     │   │
│  │ Deadline for Submission *                           │   │
│  │ [📅 2024-06-30]                                    │   │
│  │                                                     │   │
│  │ Additional Options                                  │   │
│  │ ☑ Requires Signature                               │   │
│  │ ☑ Add Watermark on View                            │   │
│  │ ☐ Digital Signature Required                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ FILE UPLOAD                                         │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ Select PDF File *                                   │   │
│  │ ┌──────────────────────────────────────────────┐    │   │
│  │ │ 📁 Drag & drop PDF or click to browse       │    │   │
│  │ │                                             │    │   │
│  │ │ [Browse Files]                              │    │   │
│  │ └──────────────────────────────────────────────┘    │   │
│  │                                                     │   │
│  │ File requirements:                                 │   │
│  │ • Format: PDF (non-editable)                       │   │
│  │ • Max size: 100 MB                                │   │
│  │ • Will be scanned for viruses                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Back]  [Save Draft]  [Upload Document]            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  Success Message:                                            │
│  ✅ Document uploaded successfully!                         │
│  Now distribute to recipients →                             │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 2.3 Distribution Wizard

```
STEP 1: SELECT RECIPIENTS
┌──────────────────────────────────────────────────────────────┐
│ Distribute: Annual Report 2024 > Step 1 of 4               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ SELECT DISTRIBUTION TARGETS                                 │
│                                                               │
│ ☐ All Company (Send to everyone)                             │
│   └─ This will reach 5,500 employees                         │
│                                                               │
│ ☑ Specific Entities                                          │
│   ├─ ☑ Head Office (1,200 employees)                        │
│   ├─ ☐ Jakarta Branch (800 employees)                       │
│   ├─ ☐ Surabaya Branch (600 employees)                      │
│   └─ ☐ Bandung Branch (400 employees)                       │
│                                                               │
│ ☑ Specific Departments                                       │
│   ├─ ☑ Finance (150 employees)                              │
│   ├─ ☑ HR (100 employees)                                   │
│   ├─ ☐ IT (80 employees)                                    │
│   ├─ ☐ Legal (50 employees)                                 │
│   └─ ☐ Compliance (60 employees)                            │
│                                                               │
│ ☐ Specific Users                                             │
│   [Add Users...] [Browse List...]                            │
│                                                               │
│ ☐ Exclude Users                                              │
│   [Add Exclusions...] (e.g., on leave)                      │
│                                                               │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│ PREVIEW: 250 employees will receive this document            │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                               │
│ [Back] [Next: Set Deadline →]                                │
└──────────────────────────────────────────────────────────────┘

STEP 2: SET DEADLINE & REMINDERS
┌──────────────────────────────────────────────────────────────┐
│ Distribute: Annual Report 2024 > Step 2 of 4               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ SET SUBMISSION DEADLINE                                      │
│                                                               │
│ Deadline Date *                                              │
│ [📅 June 30, 2024]    [Today + 30 days]                      │
│                                                               │
│ REMINDER SCHEDULE                                            │
│                                                               │
│ Send automatic reminders at:                                 │
│ ☑ 7 days before deadline     (June 23, 2024)                │
│ ☑ 3 days before deadline     (June 27, 2024)                │
│ ☑ 1 day before deadline      (June 29, 2024)                │
│ ☑ On deadline day            (June 30, 2024)                │
│                                                               │
│ NOTIFICATION SETTINGS                                        │
│                                                               │
│ ☑ Send email notification on distribution                   │
│ ☑ Include document summary in email                         │
│ ☑ Include deadline information                              │
│ ☑ Send reminders to PIC as well                             │
│                                                               │
│ [← Back] [Next: Review & Add Notes →]                        │
└──────────────────────────────────────────────────────────────┘

STEP 3: ADD NOTES
┌──────────────────────────────────────────────────────────────┐
│ Distribute: Annual Report 2024 > Step 3 of 4               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ ADDITIONAL INFORMATION                                       │
│                                                               │
│ Notes to Recipients:                                         │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Please review the Annual Report 2024 carefully.      │  │
│ │ Sign and submit by June 30, 2024.                    │  │
│ │ Contact HR if you have any questions.                │  │
│ │                                                       │  │
│ │ [Max 1000 characters]                                │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
│ ☑ Request Digital Signature                                 │
│ ☑ Send tracking status to PIC                              │
│                                                               │
│ [← Back] [Next: Review & Confirm →]                         │
└──────────────────────────────────────────────────────────────┘

STEP 4: REVIEW & CONFIRM
┌──────────────────────────────────────────────────────────────┐
│ Distribute: Annual Report 2024 > Step 4 of 4               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ DISTRIBUTION SUMMARY                                         │
│                                                               │
│ Document:              Annual Report 2024 (v1.0)            │
│ Recipients:            250 employees                         │
│ Deadline:              June 30, 2024 (30 days)             │
│ Reminders:             H-7, H-3, H-1, On Due              │
│ Require Signature:     Yes                                  │
│ Include Watermark:     Yes                                  │
│ Email Notification:    Yes                                  │
│                                                               │
│ ☐ I confirm the distribution details are correct            │
│                                                               │
│ [← Back] [Cancel] [✓ Distribute Now]                        │
│                                                               │
│ Success Message:                                             │
│ ✅ Distribution created successfully!                       │
│    • 250 employees notified                                 │
│    • Reminders scheduled                                    │
│    • Redirecting to monitoring...                           │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. PIC/Department Monitoring Dashboard

### 3.1 Overview

```
┌──────────────────────────────────────────────────────────────┐
│ PIC Dashboard > Finance Department (Head Office)            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  📊 DEPARTMENT PROGRESS SUMMARY                              │
│                                                               │
│  Total Users: 50                                             │
│  Active Documents: 75                                        │
│                                                               │
│  ┌─────────────┬──────────────┬──────────────┬─────────────┐│
│  │ Not Downloaded │ Downloaded  │ Submitted  │  Overdue   ││
│  │      15        │    30       │    25      │     5      ││
│  │      30%       │    60%      │    50%     │    10%     ││
│  └─────────────┴──────────────┴──────────────┴─────────────┘│
│                                                               │
│  📈 COMPLETION RATE: 50%  [████████░░░░░░░░]               │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ DOCUMENT PROGRESS                                    │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ Document             Not Down│Downloaded│Submitted    │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ Annual Report 2024    10    │    20     │    15       │ │
│  │ Financial Statement   5     │    10     │    10       │ │
│  │ Compliance Form       0     │    0      │    0        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  [View Details] [Send Reminders] [Export Report]            │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 User List with Actions

```
┌──────────────────────────────────────────────────────────────┐
│ PIC Dashboard > User Compliance - Finance Department        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  USERS IN DEPARTMENT: 50                                     │
│                                                               │
│  Filter: [All ▼] Status: [All ▼] [Search...]              │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Name          Email              Status    Rate  Actions
│  ├────────────────────────────────────────────────────────┤ │
│  │ John Doe      john@company.com   ⚠️ Overdue  50%  Send  │ │
│  │                                                   Remind │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ Jane Smith    jane@company.com   ✅ On Track 100% View   │ │
│  │                                                   Details │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ Mike Brown    mike@company.com   ⏳ Pending  60% View    │ │
│  │                                                   Details │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  [Send Bulk Reminders]  [Export to Excel]                   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Monitoring & Analytics Dashboard

### 4.1 Document Progress Tracking

```
┌──────────────────────────────────────────────────────────────┐
│ Admin > Monitoring > Document Progress (Annual Report)      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ANNUAL REPORT 2024 - PROGRESS TRACKING                     │
│                                                               │
│  Distribution Date: May 29, 2024                            │
│  Deadline: June 30, 2024 (30 days)                          │
│  Days Elapsed: 0 days                                       │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ OVERALL PROGRESS                                    │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ Total Assigned:          150                        │  │
│  │ Not Downloaded:          30 (20%)  [░░░░░░░░░░░░░░]│  │
│  │ Downloaded:              60 (40%)  [████░░░░░░░░░░░]│  │
│  │ Submitted:               45 (30%)  [█████░░░░░░░░░░]│  │
│  │ Approved:                40 (27%)  [████░░░░░░░░░░░]│  │
│  │ Rejected:                5  (3%)   [░░░░░░░░░░░░░░░]│  │
│  │ Overdue:                 10 (7%)   [░░░░░░░░░░░░░░░]│  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ PROGRESS BY ENTITY/DEPARTMENT                       │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ Finance Dept         50 assigned → 25 submitted 50%  │  │
│  │ HR Dept              30 assigned → 12 submitted 40%  │  │
│  │ IT Dept              40 assigned → 8  submitted 20%  │  │
│  │ Legal Dept           30 assigned → 0  submitted 0%   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  📊 CHARTS:                                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Submission Trend      │ Status Distribution           │  │
│  │ [Line Graph]          │ [Pie Chart]                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  ⚠️ OVERDUE ALERTS:                                          │
│  [None - Distribution is current]                            │
│                                                               │
│  [Export Report] [Send Reminders] [Drill Down]              │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. UI Component Design Specifications

### 5.1 Color Scheme

```
Primary Colors:
• Accent Blue:     #2563EB
• Success Green:   #10B981
• Warning Orange:  #F59E0B
• Error Red:       #EF4444
• Info Cyan:       #06B6D4

Neutral Colors:
• Dark Gray:       #1F2937
• Medium Gray:     #6B7280
• Light Gray:      #F3F4F6
• White:          #FFFFFF

Status Colors:
• Not Downloaded:  #3B82F6 (Blue)
• Downloaded:      #10B981 (Green)
• Submitted:       #F59E0B (Orange)
• Approved:        #10B981 (Green)
• Rejected:        #EF4444 (Red)
• Overdue:         #DC2626 (Dark Red)
```

### 5.2 Typography

```
Headings:
• H1: 32px, Bold, Color: #1F2937
• H2: 24px, Bold, Color: #1F2937
• H3: 20px, SemiBold, Color: #1F2937

Body:
• Regular: 16px, Normal, Color: #374151
• Small: 14px, Normal, Color: #6B7280
• XSmall: 12px, Normal, Color: #9CA3AF

Links:
• Color: #2563EB
• Hover: #1D4ED8
• Underline: Hover only
```

### 5.3 Status Badge Styles

```
NOT_DOWNLOADED: 🔵 Blue badge, icon
DOWNLOADED: 🟢 Green badge, icon
SUBMITTED: 🟡 Orange badge, icon
APPROVED: ✅ Green checkmark, icon
REJECTED: ❌ Red X, icon
OVERDUE: ⚠️ Warning icon, Red
```

---

## 6. Responsive Design

### 6.1 Breakpoints

```
Mobile: < 640px
Tablet: 640px - 1024px
Desktop: > 1024px

Mobile Layout:
• Single column
• Stacked components
• Full-width inputs/buttons
• Bottom navigation

Tablet Layout:
• Two columns where applicable
• Condensed tables
• Side navigation drawer

Desktop Layout:
• Multi-column layouts
• Full sidebar navigation
• Expanded tables
```

---

## 7. Accessibility Standards

- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatible
- High contrast mode support
- Focus indicators on all interactive elements
- Alt text for all images
- Proper heading hierarchy
- Form labels associated with inputs

---

## 8. Key UI Features

1. **PDF Viewer Integration**
   - Display PDF with watermark overlay
   - Page navigation
   - Zoom controls
   - Download option (no watermark)

2. **File Upload**
   - Drag & drop support
   - Progress bar
   - Validation feedback
   - File preview

3. **Charts & Graphs**
   - Real-time updates
   - Interactive tooltips
   - Export functionality
   - Print support

4. **Notifications**
   - Toast notifications for actions
   - In-app notification center
   - Email notification templates

5. **Data Tables**
   - Sorting capabilities
   - Pagination
   - Filtering
   - Column visibility toggle
   - Export to CSV/Excel

This design is enterprise-grade, user-friendly, and optimized for accessibility and usability.
