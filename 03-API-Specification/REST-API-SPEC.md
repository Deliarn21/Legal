# Digital PDF Signoff System - REST API Specification

## 1. API Overview

### Base URL
```
Production: https://api.signoff.company.com/api/v1
Staging: https://staging-api.signoff.company.com/api/v1
Development: http://localhost:3000/api/v1
```

### Authentication
```
Header: Authorization: Bearer {access_token}
Token Type: JWT (15-minute expiry)
Refresh Token: 7-day expiry (HttpOnly cookie)
```

### Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Success message",
  "timestamp": "2024-05-29T10:30:00Z",
  "requestId": "uuid"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Error message",
    "details": {}
  },
  "timestamp": "2024-05-29T10:30:00Z",
  "requestId": "uuid"
}
```

---

## 2. Authentication Endpoints

### 2.1 User Login
```
POST /auth/login
Content-Type: application/json

Request:
{
  "email": "user@company.com",
  "password": "securePassword123",
  "rememberMe": false
}

Response (200 OK):
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@company.com",
      "fullName": "John Doe",
      "role": "USER",
      "department": "Finance",
      "entity": "Head Office"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}

Response (401 Unauthorized):
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password is incorrect"
  }
}
```

### 2.2 Refresh Token
```
POST /auth/refresh-token
Cookie: refreshToken=...

Response (200 OK):
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

### 2.3 Logout
```
POST /auth/logout

Response (200 OK):
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 2.4 SSO/LDAP Integration (Optional)
```
POST /auth/sso/ldap
Content-Type: application/json

Request:
{
  "username": "jdoe",
  "password": "ldapPassword",
  "provider": "ldap"
}

