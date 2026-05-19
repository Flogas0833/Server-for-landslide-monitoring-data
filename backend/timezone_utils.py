"""
Timezone Utils - Handle timezone conversions for GMT+7
All internal timestamps are stored/processed as UTC
API responses convert to GMT+7 for display
"""

from datetime import datetime, timezone, timedelta
from typing import Optional
import re

# GMT+7 timezone offset
GMT7_OFFSET = timezone(timedelta(hours=7))

def get_utc_now() -> datetime:
    """Get current time in UTC with timezone info"""
    return datetime.now(timezone.utc)

def get_gmt7_now() -> datetime:
    """Get current time in GMT+7"""
    return get_utc_now().astimezone(GMT7_OFFSET)

def utc_to_gmt7(utc_dt: Optional[str]) -> Optional[str]:
    """
    Convert UTC ISO format string to GMT+7 ISO format string
    
    Args:
        utc_dt: ISO format datetime string (e.g., '2026-05-20T10:30:45Z' or '2026-05-20T10:30:45')
    
    Returns:
        ISO format string in GMT+7 or None if input is invalid
    """
    if not utc_dt:
        return None
    
    try:
        # Remove 'Z' if present
        if isinstance(utc_dt, str):
            utc_dt = utc_dt.rstrip('Z')
        
        # Parse the datetime
        dt = datetime.fromisoformat(utc_dt)
        
        # If no timezone info, assume UTC
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        
        # Convert to GMT+7
        gmt7_dt = dt.astimezone(GMT7_OFFSET)
        
        # Return ISO format without timezone info (local time)
        return gmt7_dt.isoformat()
    
    except (ValueError, TypeError):
        return None

def gmt7_to_utc(gmt7_dt: Optional[str]) -> Optional[str]:
    """
    Convert GMT+7 datetime string to UTC
    
    Args:
        gmt7_dt: ISO format datetime string in GMT+7
    
    Returns:
        ISO format UTC string with Z suffix or None if input is invalid
    """
    if not gmt7_dt:
        return None
    
    try:
        # Parse the datetime (assumes GMT+7)
        dt = datetime.fromisoformat(gmt7_dt)
        
        # If no timezone info, assume GMT+7
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=GMT7_OFFSET)
        
        # Convert to UTC
        utc_dt = dt.astimezone(timezone.utc)
        
        # Return ISO format with Z suffix
        return utc_dt.isoformat().replace('+00:00', 'Z')
    
    except (ValueError, TypeError):
        return None

def format_timestamp(ts: Optional[str], include_tz: bool = False) -> Optional[str]:
    """
    Format timestamp from database (UTC) to GMT+7 readable format
    
    Args:
        ts: ISO format timestamp string (UTC)
        include_tz: Whether to include timezone info
    
    Returns:
        Formatted timestamp string or None
    """
    if not ts:
        return None
    
    gmt7_ts = utc_to_gmt7(ts)
    if not gmt7_ts:
        return None
    
    try:
        dt = datetime.fromisoformat(gmt7_ts)
        return dt.strftime('%Y-%m-%d %H:%M:%S')
    except (ValueError, TypeError):
        return None

def now_utc_iso() -> str:
    """Get current time as UTC ISO format string"""
    return get_utc_now().isoformat().replace('+00:00', 'Z')

def now_gmt7_iso() -> str:
    """Get current time as GMT+7 ISO format string"""
    return get_gmt7_now().isoformat()
