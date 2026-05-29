# Digital PDF Signoff - Local Development Quick Start

## 🚀 Quick Start (5 Minutes)

### Step 1: Prerequisites
- Docker Desktop installed ([Download](https://www.docker.com/products/docker-desktop))
- 4GB+ RAM available
- Ports 3000, 3001, 5432, 6379, 5672, 9000, 9001 available

### Step 2: Run Setup Script

**Windows:**
```bash
cd local-setup
setup.bat
```

**macOS/Linux:**
```bash
cd local-setup
bash setup.sh
```

### Step 3: Start Services

```bash
# From project root directory
docker-compose up -d
```

Monitor startup (wait ~30 seconds):
```bash
docker-compose logs -f
```

### Step 4: Initialize Database

```bash
# Run migrations
docker-compose exec backend npm run migrate

# Seed initial data
docker-compose exec backend npm run seed
```

### Step 5: Access Application

Open browser and go to:

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | See below |
| **Backend API** | http://localhost:3001 | N/A |
| **API Docs** | http://localhost:3001/api-docs | N/A |
| **RabbitMQ** | http://localhost:15672 | guest / guest |
| **MinIO Console** | http://localhost:9001 | minioadmin / minioadmin |

---

## 👤 Default Test Accounts

After running seed script:

```
Super Admin:
  Email: admin@company.com
  Password: Admin@123456

Admin:
  Email: coordinator@company.com
  Password: Admin@123456

PIC (Department Head):
  Email: pic@company.com
  Password: Admin@123456

Regular User:
  Email: user@company.com
  Password: User@123456
```

---

## 📊 Services Running

```
✓ PostgreSQL 15       - Database
✓ Redis 7             - Cache
✓ RabbitMQ 3.12       - Message Queue
✓ MinIO               - File Storage (S3 compatible)
✓ Nginx               - Reverse Proxy
```

---

## 🛠️ Common Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Stop Services
```bash
docker-compose down
```

### Remove Everything (clean slate)
```bash
docker-compose down -v
```

### Restart Service
```bash
docker-compose restart backend
```

### Access Database Shell
```bash
docker-compose exec postgres psql -U signoff_user -d signoff_db
```

### Access Redis CLI
```bash
docker-compose exec redis redis-cli
```

---

## 🐛 Troubleshooting

### Ports Already in Use
```bash
# Find what's using port (macOS/Linux)
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Services Not Starting
```bash
# Check Docker daemon
docker info

# Restart Docker Desktop and try again
```

### Database Connection Error
```bash
# Reset database
docker-compose down -v
docker-compose up -d postgres
# Wait 10 seconds
docker-compose up -d
```

### Backend/Frontend Not Building
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Can't Access http://localhost:3000
```bash
# Check if containers are running
docker-compose ps

# Check logs
docker-compose logs frontend

# May need to restart
docker-compose restart frontend
```

---

## 📁 Project Structure

```
Digital-PDF-Signoff-System/
├── backend/               # NestJS application
│   ├── .env              # ⚠️ Edit this with your config
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── frontend/             # Next.js application
│   ├── .env.local        # ⚠️ Edit this with your config
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── local-setup/
│   ├── docker-compose.yml     # ← Use this for local dev
│   ├── nginx.conf
│   ├── setup.sh (macOS/Linux)
│   ├── setup.bat (Windows)
│   └── QUICKSTART.md (this file)
└── docs/                 # Complete documentation
```

---

## 🔧 Configuration Files

### backend/.env
Contains database credentials, JWT secrets, S3 config, email settings.

**IMPORTANT:** Update these for production:
- JWT_SECRET (min 32 characters)
- SMTP credentials (for email)
- S3/MinIO credentials

### frontend/.env.local
API endpoint configuration.

---

## 📝 Example: Upload Your First Document

### 1. Login as Admin
- Go to http://localhost:3000
- Email: admin@company.com
- Password: Admin@123456

### 2. Upload Document
- Click "Admin Dashboard"
- Click "Upload Document"
- Fill form:
  - Name: "Sample Policy"
  - Category: "Compliance"
  - Version: "1.0"
  - Deadline: 30 days from now
- Select PDF file
- Click "Upload"

### 3. Create Distribution
- Document appears in list
- Click "Distribute"
- Select recipients (Finance Department)
- Set deadline
- Click "Distribute"
- Users notified via email

### 4. Track Progress
- Go to "Monitoring"
- View real-time progress
- See who downloaded/submitted

### 5. Download as User
- Logout
- Login as: user@company.com / User@123456
- Click document
- Download PDF (no watermark in file)
- View in browser shows watermark
- Upload signed PDF

---

## 🎯 What to Test

- [ ] Login with different roles
- [ ] Upload PDF document
- [ ] Create distribution
- [ ] Download document
- [ ] Upload signed document
- [ ] View monitoring dashboard
- [ ] Check audit logs
- [ ] Test reminders
- [ ] Verify email notifications

---

## 📊 Performance Tips

For better performance on local machine:

### Increase Docker Resources
- Docker Desktop → Preferences → Resources
- Set CPU: 4 cores
- Set Memory: 6-8 GB
- Set Swap: 2 GB

### Optimize Database
```sql
-- Connect to database
docker-compose exec postgres psql -U signoff_user -d signoff_db

-- Create indexes
CREATE INDEX idx_documents_active ON documents(is_active);
CREATE INDEX idx_users_email ON users(email);
```

---

## 🚀 Next Steps After Testing

1. **Review Code** - Explore `/backend` and `/frontend` folders
2. **Read Documentation** - Check out complete docs in `/docs`
3. **Customize UI** - Modify components in `frontend/src/components`
4. **Add Features** - Extend with your business logic
5. **Deploy to Production** - Use Kubernetes manifests in docs

---

## 📞 Support

If you encounter issues:

1. Check logs: `docker-compose logs -f`
2. Read troubleshooting section above
3. Review full documentation in `/docs/README.md`
4. Check GitHub issues (if applicable)

---

## ✅ Checklist

- [ ] Docker Desktop installed
- [ ] Setup script ran successfully
- [ ] docker-compose up -d running
- [ ] Database migrations complete
- [ ] Seed data loaded
- [ ] Can access http://localhost:3000
- [ ] Can login with test accounts
- [ ] Can see all services in Docker

---

**Happy testing! 🎉**

Next time you want to start development:
```bash
docker-compose up -d
```

Done! Services are ready.
