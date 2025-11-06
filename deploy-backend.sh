#!/bin/bash

# TrueTrace Backend Deployment to Google Cloud Run
# Deploys backend to truetrace-backend-test service

PROJECT_ID="adept-fountain-476023-m1"
SERVICE_NAME="truetrace-backend"
REGION="us-east1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

# Database credentials
DB_HOST="34.31.129.80"
DB_USER="edvinestrada7"
DB_PASSWORD="Test12345!"
DB_NAME="truetrace"
INSTANCE_CONNECTION_NAME="adept-fountain-476023-m1:us-east4:turetrace"

echo "🚀 Starting TrueTrace Backend deployment to Cloud Run..."
echo "📦 Service: $SERVICE_NAME"
echo "🌍 Region: $REGION"
echo ""

# Step 1: Navigate to backend directory
cd backend || exit 1

# Step 2: Build using Cloud Build (no local Docker required)
echo "🐳 Building Docker image using Cloud Build..."
gcloud builds submit --tag $IMAGE_NAME --project $PROJECT_ID

if [ $? -ne 0 ]; then
    echo "❌ Cloud Build failed"
    exit 1
fi

echo "✅ Image built and pushed successfully"
echo ""

# Step 4: Deploy to Cloud Run
echo "☁️  Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars INSTANCE_CONNECTION_NAME=$INSTANCE_CONNECTION_NAME,DB_USER=$DB_USER,DB_PASSWORD=$DB_PASSWORD,DB_NAME=$DB_NAME \
  --add-cloudsql-instances $INSTANCE_CONNECTION_NAME \
  --project $PROJECT_ID

if [ $? -ne 0 ]; then
    echo "❌ Cloud Run deployment failed"
    exit 1
fi

echo ""
echo "✅ Backend deployed successfully"
echo ""

# Step 5: Get the deployed URL
BACKEND_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --platform=managed --format="value(status.url)" --project=$PROJECT_ID)

echo "🎉 Deployment complete!"
echo ""
echo "Your backend is now live at:"
echo "📍 $BACKEND_URL"
echo ""
echo "Test endpoints:"
echo "  - Health check: $BACKEND_URL/api/ping"
echo "  - Database test: $BACKEND_URL/api/test-db"
echo "  - Products: $BACKEND_URL/api/products"
echo ""
echo "Next steps:"
echo "1. Test the endpoints above"
echo "2. Update frontend .env.production with: REACT_APP_API_URL=$BACKEND_URL"
echo "3. Redeploy frontend with ./deploy-frontend.sh"
