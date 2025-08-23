# Contributing to Pathfinder

Thank you for your interest in contributing to Pathfinder! We welcome contributions from the community and appreciate your help in making this project better.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Release Process](#release-process)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Set up the development environment
4. Create a feature branch
5. Make your changes
6. Test your changes
7. Submit a pull request

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Docker and Docker Compose (optional)
- Git

### Setup Steps

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/pathfinder.git
cd pathfinder

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development environment
npm run dev

# Or using Docker
docker-compose up
```

### Environment Configuration

Make sure to configure your `.env` file with appropriate values:

- Firebase configuration for authentication
- Database connection strings
- API keys for external services

## Making Changes

### Branch Naming

Use descriptive branch names:
- `feature/add-new-algorithm`
- `fix/memory-leak-in-pathfinding`
- `docs/update-api-documentation`
- `refactor/improve-error-handling`

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
feat: add A* algorithm implementation
fix: resolve memory leak in pathfinding service
docs: update API documentation for new endpoints
test: add unit tests for algorithm validation
refactor: improve error handling in route handlers
style: fix formatting and linting issues
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Maintain strict type checking
- Prefer interfaces over type aliases for object shapes
- Use proper JSDoc comments for public APIs

### Code Style

- Follow the existing ESLint and Prettier configurations
- Use meaningful variable and function names
- Keep functions small and focused (max 50 lines)
- Maximum complexity of 10 per function
- Use async/await instead of Promises when possible

### Security

- Never commit secrets or API keys
- Validate all user inputs
- Use parameterized queries for database operations
- Follow OWASP security guidelines

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run specific test file
npm test -- path/to/test.spec.ts
```

### Writing Tests

- Write unit tests for all new functions
- Include integration tests for API endpoints
- Add E2E tests for critical user workflows
- Aim for >80% code coverage
- Use descriptive test names that explain the scenario

### Test Structure

```typescript
describe('PathfindingService', () => {
  describe('findPath', () => {
    it('should find shortest path using A* algorithm', async () => {
      // Arrange
      const start = { lat: 0, lng: 0 };
      const end = { lat: 1, lng: 1 };
      
      // Act
      const result = await pathfindingService.findPath(start, end, 'astar');
      
      // Assert
      expect(result.path).toBeDefined();
      expect(result.distance).toBeGreaterThan(0);
    });
  });
});
```

## Submitting Changes

### Pull Request Process

1. **Update Documentation**: Ensure README, API docs, and comments are updated
2. **Add Tests**: Include tests for new functionality
3. **Check CI**: Ensure all CI checks pass
4. **Small PRs**: Keep pull requests focused and small
5. **Link Issues**: Reference any related issues in the PR description

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
```

### Review Process

- All submissions require review from maintainers
- Reviewers will check code quality, tests, and documentation
- Address feedback promptly and professionally
- Squash commits before merging (if requested)

## Development Workflow

### Local Development

```bash
# Start development server
npm run dev

# Run linting
npm run lint

# Fix linting issues
npm run lint --fix

# Format code
npm run format

# Type checking
npm run type-check
```

### Docker Development

```bash
# Start all services
docker-compose up

# Start specific service
docker-compose up app postgres redis

# View logs
docker-compose logs -f app

# Rebuild after changes
docker-compose up --build
```

## Release Process

Releases are handled by maintainers:

1. Version bump following [Semantic Versioning](https://semver.org/)
2. Update CHANGELOG.md
3. Create release tag
4. Automated deployment via GitHub Actions

## Getting Help

- 📖 Check the [documentation](docs/)
- 🐛 [Open an issue](https://github.com/king-defender/pathfinder/issues)
- 💬 [Start a discussion](https://github.com/king-defender/pathfinder/discussions)
- 📧 Email: contributors@pathfinder.dev

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Annual contributor spotlight

Thank you for contributing to Pathfinder! 🚀