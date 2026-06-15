"""
Database Initialization Module
Handles automatic database setup and seeding on application startup
"""

import os
import sqlite3
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
        seed_database(db, force=False)
        
        return True
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        return False


if __name__ == '__main__':
    # Test script - can be run directly
    db = SensorDatabase()
    initialize_app_database(db)
