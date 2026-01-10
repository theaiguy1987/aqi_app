# 🔧 Environment Configuration Guide

## Overview

This project uses **environment variables** to work seamlessly in both local development and cloud deployment. The **same code** runs in both environments without any changes!

---

## 🎯 How It Works

### The Magic Formula

```
Code reads environment variables
    ↓
Local: Uses .env files (localhost URLs)
    ↓
Cloud: Uses Cloud Run environment (production URLs)
    ↓
Same code, different configurations!
```

### Key Files

| File | Purpose | Committed to Git? |
|------|---------|-------------------|
| `.env.example` | Template with documentation | ✅ Yes (safe) |
| `.env` | Your local values | ❌ No (in .gitignore) |
| Cloud Run env vars | Production values | ❌ No (set during deployment) |

---

## 📁 Directory Structure

```
aqi_app/
├── backend/
│   ├── .env.example       ← Template (committed)
│   ├── .env               ← Your local config (NOT committed)
│   └── main.py            ← Reads PORT from environment
│
├── frontend/
│   ├── .env.example       ← Template (committed)
│   ├── .env               ← Your local config (NOT committed)
│   └── src/App.jsx        ← Reads VITE_API_URL from environment
│
└── start.bat / start.sh   ← Auto-creates .env files
```

---

## 🚀 Quick Start (First Time)

### Option 1: Automatic (Recommended)

Just run the start script - it creates `.env` files automatically:

```bash
# Windows
.\start.bat

# Linux/Mac
./start.sh
```

The script will:
1. ✅ Check if `.env` files exist
2. ✅ If not, copy from `.env.example`
3. ✅ Start backend and frontend with correct config

### Option 2: Manual Setup

```bash
# Backend
cd backend
cp .env.example .env

# Frontend
cd frontend
cp .env.example .env
```

---

## 🔑 Environment Variables Explained

### Backend Variables (`backend/.env`)

```bash
# Port the server runs on
# Local: 8000 (convenient for testing)
# Cloud: Set automatically by Cloud Run (usually 8080)
PORT=8000

# Host to bind to
API_HOST=0.0.0.0

# CORS settings (which origins can call your API)
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Logging level
LOG_LEVEL=INFO
```

**How it's used:**
```python
# backend/main.py
port = int(os.environ.get("PORT", 8000))
uvicorn.run(app, host="0.0.0.0", port=port)
```

### Frontend Variables (`frontend/.env`)

```bash
# Backend API URL
# Local: http://localhost:8000
# Cloud: Set during Docker build (e.g., https://aqi-backend-xxx.run.app)
VITE_API_URL=http://localhost:8000

# Optional: App title
VITE_APP_TITLE=AQI Calculator
```

**How it's used:**
```javascript
// frontend/src/App.jsx
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const response = await fetch(`${API_URL}/calculate-aqi`, { ... })
```

---

## 🌍 Environments Comparison

### Local Development

**Setup:**
```bash
# .env files exist in your project
backend/.env    → PORT=8000
frontend/.env   → VITE_API_URL=http://localhost:8000
```

**Result:**
- Backend runs on `http://localhost:8000`
- Frontend calls `http://localhost:8000` for API
- Everything works locally!

---

### Cloud Run Production

**Setup:**
```bash
# No .env files needed!
# Cloud Run sets environment variables automatically:

Backend container:
  PORT=8080                    # Set by Cloud Run
  
Frontend container:
  VITE_API_URL=https://aqi-backend-xxx.run.app  # Set during build
```

**Result:**
- Backend runs on `$PORT` (whatever Cloud Run assigns)
- Frontend calls production backend URL
- Everything works in cloud!

---

## ✏️ Making Changes

### Adding a New Environment Variable

#### Step 1: Add to `.env.example`
```bash
# backend/.env.example
PORT=8000
MY_NEW_VARIABLE=default_value  # NEW!
```

