#!/bin/bash

# TrueTrace Frontend Deployment to Google Cloud Storage
# Deploys only the frontend to a static bucket

BUCKET_NAME="truetrace"
PROJECT_ID="adept-fountain-476023-m1"

echo "🚀 Starting TrueTrace Frontend deployment to Cloud Storage..."
echo "📦 Bucket: gs://$BUCKET_NAME"
echo ""

# Step 1: Build the React app
echo "🏗️  Building React app for production..."
npm run build

if [ ! -d "build" ]; then
    echo "❌ Build failed - no build directory found"
    exit 1
fi

echo "✅ Build completed successfully"
echo ""

# Step 2: Set the active project
echo "🔧 Setting Google Cloud project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Step 3: Create bucket if it doesn't exist (will fail silently if exists)
echo "📦 Ensuring bucket exists..."
gsutil mb -p $PROJECT_ID gs://$BUCKET_NAME 2>/dev/null || echo "✅ Bucket already exists"

# Step 4: Upload files to bucket
echo "☁️  Uploading files to gs://$BUCKET_NAME..."
gsutil -m rsync -r -d build/ gs://$BUCKET_NAME/

# Step 5: Configure for static website hosting
echo "🌐 Configuring bucket for static website..."
gsutil web set -m index.html -e index.html gs://$BUCKET_NAME

# Step 6: Make files publicly accessible
echo "🔓 Making bucket publicly accessible..."
gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME

# Step 7: Set cache control for better performance
echo "⚡ Setting cache control headers..."
gsutil -m setmeta -h "Cache-Control:public, max-age=3600" gs://$BUCKET_NAME/**/*.html
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000" gs://$BUCKET_NAME/static/**/*

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Your frontend is now live at:"
echo "📍 https://storage.googleapis.com/$BUCKET_NAME/index.html"
echo ""
echo "You can also access it via:"
echo "📍 https://storage.cloud.google.com/$BUCKET_NAME/index.html"
echo ""
echo "Backend API: https://truetrace-backend-755369053889.us-east4.run.app"
