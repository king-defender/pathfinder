# Firestore Security Rules

This document contains security rules for Firestore database access control.

## Overview

Firestore security rules control access to your database. They run on the server and are enforced consistently across all platforms.

## Security Rules

### Complete Rules File

Create `firestore.rules` in your project root:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             request.auth.token.admin == true;
    }
    
    function isValidUser() {
      return isAuthenticated() && 
             request.auth.uid != null &&
             request.auth.token.email_verified == true;
    }
    
    function isValidPathData() {
      return request.resource.data.keys().hasAll(['start', 'end', 'algorithm']) &&
             request.resource.data.start is map &&
             request.resource.data.end is map &&
             request.resource.data.start.keys().hasAll(['lat', 'lng']) &&
             request.resource.data.end.keys().hasAll(['lat', 'lng']) &&
             request.resource.data.start.lat is number &&
             request.resource.data.start.lng is number &&
             request.resource.data.end.lat is number &&
             request.resource.data.end.lng is number &&
             request.resource.data.algorithm in ['astar', 'dijkstra', 'bfs'];
    }
    
    // User profiles
    match /users/{userId} {
      allow read, write: if isOwner(userId);
      allow read: if isAdmin();
      
      // User creation rules
      allow create: if isAuthenticated() &&
                   request.auth.uid == userId &&
                   request.resource.data.keys().hasAll(['email', 'createdAt']) &&
                   request.resource.data.email == request.auth.token.email &&
                   request.resource.data.createdAt == request.time;
    }
    
    // Path calculations
    match /paths/{pathId} {
      // Anyone can read public paths
      allow read: if resource.data.isPublic == true;
      
      // Users can read their own paths
      allow read: if isOwner(resource.data.userId);
      
      // Admins can read all paths
      allow read: if isAdmin();
      
      // Users can create paths with valid data
      allow create: if isValidUser() &&
                   isValidPathData() &&
                   request.resource.data.userId == request.auth.uid &&
                   request.resource.data.createdAt == request.time;
      
      // Users can update their own paths
      allow update: if isOwner(resource.data.userId) &&
                   request.resource.data.userId == resource.data.userId;
      
      // Users can delete their own paths
      allow delete: if isOwner(resource.data.userId);
      
      // Admins can do everything
      allow write: if isAdmin();
    }
    
    // Path history (read-only for users)
    match /pathHistory/{historyId} {
      allow read: if isOwner(resource.data.userId) || isAdmin();
      allow create: if isValidUser() &&
                   request.resource.data.userId == request.auth.uid &&
                   request.resource.data.createdAt == request.time;
    }
    
    // User analytics (append-only)
    match /analytics/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow create: if isOwner(userId);
      
      match /events/{eventId} {
        allow read: if isOwner(userId) || isAdmin();
        allow create: if isOwner(userId) &&
                     request.resource.data.timestamp == request.time;
      }
    }
    
    // API usage tracking
    match /usage/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow write: if isOwner(userId) || isAdmin();
    }
    
    // System collections (admin only)
    match /admin/{document=**} {
      allow read, write: if isAdmin();
    }
    
    match /system/{document=**} {
      allow read, write: if isAdmin();
    }
    
    match /config/{document=**} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    // Public data (read-only)
    match /public/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Algorithm performance data
    match /performance/{algorithmId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
      
      match /metrics/{metricId} {
        allow read: if isAuthenticated();
        allow create: if isValidUser();
      }
    }
    
    // Rate limiting data
    match /rateLimits/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow write: if isAdmin();
    }
    
    // Feedback and reports
    match /feedback/{feedbackId} {
      allow create: if isValidUser() &&
                   request.resource.data.userId == request.auth.uid &&
                   request.resource.data.createdAt == request.time;
      allow read: if isAdmin();
    }
    
    // Error logs (system use only)
    match /errors/{errorId} {
      allow read: if isAdmin();
      allow create: if isAuthenticated();
    }
    
    // Subcollections security
    match /{document=**} {
      // Block access to unlisted collections
      allow read, write: if false;
    }
  }
}
```

## Rule Explanations

### Authentication Rules

```javascript
// Check if user is authenticated
function isAuthenticated() {
  return request.auth != null;
}

// Check if user owns the resource
function isOwner(userId) {
  return isAuthenticated() && request.auth.uid == userId;
}

// Check if user has admin privileges
function isAdmin() {
  return isAuthenticated() && 
         request.auth.token.admin == true;
}
```

### Data Validation Rules

```javascript
// Validate path calculation data
function isValidPathData() {
  return request.resource.data.keys().hasAll(['start', 'end', 'algorithm']) &&
         request.resource.data.start is map &&
         request.resource.data.end is map &&
         request.resource.data.start.keys().hasAll(['lat', 'lng']) &&
         request.resource.data.end.keys().hasAll(['lat', 'lng']) &&
         request.resource.data.start.lat is number &&
         request.resource.data.start.lng is number &&
         request.resource.data.end.lat is number &&
         request.resource.data.end.lng is number &&
         request.resource.data.algorithm in ['astar', 'dijkstra', 'bfs'];
}
```

### Time-based Validation

```javascript
// Ensure timestamps are set correctly
allow create: if request.resource.data.createdAt == request.time;

