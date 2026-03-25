#!/bin/bash

# =============================================================================
# Landslide Monitoring System - Start All Services
# =============================================================================
# This script starts all components: MQTT Broker, Publisher, Subscriber, 
# Web Server, and opens the interactive map in your browser
# =============================================================================

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend"
DATABASE_DIR="$SCRIPT_DIR/database"

echo "============================================================================"
echo "🚀 LANDSLIDE MONITORING SYSTEM - STARTUP"
echo "============================================================================"
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if ports are available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port in use
    else
        return 1  # Port available
    fi
}

# Step 1: Ensure database directory exists
echo -e "${YELLOW}[1/5]${NC} Preparing database directory..."
mkdir -p "$DATABASE_DIR"
echo -e "${GREEN}✓${NC} Database directory ready"
echo ""

# Step 2: Kill any existing processes
echo -e "${YELLOW}[2/5]${NC} Cleaning up any existing processes..."
pkill -f "mqtt_subscriber.py" 2>/dev/null || true
pkill -f "mqtt_publisher.py" 2>/dev/null || true
pkill -f "web_server.py" 2>/dev/null || true
sleep 2
echo -e "${GREEN}✓${NC} Cleanup complete"
echo ""

# Step 3: Start MQTT Broker
echo -e "${YELLOW}[3/5]${NC} Starting MQTT Broker..."
if sudo systemctl is-active --quiet mosquitto; then
    echo -e "${GREEN}✓${NC} MQTT Broker already running"
else
    sudo systemctl start mosquitto
    sleep 1
    echo -e "${GREEN}✓${NC} MQTT Broker started"
fi
echo ""

# Step 4: Start backend services
echo -e "${YELLOW}[4/5]${NC} Starting backend services..."
cd "$BACKEND_DIR"

echo "  • Starting MQTT Subscriber..."
python3 mqtt_subscriber.py > /tmp/subscriber.log 2>&1 &
sleep 2

echo "  • Starting MQTT Publisher (sensor simulator)..."
python3 mqtt_publisher.py > /tmp/publisher.log 2>&1 &
sleep 2

echo "  • Starting Web Server..."
python3 web_server.py > /tmp/webserver.log 2>&1 &
sleep 5

echo -e "${GREEN}✓${NC} All backend services started"
echo ""

# Step 5: Verify services
echo -e "${YELLOW}[5/5]${NC} Verifying services..."
SERVICES_OK=true

# Check if web server is responding
if timeout 2 curl -s http://localhost:5000/ > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Web Server responding on http://localhost:5000"
else
    echo -e "${RED}✗${NC} Web Server not responding"
    SERVICES_OK=false
fi

# Check API endpoint
if timeout 2 curl -s http://localhost:5000/api/devices > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} API endpoint responding"
else
    echo -e "${RED}✗${NC} API endpoint not responding"
    SERVICES_OK=false
fi

echo ""
if [ "$SERVICES_OK" = true ]; then
    echo "============================================================================"
    echo -e "${GREEN}✓ SYSTEM READY${NC}"
    echo "============================================================================"
    echo ""
    echo -e "📍 ${YELLOW}INTERACTIVE MAP${NC}"
    echo "   http://localhost:5000/"
    echo ""
    echo -e "📊 ${YELLOW}DASHBOARD${NC}"
    echo "   http://localhost:5000/dashboard"
    echo ""
    echo -e "📡 ${YELLOW}API ENDPOINT${NC}"
    echo "   http://localhost:5000/api/devices"
    echo ""
    echo -e "📝 ${YELLOW}LOGS${NC}"
    echo "   MQTT Subscriber: tail -f /tmp/subscriber.log"
    echo "   MQTT Publisher:  tail -f /tmp/publisher.log"
    echo "   Web Server:      tail -f /tmp/webserver.log"
    echo ""
    echo "🌐 Opening map in browser..."
    
    # Try to open in default browser
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:5000/ 2>/dev/null &
    elif command -v open &> /dev/null; then
        open http://localhost:5000/ 2>/dev/null &
    elif command -v sensible-browser &> /dev/null; then
        sensible-browser http://localhost:5000/ 2>/dev/null &
    fi
    
    echo ""
    echo "============================================================================"
    echo -e "⏹️ ${YELLOW}TO STOP THE SYSTEM${NC}, press Ctrl+C or run:"
    echo "   pkill -f 'mqtt_subscriber.py'"
    echo "   pkill -f 'mqtt_publisher.py'"
    echo "   pkill -f 'web_server.py'"
    echo "============================================================================"
    echo ""
    
    # Keep script running, let user stop with Ctrl+C
    wait
else
    echo -e "${RED}✗ SYSTEM STARTUP FAILED${NC}"
    echo ""
    echo "Check logs:"
    echo "  cat /tmp/webserver.log"
    echo "  cat /tmp/subscriber.log"
    echo "  cat /tmp/publisher.log"
    exit 1
fi
