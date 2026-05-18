"""
Alert Manager - Handle sensor alerts and notifications
Monitors sensors for danger thresholds and generates alerts
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from enum import Enum
import json
import sqlite3


class DangerLevel(Enum):
    """Alert severity levels"""
    NORMAL = "normal"       # Everything OK
    LOW = "low"             # Monitor closely
    MEDIUM = "medium"       # Warning
    HIGH = "high"           # Danger
    CRITICAL = "critical"   # Immediate action required


class AlertManager:
    """Manage sensor alerts and thresholds"""
    
    # Default danger thresholds per sensor type
    DEFAULT_THRESHOLDS = {
        'tilt': {
            'roll_low': 2.0,        # Low alert (degrees)
            'roll_medium': 5.0,     # Medium alert
            'roll_high': 10.0,      # High alert
            'roll_critical': 15.0,  # Critical alert
            'pitch_low': 2.0,
            'pitch_medium': 5.0,
            'pitch_high': 10.0,
            'pitch_critical': 15.0,
        },
        'vibration': {
            'frequency_low': 2.0,       # Hz
            'frequency_medium': 5.0,
            'frequency_high': 10.0,
            'frequency_critical': 15.0,
            'amplitude_low': 0.2,       # G
            'amplitude_medium': 0.5,
            'amplitude_high': 1.0,
            'amplitude_critical': 2.0,
        },
        'displacement': {
            'horizontal_low': 10.0,         # mm
            'horizontal_medium': 25.0,
            'horizontal_high': 50.0,
            'horizontal_critical': 100.0,
            'vertical_low': 10.0,
            'vertical_medium': 25.0,
            'vertical_high': 50.0,
            'vertical_critical': 100.0,
            'cumulative_low': 20.0,         # Most important!
            'cumulative_medium': 50.0,
            'cumulative_high': 100.0,
            'cumulative_critical': 200.0,
        },
        'rainfall': {
            'intensity_low': 5.0,           # mm/h
            'intensity_medium': 10.0,
            'intensity_high': 20.0,
            'intensity_critical': 50.0,
            'cumulative_1h_low': 10.0,      # mm
            'cumulative_1h_medium': 25.0,
            'cumulative_1h_high': 50.0,
            'cumulative_1h_critical': 100.0,
        },
        'temperature': {
            'temp_min_critical': -20.0,     # °C
            'temp_min_high': -10.0,
            'temp_min_low': 0.0,
            'temp_max_low': 40.0,
            'temp_max_high': 50.0,
            'temp_max_critical': 60.0,
            'humidity_low': 10.0,           # %
            'humidity_high': 90.0,
        },
    }
    
    def __init__(self, db_path: str = "../database/sensors.db"):
        """Initialize alert manager"""
        self.db_path = db_path
        self.thresholds = self.DEFAULT_THRESHOLDS.copy()
        self.init_alert_tables()
        self.load_thresholds_from_db()
    
    def get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def load_thresholds_from_db(self):
        """Load thresholds from database"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('SELECT sensor_type, threshold_name, threshold_value FROM alert_thresholds')
            rows = cursor.fetchall()
            
            for row in rows:
                sensor_type = row['sensor_type']
                threshold_name = row['threshold_name']
                threshold_value = row['threshold_value']
                
                if sensor_type not in self.thresholds:
                    self.thresholds[sensor_type] = {}
                
                self.thresholds[sensor_type][threshold_name] = threshold_value
            
            conn.close()
        except Exception as e:
            print(f"Error loading thresholds from database: {str(e)}")
    
    def init_alert_tables(self):
        """Initialize alert tables in database"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Alerts table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL,
                sensor_type TEXT NOT NULL,
                danger_level TEXT NOT NULL,
                message TEXT,
                value REAL,
                threshold REAL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                acknowledged BOOLEAN DEFAULT 0,
                acknowledged_at TIMESTAMP,
                acknowledged_by TEXT
            )
        ''')
        
        # Alert thresholds table (for customization)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS alert_thresholds (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sensor_type TEXT NOT NULL,
                threshold_name TEXT NOT NULL,
                threshold_value REAL NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(sensor_type, threshold_name)
            )
        ''')
        
        # Insert default thresholds if not exists
        for sensor_type, thresholds in self.DEFAULT_THRESHOLDS.items():
            for threshold_name, threshold_value in thresholds.items():
                cursor.execute('''
                    INSERT OR IGNORE INTO alert_thresholds 
                    (sensor_type, threshold_name, threshold_value)
                    VALUES (?, ?, ?)
                ''', (sensor_type, threshold_name, threshold_value))
        
        # Create indexes
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_alert_device ON alerts(device_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_alert_timestamp ON alerts(timestamp)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_alert_level ON alerts(danger_level)')
        
        conn.commit()
        conn.close()
    
    def check_tilt(self, device_id: str, data: Dict) -> Optional[Tuple[DangerLevel, str, float]]:
        """Check tilt sensor for alerts"""
        try:
            roll = float(data.get('roll', 0))
            pitch = float(data.get('pitch', 0))
            
            # Check roll
            roll_abs = abs(roll)
            if roll_abs >= self.thresholds['tilt']['roll_critical']:
                return DangerLevel.CRITICAL, f"Tilt Roll CRITICAL: {roll:.2f}°", roll_abs
            elif roll_abs >= self.thresholds['tilt']['roll_high']:
                return DangerLevel.HIGH, f"Tilt Roll HIGH: {roll:.2f}°", roll_abs
            elif roll_abs >= self.thresholds['tilt']['roll_medium']:
                return DangerLevel.MEDIUM, f"Tilt Roll MEDIUM: {roll:.2f}°", roll_abs
            elif roll_abs >= self.thresholds['tilt']['roll_low']:
                return DangerLevel.LOW, f"Tilt Roll LOW: {roll:.2f}°", roll_abs
            
            # Check pitch
            pitch_abs = abs(pitch)
            if pitch_abs >= self.thresholds['tilt']['pitch_critical']:
                return DangerLevel.CRITICAL, f"Tilt Pitch CRITICAL: {pitch:.2f}°", pitch_abs
            elif pitch_abs >= self.thresholds['tilt']['pitch_high']:
                return DangerLevel.HIGH, f"Tilt Pitch HIGH: {pitch:.2f}°", pitch_abs
            elif pitch_abs >= self.thresholds['tilt']['pitch_medium']:
                return DangerLevel.MEDIUM, f"Tilt Pitch MEDIUM: {pitch:.2f}°", pitch_abs
            elif pitch_abs >= self.thresholds['tilt']['pitch_low']:
                return DangerLevel.LOW, f"Tilt Pitch LOW: {pitch:.2f}°", pitch_abs
            
            return None
        except Exception as e:
            return DangerLevel.LOW, f"Error checking tilt: {str(e)}", 0
    
    def check_vibration(self, device_id: str, data: Dict) -> Optional[Tuple[DangerLevel, str, float]]:
        """Check vibration sensor for alerts"""
        try:
            frequency = float(data.get('frequency', 0))
            amplitude_x = float(data.get('amplitude_x', 0))
            amplitude_y = float(data.get('amplitude_y', 0))
            amplitude_max = max(amplitude_x, amplitude_y)
            
            # Check amplitude
            if amplitude_max >= self.thresholds['vibration']['amplitude_critical']:
                return DangerLevel.CRITICAL, f"Vibration CRITICAL: {amplitude_max:.3f}G", amplitude_max
            elif amplitude_max >= self.thresholds['vibration']['amplitude_high']:
                return DangerLevel.HIGH, f"Vibration HIGH: {amplitude_max:.3f}G", amplitude_max
            elif amplitude_max >= self.thresholds['vibration']['amplitude_medium']:
                return DangerLevel.MEDIUM, f"Vibration MEDIUM: {amplitude_max:.3f}G", amplitude_max
            elif amplitude_max >= self.thresholds['vibration']['amplitude_low']:
                return DangerLevel.LOW, f"Vibration LOW: {amplitude_max:.3f}G", amplitude_max
            
            return None
        except Exception as e:
            return DangerLevel.LOW, f"Error checking vibration: {str(e)}", 0
    
    def check_displacement(self, device_id: str, data: Dict) -> Optional[Tuple[DangerLevel, str, float]]:
        """Check displacement sensor for alerts - MOST CRITICAL"""
        try:
            cumulative = float(data.get('cumulative', 0))
            horizontal = float(data.get('horizontal', 0))
            vertical = float(data.get('vertical', 0))
            
            # Cumulative is most important!
            if cumulative >= self.thresholds['displacement']['cumulative_critical']:
                return DangerLevel.CRITICAL, f"Displacement CRITICAL: {cumulative:.2f}mm (cumulative)", cumulative
            elif cumulative >= self.thresholds['displacement']['cumulative_high']:
                return DangerLevel.HIGH, f"Displacement HIGH: {cumulative:.2f}mm (cumulative)", cumulative
            elif cumulative >= self.thresholds['displacement']['cumulative_medium']:
                return DangerLevel.MEDIUM, f"Displacement MEDIUM: {cumulative:.2f}mm (cumulative)", cumulative
            elif cumulative >= self.thresholds['displacement']['cumulative_low']:
                return DangerLevel.LOW, f"Displacement LOW: {cumulative:.2f}mm (cumulative)", cumulative
            
            # Check individual metrics
            horiz_abs = abs(horizontal)
            if horiz_abs >= self.thresholds['displacement']['horizontal_critical']:
                return DangerLevel.CRITICAL, f"Displacement Horizontal CRITICAL: {horiz_abs:.2f}mm", horiz_abs
            
            vert_abs = abs(vertical)
            if vert_abs >= self.thresholds['displacement']['vertical_critical']:
                return DangerLevel.CRITICAL, f"Displacement Vertical CRITICAL: {vert_abs:.2f}mm", vert_abs
            
            return None
        except Exception as e:
            return DangerLevel.LOW, f"Error checking displacement: {str(e)}", 0
    
    def check_rainfall(self, device_id: str, data: Dict) -> Optional[Tuple[DangerLevel, str, float]]:
        """Check rainfall sensor for alerts"""
        try:
            intensity = float(data.get('intensity', 0))
            cumulative_1h = float(data.get('cumulative_1h', 0))
            
            # Check cumulative 1h (rain + landslide risk)
            if cumulative_1h >= self.thresholds['rainfall']['cumulative_1h_critical']:
                return DangerLevel.CRITICAL, f"Rainfall CRITICAL: {cumulative_1h:.1f}mm/h", cumulative_1h
            elif cumulative_1h >= self.thresholds['rainfall']['cumulative_1h_high']:
                return DangerLevel.HIGH, f"Rainfall HIGH: {cumulative_1h:.1f}mm/h", cumulative_1h
            elif cumulative_1h >= self.thresholds['rainfall']['cumulative_1h_medium']:
                return DangerLevel.MEDIUM, f"Rainfall MEDIUM: {cumulative_1h:.1f}mm/h", cumulative_1h
            elif cumulative_1h >= self.thresholds['rainfall']['cumulative_1h_low']:
                return DangerLevel.LOW, f"Rainfall LOW: {cumulative_1h:.1f}mm/h", cumulative_1h
            
            return None
        except Exception as e:
            return DangerLevel.LOW, f"Error checking rainfall: {str(e)}", 0
    
    def check_temperature(self, device_id: str, data: Dict) -> Optional[Tuple[DangerLevel, str, float]]:
        """Check temperature sensor for alerts"""
        try:
            temp = float(data.get('current', 0))
            humidity = float(data.get('humidity', 0))
            
            # Check temperature range
            if temp <= self.thresholds['temperature']['temp_min_critical']:
                return DangerLevel.CRITICAL, f"Temperature CRITICAL: {temp:.1f}°C (too cold)", temp
            elif temp <= self.thresholds['temperature']['temp_min_high']:
                return DangerLevel.HIGH, f"Temperature HIGH: {temp:.1f}°C (too cold)", temp
            elif temp <= self.thresholds['temperature']['temp_min_low']:
                return DangerLevel.LOW, f"Temperature LOW: {temp:.1f}°C (too cold)", temp
            
            if temp >= self.thresholds['temperature']['temp_max_critical']:
                return DangerLevel.CRITICAL, f"Temperature CRITICAL: {temp:.1f}°C (too hot)", temp
            elif temp >= self.thresholds['temperature']['temp_max_high']:
                return DangerLevel.HIGH, f"Temperature HIGH: {temp:.1f}°C (too hot)", temp
            elif temp >= self.thresholds['temperature']['temp_max_low']:
                return DangerLevel.LOW, f"Temperature LOW: {temp:.1f}°C (too hot)", temp
            
            # Check humidity
            if humidity <= self.thresholds['temperature']['humidity_low']:
                return DangerLevel.LOW, f"Humidity LOW: {humidity:.1f}%", humidity
            elif humidity >= self.thresholds['temperature']['humidity_high']:
                return DangerLevel.LOW, f"Humidity HIGH: {humidity:.1f}%", humidity
            
            return None
        except Exception as e:
            return DangerLevel.LOW, f"Error checking temperature: {str(e)}", 0
    
    def get_threshold_for_alert(self, sensor_type: str, danger_level: DangerLevel, value: float, data: Dict = None) -> float:
        """Get the threshold that was exceeded for an alert"""
        try:
            if sensor_type == 'tilt':
                roll = float(data.get('roll', 0) if data else 0)
                pitch = float(data.get('pitch', 0) if data else 0)
                
                roll_abs = abs(roll)
                pitch_abs = abs(pitch)
                
                if danger_level == DangerLevel.CRITICAL:
                    return max(self.thresholds['tilt']['roll_critical'], self.thresholds['tilt']['pitch_critical'])
                elif danger_level == DangerLevel.HIGH:
                    return max(self.thresholds['tilt']['roll_high'], self.thresholds['tilt']['pitch_high'])
                elif danger_level == DangerLevel.MEDIUM:
                    return max(self.thresholds['tilt']['roll_medium'], self.thresholds['tilt']['pitch_medium'])
                elif danger_level == DangerLevel.LOW:
                    return max(self.thresholds['tilt']['roll_low'], self.thresholds['tilt']['pitch_low'])
                    
            elif sensor_type == 'vibration':
                if danger_level == DangerLevel.CRITICAL:
                    return self.thresholds['vibration']['amplitude_critical']
                elif danger_level == DangerLevel.HIGH:
                    return self.thresholds['vibration']['amplitude_high']
                elif danger_level == DangerLevel.MEDIUM:
                    return self.thresholds['vibration']['amplitude_medium']
                elif danger_level == DangerLevel.LOW:
                    return self.thresholds['vibration']['amplitude_low']
                    
            elif sensor_type == 'displacement':
                if danger_level == DangerLevel.CRITICAL:
                    return self.thresholds['displacement']['cumulative_critical']
                elif danger_level == DangerLevel.HIGH:
                    return self.thresholds['displacement']['cumulative_high']
                elif danger_level == DangerLevel.MEDIUM:
                    return self.thresholds['displacement']['cumulative_medium']
                elif danger_level == DangerLevel.LOW:
                    return self.thresholds['displacement']['cumulative_low']
                    
            elif sensor_type == 'rainfall':
                if danger_level == DangerLevel.CRITICAL:
                    return self.thresholds['rainfall']['cumulative_1h_critical']
                elif danger_level == DangerLevel.HIGH:
                    return self.thresholds['rainfall']['cumulative_1h_high']
                elif danger_level == DangerLevel.MEDIUM:
                    return self.thresholds['rainfall']['cumulative_1h_medium']
                elif danger_level == DangerLevel.LOW:
                    return self.thresholds['rainfall']['cumulative_1h_low']
                    
            elif sensor_type == 'temperature':
                if danger_level == DangerLevel.CRITICAL:
                    return self.thresholds['temperature']['temp_max_critical']
                elif danger_level == DangerLevel.HIGH:
                    return self.thresholds['temperature']['temp_max_high']
                elif danger_level == DangerLevel.LOW:
                    return self.thresholds['temperature']['temp_max_low']
        except Exception as e:
            print(f"Error getting threshold for alert: {str(e)}")
        
        return 0.0
    
    def check_sensor(self, device_id: str, sensor_type: str, data: Dict) -> Optional[Tuple[DangerLevel, str, float]]:
        """Check sensor data and return alert if triggered"""
        if sensor_type == 'tilt':
            return self.check_tilt(device_id, data)
        elif sensor_type == 'vibration':
            return self.check_vibration(device_id, data)
        elif sensor_type == 'displacement':
            return self.check_displacement(device_id, data)
        elif sensor_type == 'rainfall':
            return self.check_rainfall(device_id, data)
        elif sensor_type == 'temperature':
            return self.check_temperature(device_id, data)
        
        return None
    
    def create_alert(self, device_id: str, sensor_type: str, danger_level: DangerLevel, 
                    message: str, value: float, threshold: float) -> bool:
        """Create a new alert"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO alerts 
                (device_id, sensor_type, danger_level, message, value, threshold)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (device_id, sensor_type, danger_level.value, message, value, threshold))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error creating alert: {str(e)}")
            return False
    
    def get_active_alerts(self, danger_level: Optional[str] = None, limit: int = -1, acknowledged: Optional[bool] = None) -> List[Dict]:
        """Get alerts with optional filtering by acknowledgement status
        
        Args:
            danger_level: Filter by danger level (optional)
            limit: Maximum number of results (-1 for no limit)
            acknowledged: Filter by acknowledgement status (None = all, True = acknowledged only, False = unacknowledged only)
        """
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            limit_clause = "" if limit == -1 else f"LIMIT {limit}"
            
            # Build WHERE clause based on parameters
            where_conditions = []
            params = []
            
            if danger_level:
                where_conditions.append("danger_level = ?")
                params.append(danger_level)
            
            if acknowledged is not None:
                where_conditions.append("acknowledged = ?")
                params.append(1 if acknowledged else 0)
            
            where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
            
            query = f'''
                SELECT * FROM alerts 
                WHERE {where_clause}
                ORDER BY timestamp DESC
                {limit_clause}
            '''
            
            cursor.execute(query, params)
            results = [dict(row) for row in cursor.fetchall()]
            conn.close()
            return results
        except Exception as e:
            print(f"Error getting alerts: {str(e)}")
            return []
    
    def get_alert_history(self, device_id: Optional[str] = None, limit: int = 100) -> List[Dict]:
        """Get alert history"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            if device_id:
                cursor.execute('''
                    SELECT * FROM alerts 
                    WHERE device_id = ?
                    ORDER BY timestamp DESC
                    LIMIT ?
                ''', (device_id, limit))
            else:
                cursor.execute('''
                    SELECT * FROM alerts 
                    ORDER BY timestamp DESC
                    LIMIT ?
                ''', (limit,))
            
            results = [dict(row) for row in cursor.fetchall()]
            conn.close()
            return results
        except Exception as e:
            print(f"Error getting alert history: {str(e)}")
            return []
    
    def acknowledge_alert(self, alert_id: int, acknowledged_by: str = "system") -> bool:
        """Mark alert as acknowledged"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                UPDATE alerts 
                SET acknowledged = 1, acknowledged_at = CURRENT_TIMESTAMP, acknowledged_by = ?
                WHERE id = ?
            ''', (acknowledged_by, alert_id))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error acknowledging alert: {str(e)}")
            return False
    
    def update_threshold(self, sensor_type: str, threshold_name: str, value: float) -> bool:
        """Update a threshold value"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT OR REPLACE INTO alert_thresholds 
                (sensor_type, threshold_name, threshold_value, updated_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ''', (sensor_type, threshold_name, value))
            
            # Update local thresholds
            if sensor_type not in self.thresholds:
                self.thresholds[sensor_type] = {}
            self.thresholds[sensor_type][threshold_name] = value
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error updating threshold: {str(e)}")
            return False
    
    def get_thresholds(self, sensor_type: Optional[str] = None) -> Dict:
        """Get all thresholds or for a specific sensor type
        Returns format: {sensor_type: {threshold_name: {value: X, updated_at: Y}}}
        """
        from datetime import datetime
        result = {}
        for sensor, thresholds in self.thresholds.items():
            result[sensor] = {}
            for threshold_name, value in thresholds.items():
                result[sensor][threshold_name] = {
                    'value': value,
                    'updated_at': datetime.now().isoformat()
                }
        
        if sensor_type:
            return result.get(sensor_type, {})
        return result
    
    def get_all_thresholds_from_db(self) -> Dict:
        """Get all thresholds from database merged with defaults (with metadata)"""
        try:
            from datetime import datetime
            
            # Start with all defaults
            result = {}
            for sensor, thresholds in self.thresholds.items():
                result[sensor] = {}
                for threshold_name, value in thresholds.items():
                    result[sensor][threshold_name] = {
                        'value': value,
                        'updated_at': datetime.now().isoformat()
                    }
            
            # Override with custom thresholds from database if they exist
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT sensor_type, threshold_name, threshold_value, updated_at 
                FROM alert_thresholds 
                ORDER BY sensor_type, threshold_name
            ''')
            rows = cursor.fetchall()
            
            for row in rows:
                sensor_type = row['sensor_type']
                threshold_name = row['threshold_name']
                
                if sensor_type not in result:
                    result[sensor_type] = {}
                
                result[sensor_type][threshold_name] = {
                    'value': row['threshold_value'],
                    'updated_at': row['updated_at']
                }
            
            conn.close()
            return result
        except Exception as e:
            print(f"Error getting thresholds from database: {str(e)}")
            # Return defaults on error
            result = {}
            from datetime import datetime
            for sensor, thresholds in self.thresholds.items():
                result[sensor] = {}
                for threshold_name, value in thresholds.items():
                    result[sensor][threshold_name] = {
                        'value': value,
                        'updated_at': datetime.now().isoformat()
                    }
            return result
    
    def reset_thresholds(self) -> bool:
        """Reset all thresholds to default values"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Delete all thresholds
            cursor.execute('DELETE FROM alert_thresholds')
            
            # Re-insert defaults
            for sensor_type, thresholds in self.DEFAULT_THRESHOLDS.items():
                for threshold_name, threshold_value in thresholds.items():
                    cursor.execute('''
                        INSERT INTO alert_thresholds 
                        (sensor_type, threshold_name, threshold_value)
                        VALUES (?, ?, ?)
                    ''', (sensor_type, threshold_name, threshold_value))
            
            # Reset local thresholds
            self.thresholds = self.DEFAULT_THRESHOLDS.copy()
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error resetting thresholds: {str(e)}")
            return False
    
    def get_alert_stats(self) -> Dict:
        """Get alert statistics"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Count active alerts by level
            stats = {
                'active_alerts': 0,
                'critical': 0,
                'high': 0,
                'medium': 0,
                'low': 0,
                'total_all_time': 0,
                'total_alerts_today': 0
            }
            
            cursor.execute('SELECT COUNT(*) as count FROM alerts WHERE acknowledged = 0')
            stats['active_alerts'] = cursor.fetchone()['count']
            
            for level in ['critical', 'high', 'medium', 'low']:
                cursor.execute(
                    'SELECT COUNT(*) as count FROM alerts WHERE acknowledged = 0 AND danger_level = ?',
                    (level,)
                )
                stats[level] = cursor.fetchone()['count']
            
            cursor.execute('SELECT COUNT(*) as count FROM alerts')
            stats['total_all_time'] = cursor.fetchone()['count']
            
            cursor.execute('''
                SELECT COUNT(*) as count FROM alerts 
                WHERE DATE(timestamp) = DATE('now')
            ''')
            stats['total_alerts_today'] = cursor.fetchone()['count']
            
            conn.close()
            return stats
        except Exception as e:
            print(f"Error getting alert stats: {str(e)}")
            return {}
    
    def get_daily_alerts(self, days: int = 30) -> List[Dict]:
        """Get alert counts grouped by day for the past N days"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Get alerts for the past N days grouped by date
            cursor.execute('''
                SELECT 
                    DATE(timestamp) as date,
                    COUNT(*) as total,
                    SUM(CASE WHEN danger_level = 'critical' THEN 1 ELSE 0 END) as critical,
                    SUM(CASE WHEN danger_level = 'high' THEN 1 ELSE 0 END) as warning,
                    SUM(CASE WHEN danger_level = 'medium' THEN 1 ELSE 0 END) as medium,
                    SUM(CASE WHEN danger_level = 'low' THEN 1 ELSE 0 END) as low
                FROM alerts
                WHERE DATE(timestamp) >= DATE('now', '-' || ? || ' days')
                GROUP BY DATE(timestamp)
                ORDER BY date ASC
            ''', (days,))
            
            rows = cursor.fetchall()
            daily_data = []
            
            for row in rows:
                daily_data.append({
                    'date': row['date'],
                    'total': row['total'],
                    'critical': row['critical'] or 0,
                    'warning': row['warning'] or 0,
                    'medium': row['medium'] or 0,
                    'low': row['low'] or 0,
                })
            
            conn.close()
            return daily_data
        except Exception as e:
            print(f"Error getting daily alerts: {str(e)}")
            return []
    
    # ============ PROVINCE-SPECIFIC THRESHOLDS ============
    
    def update_threshold_by_province(self, province: str, sensor_type: str, 
                                    threshold_name: str, value: float) -> bool:
        """Update a threshold for a specific province"""
        try:
            # Import here to avoid circular import
            import sys
            import os
            sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
            from database import SensorDatabase
            
            db = SensorDatabase()
            return db.save_threshold_by_province(province, sensor_type, threshold_name, value)
        except Exception as e:
            print(f"Error updating threshold by province: {str(e)}")
            return False
    
    def get_thresholds_for_province(self, province: str, sensor_type: Optional[str] = None) -> Dict:
        """
        Get thresholds for a specific province.
        Merges province-specific custom thresholds with defaults.
        Returns format: {sensor_type: {threshold_name: {value: X, updated_at: Y}}}
        """
        try:
            import sys
            import os
            sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
            from database import SensorDatabase
            from datetime import datetime
            
            db = SensorDatabase()
            province_thresholds = db.get_thresholds_by_province(province)
            
            # Start with all defaults
            result = {}
            for sensor, thresholds in self.thresholds.items():
                result[sensor] = {}
                for threshold_name, value in thresholds.items():
                    result[sensor][threshold_name] = {
                        'value': value,
                        'updated_at': datetime.now().isoformat()
                    }
            
            # Override with province-specific custom thresholds if they exist
            if province_thresholds:
                for sensor, thresholds in province_thresholds.items():
                    if sensor not in result:
                        result[sensor] = {}
                    for threshold_name, value in thresholds.items():
                        result[sensor][threshold_name] = {
                            'value': value,
                            'updated_at': datetime.now().isoformat()
                        }
            
            if sensor_type:
                return result.get(sensor_type, {})
            return result
        except Exception as e:
            print(f"Error getting thresholds for province: {str(e)}")
            # Return defaults on error with metadata
            result = {}
            thresholds_to_use = self.thresholds
            for sensor, thresholds in thresholds_to_use.items():
                result[sensor] = {}
                for threshold_name, value in thresholds.items():
                    result[sensor][threshold_name] = {
                        'value': value,
                        'updated_at': datetime.now().isoformat()
                    }
            
            if sensor_type:
                return result.get(sensor_type, {})
            return result
    
    def get_device_alert_thresholds(self, device_id: str, sensor_type: Optional[str] = None) -> Dict:
        """
        Get thresholds for a device based on its province.
        Returns format: {sensor_type: {threshold_name: {value: X, updated_at: Y}}}
        """
        try:
            import sys
            import os
            sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
            from database import SensorDatabase
            
            db = SensorDatabase()
            province = db.get_device_province(device_id)
            
            if province:
                return self.get_thresholds_for_province(province, sensor_type)
            
            # Return defaults if no province found (with metadata)
            from datetime import datetime
            result = {}
            thresholds_to_use = self.thresholds
            for sensor, thresholds in thresholds_to_use.items():
                result[sensor] = {}
                for threshold_name, value in thresholds.items():
                    result[sensor][threshold_name] = {
                        'value': value,
                        'updated_at': datetime.now().isoformat()
                    }
            
            if sensor_type:
                return result.get(sensor_type, {})
            return result
        except Exception as e:
            print(f"Error getting device alert thresholds: {str(e)}")
            # Return defaults on error (with metadata)
            from datetime import datetime
            result = {}
            thresholds_to_use = self.thresholds
            for sensor, thresholds in thresholds_to_use.items():
                result[sensor] = {}
                for threshold_name, value in thresholds.items():
                    result[sensor][threshold_name] = {
                        'value': value,
                        'updated_at': datetime.now().isoformat()
                    }
            
            if sensor_type:
                return result.get(sensor_type, {})
            return result
