#!/usr/bin/env python3
"""Generate test alert data for the past 30 days"""

import sqlite3
from datetime import datetime, timedelta
import random

db_path = "database/sensors.db"

def generate_test_alerts():
    """Generate test alerts for the past 30 days"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    danger_levels = ['low', 'medium', 'high', 'critical']
    devices = ['device_001', 'device_002', 'device_003', 'device_004', 'device_005']
    sensor_types = ['tilt', 'vibration', 'displacement', 'rainfall']
    
    # Generate alerts for the past 30 days
    for day_offset in range(30):
        date = datetime.now() - timedelta(days=day_offset)
        # Random number of alerts per day (0-15)
        num_alerts = random.randint(0, 15)
        
        for _ in range(num_alerts):
            device_id = random.choice(devices)
            sensor_type = random.choice(sensor_types)
            danger_level = random.choice(danger_levels)
            
            # Random time during the day
            hour = random.randint(0, 23)
            minute = random.randint(0, 59)
            second = random.randint(0, 59)
            
            timestamp = date.replace(hour=hour, minute=minute, second=second).isoformat()
            
            message = f"{sensor_type.capitalize()} {danger_level.upper()}: Test data"
            value = random.uniform(0, 100)
            threshold = random.uniform(50, 100)
            
            cursor.execute('''
                INSERT INTO alerts (device_id, sensor_type, danger_level, message, value, threshold, timestamp, acknowledged)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (device_id, sensor_type, danger_level, message, value, threshold, timestamp, 0))
    
    conn.commit()
    conn.close()
    print("✅ Test alerts generated successfully!")

if __name__ == '__main__':
    generate_test_alerts()
