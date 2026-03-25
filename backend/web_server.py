"""
Web Server - Flask API for sensor data and OpenStreetMap visualization
Provides REST endpoints and serves the interactive map frontend
"""

from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from database import SensorDatabase
import os
from datetime import datetime, timedelta

app = Flask(__name__, template_folder='../frontend', static_folder='../frontend/static')
CORS(app)

# Initialize database
db = SensorDatabase()

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
                'last_update': device['last_update']
            }
            
            # Only include if we have at least latitude and longitude
            if device_info['latitude'] is not None and device_info['longitude'] is not None:
                devices_with_location.append(device_info)
        
        return jsonify(devices_with_location)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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
    """Get latest readings for a sensor type"""
    try:
        limit = request.args.get('limit', 100, type=int)
        readings = db.get_readings_by_type(sensor_type, limit)
        return jsonify(readings)
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

# ============ PAGE ROUTES ============

@app.route('/')
def index():
    """Serve the main map page"""
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    """Serve sensor data dashboard"""
    return render_template('dashboard.html')

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    print("🚀 Starting Web Server on http://localhost:5000")
    print("📍 Interactive Map: http://localhost:5000/")
    print("📊 Dashboard: http://localhost:5000/dashboard")
    print("🔍 API Docs:")
    print("   - GET /api/devices - List all devices")
    print("   - GET /api/device/<id> - Device details")
    print("   - GET /api/statistics - System statistics")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
