# Digital PDF Signoff System - Database Design

## 1. Entity Relationship Diagram (ERD)

```
┌────────────────────┐
│     users          │
├────────────────────┤
│ id (PK)            │
│ email (UNIQUE)     │◄─────────────┐
│ username           │              │
│ password_hash      │              │
│ full_name          │              │
│ department_id (FK) │──────────┐   │
│ entity_id (FK)     │────────┐ │   │
│ role_id (FK)       │──────┐ │ │   │
│ is_active          │      │ │ │   │
│ last_login         │      │ │ │   │
│ created_at         │      │ │ │   │
│ updated_at         │      │ │ │   │
└────────────────────┘      │ │ │   │
                            │ │ │   │
┌────────────────────┐      │ │ │   │
│  roles             │◄─────┘ │ │   │
├────────────────────┤        │ │   │
│ id (PK)            │        │ │   │
│ name               │        │ │   │
│ description        │        │ │   │
│ created_at         │        │ │   │
└────────────────────┘        │ │   │
                              │ │   │
┌────────────────────┐        │ │   │
│  entities          │◄───────┘ │   │
├────────────────────┤          │   │
│ id (PK)            │          │   │
│ name               │          │   │
│ description        │          │   │
│ parent_entity_id (FK)         │   │
│ pic_user_id (FK)   │──────────┼───┤
│ created_at         │          │   │
└────────────────────┘          │   │
                                │   │
┌────────────────────┐          │   │
│  departments       │◄─────────┘   │
├────────────────────┤              │
│ id (PK)            │              │
│ name               │              │
│ entity_id (FK)     │──────────┐   │
│ pic_user_id (FK)   │──────────┼───┤
│ created_at         │          │   │
└────────────────────┘          │   │
                                │   │
        ┌───────────────────────┘   │
        │                           │
┌───────▼──────────────────────┐   │
│  documents                   │   │
├──────────────────────────────┤   │
│ id (PK)                      │   │
│ name                         │   │
│ category                     │   │
│ version                      │   │
│ file_path (S3)               │   │
│ file_size                    │   │
│ file_hash (checksum)         │   │
│ created_by_id (FK)           │───┤
│ effective_date               │   │
│ deadline_date                │   │
│ parent_document_id (FK)      │   │
│ is_active                    │   │
│ created_at                   │   │
│ updated_at                   │   │
└──────────────────────────────┘   │
        │                          │
        │    ┌──────────────────────┘
        │    │
┌───────▼────▼──────────────────────┐
│  document_distributions           │
├───────────────────────────────────┤
│ id (PK)                           │
│ document_id (FK)                  │
│ target_type (ENTITY/DEPT/USER)    │
│ target_entity_id (FK, nullable)   │
│ target_department_id (FK, null)   │
│ target_user_id (FK, nullable)     │
│ deadline                          │
│ created_by_id (FK)                │
│ created_at                        │
└───────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────┐
│  user_documents                   │
├───────────────────────────────────┤
│ id (PK)                           │
│ user_id (FK)                      │
│ document_id (FK)                  │
│ distribution_id (FK)              │
│ status (NOT_DOWNLOADED/etc)       │
│ downloaded_at                     │
│ download_count                    │
│ submitted_at                      │
│ submitted_file_path (S3)          │
│ submitted_file_hash               │
│ approved_at                       │
│ approved_by_id (FK)               │
│ approval_notes                    │
│ rejected_at                       │
│ rejection_reason                  │
│ is_overdue                        │
│ created_at                        │
│ updated_at                        │
└───────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────┐
│  audit_logs                       │
├───────────────────────────────────┤
│ id (PK)                           │
│ user_document_id (FK)             │
│ action (DOWNLOAD/UPLOAD/etc)      │
│ action_timestamp                  │
│ ip_address                        │
│ user_agent                        │
│ notes                             │
│ created_at                        │
└───────────────────────────────────┘

┌────────────────────────────────┐
│  notifications                 │
├────────────────────────────────┤
│ id (PK)                        │
│ user_id (FK)                   │
│ user_document_id (FK)          │
│ type (REMINDER/ALERT/etc)      │
│ status (SENT/FAILED/PENDING)   │
│ channel (EMAIL/SMS/PUSH)       │
│ sent_at                        │
│ created_at                     │
└────────────────────────────────┘

┌────────────────────────────────┐
│  api_audit_logs                │
├────────────────────────────────┤
│ id (PK)                        │
│ user_id (FK)                   │
│ api_endpoint                   │
│ http_method                    │
│ request_body (hashed)          │
│ response_status                │
│ timestamp                      │
│ ip_address                     │
│ user_agent                     │
│ duration_ms                    │
└────────────────────────────────┘
```

