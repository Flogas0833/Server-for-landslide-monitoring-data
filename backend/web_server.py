"""
Web Server - Flask API for sensor data and OpenStreetMap visualization
Provides REST endpoints and serves the interactive map frontend
"""

from flask import Flask, render_template, jsonify, request, Response, send_from_directory
from flask_cors import CORS
from database import SensorDatabase
from alert_manager import AlertManager, DangerLevel
import os
from datetime import datetime, timedelta
import csv
import io
import json
import requests
from urllib.parse import urljoin

# Check if React build exists, otherwise fallback to old frontend
REACT_BUILD_DIR = os.path.join(os.path.dirname(__file__), '..', 'frontend-react', 'dist')
REACT_DEV_SERVER = 'http://localhost:5173'
OLD_FRONTEND_DIR = os.path.join(os.path.dirname(__file__), '..', 'frontend')
OLD_STATIC_DIR = os.path.join(OLD_FRONTEND_DIR, 'static')

# Detect which frontend to use
REACT_MODE = os.path.exists(REACT_BUILD_DIR)
print(f"DEBUG: Checking for React build at {REACT_BUILD_DIR}: {REACT_MODE}")

if not REACT_MODE:
    # Check if React dev server is running
    try:
        response = requests.get(REACT_DEV_SERVER, timeout=2)
        REACT_MODE = True
        print(f"✅ React dev server detected at {REACT_DEV_SERVER}")
    except Exception as e:
        print(f"DEBUG: React dev server not found at {REACT_DEV_SERVER}: {e}")
        pass

print(f"DEBUG: REACT_MODE = {REACT_MODE}")

# Use React if available, otherwise use old frontend
if REACT_MODE and os.path.exists(REACT_BUILD_DIR):
    print("ℹ️ Using React BUILD mode (static files from dist/)")
    app = Flask(__name__, static_folder=REACT_BUILD_DIR, static_url_path='/')
    REACT_BUILD_MODE = True
    REACT_DEV_MODE = False
elif REACT_MODE:
    print("ℹ️ Using React DEV mode (proxying to dev server)")
    app = Flask(__name__, static_url_path='/')
    REACT_BUILD_MODE = False
    REACT_DEV_MODE = True
else:
    print("ℹ️ Using OLD Vanilla JS frontend")
    app = Flask(__name__, template_folder=OLD_FRONTEND_DIR, static_folder=OLD_STATIC_DIR)
    REACT_BUILD_MODE = False
    REACT_DEV_MODE = False

CORS(app)

# Initialize database
db = SensorDatabase()

# Initialize alert manager
alert_manager = AlertManager()

# ============ API ENDPOINTS ============

@app.route('/api/devices', methods=['GET'])
def get_devices():
    """Get all devices with latest locations"""
    try:
        devices = db.get_all_devices()
        
        # Filter and enhance devices with location data
        devices_with_location = []
        for device in devices:
            # Get latest GNSS reading for this device
            gnss_lat = device.get('latitude')
            gnss_lon = device.get('longitude')
            gnss_alt = device.get('altitude')
            
            # Include device even if coordinates are not yet available
            # (they will be populated from GNSS sensor readings)
            device_info = {
                'device_id': device['device_id'],
                'project_id': device['project_id'],
                'site_id': device['site_id'],
                'latitude': float(gnss_lat) if gnss_lat else None,
                'longitude': float(gnss_lon) if gnss_lon else None,
                'altitude': float(gnss_alt) if gnss_alt else None,
                'name': device['name'] or device['device_id'],
                'status': device['status'],
                'alert_status': device.get('alert_status', 'normal'),  # Add alert status
                'last_update': device['last_update']
            }
            
            # Only include if we have at least latitude and longitude
            if device_info['latitude'] is not None and device_info['longitude'] is not None:
                devices_with_location.append(device_info)
        
        return jsonify({'status': 'ok', 'devices': devices_with_location})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/devices/public', methods=['GET'])
