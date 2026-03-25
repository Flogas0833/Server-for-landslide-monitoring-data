"""
MQTT Subscriber - Server nhận dữ liệu từ các thiết bị cảm biến
Data Collection and Processing
"""

import json
import time
from datetime import datetime
from typing import Dict, Any, Callable, Optional
from collections import defaultdict
import paho.mqtt.client as mqtt
from dataclasses import dataclass
import hashlib
import sys
import os

# Add backend directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SensorDatabase

@dataclass
class SensorReading:
    """Data class for sensor reading"""
    device_id: str
    sensor_type: str
    timestamp: str
    data: Dict[str, Any]
    unit: str
    quality: Optional[int] = None
    checksum: Optional[str] = None

class DataValidator:
    """Validate sensor readings"""
    
    # Valid ranges for each sensor type
    VALID_RANGES = {
        "tilt": {
            "roll": (-30, 30),
            "pitch": (-30, 30)
        },
        "vibration": {
            "frequency": (0, 100),
            "amplitude_x": (0, 5),
            "amplitude_y": (0, 5),
            "amplitude_z": (0.5, 5.0)
        },
        "displacement": {
            "horizontal": (0, 500),
            "vertical": (0, 500),
            "total": (0, 500),
            "cumulative": (0, 10000)
        },
        "rainfall": {
            "intensity": (0, 200),
            "cumulative_1h": (0, 500),
            "cumulative_24h": (0, 1000)
        },
        "temperature": {
            "current": (-20, 60),
            "humidity": (0, 100)
        },
        "gnss": {
            "latitude": (-90, 90),
            "longitude": (-180, 180),
            "altitude": (-500, 10000)
        }
    }
    
    ALERT_THRESHOLDS = {
        "displacement": {
            "warning": 5.0,
            "critical": 8.0
        },
        "vibration": {
            "warning": 0.8,
            "critical": 1.5
        },
        "rainfall": {
            "warning": 30,
            "critical": 100
        }
    }
    
    @staticmethod
    def validate_reading(reading: SensorReading) -> tuple[bool, str]:
        """
        Validate sensor reading
        
        Returns:
            Tuple of (is_valid, message)
        """
        sensor_type = reading.sensor_type
        
        # Check if sensor type is known
        if sensor_type not in DataValidator.VALID_RANGES:
            return False, f"Unknown sensor type: {sensor_type}"
        
        # Validate each field
        valid_range = DataValidator.VALID_RANGES[sensor_type]
        for field, value in reading.data.items():
            if field in valid_range:
                min_val, max_val = valid_range[field]
                if not (min_val <= value <= max_val):
                    return False, f"Field '{field}' value {value} out of range [{min_val}, {max_val}]"
        
        return True, "Valid"
    
    @staticmethod
    def check_alerts(reading: SensorReading) -> Optional[Dict[str, Any]]:
        """Check if reading triggers any alerts"""
        sensor_type = reading.sensor_type
        
        if sensor_type not in DataValidator.ALERT_THRESHOLDS:
            return None
        
        thresholds = DataValidator.ALERT_THRESHOLDS[sensor_type]
        
        # For displacement
        if sensor_type == "displacement":
            value = reading.data.get("total", 0)
            if value >= thresholds["critical"]:
                return {
                    "severity": "critical",
                    "threshold_type": "critical",
                    "value": value,
                    "threshold": thresholds["critical"]
                }
            elif value >= thresholds["warning"]:
                return {
                    "severity": "warning",
                    "threshold_type": "warning",
                    "value": value,
                    "threshold": thresholds["warning"]
                }
        
        # For vibration
        elif sensor_type == "vibration":
            value = reading.data.get("peak_value", 0)
            if value >= thresholds["critical"]:
                return {
                    "severity": "critical",
                    "threshold_type": "critical",
                    "value": value,
                    "threshold": thresholds["critical"]
                }
            elif value >= thresholds["warning"]:
                return {
                    "severity": "warning",
                    "threshold_type": "warning",
                    "value": value,
                    "threshold": thresholds["warning"]
                }
        
        # For rainfall
        elif sensor_type == "rainfall":
            value = reading.data.get("intensity", 0)
            if value >= thresholds["critical"]:
                return {
                    "severity": "critical",
                    "threshold_type": "critical",
                    "value": value,
                    "threshold": thresholds["critical"]
                }
            elif value >= thresholds["warning"]:
                return {
                    "severity": "warning",
                    "threshold_type": "warning",
                    "value": value,
                    "threshold": thresholds["warning"]
                }
        
        return None


