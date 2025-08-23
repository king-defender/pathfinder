#!/bin/bash

# Pathfinder Firebase Setup Script
# This script sets up Firebase services for the Pathfinder application

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
    
    # Check Firebase CLI
    if ! command -v firebase &> /dev/null; then
        print_error "Firebase CLI is not installed. Please install it with: npm install -g firebase-tools"
        exit 1
    fi
    print_success "Firebase CLI is installed"
    
    # Check if authenticated with Firebase
    if ! firebase projects:list &> /dev/null; then
        print_error "You are not authenticated with Firebase. Please run 'firebase login' first."
        exit 1
    fi
    print_success "Authenticated with Firebase"
    
    # Get project ID
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
    if [ -z "$PROJECT_ID" ]; then
        print_error "No Google Cloud project set. Please run 'gcloud config set project PROJECT_ID' first."
        exit 1
    fi
    print_success "Using project: $PROJECT_ID"
}

setup_firebase_project() {
    print_header "Setting up Firebase Project"
    
    # Use the project
    print_step "Setting Firebase project"
    firebase use $PROJECT_ID
    
    # Check if project exists in Firebase
    if firebase projects:list | grep -q "$PROJECT_ID"; then
        print_success "Firebase project found"
    else
        print_error "Project $PROJECT_ID not found in Firebase. Please create it in the Firebase console first."
        exit 1
    fi
}

deploy_firestore_rules() {
    print_header "Deploying Firestore Rules and Indexes"
    
    # Check if rules file exists
    if [ ! -f "firestore.rules" ]; then
        print_error "firestore.rules file not found"
        exit 1
    fi
    
    # Check if indexes file exists
    if [ ! -f "firestore.indexes.json" ]; then
        print_error "firestore.indexes.json file not found"
        exit 1
    fi
    
    # Deploy rules
    print_step "Deploying Firestore security rules"
    firebase deploy --only firestore:rules
    print_success "Firestore rules deployed"
    
    # Deploy indexes
    print_step "Deploying Firestore indexes"
    firebase deploy --only firestore:indexes
    print_success "Firestore indexes deployed"
}

deploy_storage_rules() {
    print_header "Deploying Storage Rules"
    
    # Check if storage rules exist
    if [ ! -f "storage.rules" ]; then
        print_warning "storage.rules file not found, skipping storage rules deployment"
        return 0
    fi
    
    print_step "Deploying Firebase Storage security rules"
    firebase deploy --only storage
    print_success "Storage rules deployed"
}

enable_authentication() {
    print_header "Configuring Firebase Authentication"
    
    print_step "Enabling Email/Password authentication"
    # Note: This requires manual configuration in Firebase Console
    print_warning "Please enable Email/Password authentication manually in Firebase Console:"
    print_warning "1. Go to https://console.firebase.google.com/project/$PROJECT_ID/authentication/providers"
    print_warning "2. Enable Email/Password provider"
    print_warning "3. Enable Google provider (optional)"
    
    # Set authorized domains
    print_step "Configuring authorized domains"
    print_warning "Please add your production domain to authorized domains in Firebase Console"
}

setup_hosting() {
    print_header "Setting up Firebase Hosting"
    
    # Check if build directory exists
    if [ ! -d "dist" ]; then
        print_warning "Build directory 'dist' not found. Building application..."
        npm run build
    fi
    
    # Deploy hosting
    print_step "Deploying to Firebase Hosting"
    firebase deploy --only hosting
    print_success "Application deployed to Firebase Hosting"
    
    # Get hosting URL
    HOSTING_URL=$(firebase hosting:sites:list --json | grep -o '"url":"[^"]*' | cut -d'"' -f4)
    if [ -n "$HOSTING_URL" ]; then
        print_success "Application available at: $HOSTING_URL"
    fi
}

setup_functions() {
    print_header "Setting up Cloud Functions"
    
    # Check if functions directory exists
    if [ ! -d "functions" ]; then
        print_step "Creating functions directory"
        mkdir -p functions
        cd functions
        
        # Initialize package.json
        npm init -y
        
        # Install dependencies
        npm install firebase-functions firebase-admin
        npm install -D @types/node typescript
        
        # Create basic index.ts
        cat > index.ts << 'EOF'
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Example function to set user roles
export const setUserRole = functions.https.onCall(async (data, context) => {
  // Check if request is made by an admin
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can set user roles'
    );
  }
  
  const { uid, role } = data;
  const validRoles = ['user', 'premium', 'moderator', 'admin'];
  
  if (!validRoles.includes(role)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid role specified'
    );
  }
  
  try {
    const customClaims = { role };
    if (role === 'admin') {
      customClaims.admin = true;
    }
    
    await admin.auth().setCustomUserClaims(uid, customClaims);
    return { success: true };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Health check function
export const healthCheck = functions.https.onRequest((req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});
EOF
        
        # Create tsconfig.json
        cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "module": "commonjs",
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "outDir": "lib",
    "sourceMap": true,
    "strict": true,
    "target": "es2017"
  },
  "compileOnSave": true,
  "include": [
    "src"
  ]
}
EOF
        
        cd ..
        print_success "Functions directory created with basic setup"
    fi
    
    # Deploy functions
    if [ -d "functions" ]; then
        print_step "Deploying Cloud Functions"
        firebase deploy --only functions
        print_success "Cloud Functions deployed"
    fi
}

