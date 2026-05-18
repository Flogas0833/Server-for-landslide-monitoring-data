#!/usr/bin/env python3
"""
Test script for alert acknowledge endpoint
"""
import requests
import json
from datetime import datetime

BASE_URL = 'http://localhost:5000'

# Test credentials
TEST_ADMIN = {
    'username': 'admin',
    'password': 'admin'
}

def login():
    """Login and get JWT token"""
    response = requests.post(
        f'{BASE_URL}/api/auth/login',
        json=TEST_ADMIN
    )
    
    if response.status_code == 200:
        data = response.json()
        token = data.get('access_token')
        print(f"✓ Login successful")
        print(f"  Token: {token[:50]}...")
        return token
    else:
        print(f"✗ Login failed: {response.status_code}")
        print(f"  {response.text}")
        return None

def get_alerts(token):
    """Get active alerts"""
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(
        f'{BASE_URL}/api/alerts',
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        alerts = data.get('alerts', [])
        print(f"✓ Got {len(alerts)} alerts")
        if alerts:
            for alert in alerts[:3]:  # Show first 3
                print(f"  - ID: {alert.get('id')}, Status: {'Acknowledged' if alert.get('acknowledged') else 'Pending'}")
        return alerts
    else:
        print(f"✗ Failed to get alerts: {response.status_code}")
        print(f"  {response.text}")
        return []

def acknowledge_alert(token, alert_id):
    """Acknowledge an alert"""
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.post(
        f'{BASE_URL}/api/alerts/{alert_id}/acknowledge',
        json={'user': 'admin'},
        headers=headers
    )
    
    if response.status_code == 200:
        print(f"✓ Alert {alert_id} acknowledged successfully")
        return True
    else:
        print(f"✗ Failed to acknowledge alert {alert_id}: {response.status_code}")
        print(f"  {response.text}")
        return False

def check_audit_logs(token):
    """Check audit logs for alert_acknowledge action"""
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(
        f'{BASE_URL}/api/audit-logs?action=alert_acknowledge&limit=10',
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        logs = data.get('logs', [])
        print(f"✓ Found {len(logs)} alert_acknowledge logs")
        if logs:
            for log in logs[:3]:
                print(f"  - {log.get('username')} acknowledged alert {log.get('resource_id')} at {log.get('timestamp')}")
        return logs
    else:
        print(f"✗ Failed to get audit logs: {response.status_code}")
        print(f"  {response.text}")
        return []

def main():
    print("=" * 60)
    print("Testing Alert Acknowledge Functionality")
    print("=" * 60)
    
    # Step 1: Login
    print("\n[1] Logging in as admin...")
    token = login()
    if not token:
        return
    
    # Step 2: Get alerts
    print("\n[2] Getting active alerts...")
    alerts = get_alerts(token)
    if not alerts:
        print("  No alerts available for testing")
        return
    
    # Step 3: Acknowledge an alert
    alert_id = alerts[0]['id']
    print(f"\n[3] Acknowledging alert {alert_id}...")
    if not acknowledge_alert(token, alert_id):
        return
    
    # Step 4: Verify acknowledgement
    print("\n[4] Verifying alert was acknowledged...")
    alerts_after = get_alerts(token)
    acknowledged_alert = next((a for a in alerts_after if a['id'] == alert_id), None)
    if acknowledged_alert and acknowledged_alert.get('acknowledged'):
        print(f"✓ Alert {alert_id} is acknowledged by {acknowledged_alert.get('acknowledged_by')}")
    else:
        print(f"✗ Alert {alert_id} is still pending")
    
    # Step 5: Check audit logs
    print("\n[5] Checking audit logs...")
    check_audit_logs(token)
    
    print("\n" + "=" * 60)
    print("Test completed")
    print("=" * 60)

if __name__ == '__main__':
    main()