class SensorDataSubscriber:
    """MQTT Subscriber for receiving sensor data"""
    
    def __init__(self, broker_host: str, broker_port: int, project_id: str,
                 username: str = None, password: str = None):
        """
        Initialize MQTT Subscriber
        
        Args:
            broker_host: MQTT broker address
            broker_port: MQTT broker port
            project_id: Project ID to subscribe to
            username: MQTT username
            password: MQTT password
        """
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.project_id = project_id
        self.username = username
        self.password = password
        
        # Initialize database
        self.db = SensorDatabase()
        
        # Initialize MQTT client
        self.client = mqtt.Client(client_id=f"server_{project_id}")
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        self.client.on_subscribe = self._on_subscribe
        
        # Storage for latest readings from each device
        self.device_data = defaultdict(dict)
        self.device_status = {}
        
        # Statistics
        self.stats = {
            "total_messages": 0,
            "valid_messages": 0,
            "invalid_messages": 0,
            "alerts_triggered": 0
        }
        
        # Callbacks
        self.on_data_received: Optional[Callable] = None
        self.on_alert: Optional[Callable] = None
        self.on_status_update: Optional[Callable] = None
    
    def _on_connect(self, client, userdata, flags, rc):
        """Callback when connected"""
        if rc == 0:
            print(f"✓ Connected to MQTT broker: {self.broker_host}:{self.broker_port}")
            
            # Subscribe to all sensor data topics
            topics = [
                f"landslide/project/{self.project_id}/site/+/device/+/data/#",
                f"landslide/project/{self.project_id}/site/+/device/+/status",
                f"landslide/project/{self.project_id}/site/+/device/+/heartbeat",
                f"landslide/project/{self.project_id}/alerts/#"
            ]
            
            for topic in topics:
                self.client.subscribe(topic, qos=1)
                print(f"  → Subscribed to: {topic}")
        else:
            print(f"✗ Connection failed with code {rc}")
    
    def _on_subscribe(self, client, userdata, mid, granted_qos):
        """Callback when subscription is confirmed"""
        print(f"  ✓ Subscription confirmed (QoS: {granted_qos[0]})")
    
    def _on_message(self, client, userdata, msg):
        """Callback when message is received"""
        try:
            # Parse topic
            topic_parts = msg.topic.split('/')
            
            # Decode payload
            payload = json.loads(msg.payload.decode())
            
            # Determine message type based on topic
            if "/data/" in msg.topic:
                self._handle_sensor_data(msg.topic, payload)
            elif "/status" in msg.topic:
                self._handle_status(msg.topic, payload)
            elif "/heartbeat" in msg.topic:
                self._handle_heartbeat(msg.topic, payload)
            elif "/alerts/" in msg.topic:
                self._handle_alert(msg.topic, payload)
            
            self.stats["total_messages"] += 1
        
        except json.JSONDecodeError as e:
            print(f"✗ JSON decode error: {e}")
            self.stats["invalid_messages"] += 1
        except Exception as e:
            print(f"✗ Error processing message: {e}")
            self.stats["invalid_messages"] += 1
    
    def _handle_sensor_data(self, topic: str, payload: Dict[str, Any]):
        """Handle sensor data message"""
        try:
            # Convert to SensorReading
            reading = SensorReading(
                device_id=payload.get("device_id"),
                sensor_type=payload.get("sensor_type"),
                timestamp=payload.get("timestamp"),
                data=payload.get("data", {}),
                unit=payload.get("unit"),
                quality=payload.get("quality"),
                checksum=payload.get("checksum")
            )
            
            # Validate
            is_valid, message = DataValidator.validate_reading(reading)
            
            if not is_valid:
                print(f"✗ Invalid reading from {reading.device_id}: {message}")
                self.stats["invalid_messages"] += 1
                return
            
            # Store in database
            self.db.insert_reading(
                device_id=reading.device_id,
                sensor_type=reading.sensor_type,
                timestamp=reading.timestamp,
                data=reading.data,
                unit=reading.unit,
                quality=reading.quality
            )
            
            # If this is a GNSS reading, update device location
            if reading.sensor_type == "gnss" and reading.data:
                try:
                    latitude = reading.data.get("latitude")
                    longitude = reading.data.get("longitude")
                    altitude = reading.data.get("altitude")
                    
                    if latitude is not None and longitude is not None:
                        # Update device table with latest location
                        conn = self.db.get_connection()
                        cursor = conn.cursor()
                        cursor.execute('''
                            UPDATE devices 
                            SET latitude = ?, longitude = ?, altitude = ?, last_update = ?
                            WHERE device_id = ?
                        ''', (latitude, longitude, altitude, 
                              datetime.utcnow().isoformat(), reading.device_id))
                        conn.commit()
                        conn.close()
                except Exception as e:
                    print(f"⚠ Could not update GNSS location: {e}")
            
            # Store in memory
            self.device_data[reading.device_id][reading.sensor_type] = reading
            self.stats["valid_messages"] += 1
            
            # Check for alerts
            alert = DataValidator.check_alerts(reading)
            if alert:
                self._trigger_alert(reading, alert)
            
            # Display
            self._display_sensor_data(reading)
            
            # Callback
            if self.on_data_received:
                self.on_data_received(reading)
        
        except Exception as e:
            print(f"✗ Error handling sensor data: {e}")
            self.stats["invalid_messages"] += 1
    
    def _handle_status(self, topic: str, payload: Dict[str, Any]):
        """Handle device status message"""
        device_id = payload.get("device_id")
        self.device_status[device_id] = payload
        
        # Register device in database if not already registered
        project_id = payload.get("project_id", self.project_id)
        site_id = payload.get("site_id", "default")
        
        self.db.register_device(
            device_id=device_id,
            project_id=project_id,
            site_id=site_id,
            latitude=payload.get("latitude", 0),
            longitude=payload.get("longitude", 0),
            name=payload.get("device_name", device_id)
        )
        
        print(f"[STATUS] {device_id}: " +
              f"Battery={payload.get('battery_level')}%, " +
              f"Signal={payload.get('signal_strength')}dBm")
        
        if self.on_status_update:
            self.on_status_update(device_id, payload)
    
    def _handle_heartbeat(self, topic: str, payload: Dict[str, Any]):
        """Handle heartbeat message"""
        device_id = payload.get("device_id")
        print(f"[HEARTBEAT] {device_id} is alive")
    
    def _handle_alert(self, topic: str, payload: Dict[str, Any]):
        """Handle alert message"""
        print(f"[ALERT] Severity: {payload.get('severity').upper()} - {payload.get('message')}")
    
    def _trigger_alert(self, reading: SensorReading, alert: Dict[str, Any]):
        """Trigger an alert"""
        self.stats["alerts_triggered"] += 1
        
        alert_msg = {
            "alert_id": f"ALERT_{int(time.time() * 1000)}",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "severity": alert["severity"],
            "device_id": reading.device_id,
            "sensor_type": reading.sensor_type,
            "current_value": alert["value"],
            "threshold": alert["threshold"],
            "unit": reading.unit,
            "message": f"{reading.sensor_type.upper()} alert: {alert['value']} {reading.unit} " +
                      f"exceeds {alert['threshold']} ({alert['severity'].upper()})"
        }
        
        print(f"🚨 {alert_msg['message']}")
        
        # Update device alert status in database
        alert_status = "critical" if alert["severity"] == "critical" else "warning"
        self.db.update_alert_status(
            device_id=reading.device_id,
            alert_status=alert_status,
            alert_value=alert["value"],
            alert_type=reading.sensor_type
        )
        
        if self.on_alert:
            self.on_alert(alert_msg)
    
    def _display_sensor_data(self, reading: SensorReading):
        """Display sensor data in formatted way"""
        sensor_type = reading.sensor_type.upper()
        device_id = reading.device_id
        timestamp = reading.timestamp.split('T')[1].split('Z')[0] if 'T' in reading.timestamp else reading.timestamp
        
        if reading.sensor_type == "tilt":
            roll = reading.data.get("roll", 0)
            pitch = reading.data.get("pitch", 0)
            print(f"[{timestamp}] [{device_id}] TILT: roll={roll:.2f}°, pitch={pitch:.2f}°")
        
        elif reading.sensor_type == "vibration":
            freq = reading.data.get("frequency", 0)
            peak = reading.data.get("peak_value", 0)
            print(f"[{timestamp}] [{device_id}] VIBRATION: freq={freq:.2f}Hz, peak={peak:.3f}g")
        
        elif reading.sensor_type == "displacement":
            h = reading.data.get("horizontal", 0)
            v = reading.data.get("vertical", 0)
            print(f"[{timestamp}] [{device_id}] DISPLACEMENT: h={h:.2f}mm, v={v:.2f}mm")
        
        elif reading.sensor_type == "rainfall":
            intensity = reading.data.get("intensity", 0)
            status = reading.data.get("rain_status", "unknown") if hasattr(reading, "rain_status") else "unknown"
            print(f"[{timestamp}] [{device_id}] RAINFALL: {intensity:.1f}mm/h")
        
        elif reading.sensor_type == "temperature":
            temp = reading.data.get("current", 0)
            hum = reading.data.get("humidity", 0)
            print(f"[{timestamp}] [{device_id}] TEMPERATURE: {temp:.1f}°C, humidity={hum:.1f}%")
        
        elif reading.sensor_type == "gnss":
            lat = reading.data.get("latitude", 0)
            lon = reading.data.get("longitude", 0)
            alt = reading.data.get("altitude", 0)
            print(f"[{timestamp}] [{device_id}] GNSS: {lat:.6f}, {lon:.6f}, {alt:.1f}m")
    
    def connect(self):
        """Connect to MQTT broker"""
        try:
            if self.username and self.password:
                self.client.username_pw_set(self.username, self.password)
            
            self.client.connect(self.broker_host, self.broker_port, keepalive=60)
            self.client.loop_start()
        except Exception as e:
            print(f"✗ Connection error: {e}")
    
    def disconnect(self):
        """Disconnect from broker"""
        self.client.loop_stop()
        self.client.disconnect()
    
    def get_latest_reading(self, device_id: str, sensor_type: str) -> Optional[SensorReading]:
        """Get latest reading from a device"""
        if device_id in self.device_data:
            if sensor_type in self.device_data[device_id]:
                return self.device_data[device_id][sensor_type]
        return None
    
    def get_device_status(self, device_id: str) -> Optional[Dict[str, Any]]:
        """Get device status"""
        return self.device_status.get(device_id)
    
    def print_statistics(self):
        """Print statistics"""
        print(f"\n{'='*60}")
        print("STATISTICS")
        print(f"{'='*60}")
        print(f"Total messages received: {self.stats['total_messages']}")
        print(f"Valid messages: {self.stats['valid_messages']}")
        print(f"Invalid messages: {self.stats['invalid_messages']}")
        print(f"Alerts triggered: {self.stats['alerts_triggered']}")
        print(f"Active devices: {len(self.device_data)}")
        print(f"Online devices: {len(self.device_status)}")
        print(f"{'='*60}\n")
    
    def print_device_summary(self):
        """Print summary of all devices and their last readings"""
        print(f"\n{'='*60}")
        print("DEVICE SUMMARY")
        print(f"{'='*60}")
        
        for device_id, sensors in self.device_data.items():
            status = self.device_status.get(device_id, {})
            battery = status.get("battery_level", "N/A")
            signal = status.get("signal_strength", "N/A")
            
            print(f"\n Device: {device_id}")
            print(f"  Battery: {battery}%, Signal: {signal}dBm")
            print(f"  Sensors:")
            
            for sensor_type, reading in sensors.items():
                print(f"    - {sensor_type}: {reading.timestamp}")
        
        print(f"\n{'='*60}\n")


