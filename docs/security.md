# Security Best Practices

This document outlines security best practices for the Pathfinder project, covering both development and deployment security considerations.

## Table of Contents

- [Authentication & Authorization](#authentication--authorization)
- [Data Protection](#data-protection)
- [API Security](#api-security)
- [Infrastructure Security](#infrastructure-security)
- [Development Security](#development-security)
- [Incident Response](#incident-response)

## Authentication & Authorization

### Firebase Authentication

```javascript
// Secure authentication setup
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  // Your config here
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Use emulator in development
if (process.env.NODE_ENV === 'development') {
  connectAuthEmulator(auth, 'http://localhost:9099');
}
```

### JWT Token Validation

```javascript
// Middleware for JWT validation
const validateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

### Role-Based Access Control (RBAC)

```javascript
// Role checking middleware
const requireRole = (role) => (req, res, next) => {
  if (!req.user.roles || !req.user.roles.includes(role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

// Usage
app.get('/admin/users', validateToken, requireRole('admin'), getUsersHandler);
```

## Data Protection

### Input Validation

```javascript
const { body, validationResult } = require('express-validator');

// Validation rules
const pathValidation = [
  body('start.lat').isFloat({ min: -90, max: 90 }),
  body('start.lng').isFloat({ min: -180, max: 180 }),
  body('end.lat').isFloat({ min: -90, max: 90 }),
  body('end.lng').isFloat({ min: -180, max: 180 }),
  body('algorithm').isIn(['astar', 'dijkstra', 'bfs'])
];

// Validation middleware
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
```

### Data Sanitization

```javascript
const DOMPurify = require('isomorphic-dompurify');
const { escape } = require('html-escaper');

// Sanitize user input
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return DOMPurify.sanitize(escape(input));
  }
  return input;
};
```

### Environment Variables

```bash
# .env file security
# Use strong, random values
JWT_SECRET=use_a_long_random_string_here
SESSION_SECRET=another_long_random_string

# Database credentials
DB_PASSWORD=strong_database_password

# API keys (never commit to version control)
GOOGLE_MAPS_API_KEY=your_api_key_here
```

## API Security

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

// Strict rate limiting for expensive operations
const pathfindingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 pathfinding requests per minute
  skip: (req) => req.user?.isPremium // Skip for premium users
});

app.use('/api/', generalLimiter);
app.use('/api/path/', pathfindingLimiter);
```

### CORS Configuration

```javascript
const cors = require('cors');

const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

### Security Headers

```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.mapbox.com"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## Infrastructure Security

### Firestore Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Path calculations are read-only for authenticated users
    match /paths/{pathId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Admin-only access
    match /admin/{document=**} {
      allow read, write: if request.auth != null && 
        request.auth.token.admin == true;
    }
  }
}
```

### Container Security

```dockerfile
# Dockerfile security best practices
FROM node:18-alpine AS base

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies as root
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY --chown=nextjs:nodejs . .

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
```

## Development Security

### Dependency Management

```bash
# Audit dependencies regularly
npm audit
npm audit fix

# Use exact versions in package-lock.json
npm ci

# Check for outdated packages
npm outdated
```

### Code Security

```javascript
// Secure coding practices

// 1. Avoid eval() and similar functions
// Bad
eval(userInput);

// Good
JSON.parse(userInput);

// 2. Use parameterized queries
// Bad
const query = `SELECT * FROM users WHERE id = ${userId}`;

// Good
const query = 'SELECT * FROM users WHERE id = ?';
db.query(query, [userId]);

// 3. Validate file uploads
const multer = require('multer');
const upload = multer({
  limits: { fileSize: 1024 * 1024 }, // 1MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});
```

### Environment Security

```bash
# Test environment (only environment where BYPASS_AUTH is allowed)
export NODE_ENV=test
export DEBUG=true
export BYPASS_AUTH=true  # Only in test environment for security!

# Development environment
export NODE_ENV=development
export DEBUG=true
export BYPASS_AUTH=false  # Security: Auth bypass not allowed in development

# Production environment
export NODE_ENV=production
export DEBUG=false
export BYPASS_AUTH=false
```

## Incident Response

### Security Monitoring

```javascript
// Log security events
const winston = require('winston');

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'security.log' })
  ]
});

// Log authentication attempts
const logAuthAttempt = (req, success, user = null) => {
  securityLogger.info({
    event: 'auth_attempt',
    success,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    user: user?.uid,
    timestamp: new Date().toISOString()
  });
};
```

### Incident Response Plan

1. **Detection**
   - Monitor logs for suspicious activity
   - Set up alerts for security events
   - Regular security audits

2. **Assessment**
   - Determine scope of the incident
   - Identify affected systems and data
   - Document timeline of events

3. **Containment**
   - Isolate affected systems
   - Revoke compromised credentials
   - Block malicious IPs

4. **Eradication**
   - Remove malicious code or access
   - Patch vulnerabilities
   - Update security rules

5. **Recovery**
   - Restore systems from clean backups
   - Gradually restore services
   - Monitor for reoccurrence

6. **Lessons Learned**
   - Document incident details
   - Update security procedures
   - Improve monitoring and detection

## Security Checklist

### Development
- [ ] Input validation implemented
- [ ] Output encoding used
- [ ] Authentication required for protected routes
- [ ] Authorization checks in place
- [ ] Secrets stored securely
- [ ] Dependencies audited
- [ ] Code reviewed for security issues

### Deployment
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Rate limiting implemented
- [ ] Monitoring and logging enabled
- [ ] Backup and recovery tested
- [ ] Incident response plan documented
- [ ] Security rules deployed

### Ongoing
- [ ] Regular security audits
- [ ] Dependency updates
- [ ] Log monitoring
- [ ] Security training for team
- [ ] Penetration testing
- [ ] Compliance reviews