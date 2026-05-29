# Digital PDF Signoff System - Implementation Guide

## 1. Database Query Examples

### 1.1 Get User's Assigned Documents with Status

```sql
-- Get all documents assigned to a user with their status
SELECT
    ud.id as user_document_id,
    d.id as document_id,
    d.name as document_name,
    d.category,
    d.version,
    ud.status,
    dd.deadline,
    CASE
        WHEN ud.status = 'SUBMITTED' THEN dd.deadline
        WHEN CURRENT_DATE > dd.deadline THEN 'OVERDUE'
        ELSE 'PENDING'
    END as compliance_status,
    ud.downloaded_at,
    ud.submitted_at,
    ud.approved_at,
    (dd.deadline - CURRENT_DATE) as days_remaining
FROM user_documents ud
JOIN documents d ON ud.document_id = d.id
JOIN document_distributions dd ON ud.distribution_id = dd.id
WHERE ud.user_id = $1
    AND d.is_active = true
    AND dd.is_active = true
ORDER BY dd.deadline ASC, d.created_at DESC;
```

### 1.2 Get Document Distribution Progress

```sql
-- Get comprehensive progress of a document distribution
SELECT
    d.name as document_name,
    d.version,
    dd.deadline,
    COUNT(DISTINCT ud.id) as total_assigned,
    SUM(CASE WHEN ud.status = 'NOT_DOWNLOADED' THEN 1 ELSE 0 END) as not_downloaded,
    SUM(CASE WHEN ud.status = 'DOWNLOADED' THEN 1 ELSE 0 END) as downloaded,
    SUM(CASE WHEN ud.status = 'SUBMITTED' THEN 1 ELSE 0 END) as submitted,
    SUM(CASE WHEN ud.status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
    SUM(CASE WHEN ud.status = 'REJECTED' THEN 1 ELSE 0 END) as rejected,
    SUM(CASE WHEN ud.is_overdue = true THEN 1 ELSE 0 END) as overdue,
    ROUND(
        (SUM(CASE WHEN ud.status IN ('SUBMITTED', 'APPROVED') THEN 1 ELSE 0 END)::NUMERIC 
         / COUNT(DISTINCT ud.id)) * 100, 2
    ) as completion_rate_percent
FROM user_documents ud
JOIN documents d ON ud.document_id = d.id
JOIN document_distributions dd ON ud.distribution_id = dd.id
WHERE dd.id = $1
GROUP BY d.id, d.name, d.version, dd.deadline;
```

### 1.3 Get Department/Entity Compliance Report

```sql
-- Get detailed compliance report for a department
SELECT
    dept.id as department_id,
    dept.name as department_name,
    ent.name as entity_name,
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT CASE WHEN ud.status != 'NOT_DOWNLOADED' THEN u.id END) as users_engaged,
    COUNT(DISTINCT CASE WHEN ud.status = 'SUBMITTED' THEN u.id END) as users_submitted,
    COUNT(DISTINCT CASE WHEN ud.status = 'APPROVED' THEN u.id END) as users_approved,
    COUNT(DISTINCT CASE WHEN ud.is_overdue = true THEN u.id END) as users_overdue,
    ROUND(
        (COUNT(DISTINCT CASE WHEN ud.status IN ('SUBMITTED', 'APPROVED') THEN u.id END)::NUMERIC 
         / NULLIF(COUNT(DISTINCT u.id), 0)) * 100, 2
    ) as compliance_rate,
    AVG(EXTRACT(DAY FROM (ud.submitted_at - ud.downloaded_at)))::NUMERIC as avg_days_to_submit
FROM users u
LEFT JOIN departments dept ON u.department_id = dept.id
LEFT JOIN entities ent ON u.entity_id = ent.id
LEFT JOIN user_documents ud ON u.id = ud.user_id AND ud.document_id = $1
WHERE dept.id = $2
GROUP BY dept.id, dept.name, ent.id, ent.name;
```

### 1.4 Get Overdue Users with Details

