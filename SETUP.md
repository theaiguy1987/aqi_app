# 🛠️ Setup Guide

Get the AQI Calculator running on your computer step by step.

---

## 📋 What You Need First

| Software | Check If Installed | Download |
|----------|-------------------|----------|
| Python 3.8+ | `python --version` | [python.org](https://python.org) |
| Node.js 16+ | `node --version` | [nodejs.org](https://nodejs.org) |
| Git | `git --version` | [git-scm.com](https://git-scm.com) |

---

## 🚀 Quick Start (Recommended)

The easiest way - just one command!

### Windows
```powershell
.\start.bat
```

### Linux/Mac
```bash
./start.sh
```

**What this does:**
1. ✅ Creates Python virtual environment
2. ✅ Installs Python dependencies
3. ✅ Installs Node.js dependencies  
4. ✅ Creates environment files (`.env`)
5. ✅ Starts both servers

**When complete, open:**
- **App**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs

---

## 🔧 Manual Setup (If Quick Start Fails)

### Step 1: Backend (Python)

```bash
# Go to project folder
cd aqi_app

# Create virtual environment
python -m venv .venv

# Activate it
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Start backend
cd backend
python main.py
```

✅ **Success**: You see `Uvicorn running on http://0.0.0.0:8000`

### Step 2: Frontend (New Terminal)

```bash
# Go to frontend folder
cd aqi_app/frontend

# Install dependencies
npm install

# Start frontend
npm run dev
```

✅ **Success**: You see `Local: http://localhost:3000/`

---

## ✅ Verify Everything Works

| Test | URL | Expected Result |
|------|-----|-----------------|
| Backend health | http://localhost:8000/health | `{"status": "healthy"}` |
| API docs | http://localhost:8000/docs | Interactive Swagger UI |
| Frontend | http://localhost:3000 | Calculator form appears |

**Full test:**
1. Open http://localhost:3000
2. Enter "New York" as location
3. Select today's date
4. Click "Calculate AQI"
5. See a colored result card!

---

## 🐛 Troubleshooting

### "python not found"

```bash
# Try python3 instead
python3 --version
python3 -m venv .venv
```

Or reinstall Python from [python.org](https://python.org) and check "Add to PATH".

### "npm not found"

Download Node.js from [nodejs.org](https://nodejs.org) and restart your terminal.

### "Port already in use"

```bash
# Windows - find what's using port 8000
netstat -ano | findstr :8000

# Kill it (replace 12345 with the PID you found)
taskkill /PID 12345 /F
```

### "Failed to fetch" in browser

The backend isn't running. Make sure:
1. Backend terminal shows `Uvicorn running on http://0.0.0.0:8000`
2. Visit http://localhost:8000/health - should return `{"status": "healthy"}`

### CORS error in browser console

Check that:
1. Backend is running on port 8000
2. Frontend is running on port 3000
3. No typos in the URLs

---

## 📁 Environment Files

The app uses `.env` files for configuration. The start scripts create them automatically.

### Backend (`backend/.env`)
```
PORT=8000
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=http://localhost:8000
```

**Important:** 
- `.env` files are for YOUR local machine (not committed to Git)
- `.env.example` files are templates (safe to commit)

---

## 📊 Architecture Overview

```
Your Computer
├── Terminal 1: Backend (Python)
│   └── Runs on http://localhost:8000
│
└── Terminal 2: Frontend (React)
    └── Runs on http://localhost:3000
    └── Calls backend at localhost:8000
```

The frontend makes API calls to the backend:
```
User clicks "Calculate AQI"
    ↓
Frontend sends POST to localhost:8000/calculate-aqi
    ↓
Backend calculates and returns result
    ↓
Frontend displays colored result
```

---

## 📚 Next Steps

| What You Want | Read This |
|--------------|-----------|
| Understand the Python code | [PYTHON_GUIDE.md](PYTHON_GUIDE.md) |
| Deploy to the internet | [DEPLOYMENT.md](DEPLOYMENT.md) |
| Learn about the project | [README.md](README.md) |

---

## 🎯 Quick Reference Card

```bash
# Start everything (recommended)
.\start.bat          # Windows
./start.sh           # Linux/Mac

# Manual start - Backend
cd backend
python main.py       # Runs on :8000

# Manual start - Frontend
cd frontend
npm run dev          # Runs on :3000

# URLs
http://localhost:3000       # App
http://localhost:8000/docs  # API docs
http://localhost:8000/health # Health check
```

**Happy coding! 🐍✨**
