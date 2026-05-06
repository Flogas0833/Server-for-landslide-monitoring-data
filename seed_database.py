#!/usr/bin/env python3
"""
Seed database with default users
Run this script to initialize users in the database
"""

import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from database import SensorDatabase
from jwt_auth_manager import JWTAuthManager

def seed_database():
    """Initialize database with default users"""
    
    db = SensorDatabase()
    
    # Default users to create
    default_users = [
        {
            'username': 'admin',
            'email': 'admin@landslide.local',
            'password': 'admin123',
            'role': 'admin'
        },
        {
            'username': 'operator',
            'email': 'operator@landslide.local',
            'password': 'operator123',
            'role': 'operator'
        },
        {
            'username': 'user',
            'email': 'user@landslide.local',
            'password': 'user123',
            'role': 'user'
        }
    ]
    
    print("🌱 Seeding database with default users...\n")
    
    # Force create users (drop if exists)
    import sqlite3
    try:
        conn = sqlite3.connect(db.db_path)
        cursor = conn.cursor()
        
        # Clear existing users
        cursor.execute("DELETE FROM users")
        conn.commit()
        conn.close()
        print("Cleared existing users from database\n")
    except Exception as e:
        print(f"Note: Could not clear existing users: {e}\n")
    
    for user_data in default_users:
        username = user_data['username']
        email = user_data['email']
        password = user_data['password']
        role = user_data['role']
        
        # Hash password and create user
        password_hash = JWTAuthManager.hash_password(password)
        success = db.create_user(
            username=username,
            email=email,
            password_hash=password_hash,
            role=role
        )
        
        if success:
            print(f"✅ Created user: {username}")
            print(f"   - Email: {email}")
            print(f"   - Role: {role}")
            print(f"   - Password: {password}")
            print()
        else:
            print(f"❌ Failed to create user: {username}\n")
    
    print("\n✨ Database seeding complete!")
    print("\n📝 Default credentials:")
    print("─" * 50)
    for user_data in default_users:
        existing_user = db.get_user_by_username(user_data['username'])
        if existing_user:
            print(f"  {user_data['username']:15} | {user_data['password']:15} | {user_data['role']}")
    print("─" * 50)
    print("\n⚠️  IMPORTANT: Change these passwords in production!")
    print("💾 Change JWT_SECRET_KEY in environment variables!")

if __name__ == '__main__':
    seed_database()
