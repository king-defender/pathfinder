#!/bin/bash

# Pathfinder Setup Verification Script
# This script verifies that Google Cloud and Firebase resources are properly configured

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=""
SERVICE_ACCOUNT_NAME="pathfinder-sa"
REQUIRED_REGION="asia-south1"

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
TOTAL_CHECKS=0

# Functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_check() {
    echo -n "  Checking $1... "
    ((TOTAL_CHECKS++))
}

print_pass() {
    echo -e "${GREEN}✓ PASS${NC}"
    ((CHECKS_PASSED++))
}

print_fail() {
    echo -e "${RED}✗ FAIL${NC} - $1"
    ((CHECKS_FAILED++))
}

print_warning() {
    echo -e "${YELLOW}⚠ WARNING: $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ INFO: $1${NC}"
}

get_project_id() {
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
    if [ -z "$PROJECT_ID" ]; then
        print_fail "No default project set"
        exit 1
    fi
    print_info "Verifying project: $PROJECT_ID"
}

verify_prerequisites() {
    print_header "Verifying Prerequisites"
    
    # Check gcloud CLI
    print_check "gcloud CLI installation"
    if command -v gcloud &> /dev/null; then
        print_pass
    else
        print_fail "gcloud CLI not found"
        return 1
    fi
    
    # Check authentication
    print_check "gcloud authentication"
    if gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n 1 > /dev/null; then
        print_pass
    else
        print_fail "Not authenticated with gcloud"
        return 1
    fi
    
    # Check Firebase CLI
    print_check "Firebase CLI installation"
    if command -v firebase &> /dev/null; then
        print_pass
    else
        print_fail "Firebase CLI not found"
    fi
    
    # Check Node.js
    print_check "Node.js installation"
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_pass
        print_info "Node.js version: $NODE_VERSION"
    else
        print_fail "Node.js not found"
    fi
}

verify_project_config() {
    print_header "Verifying Project Configuration"
    
    # Check project exists
    print_check "project existence"
    if gcloud projects describe $PROJECT_ID &> /dev/null; then
        print_pass
    else
        print_fail "Project $PROJECT_ID does not exist"
        return 1
    fi
    
    # Check billing
    print_check "billing status"
    BILLING_ACCOUNT=$(gcloud billing projects describe $PROJECT_ID --format="value(billingAccountName)" 2>/dev/null)
    if [ -n "$BILLING_ACCOUNT" ]; then
        print_pass
        print_info "Billing account: $BILLING_ACCOUNT"
    else
        print_fail "Billing not enabled"
    fi
    
    # Check default region
    print_check "default region configuration"
    DEFAULT_REGION=$(gcloud config get-value compute/region 2>/dev/null)
    if [ "$DEFAULT_REGION" = "$REQUIRED_REGION" ]; then
        print_pass
    else
        print_fail "Default region is $DEFAULT_REGION, should be $REQUIRED_REGION"
    fi
}

verify_apis() {
    print_header "Verifying API Enablement"
    
    REQUIRED_APIS=(
        "firebase.googleapis.com"
        "firestore.googleapis.com"
        "run.googleapis.com"
        "cloudbuild.googleapis.com"
        "iam.googleapis.com"
        "secretmanager.googleapis.com"
        "artifactregistry.googleapis.com"
        "logging.googleapis.com"
        "monitoring.googleapis.com"
    )
    
    for API in "${REQUIRED_APIS[@]}"; do
        print_check "$API"
        if gcloud services list --enabled --filter="name:$API" --format="value(name)" | grep -q "$API"; then
            print_pass
        else
            print_fail "API not enabled"
        fi
    done
}

