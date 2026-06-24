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

# Step 2: Kill any processes holding ports we need
echo -e "${YELLOW}[2/7]${NC} Freeing ports..."
pkill -f "npm run dev" 2>/dev/null || true
fuser -k 5173/tcp 2>/dev/null || lsof -ti :5173 | xargs kill -9 2>/dev/null || true
sleep 1
echo -e "${GREEN}✓${NC} Ports cleared"
echo ""

# Step 3: Start React frontend 
echo -e "${YELLOW}[3/7]${NC} Starting React frontend..."
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
    echo -e "${RED}✗${NC} React project not found at $SCRIPT_DIR/frontend"
    exit 1
fi
echo ""

# Step 4: Kill any existing processes
echo -e "${YELLOW}[4/7]${NC} Cleaning up any existing processes..."
pkill -f "mqtt_subscriber.py" 2>/dev/null || true
pkill -f "mqtt_publisher.py" 2>/dev/null || true
pkill -f "web_server.py" 2>/dev/null || true
sleep 2
echo -e "${GREEN}✓${NC} Cleanup complete"
echo ""

# Step 5: Start MQTT Broker (CRITICAL - must run before backend services)
echo -e "${YELLOW}[5/7]${NC} Starting MQTT Broker..."
if pgrep -f mosquitto > /dev/null; then
    echo -e "${GREEN}✓${NC} MQTT Broker already running"
else
    echo "  • Checking MQTT Broker status..."
    MOSQUITTO_STARTED=false
    
    # Try to start with sudo (may need password)
    if sudo systemctl start mosquitto 2>/dev/null; then
        sleep 2
        if pgrep -f mosquitto > /dev/null; then
            echo -e "${GREEN}✓${NC} MQTT Broker started successfully"
            MOSQUITTO_STARTED=true
        fi
    fi
    
    # If sudo failed, provide helpful message
    if [ "$MOSQUITTO_STARTED" = false ]; then
        echo -e "${RED}✗${NC} MQTT Broker not running"
        echo ""
        echo "To fix this, open a NEW terminal and run:"
        echo "  sudo systemctl start mosquitto"
        echo ""
        echo "Or set up passwordless sudo (one time):"
        echo "  echo '$USER ALL=(ALL) NOPASSWD: /usr/sbin/mosquitto, /usr/bin/systemctl' | sudo tee /etc/sudoers.d/mosquitto"
        echo ""
        read -p "Press Enter after starting mosquitto in another terminal, or Ctrl+C to cancel..."
        
        # Check again
        if ! pgrep -f mosquitto > /dev/null; then
            echo -e "${RED}✗${NC} MQTT Broker still not running. Cannot continue."
            exit 1
        fi
        echo -e "${GREEN}✓${NC} MQTT Broker is now running"
    fi
fi
echo ""

# Verify MQTT is accessible
echo "  • Verifying MQTT Broker is accessible..."
for i in {1..5}; do
    if timeout 1 bash -c "cat < /dev/null > /dev/tcp/localhost/1883" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} MQTT Broker is accessible on port 1883"
        break
    fi
    if [ $i -lt 5 ]; then
        echo "  ⏳ MQTT not ready, retrying... ($i/5)"
        sleep 1
    else
        echo -e "${RED}✗${NC} MQTT Broker not accessible on port 1883"
        echo "  Possible fixes:"
        echo "    1. Restart mosquitto: sudo systemctl restart mosquitto"
        echo "    2. Check if mosquitto is installed: which mosquitto"
        exit 1
    fi
done
echo ""

# Step 6: Verify React dev server is ready
echo -e "${YELLOW}[6/7]${NC} Verifying React dev server..."
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
    echo -e "${YELLOW}⚠${NC} React dev server not ready, will use static build"
fi
echo ""
cd "$BACKEND_DIR"

echo "  • Starting MQTT Subscriber..."
$VENV_PYTHON mqtt_subscriber.py > /tmp/subscriber.log 2>&1 &
SUBSCRIBER_PID=$!
sleep 2

