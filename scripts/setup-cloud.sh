#!/bin/bash

# Pathfinder Google Cloud Setup Script
# This script sets up Google Cloud Platform resources for the Pathfinder application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEFAULT_PROJECT_ID="pathfinder-app"
DEFAULT_REGION="asia-south1"
DEFAULT_ZONE="asia-south1-a"
SERVICE_ACCOUNT_NAME="pathfinder-sa"

# Functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_step() {
    echo -e "${GREEN}➤ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ WARNING: $1${NC}"
}

print_error() {
    echo -e "${RED}✗ ERROR: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed. Please install it first."
        exit 1
    fi
    print_success "gcloud CLI is installed"
    
    # Check if user is authenticated
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n 1 > /dev/null; then
        print_error "You are not authenticated with gcloud. Please run 'gcloud auth login' first."
        exit 1
    fi
    print_success "Authenticated with gcloud"
}

get_project_config() {
    print_header "Project Configuration"
    
    echo -n "Enter project ID (default: $DEFAULT_PROJECT_ID): "
    read PROJECT_ID
    PROJECT_ID=${PROJECT_ID:-$DEFAULT_PROJECT_ID}
    
    echo -n "Enter region (default: $DEFAULT_REGION): "
    read REGION
    REGION=${REGION:-$DEFAULT_REGION}
    
    echo -n "Enter zone (default: $DEFAULT_ZONE): "
    read ZONE
    ZONE=${ZONE:-$DEFAULT_ZONE}
    
    echo ""
    echo "Configuration:"
    echo "  Project ID: $PROJECT_ID"
    echo "  Region: $REGION"
    echo "  Zone: $ZONE"
    echo ""
    
    echo -n "Continue with this configuration? (y/N): "
    read CONFIRM
    if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
}

setup_project() {
    print_header "Setting up Google Cloud Project"
    
    # Check if project exists
    if gcloud projects describe $PROJECT_ID &> /dev/null; then
        print_success "Project $PROJECT_ID already exists"
    else
        print_step "Creating project $PROJECT_ID"
        gcloud projects create $PROJECT_ID --name="Pathfinder Application"
        print_success "Project created"
    fi
    
    # Set as default project
    print_step "Setting project as default"
    gcloud config set project $PROJECT_ID
    
    # Set region and zone
    print_step "Setting default region and zone"
    gcloud config set compute/region $REGION
    gcloud config set compute/zone $ZONE
    
    # Check billing account
    BILLING_ACCOUNTS=$(gcloud billing accounts list --filter="open:true" --format="value(name)" | head -n 1)
    if [ -z "$BILLING_ACCOUNTS" ]; then
        print_warning "No active billing accounts found. Please enable billing manually in the console."
    else
        print_step "Linking billing account"
        gcloud billing projects link $PROJECT_ID --billing-account=$BILLING_ACCOUNTS
        print_success "Billing account linked"
    fi
}

enable_apis() {
    print_header "Enabling Required APIs"
    
    APIS=(
        "firebase.googleapis.com"
        "firebasehosting.googleapis.com"
        "firebasestorage.googleapis.com"
        "firestore.googleapis.com"
        "firebaserules.googleapis.com"
        "run.googleapis.com"
        "cloudbuild.googleapis.com"
        "containerregistry.googleapis.com"
        "artifactregistry.googleapis.com"
        "identitytoolkit.googleapis.com"
        "iam.googleapis.com"
        "iamcredentials.googleapis.com"
        "logging.googleapis.com"
        "monitoring.googleapis.com"
        "cloudtrace.googleapis.com"
        "maps-backend.googleapis.com"
        "geocoding-backend.googleapis.com"
        "aiplatform.googleapis.com"
        "secretmanager.googleapis.com"
        "cloudfunctions.googleapis.com"
        "cloudscheduler.googleapis.com"
    )
    
    for API in "${APIS[@]}"; do
        print_step "Enabling $API"
        gcloud services enable $API
    done
    
    print_success "All APIs enabled"
}

