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

# Build production bundle with increased memory
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN npm run build

# Stage 2: Backend runtime
FROM python:3.11-slim

WORKDIR /app

# Set environment to avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install only essential system dependencies (minimal)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

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
RUN mkdir -p logs && mkdir -p database

# Copy environment template
COPY .env.example .env

# Expose port (Railway will proxy)
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Start Flask app with Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--timeout", "120", "backend.web_server:app"]