def get_devices_public():
    """Get all devices with latest locations (PUBLIC - no auth required)"""
    try:
        devices = db.get_all_devices()
        
        # Filter and enhance devices with location data
        devices_with_location = []
        for device in devices:
            # Get latest GNSS reading for this device
            gnss_lat = device.get('latitude')
            gnss_lon = device.get('longitude')
            gnss_alt = device.get('altitude')
            
            # Include device even if coordinates are not yet available
            # (they will be populated from GNSS sensor readings)
            device_info = {
                'device_id': device['device_id'],
                'project_id': device['project_id'],
                'site_id': device['site_id'],
                'latitude': float(gnss_lat) if gnss_lat else None,
                'longitude': float(gnss_lon) if gnss_lon else None,
                'altitude': float(gnss_alt) if gnss_alt else None,
                'name': device['name'] or device['device_id'],
                'status': device['status'],
                'alert_status': device.get('alert_status', 'normal'),
                'last_update': device['last_update']
            }
            
            devices_with_location.append(device_info)
        
        return jsonify({'status': 'ok', 'devices': devices_with_location}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/device/<device_id>', methods=['GET'])
def get_device_detail(device_id):
    """Get detail of a specific device"""
    try:
        location = db.get_device_location(device_id)
        if not location:
            return jsonify({'error': 'Device not found'}), 404
        
        # Get latest readings for all sensor types
        readings = {
            'tilt': db.get_latest_readings(device_id, 'tilt', 1),
            'vibration': db.get_latest_readings(device_id, 'vibration', 1),
            'displacement': db.get_latest_readings(device_id, 'displacement', 1),
            'rainfall': db.get_latest_readings(device_id, 'rainfall', 1),
            'temperature': db.get_latest_readings(device_id, 'temperature', 1),
            'gnss': db.get_latest_readings(device_id, 'gnss', 1)
        }
        
        return jsonify({
            'location': dict(location),
            'readings': readings
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/sensor/<sensor_type>', methods=['GET'])
def get_sensor_data(sensor_type):
    """Get latest readings for a sensor type with pagination"""
    try:
        limit = request.args.get('limit', 100, type=int)
        offset = request.args.get('offset', 0, type=int)
        device_id = request.args.get('device_id', None, type=str)
        start_date = request.args.get('start_date', None, type=str)
        end_date = request.args.get('end_date', None, type=str)
        
        # Validate limit
        limit = min(limit, 1000)  # Max 1000 records per request
        
        result = db.get_readings_with_filters(
            sensor_type=sensor_type,
            device_id=device_id,
            start_date=start_date,
            end_date=end_date,
            limit=limit,
            offset=offset
        )
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    """Get statistics about devices and sensors"""
    try:
        devices = db.get_all_devices()
        devices_with_location = [d for d in devices if d.get('latitude') and d.get('longitude')]
        
        stats = {
            'total_devices': len(devices),
            'active_devices': len(devices_with_location),
            'sensor_types': ['tilt', 'vibration', 'displacement', 'rainfall', 'temperature', 'gnss'],
            'first_device_update': min([d.get('last_update') for d in devices_with_location]) 
                                   if devices_with_location else None,
            'last_device_update': max([d.get('last_update') for d in devices_with_location])
                                   if devices_with_location else None
        }
        
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/sensor-history', methods=['GET'])
def get_sensor_history():
    """Get sensor readings with advanced filtering and pagination
    
    Query Parameters:
    - sensor_type: Type of sensor (tilt, vibration, displacement, rainfall, temperature, gnss)
    - device_id: Filter by specific device
    - start_date: ISO format (2026-04-01T00:00:00)
    - end_date: ISO format (2026-04-08T23:59:59)
    - limit: Records per page (default: 50, max: 1000)
    - offset: Pagination offset (default: 0)
    """
    try:
        sensor_type = request.args.get('sensor_type', None, type=str)
        device_id = request.args.get('device_id', None, type=str)
        start_date = request.args.get('start_date', None, type=str)
        end_date = request.args.get('end_date', None, type=str)
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        # Validate limit
        limit = min(max(limit, 1), 1000)  # Between 1 and 1000
        offset = max(offset, 0)
        
        if not sensor_type:
            return jsonify({'error': 'sensor_type parameter is required'}), 400
        
        result = db.get_readings_with_filters(
            sensor_type=sensor_type,
            device_id=device_id,
            start_date=start_date,
            end_date=end_date,
            limit=limit,
            offset=offset
        )
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/export/csv', methods=['GET'])
def export_sensor_csv():
    """Export sensor data as CSV file
    
    Query Parameters:
    - sensor_type: Type of sensor (required)
    - device_id: Filter by specific device (optional)
    - start_date: ISO format start date (optional)
    - end_date: ISO format end date (optional)
    - filename: Custom filename (optional, default: sensor_data.csv)
    """
    try:
        sensor_type = request.args.get('sensor_type', None, type=str)
        device_id = request.args.get('device_id', None, type=str)
        start_date = request.args.get('start_date', None, type=str)
        end_date = request.args.get('end_date', None, type=str)
        filename = request.args.get('filename', 'sensor_data', type=str)
        
        if not sensor_type:
            return jsonify({'error': 'sensor_type parameter is required'}), 400
        
        # Get all matching readings (no pagination for export)
        readings = db.get_all_readings_for_export(
            sensor_type=sensor_type,
            device_id=device_id,
            start_date=start_date,
            end_date=end_date
        )
        
        if not readings:
            return jsonify({'message': 'No data found for export', 'records': 0}), 200
        
        # Create CSV in memory
        si = io.StringIO()
        fieldnames = ['device_id', 'sensor_type', 'timestamp', 'unit', 'quality', 'created_at']
        
        # Add dynamic fields from first reading's data
        if readings and readings[0].get('data'):
            data_keys = list(readings[0]['data'].keys())
            fieldnames.extend(data_keys)
        
        writer = csv.DictWriter(si, fieldnames=fieldnames)
        writer.writeheader()
        
        for reading in readings:
            row = {
                'device_id': reading['device_id'],
                'sensor_type': reading['sensor_type'],
                'timestamp': reading['timestamp'],
                'unit': reading.get('unit', ''),
                'quality': reading.get('quality', ''),
                'created_at': reading.get('created_at', '')
            }
            # Flatten nested data dict
            if isinstance(reading.get('data'), dict):
                row.update(reading['data'])
            
            writer.writerow(row)
        
        csv_content = si.getvalue()
        si.close()
        
        # Return as downloadable file
        return Response(
            csv_content,
            mimetype='text/csv',
            headers={'Content-Disposition': f'attachment; filename="{filename}.csv"'}
        )
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/export/json', methods=['GET'])
def export_sensor_json():
    """Export sensor data as JSON file
    
    Query Parameters:
    - sensor_type: Type of sensor (required)
    - device_id: Filter by specific device (optional)
    - start_date: ISO format start date (optional)
    - end_date: ISO format end date (optional)
    - filename: Custom filename (optional, default: sensor_data.json)
    """
    try:
        sensor_type = request.args.get('sensor_type', None, type=str)
        device_id = request.args.get('device_id', None, type=str)
        start_date = request.args.get('start_date', None, type=str)
        end_date = request.args.get('end_date', None, type=str)
        filename = request.args.get('filename', 'sensor_data', type=str)
        
        if not sensor_type:
            return jsonify({'error': 'sensor_type parameter is required'}), 400
        
        # Get all matching readings (no pagination for export)
        readings = db.get_all_readings_for_export(
            sensor_type=sensor_type,
            device_id=device_id,
            start_date=start_date,
            end_date=end_date
        )
        
        export_data = {
            'export_timestamp': datetime.now().isoformat(),
            'filters': {
                'sensor_type': sensor_type,
                'device_id': device_id,
                'start_date': start_date,
                'end_date': end_date
            },
            'total_records': len(readings),
            'data': readings
        }
        
        json_content = json.dumps(export_data, indent=2)
        
        # Return as downloadable file
        return Response(
            json_content,
            mimetype='application/json',
            headers={'Content-Disposition': f'attachment; filename="{filename}.json"'}
        )
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/register-device', methods=['POST'])
def register_device():
    """Register a new device"""
    try:
        data = request.json
        device_id = data.get('device_id')
        project_id = data.get('project_id', 'default')
        site_id = data.get('site_id', 'default')
        latitude = data.get('latitude', 0)
        longitude = data.get('longitude', 0)
        name = data.get('name', device_id)
        
        db.register_device(device_id, project_id, site_id, latitude, longitude, name)
        
        return jsonify({'status': 'success', 'device_id': device_id})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============ FRONTEND SERVING ============
# (Routes defined conditionally below based on frontend mode)

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'timestamp': datetime.now().isoformat()})

@app.route('/api/health', methods=['GET'])
def api_health():
    """API health check endpoint"""
    return jsonify({'status': 'ok', 'timestamp': datetime.now().isoformat()})

# ============ AUTH ENDPOINTS ============

@app.route('/api/auth/check', methods=['GET'])
def auth_check():
    """Check if user is authenticated"""
    try:
        # For now, always return authenticated with demo user
        # In production, you would check session/token here
        return jsonify({
            'authenticated': True,
            'user': {
                'id': 'demo',
                'username': 'demo_user',
                'role': 'admin'
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/auto-login', methods=['POST'])
def auto_login():
    """Auto-login endpoint"""
    try:
        # For now, always auto-login with demo user
        # In production, you would implement proper authentication here
        return jsonify({
            'success': True,
            'user': {
                'id': 'demo',
                'username': 'demo_user',
                'role': 'admin'
            },
            'token': 'demo_token'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login endpoint"""
    try:
        data = request.json
        username = data.get('username', '')
        password = data.get('password', '')
        
        # For now, accept any username/password combination
        # In production, you would validate against a user database
        if username and password:
            return jsonify({
                'success': True,
                'user': {
                    'id': username,
                    'username': username,
                    'role': 'admin'
                },
                'token': 'demo_token'
            })
        else:
            return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Logout endpoint"""
    try:
        return jsonify({'success': True, 'message': 'Logged out successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============ ALERT ENDPOINTS ============

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    """Get current active alerts"""
    try:
        danger_level = request.args.get('level', None, type=str)
        alerts = alert_manager.get_active_alerts(danger_level=danger_level)
        
        return jsonify({
            'alerts': alerts,
            'total': len(alerts),
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/alerts/history', methods=['GET'])
def get_alerts_history():
    """Get alert history"""
    try:
        device_id = request.args.get('device_id', None, type=str)
        limit = request.args.get('limit', 100, type=int)
        
        alerts = alert_manager.get_alert_history(device_id=device_id, limit=limit)
        
        return jsonify({
            'alerts': alerts,
            'total': len(alerts),
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/alerts/<int:alert_id>/acknowledge', methods=['POST'])
def acknowledge_alert(alert_id):
    """Acknowledge an alert"""
    try:
        user = request.json.get('user', 'system') if request.json else 'system'
        success = alert_manager.acknowledge_alert(alert_id, acknowledged_by=user)
        
        if success:
            return jsonify({'message': 'Alert acknowledged', 'alert_id': alert_id})
        else:
            return jsonify({'error': 'Failed to acknowledge alert'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/alerts/stats', methods=['GET'])
def get_alert_stats():
    """Get alert statistics"""
    try:
        stats = alert_manager.get_alert_stats()
        
        return jsonify({
            'stats': stats,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/alerts/thresholds', methods=['GET'])
def get_thresholds():
    """Get alert thresholds"""
    try:
        sensor_type = request.args.get('sensor_type', None, type=str)
        thresholds = alert_manager.get_thresholds(sensor_type=sensor_type)
        
        return jsonify({
            'thresholds': thresholds,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/alerts/thresholds', methods=['POST'])
def update_threshold():
    """Update an alert threshold"""
    try:
        data = request.json
        sensor_type = data.get('sensor_type')
        threshold_name = data.get('threshold_name')
        value = data.get('value')
        
        if not all([sensor_type, threshold_name, value]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        success = alert_manager.update_threshold(sensor_type, threshold_name, float(value))
        
        if success:
            return jsonify({
                'message': 'Threshold updated',
                'sensor_type': sensor_type,
                'threshold_name': threshold_name,
                'value': value
            })
        else:
            return jsonify({'error': 'Failed to update threshold'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============ FRONTEND SERVING ============

if REACT_DEV_MODE:
    # Proxy to React dev server
    @app.route('/')
    def serve_root():
        """Proxy root to React dev server"""
        try:
            response = requests.get(urljoin(REACT_DEV_SERVER, '/'), timeout=5)
            return response.text, response.status_code, response.headers
        except:
            return jsonify({'error': 'React dev server not available'}), 502

    @app.route('/<path:path>')
    def serve_dev(path):
        """Proxy non-API routes to React dev server"""
        if path.startswith('api/'):
            return jsonify({'error': 'Not Found'}), 404
        
        try:
            url = urljoin(REACT_DEV_SERVER, '/' + path)
            response = requests.get(url, timeout=5)
            return response.text, response.status_code, response.headers
        except:
            try:
                response = requests.get(urljoin(REACT_DEV_SERVER, '/'), timeout=5)
                return response.text, response.status_code, response.headers
            except:
                return jsonify({'error': 'React dev server not available'}), 502

elif REACT_BUILD_MODE:
    # React SPA from build folder
    @app.route('/static/<path:path>')
    def send_static(path):
        """Serve static assets from React build"""
        return send_from_directory(os.path.join(REACT_BUILD_DIR, 'static'), path)

    @app.route('/')
    def serve_react_root():
        """Serve React app at root"""
        return send_from_directory(REACT_BUILD_DIR, 'index.html')

    @app.route('/<path:path>')
    def serve_react(path):
        """Serve React app for all non-API routes (SPA routing)"""
        if '.' in path:
            file_path = os.path.join(REACT_BUILD_DIR, path)
            if os.path.exists(file_path):
                return send_from_directory(REACT_BUILD_DIR, path)
        
        index_path = os.path.join(REACT_BUILD_DIR, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(REACT_BUILD_DIR, 'index.html')
        
        return jsonify({'error': 'React build not found. Run: cd frontend-react && npm run build'}), 404

else:
    # Old Vanilla JS frontend
    @app.route('/')
    def index():
        """Serve the main map page"""
        return render_template('index.html')

    @app.route('/dashboard')
    def dashboard():
        """Serve sensor data dashboard"""
        return render_template('dashboard.html')

if __name__ == '__main__':
    print("🚀 Starting Web Server on http://localhost:5000")
    print("📍 Interactive Map: http://localhost:5000/")
    print("📊 Dashboard: http://localhost:5000/dashboard")
    print("\n🔍 API ENDPOINTS:")
    print("\n📌 Basic Endpoints:")
    print("   - GET /api/devices - List all devices with latest locations")
    print("   - GET /api/device/<id> - Get device details and latest readings")
    print("   - GET /api/statistics - System statistics")
    print("\n📊 Sensor Data Endpoints (with pagination):")
    print("   - GET /api/sensor/<type> - Get sensor type readings")
    print("     Parameters: limit, offset, device_id, start_date, end_date")
    print("   - GET /api/sensor-history - Advanced filtering for sensor data")
    print("     Parameters: sensor_type, device_id, start_date, end_date, limit, offset")
    print("\n💾 Export Endpoints:")
    print("   - GET /api/export/csv - Export to CSV file")
    print("     Parameters: sensor_type (required), device_id, start_date, end_date, filename")
    print("   - GET /api/export/json - Export to JSON file")
    print("     Parameters: sensor_type (required), device_id, start_date, end_date, filename")
    print("\n🚨 Alert Endpoints:")
    print("   - GET /api/alerts - Get active alerts")
    print("     Parameters: level (normal, low, medium, high, critical)")
    print("   - GET /api/alerts/history - Get alert history")
    print("     Parameters: device_id, limit")
    print("   - POST /api/alerts/<id>/acknowledge - Acknowledge an alert")
    print("   - GET /api/alerts/stats - Get alert statistics")
    print("   - GET /api/alerts/thresholds - Get alert thresholds")
    print("   - POST /api/alerts/thresholds - Update alert threshold")
    print("\n📝 Device Management:")
    print("   - POST /api/register-device - Register new device")
    print("   - GET /api/health - Health check")
    print("\n✅ API ready for use!")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
