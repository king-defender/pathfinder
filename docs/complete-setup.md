# Complete Setup Guide for Pathfinder MVP

This document provides a comprehensive guide for setting up the complete cloud infrastructure and Firebase configuration for the Pathfinder application MVP.

## Overview

The Pathfinder application uses the following cloud infrastructure:
- **Google Cloud Platform** for core infrastructure (asia-south1 region)
- **Firebase** for authentication, database, and hosting
- **Firestore** for data persistence
- **Cloud Run** for backend API deployment
- **Firebase Hosting** for frontend deployment

## Prerequisites

Before starting the setup, ensure you have:

1. **Google Cloud Account** with billing enabled
2. **Node.js** (v18 or higher) and npm
3. **Google Cloud CLI** (`gcloud`) installed and configured
4. **Firebase CLI** installed globally: `npm install -g firebase-tools`
5. **Project permissions**: Owner or Editor role on Google Cloud project

## Quick Start

### Automated Setup

For a complete automated setup, run:

```bash
# Install dependencies
npm install

# Run complete setup (interactive)
npm run setup:all

# Verify setup
npm run verify:setup
```

### Manual Setup

If you prefer manual setup or need to troubleshoot:

1. **Google Cloud Setup**: `npm run setup:cloud`
2. **Firebase Setup**: `npm run setup:firebase`
3. **Verification**: `npm run verify:setup`

## Detailed Setup Instructions

### 1. Google Cloud Platform Setup

#### Automated Cloud Setup

```bash
# Run the cloud setup script
npm run setup:cloud
```

This script will:
- Create or configure the Google Cloud project
- Enable all required APIs
- Create the service account with proper roles
- Set up Firestore database in asia-south1
- Create Cloud Storage buckets
- Set up Artifact Registry
- Configure Secret Manager
- Generate environment configuration files

#### Manual Cloud Setup

If you prefer manual setup, follow the detailed instructions in [`docs/cloud-setup.md`](./docs/cloud-setup.md).

### 2. Firebase Setup

#### Automated Firebase Setup

```bash
# Run the Firebase setup script
npm run setup:firebase
```

This script will:
- Configure the Firebase project
- Deploy Firestore security rules and indexes
- Deploy Storage security rules
- Set up Firebase Hosting
- Configure Cloud Functions
- Set up local emulators

#### Manual Firebase Setup

For manual Firebase setup, see [`docs/firebase-setup.md`](./docs/firebase-setup.md).

### 3. Environment Configuration

#### Production Environment

1. Copy the production environment template:
   ```bash
   cp .env.production.example .env.production
   ```

2. Update the following values in `.env.production`:
   - `FIREBASE_API_KEY`: Get from Firebase Console
   - `FIREBASE_APP_ID`: Get from Firebase Console
   - `FIREBASE_MESSAGING_SENDER_ID`: Get from Firebase Console
   - `FIREBASE_MEASUREMENT_ID`: Get from Firebase Console (if Analytics enabled)
   - `GOOGLE_MAPS_API_KEY`: Your Google Maps API key
   - `JWT_SECRET`: Generate a secure random string
   - `SESSION_SECRET`: Generate a secure random string

#### Staging Environment

1. Copy the staging environment template:
   ```bash
   cp .env.staging.example .env.staging
   ```

2. Update with staging-specific values

#### Development Environment

For local development, use the existing `.env.example`:
```bash
cp .env.example .env.development
```

### 4. Secret Management

#### Using Google Secret Manager (Recommended for Production)

1. Update secrets with actual values:
   ```bash
   # Update JWT secret
   echo -n "your-actual-jwt-secret" | gcloud secrets versions add jwt-secret --data-file=-
   
   # Update Google Maps API key
   echo -n "your-actual-maps-api-key" | gcloud secrets versions add google-maps-api-key --data-file=-
   
   # Update session secret
   echo -n "your-actual-session-secret" | gcloud secrets versions add session-secret --data-file=-
   ```

#### Using Environment Variables (Development/Staging)

For development and staging, you can use direct environment variables in the `.env` files.

### 5. Firebase Authentication Setup

#### Enable Authentication Providers

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to Authentication > Sign-in method
4. Enable the following providers:
   - Email/Password
   - Google (optional but recommended)

#### Configure Authorized Domains

Add your domains to the authorized domains list:
- `localhost` (for development)
- Your production domain
- Firebase hosting domain (`your-project.web.app`)

### 6. Deployment

#### Deploy Firestore Rules and Indexes

```bash
npm run deploy:rules
```

#### Deploy Frontend to Firebase Hosting

```bash
npm run deploy:hosting
```

#### Deploy Cloud Functions

```bash
npm run deploy:functions
```

#### Deploy Everything

```bash
npm run deploy:all
```

### 7. Verification

#### Automated Verification

```bash
npm run verify:setup
```

This will check:
- Google Cloud project configuration
- API enablement
- Service account setup
- Firestore database
- Storage buckets
- Firebase configuration
- Environment files

