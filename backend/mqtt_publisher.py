"""
MQTT Publisher - Mô phỏng thiết bị gửi dữ liệu cảm biến
Device sends sensor data to MQTT Broker
"""

import json
import time
import random
import hashlib
from datetime import datetime
from typing import Dict, Any
import paho.mqtt.client as mqtt

class SensorPublisher:
    def __init__(self, broker_host: str, broker_port: int, device_id: str, 
                 project_id: str, site_id: str, username: str = None, password: str = None):
        """
        Initialize MQTT Publisher
        
        Args:
            broker_host: MQTT broker address
            broker_port: MQTT broker port
            device_id: Unique device identifier
            project_id: Project ID
            site_id: Site ID
            username: MQTT username
            password: MQTT password
        """
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.device_id = device_id
        self.project_id = project_id
        self.site_id = site_id
        self.username = username
        self.password = password
        
        # Initialize MQTT client
        self.client = mqtt.Client(client_id=device_id)
        self.client.on_connect = self.on_connect
        self.client.on_publish = self.on_publish
        self.client.on_disconnect = self.on_disconnect
        
        # Device info
        self.message_count = 0
        self.battery_level = 95
        self.signal_strength = -65
        
    def on_connect(self, client, userdata, flags, rc):
        """Callback when connected to MQTT broker"""
        if rc == 0:
            print(f"✓ Connected to MQTT broker: {self.broker_host}:{self.broker_port}")
            print(f"  Device ID: {self.device_id}")
            # Subscribe to command topic
            topic = f"landslide/project/{self.project_id}/site/{self.site_id}/device/{self.device_id}/command"
            self.client.subscribe(topic, qos=2)
        else:
            print(f"✗ Connection failed with code {rc}")
    
    def on_publish(self, client, userdata, mid):
        """Callback when message is published"""
        self.message_count += 1
        print(f"  → Published message #{self.message_count}")
    
    def on_disconnect(self, client, userdata, rc):
        """Callback when disconnected"""
        if rc != 0:
            print(f"✗ Unexpected disconnection. Code: {rc}")
        else:
            print("✓ Disconnected from broker")
    
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
    
    def generate_checksum(self, payload: str) -> str:
        """Generate CRC32 checksum for payload"""
        return hashlib.md5(payload.encode()).hexdigest()
    
    # ==================== SENSOR DATA PUBLISHERS ====================
    
    def publish_tilt(self, roll: float, pitch: float, quality: int = 95):
        """Publish tilt sensor data"""
        topic = f"landslide/project/{self.project_id}/site/{self.site_id}/device/{self.device_id}/data/tilt"
        
        payload = {
            "device_id": self.device_id,
            "sensor_type": "tilt",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "data": {
                "roll": roll,
                "pitch": pitch,
                "raw_x": roll / 57.3,  # Convert to radians
                "raw_y": pitch / 57.3
            },
            "unit": "degrees",
            "quality": quality,
            "sequence": self.message_count
        }
        
        json_payload = json.dumps(payload)
        payload["checksum"] = self.generate_checksum(json_payload)
        
        self.client.publish(topic, json.dumps(payload), qos=1, retain=False)
        print(f"[TILT] Roll: {roll}°, Pitch: {pitch}°")
    
    def publish_vibration(self, frequency: float, amplitude_x: float, 
                         amplitude_y: float, amplitude_z: float):
        """Publish vibration sensor data"""
        topic = f"landslide/project/{self.project_id}/site/{self.site_id}/device/{self.device_id}/data/vibration"
        
        rms = (amplitude_x**2 + amplitude_y**2 + amplitude_z**2) ** 0.5 / 3
        peak = max(abs(amplitude_x), abs(amplitude_y), abs(amplitude_z))
        
        payload = {
            "device_id": self.device_id,
            "sensor_type": "vibration",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "data": {
                "frequency": frequency,
                "amplitude_x": amplitude_x,
                "amplitude_y": amplitude_y,
                "amplitude_z": amplitude_z,
                "rms_value": rms,
                "peak_value": peak
            },
            "unit": "g (gravity)",
            "threshold_exceeded": peak > 1.0,
            "sequence": self.message_count
        }
        
        json_payload = json.dumps(payload)
        payload["checksum"] = self.generate_checksum(json_payload)
        
        self.client.publish(topic, json.dumps(payload), qos=1, retain=False)
        print(f"[VIBRATION] Frequency: {frequency}Hz, Peak: {peak:.3f}g")
    
    def publish_displacement(self, horizontal: float, vertical: float, 
                            cumulative: float, alert_level: int = 0):
        """Publish displacement sensor data"""
        topic = f"landslide/project/{self.project_id}/site/{self.site_id}/device/{self.device_id}/data/displacement"
        
        total = (horizontal**2 + vertical**2) ** 0.5
        rate_of_change = 0.12 if cumulative > 40 else 0.08
        
        payload = {
            "device_id": self.device_id,
            "sensor_type": "displacement",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "data": {
                "horizontal": horizontal,
                "vertical": vertical,
                "total": round(total, 2),
                "cumulative": cumulative,
                "rate_of_change": rate_of_change
            },
            "unit": "mm",
            "alert_level": alert_level,
            "sequence": self.message_count
        }
        
        json_payload = json.dumps(payload)
        payload["checksum"] = self.generate_checksum(json_payload)
        
        self.client.publish(topic, json.dumps(payload), qos=1, retain=False)
        print(f"[DISPLACEMENT] H: {horizontal}mm, V: {vertical}mm, Total: {total:.2f}mm")
    
    def publish_rainfall(self, intensity: float, cumulative_1h: float, 
                        cumulative_24h: float, bucket_count: int):
        """Publish rainfall sensor data"""
        topic = f"landslide/project/{self.project_id}/site/{self.site_id}/device/{self.device_id}/data/rainfall"
        
        if intensity > 20:
            rain_status = "heavy"
        elif intensity > 5:
            rain_status = "moderate"
        elif intensity > 0:
            rain_status = "light"
        else:
            rain_status = "no_rain"
        
        payload = {
            "device_id": self.device_id,
            "sensor_type": "rainfall",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "data": {
                "intensity": intensity,
                "cumulative_1h": cumulative_1h,
                "cumulative_24h": cumulative_24h,
                "cumulative_total": 1250.5,
                "bucket_count": bucket_count
            },
            "unit": "mm",
            "rain_status": rain_status,
            "sequence": self.message_count
        }
        
        json_payload = json.dumps(payload)
        payload["checksum"] = self.generate_checksum(json_payload)
        
        self.client.publish(topic, json.dumps(payload), qos=1, retain=False)
        print(f"[RAINFALL] Intensity: {intensity}mm/h, Status: {rain_status}")
    
    def publish_temperature(self, current: float, min_1h: float, 
                           max_1h: float, humidity: float):
        """Publish temperature sensor data"""
        topic = f"landslide/project/{self.project_id}/site/{self.site_id}/device/{self.device_id}/data/temperature"
        
        payload = {
            "device_id": self.device_id,
            "sensor_type": "temperature",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "data": {
                "current": current,
                "min_1h": min_1h,
                "max_1h": max_1h,
                "avg_1h": (current + min_1h + max_1h) / 3,
                "humidity": humidity
            },
            "unit": "°C",
            "sensor_status": "ok",
            "sequence": self.message_count
        }
        
        json_payload = json.dumps(payload)
        payload["checksum"] = self.generate_checksum(json_payload)
        
        self.client.publish(topic, json.dumps(payload), qos=0, retain=False)
        print(f"[TEMPERATURE] {current}°C, Humidity: {humidity}%")
    
    def publish_gnss(self, latitude: float, longitude: float, altitude: float, 
                    satellites: int, fix_type: str = "fix_3d"):
        """Publish GNSS/GPS sensor data"""
        topic = f"landslide/project/{self.project_id}/site/{self.site_id}/device/{self.device_id}/data/gnss"
        
        gnss_status = "fixed" if satellites >= 8 else "searching"
        
        payload = {
            "device_id": self.device_id,
            "sensor_type": "gnss",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "data": {
                "latitude": latitude,
                "longitude": longitude,
                "altitude": altitude,
                "horizontal_accuracy": 0.8,
                "vertical_accuracy": 1.2,
                "satellites_tracked": satellites,
                "fix_type": fix_type,
                "pdop": 2.1
            },
            "unit": "degrees/meters",
            "gnss_status": gnss_status,
            "sequence": self.message_count
        }
        
        json_payload = json.dumps(payload)
        payload["checksum"] = self.generate_checksum(json_payload)
        
        self.client.publish(topic, json.dumps(payload), qos=0, retain=False)
        print(f"[GNSS] Lat: {latitude}, Lon: {longitude}, Alt: {altitude}m, Sats: {satellites}")
    
    def publish_status(self):
        """Publish device status"""
        topic = f"landslide/project/{self.project_id}/site/{self.site_id}/device/{self.device_id}/status"
        
        payload = {
            "device_id": self.device_id,
            "device_name": f"Sensor Point - {self.site_id}",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "status": "online",
            "battery_level": self.battery_level,
            "signal_strength": self.signal_strength,
            "last_message_sent": datetime.utcnow().isoformat() + "Z",
            "message_count": self.message_count,
            "error_count": 0,
            "uptime": 86400,
            "firmware_version": "v1.2.3"
        }
        
        self.client.publish(topic, json.dumps(payload), qos=1, retain=True)
        print(f"[STATUS] Battery: {self.battery_level}%, Signal: {self.signal_strength}dBm")
    
    def publish_heartbeat(self):
        """Publish heartbeat signal"""
        topic = f"landslide/project/{self.project_id}/site/{self.site_id}/device/{self.device_id}/heartbeat"
        
        payload = {
            "device_id": self.device_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "status": "alive",
            "battery": self.battery_level,
            "signal": self.signal_strength,
            "message_id": f"HEARTBEAT_{self.message_count}"
        }
        
        self.client.publish(topic, json.dumps(payload), qos=0, retain=False)
        print(f"[HEARTBEAT] Device alive")
    
    # ==================== SIMULATION ====================
    
    def simulate_measurements(self, duration_seconds: int = 300, interval_seconds: int = 10):
        """
        Simulate continuous sensor measurements
        
        Args:
            duration_seconds: How long to simulate (seconds). None = run indefinitely
            interval_seconds: Interval between measurements (seconds)
        """
        if duration_seconds is not None:
            print(f"\n{'='*60}")
            print(f"Starting sensor simulation for {duration_seconds}s")
            print(f"Measurement interval: {interval_seconds}s")
            print(f"{'='*60}\n")
        
        start_time = time.time()
        
        try:
            while True:
                # If duration_seconds is set, check if we exceeded it
                if duration_seconds is not None and time.time() - start_time >= duration_seconds:
                    break
                
                current_time = datetime.now()
                print(f"\n[{current_time.strftime('%H:%M:%S')}] Sending measurements...")
                
                # Simulate sensor readings with slight variations
                self.publish_tilt(
                    roll=random.uniform(2, 8),
                    pitch=random.uniform(1, 5)
                )
                time.sleep(1)
                
                self.publish_vibration(
                    frequency=random.uniform(4, 7),
                    amplitude_x=random.uniform(0.3, 0.6),
                    amplitude_y=random.uniform(0.2, 0.5),
                    amplitude_z=random.uniform(0.9, 1.0)
                )
                time.sleep(1)
                
                self.publish_displacement(
                    horizontal=random.uniform(2, 3),
                    vertical=random.uniform(1, 2),
                    cumulative=random.uniform(40, 50)
                )
                time.sleep(1)
                
                self.publish_rainfall(
                    intensity=random.uniform(0, 15),
                    cumulative_1h=random.uniform(10, 20),
                    cumulative_24h=random.uniform(100, 130),
                    bucket_count=random.randint(150, 170)
                )
                time.sleep(1)
                
                self.publish_temperature(
                    current=random.uniform(25, 32),
                    min_1h=random.uniform(22, 28),
                    max_1h=random.uniform(28, 35),
                    humidity=random.uniform(60, 75)
                )
                time.sleep(1)
                
                self.publish_gnss(
                    latitude=21.028531 + random.uniform(-0.0001, 0.0001),
                    longitude=105.854236 + random.uniform(-0.0001, 0.0001),
                    altitude=125.45 + random.uniform(-0.5, 0.5),
                    satellites=random.randint(10, 14)
                )
                time.sleep(1)
                
                self.publish_heartbeat()
                self.publish_status()
                
                # Simulate battery drain
                self.battery_level = max(20, self.battery_level - 0.5)
                
                print(f"  Waiting {interval_seconds}s before next batch...")
                time.sleep(interval_seconds)
        
        except KeyboardInterrupt:
            print("\n\n✓ Simulation stopped by user")
        
        except Exception as e:
            print(f"\n✗ Error during simulation: {e}")
        
        finally:
            self.disconnect()


