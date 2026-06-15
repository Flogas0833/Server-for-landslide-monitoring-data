#!/bin/bash

# Start script for Landslide Monitoring System
# Runs database initialization, then starts Flask with Gunicorn

set -e

echo "🚀 Starting Landslide Monitoring System..."
echo ""

# Initialize and seed database
echo "📊 Initializing database..."

# Run seed script to populate initial data if needed
python seed_initial_data.py

echo ""
echo "✅ Database initialization complete"
echo ""

# Start Flask application with Gunicorn
echo "🌐 Starting Flask application..."
exec gunicorn --bind 0.0.0.0:5000 --workers 4 --timeout 120 backend.web_server:app
