# Pathfinder

A modern, efficient pathfinding application designed for real-world routing and navigation challenges.

## Overview

Pathfinder provides a robust foundation for implementing various pathfinding algorithms and navigation solutions. Built with modern development practices and designed for scalability.

## Features

- 🛣️ **Multiple Algorithms**: Support for A*, Dijkstra, and other pathfinding algorithms
- 🔐 **Secure**: Built with security best practices and authentication
- 🚀 **Fast**: Optimized for performance and scalability
- 📱 **Modern**: Using latest technologies and development standards
- 🐳 **Containerized**: Ready for Docker and cloud deployment

## Quick Start

### Prerequisites

- Node.js 18+ or later
- npm or pnpm
- Docker (optional, for containerized deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/king-defender/pathfinder.git
cd pathfinder

# Install dependencies
npm install
# or
pnpm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

### Environment Variables

See `.env.example` for required environment variables:

- `NODE_ENV`: Development environment (development/production)
- `PORT`: Server port (default: 3000)
- `DATABASE_URL`: Database connection string
- `FIREBASE_PROJECT_ID`: Firebase project identifier
- `API_KEY`: API authentication key

## Development

### Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run test suite
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Project Structure

```
pathfinder/
├── src/                 # Source code
├── test/               # Test files
├── docs/               # Documentation
├── .github/            # GitHub workflows and templates
├── docker/             # Docker configuration
└── ...
```

## Deployment

### Docker

```bash
# Build Docker image
docker build -t pathfinder .

# Run container
docker run -p 3000:3000 pathfinder
```

### Cloud Deployment

The application is configured for deployment on:
- Google Cloud Run
- Firebase Hosting
- Docker containers

See `docs/deployment.md` for detailed deployment instructions.

## API Documentation

### Endpoints

- `GET /health` - Health check endpoint
- `POST /api/path/find` - Calculate path between points
- `GET /api/path/history` - Get path calculation history

See `docs/api.md` for complete API documentation.

## Contributing

We welcome contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md).

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run the test suite: `npm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## Security

- Authentication via Firebase Auth
- Rate limiting and input validation
- Secure environment variable management
- Regular security audits and dependency updates

Report security vulnerabilities to: security@pathfinder.dev

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/king-defender/pathfinder/issues)
- 💬 [Discussions](https://github.com/king-defender/pathfinder/discussions)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes and version history.

---

**Pathfinder** - Built with ❤️ for efficient navigation and routing.