```sql
-- Find all overdue users and their overdue documents
SELECT
    u.id as user_id,
    u.email,
    u.full_name,
    dept.name as department,
    ent.name as entity,
    d.name as document_name,
    ud.id as user_document_id,
    ud.status,
    dd.deadline,
    CURRENT_DATE - dd.deadline as days_overdue,
    ud.downloaded_at,
    ud.submitted_at,
    al.action_timestamp as last_activity
FROM user_documents ud
JOIN users u ON ud.user_id = u.id
JOIN documents d ON ud.document_id = d.id
JOIN document_distributions dd ON ud.distribution_id = dd.id
LEFT JOIN departments dept ON u.department_id = dept.id
LEFT JOIN entities ent ON u.entity_id = ent.id
LEFT JOIN LATERAL (
    SELECT action_timestamp
    FROM audit_logs
    WHERE user_id = u.id AND user_document_id = ud.id
    ORDER BY action_timestamp DESC
    LIMIT 1
) al ON true
WHERE ud.is_overdue = true
    AND ud.status NOT IN ('SUBMITTED', 'APPROVED')
    AND d.is_active = true
ORDER BY days_overdue DESC, dd.deadline ASC;
```

### 1.5 Get Documents with User Analytics

```sql
-- Get analytics for each document
SELECT
    d.id,
    d.name,
    d.category,
    d.version,
    COUNT(DISTINCT ud.id) as total_distribution,
    COUNT(DISTINCT ud.user_id) as unique_users,
    AVG(EXTRACT(DAY FROM (ud.submitted_at - ud.created_at)))::NUMERIC as avg_time_to_submit,
    MIN(EXTRACT(DAY FROM (ud.submitted_at - ud.created_at)))::NUMERIC as min_time_to_submit,
    MAX(EXTRACT(DAY FROM (ud.submitted_at - ud.created_at)))::NUMERIC as max_time_to_submit,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(DAY FROM (ud.submitted_at - ud.created_at)))::NUMERIC as median_time,
    COUNT(DISTINCT CASE WHEN al.action = 'DOWNLOAD' THEN ud.id END) as total_downloads,
    COUNT(DISTINCT CASE WHEN al.action = 'UPLOAD' THEN ud.id END) as total_uploads
FROM documents d
LEFT JOIN user_documents ud ON d.id = ud.document_id AND ud.submitted_at IS NOT NULL
LEFT JOIN audit_logs al ON ud.id = al.user_document_id AND al.action IN ('DOWNLOAD', 'UPLOAD')
WHERE d.is_active = true
GROUP BY d.id, d.name, d.category, d.version
ORDER BY d.created_at DESC;
```

### 1.6 Audit Trail Query

```sql
-- Get comprehensive audit trail for compliance
SELECT
    al.id,
    al.user_id,
    u.email as user_email,
    u.full_name as user_name,
    al.action,
    al.resource_type,
    d.name as document_name,
    ud.status as document_status,
    al.ip_address,
    al.user_agent,
    al.action_timestamp,
    al.notes
FROM audit_logs al
JOIN users u ON al.user_id = u.id
LEFT JOIN user_documents ud ON al.user_document_id = ud.id
LEFT JOIN documents d ON ud.document_id = d.id
WHERE al.action_timestamp >= $1
    AND al.action_timestamp <= $2
    AND (al.action = $3 OR $3 IS NULL)
    AND (al.user_id = $4 OR $4 IS NULL)
ORDER BY al.action_timestamp DESC
LIMIT $5 OFFSET $6;
```

### 1.7 Notification Queue Status

```sql
-- Check notification delivery status
SELECT
    type,
    status,
    channel,
    COUNT(*) as count,
    AVG(EXTRACT(EPOCH FROM (sent_at - created_at)))::NUMERIC as avg_delivery_time_seconds
FROM notifications
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY type, status, channel
ORDER BY created_at DESC;
```

### 1.8 Performance Index Check

```sql
-- Verify that key indexes are being used
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

---

## 2. API Monitoring Examples

### 2.1 Get Document Progress API Implementation

```typescript
// backend/src/monitoring/monitoring.controller.ts

@Controller('monitoring')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiTags('Monitoring')
export class MonitoringController {
  constructor(private monitoringService: MonitoringService) {}