#### Step 2: Update your local `.env`
```bash
# backend/.env
PORT=8000
MY_NEW_VARIABLE=my_local_value  # NEW!
```

#### Step 3: Use in code
```python
# backend/main.py
import os

my_var = os.environ.get("MY_NEW_VARIABLE", "default_value")
print(f"My variable: {my_var}")
```

#### Step 4: Update Cloud Run (if needed for production)

**Option A:** Add to `cloudbuild.yaml`
```yaml
# In the deploy-backend step
- '--set-env-vars'
- 'PORT=8080,MY_NEW_VARIABLE=production_value'
```

**Option B:** Set manually in Cloud Run console
1. Go to Cloud Run → aqi-backend
2. Click "Edit & Deploy New Revision"
3. Go to "Variables & Secrets" tab
4. Add: `MY_NEW_VARIABLE = production_value`
5. Deploy

---

### Adding a New Package

#### Backend (Python)

1. **Install locally:**
```bash
cd backend
pip install new-package
```

2. **Update requirements.txt:**
```bash
pip freeze > requirements.txt
# Or manually add:
echo "new-package==1.0.0" >> requirements.txt
```

3. **Use in code:**
```python
import new_package
```

4. **Test locally:**
```bash
.\start.bat
```

5. **Deploy to cloud:**
```bash
git add backend/requirements.txt
git commit -m "feat: Add new-package for XYZ"
git push origin google-cloud-run
# In Cloud Shell:
./deploy.sh
```

✅ **Docker automatically installs the new package during build!**

#### Frontend (NPM)

1. **Install locally:**
```bash
cd frontend
npm install new-package
```

2. **package.json is auto-updated** ✅

3. **Use in code:**
```javascript
import something from 'new-package'
```

4. **Test locally:**
```bash
.\start.bat
```

5. **Deploy to cloud:**
```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "feat: Add new-package for XYZ"
git push origin google-cloud-run
# In Cloud Shell:
./deploy.sh
```

✅ **Docker automatically installs the new package during build!**

---

## 🧪 Testing Different Configurations

### Test Against Different Backend URLs

```bash
# frontend/.env.local (create this for testing)
VITE_API_URL=http://localhost:8000      # Local backend
# VITE_API_URL=http://192.168.1.5:8000 # Backend on another machine
# VITE_API_URL=https://aqi-backend-xxx.run.app  # Cloud backend
```

Then run:
```bash
cd frontend
npm run dev
```

### Test Different Ports

```bash
# backend/.env
PORT=8080  # Test with Cloud Run port locally
```

Then run:
```bash
cd backend
python main.py
# Backend now on http://localhost:8080
```

---

## 🔒 Security Best Practices

