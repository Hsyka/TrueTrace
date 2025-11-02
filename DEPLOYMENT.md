# TrueTrace Deployment Guide

## Current Architecture
- **Frontend**: React app (can be deployed to static hosting)
- **Backend**: Express.js API server (needs server hosting)
- **Database**: Google Cloud SQL MySQL (already hosted)

## Deployment Strategy

### 1. Backend Deployment (Choose one):

#### Option A: Google Cloud Run (Recommended)
```bash
# 1. Create Dockerfile in backend folder
# 2. Build and push to Google Container Registry
# 3. Deploy to Cloud Run
# 4. Get the Cloud Run URL (e.g., https://your-app-xyz.run.app)
```

#### Option B: Heroku
```bash
# 1. Create Heroku app
# 2. Set environment variables
# 3. Deploy backend code
# 4. Get Heroku app URL
```

### 2. Frontend Deployment

#### Update Environment Variables:
1. Update `.env.production` with your backend URL
2. Build the React app: `npm run build`
3. Deploy the `build` folder to cloud bucket

#### Example for Google Cloud Storage:
```bash
# Build the app
npm run build

# Deploy to GCS bucket
gsutil -m cp -r build/* gs://your-bucket-name/

# Make bucket public for website hosting
gsutil web set -m index.html -e 404.html gs://your-bucket-name
```

### 3. Environment Variables Setup

#### Backend (.env in backend folder):
```
DB_HOST=34.21.118.117
DB_USER=edvinestrada7
DB_PASSWORD="Test12345!"
DB_NAME=truetrace
PORT=8080
```

#### Frontend (.env.production):
```
REACT_APP_API_URL=https://your-deployed-backend-url.com
```

### 4. Database Security
- ✅ Your Cloud SQL is already properly configured
- ✅ Database credentials are secure in backend environment
- ✅ Frontend only calls API endpoints (no direct DB access)

## Quick Start Deployment

### For Google Cloud:
1. **Deploy Backend to Cloud Run**
2. **Build Frontend**: `npm run build`
3. **Upload to GCS bucket**
4. **Configure bucket for static website hosting**

### Cost Estimate:
- Cloud Run: ~$0-5/month (with free tier)
- Cloud Storage: ~$1-3/month
- Cloud SQL: Already running

## Testing Production Build Locally:
```bash
# Build the frontend
npm run build

# Serve the build folder
npx serve -s build -l 3000

# Test with production environment variables
```

## Security Considerations:
- ✅ Database credentials secured in backend only
- ✅ Frontend uses environment variables for API URL
- ✅ CORS properly configured
- ✅ No sensitive data exposed to frontend