create_service_account() {
    print_header "Setting up Service Account"
    
    # Create service account
    if gcloud iam service-accounts describe ${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com &> /dev/null; then
        print_success "Service account $SERVICE_ACCOUNT_NAME already exists"
    else
        print_step "Creating service account"
        gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
            --display-name="Pathfinder Service Account" \
            --description="Service account for Pathfinder application"
        print_success "Service account created"
    fi
    
    # Assign roles
    print_step "Assigning roles to service account"
    
    ROLES=(
        "roles/firebase.admin"
        "roles/datastore.user"
        "roles/run.developer"
        "roles/storage.admin"
        "roles/secretmanager.secretAccessor"
        "roles/monitoring.editor"
        "roles/logging.logWriter"
        "roles/cloudsql.client"
        "roles/artifactregistry.reader"
    )
    
    for ROLE in "${ROLES[@]}"; do
        print_step "Assigning role: $ROLE"
        gcloud projects add-iam-policy-binding $PROJECT_ID \
            --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
            --role="$ROLE"
    done
    
    # Generate service account key
    print_step "Generating service account key"
    gcloud iam service-accounts keys create ${SERVICE_ACCOUNT_NAME}-key.json \
        --iam-account=${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com
    
    print_success "Service account key saved as ${SERVICE_ACCOUNT_NAME}-key.json"
    print_warning "Keep this key file secure and add it to your .gitignore"
}

setup_firestore() {
    print_header "Setting up Firestore Database"
    
    print_step "Creating Firestore database in $REGION"
    if gcloud firestore databases create --region=$REGION --type=firestore-native 2>/dev/null; then
        print_success "Firestore database created"
    else
        print_warning "Firestore database may already exist or there was an issue creating it"
    fi
}

setup_storage() {
    print_header "Setting up Cloud Storage"
    
    BUCKETS=(
        "${PROJECT_ID}-storage"
        "${PROJECT_ID}-backups"
        "${PROJECT_ID}-static"
    )
    
    for BUCKET in "${BUCKETS[@]}"; do
        print_step "Creating bucket: $BUCKET"
        if gsutil mb -l $REGION gs://$BUCKET 2>/dev/null; then
            print_success "Bucket $BUCKET created"
        else
            print_warning "Bucket $BUCKET may already exist"
        fi
        
        # Set service account permissions
        print_step "Setting permissions on bucket: $BUCKET"
        gsutil iam ch serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com:objectAdmin gs://$BUCKET
    done
}

setup_artifact_registry() {
    print_header "Setting up Artifact Registry"
    
    print_step "Creating Docker repository"
    if gcloud artifacts repositories create pathfinder-repo \
        --repository-format=docker \
        --location=$REGION \
        --description="Pathfinder application container images" 2>/dev/null; then
        print_success "Artifact Registry repository created"
    else
        print_warning "Repository may already exist"
    fi
    
    print_step "Configuring Docker authentication"
    gcloud auth configure-docker ${REGION}-docker.pkg.dev
}

setup_secrets() {
    print_header "Setting up Secret Manager"
    
    print_step "Creating placeholder secrets"
    
    # Create placeholder secrets (user will need to update these)
    SECRETS=(
        "jwt-secret"
        "google-maps-api-key"
        "session-secret"
    )
    
    for SECRET in "${SECRETS[@]}"; do
        print_step "Creating secret: $SECRET"
        if echo -n "REPLACE_WITH_ACTUAL_VALUE" | gcloud secrets create $SECRET --data-file=- 2>/dev/null; then
            print_success "Secret $SECRET created"
        else
            print_warning "Secret $SECRET may already exist"
        fi
        
        # Grant access to service account
        gcloud secrets add-iam-policy-binding $SECRET \
            --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
            --role="roles/secretmanager.secretAccessor"
    done
    
    print_warning "Remember to update the secret values with actual data!"
}

create_env_file() {
    print_header "Creating Environment Configuration"
    
    ENV_FILE=".env.production"
    print_step "Creating $ENV_FILE"
    
    cat > $ENV_FILE << EOF
# Production Environment Configuration
# Generated by setup script on $(date)

# Server Configuration
NODE_ENV=production
PORT=8080
HOST=0.0.0.0

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=$PROJECT_ID
GOOGLE_APPLICATION_CREDENTIALS=./${SERVICE_ACCOUNT_NAME}-key.json

# Firebase Configuration
FIREBASE_PROJECT_ID=$PROJECT_ID
FIREBASE_DATABASE_URL=https://$PROJECT_ID-default-rtdb.${REGION}.firebasedatabase.app/

# Database Configuration
DATABASE_URL=projects/$PROJECT_ID/databases/(default)

# Storage Configuration
STORAGE_BUCKET=${PROJECT_ID}-storage

# Secrets (managed by Secret Manager)
JWT_SECRET=projects/$PROJECT_ID/secrets/jwt-secret/versions/latest
GOOGLE_MAPS_API_KEY=projects/$PROJECT_ID/secrets/google-maps-api-key/versions/latest
SESSION_SECRET=projects/$PROJECT_ID/secrets/session-secret/versions/latest

# Monitoring
LOG_LEVEL=info
ENABLE_ANALYTICS=true
ENABLE_CACHING=true
ENABLE_RATE_LIMITING=true

# Security
CORS_ORIGIN=https://$PROJECT_ID.web.app
RATE_LIMIT_MAX_REQUESTS=1000
EOF
    
    print_success "Environment file created: $ENV_FILE"
}

print_summary() {
    print_header "Setup Complete!"
    
    echo ""
    echo "📋 Summary:"
    echo "  ✓ Project: $PROJECT_ID"
    echo "  ✓ Region: $REGION"
    echo "  ✓ Service Account: ${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
    echo "  ✓ Key File: ${SERVICE_ACCOUNT_NAME}-key.json"
    echo "  ✓ Environment File: .env.production"
    echo ""
    echo "🔧 Next Steps:"
    echo "  1. Update secret values in Secret Manager"
    echo "  2. Run Firebase setup: npm run setup:firebase"
    echo "  3. Deploy Firestore rules: firebase deploy --only firestore"
    echo "  4. Test the setup: npm run verify:setup"
    echo ""
    echo "📚 Documentation:"
    echo "  • Cloud Setup: docs/cloud-setup.md"
    echo "  • Firebase Setup: docs/firebase-setup.md"
    echo ""
    print_warning "Remember to add ${SERVICE_ACCOUNT_NAME}-key.json to .gitignore!"
}

# Main execution
main() {
    print_header "Pathfinder Cloud Setup"
    
    check_prerequisites
    get_project_config
    setup_project
    enable_apis
    create_service_account
    setup_firestore
    setup_storage
    setup_artifact_registry
    setup_secrets
    create_env_file
    print_summary
}

# Run main function
main "$@"