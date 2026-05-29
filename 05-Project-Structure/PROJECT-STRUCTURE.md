# Digital PDF Signoff System - Project Structure

## 1. Frontend Project Structure (Next.js)

```
digital-pdf-signoff-frontend/
├── public/
│   ├── icons/
│   ├── images/
│   └── assets/
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout
│   │   ├── page.tsx                   # Home page
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   ├── logout/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx               # User dashboard
│   │   │   ├── admin/page.tsx         # Admin dashboard
│   │   │   ├── pic/page.tsx           # PIC dashboard
│   │   │   └── layout.tsx             # Dashboard layout
│   │   ├── documents/
│   │   │   ├── [id]/page.tsx          # Document detail
│   │   │   ├── [id]/view/page.tsx     # View document
│   │   │   ├── [id]/upload/page.tsx   # Upload signed PDF
│   │   │   └── list/page.tsx          # Documents list
│   │   ├── monitoring/
│   │   │   ├── page.tsx               # Monitoring dashboard
│   │   │   ├── [id]/details.tsx       # Document progress
│   │   │   ├── users/[id].tsx         # User compliance
│   │   │   └── reports/page.tsx       # Export reports
│   │   ├── admin/
│   │   │   ├── upload/page.tsx        # Upload new document
│   │   │   ├── distribute/page.tsx    # Distribute document
│   │   │   ├── users/page.tsx         # User management
│   │   │   └── audit/page.tsx         # Audit logs
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── documents/route.ts
│   │   │   └── ...
│   │   └── error.tsx, not-found.tsx
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Loading.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── Pagination.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── LogoutButton.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── dashboard/
│   │   │   ├── UserDashboard.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── PICDashboard.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── DocumentList.tsx
│   │   │   └── ProgressChart.tsx
│   │   ├── documents/
│   │   │   ├── DocumentCard.tsx
│   │   │   ├── DocumentViewer.tsx      # PDF viewer with watermark
│   │   │   ├── UploadForm.tsx
│   │   │   ├── UploadProgress.tsx
│   │   │   └── DocumentMetadata.tsx
│   │   ├── monitoring/
│   │   │   ├── ProgressSummary.tsx
│   │   │   ├── DepartmentAnalytics.tsx
│   │   │   ├── UserComplianceTable.tsx
│   │   │   ├── OverdueList.tsx
│   │   │   └── FilterPanel.tsx
│   │   ├── admin/
│   │   │   ├── DocumentUpload.tsx
│   │   │   ├── DistributionWizard.tsx  # Multi-step form
│   │   │   ├── UserManagement.tsx
│   │   │   └── AuditLogViewer.tsx
│   │   └── charts/
│   │       ├── LineChart.tsx
│   │       ├── BarChart.tsx
│   │       ├── PieChart.tsx
│   │       └── ProgressChart.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useDocument.ts
│   │   ├── useMonitoring.ts
│   │   ├── useNotification.ts
│   │   └── usePagination.ts
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts              # Axios config
│   │   │   ├── endpoints.ts
│   │   │   ├── authApi.ts
│   │   │   ├── documentApi.ts
│   │   │   └── monitoringApi.ts
│   │   ├── utils/
│   │   │   ├── formatters.ts
│   │   │   ├── validators.ts
│   │   │   ├── fileHandlers.ts
│   │   │   └── dateHelpers.ts
│   │   ├── constants/
│   │   │   ├── roles.ts
│   │   │   ├── statuses.ts
│   │   │   ├── apiConstants.ts
│   │   │   └── messages.ts
│   │   └── types/
│   │       ├── user.ts
│   │       ├── document.ts
│   │       ├── distribution.ts
│   │       ├── notification.ts
│   │       └── api.ts
│   │
│   ├── store/
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── documentSlice.ts
│   │   │   ├── monitoringSlice.ts
│   │   │   ├── notificationSlice.ts
│   │   │   └── uiSlice.ts
│   │   ├── store.ts
│   │   └── hooks.ts
│   │
│   ├── middleware/
│   │   ├── auth.ts                   # Auth middleware
│   │   ├── errorHandler.ts           # Error handling
│   │   └── logging.ts
│   │
│   ├── styles/
│   │   ├── globals.css
│   │   ├── variables.css
│   │   └── themes/
│   │       ├── light.css
│   │       └── dark.css
│   │
│   └── env.ts
│
├── .env.local
├── .env.example
├── tailwind.config.js
├── next.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## 2. Backend Project Structure (NestJS)

```
digital-pdf-signoff-backend/
├── src/
│   ├── main.ts                        # App entry point
│   ├── app.module.ts                  # Root module
│   ├── app.controller.ts
│   ├── app.service.ts
│   │
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   ├── local.strategy.ts
│   │   ├── guards/
│   │   │   ├── jwt.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── auth.guard.ts
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts
│   │   │   ├── user.decorator.ts
│   │   │   └── public.decorator.ts
│   │   └── dtos/
│   │       ├── login.dto.ts
│   │       ├── register.dto.ts
│   │       └── token.dto.ts
│   │
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   ├── dtos/
│   │   │   ├── create-user.dto.ts
│   │   │   ├── update-user.dto.ts
│   │   │   └── user-response.dto.ts
│   │   └── repositories/
│   │       └── user.repository.ts
│   │
│   ├── documents/
│   │   ├── documents.module.ts
│   │   ├── documents.controller.ts
│   │   ├── documents.service.ts
│   │   ├── entities/
│   │   │   ├── document.entity.ts
│   │   │   └── document-version.entity.ts
│   │   ├── dtos/
│   │   │   ├── create-document.dto.ts
│   │   │   ├── update-document.dto.ts
│   │   │   └── document-response.dto.ts
│   │   ├── repositories/
│   │   │   └── document.repository.ts
│   │   └── services/
│   │       ├── pdf-processor.service.ts
│   │       ├── file-storage.service.ts
│   │       └── watermark.service.ts
│   │
│   ├── distributions/
│   │   ├── distributions.module.ts
│   │   ├── distributions.controller.ts
│   │   ├── distributions.service.ts
│   │   ├── entities/
│   │   │   └── distribution.entity.ts
│   │   ├── dtos/
│   │   │   ├── create-distribution.dto.ts
│   │   │   └── distribution-response.dto.ts
│   │   ├── repositories/
│   │   │   └── distribution.repository.ts
│   │   └── strategies/
│   │       ├── bulk-distribution.strategy.ts
│   │       └── targeted-distribution.strategy.ts
│   │
│   ├── user-documents/
│   │   ├── user-documents.module.ts
│   │   ├── user-documents.controller.ts
│   │   ├── user-documents.service.ts
│   │   ├── entities/
│   │   │   └── user-document.entity.ts
│   │   ├── dtos/
│   │   │   ├── submission.dto.ts
│   │   │   └── approval.dto.ts
│   │   ├── repositories/
│   │   │   └── user-document.repository.ts
│   │   └── services/
│   │       ├── submission.service.ts
│   │       ├── validation.service.ts
│   │       └── status.service.ts
│   │
│   ├── monitoring/
│   │   ├── monitoring.module.ts
│   │   ├── monitoring.controller.ts
│   │   ├── monitoring.service.ts
│   │   ├── analytics.service.ts
│   │   ├── repositories/
│   │   │   └── monitoring.repository.ts
│   │   └── dtos/
│   │       ├── progress-report.dto.ts
│   │       └── analytics-response.dto.ts
│   │
│   ├── notifications/
│   │   ├── notifications.module.ts
│   │   ├── notifications.controller.ts
│   │   ├── notifications.service.ts
│   │   ├── email.service.ts
│   │   ├── scheduler.service.ts
│   │   ├── entities/
│   │   │   └── notification.entity.ts
│   │   └── templates/
│   │       ├── reminder.template.ts
│   │       ├── alert.template.ts
│   │       └── approval.template.ts
│   │
│   ├── audit/
│   │   ├── audit.module.ts
│   │   ├── audit.controller.ts
│   │   ├── audit.service.ts
│   │   ├── entities/
│   │   │   ├── audit-log.entity.ts
│   │   │   └── api-audit-log.entity.ts
│   │   ├── interceptors/
│   │   │   ├── audit.interceptor.ts
│   │   │   └── logging.interceptor.ts
│   │   └── repositories/
│   │       └── audit.repository.ts
│   │
│   ├── common/
│   │   ├── exceptions/
│   │   │   ├── business.exception.ts
│   │   │   ├── validation.exception.ts
│   │   │   └── not-found.exception.ts
│   │   ├── filters/
│   │   │   ├── http-exception.filter.ts
│   │   │   └── all-exceptions.filter.ts
│   │   ├── pipes/
│   │   │   ├── validation.pipe.ts
│   │   │   └── parse-id.pipe.ts
│   │   ├── interceptors/
│   │   │   ├── transform.interceptor.ts
│   │   │   ├── timeout.interceptor.ts
│   │   │   └── error.interceptor.ts
│   │   ├── decorators/
│   │   │   ├── api-response.decorator.ts
│   │   │   └── rate-limit.decorator.ts
│   │   ├── entities/
│   │   │   └── base.entity.ts
│   │   └── utils/
│   │       ├── response.ts
│   │       ├── crypto.ts
│   │       └── validators.ts
│   │
│   ├── config/
│   │   ├── configuration.ts
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   ├── storage.config.ts
│   │   ├── email.config.ts
│   │   └── cache.config.ts
│   │
│   ├── database/
│   │   ├── migrations/
│   │   │   ├── 001_init.ts
│   │   │   └── ...
│   │   ├── seeds/
│   │   │   ├── role.seed.ts
│   │   │   ├── entity.seed.ts
│   │   │   └── permission.seed.ts
│   │   └── data-source.ts
│   │
│   ├── queues/
│   │   ├── notification.queue.ts
│   │   ├── document-processing.queue.ts
│   │   ├── audit-logging.queue.ts
│   │   └── email.queue.ts
│   │
│   └── shared/
│       ├── services/
│       │   ├── cache.service.ts
│       │   ├── encryption.service.ts
│       │   └── file-validator.service.ts
│       └── interfaces/
│           ├── i-user-service.ts
│           ├── i-document-service.ts
│           └── i-storage-service.ts
│
├── test/
│   ├── auth.spec.ts
│   ├── documents.spec.ts
│   ├── distributions.spec.ts
│   └── ...
│
├── .env
├── .env.example
├── .env.test
├── docker-compose.yml
├── Dockerfile
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
├── package.json
└── README.md
```

---

## 3. Database Migrations Structure

```
database/migrations/
├── 001_initial_schema.sql
├── 002_add_audit_tables.sql
├── 003_add_permissions.sql
├── 004_add_notification_tables.sql
├── 005_create_indexes.sql
├── 006_add_encryption_functions.sql
└── rollback/
    ├── 001_rollback.sql
    ├── 002_rollback.sql
    └── ...
