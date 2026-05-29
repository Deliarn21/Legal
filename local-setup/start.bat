@echo off
REM Simple quick start script for Windows

echo.
echo 🚀 Digital PDF Signoff - Starting Local Environment
echo.

REM Check if docker-compose.yml exists
if not exist "docker-compose.yml" (
    echo ❌ docker-compose.yml not found!
    echo Please run from project root directory
    pause
    exit /b 1
)

REM Start services
echo Starting all services...
docker-compose up -d

REM Wait for services
echo.
echo ⏳ Waiting for services to be ready...
timeout /t 5 /nobreak

REM Show status
echo.
echo 🔍 Service status:
docker-compose ps

echo.
echo ✅ Services started!
echo.
echo 📱 Next steps:
echo 1. Run migrations:   docker-compose exec backend npm run migrate
echo 2. Seed data:        docker-compose exec backend npm run seed
echo 3. Open browser:     http://localhost:3000
echo.
echo 🌐 Access points:
echo    Frontend:    http://localhost:3000
echo    API:         http://localhost:3001
echo    API Docs:    http://localhost:3001/api-docs
echo    RabbitMQ:    http://localhost:15672
echo    MinIO:       http://localhost:9001
echo.
echo 📝 Test Accounts:
echo    Admin:  admin@company.com / Admin@123456
echo    User:   user@company.com / User@123456
echo.
echo ❌ To stop: docker-compose down
echo.
pause
