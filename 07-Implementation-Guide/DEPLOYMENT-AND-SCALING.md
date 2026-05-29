# Digital PDF Signoff System - Deployment & Scalability Guide

## 1. Docker Setup

### 1.1 docker-compose.yml (Development)

```yaml
version: '3.9'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: signoff-db
    environment:
      POSTGRES_USER: signoff_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: signoff_db
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --locale=C"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U signoff_user -d signoff_db"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - signoff-network

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: signoff-redis
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - signoff-network

  # RabbitMQ Message Queue
  rabbitmq:
    image: rabbitmq:3.12-management-alpine
    container_name: signoff-rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: signoff
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    ports:
      - "5672:5672"      # AMQP
      - "15672:15672"    # Management UI
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - signoff-network

  # MinIO S3 Storage
  minio:
    image: minio/minio:latest
    container_name: signoff-storage
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"     # API
      - "9001:9001"     # Console
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - signoff-network

  # Backend NestJS Application
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: signoff-backend
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://signoff_user:${DB_PASSWORD}@postgres:5432/signoff_db
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      RABBITMQ_URL: amqp://signoff:${RABBITMQ_PASSWORD}@rabbitmq:5672
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      S3_ENDPOINT: http://minio:9000
      S3_BUCKET: ${S3_BUCKET}
      S3_ACCESS_KEY: ${MINIO_ROOT_USER}
      S3_SECRET_KEY: ${MINIO_ROOT_PASSWORD}
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
      minio:
        condition: service_healthy
    volumes:
      - ./backend/src:/app/src
      - /app/node_modules
    command: npm run start:dev
    networks:
      - signoff-network
    restart: unless-stopped

  # Frontend Next.js Application
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: signoff-frontend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001/api/v1
      NEXT_PUBLIC_ENVIRONMENT: development
    ports:
      - "3000:3000"
    depends_on:
      - backend
    volumes:
      - ./frontend/src:/app/src
      - ./frontend/public:/app/public
      - /app/.next
      - /app/node_modules
    command: npm run dev
    networks:
      - signoff-network
    restart: unless-stopped

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: signoff-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/conf.d:/etc/nginx/conf.d:ro
      - ./docker/nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend
    networks:
      - signoff-network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:
  minio_data:

networks:
  signoff-network:
    driver: bridge
```

### 1.2 Backend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Build NestJS app
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy environment files
COPY .env.example .env

EXPOSE 3001

CMD ["node", "dist/main.js"]
```

### 1.3 Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "start"]
```

---

## 2. Kubernetes Deployment

### 2.1 Namespace & ConfigMap

```yaml
# k8s/prod/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: signoff-prod
---

# k8s/prod/configmaps/app-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: signoff-prod
data:
  NODE_ENV: production
  LOG_LEVEL: info
  API_PORT: "3001"
  FRONTEND_PORT: "3000"
```

### 2.2 Secret Management

```yaml
# k8s/prod/secrets/app-secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: signoff-prod
type: Opaque
stringData:
  JWT_SECRET: ${JWT_SECRET}
  JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
  DB_PASSWORD: ${DB_PASSWORD}
  REDIS_PASSWORD: ${REDIS_PASSWORD}
  RABBITMQ_PASSWORD: ${RABBITMQ_PASSWORD}
---

apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
  namespace: signoff-prod
type: Opaque
stringData:
  username: signoff_user
  password: ${DB_PASSWORD}
  connection-string: postgresql://signoff_user:${DB_PASSWORD}@postgres:5432/signoff_db
```

### 2.3 Backend Deployment