```

---

## 4. Docker Structure

```
docker/
├── Dockerfile.frontend
├── Dockerfile.backend
├── Dockerfile.nginx
├── docker-compose.yml
├── docker-compose.prod.yml
├── docker-compose.dev.yml
├── nginx/
│   ├── nginx.conf
│   ├── ssl/
│   │   ├── cert.pem
│   │   └── key.pem
│   └── conf.d/
│       ├── frontend.conf
│       ├── backend.conf
│       └── cache.conf
└── postgres/
    ├── init.sql
    └── postgresql.conf
```

---

## 5. Kubernetes Manifests Structure

```
k8s/
├── dev/
├── staging/
├── prod/
│   ├── namespace.yaml
│   ├── configmaps/
│   │   ├── app-config.yaml
│   │   └── nginx-config.yaml
│   ├── secrets/
│   │   ├── db-credentials.yaml
│   │   ├── jwt-secrets.yaml
│   │   └── s3-credentials.yaml
│   ├── deployments/
│   │   ├── frontend.yaml
│   │   ├── backend.yaml
│   │   ├── worker.yaml
│   │   ├── postgres.yaml
│   │   └── redis.yaml
│   ├── services/
│   │   ├── frontend-service.yaml
│   │   ├── backend-service.yaml
│   │   └── postgres-service.yaml
│   ├── ingress/
│   │   └── ingress.yaml
│   ├── hpa/
│   │   ├── backend-hpa.yaml
│   │   └── worker-hpa.yaml
│   └── pvc/
│       ├── postgres-pvc.yaml
│       └── redis-pvc.yaml
```

---

## 6. Documentation Structure

```
docs/
├── README.md
├── ARCHITECTURE.md
├── DATABASE_DESIGN.md
├── API_SPECIFICATION.md
├── INSTALLATION.md
├── DEPLOYMENT.md
├── USER_GUIDE.md
├── ADMIN_GUIDE.md
├── DEVELOPER_GUIDE.md
├── SECURITY_GUIDE.md
├── TROUBLESHOOTING.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── PERFORMANCE_TUNING.md
├── DISASTER_RECOVERY.md
├── API_EXAMPLES.md
├── QUERY_EXAMPLES.md
├── MONITORING.md
├── SCALING.md
└── DIAGRAMS/
    ├── architecture.md
    ├── workflows.md
    ├── erd.md
    └── deployment.md