  @Get('documents/:documentId/progress')
  @Roles('ADMIN', 'PIC', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get document distribution progress' })
  @ApiResponse({
    status: 200,
    description: 'Document progress details',
    type: DocumentProgressDto,
  })
  async getDocumentProgress(
    @Param('documentId', ParseIntPipe) documentId: number,
    @Query('entityId') entityId?: number,
    @Query('departmentId') departmentId?: number,
  ): Promise<DocumentProgressDto> {
    const progress = await this.monitoringService.getDocumentProgress(
      documentId,
      entityId,
      departmentId,
    );
    return progress;
  }
}
```

```typescript
// backend/src/monitoring/monitoring.service.ts

@Injectable()
export class MonitoringService {
  constructor(
    @InjectRepository(UserDocumentRepository)
    private userDocRepository: UserDocumentRepository,
    @InjectRepository(DocumentRepository)
    private documentRepository: DocumentRepository,
  ) {}

  async getDocumentProgress(
    documentId: number,
    entityId?: number,
    departmentId?: number,
  ): Promise<DocumentProgressDto> {
    // Get document with distributions
    const document = await this.documentRepository.findOneWithDistributions(
      documentId,
    );

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Build base query
    let query = this.userDocRepository
      .createQueryBuilder('ud')
      .select([
        'ud.id',
        'ud.status',
        'ud.is_overdue',
        'ud.submitted_at',
        'ud.downloaded_at',
        'u.id',
        'u.email',
        'u.full_name',
        'd.name',
        'dept.name',
        'ent.name',
      ])
      .innerJoin('ud.user', 'u')
      .innerJoin('ud.document', 'd')
      .leftJoin('u.department', 'dept')
      .leftJoin('u.entity', 'ent')
      .where('ud.document_id = :documentId', { documentId });

    // Apply filters
    if (entityId) {
      query = query.andWhere('u.entity_id = :entityId', { entityId });
    }
    if (departmentId) {
      query = query.andWhere('u.department_id = :departmentId', {
        departmentId,
      });
    }

    const userDocuments = await query.getMany();

    // Calculate aggregations
    const summary = {
      total: userDocuments.length,
      notDownloaded: userDocuments.filter(
        (ud) => ud.status === 'NOT_DOWNLOADED',
      ).length,
      downloaded: userDocuments.filter(
        (ud) => ud.status === 'DOWNLOADED',
      ).length,
      submitted: userDocuments.filter(
        (ud) => ud.status === 'SUBMITTED',
      ).length,
      approved: userDocuments.filter(
        (ud) => ud.status === 'APPROVED',
      ).length,
      rejected: userDocuments.filter(
        (ud) => ud.status === 'REJECTED',
      ).length,
      overdue: userDocuments.filter((ud) => ud.is_overdue).length,
      completionRate:
        userDocuments.length > 0
          ? Math.round(
              (userDocuments.filter((ud) =>
                ['SUBMITTED', 'APPROVED'].includes(ud.status),
              ).length /
                userDocuments.length) *
                100,
            )
          : 0,
    };

    // Calculate by entity/department
    const byEntity = this.groupByEntity(userDocuments);

    // Get overdue users
    const overdueUsers = userDocuments
      .filter((ud) => ud.is_overdue && ud.status !== 'APPROVED')
      .map((ud) => ({
        userId: ud.user.id,
        userName: ud.user.full_name,
        email: ud.user.email,
        department: ud.department?.name,
        entity: ud.entity?.name,
        status: ud.status,
        daysOverdue: Math.floor(
          (new Date().getTime() - ud.submitted_at.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      }));

    return {
      document: {
        id: document.id,
        name: document.name,
        deadline: document.deadline_date,
      },
      summary,
      byEntity,
      overdueUsers,
    };
  }

  private groupByEntity(userDocuments: any[]): any[] {
    const entityMap = new Map();

    userDocuments.forEach((ud) => {
      const entityKey = ud.entity?.id || 'unassigned';
      if (!entityMap.has(entityKey)) {
        entityMap.set(entityKey, {
          entityId: ud.entity?.id,
          entityName: ud.entity?.name,
          total: 0,
          submitted: 0,
          rate: 0,
          departments: new Map(),
        });
      }

      const entity = entityMap.get(entityKey);
      entity.total++;
      if (['SUBMITTED', 'APPROVED'].includes(ud.status)) {
        entity.submitted++;
      }

      // Group by department
      const deptKey = ud.department?.id || 'unassigned';
      if (!entity.departments.has(deptKey)) {
        entity.departments.set(deptKey, {
          departmentId: ud.department?.id,
          departmentName: ud.department?.name,
          total: 0,
          submitted: 0,
          rate: 0,
        });
      }

      const dept = entity.departments.get(deptKey);
      dept.total++;
      if (['SUBMITTED', 'APPROVED'].includes(ud.status)) {
        dept.submitted++;
      }
      dept.rate = Math.round((dept.submitted / dept.total) * 100);
    });

    // Convert to array and calculate rates
    const result = Array.from(entityMap.values()).map((entity) => ({
      ...entity,
      rate: Math.round((entity.submitted / entity.total) * 100),
      departments: Array.from(entity.departments.values()),
    }));

    return result;
  }
}
```

### 2.2 Frontend API Call with Error Handling

```typescript
// frontend/src/lib/api/monitoring.ts

import { apiClient } from './client';
import { DocumentProgressDto } from '@/lib/types/monitoring';

export const monitoringApi = {
  getDocumentProgress: async (
    documentId: number,
    filters?: {
      entityId?: number;
      departmentId?: number;
    },
  ): Promise<DocumentProgressDto> => {
    try {
      const params = new URLSearchParams();
      if (filters?.entityId) params.append('entityId', String(filters.entityId));
      if (filters?.departmentId)
        params.append('departmentId', String(filters.departmentId));

      const response = await apiClient.get(
        `/monitoring/documents/${documentId}/progress${
          params.toString() ? `?${params.toString()}` : ''
        }`,
      );

      return response.data.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Document not found');
      }
      if (error.response?.status === 403) {
        throw new Error('You do not have permission to view this document');
      }
      throw new Error('Failed to fetch document progress');
    }
  },

  exportProgress: async (
    documentId: number,
    format: 'excel' | 'pdf' | 'csv',
  ): Promise<Blob> => {
    try {
      const response = await apiClient.get(
        `/monitoring/documents/${documentId}/progress/export`,
        {
          params: { format },
          responseType: 'blob',
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to export progress as ${format.toUpperCase()}`);
    }
  },

  sendReminders: async (
    documentId: number,
    userIds: number[],
  ): Promise<{ sent: number; failed: number }> => {
    try {
      const response = await apiClient.post(
        `/monitoring/documents/${documentId}/reminders`,
        { userIds },
      );
      return response.data.data;
    } catch (error) {
      throw new Error('Failed to send reminders');
    }
  },
};
```

### 2.3 React Hook for Monitoring

```typescript
// frontend/src/hooks/useMonitoring.ts

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { monitoringApi } from '@/lib/api/monitoring';
import { DocumentProgressDto } from '@/lib/types/monitoring';

export const useDocumentProgress = (documentId: number) => {
  const [filters, setFilters] = useState({
    entityId: undefined,
    departmentId: undefined,
  });

  const {
    data: progress,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['documentProgress', documentId, filters],
    queryFn: () => monitoringApi.getDocumentProgress(documentId, filters),
    staleTime: 30000, // 30 seconds
    retry: 1,
  });

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  return {
    progress,
    isLoading,
    error,
    refetch,
    filters,
    setFilters: handleFilterChange,
  };
};

export const useExportProgress = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportProgress = useCallback(
    async (documentId: number, format: 'excel' | 'pdf' | 'csv') => {
      try {
        setIsExporting(true);
        setError(null);

        const blob = await monitoringApi.exportProgress(documentId, format);

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `document_progress_${documentId}.${format === 'excel' ? 'xlsx' : format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsExporting(false);
      }
    },
    [],
  );

  return { exportProgress, isExporting, error };
};
```

---

## 3. Best Practices & Enterprise Patterns

### 3.1 Error Handling Strategy

```typescript
// backend/src/common/filters/all-exceptions.filter.ts

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const timestamp = new Date().toISOString();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = (exceptionResponse as any).message || exception.message;
      errorCode = (exceptionResponse as any).error || 'HTTP_ERROR';
    } else if (exception instanceof ValidationError[]) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Validation failed';
      errorCode = 'VALIDATION_ERROR';
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(exception.stack);
    }

