"""
Database Seed Script - Populate with initial data
Run this to seed database with users and devices
"""

import os
import sys
import sqlite3

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from database import SensorDatabase
from jwt_auth_manager import JWTAuthManager
import json


def seed_all():
    """Seed database with all initial data"""
    
    print("\n" + "="*70)
    print("DATABASE SEED - INITIALIZING WITH DEFAULT DATA")
    print("="*70 + "\n")
    
    # Initialize database
    db = SensorDatabase()
    print("✓ Database initialized\n")
    
    # Seed users
    print("🌱 SEEDING USERS")
    print("-"*70)
    
    default_users = [
        {
            'username': 'admin',
            'email': 'admin@landslide.local',
            'password': 'admin123',
            'role': 'admin',
            'province': None
        },
        {
            'username': 'operator',
            'email': 'operator@landslide.local',
            'password': 'operator123',
            'role': 'operator',
            'province': 'Hà Nội'
        },
        {
            'username': 'user',
            'email': 'user@landslide.local',
            'password': 'user123',
            'role': 'user',
            'province': None
        }
    ]
    
    for user_data in default_users:
        try:
            username = user_data['username']
            existing = db.get_user_by_username(username)
            if existing:
                print(f"ℹ {username} already exists")
                continue
                
            password_hash = JWTAuthManager.hash_password(user_data['password'])
            success = db.create_user(
                username=username,
                email=user_data['email'],
                password_hash=password_hash,
                role=user_data['role'],
                province=user_data.get('province')
            )
            
            if success:
                print(f"✅ Created user: {username}")
            else:
                print(f"❌ Failed to create user: {username}")
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print()
    
    # Seed devices
    print("🔧 SEEDING DEVICES")
    print("-"*70)
    
    config_path = os.path.join(os.path.dirname(__file__), 'config', 'devices.json')
    
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
            devices = config.get('devices', [])
    except:
        devices = []
    
    if devices:
        for device_config in devices:
            try:
                device_id = device_config.get('device_id')
                existing = db.get_device_location(device_id)
                if existing:
                    print(f"ℹ Device {device_id} already exists")
                    continue
                    
                success = db.register_device(
                    device_id=device_id,
                    project_id=device_config.get('project_id', 'PRJ001'),
                    site_id=device_config.get('site_id', ''),
                    province=device_config.get('province', ''),
                    latitude=device_config.get('base_lat', 0),
                    longitude=device_config.get('base_lon', 0),
                    name=device_config.get('name', device_id)
                )
                
                if success:
                    print(f"✅ Added device: {device_id}")
                else:
                    print(f"❌ Failed to add device: {device_id}")
            except Exception as e:
                print(f"❌ Error: {e}")
    else:
        print("ℹ No devices found in config")
    
    print()
    
    # Seed thresholds
    print("📊 SEEDING THRESHOLDS")
    print("-"*70)
    
    default_thresholds = {
        'Hà Nội': {
            'tilt': {'yellow': 5.0, 'red': 10.0},
            'vibration': {'yellow': 0.5, 'red': 1.0},
            'displacement': {'yellow': 10.0, 'red': 20.0},
            'rainfall': {'yellow': 100.0, 'red': 200.0}
        },
        'Hải Phòng': {
            'tilt': {'yellow': 5.0, 'red': 10.0},
            'vibration': {'yellow': 0.5, 'red': 1.0},
            'displacement': {'yellow': 10.0, 'red': 20.0},
            'rainfall': {'yellow': 100.0, 'red': 200.0}
        }
    }
    
    for province, sensor_thresholds in default_thresholds.items():
        for sensor_type, thresholds in sensor_thresholds.items():
            try:
                # Save yellow threshold
                db.save_threshold_by_province(
                    province=province,
                    sensor_type=sensor_type,
                    threshold_name='yellow',
                    value=thresholds.get('yellow', 0)
                )
                
                # Save red threshold
                db.save_threshold_by_province(
                    province=province,
                    sensor_type=sensor_type,
                    threshold_name='red',
                    value=thresholds.get('red', 0)
                )
                
                print(f"✅ {province} - {sensor_type}: yellow={thresholds.get('yellow', 0)}, red={thresholds.get('red', 0)}")
            except Exception as e:
                print(f"❌ Error setting threshold: {e}")
    
    print()
    
    # Summary
    print("="*70)
    print("✨ SEED COMPLETE!")
    print("="*70)
    print("\n📝 Default Credentials:")
    print("-"*70)
    for user in default_users:
        print(f"  {user['username']:15} / {user['password']:15} ({user['role']})")
    print("-"*70)
    print("\n⚠️  Change these passwords in production!\n")


if __name__ == '__main__':
    seed_all()
