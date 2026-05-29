#!/bin/bash
# Digital PDF Signoff - Local Setup Script
# Run: bash setup.sh

set -e

echo "🚀 Digital PDF Signoff - Local Development Setup"
echo "=================================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install Docker first.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose not found. Please install Docker Compose.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker & Docker Compose found${NC}"

# Create directories
echo -e "\n${YELLOW}Creating directories...${NC}"
mkdir -p backend frontend database/migrations database/seeds
echo -e "${GREEN}✓ Directories created${NC}"

# Create environment files
echo -e "\n${YELLOW}Creating environment files...${NC}"

# Backend .env
cat > backend/.env << 'EOF'
# Backend Environment Variables
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://signoff_user:signoff_pass_123@postgres:5432/signoff_db
DB_HOST=postgres
DB_PORT=5432
DB_USER=signoff_user
DB_PASSWORD=signoff_pass_123
DB_NAME=signoff_db

# JWT
JWT_SECRET=your_jwt_secret_key_change_me_in_production_min_32_chars
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_change_me_in_production_min_32_chars
JWT_EXPIRY=15m

# Redis
REDIS_URL=redis://:signoff_redis_pass@redis:6379/0
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=signoff_redis_pass

# RabbitMQ
RABBITMQ_URL=amqp://signoff:signoff_rabbit_pass@rabbitmq:5672
RABBITMQ_HOST=rabbitmq
RABBITMQ_USER=signoff
RABBITMQ_PASSWORD=signoff_rabbit_pass

# S3/MinIO
S3_ENDPOINT=http://minio:9000
S3_REGION=us-east-1
S3_BUCKET=signoff-documents
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_USE_PATH_STYLE=true

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@signoff.local

# Application
APP_NAME=Digital PDF Signoff
APP_URL=http://localhost:3000
API_URL=http://localhost:3001/api/v1

# Logging
LOG_LEVEL=debug
EOF

# Frontend .env.local
cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_APP_NAME=Digital PDF Signoff
EOF

echo -e "${GREEN}✓ Environment files created${NC}"

# Check Docker daemon
echo -e "\n${YELLOW}Checking Docker daemon...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker daemon not running. Please start Docker.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker daemon is running${NC}"

echo -e "\n${GREEN}✓ Setup completed!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Update backend/.env with your actual values (SMTP credentials, JWT secrets)"
echo "2. Run: docker-compose up -d"
echo "3. Wait 30 seconds for services to start"
echo "4. Run: docker-compose exec backend npm run migrate"
echo "5. Run: docker-compose exec backend npm run seed"
echo "6. Access: http://localhost:3000"
echo ""
echo -e "${YELLOW}Services will be available at:${NC}"
echo "• Frontend:  http://localhost:3000"
echo "• Backend:   http://localhost:3001"
echo "• API Docs:  http://localhost:3001/api-docs"
echo "• RabbitMQ:  http://localhost:15672 (guest:guest)"
echo "• MinIO:     http://localhost:9001 (minioadmin:minioadmin)"
echo "• Database:  localhost:5432"
echo ""
echo -e "${YELLOW}To stop all services:${NC}"
echo "docker-compose down"
echo ""
echo -e "${YELLOW}To view logs:${NC}"
echo "docker-compose logs -f [service-name]"