# ==================== MAIN ====================

if __name__ == "__main__":
    import threading
    
    # Configuration
    MQTT_BROKER = "localhost"
    MQTT_PORT = 1883
    PROJECT_ID = "PRJ001"
    
    # Device 1 Configuration
    DEVICE_1 = {
        "device_id": "DEVICE001",
        "site_id": "SITE01",
        "name": "Sensor North Ridge",
        "base_lat": 21.0290,  # Vị trí phía Bắc
        "base_lon": 105.8540
    }
    
    # Device 2 Configuration
    DEVICE_2 = {
        "device_id": "DEVICE002",
        "site_id": "SITE02",
        "name": "Sensor South Valley",
        "base_lat": 21.0280,  # Vị trí phía Nam
        "base_lon": 105.8545
    }
    
    def run_device(device_config):
        """Run a single device publisher in a separate thread"""
        publisher = SensorPublisher(
            broker_host=MQTT_BROKER,
            broker_port=MQTT_PORT,
            device_id=device_config["device_id"],
            project_id=PROJECT_ID,
            site_id=device_config["site_id"]
        )
        
        # Store base coordinates for this publisher
        publisher.base_lat = device_config["base_lat"]
        publisher.base_lon = device_config["base_lon"]
        
        # Connect and simulate
        publisher.connect()
        time.sleep(1)  # Wait for connection
        
        # Override the GNSS location to use device-specific coordinates
        original_publish_gnss = publisher.publish_gnss
        def publish_gnss_with_offset(**kwargs):
            kwargs['latitude'] = publisher.base_lat + random.uniform(-0.0001, 0.0001)
            kwargs['longitude'] = publisher.base_lon + random.uniform(-0.0001, 0.0001)
            original_publish_gnss(**kwargs)
        publisher.publish_gnss = publish_gnss_with_offset
        
        # For DEVICE002: Override vibration to send abnormal data (critical alert)
        if device_config["device_id"] == "DEVICE002":
            original_publish_vibration = publisher.publish_vibration
            def publish_abnormal_vibration(**kwargs):
                # Send HIGH vibration to trigger CRITICAL alert (threshold is 1.5g)
                print(f"\n🚨 {device_config['device_id']} - SENDING ABNORMAL VIBRATION DATA")
                original_publish_vibration(
                    frequency=random.uniform(5, 8),
                    amplitude_x=random.uniform(1.8, 2.2),  # HIGH - exceeds 1.5g critical threshold
                    amplitude_y=random.uniform(1.7, 2.1),
                    amplitude_z=random.uniform(1.8, 2.2)
                )
            publisher.publish_vibration = publish_abnormal_vibration
        
        # Run simulation (indefinite, measurement every 15 seconds)
        print(f"\n📍 Starting {device_config['name']} ({device_config['device_id']})")
        print(f"   Location: ({publisher.base_lat:.4f}, {publisher.base_lon:.4f})")
        if device_config["device_id"] == "DEVICE002":
            print(f"   ⚠️  STATUS: ABNORMAL (High Vibration)")
        print()
        publisher.simulate_measurements(duration_seconds=None, interval_seconds=15)
    
    # Start both devices in separate threads
    print("\n" + "="*70)
    print("🚀 MQTT PUBLISHER - 2 DEVICE SIMULATOR")
    print("="*70)
    
    thread1 = threading.Thread(target=run_device, args=(DEVICE_1,), daemon=True)
    thread2 = threading.Thread(target=run_device, args=(DEVICE_2,), daemon=True)
    
    thread1.start()
    time.sleep(2)  # Stagger the start
    thread2.start()
    
    # Keep main thread alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n✓ Simulation stopped by user")
        exit(0)
