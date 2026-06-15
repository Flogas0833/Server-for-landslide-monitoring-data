"""
Database Initialization Module
Handles automatic database setup and seeding on application startup
"""

import os
import sqlite3
import json
import shutil
from database import SensorDatabase
from jwt_auth_manager import JWTAuthManager


def restore_from_template(db_path: str, template_path: str) -> bool:
    """
    Restore database from template file
    
    Args:
        db_path: Path to target database file
        template_path: Path to template database file
        
    Returns:
        True if successful, False otherwise
    """
    try:
        os.makedirs(os.path.dirname(db_path) or ".", exist_ok=True)
        shutil.copy2(template_path, db_path)
        print(f"✓ Restored database from template: {template_path}")
        return True
    except Exception as e:
        print(f"❌ Error restoring from template: {e}")
        return False


def check_db_needs_seeding(db: SensorDatabase) -> bool:
    """
    Check if database needs seeding (has no users yet)
    """
    try:
        user = db.get_user_by_username('admin')
        return user is None
    except Exception as e:
        print(f"Error checking database: {e}")
        return True


def seed_database(db: SensorDatabase, force: bool = False) -> bool:
    """
    Seed database with default users and sample data
    
    Args:
        db: SensorDatabase instance
        force: Force re-seeding even if data exists
        
    Returns:
        True if successful, False otherwise
    """
    
    # Check if we need seeding
    if not force and not check_db_needs_seeding(db):
        print("✓ Database already initialized, skipping seed")
        return True
    
    # Default users to create
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
    
    print("\n" + "="*60)
    print("🌱 SEEDING DATABASE WITH DEFAULT USERS")
    print("="*60 + "\n")
    
    # Clear existing users if forcing
    if force:
        try:
            conn = sqlite3.connect(db.db_path)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM users")
            conn.commit()
            conn.close()
            print("✓ Cleared existing users from database\n")
        except Exception as e:
            print(f"⚠ Could not clear existing users: {e}\n")
    
    # Create default users
    created_count = 0
    for user_data in default_users:
        try:
            username = user_data['username']
            email = user_data['email']
            password = user_data['password']
            role = user_data['role']
            province = user_data.get('province')
            
            # Check if user already exists
            existing_user = db.get_user_by_username(username)
            if existing_user and not force:
                print(f"ℹ User already exists: {username}")
                continue
            
            # Hash password and create user
            password_hash = JWTAuthManager.hash_password(password)
            success = db.create_user(
                username=username,
                email=email,
                password_hash=password_hash,
                role=role,
                province=province
            )
            
            if success:
                print(f"✅ Created user: {username}")
                print(f"   └─ Email: {email}")
                print(f"   └─ Role: {role}")
                print(f"   └─ Province: {province or 'N/A'}\n")
                created_count += 1
            else:
                print(f"❌ Failed to create user: {username}\n")
        
        except Exception as e:
            print(f"❌ Error creating user {user_data['username']}: {e}\n")
    
    print("="*60)
    print("✨ Database Seeding Complete!")
    print("="*60)
    print("\n📝 Default Credentials:")
    print("-"*60)
    for user_data in default_users:
        print(f"  {user_data['username']:15} | {user_data['password']:15} | {user_data['role']}")
    print("-"*60)
    print("\n⚠️  IMPORTANT SECURITY NOTES:")
    print("  • Change all default passwords in production!")
    print("  • Update JWT_SECRET_KEY environment variable!")
    print("  • Use strong, unique passwords for production users!")
    print("="*60 + "\n")
    
    return created_count > 0


