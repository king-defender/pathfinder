# Deployment Guide: Cloud Run + Firebase Hosting

This guide covers deploying the Pathfinder application with:
- **Backend**: Google Cloud Run (containerized API)
- **Frontend**: Firebase Hosting (static React app)

## Prerequisites

### 1. Google Cloud Setup
```bash
# Install gcloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init

# Create or select project
gcloud projects create pathfinder-app --name="Pathfinder App"
gcloud config set project pathfinder-app

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 2. Firebase Setup
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and initialize
firebase login
firebase init hosting firestore
```

### 3. Create Artifact Registry
```bash
gcloud artifacts repositories create pathfinder-repo \
    --repository-format=docker \
    --location=asia-south1 \
    --description="Pathfinder Docker images"
```

### 4. Create Service Account
```bash
gcloud iam service-accounts create pathfinder-sa \
    --description="Pathfinder service account" \
    --display-name="Pathfinder SA"

# Grant necessary roles
gcloud projects add-iam-policy-binding pathfinder-app \
    --member="serviceAccount:pathfinder-sa@pathfinder-app.iam.gserviceaccount.com" \
    --role="roles/firebase.admin"

gcloud projects add-iam-policy-binding pathfinder-app \
    --member="serviceAccount:pathfinder-sa@pathfinder-app.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

### 5. Create Secrets
```bash
# JWT Secret
echo -n "your-super-secure-jwt-secret-here" | \
    gcloud secrets create jwt-secret --data-file=-

# Google Maps API Key
echo -n "your-google-maps-api-key" | \
    gcloud secrets create google-maps-api-key --data-file=-

# Session Secret
echo -n "your-session-secret-here" | \
    gcloud secrets create session-secret --data-file=-

# Grant service account access to secrets
for secret in jwt-secret google-maps-api-key session-secret; do
    gcloud secrets add-iam-policy-binding $secret \
        --member="serviceAccount:pathfinder-sa@pathfinder-app.iam.gserviceaccount.com" \
        --role="roles/secretmanager.secretAccessor"
done
```

## Deployment Process

### Step 1: Configure Environment Variables

Create `.env.production`:
```bash
NODE_ENV=production
PORT=8080
GOOGLE_CLOUD_PROJECT_ID=pathfinder-app
FIREBASE_PROJECT_ID=pathfinder-app
CORS_ORIGIN=https://pathfinder-app.web.app,https://pathfinder-app.firebaseapp.com
```

Create `frontend/.env.production`:
```bash
VITE_API_BASE_URL=https://pathfinder-api-hash-as.a.run.app
VITE_FIREBASE_PROJECT_ID=pathfinder-app
VITE_FIREBASE_API_KEY=your-firebase-api-key
# ... other Firebase config
```

### Step 2: Deploy Backend to Cloud Run

```bash
# Use the automated deployment script
./scripts/deploy-cloud-run.sh

# Or manually:
npm run build:backend
docker build -t asia-south1-docker.pkg.dev/pathfinder-app/pathfinder-repo/api:latest .
docker push asia-south1-docker.pkg.dev/pathfinder-app/pathfinder-repo/api:latest

gcloud run deploy pathfinder-api \
    --image=asia-south1-docker.pkg.dev/pathfinder-app/pathfinder-repo/api:latest \
    --platform=managed \
    --region=asia-south1 \
    --allow-unauthenticated \
    --service-account=pathfinder-sa@pathfinder-app.iam.gserviceaccount.com \
    --set-env-vars="NODE_ENV=production,PORT=8080" \
    --set-secrets="JWT_SECRET=jwt-secret:latest" \
    --memory=2Gi \
    --cpu=2 \
    --min-instances=1 \
    --max-instances=100
```

### Step 3: Configure Firebase Hosting for API Routing

Update `firebase.json`:
```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [
      {
        "source": "/api/**",
        "run": {
          "serviceId": "pathfinder-api",
          "region": "asia-south1"
        }
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### Step 4: Deploy Frontend to Firebase Hosting

```bash
# Build frontend with production environment
cd frontend
npm run build
cd ..

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

## Verification

### 1. Test Backend Endpoints
```bash
# Get Cloud Run URL
SERVICE_URL=$(gcloud run services describe pathfinder-api \
    --region=asia-south1 --format="value(status.url)")

# Test health endpoint
curl $SERVICE_URL/health

# Test API endpoint
curl $SERVICE_URL/api/health
```

### 2. Test Frontend
```bash
# Get Firebase Hosting URL
FIREBASE_URL="https://pathfinder-app.web.app"

# Test frontend loads
curl -I $FIREBASE_URL

# Test API routing through Firebase
curl $FIREBASE_URL/api/health
```

### 3. End-to-End Connectivity
- Frontend should load at `https://pathfinder-app.web.app`
- API calls from frontend should route to Cloud Run backend
- Authentication should work between services
- CORS should allow frontend-backend communication

## Configuration Details

### Environment Variables (Backend)
- `NODE_ENV=production`
- `PORT=8080` (Cloud Run requirement)
- `GOOGLE_CLOUD_PROJECT_ID` - Your GCP project
- `FIREBASE_PROJECT_ID` - Your Firebase project
- `CORS_ORIGIN` - Frontend URLs for CORS

### Secrets (Backend)
- `JWT_SECRET` - For authentication tokens
- `GOOGLE_MAPS_API_KEY` - For maps functionality
- `SESSION_SECRET` - For session management

### Environment Variables (Frontend)
- `VITE_API_BASE_URL` - Cloud Run service URL
- `VITE_FIREBASE_*` - Firebase configuration

## Security Considerations

1. **Service Account**: Uses minimal required permissions
2. **Secrets**: Stored in Google Cloud Secret Manager
3. **CORS**: Configured to allow only your frontend domains
4. **HTTPS**: Enforced on both Cloud Run and Firebase Hosting
5. **Authentication**: Firebase Auth integration
6. **Rate Limiting**: Configured in the backend application

## Monitoring and Logging

```bash
# View Cloud Run logs
gcloud run services logs read pathfinder-api --region=asia-south1

# View Firebase Hosting logs
firebase hosting:logs

# Set up monitoring
gcloud alpha monitoring dashboards create --config-from-file=monitoring-dashboard.json
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Check `CORS_ORIGIN` environment variable
2. **404 on API calls**: Verify Firebase hosting rewrites configuration
3. **Authentication failures**: Check Firebase project configuration
4. **Build failures**: Ensure all dependencies are installed

### Debug Commands

```bash
# Check Cloud Run service status
gcloud run services describe pathfinder-api --region=asia-south1

# Check Firebase hosting status
firebase hosting:sites:list

# Test local build
npm run build
npm start
```

## Cost Optimization

- **Cloud Run**: Pay per request, automatic scaling to zero
- **Firebase Hosting**: Free tier for most applications
- **Artifact Registry**: Storage costs for Docker images
- **Secret Manager**: Minimal costs for secret operations

Estimated monthly cost for moderate usage: $10-50 USD