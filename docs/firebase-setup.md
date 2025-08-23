# Firebase Setup Guide

This document provides comprehensive instructions for setting up Firebase for the Pathfinder application, including authentication, Firestore database, and hosting configuration.

## Prerequisites

- Google Cloud Platform project set up (see `cloud-setup.md`)
- Firebase CLI installed
- Node.js and npm installed
- Project configured in `asia-south1` region

## Installation

### Install Firebase CLI

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Verify installation
firebase --version
```

## 1. Firebase Project Setup

### Initialize Firebase Project

```bash
# Navigate to project root
cd /path/to/pathfinder

# Initialize Firebase in the project
firebase init

# Select the following features:
# ◉ Firestore: Configure security rules and indexes
# ◉ Functions: Configure a Cloud Functions directory
# ◉ Hosting: Configure files for Firebase Hosting
# ◉ Storage: Configure a security rules file for Cloud Storage
# ◉ Emulators: Set up local emulators
```

### Project Configuration

The Firebase project should be configured with the following settings:

```bash
# Set the Firebase project
firebase use pathfinder-app

# Verify project configuration
firebase projects:list
```

## 2. Firestore Database Setup

### Create Firestore Database

If not already created via gcloud:

```bash
# Create Firestore database in asia-south1
firebase firestore:databases:create \
  --location=asia-south1 \
  --type=firestore-native
```

### Deploy Firestore Rules

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy database indexes
firebase deploy --only firestore:indexes
```

### Verify Firestore Rules

```bash
# Test security rules locally
npm run test:firestore-rules

# Or test with emulator
firebase emulators:start --only firestore
```

## 3. Firebase Authentication Setup

### Enable Authentication Methods

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (`pathfinder-app`)
3. Navigate to Authentication > Sign-in method
4. Enable the following providers:

#### Email/Password
```bash
# Enable email/password authentication
firebase auth:config:update --email-password-enabled
```

#### Google Sign-In
```bash
# Enable Google authentication
firebase auth:config:update --google-enabled
```

#### Optional: Additional Providers
- GitHub (for developer accounts)
- Anonymous (for guest users)

### Configure Authentication Settings

```bash
# Set authorized domains
firebase auth:config:update --authorized-domains=localhost,pathfinder-app.web.app,pathfinder.dev

# Configure password policy
firebase auth:config:update --password-policy-enforcement-state=ENFORCE
```

## 4. Firebase Hosting Setup

### Configure Hosting

The `firebase.json` file is already configured. Deploy hosting:

```bash
# Build the application first
npm run build

# Deploy hosting
firebase deploy --only hosting
```

### Custom Domain Setup (Optional)

```bash
# Add custom domain
firebase hosting:channel:create production
firebase hosting:channel:deploy production

# Verify domain
firebase hosting:sites:list
```

## 5. Cloud Functions Setup

### Initialize Functions

```bash
# Create functions directory
mkdir -p functions
cd functions

# Initialize Node.js project for functions
npm init -y

# Install Firebase Functions SDK
npm install firebase-functions firebase-admin
npm install -D @types/node typescript

# Create index.ts for functions
```

### Deploy Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:setUserRole
```

## 6. Storage Rules Setup

Create `storage.rules` file:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload profile images
    match /users/{userId}/profile/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to upload path images/files
    match /paths/{pathId}/{allPaths=**} {
      allow read: if resource.metadata.isPublic == true || 
                     (request.auth != null && request.auth.uid == resource.metadata.owner);
      allow write: if request.auth != null && request.auth.uid == resource.metadata.owner;
    }
    
    // Public read-only assets
    match /public/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && 
                      request.auth.token.admin == true;
    }
    
    // Admin-only system files
    match /system/{allPaths=**} {
      allow read, write: if request.auth != null && 
                            request.auth.token.admin == true;
    }
  }
}
```

Deploy storage rules:

```bash
# Deploy storage rules
firebase deploy --only storage
```

## 7. Environment Configuration

### Firebase Configuration for Web App

Create `src/config/firebase.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: `${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
```

### Environment Variables

Update `.env.production`:

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=pathfinder-app
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=pathfinder-app.firebaseapp.com
FIREBASE_DATABASE_URL=https://pathfinder-app-default-rtdb.asia-south1.firebasedatabase.app/
FIREBASE_STORAGE_BUCKET=pathfinder-app.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
FIREBASE_MEASUREMENT_ID=your-measurement-id

# Service Account (for server-side)
GOOGLE_APPLICATION_CREDENTIALS=./pathfinder-sa-key.json
FIREBASE_CLIENT_EMAIL=pathfinder-sa@pathfinder-app.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
```

## 8. Emulator Setup

### Configure Local Development

Start Firebase emulators for local development:

```bash
# Start all emulators
firebase emulators:start

# Start specific emulators
firebase emulators:start --only firestore,auth,hosting

# Start with import/export
firebase emulators:start --import=./firebase-export --export-on-exit=./firebase-export
```

### Emulator Configuration

The emulators are configured in `firebase.json`:

- **Authentication**: http://localhost:9099
- **Firestore**: http://localhost:8080
- **Functions**: http://localhost:5001
- **Hosting**: http://localhost:5000
- **Storage**: http://localhost:9199
- **Emulator UI**: http://localhost:4000

## 9. Security Rules Testing

### Install Testing Dependencies

```bash
# Install Firestore rules testing
npm install -D @firebase/rules-unit-testing
```

### Create Test File

Create `test/firestore-rules.test.js`:

```javascript
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'pathfinder-test',
    firestore: {
      rules: require('fs').readFileSync('firestore.rules', 'utf8'),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

// Add your security rules tests here
```

### Run Security Tests

```bash
# Run security rules tests
npm run test:firestore-rules
```

## 10. Deployment

### Production Deployment

```bash
# Build and deploy everything
npm run build
firebase deploy

# Deploy specific components
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only storage
```

### Staging Deployment

```bash
# Deploy to staging
firebase use pathfinder-app-staging
firebase deploy
```

## 11. Monitoring and Analytics

### Enable Analytics

```bash
# Enable Google Analytics
firebase analytics:enable
```

### Performance Monitoring

Add to your web app:

```typescript
import { getPerformance } from 'firebase/performance';

const perf = getPerformance(app);
```

### Crashlytics (for mobile apps)

```bash
# Enable Crashlytics
firebase crashlytics:enable
```

## 12. Verification

### Verify Firebase Setup

```bash
# Check project status
firebase projects:list

# Test Firestore connection
firebase firestore:databases:list

# Verify hosting
firebase hosting:sites:list

# Test authentication
firebase auth:config:get
```

### Health Check Script

Create `scripts/verify-firebase-setup.sh`:

```bash
#!/bin/bash
# Verify Firebase setup
firebase projects:list
firebase firestore:databases:list
firebase hosting:sites:list
echo "Firebase setup verification complete"
```

## Troubleshooting

### Common Issues

1. **Project not found**: Verify project ID in `.firebaserc`
2. **Permission denied**: Check service account roles
3. **Rules validation failed**: Test rules with emulator
4. **Hosting deployment failed**: Check build directory exists

### Debug Commands

```bash
# Enable debug logging
firebase --debug deploy

# Check Firebase configuration
firebase projects:list

# Validate rules
firebase firestore:rules:get
```

## Next Steps

1. Set up monitoring and alerting
2. Configure backup strategy
3. Implement CI/CD pipeline
4. Set up staging environment
5. Configure custom domains
6. Enable advanced security features

## Support Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)