```

---

## 7. Scripts Structure

```
scripts/
├── setup.sh                    # Initial setup
├── start.sh                    # Start application
├── stop.sh                     # Stop application
├── seed-data.sh               # Seed initial data
├── migrate.sh                 # Run migrations
├── backup.sh                  # Database backup
├── restore.sh                 # Database restore
├── health-check.sh            # Health monitoring
├── security-scan.sh           # Security scanning
├── generate-reports.sh        # Generate reports
└── cleanup.sh                 # Cleanup old files
```

---

## 8. Configuration Structure

```
config/
├── .env.development
├── .env.staging
├── .env.production
├── application.yml
├── database.yml
├── jwt.yml
├── storage.yml
├── email.yml
├── logging.yml
└── features.yml               # Feature flags
```

---

## 9. Root Directory Structure

```
digital-pdf-signoff/
├── frontend/                  # Next.js application
├── backend/                   # NestJS application
├── database/                  # Migrations & seeds
├── docker/                    # Docker configs
├── k8s/                      # Kubernetes manifests
├── docs/                     # Documentation
├── scripts/                  # Automation scripts
├── config/                   # Configuration files
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── cd.yml
│   │   └── security-scan.yml
│   └── ISSUE_TEMPLATE/
├── .gitignore
├── .gitattributes
├── LICENSE
├── README.md
├── CONTRIBUTING.md
├── CHANGELOG.md
├── docker-compose.yml
├── docker-compose.prod.yml
└── Makefile
```

---

## 10. Key File Descriptions

### Frontend Key Files

| File | Purpose |
|------|---------|
| `src/lib/api/client.ts` | Axios HTTP client setup |
| `src/store/slices/authSlice.ts` | Redux auth state |
| `src/middleware/auth.ts` | Auth middleware |
| `src/components/documents/DocumentViewer.tsx` | PDF viewer + watermark |
| `src/components/monitoring/ProgressSummary.tsx` | Dashboard widget |

### Backend Key Files

| File | Purpose |
|------|---------|
| `src/auth/guards/jwt.guard.ts` | JWT authentication |
| `src/documents/services/pdf-processor.service.ts` | PDF handling |
| `src/notifications/email.service.ts` | Email sending |
| `src/audit/interceptors/audit.interceptor.ts` | Audit logging |
| `src/users/repositories/user.repository.ts` | User queries |

---

## 11. Build & Deployment

### Build Output Structure

```
dist/
├── frontend/
│   ├── .next/
│   ├── public/
│   └── ...
├── backend/
│   ├── dist/
│   ├── node_modules/
│   └── ...
└── docker/
    ├── images/
    └── tags/
```

---

## 12. Testing Structure

```
tests/
├── unit/
│   ├── auth.spec.ts
│   ├── documents.spec.ts
│   └── ...
├── integration/
│   ├── auth-flow.spec.ts
│   ├── document-signoff.spec.ts
│   └── ...
├── e2e/
│   ├── user-dashboard.e2e.ts
│   ├── document-upload.e2e.ts
│   └── ...
└── fixtures/
    ├── users.json
    ├── documents.json
    └── ...
```

This structure follows enterprise best practices with clear separation of concerns, scalability, and maintainability in mind.
