# Contributing to Pathfinder

Thank you for your interest in contributing to Pathfinder! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- Be respectful and inclusive
- Use welcoming and inclusive language
- Be collaborative and constructive
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git
- Docker (for containerized development)

### Setting Up Development Environment

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/pathfinder.git
   cd pathfinder
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming Convention

- `feature/description` - for new features
- `fix/description` - for bug fixes
- `docs/description` - for documentation updates
- `refactor/description` - for code refactoring
- `test/description` - for test improvements

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

Examples:
```
feat(auth): add JWT token validation
fix(api): resolve path calculation edge case
docs: update API documentation
test(algorithms): add unit tests for A* algorithm
```

## Coding Standards

### JavaScript/TypeScript

- Use ES6+ features where appropriate
- Follow ESLint configuration
- Use meaningful variable and function names
- Write self-documenting code with minimal comments
- Prefer functional programming patterns

### Code Style

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Max line length: 100 characters
- Use trailing commas in multiline structures

### Documentation

- Document all public APIs
- Include JSDoc comments for functions and classes
- Update README for significant changes
- Maintain changelog for releases

## Testing

### Test Categories

1. **Unit Tests**: Test individual functions and modules
2. **Integration Tests**: Test component interactions
3. **End-to-End Tests**: Test complete user workflows

### Writing Tests

- Write tests for all new features
- Maintain or improve test coverage
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- path/to/test/file

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Pull Request Process

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Follow coding standards
   - Write tests for new functionality
   - Update documentation as needed

3. **Test Your Changes**
   ```bash
   npm run lint
   npm test
   npm run build
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Use the PR template
   - Provide clear description of changes
   - Reference related issues
   - Request review from maintainers

### Pull Request Requirements

- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation updated if needed
- [ ] Changelog updated for significant changes
- [ ] No breaking changes (or clearly documented)
- [ ] Self-review completed

## Issue Reporting

### Bug Reports

Use the bug report template and include:

- Clear, descriptive title
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node.js version, etc.)
- Error messages or logs
- Screenshots if applicable

### Feature Requests

Use the feature request template and include:

- Clear description of the feature
- Use case and motivation
- Proposed implementation (if applicable)
- Alternative solutions considered

### Security Issues

Do not create public issues for security vulnerabilities. Instead:

1. Email the maintainers directly
2. Provide detailed description
3. Include steps to reproduce
4. Allow time for fix before disclosure

## Development Resources

### Useful Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # Run linter
npm run lint:fix        # Fix linting issues
npm run format          # Format code
npm run type-check      # TypeScript type checking

# Testing
npm run test            # Run tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
npm run test:e2e        # End-to-end tests

# Database
npm run db:migrate      # Run migrations
npm run db:seed         # Seed database
npm run db:reset        # Reset database

# Docker
npm run docker:build    # Build Docker image
npm run docker:run      # Run Docker container
npm run docker:test     # Run tests in Docker
```

### Project Structure

```
pathfinder/
├── src/                 # Source code
├── tests/              # Test files
├── docs/               # Documentation
├── deployment/         # Deployment configs
├── scripts/            # Build and utility scripts
└── .github/            # GitHub templates and workflows
```

## Questions and Support

- Check existing issues and discussions
- Create new issue for bugs or feature requests
- Join community discussions
- Contact maintainers for urgent matters

Thank you for contributing to Pathfinder! 🚀