verify_service_account() {
    print_header "Verifying Service Account"
    
    SA_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
    
    # Check service account exists
    print_check "service account existence"
    if gcloud iam service-accounts describe $SA_EMAIL &> /dev/null; then
        print_pass
    else
        print_fail "Service account $SA_EMAIL does not exist"
        return 1
    fi
    
    # Check key file exists
    print_check "service account key file"
    if [ -f "${SERVICE_ACCOUNT_NAME}-key.json" ]; then
        print_pass
    else
        print_fail "Key file ${SERVICE_ACCOUNT_NAME}-key.json not found"
    fi
    
    # Check required roles
    print_check "service account roles"
    ROLES_OUTPUT=$(gcloud projects get-iam-policy $PROJECT_ID --flatten="bindings[].members" --format="table(bindings.role)" --filter="bindings.members:$SA_EMAIL")
    
    REQUIRED_ROLES=(
        "roles/firebase.admin"
        "roles/datastore.user"
        "roles/secretmanager.secretAccessor"
    )
    
    ROLES_OK=true
    for ROLE in "${REQUIRED_ROLES[@]}"; do
        if echo "$ROLES_OUTPUT" | grep -q "$ROLE"; then
            continue
        else
            ROLES_OK=false
            break
        fi
    done
    
    if $ROLES_OK; then
        print_pass
    else
        print_fail "Missing required roles"
    fi
}

verify_firestore() {
    print_header "Verifying Firestore Database"
    
    # Check database exists
    print_check "Firestore database"
    if gcloud firestore databases list --format="value(name)" | grep -q "(default)"; then
        print_pass
    else
        print_fail "Firestore database not found"
        return 1
    fi
    
    # Check database location
    print_check "database location"
    DB_LOCATION=$(gcloud firestore databases describe --format="value(locationId)" 2>/dev/null)
    if [ "$DB_LOCATION" = "$REQUIRED_REGION" ]; then
        print_pass
    else
        print_fail "Database in $DB_LOCATION, should be in $REQUIRED_REGION"
    fi
    
    # Check rules file exists
    print_check "Firestore rules file"
    if [ -f "firestore.rules" ]; then
        print_pass
    else
        print_fail "firestore.rules file not found"
    fi
    
    # Check indexes file exists
    print_check "Firestore indexes file"
    if [ -f "firestore.indexes.json" ]; then
        print_pass
    else
        print_fail "firestore.indexes.json file not found"
    fi
}

verify_storage() {
    print_header "Verifying Cloud Storage"
    
    EXPECTED_BUCKETS=(
        "${PROJECT_ID}-storage"
        "${PROJECT_ID}-backups"
        "${PROJECT_ID}-static"
    )
    
    for BUCKET in "${EXPECTED_BUCKETS[@]}"; do
        print_check "bucket $BUCKET"
        if gsutil ls gs://$BUCKET &> /dev/null; then
            print_pass
        else
            print_fail "Bucket does not exist"
        fi
    done
    
    # Check storage rules file
    print_check "Storage rules file"
    if [ -f "storage.rules" ]; then
        print_pass
    else
        print_fail "storage.rules file not found"
    fi
}

verify_secrets() {
    print_header "Verifying Secret Manager"
    
    EXPECTED_SECRETS=(
        "jwt-secret"
        "google-maps-api-key"
        "session-secret"
    )
    
    for SECRET in "${EXPECTED_SECRETS[@]}"; do
        print_check "secret $SECRET"
        if gcloud secrets describe $SECRET &> /dev/null; then
            print_pass
        else
            print_fail "Secret does not exist"
        fi
    done
}

verify_artifact_registry() {
    print_header "Verifying Artifact Registry"
    
    print_check "Docker repository"
    if gcloud artifacts repositories describe pathfinder-repo --location=$REQUIRED_REGION &> /dev/null; then
        print_pass
    else
        print_fail "Artifact Registry repository not found"
    fi
}

