#!/usr/bin/env python3
"""
🎯 MQTT PROTOCOL - SIMPLE VISUAL TEST
Easy-to-follow demonstration of the data reception protocol

Shows:
- Connection to broker
- Sensor data reception
- Alert detection
- Multi-device support
"""

import json
import time
import sys
from datetime import datetime
import paho.mqtt.client as mqtt

# Colors for output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

# Configuration
BROKER = "localhost"
PORT = 1883
BASE_TOPIC = "landslide/project/LAO_001/site/MAIN"

# Test data
messages_received = []
alerts_detected = []

# Helper functions
def print_header(title):
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}{Colors.RESET}\n")

def print_section(text):
    print(f"{Colors.BOLD}{Colors.BLUE}>>> {text}{Colors.RESET}")

def print_ok(msg):
    print(f"{Colors.GREEN}✅  {msg}{Colors.RESET}")

def print_info(msg):
    print(f"{Colors.CYAN}ℹ   {msg}{Colors.RESET}")

def print_error(msg):
    print(f"{Colors.RED}❌  {msg}{Colors.RESET}")

def print_alert(msg):
    print(f"{Colors.RED}🚨  {msg}{Colors.RESET}")

# MQTT Callbacks
def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print_ok(f"Connected!")
    else:
        print_error(f"Connection failed: code {rc}")

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        messages_received.append(payload)
        
        # Display the data nicely
        device_id = payload.get('device_id', 'UNKNOWN')
        sensor_type = payload.get('sensor_type', 'UNKNOWN').upper()
        
        print_ok(f"Received {sensor_type} from {device_id}")
        
        # Show the sensor data
        if 'data' in payload:
            for key, value in payload['data'].items():
                if isinstance(value, float):
                    print(f"        {key}: {value:.2f}")
                else:
                    print(f"        {key}: {value}")
        
        # Check for alerts
        if payload.get('alert') or payload.get('alert_level'):
            print_alert(f"Alert: {payload.get('alert_level', 'WARNING')}")
            alerts_detected.append(payload)
    except Exception as e:
        print_error(f"Error parsing message: {e}")

# Test Steps
def test_1_connect():
    """Test 1: Connect to MQTT broker"""
    print_section("TEST 1: Connect to MQTT Broker")
    
    try:
        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1)
        client.on_connect = on_connect
        client.connect(BROKER, PORT, keepalive=60)
        client.loop_start()
        time.sleep(1)
        client.loop_stop()
        client.disconnect()
        print_ok("✓ Connection test passed\n")
        return True
    except Exception as e:
        print_error(f"✗ Connection failed: {e}\n")
        return False

def test_2_single_sensor():
    """Test 2: Receive data from single sensor"""
    print_section("TEST 2: Single Sensor - Tilt Data")
    
    try:
        messages_received.clear()
        
        # Create subscriber
        sub = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1)
        sub.on_connect = on_connect
        sub.on_message = on_message
        sub.user_data_set({'name': 'subscriber'})
        
        topic = f"{BASE_TOPIC}/device/DEVICE_001/data/tilt"
        sub.connect(BROKER, PORT)
        sub.subscribe(topic)
        print_info(f"Subscribed to: {topic}")
        sub.loop_start()
        time.sleep(1)
        
        # Create publisher
        pub = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1)
        pub.username_pw_set("device", "device_pass")
        pub.connect(BROKER, PORT)
        
        # Publish tilt data
        data = {
            "device_id": "DEVICE_001",
            "sensor_type": "tilt",
            "data": {
                "roll_angle": 2.54,
                "pitch_angle": 1.87
            }
        }
        pub.publish(topic, json.dumps(data), qos=1)
        print_info("Published tilt data")
        
        time.sleep(2)
        
        pub.disconnect()
        sub.loop_stop()
        sub.disconnect()
        
        if messages_received:
            print_ok("✓ Sensor test passed\n")
            return True
        else:
            print_error("✗ No message received\n")
            return False
            
    except Exception as e:
        print_error(f"✗ Test failed: {e}\n")
        return False