    // Log error
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${errorCode}`,
      exception,
    );

    response.status(status).json({
      success: false,
      error: {
        code: errorCode,
        message,
        timestamp,
        path: request.url,
      },
    });
  }
}
```

### 3.2 Caching Strategy

```typescript
// backend/src/shared/services/cache.service.ts

@Injectable()
export class CacheService {
  constructor(private cacheManager: CacheManagerService) {}

  async get<T>(key: string): Promise<T | null> {
    return this.cacheManager.get<T>(key);
  }

  async set<T>(
    key: string,
    value: T,
    ttl: number = 3600, // 1 hour
  ): Promise<void> {
    await this.cacheManager.set(key, value, { ttl });
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.cacheManager.store.getKeys();
    const regex = new RegExp(pattern);
    for (const key of keys) {
      if (regex.test(key)) {
        await this.cacheManager.del(key);
      }
    }
  }

  // Utility for monitoring dashboards
  async getDocumentProgressCached(
    documentId: number,
    ttl: number = 300, // 5 minutes
  ): Promise<DocumentProgressDto> {
    const cacheKey = `doc_progress_${documentId}`;
    let progress = await this.get<DocumentProgressDto>(cacheKey);

    if (!progress) {
      progress = await this.fetchDocumentProgress(documentId);
      await this.set(cacheKey, progress, ttl);
    }

    return progress;
  }

  private async fetchDocumentProgress(
    documentId: number,
  ): Promise<DocumentProgressDto> {
    // Actual database query
  }
}
```

### 3.3 Rate Limiting Decorator

```typescript
// backend/src/common/decorators/rate-limit.decorator.ts

export const RateLimit = (limit: number, windowMs: number = 60000) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const request = args[1]; // Assuming standard NestJS request is passed

      if (!request) {
        return originalMethod.apply(this, args);
      }

      const key = `rate_limit_${request.user?.id}_${propertyKey}`;
      const current = await this.cacheManager.get<number>(key);

      if (current && current >= limit) {
        throw new TooManyRequestsException(
          `Rate limit exceeded. Max ${limit} requests per ${Math.round(windowMs / 1000)} seconds`,
        );
      }

      await this.cacheManager.set(
        key,
        (current || 0) + 1,
        Math.round(windowMs / 1000),
      );

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
};
```

### 3.4 Database Transaction Pattern

```typescript
// backend/src/user-documents/user-documents.service.ts

@Injectable()
export class UserDocumentsService {
  constructor(
    @InjectRepository(UserDocumentRepository)
    private userDocRepository: UserDocumentRepository,
    @InjectRepository(AuditLogRepository)
    private auditRepository: AuditLogRepository,
    private dataSource: DataSource,
  ) {}

  async submitDocument(
    userDocId: number,
    filePath: string,
    userId: number,
    ipAddress: string,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update user document
      await queryRunner.manager.update(
        UserDocument,
        { id: userDocId },
        {
          status: 'SUBMITTED',
          submitted_at: new Date(),
          submitted_file_path: filePath,
        },
      );

      // Create audit log
      await queryRunner.manager.insert(AuditLog, {
        user_id: userId,
        user_document_id: userDocId,
        action: 'UPLOAD',
        ip_address: ipAddress,
        action_timestamp: new Date(),
      });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
```

### 3.5 Pagination Pattern

```typescript
// backend/src/common/pipes/pagination.pipe.ts

@Injectable()
export class PaginationPipe
  implements PipeTransform<any, PaginationDto>
{
  transform(value: any): PaginationDto {
    const page = parseInt(value.page, 10) || 1;
    const limit = Math.min(parseInt(value.limit, 10) || 20, 100); // Max 100

    if (page < 1) {
      throw new BadRequestException('Page must be >= 1');
    }

    if (limit < 1) {
      throw new BadRequestException('Limit must be >= 1');
    }

    return {
      page,
      limit,
      offset: (page - 1) * limit,
    };
  }
}

// Usage in controller
@Get('documents')
async getDocuments(
  @Query(PaginationPipe) pagination: PaginationDto,
) {
  const [data, total] = await this.documentRepository.findAndCount({
    skip: pagination.offset,
    take: pagination.limit,
  });

  return {
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}
```

### 3.6 Logging Strategy

```typescript
// backend/src/common/services/logger.service.ts

@Injectable()
export class LoggerService {
  private logger = new Logger();

  log(context: string, message: string, data?: any) {
    this.logger.log(
      `[${context}] ${message}`,
      JSON.stringify(data),
    );
  }

  error(context: string, message: string, trace?: string) {
    this.logger.error(
      `[${context}] ${message}`,
      trace,
    );
  }

  warn(context: string, message: string) {
    this.logger.warn(
      `[${context}] ${message}`,
    );
  }

  debug(context: string, message: string, data?: any) {
    this.logger.debug(
      `[${context}] ${message}`,
      JSON.stringify(data),
    );
  }
}
```

---

## 4. Security Best Practices

### 4.1 Password Hashing

```typescript
// backend/src/auth/services/password.service.ts

@Injectable()
export class PasswordService {
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12; // OWASP recommendation
    return bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
```

### 4.2 JWT Configuration

```typescript
// backend/src/config/jwt.config.ts

export const jwtConfig = {
  access: {
    secret: process.env.JWT_SECRET,
    expiresIn: '15m', // Short-lived
    algorithm: 'HS512',
  },
  refresh: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '7d',
    algorithm: 'HS512',
  },
  options: {
    issuer: process.env.JWT_ISSUER || 'signoff-system',
    audience: process.env.JWT_AUDIENCE || 'signoff-api',
  },
};
```

### 4.3 Input Validation & Sanitization

```typescript
// backend/src/documents/dtos/create-document.dto.ts

export class CreateDocumentDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  @Sanitize()
  name: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  @Sanitize()
  description: string;

  @IsString()
  @Pattern(/^\d+\.\d+$/) // Semver format
  version: string;

  @IsISO8601()
  effectiveDate: Date;

  @IsISO8601()
  @IsOptional()
  deadlineDate: Date;

  @IsBoolean()
  @IsOptional()
  requiresSignature: boolean = true;
}

@Injectable()
export class SanitizationDecorator {
  @ValidatorConstraint({ name: 'sanitize', async: false })
  validate(value: string) {
    // Remove potentially dangerous characters
    return typeof value === 'string' && /^[\w\s.,()\/\-]*$/.test(value);
  }
}
```

---

## 5. Performance Optimization

### 5.1 Query Optimization

```typescript
// Use select to fetch only needed columns
const users = await userRepository
  .createQueryBuilder('u')
  .select(['u.id', 'u.email', 'u.full_name'])
  .where('u.is_active = :active', { active: true })
  .take(10)
  .getMany();

// Use eager loading to prevent N+1 queries
const documents = await documentRepository.find({
  relations: ['createdBy', 'distributions', 'versions'],
  where: { is_active: true },
});

// Use database-level aggregation
const stats = await userDocumentRepository
  .createQueryBuilder('ud')
  .select('ud.status', 'status')
  .addSelect('COUNT(*)', 'count')
  .groupBy('ud.status')
  .getRawMany();
```

### 5.2 Bulk Operations

```typescript
// Efficient bulk insert
await userDocumentRepository.insert(
  userDocuments.map(ud => ({
    user_id: ud.userId,
    document_id: ud.documentId,
    distribution_id: ud.distributionId,
    status: 'NOT_DOWNLOADED',
    created_at: new Date(),
  }))
);

// Efficient bulk update
await userDocumentRepository.update(
  { distribution_id: distributionId, status: 'NOT_DOWNLOADED' },
  { is_overdue: true, updated_at: new Date() },
);
```

---

## 6. Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations executed
- [ ] SSL certificates installed
- [ ] S3/MinIO bucket created and configured
- [ ] Email service credentials set
- [ ] Backup strategy implemented
- [ ] Monitoring and alerts configured
- [ ] Security audit completed
- [ ] Load testing performed
- [ ] Documentation updated
- [ ] Team training completed
- [ ] Incident response plan prepared

---

## 7. Post-Deployment Monitoring

```
Key Metrics to Monitor:
• API response time (target: < 200ms)
• Error rate (target: < 0.5%)
• Database query time (target: < 100ms)
• File upload success rate (target: > 99%)
• Email delivery rate (target: > 95%)
• System availability (target: > 99.9%)
```
