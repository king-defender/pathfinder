# Pathfinder

A comprehensive path-finding and navigation solution designed for efficient route planning and optimization.

## Overview

Pathfinder is a modern application that provides intelligent path-finding algorithms and navigation services. Whether you're building a logistics system, game AI, or mapping application, Pathfinder offers the tools you need for optimal route calculation.

## Features

- **Advanced Algorithms**: Implementation of A*, Dijkstra, and other pathfinding algorithms
- **Real-time Processing**: Fast route calculation for dynamic environments
- **Scalable Architecture**: Built to handle high-volume requests
- **API-First Design**: RESTful API for easy integration
- **Web Interface**: User-friendly frontend for visualization and testing

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- Docker (for containerized deployment)
- Firebase CLI (for cloud deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/king-defender/pathfinder.git
cd pathfinder

# Install dependencies
npm install

# Set up environment variables for backend (API)
cp api/.env.example api/.env
# Edit api/.env with your configuration if needed

# Set up environment variables for frontend (App)
cp app/.env.example app/.env
# Edit app/.env with your configuration if needed

# Start development server
npm run dev
```

### Docker Deployment

For local development with Docker:

```bash
# Set up environment variables (required for Docker)
cp api/.env.example api/.env
cp app/.env.example app/.env

# Build and run with Docker Compose
docker-compose up --build
```

This will start the following services:
- **Backend API**: http://localhost:8080
- **Frontend**: http://localhost:3000  
- **Firebase Emulator UI**: http://localhost:4000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

For production deployment:

```bash
# Build the Docker image
docker build -t pathfinder .

# Run the container
docker run -p 8080:8080 pathfinder
```

## Architecture

### Backend API
- **Framework**: Node.js with Express/Fastify
- **Database**: Firestore for data persistence
- **Authentication**: Firebase Auth
- **Deployment**: Google Cloud Run

### Frontend UI
- **Framework**: React/Vue.js
- **Styling**: TailwindCSS
- **Deployment**: Firebase Hosting

### Core Components
- **Path Engine**: Core pathfinding algorithms
- **Route Optimizer**: Performance optimization layer
- **Cache Manager**: Redis-based caching for frequent queries
- **API Gateway**: Request routing and rate limiting

## API Reference

### Endpoints

```
GET  /api/path/find    - Calculate optimal path
POST /api/path/batch   - Batch path calculations
GET  /api/health       - Service health check
```

### Example Usage

```javascript
// Find path between two points
const response = await fetch('/api/path/find', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    start: { lat: 40.7128, lng: -74.0060 },
    end: { lat: 40.7589, lng: -73.9851 },
    algorithm: 'astar'
  })
});

const path = await response.json();
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `FIREBASE_PROJECT_ID` | Firebase project ID | - |
| `DATABASE_URL` | Database connection string | - |
| `REDIS_URL` | Redis cache URL | - |

### Firebase Configuration

1. Create a Firebase project
2. Enable Firestore and Authentication
3. Download service account key
4. Set up security rules (see `firestore.rules`)

## Development

### Project Structure

```
pathfinder/
├── src/
│   ├── api/          # API routes and controllers
│   ├── algorithms/   # Pathfinding algorithms
│   ├── models/       # Data models
│   ├── services/     # Business logic
│   └── utils/        # Utility functions
├── frontend/
│   ├── src/
│   ├── public/
│   └── dist/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── deployment/
│   ├── docker/
│   ├── kubernetes/
│   └── scripts/
└── docs/
```

### Testing

```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

### Linting and Formatting

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## Deployment

### Production Deployment (Cloud Run + Firebase Hosting)

Deploy the backend to Google Cloud Run and frontend to Firebase Hosting:

```bash
# Test deployment readiness
npm run deploy:test

# Run demo deployment (shows process without actual deployment)
npm run deploy:demo

# Real deployment (requires Google Cloud setup)
npm run deploy:cloud-run    # Deploy backend to Cloud Run
firebase deploy --only hosting  # Deploy frontend to Firebase Hosting
```

#### Quick Setup for Real Deployment

1. **Google Cloud Setup**:
   ```bash
   gcloud projects create your-project-id
   gcloud config set project your-project-id
   gcloud services enable run.googleapis.com artifactregistry.googleapis.com
   ```

2. **Firebase Setup**:
   ```bash
   firebase login
   firebase init hosting firestore
   ```

3. **Environment Configuration**:
   - Copy `.env.production.example` to `.env.production`
   - Copy `frontend/.env.production.example` to `frontend/.env.production`
   - Update values with your project configuration

4. **Deploy**:
   ```bash
   ./scripts/deploy-cloud-run.sh
   firebase deploy --only hosting
   ```

See [docs/deployment-guide.md](docs/deployment-guide.md) for detailed instructions.

#### Deployment Architecture

- **Backend**: Google Cloud Run (auto-scaling, pay-per-request)
- **Frontend**: Firebase Hosting (CDN, automatic HTTPS)
- **Database**: Firestore (NoSQL, real-time)
- **Secrets**: Google Cloud Secret Manager
- **Monitoring**: Cloud Run metrics + Firebase Analytics

#### Environment Variables

**Backend (.env.production)**:
```env
NODE_ENV=production
PORT=8080
GOOGLE_CLOUD_PROJECT_ID=your-project-id
FIREBASE_PROJECT_ID=your-project-id
CORS_ORIGIN=https://your-project-id.web.app
```

**Frontend (frontend/.env.production)**:
```env
VITE_API_BASE_URL=https://your-cloud-run-url
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_API_KEY=your-api-key
```

### Local Development

```bash
npm run dev
```

### Production Deployment

#### Docker
```bash
docker build -t pathfinder:latest .
docker run -p 3000:3000 pathfinder:latest
```

#### Google Cloud Run
```bash
gcloud run deploy pathfinder \
  --source . \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated
```

#### Firebase Hosting (Frontend)
```bash
npm run build
firebase deploy --only hosting
```

## Security

### Authentication
- Firebase Authentication integration
- JWT token validation
- Role-based access control (RBAC)

### Firestore Security Rules
See `firestore.rules` for database security configuration.

### API Security
- Rate limiting
- Input validation
- CORS configuration
- Helmet.js security headers

## Performance

### Optimization Strategies
- Algorithm selection based on use case
- Caching frequently requested routes
- Connection pooling for database
- CDN for static assets

### Monitoring
- Application metrics with Prometheus
- Error tracking with Sentry
- Performance monitoring with New Relic

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow ESLint configuration
- Write tests for new features
- Update documentation as needed
- Follow semantic versioning

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/king-defender/pathfinder/issues)
- **Discussions**: [GitHub Discussions](https://github.com/king-defender/pathfinder/discussions)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.