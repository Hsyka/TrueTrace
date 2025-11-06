# TrueTrace Deployment Guide

## Quick Deployment Commands

### Deploy Everything (Recommended)
Deploy both backend and frontend in one command:
```bash
./deploy.sh
```

### Deploy Only Backend
Deploy just the backend API to Cloud Run:
```bash
./deploy-backend.sh
```

### Deploy Only Frontend
Deploy just the frontend to Cloud Storage:
```bash
./deploy-frontend.sh
```

## What Gets Deployed

### Backend (Cloud Run)
- **Service**: `truetrace-backend-test`
- **Region**: `us-east1`
- **URL**: https://truetrace-backend-test-755369053889.us-east1.run.app
- **Database**: Cloud SQL MySQL (us-central1)

### Frontend (Cloud Storage)
- **Bucket**: `truetrace-testing`
- **URL**: https://storage.googleapis.com/truetrace-testing/index.html
- **Connects to**: Backend API

## Deployment Process

The `deploy.sh` script performs these steps:

1. **Build Backend**
   - Uses Google Cloud Build to create Docker image
   - Pushes to Google Container Registry
   
2. **Deploy Backend to Cloud Run**
   - Deploys containerized API
   - Configures environment variables
   - Connects to Cloud SQL database

3. **Build Frontend**
   - Updates `.env.production` with backend URL
   - Creates production React build
   
4. **Deploy Frontend to Cloud Storage**
   - Uploads static files to bucket
   - Configures for web hosting
   - Sets public access and caching

## Testing Your Deployment

After deployment, test these endpoints:

```bash
# Health check
curl https://truetrace-backend-test-755369053889.us-east1.run.app/api/ping

# Database connection
curl https://truetrace-backend-test-755369053889.us-east1.run.app/api/test-db

# Products list
curl https://truetrace-backend-test-755369053889.us-east1.run.app/api/products
```

Visit your frontend at:
https://storage.googleapis.com/truetrace-testing/index.html

## Configuration Files

### Backend Environment Variables
Set in Cloud Run during deployment:
- `INSTANCE_CONNECTION_NAME`: Cloud SQL instance
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name

### Frontend Environment Variables
Set in `.env.production`:
- `REACT_APP_API_URL`: Backend API URL
- `REACT_APP_GOOGLE_CLIENT_ID`: Google OAuth client ID

## Troubleshooting

### Backend won't start
- Check Cloud Run logs: `gcloud run services logs read truetrace-backend-test --region=us-east1`
- Verify database credentials in deploy script

### Frontend shows errors
- Check browser console for API errors
- Verify backend URL in `.env.production`
- Test backend endpoints directly

### Database connection fails
- Ensure Cloud SQL instance is running
- Verify Cloud Run has Cloud SQL permissions
- Check database credentials

## Cost Optimization

### Cloud Run
- Auto-scales to zero when not in use
- Free tier: 2 million requests/month

### Cloud Storage
- Pay only for storage used (~$0.02/GB/month)
- Bandwidth charges for egress

### Cloud SQL
- Consider pausing when not actively developing
- Use smallest instance size for testing

## Security Notes

- ✅ Database credentials stored as environment variables (not in code)
- ✅ Backend requires HTTPS
- ✅ CORS configured for specific origins
- ✅ Frontend is static (no server-side code execution)

## Rollback

To rollback to a previous version:

```bash
# List previous revisions
gcloud run revisions list --service=truetrace-backend-test --region=us-east1

# Rollback to specific revision
gcloud run services update-traffic truetrace-backend-test \
  --to-revisions=REVISION_NAME=100 \
  --region=us-east1
```

## Support

For issues or questions, check:
- Cloud Run logs
- Cloud Build history
- Browser console (frontend)
