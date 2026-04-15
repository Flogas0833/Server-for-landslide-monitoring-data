"""
Database Module - Store and retrieve sensor data
Uses SQLite for lightweight data persistence
"""

import sqlite3
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import asdict
import json
import os

class SensorDatabase:
    """SQLite database for sensor readings"""
    
    def __init__(self, db_path: str = "../database/sensors.db"):
        """Initialize database"""
        self.db_path = db_path
        os.makedirs(os.path.dirname(db_path) or ".", exist_ok=True)
        self.init_database()
    
    def get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def init_database(self):
        """Initialize database tables"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Sensor readings table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sensor_readings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL,
                sensor_type TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                data JSON NOT NULL,
                unit TEXT,
                quality INTEGER,
                latitude REAL,
                longitude REAL,
                altitude REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(device_id, sensor_type, timestamp)
            )
        ''')
        
        # Device info table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS devices (
                device_id TEXT PRIMARY KEY,
                project_id TEXT,
                site_id TEXT,
                latitude REAL,
                longitude REAL,
                altitude REAL,
                name TEXT,
                description TEXT,
                last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'active',
                alert_status TEXT DEFAULT 'normal',
                last_alert_time TIMESTAMP,
                last_alert_value REAL,
                last_alert_type TEXT
            )
        ''')
        
        # Create indexes for better queries
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_device_id ON sensor_readings(device_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_sensor_type ON sensor_readings(sensor_type)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_timestamp ON sensor_readings(timestamp)')
        
        conn.commit()
        conn.close()
    
    def insert_reading(self, device_id: str, sensor_type: str, timestamp: str,
                      data: Dict[str, Any], unit: str, quality: Optional[int] = None) -> bool:
        """Insert sensor reading"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Extract location data if available
            latitude = data.get('latitude') if sensor_type == 'gnss' else None
            longitude = data.get('longitude') if sensor_type == 'gnss' else None
            altitude = data.get('altitude') if sensor_type == 'gnss' else None
            
            cursor.execute('''
                INSERT OR REPLACE INTO sensor_readings 
                (device_id, sensor_type, timestamp, data, unit, quality, latitude, longitude, altitude)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (device_id, sensor_type, timestamp, json.dumps(data), unit, quality, 
                  latitude, longitude, altitude))
            
            # Update device info with latest location
            if latitude and longitude:
                cursor.execute('''
                    UPDATE devices 
                    SET latitude = ?, longitude = ?, altitude = ?, last_update = CURRENT_TIMESTAMP
                    WHERE device_id = ?
                ''', (latitude, longitude, altitude, device_id))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error inserting reading: {e}")
            return False
    
    def register_device(self, device_id: str, project_id: str, site_id: str,
                       latitude: float = 0, longitude: float = 0, name: str = ""):
        """Register a device"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT OR REPLACE INTO devices 
                (device_id, project_id, site_id, latitude, longitude, name)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (device_id, project_id, site_id, latitude, longitude, name))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error registering device: {e}")
            return False
    
    def update_alert_status(self, device_id: str, alert_status: str = "normal", 
                           alert_value: float = None, alert_type: str = None):
        """Update alert status for a device"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            print(f"[DB] Updating alert status: {device_id}={alert_status} (value={alert_value}, type={alert_type})")
            
            cursor.execute('''
                UPDATE devices 
                SET alert_status = ?, last_alert_value = ?, last_alert_type = ?, last_alert_time = ?
                WHERE device_id = ?
            ''', (alert_status, alert_value, alert_type, datetime.utcnow().isoformat(), device_id))
            
            rows_updated = cursor.rowcount
            conn.commit()
            conn.close()
            
            print(f"[DB] ✓ Updated {rows_updated} rows for {device_id}")
            return True
        except Exception as e:
            print(f"[DB] ✗ Error updating alert status: {e}")
            return False
    
    def get_all_devices(self) -> List[Dict[str, Any]]:
        """Get all devices with latest location from GNSS readings"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Get devices
        cursor.execute('SELECT device_id, project_id, site_id, name, status, alert_status, last_update FROM devices ORDER BY device_id')
        
        results = []
        for row in cursor.fetchall():
            device_dict = dict(row)
            device_id = device_dict['device_id']
            
            # Get latest GNSS reading for this device
            cursor.execute('''
                SELECT 
                    json_extract(data, '$.latitude') as latitude,
                    json_extract(data, '$.longitude') as longitude,
                    json_extract(data, '$.altitude') as altitude
                FROM sensor_readings 
                WHERE device_id = ? AND sensor_type = 'gnss'
                ORDER BY timestamp DESC
                LIMIT 1
            ''', (device_id,))
            
            gnss_row = cursor.fetchone()
            if gnss_row:
                gnss_dict = dict(gnss_row)
                device_dict['latitude'] = gnss_dict.get('latitude')
                device_dict['longitude'] = gnss_dict.get('longitude')
                device_dict['altitude'] = gnss_dict.get('altitude')
            else:
                device_dict['latitude'] = None
                device_dict['longitude'] = None
                device_dict['altitude'] = None
            
            results.append(device_dict)
        
        conn.close()
        return results
    
    def get_device_location(self, device_id: str) -> Optional[Dict[str, Any]]:
        """Get latest location of a device"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT device_id, latitude, longitude, altitude, last_update
            FROM devices
            WHERE device_id = ?
        ''', (device_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        return dict(row) if row else None
    
    def get_latest_readings(self, device_id: str, sensor_type: str, limit: int = 10) -> List[Dict]:
        """Get latest readings for a device/sensor"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT device_id, sensor_type, timestamp, data, unit, quality
            FROM sensor_readings
            WHERE device_id = ? AND sensor_type = ?
            ORDER BY timestamp DESC
            LIMIT ?
        ''', (device_id, sensor_type, limit))
        
        results = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        for r in results:
            r['data'] = json.loads(r['data'])
        
        return results
    
    def get_readings_by_type(self, sensor_type: str, limit: int = 100) -> List[Dict]:
        """Get latest readings for a sensor type across all devices"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT device_id, sensor_type, timestamp, data, unit, quality
            FROM sensor_readings
            WHERE sensor_type = ?
            ORDER BY timestamp DESC
            LIMIT ?
        ''', (sensor_type, limit))
        
        results = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        for r in results:
            r['data'] = json.loads(r['data'])
        
        return results
    
    def get_readings_with_filters(self, sensor_type: Optional[str] = None, device_id: Optional[str] = None,
                                  start_date: Optional[str] = None, end_date: Optional[str] = None,
                                  limit: int = 100, offset: int = 0) -> Dict[str, Any]:
        """
        Get sensor readings with filtering and pagination
        
        Args:
            sensor_type: Filter by sensor type (optional)
            device_id: Filter by device ID (optional)
            start_date: ISO format start date (optional)
            end_date: ISO format end date (optional)
            limit: Number of records per page
            offset: Pagination offset
        
        Returns:
            Dictionary with data and metadata
        """
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Build WHERE clause
        conditions = []
        params = []
        
        if sensor_type:
            conditions.append("sensor_type = ?")
            params.append(sensor_type)
        
        if device_id:
            conditions.append("device_id = ?")
            params.append(device_id)
        
        if start_date:
            conditions.append("timestamp >= ?")
            params.append(start_date)
        
        if end_date:
            conditions.append("timestamp <= ?")
            params.append(end_date)
        
        where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
        
        # Get total count
        count_query = f"SELECT COUNT(*) as total FROM sensor_readings {where_clause}"
        cursor.execute(count_query, params)
        total = cursor.fetchone()['total']
        
        # Get paginated results
        query = f"""
            SELECT device_id, sensor_type, timestamp, data, unit, quality, quality as quality_score
            FROM sensor_readings
            {where_clause}
            ORDER BY timestamp DESC
            LIMIT ? OFFSET ?
        """
        params.extend([limit, offset])
        cursor.execute(query, params)
        
        results = [dict(row) for row in cursor.fetchall()]
        
        for r in results:
            r['data'] = json.loads(r['data'])
        
        conn.close()
        
        return {
            'data': results,
            'pagination': {
                'total': total,
                'limit': limit,
                'offset': offset,
                'page': (offset // limit) + 1 if limit > 0 else 1,
                'total_pages': (total + limit - 1) // limit if limit > 0 else 1
            }
        }
    
    def get_all_readings_for_export(self, sensor_type: Optional[str] = None, 
                                    device_id: Optional[str] = None,
                                    start_date: Optional[str] = None, 
                                    end_date: Optional[str] = None) -> List[Dict]:
        """
        Get all sensor readings matching filters (for export/reporting)
        No pagination - returns all matching records
        """
        conn = self.get_connection()
        cursor = conn.cursor()
        
        conditions = []
        params = []
        
        if sensor_type:
            conditions.append("sensor_type = ?")
            params.append(sensor_type)
        
        if device_id:
            conditions.append("device_id = ?")
            params.append(device_id)
        
        if start_date:
            conditions.append("timestamp >= ?")
            params.append(start_date)
        
        if end_date:
            conditions.append("timestamp <= ?")
            params.append(end_date)
        
        where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
        
        query = f"""
            SELECT device_id, sensor_type, timestamp, data, unit, quality, created_at
            FROM sensor_readings
            {where_clause}
            ORDER BY timestamp DESC
        """
        
        cursor.execute(query, params)
        results = [dict(row) for row in cursor.fetchall()]
        
        for r in results:
            r['data'] = json.loads(r['data'])
        
        conn.close()
        
        return results
