# 🚀 Deployment Guide - Google Cloud Run

Put your AQI Calculator on the internet so anyone can use it!

---

## 📚 Table of Contents

1. [What is Google Cloud Run?](#what-is-google-cloud-run)
2. [Prerequisites](#prerequisites)
3. [Quick Deploy](#quick-deploy-5-minutes)
4. [Manual Deploy](#manual-deploy-for-learning)
5. [How It Works](#how-it-works)
6. [Making Updates](#making-updates)
7. [Troubleshooting](#troubleshooting)
8. [Cost](#cost)

---

## What is Google Cloud Run?

**Cloud Run** runs your app in containers without you managing servers:
- ✅ Automatic scaling (0 to 1000s of users)
- ✅ HTTPS automatically included
- ✅ Pay only when someone uses it
- ✅ Global availability

```
Local Development              →    Google Cloud Run
───────────────────────────────────────────────────────
localhost:3000 (frontend)      →    https://your-frontend.run.app
localhost:8000 (backend)       →    https://your-backend.run.app
```

---

## Prerequisites

### 1. Google Cloud Account
- Create at [cloud.google.com](https://cloud.google.com)
- New users get **$300 free credit**

### 2. Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click project dropdown → **New Project**
3. Name it (e.g., `aqi-calculator`)
4. Note your **Project ID** (you'll need it!)

### 3. Enable Billing
- Required even for free tier
- Go to: **Billing** → **Link a billing account**
- Don't worry: this app costs ~$0-2/month

---

## Quick Deploy (5 Minutes)

### Step 1: Open Cloud Shell

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click the terminal icon **>_** in the top right
3. Wait for the shell to load

### Step 2: Get Your Code

```bash
# Clone your repository
git clone https://github.com/theaiguy1987/aqi_app.git
cd aqi_app

# Switch to deployment branch
git checkout google-cloud-run

# Set your project ID (replace with yours!)
gcloud config set project YOUR_PROJECT_ID
```

### Step 3: Set Up API Keys

The app needs two API keys:

#### AQICN API Token (Required)
Fetches live air quality data:

1. Go to [aqicn.org/data-platform/token](https://aqicn.org/data-platform/token/) and create a free account
2. Get your API token from your profile
3. Set it as an environment variable:

```bash
export AQICN_API_TOKEN=your_token_here
```

#### Google Maps API Key (Optional but Recommended)
Enables location autocomplete:

1. Go to [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/)
2. Enable **Places API (New)** for your project
3. Create an API key
4. Set it as an environment variable:

```bash
export GOOGLE_MAPS_API_KEY=your_key_here
```

> 💡 **Without Google Maps API**: Users can still use GPS location or enter coordinates manually.

### Step 4: Deploy!

```bash
# Make script executable
chmod +x deploy.sh

# Run deployment (uses AQICN_API_TOKEN and GOOGLE_MAPS_API_KEY from environment)
./deploy.sh
```

**Wait 5-10 minutes.** When done, you'll see:
```
==========================================
Deployment Complete!
==========================================
Frontend: https://aqi-frontend-xxx-uc.a.run.app
Backend:  https://aqi-backend-xxx-uc.a.run.app
```

### Step 4: Test It!

Open the **Frontend URL** in your browser. Your app is live! 🎉

---

## Manual Deploy (For Learning)

If you want to understand each step:

### Step 1: Enable APIs

```bash
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    containerregistry.googleapis.com
```

### Step 2: Set Variables

```bash
export PROJECT_ID=$(gcloud config get-value project)
export REGION=us-central1
```

### Step 3: Deploy Backend

```bash
cd backend

# Build Docker image
gcloud builds submit --tag gcr.io/$PROJECT_ID/aqi-backend

# Deploy to Cloud Run (with AQICN API token)
gcloud run deploy aqi-backend \
    --image gcr.io/$PROJECT_ID/aqi-backend \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --set-env-vars "AQICN_API_TOKEN=your_aqicn_token_here"

# Get the URL
BACKEND_URL=$(gcloud run services describe aqi-backend --region=$REGION --format='value(status.url)')
echo "Backend: $BACKEND_URL"
```

**Note:** Get your free AQICN API token at [aqicn.org/data-platform/token](https://aqicn.org/data-platform/token/)

### Step 4: Deploy Frontend

```bash
cd ../frontend

# Create environment file with backend URL and Google Maps API key
echo "VITE_API_URL=$BACKEND_URL" > .env.production
echo "VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key_here" >> .env.production

# Build Docker image
gcloud builds submit --tag gcr.io/$PROJECT_ID/aqi-frontend

# Deploy to Cloud Run
gcloud run deploy aqi-frontend \
    --image gcr.io/$PROJECT_ID/aqi-frontend \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --port 8080

# Get the URL
FRONTEND_URL=$(gcloud run services describe aqi-frontend --region=$REGION --format='value(status.url)')
echo "Frontend: $FRONTEND_URL"
```

> 💡 **Google Maps API**: If you skip `VITE_GOOGLE_MAPS_API_KEY`, location autocomplete won't work, but users can still use GPS.

---

## How It Works

### Understanding the Deployment

```
Your Code
    ↓
Docker Build (packages your app)
    ↓
Container Registry (stores the package)
    ↓
Cloud Run (runs the package)
    ↓
Public URL (anyone can access)
```

### Key Concept: Build-Time vs Runtime

**Backend (Python)** - Runtime variables:
```python
# Read when server RUNS
port = os.environ.get("PORT", 8000)
api_key = os.environ.get("AQICN_API_TOKEN")  # For AQICN live data
```

**Frontend (React)** - Build-time variables:
```javascript
// Read when code is BUILT, not when it runs!
const API_URL = import.meta.env.VITE_API_URL
const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
```

**Important:** The frontend's API URL must be set BEFORE building the Docker image!

### Data Flow in Production

```
User selects location on Frontend (via Google Places API)
    ↓
Frontend calls Backend /aqi/location endpoint with coordinates
    ↓
Backend fetches live data from AQICN API
    ↓
Backend returns EPA AQI values with health recommendations
    ↓
Result displayed with color-coded AQI and cigarette equivalent
```

That's why `deploy.sh`:
1. Deploys backend first
2. Gets backend URL
3. Creates `.env.production` with backend URL and Google Maps API key
4. THEN builds frontend

---

## Making Updates

### Your Workflow

```bash
# 1. Make changes locally
code .

# 2. Test locally
.\start.bat

# 3. Commit and push
git add .
git commit -m "feat: Your change"
git push origin google-cloud-run

# 4. Deploy (in Cloud Shell)
cd ~/aqi_app
git pull origin google-cloud-run
./deploy.sh
```

### What's Safe to Change

| ✅ Safe | ⚠️ Careful | 🚨 Expert Only |
|---------|------------|----------------|
| Python logic | requirements.txt | Dockerfile |
| React components | package.json | nginx.conf |
| CSS styles | Environment vars | cloudbuild.yaml |
| New API endpoints | | deploy.sh |

---

## Troubleshooting

### "Permission denied"
```bash
chmod +x deploy.sh
```

### "Project not set"
```bash
gcloud config set project YOUR_PROJECT_ID
```

### "APIs not enabled"
```bash
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com
```

### Container won't start
Check logs:
```bash
gcloud run logs tail aqi-backend --region=us-central1
gcloud run logs tail aqi-frontend --region=us-central1
```

### Frontend shows blank page
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab - is the API URL correct?

**Common cause:** Frontend was built without `VITE_API_URL` set.

**Fix:** 
```bash
# In Cloud Shell
cd ~/aqi_app
echo "VITE_API_URL=$BACKEND_URL" > frontend/.env.production
echo "VITE_GOOGLE_MAPS_API_KEY=$GOOGLE_MAPS_API_KEY" >> frontend/.env.production
./deploy.sh
```

### "Failed to fetch" error
1. Check backend is running: `curl YOUR_BACKEND_URL/health`
2. Check CORS settings in `backend/main.py`
3. Make sure frontend has correct backend URL

---

## Cost

### Free Tier (Monthly)

| Resource | Free Amount |
|----------|-------------|
| Requests | 2 million |
| CPU | 180,000 vCPU-seconds |
| Memory | 360,000 GiB-seconds |

### For This App

- **Normal usage**: **$0/month**
- **High usage**: $2-5/month
- **Scales to zero** when no one uses it

### Check Your Spending

1. Go to **Billing** → **Reports**
2. Filter by your project
3. Set up billing alerts if needed

### Delete Everything (Stop All Costs)

```bash
gcloud run services delete aqi-frontend --region=us-central1
gcloud run services delete aqi-backend --region=us-central1
```

---

## Useful Commands

```bash
# Check which project you're using
gcloud config get-value project

# List your Cloud Run services
gcloud run services list

# Get service URL
gcloud run services describe aqi-frontend --region=us-central1 --format='value(status.url)'

# View logs (live)
gcloud run logs tail aqi-frontend --region=us-central1

# View recent logs
gcloud run logs read aqi-backend --region=us-central1 --limit=50

# Delete a service
gcloud run services delete SERVICE_NAME --region=us-central1
```

---

## Deployment Checklist

- [ ] Google Cloud account created
- [ ] Project created and ID noted
- [ ] Billing enabled
- [ ] Cloud Shell opened
- [ ] Repository cloned
- [ ] `google-cloud-run` branch checked out
- [ ] Project ID set: `gcloud config set project YOUR_ID`
- [ ] AQICN API token obtained and set: `export AQICN_API_TOKEN=...`
- [ ] (Optional) Google Maps API key obtained and set: `export GOOGLE_MAPS_API_KEY=...`
- [ ] Deploy script run: `./deploy.sh`
- [ ] Frontend URL works in browser
- [ ] Calculator works end-to-end

---

## Summary

**What you achieved:**
- 🌍 Your app is live on the internet
- 🔒 HTTPS enabled automatically
- 📈 Auto-scales from 0 to thousands of users
- 💰 Free for low usage

**Your deployment workflow:**
```
Edit code → Test locally → Push to GitHub → Deploy to Cloud
```

**Happy deploying! 🚀**
