# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Removed
- The literal geo-routing "pathfinding" feature (`/api/path`, `PathfindingService`,
  `src/algorithms/{AStar,BFS,Dijkstra}.ts`) - it never implemented the algorithms it
  claimed to: `AStarAlgorithm.findPath` was straight-line interpolation between two points
  labeled `algorithm: 'A*'` with a fabricated `nodesExplored` count, and the other two
  followed the same pattern ("Simplified ... for demonstration"). Not wired to the frontend
  or any real caller. The app's actual product - AI career advice, roadmaps, and chat - is
  unaffected; see README.

### Security
- `BYPASS_AUTH` now only takes effect when `NODE_ENV=test` (was also allowed in
  `development`) - a deployment that accidentally left `NODE_ENV=development` with
  `BYPASS_AUTH=true` set would otherwise have authentication silently disabled.
- Bumped `firebase-admin` 11.x → 14.x, `vitest` 0.34.x → 5.x, and applied `npm audit fix`
  (51 vulnerabilities → 15, 0 remaining critical - the rest are deep transitive dependencies
  of `@google-cloud/storage`/`vitest` with no further non-breaking fix available yet).
  Required migrating `firebase-admin`'s namespace import (`admin.auth()`, `admin.firestore()`)
  to its modular API (`getAuth()`, `getFirestore()` from `firebase-admin/auth` /
  `firebase-admin/firestore`) - the old style was removed in v12.

### Added
- Initial project structure with modern TypeScript setup
- Comprehensive documentation and README
- Docker containerization with multi-stage builds
- GitHub Actions CI/CD pipeline with security scanning
- Firebase Firestore security rules and configuration
- ESLint and Prettier configuration for code quality
- Vitest and Playwright testing framework setup
- Environment variable documentation and examples
- Contributing guidelines and code of conduct
- Basic Express.js server with security middleware
- Health check endpoint for monitoring
- Rate limiting and CORS configuration

### Security
- Implemented security headers with Helmet.js
- Added rate limiting to prevent abuse
- Created secure Firestore rules with proper validation
- Docker image security hardening with non-root user
- Dependency security auditing in CI pipeline

### Documentation
- Comprehensive README with setup instructions
- API documentation structure
- Contributing guidelines for developers
- Environment variable documentation
- Docker deployment instructions

## [1.0.0] - 2025-01-21

### Added
- Initial release of Pathfinder application
- Basic project foundation and structure
- Modern development tooling and configuration
- Deployment-ready containerization
- Security-first approach with best practices