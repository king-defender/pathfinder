#!/bin/bash

# Pathfinder Cloud Run Deployment Script
# This script builds and deploys the application to Google Cloud Run

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=""
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

check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed"
        exit 1
    fi
    print_success "gcloud CLI is installed"
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    print_success "Docker is installed"
    
    # Get project ID
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
    if [ -z "$PROJECT_ID" ]; then
        print_error "No Google Cloud project set"
        exit 1
    fi
    print_success "Using project: $PROJECT_ID"
    
    # Check if authenticated
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n 1 > /dev/null; then
        print_error "Not authenticated with gcloud"
        exit 1
    fi
    print_success "Authenticated with gcloud"
}

build_application() {
    print_header "Building Application"
    
    print_step "Installing dependencies"
    npm ci
    
    print_step "Building TypeScript"
    npm run build
    
    print_success "Application built successfully"
}

build_docker_image() {
    print_header "Building Docker Image"
    
    # Full image name
    IMAGE_URL="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:latest"
    
    print_step "Building Docker image: $IMAGE_URL"
    docker build -t $IMAGE_URL .
    
    print_step "Pushing image to Artifact Registry"
    docker push $IMAGE_URL
    
    print_success "Docker image built and pushed"
}

deploy_to_cloud_run() {
    print_header "Deploying to Cloud Run"
    
    IMAGE_URL="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:latest"
    
    print_step "Deploying to Cloud Run service: $SERVICE_NAME"
    
    gcloud run deploy $SERVICE_NAME \
        --image=$IMAGE_URL \
        --platform=managed \
        --region=$REGION \
        --allow-unauthenticated \
        --service-account=pathfinder-sa@${PROJECT_ID}.iam.gserviceaccount.com \
        --set-env-vars="NODE_ENV=production,PORT=8080,GOOGLE_CLOUD_PROJECT_ID=${PROJECT_ID},FIREBASE_PROJECT_ID=${PROJECT_ID}" \
        --set-secrets="JWT_SECRET=jwt-secret:latest,GOOGLE_MAPS_API_KEY=google-maps-api-key:latest,SESSION_SECRET=session-secret:latest" \
        --memory=2Gi \
        --cpu=2 \
        --min-instances=1 \
        --max-instances=100 \
        --concurrency=80 \
        --timeout=300 \
        --port=8080
    
    print_success "Deployment completed"
}

get_service_info() {
    print_header "Service Information"
    
    # Get service URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
    
    if [ -n "$SERVICE_URL" ]; then
        print_success "Service URL: $SERVICE_URL"
        
        # Test the service
        print_step "Testing service health"
        if curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/health" | grep -q "200"; then
            print_success "Service is healthy"
        else
            print_warning "Service may not be responding correctly"
        fi
    else
        print_error "Could not get service URL"
    fi
}

update_cors_configuration() {
    print_header "Updating CORS Configuration"
    
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
    
    if [ -n "$SERVICE_URL" ]; then
        print_step "Updating Firebase hosting configuration with API URL"
        
        # Update firebase.json to include the Cloud Run URL
        TEMP_FILE=$(mktemp)
        jq --arg url "$SERVICE_URL" '
            .hosting.rewrites[0].run = {
                "serviceId": "pathfinder-api",
                "region": "asia-south1"
            } |
            .hosting.headers += [{
                "source": "/api/**",
                "headers": [{
                    "key": "Access-Control-Allow-Origin",
                    "value": "*"
                }, {
                    "key": "Access-Control-Allow-Methods",
                    "value": "GET,POST,PUT,DELETE,OPTIONS"
                }, {
                    "key": "Access-Control-Allow-Headers",
                    "value": "Content-Type,Authorization"
                }]
            }]
        ' firebase.json > "$TEMP_FILE" && mv "$TEMP_FILE" firebase.json
        
        print_success "Firebase configuration updated"
    fi
}

print_summary() {
    print_header "Deployment Summary"
    
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)" 2>/dev/null)
    
    echo ""
    echo "📋 Deployment Details:"
    echo "  ✓ Project: $PROJECT_ID"
    echo "  ✓ Region: $REGION"
    echo "  ✓ Service: $SERVICE_NAME"
    echo "  ✓ Image: ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:latest"
    
    if [ -n "$SERVICE_URL" ]; then
        echo "  ✓ URL: $SERVICE_URL"
    fi
    
    echo ""
    echo "🔧 Useful Commands:"
    echo "  • View logs: gcloud run services logs read $SERVICE_NAME --region=$REGION"
    echo "  • Get service info: gcloud run services describe $SERVICE_NAME --region=$REGION"
    echo "  • Update service: gcloud run services update $SERVICE_NAME --region=$REGION"
    echo ""
    echo "🌐 Test Endpoints:"
    if [ -n "$SERVICE_URL" ]; then
        echo "  • Health check: $SERVICE_URL/health"
        echo "  • API docs: $SERVICE_URL/api/docs"
    fi
    echo ""
    echo "📚 Next Steps:"
    echo "  1. Update frontend API endpoints to use the new service URL"
    echo "  2. Test all application endpoints"
    echo "  3. Configure custom domain (if needed)"
    echo "  4. Set up monitoring and alerting"
}

# Main execution
main() {
    print_header "Pathfinder Cloud Run Deployment"
    
    check_prerequisites
    build_application
    build_docker_image
    deploy_to_cloud_run
    get_service_info
    update_cors_configuration
    print_summary
}

# Check for command line options
while [[ $# -gt 0 ]]; do
    case $1 in
        --build-only)
            check_prerequisites
            build_application
            build_docker_image
            exit 0
            ;;
        --deploy-only)
            check_prerequisites
            deploy_to_cloud_run
            get_service_info
            print_summary
            exit 0
            ;;
        --info)
            check_prerequisites
            get_service_info
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Usage: $0 [--build-only|--deploy-only|--info]"
            exit 1
            ;;
    esac
done

# Run main function
main "$@"