#!/usr/bin/env python3
"""
Test script to verify DEVICETEST sensor data reception
Publish test data for all 3 sensors: rainfall, vibration, soil_moisture
"""

import json
import time
import paho.mqtt.client as mqtt
from datetime import datetime
import random

# MQTT Configuration
MQTT_BROKER = "localhost"
MQTT_PORT = 1883
DEVICE_ID = "DEVICETEST"

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"✓ Connected to MQTT broker: {MQTT_BROKER}:{MQTT_PORT}")
        print(f"  Device ID: {DEVICE_ID}")
    else:
        print(f"✗ Connection failed with code {rc}")

def publish_test_data():
    """Publish test data for DEVICETEST"""
    client = mqtt.Client(client_id=f"test_{DEVICE_ID}")
    client.on_connect = on_connect
    
    try:
        client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
        client.loop_start()
        time.sleep(1)  # Wait for connection
        
        print("\n" + "="*70)
        print(f"📤 TESTING {DEVICE_ID} SENSOR DATA")
        print("="*70)
        
        # Test 1: Rainfall
        print("\n1️⃣  TESTING RAINFALL SENSOR")
        rainfall_payload = {
            "device_id": DEVICE_ID,
            "sensor_type": "rainfall",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "data": {
                "intensity": 5.5,
                "cumulative_1h": 15.2,
                "cumulative_24h": 120.5,
                "bucket_count": 152
            },
            "unit": "mm"
        }
        topic = f"sensors/{DEVICE_ID}/data/rainfall"
        client.publish(topic, json.dumps(rainfall_payload), qos=1)
        print(f"   Topic: {topic}")
        print(f"   Data: {rainfall_payload['data']}")
        print("   ✓ Published")
        time.sleep(2)
        
        # Test 2: Vibration (MPU9265)
        print("\n2️⃣  TESTING VIBRATION SENSOR (MPU9265)")
        vibration_payload = {
            "device_id": DEVICE_ID,
            "sensor_type": "vibration",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "data": {
                "frequency": 8.5,
                "amplitude_x": 0.65,
                "amplitude_y": 0.55,
                "amplitude_z": 0.75,
                "rms_value": 0.65,
                "peak_value": 0.95
            },
            "unit": "g (gravity)"
        }
        topic = f"sensors/{DEVICE_ID}/data/vibration"
        client.publish(topic, json.dumps(vibration_payload), qos=1)
        print(f"   Topic: {topic}")
        print(f"   Data: {vibration_payload['data']}")
        print("   ✓ Published")
        time.sleep(2)
        
        # Test 3: Soil Moisture
        print("\n3️⃣  TESTING SOIL MOISTURE SENSOR")
        soil_moisture_payload = {
            "device_id": DEVICE_ID,
            "sensor_type": "soil_moisture",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "data": {
                "moisture_level": 72.5,
                "salinity": 1.8,
                "temperature": 26.3
            },
            "unit": "%"
        }
        topic = f"sensors/{DEVICE_ID}/data/soil_moisture"
        client.publish(topic, json.dumps(soil_moisture_payload), qos=1)
        print(f"   Topic: {topic}")
        print(f"   Data: {soil_moisture_payload['data']}")
        print("   ✓ Published")
        time.sleep(2)
        
        print("\n" + "="*70)
        print("✓ All test messages published successfully!")
        print("="*70)
        print("\n📊 CHECK DATABASE:")
        print("   sqlite3 database/sensors.db")
        print("   SELECT * FROM sensor_readings WHERE device_id='DEVICETEST'")
        print("   ORDER BY timestamp DESC LIMIT 10;")
        print("\n")
        
        client.loop_stop()
        client.disconnect()
        
    except Exception as e:
        print(f"✗ Error: {e}")

if __name__ == "__main__":
    publish_test_data()
