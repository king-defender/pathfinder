# Docker Deployment

This guide covers deploying Pathfinder using Docker containers.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Dockerfile](#dockerfile)
- [Docker Compose](#docker-compose)
- [Production Deployment](#production-deployment)
- [Configuration](#configuration)
- [Monitoring](#monitoring)

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Minimum 2GB RAM
- Minimum 10GB disk space

## Dockerfile

Create a `Dockerfile` in the project root:

```dockerfile
# Multi-stage build for optimization
FROM node:18-alpine AS dependencies

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runtime

# Security: Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S pathfinder -u 1001

WORKDIR /app

# Copy dependencies
COPY --from=dependencies /app/node_modules ./node_modules

# Copy built application
COPY --from=build --chown=pathfinder:nodejs /app/dist ./dist
COPY --from=build --chown=pathfinder:nodejs /app/package*.json ./

# Security: Switch to non-root user
USER pathfinder

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
```

## Docker Compose

### Development Environment

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://pathfinder:password@db:5432/pathfinder
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run dev

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: pathfinder
      POSTGRES_USER: pathfinder
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app

volumes:
  postgres_data:
  redis_data:
```

### Production Environment

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      target: runtime
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/logs:/var/log/nginx
    depends_on:
      - app
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Production Deployment

### Build and Deploy

```bash
# Build production image
docker build -t pathfinder:latest .

# Tag for registry
docker tag pathfinder:latest your-registry.com/pathfinder:latest

# Push to registry
docker push your-registry.com/pathfinder:latest

# Deploy with compose
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Configuration

Create `.env.prod`:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@db-host:5432/pathfinder
REDIS_URL=redis://redis-host:6379
JWT_SECRET=your-production-jwt-secret
GOOGLE_MAPS_API_KEY=your-api-key
SENTRY_DSN=your-sentry-dsn
```

### Nginx Configuration

Create `nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    server {
        listen 80;
        server_name pathfinder.example.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name pathfinder.example.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Authentication routes
        location /auth/ {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static files
        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            access_log off;
            proxy_pass http://app;
        }
    }
}
```

## Configuration

### Multi-stage Build Optimization

```dockerfile
# .dockerignore
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.cache
.vscode
.github
docs
*.md
tests
```

### Security Hardening

```dockerfile
# Use specific version tags
FROM node:18.17.0-alpine

# Update packages
RUN apk update && apk upgrade

# Remove unnecessary packages
RUN apk del curl wget

# Set security options
RUN echo "pathfinder:x:1001:1001::/app:/sbin/nologin" >> /etc/passwd
```

## Monitoring

### Docker Health Checks

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

### Logging Configuration

```yaml
# docker-compose.yml
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        labels: "service=pathfinder"
```

### Monitoring with Prometheus

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  prometheus_data:
  grafana_data:
```

## Troubleshooting

### Common Issues

1. **Container won't start**
   ```bash
   # Check logs
   docker logs pathfinder-app

   # Check resource usage
   docker stats
   ```

2. **Database connection issues**
   ```bash
   # Test database connectivity
   docker exec -it pathfinder-db psql -U pathfinder -d pathfinder

   # Check network
   docker network ls
   docker network inspect pathfinder_default
   ```

3. **Memory issues**
   ```bash
   # Increase memory limits
   docker update --memory=2g pathfinder-app
   ```

### Performance Tuning

```yaml
# Optimize for production
services:
  app:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
    ulimits:
      nofile:
        soft: 65536
        hard: 65536
```

## Best Practices

1. **Use multi-stage builds** for smaller images
2. **Run as non-root user** for security
3. **Implement health checks** for reliability
4. **Use specific version tags** for consistency
5. **Configure resource limits** to prevent resource exhaustion
6. **Set up proper logging** for debugging
7. **Use secrets management** for sensitive data
8. **Regular security updates** for base images