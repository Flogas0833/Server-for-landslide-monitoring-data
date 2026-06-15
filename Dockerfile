# ============================================================================
# Multi-stage Dockerfile for Landslide Monitoring System
# Build: docker build -t landslide-monitoring .
# Run:   docker run -p 5000:5000 -p 3000:3000 landslide-monitoring
# ============================================================================

# Stage 1: Frontend build
FROM node:22-slim AS frontend-builder

WORKDIR /app/frontend

# Copy package.json
COPY frontend/package.json ./

# Install dependencies
RUN npm install --legacy-peer-deps --production=false

# Copy frontend source
COPY frontend/ .

# Build production bundle with increased memory
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Backend runtime
FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install Python dependencies
COPY config/requirements_mqtt.txt ./requirements.txt
RUN pip install --upgrade pip setuptools wheel && \
    pip install --no-cache-dir --default-timeout=120 --retries 3 -r requirements.txt

# Copy backend code
COPY backend/ ./backend/
COPY config/ ./config/
COPY database/ ./database/
COPY seed_initial_data.py ./
COPY docker-entrypoint.sh ./

# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create necessary directories
RUN mkdir -p logs && mkdir -p database

# Initialize database with seed data (optional - can be done at runtime)
# Uncomment to pre-seed database during build:
# RUN cd /app && python -c "from backend.db_init import initialize_app_database; initialize_app_database()"

# Copy environment template
COPY .env.example .env

# Make entrypoint script executable
RUN chmod +x /app/docker-entrypoint.sh

# Expose port (Railway will proxy)
EXPOSE 5000

# Health check using Python (no curl dependency)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/api/health', timeout=5)"

# Run entrypoint script which seeds database and starts Flask
ENTRYPOINT ["/app/docker-entrypoint.sh"]
