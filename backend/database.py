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
    
    def __init__(self, db_path: str = None):
        """Initialize database"""
        if db_path is None:
            # Use absolute path from environment or project root
            project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            db_path = os.path.join(project_root, 'database', 'sensors.db')
        
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
                province TEXT,
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
        
        # Users table for authentication
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                province TEXT,
                site_ids TEXT,
                is_active INTEGER DEFAULT 1,
                last_login TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Audit logs table for tracking actions
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                username TEXT,
                action TEXT,
                resource_type TEXT,
                resource_id TEXT,
                old_values TEXT,
                new_values TEXT,
                ip_address TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        ''')
        
        # Alert thresholds by province table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS thresholds_by_province (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                province TEXT NOT NULL,
                sensor_type TEXT NOT NULL,
                threshold_name TEXT NOT NULL,
                threshold_value REAL NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(province, sensor_type, threshold_name)
            )
        ''')
        
        # Create indexes for better queries
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_device_id ON sensor_readings(device_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_sensor_type ON sensor_readings(sensor_type)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_timestamp ON sensor_readings(timestamp)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_username ON users(username)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_province_device ON devices(province)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_province_user ON users(province)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_province_threshold ON thresholds_by_province(province)')
        
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
    
    # ============ USER MANAGEMENT ============
    
    def create_user(self, username: str, email: str, password_hash: str, 
                   role: str = 'user', province: Optional[str] = None, site_ids: Optional[list] = None) -> bool:
        """Create a new user"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            site_ids_json = json.dumps(site_ids) if site_ids else json.dumps([])
            
            cursor.execute('''
                INSERT INTO users (username, email, password_hash, role, province, site_ids)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (username, email, password_hash, role, province, site_ids_json))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error creating user: {e}")
            return False
    
    def get_user_by_username(self, username: str) -> Optional[Dict]:
        """Get user by username"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT id, username, email, password_hash, role, province, site_ids, is_active, last_login, created_at
                FROM users
                WHERE username = ?
            ''', (username,))
            
            row = cursor.fetchone()
            conn.close()
            
            if row:
                user = dict(row)
                if user.get('site_ids'):
                    user['site_ids'] = json.loads(user['site_ids'])
                return user
            
            return None
        except Exception as e:
            print(f"Error getting user: {e}")
            return None
    
    def get_user_by_id(self, user_id: int) -> Optional[Dict]:
        """Get user by ID"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT id, username, email, role, province, site_ids, is_active, last_login, created_at
                FROM users
                WHERE id = ?
            ''', (user_id,))
            
            row = cursor.fetchone()
            conn.close()
            
            if row:
                user = dict(row)
                if user.get('site_ids'):
                    user['site_ids'] = json.loads(user['site_ids'])
                return user
            
            return None
        except Exception as e:
            print(f"Error getting user: {e}")
            return None
    
    def get_all_users(self) -> List[Dict]:
        """Get all users"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT id, username, email, role, province, site_ids, is_active, last_login, created_at
                FROM users
                ORDER BY created_at DESC
            ''')
            
            rows = cursor.fetchall()
            conn.close()
            
            users = []
            for row in rows:
                user = dict(row)
                if user.get('site_ids'):
                    user['site_ids'] = json.loads(user['site_ids'])
                users.append(user)
            
            return users
        except Exception as e:
            print(f"Error getting all users: {e}")
            return []
    
    def update_user_last_login(self, user_id: int) -> bool:
        """Update user's last login timestamp"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                UPDATE users
                SET last_login = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (user_id,))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error updating last login: {e}")
            return False
    
    def add_audit_log(self, user_id: Optional[int], username: str, action: str,
                     resource_type: str, resource_id: str, ip_address: str,
                     old_values: Optional[Dict] = None, new_values: Optional[Dict] = None) -> bool:
        """Add entry to audit log"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            old_vals_json = json.dumps(old_values) if old_values else None
            new_vals_json = json.dumps(new_values) if new_values else None
            
            cursor.execute('''
                INSERT INTO audit_logs (user_id, username, action, resource_type, resource_id, ip_address, old_values, new_values)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (user_id, username, action, resource_type, resource_id, ip_address, old_vals_json, new_vals_json))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error adding audit log: {e}")
            return False
    
    def get_audit_logs(self, limit: int = 100, offset: int = 0, 
                      user_id: Optional[int] = None,
                      username: Optional[str] = None,
                      action: Optional[str] = None,
                      resource_type: Optional[str] = None,
                      ip_address: Optional[str] = None,
                      start_date: Optional[str] = None,
                      end_date: Optional[str] = None) -> Dict[str, Any]:
        """Get audit logs with pagination and filtering"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            conditions = []
            params = []
            
            if user_id:
                conditions.append("user_id = ?")
                params.append(user_id)
            
            if username:
                conditions.append("username LIKE ?")
                params.append(f"%{username}%")
            
            if action:
                conditions.append("action = ?")
                params.append(action)
            
            if resource_type:
                conditions.append("resource_type = ?")
                params.append(resource_type)
            
            if ip_address:
                conditions.append("ip_address = ?")
                params.append(ip_address)
            
            if start_date:
                conditions.append("timestamp >= ?")
                params.append(start_date)
            
            if end_date:
                conditions.append("timestamp <= ?")
                params.append(end_date)
            
            where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
            
            # Get total count
            count_query = f"SELECT COUNT(*) as total FROM audit_logs {where_clause}"
            cursor.execute(count_query, params)
            total = cursor.fetchone()['total']
            
            # Get paginated results
            query = f"""
                SELECT id, user_id, username, action, resource_type, resource_id, ip_address, timestamp, old_values, new_values
                FROM audit_logs
                {where_clause}
                ORDER BY timestamp DESC
                LIMIT ? OFFSET ?
            """
            params.extend([limit, offset])
            cursor.execute(query, params)
            
            results = [dict(row) for row in cursor.fetchall()]
            
            for r in results:
                if r.get('old_values'):
                    r['old_values'] = json.loads(r['old_values'])
                if r.get('new_values'):
                    r['new_values'] = json.loads(r['new_values'])
            
            conn.close()
            
            return {
                'data': results,
                'pagination': {
                    'total': total,
                    'limit': limit,
                    'offset': offset
                }
            }
        except Exception as e:
            print(f"Error getting audit logs: {e}")
            return {'data': [], 'pagination': {'total': 0}}
    
    # ============ PROVINCE MANAGEMENT ============
    
    def update_user_province(self, user_id: int, province: str) -> bool:
        """Update user's province"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                UPDATE users
                SET province = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (province, user_id))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error updating user province: {e}")
            return False
    
    def get_devices_by_province(self, province: str) -> List[Dict[str, Any]]:
        """Get all devices in a province"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT device_id, project_id, site_id, province, latitude, longitude, altitude, name, status, alert_status, last_update
                FROM devices
                WHERE province = ?
                ORDER BY device_id
            ''', (province,))
            
            results = [dict(row) for row in cursor.fetchall()]
            conn.close()
            return results
        except Exception as e:
            print(f"Error getting devices by province: {e}")
            return []
    
    def get_device_province(self, device_id: str) -> Optional[str]:
        """Get province of a device"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('SELECT province FROM devices WHERE device_id = ?', (device_id,))
            row = cursor.fetchone()
            conn.close()
            
            return row['province'] if row else None
        except Exception as e:
            print(f"Error getting device province: {e}")
            return None
    
    def update_device_province(self, device_id: str, province: str) -> bool:
        """Update device's province"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                UPDATE devices
                SET province = ?, last_update = CURRENT_TIMESTAMP
                WHERE device_id = ?
            ''', (province, device_id))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error updating device province: {e}")
            return False
    
    def register_device(self, device_id: str, project_id: str, site_id: str,
                       province: Optional[str] = None,
                       latitude: float = 0, longitude: float = 0, name: str = ""):
        """Register a device with province information"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT OR REPLACE INTO devices 
                (device_id, project_id, site_id, province, latitude, longitude, name)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (device_id, project_id, site_id, province, latitude, longitude, name))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error registering device: {e}")
            return False
    
    # ============ PROVINCE THRESHOLDS MANAGEMENT ============
    
    def save_threshold_by_province(self, province: str, sensor_type: str, 
                                   threshold_name: str, value: float) -> bool:
        """Save a threshold for a specific province"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT OR REPLACE INTO thresholds_by_province 
                (province, sensor_type, threshold_name, threshold_value, updated_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ''', (province, sensor_type, threshold_name, value))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error saving threshold by province: {e}")
            return False
    
    def get_thresholds_by_province(self, province: str, sensor_type: Optional[str] = None) -> Dict[str, Any]:
        """Get thresholds for a province (optionally filtered by sensor type)"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            if sensor_type:
                cursor.execute('''
                    SELECT sensor_type, threshold_name, threshold_value
                    FROM thresholds_by_province
                    WHERE province = ? AND sensor_type = ?
                    ORDER BY sensor_type, threshold_name
                ''', (province, sensor_type))
            else:
                cursor.execute('''
                    SELECT sensor_type, threshold_name, threshold_value
                    FROM thresholds_by_province
                    WHERE province = ?
                    ORDER BY sensor_type, threshold_name
                ''', (province,))
            
            results = {}
            for row in cursor.fetchall():
                sensor = row['sensor_type']
                if sensor not in results:
                    results[sensor] = {}
                results[sensor][row['threshold_name']] = row['threshold_value']
            
            conn.close()
            return results
        except Exception as e:
            print(f"Error getting thresholds by province: {e}")
            return {}
    
    def province_has_custom_thresholds(self, province: str) -> bool:
        """Check if province has custom thresholds defined"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('SELECT COUNT(*) as cnt FROM thresholds_by_province WHERE province = ?', (province,))
            row = cursor.fetchone()
            conn.close()
            
            return row['cnt'] > 0 if row else False
        except Exception as e:
            print(f"Error checking province thresholds: {e}")
            return False
