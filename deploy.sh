#!/bin/bash

# TrueTrace Google Cloud Deployment Script
# Make sure to replace YOUR_PROJECT_ID with your actual Google Cloud Project ID

PROJECT_ID="YOUR_PROJECT_ID"
APP_NAME="truetrace-backend"
REGION="us-central1"
BUCKET_NAME="your-truetrace-bucket"

echo "🚀 Starting TrueTrace deployment to Google Cloud..."

# Step 1: Deploy Backend to Cloud Run
echo "📦 Building and deploying backend to Cloud Run..."
cd backend

# Build Docker image
docker build -t gcr.io/$PROJECT_ID/$APP_NAME .

# Push to Container Registry
docker push gcr.io/$PROJECT_ID/$APP_NAME

# Deploy to Cloud Run
gcloud run deploy $APP_NAME \
  --image gcr.io/$PROJECT_ID/$APP_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars DB_HOST=34.21.118.117,DB_USER=edvinestrada7,DB_PASSWORD="Test12345!",DB_NAME=truetrace,PORT=8080

# Get the deployed URL
BACKEND_URL=$(gcloud run services describe $APP_NAME --region=$REGION --format="value(status.url)")
echo "✅ Backend deployed to: $BACKEND_URL"

# Step 2: Update frontend environment and build
echo "🔧 Updating frontend configuration..."
cd ..
echo "REACT_APP_API_URL=$BACKEND_URL" > .env.production

# Build React app
echo "🏗️ Building React app..."
npm run build

# Step 3: Deploy to Cloud Storage
echo "☁️ Deploying frontend to Cloud Storage..."

# Create bucket if it doesn't exist
gsutil mb gs://$BUCKET_NAME 2>/dev/null || echo "Bucket already exists"

# Upload files
gsutil -m cp -r build/* gs://$BUCKET_NAME/

# Configure for web hosting
gsutil web set -m index.html -e index.html gs://$BUCKET_NAME

# Make public
gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME

FRONTEND_URL="https://storage.googleapis.com/$BUCKET_NAME/index.html"

echo "🎉 Deployment complete!"
echo "Frontend URL: $FRONTEND_URL"
echo "Backend URL: $BACKEND_URL"
echo "Demo page: $FRONTEND_URL#/demo"