setup_emulators() {
    print_header "Setting up Local Emulators"
    
    print_step "Starting Firebase emulators for testing"
    print_warning "Starting emulators in background. Use 'firebase emulators:start' for interactive mode."
    
    # Create emulator data directory
    mkdir -p firebase-export
    
    # Start emulators (this will run in background)
    firebase emulators:start --import=./firebase-export --export-on-exit=./firebase-export &
    EMULATOR_PID=$!
    
    # Wait a moment for emulators to start
    sleep 5
    
    print_success "Emulators started (PID: $EMULATOR_PID)"
    print_warning "Emulator UI available at: http://localhost:4000"
    print_warning "Stop emulators with: kill $EMULATOR_PID"
    
    # Save PID to file for easy cleanup
    echo $EMULATOR_PID > .emulator.pid
}

test_setup() {
    print_header "Testing Firebase Setup"
    
    # Test Firestore connection
    print_step "Testing Firestore connection"
    if firebase firestore:databases:list &> /dev/null; then
        print_success "Firestore connection successful"
    else
        print_error "Firestore connection failed"
    fi
    
    # Test hosting deployment
    print_step "Testing hosting deployment"
    HOSTING_URL=$(firebase hosting:sites:list --json 2>/dev/null | grep -o '"url":"[^"]*' | cut -d'"' -f4)
    if [ -n "$HOSTING_URL" ]; then
        print_success "Hosting deployment successful: $HOSTING_URL"
    else
        print_warning "Hosting URL not found or not deployed"
    fi
    
    # Test functions (if they exist)
    if [ -d "functions" ]; then
        print_step "Testing Cloud Functions"
        FUNCTIONS_URL="https://us-central1-$PROJECT_ID.cloudfunctions.net/healthCheck"
        if curl -s -o /dev/null -w "%{http_code}" "$FUNCTIONS_URL" | grep -q "200"; then
            print_success "Cloud Functions are accessible"
        else
            print_warning "Cloud Functions may not be deployed or accessible"
        fi
    fi
}

create_firebase_config() {
    print_header "Creating Firebase Configuration Files"
    
    print_step "Creating Firebase web app configuration"
    
    # Get Firebase config (this requires manual setup in most cases)
    print_warning "Please get your Firebase web app configuration from:"
    print_warning "https://console.firebase.google.com/project/$PROJECT_ID/settings/general"
    
    # Create example config file
    cat > src/config/firebase.example.ts << 'EOF'
// Firebase configuration for web app
// Copy this to firebase.ts and update with your actual config values

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "your-api-key",
  authDomain: `${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "your-sender-id",
  appId: process.env.FIREBASE_APP_ID || "your-app-id",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "your-measurement-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
EOF
    
    print_success "Example Firebase config created at src/config/firebase.example.ts"
    print_warning "Please create src/config/firebase.ts with your actual configuration"
}

print_summary() {
    print_header "Firebase Setup Complete!"
    
    echo ""
    echo "📋 Summary:"
    echo "  ✓ Firebase project configured: $PROJECT_ID"
    echo "  ✓ Firestore rules and indexes deployed"
    echo "  ✓ Storage rules deployed"
    echo "  ✓ Hosting configured"
    echo "  ✓ Local emulators configured"
    echo ""
    echo "🔧 Manual Steps Required:"
    echo "  1. Enable Authentication providers in Firebase Console"
    echo "  2. Add authorized domains for production"
    echo "  3. Get web app configuration and update src/config/firebase.ts"
    echo "  4. Configure custom domain (if needed)"
    echo ""
    echo "🧪 Testing:"
    echo "  • Local emulators: firebase emulators:start"
    echo "  • Run tests: npm run test"
    echo "  • E2E tests: npm run test:e2e"
    echo ""
    echo "📚 Next Steps:"
    echo "  1. Test the application locally"
    echo "  2. Deploy to production: firebase deploy"
    echo "  3. Set up monitoring and alerts"
    echo "  4. Configure CI/CD pipeline"
    echo ""
    HOSTING_URL=$(firebase hosting:sites:list --json 2>/dev/null | grep -o '"url":"[^"]*' | cut -d'"' -f4)
    if [ -n "$HOSTING_URL" ]; then
        echo "🌐 Your application: $HOSTING_URL"
    fi
    echo "🔧 Firebase Console: https://console.firebase.google.com/project/$PROJECT_ID"
}

cleanup() {
    # Stop emulators if they were started
    if [ -f ".emulator.pid" ]; then
        EMULATOR_PID=$(cat .emulator.pid)
        if ps -p $EMULATOR_PID > /dev/null; then
            kill $EMULATOR_PID
            print_warning "Stopped emulators (PID: $EMULATOR_PID)"
        fi
        rm .emulator.pid
    fi
}

# Set up cleanup on exit
trap cleanup EXIT

# Main execution
main() {
    print_header "Pathfinder Firebase Setup"
    
    check_prerequisites
    setup_firebase_project
    deploy_firestore_rules
    deploy_storage_rules
    enable_authentication
    setup_hosting
    setup_functions
    create_firebase_config
    test_setup
    print_summary
}

# Check for command line options
while [[ $# -gt 0 ]]; do
    case $1 in
        --emulators-only)
            setup_emulators
            exit 0
            ;;
        --rules-only)
            check_prerequisites
            setup_firebase_project
            deploy_firestore_rules
            deploy_storage_rules
            exit 0
            ;;
        --hosting-only)
            check_prerequisites
            setup_firebase_project
            setup_hosting
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Usage: $0 [--emulators-only|--rules-only|--hosting-only]"
            exit 1
            ;;
    esac
done

# Run main function
main "$@"