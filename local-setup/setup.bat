# Digital PDF Signoff - Local Development Setup
# Windows Batch Version

@echo off
setlocal enabledelayedexpansion

echo.
echo 🚀 Digital PDF Signoff - Local Development Setup
echo ==================================================
echo.

REM Check Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker not found. Please install Docker Desktop first.
    echo Visit: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo ✓ Docker found

REM Check Docker Compose
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose not found. Please update Docker Desktop.
    pause
    exit /b 1
)

echo ✓ Docker Compose found

REM Create directories
echo.
echo Creating directories...
if not exist "backend" mkdir backend
if not exist "frontend" mkdir frontend
if not exist "database\migrations" mkdir database\migrations
if not exist "database\seeds" mkdir database\seeds
echo ✓ Directories created

REM Create backend .env
echo.
echo Creating environment files...
(
echo # Backend Environment Variables
echo NODE_ENV=development
echo PORT=3001
echo.
echo # Database
echo DATABASE_URL=postgresql://signoff_user:signoff_pass_123@postgres:5432/signoff_db
echo DB_HOST=postgres
echo DB_PORT=5432
echo DB_USER=signoff_user
echo DB_PASSWORD=signoff_pass_123
echo DB_NAME=signoff_db
echo.
echo # JWT
echo JWT_SECRET=your_jwt_secret_key_change_me_in_production_min_32_chars
echo JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_change_me_in_production_min_32_chars
echo JWT_EXPIRY=15m
echo.
echo # Redis
echo REDIS_URL=redis://:signoff_redis_pass@redis:6379/0
echo REDIS_HOST=redis
echo REDIS_PORT=6379
echo REDIS_PASSWORD=signoff_redis_pass
echo.
echo # RabbitMQ
echo RABBITMQ_URL=amqp://signoff:signoff_rabbit_pass@rabbitmq:5672
echo RABBITMQ_HOST=rabbitmq
echo RABBITMQ_USER=signoff
echo RABBITMQ_PASSWORD=signoff_rabbit_pass
echo.
echo # S3/MinIO
echo S3_ENDPOINT=http://minio:9000
echo S3_REGION=us-east-1
echo S3_BUCKET=signoff-documents
echo S3_ACCESS_KEY=minioadmin
echo S3_SECRET_KEY=minioadmin
echo S3_USE_PATH_STYLE=true
echo.
echo # Email
echo SMTP_HOST=smtp.gmail.com
echo SMTP_PORT=587
echo SMTP_USER=your-email@gmail.com
echo SMTP_PASSWORD=your-app-password
echo SMTP_FROM=noreply@signoff.local
echo.
echo # Application
echo APP_NAME=Digital PDF Signoff
echo APP_URL=http://localhost:3000
echo API_URL=http://localhost:3001/api/v1
echo.
echo # Logging
echo LOG_LEVEL=debug
) > backend\.env

echo ✓ backend/.env created

REM Create frontend .env
(
echo NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
echo NEXT_PUBLIC_ENVIRONMENT=development
echo NEXT_PUBLIC_APP_NAME=Digital PDF Signoff
) > frontend\.env.local

echo ✓ frontend/.env.local created

REM Check Docker daemon
echo.
echo Checking Docker daemon...
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker daemon not running. Please start Docker Desktop.
    pause
    exit /b 1
)
echo ✓ Docker daemon is running

echo.
echo ✓ Setup completed!
echo.
echo 📝 Next steps:
echo 1. Edit backend/.env with your actual SMTP credentials
echo 2. Run: docker-compose up -d
echo 3. Wait 30 seconds for services to start
echo 4. Run: docker-compose exec backend npm run migrate
echo 5. Run: docker-compose exec backend npm run seed
echo 6. Open: http://localhost:3000
echo.
echo 🌐 Services:
echo • Frontend:  http://localhost:3000
echo • Backend:   http://localhost:3001
echo • API Docs:  http://localhost:3001/api-docs
echo • RabbitMQ:  http://localhost:15672 (guest:guest^)
echo • MinIO:     http://localhost:9001 (minioadmin:minioadmin^)
echo.
echo ⏹️  To stop: docker-compose down
echo.
pause
