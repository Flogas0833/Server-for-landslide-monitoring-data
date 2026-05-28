# ============================================================================
# Multi-stage Dockerfile for Landslide Monitoring System
# Build: docker build -t landslide-monitoring .
# Run:   docker run -p 5000:5000 -p 3000:3000 landslide-monitoring
# ============================================================================

# Stage 1: Frontend build
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy frontend source
COPY frontend/ .

# Build production bundle
RUN npm run build

# Stage 2: Backend runtime
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    mosquitto-clients \
    supervisor \
    nginx \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY config/requirements_mqtt.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy backend code
COPY backend/ ./backend/
COPY config/ ./config/
COPY database/ ./database/

# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create necessary directories
RUN mkdir -p logs && mkdir -p database && mkdir -p /var/log/supervisor

# Copy configuration files
COPY docker/nginx.conf /etc/nginx/sites-available/default
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Copy environment template
COPY .env.example .env

# Expose ports
EXPOSE 5000 3000 80 443 1883

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Start services
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
