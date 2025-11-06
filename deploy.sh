#!/bin/bash

# TrueTrace Complete Deployment Script
# Deploys both backend and frontend to Google Cloud

set -e  # Exit on any error

PROJECT_ID="adept-fountain-476023-m1"
SERVICE_NAME="truetrace-backend"
BACKEND_REGION="us-east1"
BUCKET_NAME="truetrace"

# Database credentials
DB_HOST="34.31.129.80"
DB_USER="edvinestrada7"
DB_PASSWORD="Test12345!"
DB_NAME="truetrace"
INSTANCE_CONNECTION_NAME="adept-fountain-476023-m1:us-east4:turetrace"

echo "════════════════════════════════════════════════════════════════"
echo "🚀 TrueTrace Complete Deployment to Google Cloud"
echo "════════════════════════════════════════════════════════════════"
echo ""

# ============================================================================
# STEP 1: Deploy Backend to Cloud Run
# ============================================================================
echo "📦 STEP 1/2: Deploying Backend to Cloud Run..."
echo "   Service: $SERVICE_NAME"
echo "   Region: $BACKEND_REGION"
echo ""

cd backend

# Build using Cloud Build (no local Docker required)
echo "🐳 Building Docker image using Cloud Build..."
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

gcloud builds submit --tag $IMAGE_NAME --project $PROJECT_ID --quiet

if [ $? -ne 0 ]; then
    echo "❌ Cloud Build failed"
    exit 1
fi

echo "✅ Image built and pushed successfully"
echo ""

# Deploy to Cloud Run
echo "☁️  Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $BACKEND_REGION \
  --allow-unauthenticated \
  --set-env-vars INSTANCE_CONNECTION_NAME=$INSTANCE_CONNECTION_NAME,DB_USER=$DB_USER,DB_PASSWORD=$DB_PASSWORD,DB_NAME=$DB_NAME \
  --add-cloudsql-instances $INSTANCE_CONNECTION_NAME \
  --project $PROJECT_ID \
  --quiet

if [ $? -ne 0 ]; then
    echo "❌ Cloud Run deployment failed"
    exit 1
fi

# Get the deployed backend URL
BACKEND_URL=$(gcloud run services describe $SERVICE_NAME --region=$BACKEND_REGION --platform=managed --format="value(status.url)" --project=$PROJECT_ID)

echo ""
echo "✅ Backend deployed successfully!"
echo "   URL: $BACKEND_URL"
echo ""

cd ..

# ============================================================================
# STEP 2: Deploy Frontend to Cloud Storage
# ============================================================================
echo "📦 STEP 2/2: Deploying Frontend to Cloud Storage..."
echo "   Bucket: gs://$BUCKET_NAME"
echo ""

# Update production environment with backend URL
echo "🔧 Updating .env.production with backend URL..."
cat > .env.production << EOF
REACT_APP_API_URL=$BACKEND_URL
REACT_APP_GOOGLE_CLIENT_ID=755369053889-4vo7kp3b4la9f5eoikq332h85ld1vduk.apps.googleusercontent.com
EOF

# Build React app
echo "🏗️  Building React app for production..."
npm run build

if [ ! -d "build" ]; then
    echo "❌ Build failed - no build directory found"
    exit 1
fi

echo "✅ Build completed successfully"
echo ""

# Set the active project
gcloud config set project $PROJECT_ID --quiet

# Ensure bucket exists
echo "📦 Ensuring bucket exists..."
gsutil mb -p $PROJECT_ID gs://$BUCKET_NAME 2>/dev/null || echo "✅ Bucket already exists"

# Upload files to bucket
echo "☁️  Uploading files to gs://$BUCKET_NAME..."
gsutil -m rsync -r -d build/ gs://$BUCKET_NAME/

# Configure for static website hosting
echo "🌐 Configuring bucket for static website..."
gsutil web set -m index.html -e index.html gs://$BUCKET_NAME

# Make files publicly accessible
echo "🔓 Making bucket publicly accessible..."
gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME

# Set cache control for better performance
echo "⚡ Setting cache control headers..."
gsutil -m setmeta -h "Cache-Control:public, max-age=3600" gs://$BUCKET_NAME/**/*.html 2>/dev/null
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000" gs://$BUCKET_NAME/static/**/* 2>/dev/null

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "🎉 Deployment Complete!"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📍 Frontend URL:"
echo "   https://storage.googleapis.com/$BUCKET_NAME/index.html"
echo ""
echo "📍 Backend API URL:"
echo "   $BACKEND_URL"
echo ""
echo "🧪 Test Endpoints:"
echo "   Health:   $BACKEND_URL/api/ping"
echo "   Database: $BACKEND_URL/api/test-db"
echo "   Products: $BACKEND_URL/api/products"
echo ""
echo "✅ Your TrueTrace application is now live!"
echo "════════════════════════════════════════════════════════════════"