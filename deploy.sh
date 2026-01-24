#!/bin/bash
# deploy.sh - Deploy AQI Calculator to Google Cloud Run
# Run this script from Google Cloud Shell after cloning the repository

set -e

echo "=========================================="
echo "AQI Calculator - Google Cloud Run Deploy"
echo "=========================================="

# Configuration
PROJECT_ID=$(gcloud config get-value project)
REGION=${REGION:-us-central1}
BACKEND_SERVICE="aqi-backend"
FRONTEND_SERVICE="aqi-frontend"

if [ -z "$PROJECT_ID" ]; then
    echo "Error: No project set. Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo ""
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# Enable required APIs
echo "Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build and deploy backend
echo ""
echo "=========================================="
echo "Building and deploying backend..."
echo "=========================================="

cd backend
gcloud builds submit --tag gcr.io/$PROJECT_ID/$BACKEND_SERVICE

# Check if AQICN_API_TOKEN is set
if [ -z "$AQICN_API_TOKEN" ]; then
    echo "WARNING: AQICN_API_TOKEN environment variable not set."
    echo "Set it with: export AQICN_API_TOKEN=your_api_token_here"
    echo "Get a free token at: https://aqicn.org/data-platform/token/"
    echo ""
fi

gcloud run deploy $BACKEND_SERVICE \
    --image gcr.io/$PROJECT_ID/$BACKEND_SERVICE \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --port 8080

# Get backend URL
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region=$REGION --format='value(status.url)')
echo ""
echo "Backend deployed at: $BACKEND_URL"

cd ..

# Build and deploy frontend
echo ""
echo "=========================================="
echo "Building and deploying frontend..."
echo "=========================================="

# Check if GOOGLE_MAPS_API_KEY is set for location autocomplete
if [ -z "$GOOGLE_MAPS_API_KEY" ]; then
    echo "WARNING: GOOGLE_MAPS_API_KEY environment variable not set."
    echo "Location autocomplete will not work without it."
    echo "Set it with: export GOOGLE_MAPS_API_KEY=your_api_key_here"
    echo ""
fi

# Create .env.production for frontend build
echo "VITE_API_URL=$BACKEND_URL" > frontend/.env.production
echo "VITE_GOOGLE_MAPS_API_KEY=$GOOGLE_MAPS_API_KEY" >> frontend/.env.production

# Build frontend image (Dockerfile will copy .env.production and use it during npm run build)
cd frontend
gcloud builds submit --tag gcr.io/$PROJECT_ID/$FRONTEND_SERVICE

# Deploy frontend to Cloud Run
gcloud run deploy $FRONTEND_SERVICE \
    --image gcr.io/$PROJECT_ID/$FRONTEND_SERVICE \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --port 8080

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE --region=$REGION --format='value(status.url)')

cd ..

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Frontend URL: $FRONTEND_URL"
echo "Backend URL:  $BACKEND_URL"
echo "API Docs:     $BACKEND_URL/docs"
echo ""
echo "Test the health endpoint:"
echo "  curl $BACKEND_URL/health"
echo ""
