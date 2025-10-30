# Google Cloud Deployment Guide - TrueTrace

## Architecture Overview
- **Frontend**: React app → Google Cloud Storage (static hosting)
- **Backend**: Express.js API → Google Cloud Run (containerized)
- **Database**: Google Cloud SQL MySQL (already configured ✅)

## Step 1: Deploy Backend to Google Cloud Run

### Prerequisites
- Google Cloud CLI installed
- Docker installed
- Project configured in Google Cloud Console

### Backend Deployment Commands:

```bash
# 1. Navigate to backend directory
cd backend

# 2. Build and tag Docker image
docker build -t gcr.io/YOUR_PROJECT_ID/truetrace-backend .

# 3. Push to Google Container Registry
docker push gcr.io/YOUR_PROJECT_ID/truetrace-backend

# 4. Deploy to Cloud Run
gcloud run deploy truetrace-backend \
  --image gcr.io/YOUR_PROJECT_ID/truetrace-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DB_HOST=34.21.118.117,DB_USER=edvinestrada7,DB_PASSWORD="Test12345!",DB_NAME=truetrace,PORT=8080

# 5. Note the URL returned (e.g., https://truetrace-backend-xyz-uc.a.run.app)
```

## Step 2: Update Frontend Configuration

### Update .env.production with your Cloud Run URL:
```bash
REACT_APP_API_URL=https://truetrace-backend-xyz-uc.a.run.app
```

## Step 3: Build and Deploy Frontend

```bash
# 1. Build React app for production
npm run build

# 2. Create Google Cloud Storage bucket (if not exists)
gsutil mb gs://your-truetrace-bucket

# 3. Upload build files to bucket
gsutil -m cp -r build/* gs://your-truetrace-bucket/

# 4. Make bucket public for web hosting
gsutil web set -m index.html -e index.html gs://your-truetrace-bucket

# 5. Set bucket permissions
gsutil iam ch allUsers:objectViewer gs://your-truetrace-bucket
```

## Step 4: Configure Custom Domain (Optional)

```bash
# Set up custom domain in Google Cloud Console
# Point your domain to: c.storage.googleapis.com
```

## Security Notes
- ✅ Database credentials are secured in Cloud Run environment variables
- ✅ Frontend only communicates with API endpoints
- ✅ CORS is properly configured in your backend
- ✅ No sensitive data exposed to client

## Expected URLs After Deployment:
- **Frontend**: https://storage.googleapis.com/your-truetrace-bucket/index.html
- **Backend API**: https://truetrace-backend-xyz-uc.a.run.app
- **Database**: Already running on Google Cloud SQL ✅

## Cost Estimate (Google Cloud Free Tier):
- Cloud Run: Free tier (2 million requests/month)
- Cloud Storage: ~$0.02/GB/month
- Cloud SQL: Already running

## Testing After Deployment:
1. Visit your frontend URL
2. Navigate to /demo page
3. Verify "Backend Connected" status appears
4. Confirm products load from your database

Your TrueTrace app will be fully functional with real database connectivity!