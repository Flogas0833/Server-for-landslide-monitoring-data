"""
Web Server - Flask API for sensor data and OpenStreetMap visualization
Provides REST endpoints and serves the interactive map frontend
"""

import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, jsonify, request, Response, send_from_directory, g
from flask_cors import CORS
from database import SensorDatabase
from alert_manager import AlertManager, DangerLevel
from jwt_auth_manager import JWTAuthManager, RBACManager, require_auth, require_role, require_permission
from datetime import datetime, timedelta
import csv
import io
import json
import requests
import time
from urllib.parse import urljoin

# React frontend configuration
REACT_BUILD_DIR = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist')
REACT_DEV_SERVER = 'http://localhost:5173'

def find_react_dev_server(max_retries=20, retry_delay=0.5):
    """
    Try to detect React dev server with retry logic.
    Returns True if React dev server is found, False otherwise.
    """
    for attempt in range(max_retries):
        try:
            response = requests.get(REACT_DEV_SERVER, timeout=1)
            if response.status_code == 200:
                print(f"✅ React dev server detected at {REACT_DEV_SERVER} (attempt {attempt + 1})")
                return True
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"⏳ React dev server check {attempt + 1}/{max_retries} - not ready yet, retrying in {retry_delay}s...")
                time.sleep(retry_delay)
            else:
                print(f"❌ React dev server not found at {REACT_DEV_SERVER} after {max_retries} attempts")
    return False

# Detect which React mode to use
REACT_BUILD_MODE = os.path.exists(REACT_BUILD_DIR)
print(f"DEBUG: Checking for React build at {REACT_BUILD_DIR}: {REACT_BUILD_MODE}")

if not REACT_BUILD_MODE:
    # Check if React dev server is running with retry logic
    print("⏳ Attempting to detect React dev server...")
    REACT_DEV_MODE = find_react_dev_server()
else:
    REACT_DEV_MODE = False

print(f"DEBUG: REACT_BUILD_MODE = {REACT_BUILD_MODE}, REACT_DEV_MODE = {REACT_DEV_MODE}")

# Initialize Flask app
if REACT_BUILD_MODE:
    print("ℹ️ Using React BUILD mode (static files from dist/)")
    # Don't use Flask's static_url_path='/' as it conflicts with SPA routing
    # We handle static files manually in the routes
    app = Flask(__name__)
else:
    print("ℹ️ Using React DEV mode (proxying to dev server)")
    app = Flask(__name__)

CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173", "http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Handle CORS preflight requests
@app.before_request
def handle_preflight():
    """Handle CORS preflight requests"""
    if request.method == "OPTIONS":
        response = app.make_default_options_response()
        response.headers["Access-Control-Allow-Origin"] = request.headers.get("Origin", "*")
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        return response, 200

# Initialize database
db = SensorDatabase()

# Initialize alert manager
alert_manager = AlertManager()