---

## 2. Database Schema

### 2.1 Users Table

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    department_id BIGINT REFERENCES departments(id),
    entity_id BIGINT REFERENCES entities(id),
    role_id BIGINT NOT NULL REFERENCES roles(id),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    last_login TIMESTAMP,
    last_ip_address VARCHAR(45),
    password_changed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_department_id ON users(department_id);
CREATE INDEX idx_users_entity_id ON users(entity_id);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_is_active ON users(is_active);
```

### 2.2 Roles Table

```sql
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed data
INSERT INTO roles (name, description) VALUES
('SUPER_ADMIN', 'Full system access'),
('ADMIN', 'Document management and distribution'),
('PIC', 'Department/Entity monitoring'),
('USER', 'Regular user access');
```

### 2.3 Entities Table

```sql
CREATE TABLE entities (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    code VARCHAR(50) UNIQUE,
    parent_entity_id BIGINT REFERENCES entities(id),
    pic_user_id BIGINT REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_entities_name ON entities(name);
CREATE INDEX idx_entities_parent_entity_id ON entities(parent_entity_id);
CREATE INDEX idx_entities_pic_user_id ON entities(pic_user_id);
```

### 2.4 Departments Table

```sql
CREATE TABLE departments (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    entity_id BIGINT NOT NULL REFERENCES entities(id),
    pic_user_id BIGINT REFERENCES users(id),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    CONSTRAINT unique_dept_per_entity UNIQUE (name, entity_id)
);

CREATE INDEX idx_departments_entity_id ON departments(entity_id);
CREATE INDEX idx_departments_pic_user_id ON departments(pic_user_id);
CREATE INDEX idx_departments_name ON departments(name);
```

### 2.5 Documents Table

```sql
CREATE TABLE documents (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    version VARCHAR(50) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    file_hash VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) DEFAULT 'application/pdf',
    created_by_id BIGINT NOT NULL REFERENCES users(id),
    effective_date DATE NOT NULL,
    deadline_date DATE,
    parent_document_id BIGINT REFERENCES documents(id),
    requires_signature BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    view_watermark BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    CONSTRAINT unique_doc_version UNIQUE (name, version)
);

CREATE INDEX idx_documents_name ON documents(name);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_created_by_id ON documents(created_by_id);
CREATE INDEX idx_documents_effective_date ON documents(effective_date);
CREATE INDEX idx_documents_deadline_date ON documents(deadline_date);
CREATE INDEX idx_documents_is_active ON documents(is_active);
```

### 2.6 Document Distributions Table

```sql
CREATE TABLE document_distributions (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents(id),
    target_type VARCHAR(50) NOT NULL, -- 'ENTITY', 'DEPARTMENT', 'USER'
    target_entity_id BIGINT REFERENCES entities(id),
    target_department_id BIGINT REFERENCES departments(id),
    target_user_id BIGINT REFERENCES users(id),
    deadline DATE NOT NULL,
    notes TEXT,
    created_by_id BIGINT NOT NULL REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_target CHECK (
        (target_type = 'ENTITY' AND target_entity_id IS NOT NULL AND target_department_id IS NULL AND target_user_id IS NULL) OR
        (target_type = 'DEPARTMENT' AND target_department_id IS NOT NULL AND target_entity_id IS NULL AND target_user_id IS NULL) OR
        (target_type = 'USER' AND target_user_id IS NOT NULL AND target_entity_id IS NULL AND target_department_id IS NULL)
    )
);