verify_firebase_config() {
    print_header "Verifying Firebase Configuration"
    
    # Check .firebaserc
    print_check ".firebaserc configuration"
    if [ -f ".firebaserc" ]; then
        if grep -q "$PROJECT_ID" .firebaserc; then
            print_pass
        else
            print_fail "Project ID not found in .firebaserc"
        fi
    else
        print_fail ".firebaserc file not found"
    fi
    
    # Check firebase.json
    print_check "firebase.json configuration"
    if [ -f "firebase.json" ]; then
        print_pass
    else
        print_fail "firebase.json file not found"
    fi
    
    # Check Firebase project status
    print_check "Firebase project connection"
    if firebase projects:list 2>/dev/null | grep -q "$PROJECT_ID"; then
        print_pass
    else
        print_fail "Firebase project not accessible"
    fi
}

verify_environment_files() {
    print_header "Verifying Environment Configuration"
    
    ENV_FILES=(
        ".env.example"
        ".env.production"
    )
    
    for ENV_FILE in "${ENV_FILES[@]}"; do
        print_check "$ENV_FILE"
        if [ -f "$ENV_FILE" ]; then
            print_pass
        else
            print_fail "File not found"
        fi
    done
    
    # Check for sensitive files in git
    print_check ".gitignore configuration"
    if [ -f ".gitignore" ]; then
        if grep -q "pathfinder-sa-key.json" .gitignore && grep -q ".env.production" .gitignore; then
            print_pass
        else
            print_fail "Sensitive files not ignored"
        fi
    else
        print_fail ".gitignore file not found"
    fi
}

test_connections() {
    print_header "Testing Connections"
    
    # Test gcloud connection
    print_check "Google Cloud API connection"
    if gcloud projects describe $PROJECT_ID &> /dev/null; then
        print_pass
    else
        print_fail "Cannot connect to Google Cloud API"
    fi
    
    # Test Firebase connection (if authenticated)
    print_check "Firebase connection"
    if firebase projects:list &> /dev/null; then
        print_pass
    else
        print_fail "Cannot connect to Firebase"
    fi
    
    # Test service account authentication
    if [ -f "${SERVICE_ACCOUNT_NAME}-key.json" ]; then
        print_check "Service account authentication"
        if GOOGLE_APPLICATION_CREDENTIALS="${SERVICE_ACCOUNT_NAME}-key.json" gcloud auth application-default print-access-token &> /dev/null; then
            print_pass
        else
            print_fail "Service account key authentication failed"
        fi
    fi
}

print_summary() {
    print_header "Verification Summary"
    
    echo ""
    echo "📊 Results:"
    echo "  ✅ Passed: $CHECKS_PASSED"
    echo "  ❌ Failed: $CHECKS_FAILED"
    echo "  📋 Total:  $TOTAL_CHECKS"
    echo ""
    
    if [ $CHECKS_FAILED -eq 0 ]; then
        echo -e "${GREEN}🎉 All checks passed! Your setup is ready for deployment.${NC}"
        echo ""
        echo "🚀 Next steps:"
        echo "  1. Deploy Firestore rules: firebase deploy --only firestore"
        echo "  2. Deploy application: npm run deploy"
        echo "  3. Test deployment: npm run test:e2e"
    else
        echo -e "${RED}❌ Some checks failed. Please review and fix the issues above.${NC}"
        echo ""
        echo "📚 Documentation:"
        echo "  • Cloud Setup: docs/cloud-setup.md"
        echo "  • Firebase Setup: docs/firebase-setup.md"
        echo ""
        echo "🔧 Common fixes:"
        echo "  • Run setup script: ./scripts/setup-cloud.sh"
        echo "  • Enable APIs: gcloud services enable [api-name]"
        echo "  • Create resources: See documentation above"
        
        exit 1
    fi
}

# Main execution
main() {
    print_header "Pathfinder Setup Verification"
    
    get_project_id
    verify_prerequisites
    verify_project_config
    verify_apis
    verify_service_account
    verify_firestore
    verify_storage
    verify_secrets
    verify_artifact_registry
    verify_firebase_config
    verify_environment_files
    test_connections
    print_summary
}

# Run main function
main "$@"