// Prevent backdating
allow create: if request.resource.data.createdAt >= request.time;
```

## Custom Claims Setup

### Setting Admin Claims

```javascript
// Cloud Function to set custom claims
const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.setAdminClaim = functions.https.onCall(async (data, context) => {
  // Check if request is made by an admin
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can set admin claims'
    );
  }
  
  const { uid, admin: isAdmin } = data;
  
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: isAdmin });
    return { success: true };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});
```

### Setting User Roles

```javascript
// Set custom claims for different user roles
exports.setUserRole = functions.https.onCall(async (data, context) => {
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
```

## Testing Security Rules

### Local Testing

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Start Firestore emulator
firebase emulators:start --only firestore

# Run security rules tests
npm run test:firestore-rules
```

### Unit Tests

Create `test/firestore-rules.test.js`:

```javascript
const { assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');

describe('Firestore Security Rules', () => {
  let testEnv;
  
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'pathfinder-test',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8')
      }
    });
  });
  
  afterAll(async () => {
    await testEnv.cleanup();
  });
  
  test('Unauthenticated users cannot read user data', async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(unauthedDb.collection('users').doc('user1').get());
  });
  
  test('Users can read their own data', async () => {
    const authedDb = testEnv.authenticatedContext('user1').firestore();
    await assertSucceeds(authedDb.collection('users').doc('user1').get());
  });
  
  test('Users cannot read other users data', async () => {
    const authedDb = testEnv.authenticatedContext('user1').firestore();
    await assertFails(authedDb.collection('users').doc('user2').get());
  });
  
  test('Valid path data can be created', async () => {
    const authedDb = testEnv.authenticatedContext('user1').firestore();
    const pathData = {
      userId: 'user1',
      start: { lat: 40.7128, lng: -74.0060 },
      end: { lat: 40.7589, lng: -73.9851 },
      algorithm: 'astar',
      createdAt: new Date()
    };
    
    await assertSucceeds(
      authedDb.collection('paths').doc('path1').set(pathData)
    );
  });
  
  test('Invalid path data is rejected', async () => {
    const authedDb = testEnv.authenticatedContext('user1').firestore();
    const invalidPathData = {
      userId: 'user1',
      start: { lat: 'invalid' }, // Invalid latitude
      end: { lat: 40.7589, lng: -73.9851 },
      algorithm: 'astar'
    };
    
    await assertFails(
      authedDb.collection('paths').doc('path1').set(invalidPathData)
    );
  });
});
```

## Deployment

### Deploy Rules

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy with specific project
firebase deploy --only firestore:rules --project your-project-id
```

### Continuous Integration

```yaml
# .github/workflows/firestore-rules.yml
name: Test Firestore Rules

on:
  push:
    paths:
      - 'firestore.rules'
      - 'test/firestore-rules.test.js'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Test Firestore rules
        run: npm run test:firestore-rules
```

## Best Practices

### Security Guidelines

1. **Principle of Least Privilege**: Grant minimum necessary permissions
2. **Validate All Data**: Check data types and required fields
3. **Use Helper Functions**: Reduce code duplication
4. **Test Thoroughly**: Cover all access patterns
5. **Monitor Usage**: Track rule performance
6. **Regular Audits**: Review rules periodically

### Performance Optimization

```javascript
// Cache expensive operations
function isValidUser() {
  return request.auth != null && 
         request.auth.uid != null &&
         request.auth.token.email_verified == true;
}

// Use early returns
allow read: if resource.data.isPublic == true ||
           isOwner(resource.data.userId) ||
           isAdmin();
```

### Common Patterns

```javascript
// Time-based access control
allow read: if resource.data.expiresAt > request.time;

// Resource size limits
allow create: if request.resource.size() < 1000000; // 1MB limit

// Field validation
allow write: if request.resource.data.title is string &&
            request.resource.data.title.size() <= 100;
```

## Monitoring and Debugging

### Enable Audit Logs

```bash
# Enable Firestore audit logs in Google Cloud Console
gcloud logging sinks create firestore-audit \
  bigquery.googleapis.com/projects/PROJECT_ID/datasets/audit_logs \
  --log-filter='resource.type="gce_instance"'
```

### Common Issues

1. **Rules too permissive**: Regular security audits
2. **Performance problems**: Optimize complex rules
3. **Authentication failures**: Check token claims
4. **Data validation errors**: Test with sample data

### Debugging Tools

```javascript
// Add debug information to rules
allow read: if debug(request.auth) && isOwner(resource.data.userId);

// Use resource and request inspection
allow write: if debug(resource.data) && debug(request.resource.data);
```