```yaml
# k8s/prod/deployments/backend.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: signoff-backend
  namespace: signoff-prod
  labels:
    app: signoff
    component: backend
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: signoff
      component: backend
  template:
    metadata:
      labels:
        app: signoff
        component: backend
    spec:
      serviceAccountName: signoff-backend
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
      - name: backend
        image: ${REGISTRY}/signoff-backend:${TAG}
        imagePullPolicy: IfNotPresent
        ports:
        - name: http
          containerPort: 3001
          protocol: TCP
        
        # Environment variables
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: NODE_ENV
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: connection-string
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: JWT_SECRET
        - name: REDIS_URL
          value: redis://:$(REDIS_PASSWORD)@redis-master:6379
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: REDIS_PASSWORD
        
        # Resource limits
        resources:
          requests:
            cpu: 500m
            memory: 512Mi
          limits:
            cpu: 2000m
            memory: 2Gi
        
        # Probes
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        
        # Volume mounts
        volumeMounts:
        - name: config
          mountPath: /app/config
          readOnly: true
      
      volumes:
      - name: config
        configMap:
          name: app-config

---

# Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: signoff-backend-hpa
  namespace: signoff-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: signoff-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80

---

# Service
apiVersion: v1
kind: Service
metadata:
  name: signoff-backend
  namespace: signoff-prod
  labels:
    app: signoff
    component: backend
spec:
  type: ClusterIP
  selector:
    app: signoff
    component: backend
  ports:
  - name: http
    port: 3001
    targetPort: http
    protocol: TCP
```

### 2.4 Database StatefulSet

```yaml
# k8s/prod/statefulsets/postgres.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: signoff-prod
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_USER
          value: signoff_user
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
        - name: POSTGRES_DB
          value: signoff_db
        - name: PGDATA
          value: /var/lib/postgresql/data/pgdata
        
        resources:
          requests:
            cpu: 1000m
            memory: 1Gi
          limits:
            cpu: 4000m
            memory: 4Gi
        
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        - name: backup
          mountPath: /backup
  
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 100Gi

---

apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: signoff-prod
spec:
  clusterIP: None
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
```

### 2.5 Ingress Configuration

```yaml
# k8s/prod/ingress/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: signoff-ingress
  namespace: signoff-prod
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "100m"
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - signoff.company.com
    - api.signoff.company.com
    secretName: signoff-tls-cert
  rules:
  - host: signoff.company.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: signoff-frontend
            port:
              number: 3000
  
  - host: api.signoff.company.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: signoff-backend
            port:
              number: 3001
```

---

## 3. CI/CD Pipeline

### 3.1 GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
      working-directory: ./backend
    
    - name: Run linter
      run: npm run lint
      working-directory: ./backend
    
    - name: Run tests
      run: npm run test
      working-directory: ./backend
      env:
        DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/test_db
    
    - name: Run e2e tests
      run: npm run test:e2e
      working-directory: ./backend
      env:
        DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/test_db
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        directory: ./backend/coverage

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'

    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Login to Docker Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ secrets.REGISTRY_URL }}
        username: ${{ secrets.REGISTRY_USERNAME }}
        password: ${{ secrets.REGISTRY_PASSWORD }}
    
    - name: Build and push backend
      uses: docker/build-push-action@v4
      with:
        context: ./backend
        push: true
        tags: |
          ${{ secrets.REGISTRY_URL }}/signoff-backend:latest
          ${{ secrets.REGISTRY_URL }}/signoff-backend:${{ github.sha }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
    
    - name: Build and push frontend
      uses: docker/build-push-action@v4
      with:
        context: ./frontend
        push: true
        tags: |
          ${{ secrets.REGISTRY_URL }}/signoff-frontend:latest
          ${{ secrets.REGISTRY_URL }}/signoff-frontend:${{ github.sha }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'

    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to staging
      run: |
        kubectl set image deployment/signoff-backend \
          -n signoff-staging \
          backend=${{ secrets.REGISTRY_URL }}/signoff-backend:${{ github.sha }}
        kubectl rollout status deployment/signoff-backend -n signoff-staging

  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://signoff.company.com

    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to production
      run: |
        kubectl set image deployment/signoff-backend \
          -n signoff-prod \
          backend=${{ secrets.REGISTRY_URL }}/signoff-backend:${{ github.sha }}
        kubectl rollout status deployment/signoff-backend -n signoff-prod
    
    - name: Verify deployment
      run: |
        kubectl get pods -n signoff-prod
        kubectl get services -n signoff-prod
```

---

## 4. Monitoring & Observability

### 4.1 Prometheus Configuration

```yaml
# monitoring/prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

rule_files:
  - '/etc/prometheus/rules/*.yml'

scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['signoff-backend:3001']
    metrics_path: '/metrics'

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: 'true'
```

### 4.2 Alert Rules

```yaml
# monitoring/prometheus/alerts.yml
groups:
  - name: signoff-system
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
        for: 5m
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, http_request_duration_seconds_bucket) > 2
        for: 5m
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }}s"

      - alert: DatabaseDown
        expr: pg_up{} == 0
        for: 1m
        annotations:
          summary: "PostgreSQL is down"

      - alert: PodCrashLooping
        expr: rate(kube_pod_container_status_restarts_total[15m]) > 0.1
        for: 5m
        annotations:
          summary: "Pod is crash looping"
          description: "Pod {{ $labels.pod }} is restarting frequently"