def test_3_all_sensors():
    """Test 3: All 6 sensor types"""
    print_section("TEST 3: All 6 Sensor Types")
    
    try:
        messages_received.clear()
        
        # Create subscriber
        sub = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1)
        sub.on_connect = on_connect
        sub.on_message = on_message
        
        topic = f"{BASE_TOPIC}/device/DEVICE_002/data/+"
        sub.connect(BROKER, PORT)
        sub.subscribe(topic)
        print_info(f"Subscribed to: {topic}")
        sub.loop_start()
        time.sleep(1)
        
        # Create publisher
        pub = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1)
        pub.username_pw_set("device", "device_pass")
        pub.connect(BROKER, PORT)
        
        # Define all sensors
        sensors = [
            ("tilt", {"roll_angle": 2.5, "pitch_angle": 1.8}),
            ("vibration", {"frequency": 2.3, "amplitude": 0.15}),
            ("displacement", {"horizontal": 4.2, "vertical": 3.1, "cumulative": 45.6}),
            ("rainfall", {"intensity": 15, "accumulated": 120}),
            ("temperature", {"current": 28.5, "humidity": 65}),
            ("gnss", {"latitude": 17.0245, "longitude": 103.5245, "altitude": 1250.5})
        ]
        
        print_info("Publishing all 6 sensors...\n")
        
        for sensor_type, sensor_data in sensors:
            data = {
                "device_id": "DEVICE_002",
                "sensor_type": sensor_type,
                "data": sensor_data
            }
            topic = f"{BASE_TOPIC}/device/DEVICE_002/data/{sensor_type}"
            pub.publish(topic, json.dumps(data), qos=1)
            time.sleep(0.5)
        
        time.sleep(3)
        
        pub.disconnect()
        sub.loop_stop()
        sub.disconnect()
        
        if len(messages_received) >= 6:
            print_ok(f"✓ All 6 sensors received ({len(messages_received)} messages)\n")
            return True
        else:
            print_error(f"✗ Only {len(messages_received)}/6 sensors received\n")
            return False
            
    except Exception as e:
        print_error(f"✗ Test failed: {e}\n")
        return False

def test_4_alerts():
    """Test 4: Alert detection"""
    print_section("TEST 4: Alert Detection")
    
    try:
        alerts_detected.clear()
        messages_received.clear()
        
        # Create subscriber
        sub = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1)
        sub.on_connect = on_connect
        sub.on_message = on_message
        
        topic = f"{BASE_TOPIC}/device/DEVICE_003/data/+"
        sub.connect(BROKER, PORT)
        sub.subscribe(topic)
        print_info("Subscribed to displacement data")
        sub.loop_start()
        time.sleep(1)
        
        # Create publisher
        pub = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1)
        pub.username_pw_set("device", "device_pass")
        pub.connect(BROKER, PORT)
        
        # Publish data that triggers alert
        print_info("Publishing displacement: 6.3 mm (threshold: 5.0 mm)")
        
        data = {
            "device_id": "DEVICE_003",
            "sensor_type": "displacement",
            "data": {
                "horizontal": 6.3,
                "vertical": 4.0,
                "cumulative": 50.0
            },
            "alert": True,
            "alert_level": "WARNING",
            "threshold": 5.0
        }
        
        topic = f"{BASE_TOPIC}/device/DEVICE_003/data/displacement"
        pub.publish(topic, json.dumps(data), qos=1)
        
        time.sleep(2)
        
        pub.disconnect()
        sub.loop_stop()
        sub.disconnect()
        
        if len(alerts_detected) > 0:
            print_ok("✓ Alert detected and working\n")
            return True
        else:
            print_error("✗ Alert not detected\n")
            return False
            
    except Exception as e:
        print_error(f"✗ Test failed: {e}\n")
        return False

def main():
    """Run all tests"""
    print_info(f"Broker: {BROKER}:{PORT}")
    print_info(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    time.sleep(1)
    
    # Run tests
    tests = [
        test_1_connect,
        test_2_single_sensor,
        test_3_all_sensors,
        test_4_alerts
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
            time.sleep(1)
        except Exception as e:
            print_error(f"Test error: {e}\n")
            results.append(False)
    
    # Summary
    print_header("📊 TEST SUMMARY")
    
    passed = sum(results)
    total = len(results)
    
    print(f"{Colors.BOLD}Results:{Colors.RESET}")
    print(f"  Passed: {Colors.GREEN}{passed}/{total}{Colors.RESET}")
    if passed < total:
        print(f"  Failed: {Colors.RED}{total - passed}/{total}{Colors.RESET}")
    
    success_rate = (passed / total * 100) if total > 0 else 0
    print(f"  Success Rate: {Colors.BOLD}{success_rate:.0f}%{Colors.RESET}\n")
    
    if passed == total:
        print_ok("✓ ALL TESTS PASSED - PROTOCOL IS WORKING!")
    else:
        print_error("✗ Some tests failed")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Test interrupted{Colors.RESET}\n")
        sys.exit(0)
