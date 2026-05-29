#!/bin/bash
# Simple quick start script for macOS/Linux

echo "🚀 Digital PDF Signoff - Starting Local Environment"
echo ""

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml not found!"
    echo "Please run from project root directory"
    exit 1
fi

# Start services
echo "Starting all services..."
docker-compose up -d

# Wait for services
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check health
echo ""
echo "🔍 Checking service health..."

services=("postgres" "redis" "rabbitmq" "minio" "nginx")
for service in "${services[@]}"; do
    if docker-compose ps $service | grep -q "healthy\|running"; then
        echo "✓ $service is running"
    else
        echo "✗ $service might not be ready yet"
    fi
done

echo ""
echo "✅ All services started!"
echo ""
echo "📱 Next steps:"
echo "1. Run migrations:   docker-compose exec backend npm run migrate"
echo "2. Seed data:        docker-compose exec backend npm run seed"
echo "3. Open browser:     http://localhost:3000"
echo ""
echo "🌐 Access points:"
echo "   Frontend:    http://localhost:3000"
echo "   API:         http://localhost:3001"
echo "   API Docs:    http://localhost:3001/api-docs"
echo "   RabbitMQ:    http://localhost:15672"
echo "   MinIO:       http://localhost:9001"
echo ""
echo "📝 Test Accounts:"
echo "   Admin:  admin@company.com / Admin@123456"
echo "   User:   user@company.com / User@123456"
echo ""
echo "❌ To stop: docker-compose down"
