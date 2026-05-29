# Digital PDF Signoff - Demo App Setup

## ⚡ Quick Start (2 Minutes)

### Prerequisites
- Node.js 18+ installed ([Download](https://nodejs.org/))
- npm (comes with Node.js)

### Step 1: Install Dependencies
```bash
cd c:\legal\Digital-PDF-Signoff-System\demo-app
npm install
```

### Step 2: Run Development Server
```bash
npm run dev
```

### Step 3: Open Browser
```
http://localhost:3000
```

---

## 👤 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@company.com | Admin@123456 |
| Coordinator | coordinator@company.com | Admin@123456 |
| PIC | pic@company.com | Admin@123456 |
| User | user@company.com | User@123456 |

---

## 📁 Project Structure

```
demo-app/
├── pages/              # Next.js pages
│   ├── _app.tsx       # App wrapper
│   ├── index.tsx      # Login page
│   └── dashboard.tsx  # Main dashboard
├── styles/            # CSS files
│   └── globals.css
├── package.json       # Dependencies
├── tsconfig.json      # TypeScript config
├── next.config.js     # Next.js config
└── SETUP.md          # This file
```

---

## 🎯 Features Included

✅ Login page with test accounts  
✅ Dashboard with stats  
✅ Document list with progress tracking  
✅ Role-based access control  
✅ Notifications system  
✅ Admin panel (for Admin/Super Admin roles)  
✅ Responsive design  

---

## 🏗️ Technology Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Local Storage** - Session management

---

## 🛠️ Available Scripts

```bash
# Development mode (with hot reload)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

---

## 📚 What to Explore

1. **Login Page** (`pages/index.tsx`)
   - Mock authentication
   - Test account credentials

2. **Dashboard** (`pages/dashboard.tsx`)
   - Overview tab with stats
   - Documents tab with table
   - Notifications tab
   - Admin panel (role-based)

3. **Styling** (`styles/globals.css`)
   - Tailwind CSS configuration

---

## 🎨 Features to Test

- [ ] Login with different roles
- [ ] View dashboard stats
- [ ] Check document list
- [ ] Review notifications
- [ ] Access admin panel (as admin user)
- [ ] View compliance progress
- [ ] Check responsive design on mobile

---

## 📝 Notes

This is a **demo/prototype application** to showcase:
- UI design concepts
- User flows
- Role-based access control
- Dashboard layout

**Not included in demo:**
- ❌ Backend API (mocked data)
- ❌ Database (uses localStorage)
- ❌ File uploads
- ❌ PDF viewer
- ❌ Email notifications
- ❌ Real data persistence

---

## 🚀 Next Steps

After exploring the demo:

1. Review full documentation: `/docs/`
2. Check backend setup: `/local-setup/`
3. Implement full system with Docker

---

## 🐛 Troubleshooting

### Port 3000 already in use
```bash
# Kill the process using port 3000
# Windows: taskkill /PID <PID> /F
# macOS/Linux: lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### npm install fails
```bash
# Clear npm cache
npm cache clean --force

# Try install again
npm install
```

### Page won't load
```bash
# Clear browser cache
# Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
# Then refresh page
```

---

**Enjoy exploring! 🚀**