CREATE INDEX idx_doc_dist_document_id ON document_distributions(document_id);
CREATE INDEX idx_doc_dist_target_entity ON document_distributions(target_entity_id);
CREATE INDEX idx_doc_dist_target_dept ON document_distributions(target_department_id);
CREATE INDEX idx_doc_dist_target_user ON document_distributions(target_user_id);
CREATE INDEX idx_doc_dist_deadline ON document_distributions(deadline);
```

### 2.7 User Documents Table

```sql
CREATE TABLE user_documents (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    document_id BIGINT NOT NULL REFERENCES documents(id),
    distribution_id BIGINT REFERENCES document_distributions(id),
    status VARCHAR(50) DEFAULT 'NOT_DOWNLOADED', -- NOT_DOWNLOADED, DOWNLOADED, SUBMITTED, APPROVED, REJECTED, OVERDUE
    downloaded_at TIMESTAMP,
    download_count INTEGER DEFAULT 0,
    submitted_at TIMESTAMP,
    submitted_file_path VARCHAR(500),
    submitted_file_hash VARCHAR(255),
    submitted_file_size BIGINT,
    approved_at TIMESTAMP,
    approved_by_id BIGINT REFERENCES users(id),
    approval_notes TEXT,
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    is_overdue BOOLEAN DEFAULT false,
    overdue_notified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_doc UNIQUE (user_id, document_id),
    CONSTRAINT valid_status CHECK (status IN ('NOT_DOWNLOADED', 'DOWNLOADED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'OVERDUE'))
);

CREATE INDEX idx_user_doc_user_id ON user_documents(user_id);
CREATE INDEX idx_user_doc_document_id ON user_documents(document_id);
CREATE INDEX idx_user_doc_status ON user_documents(status);
CREATE INDEX idx_user_doc_submitted_at ON user_documents(submitted_at);
CREATE INDEX idx_user_doc_approved_at ON user_documents(approved_at);
CREATE INDEX idx_user_doc_is_overdue ON user_documents(is_overdue);
CREATE INDEX idx_user_doc_created_at ON user_documents(created_at);
```

### 2.8 Audit Logs Table

```sql
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    user_document_id BIGINT REFERENCES user_documents(id),
    action VARCHAR(100) NOT NULL, -- DOWNLOAD, UPLOAD, VIEW, APPROVE, REJECT, etc.
    resource_type VARCHAR(100), -- DOCUMENT, USER_DOCUMENT, etc.
    resource_id BIGINT,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    notes TEXT,
    action_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_action CHECK (action IN ('DOWNLOAD', 'UPLOAD', 'VIEW', 'APPROVE', 'REJECT', 'DISTRIBUTE', 'LOGIN', 'LOGOUT', 'DELETE', 'UPDATE', 'CREATE'))
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(action_timestamp);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
```

### 2.9 Notifications Table

```sql
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    user_document_id BIGINT REFERENCES user_documents(id),
    type VARCHAR(100) NOT NULL, -- REMINDER, ALERT, DEADLINE, etc.
    channel VARCHAR(50) DEFAULT 'EMAIL', -- EMAIL, SMS, PUSH
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, SENT, FAILED, RETRY
    subject VARCHAR(500),
    message TEXT,
    sent_at TIMESTAMP,
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_for TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

### 2.10 API Audit Logs Table

```sql
CREATE TABLE api_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    api_endpoint VARCHAR(500) NOT NULL,
    http_method VARCHAR(10) NOT NULL, -- GET, POST, PUT, DELETE
    request_body_hash VARCHAR(255),
    response_status INTEGER,
    error_message TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    duration_ms INTEGER,
    
    CONSTRAINT valid_http_method CHECK (http_method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH'))
);

CREATE INDEX idx_api_audit_user_id ON api_audit_logs(user_id);
CREATE INDEX idx_api_audit_endpoint ON api_audit_logs(api_endpoint);
CREATE INDEX idx_api_audit_timestamp ON api_audit_logs(timestamp);
CREATE INDEX idx_api_audit_status ON api_audit_logs(response_status);
```

### 2.11 Permissions Table

```sql
CREATE TABLE permissions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(100),
    action VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL REFERENCES roles(id),
    permission_id BIGINT NOT NULL REFERENCES permissions(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_role_permission UNIQUE (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
```

---

## 3. Data Dictionary

| Table | Column | Type | Key | Constraints | Notes |
|-------|--------|------|-----|-------------|-------|
| users | id | BIGSERIAL | PK | NOT NULL | Auto-increment |
| users | email | VARCHAR(255) | UNQ | NOT NULL | Email validation |
| users | role_id | BIGINT | FK | NOT NULL | References roles |
| documents | id | BIGSERIAL | PK | NOT NULL | Auto-increment |
| documents | file_hash | VARCHAR(255) | - | NOT NULL | MD5/SHA-256 |
| user_documents | status | VARCHAR(50) | - | NOT NULL | Enum-like |
| audit_logs | action_timestamp | TIMESTAMP | - | NOT NULL | Audit trail |

---

## 4. Key Relationships

### Master Data
- **users** ← many-to-one → **roles**
- **users** ← many-to-one → **departments**
- **users** ← many-to-one → **entities**
- **departments** ← many-to-one → **entities**
- **entities** ← self-referential → **entities** (parent)

### Document Management
- **documents** ← many-to-one → **users** (created_by)
- **documents** ← self-referential → **documents** (version history)

### Distribution & Signoff
- **document_distributions** ← many-to-one → **documents**
- **document_distributions** ← many-to-one → **entities/departments/users** (target)
- **user_documents** ← many-to-one → **users**
- **user_documents** ← many-to-one → **documents**
- **user_documents** ← many-to-one → **document_distributions**

### Audit Trail
- **audit_logs** ← many-to-one → **users**
- **audit_logs** ← many-to-one → **user_documents**

---

## 5. Performance Considerations

### Indexing Strategy
- All Foreign Keys indexed
- Status columns indexed (frequent filtering)
- Date columns indexed (range queries)
- User ID indexed (common filter)
- Timestamps indexed (sorting/filtering)

### Partitioning Strategy (for scale)
```sql
-- Partition user_documents by year
CREATE TABLE user_documents_2024 PARTITION OF user_documents
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- Partition audit_logs by month
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### Archiving Strategy
- Documents older than 5 years → Archive storage
- Completed user_documents → Archive after 2 years
- Audit logs → Retain 7 years (compliance)

---

## 6. Backup & Recovery

### Backup Strategy
```
Daily Full Backup (2:00 AM UTC)
    ↓
Incremental Backup (every 6 hours)
    ↓
Transaction Logs (streaming)
    ↓
Point-in-Time Recovery (30 days)
```

### Recovery Procedures
- RPO: 1 hour
- RTO: 15 minutes
- Test monthly

---

## 7. Security Measures

### Data Protection
- ✅ Passwords: bcrypt + salt (cost factor 12)
- ✅ Sensitive fields: AES-256 encryption
- ✅ File hashes: SHA-256
- ✅ Audit logs: Immutable (trigger-based)
- ✅ Soft deletes: deleted_at column

### Access Control
- Row-level security (RLS) policies
- Database user with limited privileges
- Connection encryption (SSL/TLS)
- IP whitelisting (if applicable)