### ✅ DO:
- Commit `.env.example` files (they're templates)
- Use different values in `.env` (local) vs Cloud Run (production)
- Add secrets to `.env` for local testing
- Use Cloud Secret Manager for production secrets

### ❌ DON'T:
- Commit `.env` files (they're in `.gitignore`)
- Put real API keys in `.env.example`
- Hardcode secrets in code
- Share your `.env` files publicly

### Adding Secrets (API Keys, etc.)

**Local:**
```bash
# backend/.env
OPENWEATHER_API_KEY=your_local_test_key
```

**Cloud Run (Recommended - Use Secret Manager):**
```bash
# Create secret
gcloud secrets create openweather-api-key --data-file=- <<< "your_production_key"

# Update cloudbuild.yaml to mount secret
- '--set-secrets'
- 'OPENWEATHER_API_KEY=openweather-api-key:latest'
```

Or just set as environment variable:
```yaml
- '--set-env-vars'
- 'OPENWEATHER_API_KEY=your_production_key'
```

---

## 🐛 Troubleshooting

### Issue: "Environment variable not found"

**Symptom:**
```python
KeyError: 'MY_VARIABLE'
```

**Fix:**
```python
# Bad
value = os.environ['MY_VARIABLE']  # Crashes if not set

# Good
value = os.environ.get('MY_VARIABLE', 'default')  # Returns default if not set
```

---

### Issue: "Frontend calling wrong backend URL"

**Local Issue:**
```bash
# Check frontend/.env
cat frontend/.env

# Should show:
VITE_API_URL=http://localhost:8000
```

**Cloud Issue:**
```bash
# Check cloudbuild.yaml - should have:
- '-c'
- |
  BACKEND_URL=$(gcloud run services describe ${_BACKEND_SERVICE} ...)
  echo "VITE_API_URL=$BACKEND_URL" > /workspace/frontend/.env.production
```

---

### Issue: ".env changes not taking effect"

**Frontend (Vite):**
```bash
# Restart the dev server
cd frontend
npm run dev
```

**Backend (Python):**
```bash
# Restart the server
cd backend
python main.py
```

**Remember:** 
- Frontend: `.env` is read at build time
- Backend: `.env` is read at runtime

---

### Issue: "Works locally, fails in cloud"

**Check:**
1. Did you update `.env.example`? ✅
2. Did you set the variable in Cloud Run? ✅
3. Did you redeploy after changes? ✅

**Debug:**
```bash
# Check Cloud Run environment variables
gcloud run services describe aqi-backend --region=us-central1 --format='get(spec.template.spec.containers[0].env)'

# Check logs for environment variable values
gcloud run logs tail aqi-backend --region=us-central1
```

---

## 📋 Checklist: Adding a New Feature

- [ ] Edit code (backend/frontend)
- [ ] Add new env vars to `.env.example` (if needed)
- [ ] Update your local `.env` (if needed)
- [ ] Add new packages to `requirements.txt` / `package.json` (if needed)
- [ ] Test locally: `.\start.bat`
- [ ] Verify environment variables are read correctly
- [ ] Commit changes:
  ```bash
  git add .
  git commit -m "feat: Your feature description"
  git push origin google-cloud-run
  ```
- [ ] Deploy to cloud: `./deploy.sh` (in Cloud Shell)
- [ ] Update Cloud Run env vars (if needed for production-specific values)
- [ ] Test cloud URLs

---

## 🎓 Understanding the Flow

### Local Development
```
1. Run start.bat/start.sh
   ↓
2. Script creates .env files from .env.example (if missing)
   ↓
3. Backend reads PORT from .env → runs on localhost:8000
   ↓
4. Frontend reads VITE_API_URL from .env → calls localhost:8000
   ↓
5. Everything works! ✅
```

### Cloud Deployment
```
1. Run ./deploy.sh in Cloud Shell
   ↓
2. cloudbuild.yaml builds backend Docker image
   ↓
3. Cloud Run sets PORT=8080 environment variable
   ↓
4. Backend reads PORT from Cloud Run → runs on :8080
   ↓
5. cloudbuild.yaml gets backend URL, creates frontend/.env.production
   ↓
6. Frontend builds with VITE_API_URL=https://backend-url
   ↓
7. Frontend calls production backend ✅
```

---

## 🚀 Summary

**The Beauty of This Setup:**

1. **One Codebase**: Same code works everywhere
2. **Environment-Specific Config**: Different URLs/ports via env vars
3. **Git-Friendly**: Only templates committed, local values ignored
4. **Easy Testing**: Change `.env` to test different scenarios
5. **Secure**: Secrets in `.env` (local) or Secret Manager (cloud)
6. **Automatic**: Start scripts create everything needed

**Golden Rule:**
> Never hardcode URLs, ports, or secrets in code. Always use environment variables with sensible defaults.

**Your Workflow:**
```bash
# Make changes
code .

# Test locally (auto-uses .env files)
.\start.bat

# Push to cloud
git push origin google-cloud-run

# Deploy (auto-uses Cloud Run env vars)
./deploy.sh
```

**It just works!** ✨
