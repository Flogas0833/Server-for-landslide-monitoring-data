#!/bin/bash

# ============================================================================
# Quick Deployment Script
# Usage: bash scripts/deploy.sh [staging|production] [digitalocean|heroku|lightsail|docker]
# ============================================================================

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
PLATFORM=${2:-docker}
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Functions
print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC} $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
}

print_step() {
    echo -e "${YELLOW}[*]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Pre-deployment checks
pre_deployment_checks() {
    print_header "Pre-Deployment Checks"
    
    print_step "Checking required files..."
    
    required_files=(
        ".env.example"
        "frontend/.env.example"
        "backend/web_server.py"
        "config/requirements_mqtt.txt"
    )
    
    for file in "${required_files[@]}"; do
        if [ -f "$PROJECT_DIR/$file" ]; then
            print_success "$file found"
        else
            print_error "$file not found"
            exit 1
        fi
    done
    
    # Check for .env files
    if [ ! -f "$PROJECT_DIR/.env" ]; then
        print_step "Creating .env from template..."
        cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
        print_error "Please update .env with your actual values"
        exit 1
    fi
    
    print_step "Checking for required tools..."
    
    case "$PLATFORM" in
        docker)
            if command -v docker &> /dev/null; then
                print_success "Docker found"
            else
                print_error "Docker not installed. Install from: https://docs.docker.com/get-docker/"
                exit 1
            fi
            if command -v docker-compose &> /dev/null; then
                print_success "Docker Compose found"
            else
                print_error "Docker Compose not installed"
                exit 1
            fi
            ;;
        lightsail)
            if command -v git &> /dev/null; then
                print_success "Git found"
            else
                print_error "Git not installed"
                exit 1
            fi
            ;;
    esac
    
    echo ""
}

# Build frontend
build_frontend() {
    print_header "Building Frontend"
    
    cd "$PROJECT_DIR/frontend"
    
    print_step "Installing dependencies..."
    npm install
    
    print_step "Building production bundle..."
    npm run build
    
    print_success "Frontend build completed"
    print_success "Output: frontend/dist/"
    
    cd "$PROJECT_DIR"
    echo ""
}

# Build backend
build_backend() {
    print_header "Building Backend"
    
    print_step "Creating Python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    
    print_step "Installing dependencies..."
    pip install -r config/requirements_mqtt.txt
    
    print_success "Backend setup completed"
    
    echo ""
}

# Deploy using Docker
deploy_docker() {
    print_header "Deploying with Docker"
    
    print_step "Building Docker image..."
    docker build -t landslide-monitoring:latest .
    
    print_success "Docker image built: landslide-monitoring:latest"
    
    print_step "Starting services with Docker Compose..."
    docker-compose up -d
    
    print_step "Waiting for services to be ready..."
    sleep 10
    
    print_step "Checking service health..."
    
    if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        print_success "Backend API is healthy"
    else
        print_error "Backend API health check failed"
        docker-compose logs backend
        exit 1
    fi
    
    if curl -f http://localhost/health > /dev/null 2>&1; then
        print_success "Nginx is healthy"
    else
        print_error "Nginx health check failed"
        docker-compose logs nginx
        exit 1
    fi
    
    print_header "Deployment Successful!"
    echo -e "${GREEN}Services are running:${NC}"
    echo "  • Frontend: http://localhost:3000 or http://localhost"
    echo "  • Backend API: http://localhost:5000"
    echo "  • MQTT Broker: mqtt://localhost:1883"
    echo ""
    echo "View logs:"
    echo "  docker-compose logs -f backend"
    echo "  docker-compose logs -f frontend"
    echo "  docker-compose logs -f mosquitto"
    echo ""
}

# Deploy to DigitalOcean
deploy_digitalocean() {
    print_header "Preparing for DigitalOcean Deployment"
    
    print_step "Checking for app.yaml..."
    if [ ! -f "$PROJECT_DIR/app.yaml" ]; then
        print_error "app.yaml not found"
        echo "Please create app.yaml based on the guide: docs/DEPLOYMENT_GUIDE.md"
        exit 1
    fi
    
    print_step "Ensuring all files are committed to Git..."
    if ! git diff-index --quiet HEAD --; then
        print_error "Uncommitted changes detected"
        echo "Please commit all changes before deploying:"
        echo "  git add ."
        echo "  git commit -m 'Prepare for deployment'"
        exit 1
    fi
    
    print_success "Ready for DigitalOcean deployment"
    echo ""
    echo "Next steps:"
    echo "  1. Go to https://cloud.digitalocean.com/"
    echo "  2. Click 'Create' → 'App Platform'"
    echo "  3. Connect your GitHub repository"
    echo "  4. Deploy from 'main' branch"
    echo ""
}

# Deploy to Heroku
deploy_heroku() {
    print_header "Deploying to Heroku"
    
    if ! command -v heroku &> /dev/null; then
        print_error "Heroku CLI not installed"
        echo "Install from: https://devcenter.heroku.com/articles/heroku-cli"
        exit 1
    fi
    
    print_step "Creating Heroku app..."
    APP_NAME="landslide-monitoring-$(date +%s)"
    heroku create "$APP_NAME"
    
    print_step "Setting environment variables..."
    heroku config:set -a "$APP_NAME" FLASK_ENV=production
    heroku config:set -a "$APP_NAME" JWT_SECRET_KEY="$(openssl rand -base64 32)"
    
    print_step "Deploying..."
    git push heroku main
    
    print_success "Deployment completed!"
    echo ""
    echo "Your app is now live at: https://$APP_NAME.herokuapp.com"
    echo "View logs: heroku logs -a $APP_NAME --tail"
    echo ""
}

# Main deployment logic
main() {
    print_header "Landslide Monitoring System - Deployment Script"
    echo -e "${YELLOW}Environment: ${ENVIRONMENT}${NC}"
    echo -e "${YELLOW}Platform: ${PLATFORM}${NC}"
    echo ""
    
    # Run pre-deployment checks
    pre_deployment_checks
    
    # Build projects
    build_frontend
    build_backend
    
    # Deploy based on platform
    case "$PLATFORM" in
        docker)
            deploy_docker
            ;;
        digitalocean)
            deploy_digitalocean
            ;;
        heroku)
            deploy_heroku
            ;;
        lightsail)
            print_error "Lightsail deployment requires manual setup"
            echo "Follow the guide: docs/DEPLOYMENT_GUIDE.md (PHƯƠNG ÁN 2)"
            exit 1
            ;;
        *)
            print_error "Unknown platform: $PLATFORM"
            echo "Supported platforms: docker, digitalocean, heroku, lightsail"
            exit 1
            ;;
    esac
}

# Show usage if requested
if [ "$ENVIRONMENT" = "help" ] || [ "$ENVIRONMENT" = "-h" ] || [ "$ENVIRONMENT" = "--help" ]; then
    echo "Usage: bash scripts/deploy.sh [ENVIRONMENT] [PLATFORM]"
    echo ""
    echo "ENVIRONMENT:"
    echo "  staging       - Deploy to staging environment"
    echo "  production    - Deploy to production environment"
    echo ""
    echo "PLATFORM:"
    echo "  docker        - Deploy using Docker (local/server)"
    echo "  digitalocean  - Deploy to DigitalOcean App Platform"
    echo "  heroku        - Deploy to Heroku"
    echo "  lightsail     - Deploy to AWS Lightsail (manual)"
    echo ""
    echo "Examples:"
    echo "  bash scripts/deploy.sh staging docker"
    echo "  bash scripts/deploy.sh production digitalocean"
    echo ""
    exit 0
fi

# Run main deployment
main
