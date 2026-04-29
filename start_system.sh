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
VENV_PYTHON="$SCRIPT_DIR/.venv/bin/python"

# Check if venv Python exists, otherwise use system python3
if [ ! -f "$VENV_PYTHON" ]; then
    echo "⚠️  Virtual environment not found. Using system python3..."
    VENV_PYTHON="python3"
fi

echo "============================================================================"
echo "🚀 LANDSLIDE MONITORING SYSTEM - STARTUP"
echo "============================================================================"
echo "Python: $VENV_PYTHON"
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
echo -e "${YELLOW}[1/7]${NC} Preparing database directory..."
mkdir -p "$DATABASE_DIR"
echo -e "${GREEN}✓${NC} Database directory ready"
echo ""

# Step 1.5: Kill any processes holding ports we need
echo -e "${YELLOW}[1.5/7]${NC} Freeing ports..."
pkill -f "npm run dev" 2>/dev/null || true
fuser -k 5173/tcp 2>/dev/null || lsof -ti :5173 | xargs kill -9 2>/dev/null || true
sleep 1
echo -e "${GREEN}✓${NC} Ports cleared"
echo ""

# Step 2: Start React frontend 
echo -e "${YELLOW}[2/7]${NC} Starting React frontend..."
cd "$SCRIPT_DIR/frontend"
if [ -f "package.json" ]; then
    echo "  • Starting dev server on http://localhost:5173..."
    npm run dev > /tmp/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "  ⏳ Waiting for React dev server to be ready..."
    for i in {1..15}; do
        if timeout 1 bash -c "cat < /dev/null > /dev/tcp/localhost/5173" 2>/dev/null; then
            echo "  ✓ React dev server is listening!"
            sleep 2
            break
        fi
        if [ $i -lt 15 ]; then
            sleep 1
        fi
    done
    echo -e "${GREEN}✓${NC} React frontend started"
else
    echo -e "${YELLOW}⚠${NC} React project not found, using HTML CSS frontend"
fi
echo ""

# Step 3: Kill any existing processes
echo -e "${YELLOW}[3/7]${NC} Cleaning up any existing processes..."
pkill -f "mqtt_subscriber.py" 2>/dev/null || true
pkill -f "mqtt_publisher.py" 2>/dev/null || true
pkill -f "web_server.py" 2>/dev/null || true
sleep 2
echo -e "${GREEN}✓${NC} Cleanup complete"
echo ""

# Step 4: Start MQTT Broker
echo -e "${YELLOW}[4/7]${NC} Starting MQTT Broker..."
if pgrep -f mosquitto > /dev/null; then
    echo -e "${GREEN}✓${NC} MQTT Broker already running"
else
    echo "  • Attempting to start MQTT Broker..."
    if sudo -n systemctl start mosquitto 2>/dev/null; then
        sleep 1
        echo -e "${GREEN}✓${NC} MQTT Broker started"
    else
        echo -e "${YELLOW}⚠${NC} Could not start mosquitto (requires sudo). Please ensure mosquitto is running."
        echo "  Run: sudo systemctl start mosquitto"
    fi
fi
echo ""

# Step 5: Verify React dev server is ready
echo -e "${YELLOW}[5/7]${NC} Verifying React dev server..."
REACT_READY=false
for i in {1..10}; do
    if timeout 1 bash -c "cat < /dev/null > /dev/tcp/localhost/5173" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} React dev server is ready on port 5173"
        REACT_READY=true
        break
    fi
    if [ $i -lt 10 ]; then
        echo "  ⏳ Waiting for React dev server... (attempt $i/10)"
        sleep 1
    fi
done

if [ "$REACT_READY" = false ]; then
    echo -e "${YELLOW}⚠${NC} React dev server not ready, will use Vanilla JS frontend"
fi
echo ""

# Step 5: Start backend services
echo -e "${YELLOW}[6/7]${NC} Starting backend services..."
cd "$BACKEND_DIR"

echo "  • Starting MQTT Subscriber..."
$VENV_PYTHON mqtt_subscriber.py > /tmp/subscriber.log 2>&1 &
sleep 2

echo "  • Starting MQTT Publisher (sensor simulator)..."
$VENV_PYTHON mqtt_publisher.py > /tmp/publisher.log 2>&1 &
sleep 2

echo "  • Starting Web Server..."
$VENV_PYTHON web_server.py > /tmp/webserver.log 2>&1 &
sleep 5

echo -e "${GREEN}✓${NC} All backend services started"
echo ""

# Step 6: Verify services
echo -e "${YELLOW}[7/7]${NC} Verifying services..."
SERVICES_OK=true
MAX_RETRIES=10
RETRY_COUNT=0

# Check if web server is responding
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if timeout 2 curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Web Server responding on http://localhost:5000"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        echo "  ⏳ Waiting for web server... (attempt $RETRY_COUNT/$MAX_RETRIES)"
        sleep 1
    fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}✗${NC} Web Server not responding after $MAX_RETRIES attempts"
    SERVICES_OK=false
fi

# Check API endpoint
if [ "$SERVICES_OK" = true ]; then
    if timeout 2 curl -s http://localhost:5000/api/devices > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} API endpoint responding"
    else
        echo -e "${RED}✗${NC} API endpoint not responding"
        SERVICES_OK=false
    fi
fi

echo ""
if [ "$SERVICES_OK" = true ]; then
    echo "============================================================================"
    echo -e "${GREEN}✓ SYSTEM READY${NC}"
    echo "============================================================================"
    echo ""
    echo -e "🎨 ${YELLOW}USING FRONTEND${NC}"
    if [ "$REACT_READY" = true ] || timeout 1 bash -c "cat < /dev/null > /dev/tcp/localhost/5173" 2>/dev/null; then
        echo "   React + Vite"
    elif [ -d "$SCRIPT_DIR/frontend/dist" ]; then
        echo "   React + TanStack (Modern Build)"
    else
        echo "   Vanilla JavaScript (Legacy)"
    fi
    echo "   📦 Dev Server: http://localhost:5173"
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
