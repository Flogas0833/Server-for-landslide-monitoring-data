"""
Database Initialization Module
Handles automatic database setup and seeding on application startup
"""

import os
import sqlite3
import json
from database import SensorDatabase
from jwt_auth_manager import JWTAuthManager


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


def initialize_app_database(db: SensorDatabase = None) -> bool:
    """
    Initialize database on application startup
    
    Args:
        db: SensorDatabase instance (if None, creates new instance)
        
    Returns:
        True if successful, False otherwise
    """
    
    if db is None:
        db = SensorDatabase()
    
    try:
        # Check if database file exists
        db_exists = os.path.exists(db.db_path)
        
        if not db_exists:
            print(f"📁 Creating new database at: {db.db_path}")
        
        # Initialize tables (creates if not exist)
        print("📊 Initializing database tables...")
        db.init_database()
        print("✓ Database tables initialized\n")
        
        # Seed with default data if needed
        seed_users_and_devices(db, force=False)
        
        return True
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        return False


if __name__ == '__main__':
    # Test script - can be run directly
    db = SensorDatabase()
    initialize_app_database(db)
