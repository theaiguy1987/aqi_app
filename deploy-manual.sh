#!/bin/bash
# deploy-manual.sh - Step-by-step manual deployment for learning
# Use this if you want to understand each step of the deployment process

set -e

echo "=========================================="
echo "AQI Calculator - Manual Deployment Guide"
echo "=========================================="
echo ""

# Get project info
PROJECT_ID=$(gcloud config get-value project)
REGION=${REGION:-us-central1}

echo "Current Project: $PROJECT_ID"
echo "Region: $REGION"
echo ""

echo "This script will guide you through deploying step by step."
echo "Press Enter after each step to continue..."
read

# Step 1: Enable APIs
echo ""
echo "Step 1: Enable Required APIs"
echo "----------------------------"
echo "Running: gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com"
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com
echo "✓ APIs enabled"
read

# Step 2: Build backend
echo ""
echo "Step 2: Build Backend Docker Image"
echo "----------------------------------"
echo "Running: gcloud builds submit --tag gcr.io/$PROJECT_ID/aqi-backend ./backend"
gcloud builds submit --tag gcr.io/$PROJECT_ID/aqi-backend ./backend
echo "✓ Backend image built and pushed"
read

# Step 3: Deploy backend
echo ""
echo "Step 3: Deploy Backend to Cloud Run"
echo "------------------------------------"
gcloud run deploy aqi-backend \
    --image gcr.io/$PROJECT_ID/aqi-backend \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --port 8080

BACKEND_URL=$(gcloud run services describe aqi-backend --region=$REGION --format='value(status.url)')
echo ""
echo "✓ Backend deployed at: $BACKEND_URL"
read

# Step 4: Build frontend
echo ""
echo "Step 4: Build Frontend Docker Image"
echo "------------------------------------"
echo "The frontend needs to know the backend URL and Google Maps API key."
if [ -z "$GOOGLE_MAPS_API_KEY" ]; then
    echo "WARNING: GOOGLE_MAPS_API_KEY not set - location autocomplete will NOT work!"
    echo "         Set it with: export GOOGLE_MAPS_API_KEY=your_api_key"
    echo "         Get one at: https://console.cloud.google.com/apis/credentials"
    echo ""
fi
echo "Building with:"
echo "  VITE_API_URL=$BACKEND_URL"
echo "  VITE_GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY:+[SET]}"
cd frontend
docker build \
    --build-arg VITE_API_URL=$BACKEND_URL \
    --build-arg VITE_GOOGLE_MAPS_API_KEY=$GOOGLE_MAPS_API_KEY \
    -t gcr.io/$PROJECT_ID/aqi-frontend .
docker push gcr.io/$PROJECT_ID/aqi-frontend
cd ..
echo "✓ Frontend image built and pushed"
read

# Step 5: Deploy frontend
echo ""
echo "Step 5: Deploy Frontend to Cloud Run"
echo "-------------------------------------"
gcloud run deploy aqi-frontend \
    --image gcr.io/$PROJECT_ID/aqi-frontend \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --port 8080

FRONTEND_URL=$(gcloud run services describe aqi-frontend --region=$REGION --format='value(status.url)')
echo ""
echo "✓ Frontend deployed at: $FRONTEND_URL"

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Your AQI Calculator is now live:"
echo "  Frontend: $FRONTEND_URL"
echo "  Backend:  $BACKEND_URL"
echo "  API Docs: $BACKEND_URL/docs"
echo ""