def load_devices_from_config(config_path: str = None) -> list:
    """
    Load devices from config/devices.json
    
    Args:
        config_path: Path to devices.json (if None, uses default location)
        
    Returns:
        List of device configurations
    """
    if config_path is None:
        # Calculate path relative to backend directory
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        config_path = os.path.join(backend_dir, '..', 'config', 'devices.json')
    
    try:
        if os.path.exists(config_path):
            with open(config_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('devices', [])
    except Exception as e:
        print(f"Warning: Could not load devices from {config_path}: {e}")
    
    return []


def seed_devices(db: SensorDatabase, force: bool = False) -> bool:
    """
    Seed database with devices from config/devices.json
    
    Args:
        db: SensorDatabase instance
        force: Force re-seeding even if devices exist
        
    Returns:
        True if successful, False otherwise
    """
    
    devices = load_devices_from_config()
    
    if not devices:
        print("ℹ No devices found in config/devices.json")
        return False
    
    # Check if devices already exist
    if not force:
        try:
            existing_devices = db.get_all_devices()
            if existing_devices and len(existing_devices) > 0:
                print(f"ℹ Database already has {len(existing_devices)} device(s), skipping device seed")
                return True
        except Exception as e:
            print(f"Warning: Could not check existing devices: {e}")
    
    print("\n🔧 SEEDING DEVICES FROM CONFIG")
    print("-"*60)
    
    created_count = 0
    for device_config in devices:
        try:
            device_id = device_config.get('device_id')
            name = device_config.get('name', device_id)
            
            # Register device using register_device method
            success = db.register_device(
                device_id=device_id,
                project_id=device_config.get('project_id', 'PRJ001'),
                site_id=device_config.get('site_id', ''),
                province=device_config.get('province', ''),
                latitude=device_config.get('base_lat', 0),
                longitude=device_config.get('base_lon', 0),
                name=name
            )
            
            if success:
                print(f"✅ Added device: {device_id}")
                print(f"   └─ Name: {name}")
                print(f"   └─ Location: ({device_config.get('base_lat', 0)}, {device_config.get('base_lon', 0)})")
                created_count += 1
            else:
                print(f"❌ Failed to add device {device_id}")
        
        except Exception as e:
            print(f"❌ Error adding device {device_config.get('device_id', 'unknown')}: {e}")
    
    print("-"*60)
    print(f"✨ Devices seeding complete! ({created_count} device(s) added)\n")
    
    return created_count > 0


def seed_users_and_devices(db: SensorDatabase, force: bool = False) -> bool:
    """
    Seed both users and devices to database
    
    Args:
        db: SensorDatabase instance
        force: Force re-seeding
        
    Returns:
        True if seeding was performed
    """
    # Seed users
    users_seeded = seed_database(db, force=force)
    
    # Seed devices
    devices_seeded = seed_devices(db, force=force)
    
    return users_seeded or devices_seeded


def seed_thresholds(db: SensorDatabase) -> bool:
    """
    Seed default alert thresholds for provinces
    
    Args:
        db: SensorDatabase instance
        
    Returns:
        True if successful
    """
    
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
    
    print("\n📊 SEEDING THRESHOLDS")
    print("-"*60)
    
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
                
                print(f"✅ {province} - {sensor_type}: yellow={thresholds['yellow']}, red={thresholds['red']}")
            except Exception as e:
                print(f"❌ Error: {e}")
    
    print("-"*60 + "\n")
    return True


def initialize_app_database(db: SensorDatabase = None) -> bool:
    """
    Initialize database on application startup
    
    Args:
        db: SensorDatabase instance (if None, creates new instance)
        
    Returns:
        True if successful, False otherwise
    """
    
    if db is None:
        # Check for template BEFORE creating SensorDatabase instance
        # (because SensorDatabase auto-creates empty DB on instantiation)
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        db_path = os.path.join(project_root, 'database', 'sensors.db')
        template_path = os.path.join(
            os.path.dirname(db_path),
            'sensors.db.template'
        )
        
        db_exists = os.path.exists(db_path)
        
        if not db_exists and os.path.exists(template_path):
            print(f"📁 Database not found")
            print(f"📋 Found template database, restoring from template...")
            if restore_from_template(db_path, template_path):
                print("✓ Database restored from template\n")
                # Now create SensorDatabase instance with restored DB
                db = SensorDatabase(db_path)
                # Seed thresholds even if restoring from template
                try:
                    seed_thresholds(db)
                except Exception as e:
                    print(f"Warning: Could not seed thresholds: {e}\n")
                return True
        
        # Create new SensorDatabase instance (will create empty DB if needed)
        db = SensorDatabase()
    
    try:
        # Database tables already created by SensorDatabase.__init__
        print("✓ Database tables initialized\n")
        
        # Seed with default data if no users exist yet
        if check_db_needs_seeding(db):
            print("🌱 Database is empty, seeding with default data...\n")
            seed_users_and_devices(db, force=False)
            seed_thresholds(db)
        else:
            print("✓ Database already initialized with data\n")
        
        return True
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        return False


if __name__ == '__main__':
    # Test script - can be run directly
    initialize_app_database()