```

---

## 5. Backup & Disaster Recovery

### 5.1 Backup Script

```bash
#!/bin/bash
# scripts/backup.sh

set -e

BACKUP_DIR="/backups"
DB_HOST="${DB_HOST:-postgres}"
DB_USER="${DB_USER:-signoff_user}"
DB_NAME="${DB_NAME:-signoff_db}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/signoff_db_$TIMESTAMP.sql.gz"

echo "Starting database backup at $TIMESTAMP..."

# Create backup
pg_dump -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

# Upload to S3
aws s3 cp "$BACKUP_FILE" "s3://${BACKUP_BUCKET}/database/$TIMESTAMP/"

# Keep only last 30 days of backups
find "$BACKUP_DIR" -name "signoff_db_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
```

### 5.2 Restore Procedure

```bash
#!/bin/bash
# scripts/restore.sh

BACKUP_FILE="$1"
DB_HOST="${DB_HOST:-postgres}"
DB_USER="${DB_USER:-signoff_user}"
DB_NAME="${DB_NAME:-signoff_db}"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./restore.sh <backup_file>"
    exit 1
fi

echo "Restoring from $BACKUP_FILE..."

gunzip < "$BACKUP_FILE" | psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME"

echo "Restore completed"
```

---

## 6. Scaling Strategies

### 6.1 Horizontal Pod Autoscaling (HPA)

Already configured in backend deployment.

### 6.2 Vertical Pod Autoscaling (VPA)

```yaml
# k8s/prod/vpa/backend-vpa.yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: signoff-backend-vpa
  namespace: signoff-prod
spec:
  targetRef:
    apiVersion: "apps/v1"
    kind: Deployment
    name: signoff-backend
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: backend
      minAllowed:
        cpu: 100m
        memory: 128Mi
      maxAllowed:
        cpu: 4
        memory: 4Gi
```

---

## 7. Performance Tuning

### 7.1 PostgreSQL Tuning

```sql
-- For production systems with 64GB RAM
ALTER SYSTEM SET shared_buffers = '16GB';
ALTER SYSTEM SET effective_cache_size = '48GB';
ALTER SYSTEM SET maintenance_work_mem = '4GB';
ALTER SYSTEM SET work_mem = '41943kB';
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Reload configuration
SELECT pg_reload_conf();
```

### 7.2 Connection Pooling

```yaml
# Backend: Use PgBouncer for connection pooling
apiVersion: v1
kind: ConfigMap
metadata:
  name: pgbouncer-config
  namespace: signoff-prod
data:
  pgbouncer.ini: |
    [databases]
    signoff_db = host=postgres port=5432 dbname=signoff_db

    [pgbouncer]
    pool_mode = transaction
    max_client_conn = 1000
    default_pool_size = 25
    min_pool_size = 10
    reserve_pool_size = 5
    reserve_pool_timeout = 3
```

This comprehensive guide provides production-ready configurations for deployment and scaling of the Digital PDF Signoff System.