# Check if subscriber started successfully
if ! ps -p $SUBSCRIBER_PID > /dev/null 2>&1; then
    echo -e "${RED}✗${NC} MQTT Subscriber failed to start"
    echo "  Error log:"
    cat /tmp/subscriber.log | head -20
    exit 1
fi
echo -e "${GREEN}✓${NC} MQTT Subscriber started (PID: $SUBSCRIBER_PID)"

echo "  • Starting MQTT Publisher (sensor simulator)..."
$VENV_PYTHON mqtt_publisher.py > /tmp/publisher.log 2>&1 &
PUBLISHER_PID=$!
sleep 2

# Check if publisher started successfully
if ! ps -p $PUBLISHER_PID > /dev/null 2>&1; then
    echo -e "${RED}✗${NC} MQTT Publisher failed to start"
    echo "  Error log:"
    cat /tmp/publisher.log | head -20
    exit 1
fi
echo -e "${GREEN}✓${NC} MQTT Publisher started (PID: $PUBLISHER_PID)"

echo "  • Starting Web Server..."
$VENV_PYTHON web_server.py > /tmp/webserver.log 2>&1 &
WEBSERVER_PID=$!
sleep 5

# Check if web server started successfully
if ! ps -p $WEBSERVER_PID > /dev/null 2>&1; then
    echo -e "${RED}✗${NC} Web Server failed to start"
    echo "  Error log:"
    cat /tmp/webserver.log | head -30
    exit 1
fi
echo -e "${GREEN}✓${NC} Web Server started (PID: $WEBSERVER_PID)"
echo ""
echo -e "${GREEN}✓${NC} All backend services started successfully"
echo ""

# Step 7: Verify services
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
    echo "  Web Server logs:"
    cat /tmp/webserver.log | tail -30
    SERVICES_OK=false
fi

# Check API endpoint
if [ "$SERVICES_OK" = true ]; then
    # Check HTTP status code directly - 200 OK or 401 Unauthorized (auth required) both mean API is working
    HTTP_CODE=$(timeout 2 curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/devices 2>&1)
    if [[ "$HTTP_CODE" == "200" ]] || [[ "$HTTP_CODE" == "401" ]]; then
        echo -e "${GREEN}✓${NC} API endpoint responding (HTTP $HTTP_CODE - this is expected)"
    else
        echo -e "${RED}✗${NC} API endpoint error: HTTP $HTTP_CODE"
        SERVICES_OK=false
    fi
fi

echo ""
if [ "$SERVICES_OK" = true ]; then
    echo "============================================================================"
    echo -e "${GREEN}✓ SYSTEM READY${NC}"
    echo "============================================================================"
    echo ""
    echo -e "🎨 ${YELLOW}FRONTEND${NC}"
    if [ "$REACT_READY" = true ] || timeout 1 bash -c "cat < /dev/null > /dev/tcp/localhost/5173" 2>/dev/null; then
        echo "   • React + Vite (Dev Mode)"
    elif [ -d "$SCRIPT_DIR/frontend/dist" ]; then
        echo "   • React (Build Mode)"
    fi
    if timeout 1 bash -c "cat < /dev/null > /dev/tcp/localhost/5173" 2>/dev/null; then
        echo "   📦 Dev Server: http://localhost:5173"
    fi
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
    echo "   npm run dev  # in frontend directory"
    echo "============================================================================"
    echo ""
    
    # Keep script running, let user stop with Ctrl+C
    wait
else
    echo -e "${RED}✗ SYSTEM STARTUP FAILED${NC}"
    echo ""
    echo "Check logs:"
    echo "  • Web Server: cat /tmp/webserver.log"
    echo "  • Subscriber: cat /tmp/subscriber.log"
    echo "  • Publisher:  cat /tmp/publisher.log"
    echo ""
    echo "Common fixes:"
    echo "  1. Start MQTT Broker manually: sudo systemctl start mosquitto"
    echo "  2. Check port conflicts: lsof -i :5000 (backend) or lsof -i :1883 (MQTT)"
    echo "  3. Check Python venv: source .venv/bin/activate"
    echo ""
    exit 1
fi