Response (200 OK):
{
  "success": true,
  "data": {
    "user": {...},
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

---

## 3. Document Management Endpoints

### 3.1 Upload Document Template
```
POST /documents/upload
Content-Type: multipart/form-data
Authorization: Bearer {token}
Role: ADMIN, SUPER_ADMIN

Request:
{
  "file": <PDF file>,
  "name": "Annual Report 2024",
  "category": "Financial",
  "version": "1.0",
  "effectiveDate": "2024-06-01",
  "deadlineDate": "2024-06-30",
  "requiresSignature": true,
  "viewWatermark": true,
  "description": "Annual financial report"
}

Response (201 Created):
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Annual Report 2024",
    "version": "1.0",
    "fileSize": 2048576,
    "fileHash": "sha256hash...",
    "mimeType": "application/pdf",
    "effectiveDate": "2024-06-01",
    "createdAt": "2024-05-29T10:30:00Z"
  }
}
```

### 3.2 Get Document List
```
GET /documents?page=1&limit=20&category=Financial&status=active
Authorization: Bearer {token}

Query Parameters:
- page: Page number (default: 1)
- limit: Items per page (default: 20, max: 100)
- category: Filter by category
- status: active|inactive|all
- search: Search by name

Response (200 OK):
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Annual Report 2024",
        "category": "Financial",
        "version": "1.0",
        "effectiveDate": "2024-06-01",
        "deadlineDate": "2024-06-30",
        "createdBy": "admin@company.com",
        "createdAt": "2024-05-29T10:30:00Z",
        "totalAssignments": 150,
        "submittedCount": 45,
        "submissionRate": 30
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 85,
      "totalPages": 5
    }
  }
}
```

### 3.3 Get Document Details
```
GET /documents/{documentId}
Authorization: Bearer {token}

Response (200 OK):
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Annual Report 2024",
    "category": "Financial",
    "version": "1.0",
    "description": "Annual financial report",
    "fileSize": 2048576,
    "mimeType": "application/pdf",
    "effectiveDate": "2024-06-01",
    "deadlineDate": "2024-06-30",
    "requiresSignature": true,
    "viewWatermark": true,
    "createdBy": {
      "id": 1,
      "fullName": "Admin User",
      "email": "admin@company.com"
    },
    "versions": [
      {
        "version": "1.0",
        "createdAt": "2024-05-29T10:30:00Z"
      }
    ],
    "distributions": [
      {
        "id": 1,
        "targetType": "DEPARTMENT",
        "targetName": "Finance Department",
        "deadline": "2024-06-30",
        "totalAssignments": 50,
        "submittedCount": 25,
        "pendingCount": 25
      }
    ]
  }
}
```

### 3.4 Update Document
```
PUT /documents/{documentId}
Content-Type: application/json
Authorization: Bearer {token}
Role: ADMIN, SUPER_ADMIN

Request:
{
  "name": "Annual Report 2024",
  "category": "Financial",
  "deadlineDate": "2024-07-15",
  "description": "Updated description"
}

Response (200 OK):
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Annual Report 2024",
    "updated": true,
    "updatedAt": "2024-05-29T10:45:00Z"
  }
}
```

### 3.5 Delete Document (Soft Delete)
```
DELETE /documents/{documentId}
Authorization: Bearer {token}
Role: ADMIN, SUPER_ADMIN

Response (200 OK):
{
  "success": true,
  "message": "Document deleted successfully"
}
```

---

## 4. Distribution Endpoints

### 4.1 Distribute Document
```
POST /distributions
Content-Type: application/json
Authorization: Bearer {token}
Role: ADMIN, SUPER_ADMIN

Request:
{
  "documentId": 1,
  "targets": [
    {
      "type": "ENTITY",
      "id": 1
    },
    {
      "type": "DEPARTMENT",
      "id": 5
    },
    {
      "type": "USER",
      "id": 100
    }
  ],
  "deadline": "2024-06-30",
  "notes": "Please review and sign"
}

Response (201 Created):
{
  "success": true,
  "data": {
    "id": 1,
    "document": {
      "id": 1,
      "name": "Annual Report 2024"
    },
    "distributionCount": 150,
    "deadline": "2024-06-30",
    "createdAt": "2024-05-29T10:30:00Z"
  }
}
```

### 4.2 Get Distribution Status
```
GET /distributions/{distributionId}/status
Authorization: Bearer {token}

Response (200 OK):
{
  "success": true,
  "data": {
    "id": 1,
    "document": {
      "id": 1,
      "name": "Annual Report 2024"
    },
    "deadline": "2024-06-30",
    "summary": {
      "total": 150,
      "notDownloaded": 45,
      "downloaded": 60,
      "submitted": 45,
      "approved": 40,
      "rejected": 5,
      "overdue": 10,
      "completionRate": 30
    },
    "byDepartment": [
      {
        "departmentName": "Finance",
        "total": 50,
        "submitted": 25,
        "rate": 50
      }
    ]
  }
}
```

---

## 5. User Document (Signoff) Endpoints

### 5.1 Get Assigned Documents
```
GET /user-documents?page=1&limit=20&status=NOT_DOWNLOADED&sortBy=deadline
Authorization: Bearer {token}

Query Parameters:
- page: Page number
- limit: Items per page
- status: NOT_DOWNLOADED|DOWNLOADED|SUBMITTED|APPROVED|REJECTED|OVERDUE
- sortBy: deadline|createdAt|name

Response (200 OK):
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "document": {
          "id": 1,
          "name": "Annual Report 2024",
          "category": "Financial"
        },
        "status": "NOT_DOWNLOADED",
        "deadline": "2024-06-30",
        "daysRemaining": 31,
        "downloadedAt": null,
        "submittedAt": null,
        "approvedAt": null,
        "createdAt": "2024-05-29T10:30:00Z"
      }
    ],
    "summary": {
      "notDownloaded": 10,
      "downloaded": 5,
      "submitted": 3,
      "overdue": 0
    }
  }
}
```

### 5.2 Download Document
```
GET /user-documents/{userDocumentId}/download
Authorization: Bearer {token}

Response (200 OK):
- File binary stream
- Headers:
  - Content-Type: application/pdf
  - Content-Disposition: attachment; filename="Annual_Report_2024.pdf"
  - Content-Length: 2048576

Side Effects:
- Record download timestamp
- Increment download count
- Update status to DOWNLOADED
- Log audit trail
- Add watermark to in-system viewing
```

### 5.3 Get Document for Viewing
```
GET /user-documents/{userDocumentId}/view
Authorization: Bearer {token}

Response (200 OK):
{
  "success": true,
  "data": {
    "id": 1,
    "documentName": "Annual Report 2024",
    "fileSize": 2048576,
    "mimeType": "application/pdf",
    "pdfUrl": "https://cdn.signoff.company.com/documents/view/uuid",
    "watermarked": true,
    "downloadUrl": "https://api.signoff.company.com/api/v1/user-documents/{userDocumentId}/download",
    "canDownload": true,
    "canUpload": true
  }
}
```

### 5.4 Upload Signed Document
```
POST /user-documents/{userDocumentId}/upload
Content-Type: multipart/form-data
Authorization: Bearer {token}

Request:
{
  "file": <Signed PDF>,
  "notes": "Signed and submitted"
}

Response (200 OK):
{
  "success": true,
  "data": {
    "id": 1,
    "status": "SUBMITTED",
    "submittedAt": "2024-05-29T14:30:00Z",
    "fileHash": "sha256hash...",
    "message": "Document submitted successfully"
  }
}

Response (400 Bad Request):
{
  "success": false,
  "error": {
    "code": "INVALID_FILE",
    "message": "File must be PDF format"
  }
}
```

### 5.5 Get User Document Status
```
GET /user-documents/{userDocumentId}/status
Authorization: Bearer {token}

Response (200 OK):
{
  "success": true,
  "data": {
    "id": 1,
    "document": {
      "id": 1,
      "name": "Annual Report 2024"
    },
    "status": "SUBMITTED",
    "deadline": "2024-06-30",
    "isOverdue": false,
    "timeline": {
      "createdAt": "2024-05-29T10:30:00Z",
      "downloadedAt": "2024-05-29T11:00:00Z",
      "submittedAt": "2024-05-29T14:30:00Z",
      "approvedAt": null,
      "rejectedAt": null
    },
    "submission": {
      "fileHash": "sha256hash...",
      "fileSize": 2050000,
      "notes": "Signed and submitted"
    }
  }
}
```

---

## 6. Monitoring & Analytics Endpoints

### 6.1 Dashboard Summary
```
GET /monitoring/dashboard/summary
Authorization: Bearer {token}
Role: ADMIN, PIC, SUPER_ADMIN

Response (200 OK):
{
  "success": true,
  "data": {
    "totalDocuments": 150,
    "totalAssignments": 2500,
    "submitted": 750,
    "pending": 1200,
    "overdue": 550,
    "completionRate": 30,
    "averageSubmissionTime": "2.5 days",
    "lastUpdated": "2024-05-29T10:30:00Z"
  }
}
```

### 6.2 Document Progress Details
```
GET /monitoring/documents/{documentId}/progress
Authorization: Bearer {token}
Role: ADMIN, PIC, SUPER_ADMIN

Query Parameters:
- entityId: Filter by entity
- departmentId: Filter by department
- status: Filter by status

Response (200 OK):
{
  "success": true,
  "data": {
    "document": {
      "id": 1,
      "name": "Annual Report 2024",
      "deadline": "2024-06-30"
    },
    "summary": {
      "total": 150,
      "notDownloaded": 30,
      "downloaded": 60,
      "submitted": 45,
      "approved": 40,
      "rejected": 5,
      "overdue": 10,
      "completionRate": 30,
      "averageDownloadTime": "0.5 days",
      "averageSubmissionTime": "2.5 days"
    },
    "byEntity": [
      {
        "entityId": 1,
        "entityName": "Head Office",
        "total": 50,
        "submitted": 20,
        "rate": 40,
        "overdue": 5,
        "departments": [
          {
            "departmentId": 1,
            "departmentName": "Finance",
            "total": 25,
            "submitted": 15,
            "rate": 60,
            "overdue": 0
          }
        ]
      }
    ],
    "overdueUsers": [
      {
        "userId": 100,
        "userName": "John Doe",
        "email": "john@company.com",
        "department": "Finance",
        "entity": "Head Office",
        "status": "DOWNLOADED",
        "daysOverdue": 5
      }
    ]
  }
}
```

### 6.3 User Compliance Report
```
GET /monitoring/users/{userId}/compliance
Authorization: Bearer {token}
Role: ADMIN, PIC, SUPER_ADMIN

Response (200 OK):
{
  "success": true,
  "data": {
    "user": {
      "id": 100,
      "name": "John Doe",
      "email": "john@company.com",
      "department": "Finance"
    },
    "summary": {
      "totalAssigned": 15,
      "submitted": 12,
      "pendingDocs": 2,
      "overdueDocs": 1,
      "complianceRate": 80,
      "averageSubmissionTime": "2 days"
    },
    "documents": [
      {
        "documentId": 1,
        "documentName": "Annual Report 2024",
        "status": "SUBMITTED",
        "deadline": "2024-06-30",
        "submittedAt": "2024-05-29T14:30:00Z",
        "timeToSubmit": "3.17 days"
      }
    ]
  }
}
```

### 6.4 Department Analytics
```
GET /monitoring/departments/{departmentId}/analytics
Authorization: Bearer {token}
Role: ADMIN, PIC, SUPER_ADMIN

Query Parameters:
- dateFrom: Start date (YYYY-MM-DD)
- dateTo: End date (YYYY-MM-DD)
- documentId: Filter by document

Response (200 OK):
{
  "success": true,
  "data": {
    "department": {
      "id": 1,
      "name": "Finance Department",
      "entity": "Head Office"
    },
    "summary": {
      "totalUsers": 50,
      "totalAssignments": 150,
      "submitted": 75,
      "rate": 50,
      "overdue": 15,
      "averageSubmissionTime": "2.3 days"
    },
    "timeline": {
      "daily": [
        {
          "date": "2024-05-29",
          "submitted": 10,
          "rate": 35
        }
      ],
      "weekly": [...],
      "monthly": [...]
    },
    "topPerformers": [
      {
        "userName": "Jane Smith",
        "email": "jane@company.com",
        "submitted": 20,
        "averageTime": "1.5 days"
      }
    ],
    "slowest": [
      {
        "userName": "John Doe",
        "email": "john@company.com",
        "submitted": 8,
        "averageTime": "5 days"
      }
    ]
  }
}
```

### 6.5 Export Monitoring Report
```
GET /monitoring/export?format=excel&type=document_progress&documentId=1
Authorization: Bearer {token}
Role: ADMIN, PIC, SUPER_ADMIN

Query Parameters:
- format: excel|pdf|csv
- type: document_progress|user_compliance|department_analytics|audit_trail
- documentId: Document ID (for document_progress)
- dateFrom: Start date
- dateTo: End date

Response (200 OK):
- File binary stream (Excel/PDF)
- Headers:
  - Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  - Content-Disposition: attachment; filename="document_progress_report_20240529.xlsx"
```

---

## 7. Notification Endpoints

### 7.1 Get Notifications
```
GET /notifications?page=1&limit=20&status=PENDING&type=REMINDER
Authorization: Bearer {token}

Response (200 OK):
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "type": "REMINDER",
        "subject": "Reminder: Annual Report Due Soon",
        "message": "Document 'Annual Report 2024' is due in 7 days",
        "status": "PENDING",
        "channel": "EMAIL",
        "createdAt": "2024-05-29T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "unread": 2
    }
  }
}
```

### 7.2 Mark Notification as Read
```
PUT /notifications/{notificationId}/read
Authorization: Bearer {token}

Response (200 OK):
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

## 8. Audit Trail Endpoints

### 8.1 Get Audit Logs
```
GET /audit/logs?page=1&limit=50&action=DOWNLOAD&userId=100&dateFrom=2024-05-01&dateTo=2024-05-29
Authorization: Bearer {token}
Role: ADMIN, SUPER_ADMIN

Query Parameters:
- page, limit
- action: DOWNLOAD|UPLOAD|APPROVE|REJECT|etc
- userId: Filter by user
- resourceType: DOCUMENT|USER_DOCUMENT
- dateFrom, dateTo: Date range
- ipAddress: Filter by IP

Response (200 OK):
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "user": {
          "id": 100,
          "email": "john@company.com",
          "name": "John Doe"
        },
        "action": "DOWNLOAD",
        "resource": {
          "type": "USER_DOCUMENT",
          "id": 1
        },
        "timestamp": "2024-05-29T10:30:00Z",
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "notes": "Downloaded Annual Report 2024"
      }
    ],
    "pagination": {
      "total": 5000,
      "page": 1,
      "limit": 50,
      "totalPages": 100
    }
  }
}
```

### 8.2 Export Audit Trail
```
GET /audit/export?format=excel&dateFrom=2024-05-01&dateTo=2024-05-29
Authorization: Bearer {token}
Role: ADMIN, SUPER_ADMIN

