# Google Cloud Platform Setup Guide

This document provides step-by-step instructions for setting up Google Cloud Platform (GCP) resources for the Pathfinder application in the `asia-south1` region.

## Prerequisites

- Google Cloud account with billing enabled
- `gcloud` CLI installed and configured
- Project owner or editor permissions

## 1. Project Setup

### Create or Select Project

```bash
# Create a new project (replace with your desired project ID)
gcloud projects create pathfinder-app --name="Pathfinder Application"

# Set the project as default
gcloud config set project pathfinder-app

# Enable billing (replace BILLING_ACCOUNT_ID with your billing account)
gcloud billing projects link pathfinder-app --billing-account=BILLING_ACCOUNT_ID
```

### Set Default Region

```bash
# Set default region to asia-south1 (Mumbai, India)
gcloud config set compute/region asia-south1
gcloud config set compute/zone asia-south1-a
```

## 2. Enable Required APIs

Enable all the necessary Google Cloud APIs for the Pathfinder application:

```bash
# Enable Firebase APIs
gcloud services enable firebase.googleapis.com
gcloud services enable firebasehosting.googleapis.com
gcloud services enable firebasestorage.googleapis.com

# Enable Firestore and related APIs
gcloud services enable firestore.googleapis.com
gcloud services enable firebaserules.googleapis.com

# Enable Cloud Run and Container APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# Enable Authentication and IAM
gcloud services enable identitytoolkit.googleapis.com
gcloud services enable iam.googleapis.com
gcloud services enable iamcredentials.googleapis.com

# Enable Monitoring and Logging
gcloud services enable logging.googleapis.com
gcloud services enable monitoring.googleapis.com
gcloud services enable cloudtrace.googleapis.com

# Enable Maps and AI APIs
gcloud services enable maps-backend.googleapis.com
gcloud services enable geocoding-backend.googleapis.com
gcloud services enable aiplatform.googleapis.com

# Enable Additional APIs for production
gcloud services enable secretmanager.googleapis.com
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudscheduler.googleapis.com
```

## 3. Service Account Setup

### Create Service Account

```bash
# Create the pathfinder service account
gcloud iam service-accounts create pathfinder-sa \
    --display-name="Pathfinder Service Account" \
    --description="Service account for Pathfinder application"
```

### Assign Required Roles

```bash
# Get the project ID
PROJECT_ID=$(gcloud config get-value project)

# Assign Firebase Admin role
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:pathfinder-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/firebase.admin"

# Assign Firestore access
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:pathfinder-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/datastore.user"

# Assign Cloud Run access
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:pathfinder-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/run.developer"

# Assign Storage access
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:pathfinder-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

# Assign Secret Manager access
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:pathfinder-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

# Assign monitoring access
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:pathfinder-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/monitoring.editor"

# Assign logging access
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:pathfinder-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/logging.logWriter"
```

### Generate Service Account Key

```bash
# Create and download service account key
gcloud iam service-accounts keys create pathfinder-sa-key.json \
    --iam-account=pathfinder-sa@$PROJECT_ID.iam.gserviceaccount.com

# Set the environment variable for local development
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/pathfinder-sa-key.json"
```

## 4. Firestore Database Setup

### Create Firestore Database

```bash
# Create Firestore database in asia-south1 region
gcloud firestore databases create \
    --region=asia-south1 \
    --type=firestore-native
```

### Verify Database Creation

```bash
# Check database status
gcloud firestore operations list
```

## 5. Cloud Storage Setup

### Create Storage Buckets

```bash
# Create main storage bucket
gsutil mb -l asia-south1 gs://$PROJECT_ID-storage

# Create backup bucket
gsutil mb -l asia-south1 gs://$PROJECT_ID-backups

# Create static assets bucket
gsutil mb -l asia-south1 gs://$PROJECT_ID-static
```

### Set Bucket Permissions

```bash
# Set service account permissions on storage buckets
gsutil iam ch serviceAccount:pathfinder-sa@$PROJECT_ID.iam.gserviceaccount.com:objectAdmin gs://$PROJECT_ID-storage
gsutil iam ch serviceAccount:pathfinder-sa@$PROJECT_ID.iam.gserviceaccount.com:objectAdmin gs://$PROJECT_ID-backups
gsutil iam ch serviceAccount:pathfinder-sa@$PROJECT_ID.iam.gserviceaccount.com:objectAdmin gs://$PROJECT_ID-static
```

## 6. Secret Manager Setup

### Store Application Secrets

```bash
# Store JWT secret
echo -n "your-secure-jwt-secret-key" | gcloud secrets create jwt-secret --data-file=-

# Store Google Maps API key
echo -n "your-google-maps-api-key" | gcloud secrets create google-maps-api-key --data-file=-

# Store session secret
echo -n "your-session-secret" | gcloud secrets create session-secret --data-file=-

# Grant access to secrets for the service account
gcloud secrets add-iam-policy-binding jwt-secret \
    --member="serviceAccount:pathfinder-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding google-maps-api-key \
    --member="serviceAccount:pathfinder-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding session-secret \
    --member="serviceAccount:pathfinder-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

## 7. Artifact Registry Setup

### Create Docker Repository

```bash
# Create repository for container images
gcloud artifacts repositories create pathfinder-repo \
    --repository-format=docker \
    --location=asia-south1 \
    --description="Pathfinder application container images"

# Configure Docker authentication
gcloud auth configure-docker asia-south1-docker.pkg.dev
```

## 8. VPC and Networking (Optional for advanced setup)

### Create VPC Network

```bash
# Create custom VPC network
gcloud compute networks create pathfinder-vpc \
    --subnet-mode=custom \
    --description="Pathfinder application VPC"

# Create subnet in asia-south1
gcloud compute networks subnets create pathfinder-subnet \
    --network=pathfinder-vpc \
    --range=10.0.0.0/24 \
    --region=asia-south1
```

## 9. Verification Script

Create a verification script to check all resources are properly set up:

```bash
#!/bin/bash
# Run the verification script
./scripts/verify-cloud-setup.sh
```

## Environment Variables

After completing the setup, configure your environment variables:

```bash
# Required environment variables for production
export GOOGLE_CLOUD_PROJECT_ID="pathfinder-app"
export GOOGLE_APPLICATION_CREDENTIALS="./pathfinder-sa-key.json"
export FIREBASE_PROJECT_ID="pathfinder-app"
export FIRESTORE_DATABASE_ID="(default)"
```

## Next Steps

1. Run the Firebase setup (see `firebase-setup.md`)
2. Deploy Firestore rules and indexes
3. Set up monitoring and alerting
4. Configure CI/CD pipeline
5. Test the entire setup with the verification script

## Troubleshooting

### Common Issues

1. **Billing not enabled**: Ensure billing is enabled for the project
2. **API not enabled**: Double-check all required APIs are enabled
3. **Permissions issues**: Verify service account has all required roles
4. **Region issues**: Ensure all resources are created in asia-south1

### Support Resources

- [Google Cloud Documentation](https://cloud.google.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [GCP Console](https://console.cloud.google.com)