#### Manual Verification

1. **Check Firebase Console**: https://console.firebase.google.com/project/pathfinder-app
2. **Check Google Cloud Console**: https://console.cloud.google.com/
3. **Test Authentication**: Try signing up/in on your application
4. **Test Database**: Create and read data from Firestore
5. **Test Hosting**: Visit your Firebase hosting URL

### 8. Local Development

#### Start Emulators

```bash
# Start all Firebase emulators
npm run emulators:start

# Or setup emulators only
npm run emulators:setup
```

#### Development Server

```bash
# Start development server
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Firebase Emulator UI**: http://localhost:4000
- **Firestore Emulator**: http://localhost:8080
- **Auth Emulator**: http://localhost:9099

## Project Structure

After setup, your project will have:

```
pathfinder/
├── scripts/
│   ├── setup-cloud.sh          # Cloud setup automation
│   ├── setup-firebase.sh       # Firebase setup automation
│   └── verify-setup.sh         # Setup verification
├── docs/
│   ├── cloud-setup.md          # Detailed cloud setup guide
│   ├── firebase-setup.md       # Detailed Firebase setup guide
│   └── complete-setup.md       # This file
├── src/
│   └── config/
│       ├── firebase.example.ts # Firebase configuration template
│       └── firebase.ts         # Actual Firebase config (create this)
├── .env.production.example     # Production environment template
├── .env.staging.example        # Staging environment template
├── firebase.json               # Firebase configuration
├── .firebaserc                 # Firebase project configuration
├── firestore.rules             # Firestore security rules
├── firestore.indexes.json      # Firestore database indexes
├── storage.rules               # Firebase Storage security rules
└── pathfinder-sa-key.json      # Service account key (generated)
```

## Common Issues and Troubleshooting

### Issue: API Not Enabled

**Error**: `googleapis.com/SERVICE_NAME is not enabled`

**Solution**:
```bash
gcloud services enable SERVICE_NAME.googleapis.com
```

### Issue: Permission Denied

**Error**: `Permission denied` when accessing resources

**Solution**:
1. Check service account roles
2. Verify project ownership
3. Re-run setup scripts

### Issue: Firestore Rules Deployment Failed

**Error**: Rules validation failed

**Solution**:
1. Check syntax in `firestore.rules`
2. Test rules with emulator
3. Deploy with debug: `firebase --debug deploy --only firestore:rules`

### Issue: Environment Variables Not Loading

**Solution**:
1. Check file names (`.env.production`, not `.env.production.example`)
2. Verify file permissions
3. Restart the application

### Issue: Firebase Authentication Not Working

**Solution**:
1. Verify authentication providers are enabled
2. Check authorized domains
3. Verify Firebase configuration values

## Security Checklist

Before going to production:

- [ ] Service account key is not committed to version control
- [ ] All environment files with secrets are in `.gitignore`
- [ ] Firestore security rules are properly configured and tested
- [ ] Storage security rules are properly configured
- [ ] CORS is configured with specific domains (not `*`)
- [ ] Rate limiting is enabled
- [ ] Secrets are stored in Secret Manager (not environment files)
- [ ] Authentication is properly configured
- [ ] HTTPS is enforced

## Monitoring and Maintenance

### Set Up Monitoring

1. Enable Google Cloud Monitoring
2. Set up alerts for errors and performance
3. Configure log aggregation
4. Enable Firebase Performance Monitoring

### Regular Maintenance

1. Monitor resource usage and costs
2. Update dependencies regularly
3. Review and update security rules
4. Monitor error logs
5. Backup important data

## Support and Resources

### Documentation
- [Google Cloud Documentation](https://cloud.google.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)

### Tools
- [Google Cloud Console](https://console.cloud.google.com)
- [Firebase Console](https://console.firebase.google.com)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)

### Scripts Reference

| Script | Purpose |
|--------|---------|
| `npm run setup:cloud` | Set up Google Cloud resources |
| `npm run setup:firebase` | Set up Firebase services |
| `npm run setup:all` | Complete setup (Cloud + Firebase) |
| `npm run verify:setup` | Verify entire setup |
| `npm run deploy:rules` | Deploy Firestore and Storage rules |
| `npm run deploy:hosting` | Deploy frontend to Firebase Hosting |
| `npm run deploy:functions` | Deploy Cloud Functions |
| `npm run deploy:all` | Deploy everything |
| `npm run emulators:start` | Start Firebase emulators |

## Next Steps

After completing the setup:

1. **Test the Application**: Run comprehensive tests
2. **Set Up CI/CD**: Configure GitHub Actions or Cloud Build
3. **Configure Custom Domain**: Set up your production domain
4. **Set Up Monitoring**: Enable alerting and monitoring
5. **Plan Scaling**: Configure auto-scaling parameters
6. **Security Review**: Conduct security audit
7. **Performance Testing**: Load test the application
8. **Documentation**: Update team documentation

Your Pathfinder MVP is now ready for development and deployment! 🚀