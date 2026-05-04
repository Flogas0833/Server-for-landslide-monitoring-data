"""
JWT Authentication Manager - Handle JWT tokens and authentication
Uses PyJWT for token generation and validation
"""

import jwt
import os
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify, g
from typing import Dict, Optional, Tuple, Any
from hashlib import sha256
import secrets

class JWTAuthManager:
    """Manage JWT token generation and validation"""
    
    # Load config from environment or use defaults
    SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
    ALGORITHM = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '15'))
    REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv('REFRESH_TOKEN_EXPIRE_DAYS', '7'))
    
    @staticmethod
    def create_access_token(user_id: str, username: str, role: str, 
                           expires_delta: Optional[timedelta] = None) -> str:
        """
        Create JWT access token
        
        Args:
            user_id: User ID
            username: Username
            role: User role (admin, operator, viewer, device)
            expires_delta: Custom expiration time
        
        Returns:
            JWT token string
        """
        if expires_delta is None:
            expires_delta = timedelta(minutes=JWTAuthManager.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        expire = datetime.now(timezone.utc) + expires_delta
        
        payload = {
            'user_id': user_id,
            'username': username,
            'role': role,
            'exp': expire,
            'iat': datetime.now(timezone.utc),
            'type': 'access'
        }
        
        token = jwt.encode(
            payload,
            JWTAuthManager.SECRET_KEY,
            algorithm=JWTAuthManager.ALGORITHM
        )
        
        return token
    
    @staticmethod
    def create_refresh_token(user_id: str, username: str) -> str:
        """
        Create JWT refresh token (longer expiry)
        
        Args:
            user_id: User ID
            username: Username
        
        Returns:
            JWT refresh token string
        """
        expire = datetime.now(timezone.utc) + timedelta(
            days=JWTAuthManager.REFRESH_TOKEN_EXPIRE_DAYS
        )
        
        payload = {
            'user_id': user_id,
            'username': username,
            'exp': expire,
            'iat': datetime.now(timezone.utc),
            'type': 'refresh'
        }
        
        token = jwt.encode(
            payload,
            JWTAuthManager.SECRET_KEY,
            algorithm=JWTAuthManager.ALGORITHM
        )
        
        return token
    
    @staticmethod
    def verify_token(token: str) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """
        Verify JWT token and extract payload
        
        Args:
            token: JWT token string
        
        Returns:
            Tuple of (is_valid, payload_dict)
        """
        try:
            payload = jwt.decode(
                token,
                JWTAuthManager.SECRET_KEY,
                algorithms=[JWTAuthManager.ALGORITHM]
            )
            return True, payload
        except jwt.ExpiredSignatureError:
            return False, {'error': 'Token has expired'}
        except jwt.InvalidTokenError as e:
            return False, {'error': f'Invalid token: {str(e)}'}
    
    @staticmethod
    def extract_token_from_request() -> Optional[str]:
        """
        Extract JWT token from request header (Bearer token)
        
        Returns:
            Token string or None
        """
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return None
        
        return auth_header[7:]  # Remove 'Bearer ' prefix
    
    @staticmethod
    def hash_password(password: str) -> str:
        """
        Hash password using sha256 (for simple setup)
        In production, use bcrypt: from werkzeug.security import generate_password_hash
        
        Args:
            password: Plain text password
        
        Returns:
            Hashed password
        """
        return sha256(password.encode()).hexdigest()
    
    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        """
        Verify password against hash
        
        Args:
            password: Plain text password
            password_hash: Hashed password
        
        Returns:
            True if password matches
        """
        return JWTAuthManager.hash_password(password) == password_hash


class RBACManager:
    """Manage Role-Based Access Control"""
    
    # Define role permissions
    ROLE_PERMISSIONS = {
        'admin': [
            'view:all_data',
            'view:users',
            'manage:users',
            'manage:devices',
            'manage:settings',
            'export:data',
            'view:audit_logs',
            'view:alerts',
            'manage:alerts'
        ],
        'operator': [
            'view:sensor_data',
            'view:devices',
            'view:alerts',
            'acknowledge:alerts',
            'export:data',
            'create:reports'
        ],
        'viewer': [
            'view:public_data',
            'view:devices',
            'view:alerts'
        ],
        'device': [
            'publish:sensor_data',
            'receive:commands'
        ]
    }
    
    @staticmethod
    def has_permission(role: str, permission: str) -> bool:
        """
        Check if role has permission
        
        Args:
            role: User role
            permission: Permission string (e.g., 'view:sensor_data')
        
        Returns:
            True if role has permission
        """
        if role not in RBACManager.ROLE_PERMISSIONS:
            return False
        
        return permission in RBACManager.ROLE_PERMISSIONS[role]
    
    @staticmethod
    def get_role_permissions(role: str) -> list:
        """
        Get all permissions for a role
        
        Args:
            role: User role
        
        Returns:
            List of permissions
        """
        return RBACManager.ROLE_PERMISSIONS.get(role, [])


def require_auth(allowed_roles: Optional[list] = None, 
                 required_permissions: Optional[list] = None):
    """
    Decorator to require JWT authentication on Flask routes
    
    Args:
        allowed_roles: List of allowed roles (e.g., ['admin', 'operator'])
        required_permissions: List of required permissions
    
    Usage:
        @require_auth(allowed_roles=['admin', 'operator'])
        def my_route():
            user = g.user
            return jsonify({'message': f'Hello {user["username"]}'})
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Extract token
            token = JWTAuthManager.extract_token_from_request()
            
            if not token:
                return jsonify({'error': 'Missing authorization token'}), 401
            
            # Verify token
            is_valid, payload = JWTAuthManager.verify_token(token)
            
            if not is_valid:
                return jsonify({'error': payload.get('error', 'Invalid token')}), 401
            
            # Check role if specified
            if allowed_roles and payload.get('role') not in allowed_roles:
                return jsonify({
                    'error': f"Access denied. Required roles: {', '.join(allowed_roles)}"
                }), 403
            
            # Check permissions if specified
            if required_permissions:
                user_role = payload.get('role')
                for permission in required_permissions:
                    if not RBACManager.has_permission(user_role, permission):
                        return jsonify({
                            'error': f"Missing required permission: {permission}"
                        }), 403
            
            # Store user info in Flask's g object
            g.user = payload
            g.user_id = payload.get('user_id')
            g.username = payload.get('username')
            g.role = payload.get('role')
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator


def require_role(*allowed_roles):
    """
    Shorthand decorator for role checking
    
    Usage:
        @require_role('admin', 'operator')
        def my_route():
            pass
    """
    return require_auth(allowed_roles=list(allowed_roles))


def require_permission(*required_permissions):
    """
    Shorthand decorator for permission checking
    
    Usage:
        @require_permission('view:sensor_data', 'export:data')
        def my_route():
            pass
    """
    return require_auth(required_permissions=list(required_permissions))