Response (200 OK):
- Excel file with audit logs
```

---

## 9. User Management Endpoints (Admin)

### 9.1 Create User
```
POST /admin/users
Content-Type: application/json
Authorization: Bearer {token}
Role: ADMIN, SUPER_ADMIN

Request:
{
  "email": "newuser@company.com",
  "username": "newuser",
  "fullName": "New User",
  "roleId": 4,
  "departmentId": 1,
  "entityId": 1
}

Response (201 Created):
{
  "success": true,
  "data": {
    "id": 101,
    "email": "newuser@company.com",
    "fullName": "New User",
    "role": "USER",
    "temporaryPassword": "TempPass123456!"
  }
}
```

### 9.2 List Users
```
GET /admin/users?page=1&limit=20&role=USER&departmentId=1
Authorization: Bearer {token}
Role: ADMIN, SUPER_ADMIN

Response (200 OK):
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 100,
        "email": "john@company.com",
        "fullName": "John Doe",
        "role": "USER",
        "department": "Finance",
        "entity": "Head Office",
        "isActive": true,
        "lastLogin": "2024-05-29T10:30:00Z"
      }
    ],
    "pagination": {}
  }
}
```

---

## 10. Error Codes

| Code | Status | Description |
|------|--------|-------------|
| INVALID_REQUEST | 400 | Invalid request parameters |
| INVALID_CREDENTIALS | 401 | Email/password incorrect |
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| DUPLICATE_EMAIL | 409 | Email already exists |
| INVALID_FILE | 400 | File validation failed |
| FILE_TOO_LARGE | 413 | File exceeds size limit |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

---

## 11. Rate Limiting

```
- Standard: 100 requests/minute per user
- Download: 10 requests/minute
- Upload: 5 requests/minute
- Admin: 500 requests/minute
- Public: 30 requests/minute
```

---

## 12. API Documentation

Full API documentation available at:
- Swagger UI: `https://api.signoff.company.com/api-docs`
- OpenAPI Schema: `https://api.signoff.company.com/api-docs/openapi.json`
- Postman Collection: Available in repository
