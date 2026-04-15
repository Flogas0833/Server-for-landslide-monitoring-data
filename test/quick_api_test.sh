#!/bin/bash

# Quick Start Guide for Enhanced APIs
# Run this script to test all new API functionality

echo "=========================================="
echo "  Enhanced API Quick Testing"
echo "=========================================="
echo ""

BASE_URL="http://localhost:5000"

# Function to make requests and display results
test_endpoint() {
    local name=$1
    local url=$2
    echo ""
    echo "📌 $name"
    echo "URL: $url"
    echo "---"
    curl -s "$url" | python -m json.tool | head -30
    echo ""
}

# Wait for server to be ready
echo "⏳ Waiting for server to be ready..."
sleep 2

# Test 1: Health Check
test_endpoint "1. Health Check" "$BASE_URL/api/health"

# Test 2: Get All Devices
test_endpoint "2. List All Devices" "$BASE_URL/api/devices"

# Test 3: Statistics
test_endpoint "3. System Statistics" "$BASE_URL/api/statistics"

# Test 4: Sensor Data with Pagination
test_endpoint "4. Sensor Data (Tilt) - Page 1, Limit 5" \
    "$BASE_URL/api/sensor/tilt?limit=5&offset=0"

# Test 5: Sensor History with Filtering
TODAY=$(date -u +"%Y-%m-%dT00:00:00")
TOMORROW=$(date -u -d "+1 day" +"%Y-%m-%dT23:59:59")

test_endpoint "5. Sensor History - Rainfall (Today)" \
    "$BASE_URL/api/sensor-history?sensor_type=rainfall&start_date=$TODAY&end_date=$TOMORROW&limit=5"

# Test 6: Export to CSV
echo ""
echo "📌 6. Export to CSV"
CSV_FILE="/tmp/sensor_export_$(date +%s).csv"
curl -s "$BASE_URL/api/export/csv?sensor_type=temperature&limit=10" -o "$CSV_FILE"
echo "✅ CSV exported to: $CSV_FILE"
echo "Preview:"
head -5 "$CSV_FILE"

# Test 7: Export to JSON
echo ""
echo "📌 7. Export to JSON"
JSON_FILE="/tmp/sensor_export_$(date +%s).json"
curl -s "$BASE_URL/api/export/json?sensor_type=vibration&limit=5" -o "$JSON_FILE"
echo "✅ JSON exported to: $JSON_FILE"
echo "Preview:"
head -20 "$JSON_FILE"

echo ""
echo "=========================================="
echo "  ✅ Quick Test Complete!"
echo "=========================================="
echo ""
echo "📚 For detailed documentation, see:"
echo "   - docs/API_DOCUMENTATION.md (English)"
echo "   - docs/API_DOCUMENTATION_VI.md (Vietnamese)"
echo ""
echo "🧪 To run comprehensive tests:"
echo "   python test/test_api_endpoints.py"
echo ""