# ============ AUTHENTICATION ENDPOINTS ============

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        # Validation
        if not username or len(username) < 3:
            return jsonify({'error': 'Username must be at least 3 characters'}), 400
        
        if not email or '@' not in email:
            return jsonify({'error': 'Invalid email'}), 400
        
        if not password or len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        # Check if user exists
        existing_user = db.get_user_by_username(username)
        if existing_user:
            return jsonify({'error': 'Username already exists'}), 409
        
        # Hash password and create user
        password_hash = JWTAuthManager.hash_password(password)
        success = db.create_user(
            username=username,
            email=email,
            password_hash=password_hash,
            role='user'  # Default role for new users
        )
        
        if success:
            user = db.get_user_by_username(username)
            db.add_audit_log(
                user_id=None,
                username=username,
                action='user_registered',
                resource_type='user',
                resource_id=str(user['id']),
                ip_address=request.remote_addr
            )
            
            return jsonify({
                'success': True,
                'message': 'User registered successfully',
                'user': {
                    'id': user['id'],
                    'username': user['username'],
                    'email': user['email'],
                    'role': user['role']
                }
            }), 201
        else:
            return jsonify({'error': 'Failed to register user'}), 500
    
    except Exception as e:
        print(f"Error in register: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login with username and password"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        if not username or not password:
            return jsonify({'error': 'Username and password required'}), 400
        
        # Verify credentials
        user = db.get_user_by_username(username)
        if not user or not JWTAuthManager.verify_password(password, user['password_hash']):
            db.add_audit_log(
                user_id=None,
                username=username,
                action='login_failed',
                resource_type='user',
                resource_id='',
                ip_address=request.remote_addr
            )
            return jsonify({'error': 'Invalid credentials'}), 401
        
        if not user.get('is_active'):
            return jsonify({'error': 'User account is disabled'}), 403
        
        # Create tokens
        access_token = JWTAuthManager.create_access_token(
            user_id=str(user['id']),
            username=user['username'],
            role=user['role']
        )
        refresh_token = JWTAuthManager.create_refresh_token(
            user_id=str(user['id']),
            username=user['username']
        )
        
        # Update last login
        db.update_user_last_login(user['id'])
        
        # Audit log
        db.add_audit_log(
            user_id=user['id'],
            username=username,
            action='login_success',
            resource_type='user',
            resource_id=str(user['id']),
            ip_address=request.remote_addr
        )
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'role': user['role']
            }
        }), 200
    
    except Exception as e:
        print(f"Error in login: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/refresh', methods=['POST'])
def refresh_token():
    """Refresh access token using refresh token"""
    try:
        data = request.get_json()
        refresh_tk = data.get('refresh_token', '')
        
        if not refresh_tk:
            return jsonify({'error': 'Refresh token required'}), 400
        
        # Verify refresh token
        is_valid, payload = JWTAuthManager.verify_token(refresh_tk)
        
        if not is_valid or payload.get('type') != 'refresh':
            return jsonify({'error': 'Invalid refresh token'}), 401
        
        user_id = payload.get('user_id')
        username = payload.get('username')
        
        # Get user info to get current role
        user = db.get_user_by_id(int(user_id))
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Create new access token
        new_access_token = JWTAuthManager.create_access_token(
            user_id=str(user['id']),
            username=user['username'],
            role=user['role']
        )
        
        return jsonify({
            'success': True,
            'access_token': new_access_token
        }), 200
    
    except Exception as e:
        print(f"Error in refresh_token: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/check', methods=['GET'])
def check_auth():
    """Check if user is authenticated and get user info"""
    try:
        token = JWTAuthManager.extract_token_from_request()
        
        if not token:
            return jsonify({
                'authenticated': False,
                'message': 'No token provided'
            }), 200
        
        is_valid, payload = JWTAuthManager.verify_token(token)
        
        if not is_valid:
            return jsonify({
                'authenticated': False,
                'message': 'Token invalid or expired'
            }), 200
        
        user = db.get_user_by_id(int(payload.get('user_id')))
        
        if user:
            return jsonify({
                'authenticated': True,
                'user': {
                    'id': user['id'],
                    'username': user['username'],
                    'email': user['email'],
                    'role': user['role']
                }
            }), 200
        else:
            return jsonify({
                'authenticated': False,
                'message': 'User not found'
            }), 200
    
    except Exception as e:
        print(f"Error in check_auth: {e}")
        return jsonify({
            'authenticated': False,
            'error': str(e)
        }), 200


@app.route('/api/auth/logout', methods=['POST'])
@require_auth()
def logout():
    """Logout user (invalidate token on client side)"""
    try:
        db.add_audit_log(
            user_id=g.user_id,
            username=g.username,
            action='logout',
            resource_type='user',
            resource_id=str(g.user_id),
            ip_address=request.remote_addr
        )
        
        return jsonify({
            'success': True,
            'message': 'Logged out successfully'
        }), 200
    
    except Exception as e:
        print(f"Error in logout: {e}")
        return jsonify({'error': str(e)}), 500


# ============ API ENDPOINTS ============

@app.route('/api/devices', methods=['GET'])
@require_auth()
def get_devices():
    """Get all devices with latest locations (requires authentication)"""
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
@require_auth()
def get_sensor_data(sensor_type):
    """Get latest readings for a sensor type with pagination (requires authentication)"""
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
@require_auth()
def get_statistics():
    """Get statistics about devices and sensors (requires authentication)"""
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
@require_auth()
def get_sensor_history():
    """Get sensor readings with advanced filtering and pagination (requires authentication)
    
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
@require_auth(allowed_roles=['admin', 'operator'])
def export_sensor_csv():
    """Export sensor data as CSV file (admin/operator only)
    
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
@require_auth(allowed_roles=['admin', 'operator'])
def export_sensor_json():
    """Export sensor data as JSON file (admin/operator only)
    
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

# ============ ALERT ENDPOINTS ============

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    """Get current active alerts"""
    try:
        danger_level = request.args.get('level', None, type=str)
        limit = request.args.get('limit', -1, type=int)
        alerts = alert_manager.get_active_alerts(danger_level=danger_level, limit=limit)
        
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
    """Get alert thresholds (Public endpoint)"""
    try:
        sensor_type = request.args.get('sensor_type', None, type=str)
        thresholds = alert_manager.get_thresholds(sensor_type=sensor_type)
        
        return jsonify({
            'thresholds': thresholds,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/alerts/thresholds/public', methods=['GET'])
def get_thresholds_public():
    """Get alert thresholds with basic info (Public endpoint - no auth required)"""
    try:
        # Get current thresholds from database
        thresholds_from_db = alert_manager.get_all_thresholds_from_db()
        
        return jsonify({
            'thresholds': thresholds_from_db,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/alerts/thresholds', methods=['POST'])
@require_auth()
@require_role('admin', 'operator')
def update_threshold():
    """Update an alert threshold (Admin/Operator only)"""
    try:
        data = request.json
        sensor_type = data.get('sensor_type')
        threshold_name = data.get('threshold_name')
        value = data.get('value')
        
        if not all([sensor_type, threshold_name, value]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        success = alert_manager.update_threshold(sensor_type, threshold_name, float(value))
        
        if success:
            # Log audit
            db.add_audit_log(
                user_id=g.user_id,
                username=g.username,
                action='update_threshold',
                resource_type='alert_thresholds',
                resource_id=f'{sensor_type}:{threshold_name}',
                ip_address=request.remote_addr
            )
            
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

@app.route('/api/alerts/thresholds/reset', methods=['POST'])
@require_auth()
@require_role('admin')
def reset_thresholds():
    """Reset all alert thresholds to default values (Admin only)"""
    try:
        success = alert_manager.reset_thresholds()
        
        if success:
            # Log audit
            db.add_audit_log(
                user_id=g.user_id,
                username=g.username,
                action='reset_thresholds',
                resource_type='alert_thresholds',
                resource_id='all',
                ip_address=request.remote_addr
            )
            
            return jsonify({
                'message': 'All thresholds reset to default values',
                'thresholds': alert_manager.get_thresholds()
            })
        else:
            return jsonify({'error': 'Failed to reset thresholds'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/alerts/thresholds/details', methods=['GET'])
@require_auth()
@require_role('admin', 'operator')
def get_thresholds_details():
    """Get detailed thresholds with metadata (Admin/Operator only)"""
    try:
        thresholds = alert_manager.get_all_thresholds_from_db()
        
        return jsonify({
            'thresholds': thresholds,
            'timestamp': datetime.now().isoformat()
        })
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
        print(f"DEBUG serve_react: path={path}, has_dot={('.' in path)}")
        if '.' in path:
            file_path = os.path.join(REACT_BUILD_DIR, path)
            print(f"  Checking file: {file_path}, exists={os.path.exists(file_path)}")
            if os.path.exists(file_path):
                return send_from_directory(REACT_BUILD_DIR, path)
        
        index_path = os.path.join(REACT_BUILD_DIR, 'index.html')
        print(f"  Returning index.html from {REACT_BUILD_DIR}, exists={os.path.exists(index_path)}")
        if os.path.exists(index_path):
            return send_from_directory(REACT_BUILD_DIR, 'index.html')
        
        return jsonify({'error': 'React build not found. Run: cd frontend && npm run build'}), 404

# ============ PROVINCE-SPECIFIC ENDPOINTS ============

@app.route('/api/users', methods=['GET'])
@require_auth()
@require_role('admin')
def get_all_users():
    """Get all users (Admin only)"""
    try:
        users = db.get_all_users()
        user_list = []
        for user in users:
            user_list.append({
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'role': user['role'],
                'province': user.get('province') or '(Không có)',
                'lastLogin': user.get('last_login'),
                'isActive': user.get('is_active', True),
                'createdAt': user.get('created_at'),
                'site_ids': user.get('site_ids', [])
            })
        return jsonify({
            'users': user_list,
            'total': len(user_list)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/me', methods=['GET'])
@require_auth()
def get_current_user():
    """Get current user's information including province"""
    try:
        user = db.get_user_by_id(g.user_id)
        if user:
            return jsonify({
                'user': {
                    'id': user['id'],
                    'username': user['username'],
                    'email': user['email'],
                    'role': user['role'],
                    'province': user.get('province'),
                    'site_ids': user.get('site_ids', [])
                }
            }), 200
        else:
            return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/me/province', methods=['PUT'])
@require_auth()
@require_role('admin', 'operator')
def update_current_user_province():
    """Update current user's province"""
    try:
        data = request.get_json()
        province = data.get('province', '').strip()
        
        if not province:
            return jsonify({'error': 'Province is required'}), 400
        
        success = db.update_user_province(g.user_id, province)
        
        if success:
            # Log audit
            db.add_audit_log(
                user_id=g.user_id,
                username=g.username,
                action='update_province',
                resource_type='user',
                resource_id=str(g.user_id),
                ip_address=request.remote_addr,
                new_values={'province': province}
            )
            
            return jsonify({
                'message': 'Province updated successfully',
                'province': province
            }), 200
        else:
            return jsonify({'error': 'Failed to update province'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/<int:user_id>/province', methods=['PUT'])
@require_auth()
@require_role('admin')
def update_user_province(user_id):
    """Update a user's province (Admin only)"""
    try:
        data = request.get_json()
        province = data.get('province', '').strip()
        
        if not province:
            return jsonify({'error': 'Province is required'}), 400
        
        user = db.get_user_by_id(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        success = db.update_user_province(user_id, province)
        
        if success:
            # Log audit
            db.add_audit_log(
                user_id=g.user_id,
                username=g.username,
                action='update_user_province',
                resource_type='user',
                resource_id=str(user_id),
                ip_address=request.remote_addr,
                new_values={'province': province}
            )
            
            return jsonify({
                'message': f'Province for user {user["username"]} updated successfully',
                'user_id': user_id,
                'province': province
            }), 200
        else:
            return jsonify({'error': 'Failed to update province'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users', methods=['POST'])
@require_auth()
@require_role('admin')
def create_user():
    """Create a new user (Admin only)"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()
        role = data.get('role', 'user')
        province = data.get('province', '').strip()
        
        # Validation
        if not username or not email or not password:
            return jsonify({'error': 'Username, email, and password are required'}), 400
        
        if role == 'operator' and not province:
            return jsonify({'error': 'Province is required for operator role'}), 400
        
        # Check if username already exists
        if db.get_user_by_username(username):
            return jsonify({'error': 'Username already exists'}), 400
        
        # Hash password
        password_hash = JWTAuthManager.hash_password(password)
        
        # Create user
        success = db.create_user(
            username=username,
            email=email,
            password_hash=password_hash,
            role=role,
            province=province if role == 'operator' else None
        )
        
        if success:
            user = db.get_user_by_username(username)
            
            # Log audit
            db.add_audit_log(
                user_id=g.user_id,
                username=g.username,
                action='create_user',
                resource_type='user',
                resource_id=str(user['id']),
                ip_address=request.remote_addr,
                new_values={
                    'username': username,
                    'email': email,
                    'role': role,
                    'province': province
                }
            )
            
            return jsonify({
                'message': 'User created successfully',
                'id': user['id'],
                'username': username,
                'email': email,
                'role': role,
                'province': province
            }), 201
        else:
            return jsonify({'error': 'Failed to create user'}), 500
    except Exception as e:
        print(f"Error creating user: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/devices/by-province', methods=['GET'])
@require_auth()
def get_devices_by_province():
    """Get devices for a specific province"""
    try:
        province = request.args.get('province', None, type=str)
        user = db.get_user_by_id(g.user_id)
        
        # If operator, use their province
        if user['role'] == 'operator':
            if not user.get('province'):
                return jsonify({'error': 'Operator province not set'}), 400
            province = user['province']
        
        if not province:
            return jsonify({'error': 'Province parameter required'}), 400
        
        devices = db.get_devices_by_province(province)
        
        return jsonify({
            'status': 'ok',
            'province': province,
            'devices': devices,
            'total': len(devices)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/alerts/by-province', methods=['GET'])
@require_auth()
def get_alerts_by_province():
    """Get alerts for a specific province"""
    try:
        province = request.args.get('province', None, type=str)
        danger_level = request.args.get('level', None, type=str)
        limit = request.args.get('limit', -1, type=int)
        user = db.get_user_by_id(g.user_id)
        
        # If operator, use their province
        if user['role'] == 'operator':
            if not user.get('province'):
                return jsonify({'error': 'Operator province not set'}), 400
            province = user['province']
        
        if not province:
            return jsonify({'error': 'Province parameter required'}), 400
        
        # Get alerts
        alerts = alert_manager.get_active_alerts(danger_level=danger_level, limit=limit)
        
        # Filter alerts by province
        devices_in_province = db.get_devices_by_province(province)
        device_ids_in_province = set(d['device_id'] for d in devices_in_province)
        
        filtered_alerts = [a for a in alerts if a.get('device_id') in device_ids_in_province]
        
        return jsonify({
            'province': province,
            'alerts': filtered_alerts,
            'total': len(filtered_alerts),
            'timestamp': datetime.now().isoformat()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/alerts/thresholds/by-province', methods=['GET'])
@require_auth()
def get_thresholds_by_province():
    """Get alert thresholds for a specific province"""
    try:
        province = request.args.get('province', None, type=str)
        sensor_type = request.args.get('sensor_type', None, type=str)
        user = db.get_user_by_id(g.user_id)
        
        # If operator, use their province
        if user['role'] == 'operator':
            if not user.get('province'):
                return jsonify({'error': 'Operator province not set'}), 400
            province = user['province']
        
        if not province:
            return jsonify({'error': 'Province parameter required'}), 400
        
        # Get thresholds for province
        thresholds = alert_manager.get_thresholds_for_province(province, sensor_type)
        
        return jsonify({
            'province': province,
            'thresholds': thresholds,
            'timestamp': datetime.now().isoformat()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/alerts/thresholds/by-province', methods=['POST'])
@require_auth()
@require_role('admin', 'operator')
def update_threshold_by_province():
    """Update alert threshold for a specific province (Admin/Operator only)"""
    try:
        data = request.json
        province = data.get('province')
        sensor_type = data.get('sensor_type')
        threshold_name = data.get('threshold_name')
        value = data.get('value')
        user = db.get_user_by_id(g.user_id)
        
        if not all([sensor_type, threshold_name, value]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # If operator, can only update their own province
        if user['role'] == 'operator':
            if not user.get('province'):
                return jsonify({'error': 'Operator province not set'}), 400
            if not province:
                province = user['province']
            elif province != user['province']:
                return jsonify({'error': 'Operator can only update thresholds for their own province'}), 403
        
        if not province:
            return jsonify({'error': 'Province parameter required'}), 400
        
        success = alert_manager.update_threshold_by_province(
            province, sensor_type, threshold_name, float(value)
        )
        
        if success:
            # Log audit
            db.add_audit_log(
                user_id=g.user_id,
                username=g.username,
                action='update_threshold_by_province',
                resource_type='alert_thresholds',
                resource_id=f'{province}:{sensor_type}:{threshold_name}',
                ip_address=request.remote_addr,
                new_values={
                    'province': province,
                    'sensor_type': sensor_type,
                    'threshold_name': threshold_name,
                    'value': value
                }
            )
            
            return jsonify({
                'message': 'Threshold updated for province',
                'province': province,
                'sensor_type': sensor_type,
                'threshold_name': threshold_name,
                'value': value
            }), 200
        else:
            return jsonify({'error': 'Failed to update threshold'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting Web Server on http://localhost:5000")
    print("📍 React App: http://localhost:5000/")
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
