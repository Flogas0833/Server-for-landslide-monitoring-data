"""
Authentication Module - Handle user authentication and session management
"""

from hashlib import sha256
import secrets
from datetime import datetime, timedelta

# Simple user database (in production, use a real database)
# Default auto-login user
DEFAULT_USER = 'admin'

USERS = {
    'admin': {
        'password_hash': sha256('admin123'.encode()).hexdigest(),
        'username': 'admin',
        'role': 'admin'
    },
    'user': {
        'password_hash': sha256('user123'.encode()).hexdigest(),
        'username': 'user',
        'role': 'user'
    }
}

# Session storage (in production, use Redis or database)
SESSIONS = {}

class AuthManager:
    """Manage user authentication and sessions"""
    
    @staticmethod
    def verify_password(username, password):
        """Verify username and password"""
        if username not in USERS:
            return False
        
        user = USERS[username]
        password_hash = sha256(password.encode()).hexdigest()
        return user['password_hash'] == password_hash
    
    @staticmethod
    def create_session(username):
        """Create a new session for a user"""
        session_token = secrets.token_urlsafe(32)
        SESSIONS[session_token] = {
            'username': username,
            'created_at': datetime.now(),
            'expires_at': datetime.now() + timedelta(hours=24)
        }
        return session_token
    
    @staticmethod
    def validate_session(session_token):
        """Validate a session token"""
        if session_token not in SESSIONS:
            return None
        
        session = SESSIONS[session_token]
        
        # Check if session has expired
        if datetime.now() > session['expires_at']:
            del SESSIONS[session_token]
            return None
        
        return session
    
    @staticmethod
    def destroy_session(session_token):
        """Destroy a session"""
        if session_token in SESSIONS:
            del SESSIONS[session_token]
            return True
        return False
    
    @staticmethod
    def get_user_info(username):
        """Get user information"""
        if username in USERS:
            user = USERS[username].copy()
            user.pop('password_hash', None)  # Remove password hash
            return user
        return None
    
    @staticmethod
    def auto_login():
        """Create a session for the default user (auto-login)"""
        session_token = AuthManager.create_session(DEFAULT_USER)
        return session_token, AuthManager.get_user_info(DEFAULT_USER)
