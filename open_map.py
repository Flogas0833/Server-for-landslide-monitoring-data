#!/usr/bin/env python3
"""
Landslide Monitoring System - Map Viewer
Opens the interactive map and updates data in real-time
"""

import webbrowser
import time
import subprocess
import sys
import os
import signal
from pathlib import Path

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header():
    print(f"\n{Colors.BOLD}{'='*80}{Colors.RESET}")
    print(f"{Colors.BOLD}🗺️  LANDSLIDE MONITORING SYSTEM - MAP VIEWER{Colors.RESET}")
    print(f"{Colors.BOLD}{'='*80}{Colors.RESET}\n")

def print_status(status, message):
    if status == 'info':
        print(f"{Colors.BLUE}ℹ{Colors.RESET} {message}")
    elif status == 'success':
        print(f"{Colors.GREEN}✓{Colors.RESET} {message}")
    elif status == 'warning':
        print(f"{Colors.YELLOW}⚠{Colors.RESET} {message}")
    elif status == 'error':
        print(f"{Colors.RED}✗{Colors.RESET} {message}")

def check_service(url, timeout=2):
    """Check if a service is responding"""
    try:
        result = subprocess.run(
            ['curl', '-s', '-m', str(timeout), url],
            capture_output=True,
            timeout=timeout+1
        )
        return result.returncode == 0
    except:
        return False

def open_map():
    """Open the map in the default browser"""
    print_header()
    
    map_url = "http://localhost:5000"
    
    # Check if web server is running
    print_status('info', "Checking web server status...")
    if not check_service(map_url):
        print_status('error', f"Web server not responding at {map_url}")
        print_status('warning', "Please start the system first:")
        print(f"  bash start_system.sh\n")
        sys.exit(1)
    
    print_status('success', f"Web server is running")
    
    # Get device count
    api_url = f"{map_url}/api/devices"
    try:
        import json
        result = subprocess.run(
            ['curl', '-s', api_url],
            capture_output=True,
            timeout=2,
            text=True
        )
        if result.returncode == 0:
            devices = json.loads(result.stdout)
            print_status('success', f"Found {len(devices)} sensor(s)")
            for device in devices:
                lat = device.get('latitude', 'N/A')
                lon = device.get('longitude', 'N/A')
                name = device.get('name', device.get('device_id', 'Unknown'))
                print(f"           📍 {name}: ({lat:.4f}, {lon:.4f})")
    except:
        pass
    
    print_status('info', f"Opening map at {map_url}...\n")
    
    # Try to open browser
    try:
        webbrowser.open(map_url)
        print_status('success', "Map opened in browser")
    except:
        print_status('warning', f"Could not open browser automatically")
        print_status('info', f"Please open manually: {map_url}")
    
    print()
    print(f"{Colors.BOLD}📍 AVAILABLE PAGES:{Colors.RESET}")
    print(f"   Map View:  {Colors.BLUE}{map_url}/{Colors.RESET}")
    print(f"   Dashboard: {Colors.BLUE}{map_url}/dashboard{Colors.RESET}")
    print(f"   API:       {Colors.BLUE}{map_url}/api/devices{Colors.RESET}")
    print()
    
    print(f"{Colors.BOLD}📊 REAL-TIME INFO:{Colors.RESET}")
    print(f"   • Map updates every 10 seconds")
    print(f"   • Dashboard updates every 5 seconds")
    print(f"   • Click on markers to see sensor data")
    print()
    
    print(f"{Colors.BOLD}🎮 KEYBOARD SHORTCUTS:{Colors.RESET}")
    print(f"   • Scroll: Zoom in/out on map")
    print(f"   • Click:  View sensor details")
    print(f"   • Drag:   Pan around the map")
    print()

if __name__ == "__main__":
    try:
        open_map()
        print(f"{Colors.BOLD}Press Ctrl+C to exit{Colors.RESET}\n")
        
        # Keep running
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Exiting...{Colors.RESET}")
        sys.exit(0)
    except Exception as e:
        print_status('error', str(e))
        sys.exit(1)