# ==================== MAIN ====================

if __name__ == "__main__":
    # Configuration
    MQTT_BROKER = "localhost"
    MQTT_PORT = 1883
    PROJECT_ID = "PRJ001"
    # MQTT_USERNAME = "username"
    # MQTT_PASSWORD = "password"
    
    # Create subscriber
    subscriber = SensorDataSubscriber(
        broker_host=MQTT_BROKER,
        broker_port=MQTT_PORT,
        project_id=PROJECT_ID
        # username=MQTT_USERNAME,
        # password=MQTT_PASSWORD
    )
    
    # Define callbacks
    def on_data_received(reading):
        """Called when valid data is received"""
        pass  # Data is already printed in _display_sensor_data
    
    def on_alert(alert):
        """Called when alert is triggered"""
        pass  # Alert is already printed in _trigger_alert
    
    def on_status_update(device_id, status):
        """Called when device status is updated"""
        pass  # Status is already printed in _handle_status
    
    subscriber.on_data_received = on_data_received
    subscriber.on_alert = on_alert
    subscriber.on_status_update = on_status_update
    
    # Connect
    subscriber.connect()
    
    try:
        print("Listening for sensor data... (Press Ctrl+C to stop)")
        print(f"Broker: {MQTT_BROKER}:{MQTT_PORT}")
        print(f"Project: {PROJECT_ID}\n")
        
        # Keep running
        while True:
            time.sleep(10)
            subscriber.print_statistics()
    
    except KeyboardInterrupt:
        print("\n✓ Stopping subscriber...")
    
    finally:
        subscriber.disconnect()
        subscriber.print_device_summary()
