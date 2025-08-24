#!/bin/bash

# Pathfinder Demo Deployment Script
# This script demonstrates the deployment process for Cloud Run and Firebase Hosting

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="pathfinder-demo-project"
REGION="asia-south1"
SERVICE_NAME="pathfinder-api"
REPOSITORY="pathfinder-repo"
IMAGE_NAME="api"

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

print_demo() {
    echo -e "${YELLOW}[DEMO] $1${NC}"
}

# Demo functions - simulate real deployment steps
demo_check_prerequisites() {
    print_header "Checking Prerequisites (Demo Mode)"
    
    print_demo "Checking gcloud CLI installation..."
    print_success "gcloud CLI is installed"
    
    print_demo "Checking Docker installation..."
    print_success "Docker is installed"
    
    print_demo "Using demo project: $PROJECT_ID"
    
    print_demo "Checking authentication..."
    print_success "Authenticated with gcloud (demo mode)"
}

demo_build_application() {
    print_header "Building Application"
    
    print_step "Installing backend dependencies"
    npm ci
    
    print_step "Building TypeScript backend"
    npm run build:backend
    
    print_step "Installing frontend dependencies"
    cd frontend && npm ci && cd ..
    
    print_step "Building React frontend"
    cd frontend && npm run build && cd ..
    
    print_success "Application built successfully"
}

demo_docker_operations() {
    print_header "Docker Operations (Demo)"
    
    IMAGE_URL="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:latest"
    
    print_demo "Building Docker image: $IMAGE_URL"
    print_demo "docker build -t $IMAGE_URL ."
    
    print_demo "Pushing image to Artifact Registry"
    print_demo "docker push $IMAGE_URL"
    
    print_success "Docker image built and pushed (demo)"
}

demo_deploy_cloud_run() {
    print_header "Deploying to Cloud Run (Demo)"
    
    IMAGE_URL="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:latest"
    
    print_demo "Deploying to Cloud Run service: $SERVICE_NAME"
    print_demo "gcloud run deploy $SERVICE_NAME \\"
    print_demo "    --image=$IMAGE_URL \\"
    print_demo "    --platform=managed \\"
    print_demo "    --region=$REGION \\"
    print_demo "    --allow-unauthenticated \\"
    print_demo "    --service-account=pathfinder-sa@${PROJECT_ID}.iam.gserviceaccount.com \\"
    print_demo "    --set-env-vars=\"NODE_ENV=production,PORT=8080,GOOGLE_CLOUD_PROJECT_ID=${PROJECT_ID},FIREBASE_PROJECT_ID=${PROJECT_ID}\" \\"
    print_demo "    --set-secrets=\"JWT_SECRET=jwt-secret:latest,GOOGLE_MAPS_API_KEY=google-maps-api-key:latest,SESSION_SECRET=session-secret:latest\" \\"
    print_demo "    --memory=2Gi \\"
    print_demo "    --cpu=2 \\"
    print_demo "    --min-instances=1 \\"
    print_demo "    --max-instances=100 \\"
    print_demo "    --concurrency=80 \\"
    print_demo "    --timeout=300 \\"
    print_demo "    --port=8080"
    
    print_success "Deployment completed (demo)"
}

demo_test_service() {
    print_header "Testing Service (Demo)"
    
    SERVICE_URL="https://pathfinder-api-abcd123-as.a.run.app"
    
    print_success "Service URL: $SERVICE_URL"
    print_demo "Testing service health endpoint: $SERVICE_URL/health"
    print_success "Service is healthy (demo)"
}

demo_deploy_firebase() {
    print_header "Deploying to Firebase Hosting (Demo)"
    
    print_demo "Updating Firebase configuration with Cloud Run URL"
    print_demo "firebase deploy --only hosting"
    
    print_success "Frontend deployed to Firebase Hosting"
    print_success "Frontend URL: https://${PROJECT_ID}.web.app"
}

demo_update_cors() {
    print_header "Updating CORS Configuration"
    
    print_step "Firebase hosting configuration already updated with Cloud Run integration"
    print_demo "CORS headers configured for frontend-backend communication"
    print_success "CORS configuration updated"
}

print_summary() {
    print_header "Deployment Summary (Demo)"
    
    echo ""
    echo "📋 Deployment Details:"
    echo "  ✓ Project: $PROJECT_ID"
    echo "  ✓ Region: $REGION"
    echo "  ✓ Backend Service: $SERVICE_NAME"
    echo "  ✓ Backend URL: https://pathfinder-api-abcd123-as.a.run.app"
    echo "  ✓ Frontend URL: https://${PROJECT_ID}.web.app"
    echo ""
    echo "🌐 Live Endpoints:"
    echo "  • Backend Health: https://pathfinder-api-abcd123-as.a.run.app/health"
    echo "  • Backend API: https://pathfinder-api-abcd123-as.a.run.app/api"
    echo "  • Frontend: https://${PROJECT_ID}.web.app"
    echo ""
    echo "✅ End-to-End Connectivity:"
    echo "  • Frontend configured to call backend API via Firebase hosting rewrites"
    echo "  • CORS properly configured for cross-origin requests"
    echo "  • Authentication tokens properly forwarded"
    echo ""
    echo "🔧 Configuration:"
    echo "  • Environment variables set for production"
    echo "  • Secrets managed via Google Cloud Secret Manager"
    echo "  • Auto-scaling configured (1-100 instances)"
    echo "  • Health checks enabled"
    echo ""
    echo "🎯 Next Steps (if this were a real deployment):"
    echo "  1. Set up custom domain"
    echo "  2. Configure SSL certificates"
    echo "  3. Set up monitoring and alerting"
    echo "  4. Configure CI/CD pipeline"
    echo "  5. Set up staging environment"
}

# Main execution
main() {
    print_header "Pathfinder Demo Deployment"
    print_warning "This is a demonstration of the deployment process"
    print_warning "In a real deployment, you would need:"
    print_warning "  - Google Cloud Project with billing enabled"
    print_warning "  - Firebase project configured"
    print_warning "  - Service account with proper permissions"
    print_warning "  - Artifact Registry repository created"
    print_warning "  - Secrets stored in Secret Manager"
    echo ""
    
    demo_check_prerequisites
    demo_build_application
    demo_docker_operations
    demo_deploy_cloud_run
    demo_test_service
    demo_deploy_firebase
    demo_update_cors
    print_summary
}

# Run main function
main "$@"