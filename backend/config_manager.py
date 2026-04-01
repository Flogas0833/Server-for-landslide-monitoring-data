"""
Configuration Manager - Load and manage device and sensor configurations
Separates configuration from business logic for better extensibility
"""

import json
import os
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import sys


@dataclass
class SensorConfig:
    """Configuration for a sensor type"""
    sensor_type: str
    unit: str
    valid_ranges: Dict[str, tuple]
    alert_thresholds: Optional[Dict[str, Dict[str, float]]] = None
    description: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'sensor_type': self.sensor_type,
            'unit': self.unit,
            'valid_ranges': self.valid_ranges,
            'alert_thresholds': self.alert_thresholds,
            'description': self.description
        }


@dataclass
class DeviceConfig:
    """Configuration for a device"""
    device_id: str
    site_id: str
    project_id: str
    sensor_types: List[str]  # List of sensor types this device has
    name: str = ""
    description: str = ""
    base_lat: float = 0.0
    base_lon: float = 0.0
    base_alt: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'device_id': self.device_id,
            'site_id': self.site_id,
            'project_id': self.project_id,
            'sensor_types': self.sensor_types,
            'name': self.name,
            'description': self.description,
            'base_lat': self.base_lat,
            'base_lon': self.base_lon,
            'base_alt': self.base_alt
        }


class ConfigurationManager:
    """
    Manages device and sensor configurations.
    Loads from JSON files and provides access to configurations.
    """
    
    def __init__(self, config_dir: str = None):
        """
        Initialize configuration manager
        
        Args:
            config_dir: Directory containing configuration files
                       Defaults to ../config relative to this file
        """
        if config_dir is None:
            # Default to ../config relative to this file
            config_dir = os.path.join(os.path.dirname(__file__), '..', 'config')
        
        self.config_dir = config_dir
        self.devices: Dict[str, DeviceConfig] = {}
        self.sensors: Dict[str, SensorConfig] = {}
        
        # Load configurations
        self._load_sensor_configs()
        self._load_device_configs()
    
    def _load_sensor_configs(self):
        """Load sensor configurations from JSON file"""
        sensors_file = os.path.join(self.config_dir, 'sensors.json')
        
        if not os.path.exists(sensors_file):
            print(f"[CONFIG] Warning: sensors.json not found at {sensors_file}")
            self._create_default_sensors()
            return
        
        try:
            with open(sensors_file, 'r') as f:
                data = json.load(f)
            
            for sensor_data in data.get('sensors', []):
                sensor = SensorConfig(
                    sensor_type=sensor_data['sensor_type'],
                    unit=sensor_data['unit'],
                    valid_ranges=sensor_data['valid_ranges'],
                    alert_thresholds=sensor_data.get('alert_thresholds'),
                    description=sensor_data.get('description', '')
                )
                self.sensors[sensor.sensor_type] = sensor
            
            print(f"[CONFIG] Loaded {len(self.sensors)} sensor configurations")
        except Exception as e:
            print(f"[CONFIG] Error loading sensors.json: {e}")
            self._create_default_sensors()
    
    def _load_device_configs(self):
        """Load device configurations from JSON file"""
        devices_file = os.path.join(self.config_dir, 'devices.json')
        
        if not os.path.exists(devices_file):
            print(f"[CONFIG] Warning: devices.json not found at {devices_file}")
            self._create_default_devices()
            return
        
        try:
            with open(devices_file, 'r') as f:
                data = json.load(f)
            
            for device_data in data.get('devices', []):
                device = DeviceConfig(
                    device_id=device_data['device_id'],
                    site_id=device_data['site_id'],
                    project_id=device_data['project_id'],
                    sensor_types=device_data['sensor_types'],
                    name=device_data.get('name', ''),
                    description=device_data.get('description', ''),
                    base_lat=device_data.get('base_lat', 0.0),
                    base_lon=device_data.get('base_lon', 0.0),
                    base_alt=device_data.get('base_alt', 0.0)
                )
                self.devices[device.device_id] = device
            
            print(f"[CONFIG] Loaded {len(self.devices)} device configurations")
        except Exception as e:
            print(f"[CONFIG] Error loading devices.json: {e}")
            self._create_default_devices()
    
    def _create_default_sensors(self):
        """Create default sensor configurations"""
        default_sensors = {
            'tilt': SensorConfig(
                sensor_type='tilt',
                unit='degrees',
                valid_ranges={'roll': (-30, 30), 'pitch': (-30, 30)},
                description='Tilt measurement sensor'
            ),
            'vibration': SensorConfig(
                sensor_type='vibration',
                unit='g (gravity)',
                valid_ranges={
                    'frequency': (0, 100),
                    'amplitude_x': (0, 5),
                    'amplitude_y': (0, 5),
                    'amplitude_z': (0.5, 5.0)
                },
                alert_thresholds={'warning': 0.8, 'critical': 1.5},
                description='Vibration measurement sensor'
            ),
            'displacement': SensorConfig(
                sensor_type='displacement',
                unit='mm',
                valid_ranges={
                    'horizontal': (0, 500),
                    'vertical': (0, 500),
                    'total': (0, 500),
                    'cumulative': (0, 10000)
                },
                alert_thresholds={'warning': 5.0, 'critical': 8.0},
                description='Displacement measurement sensor'
            ),
            'rainfall': SensorConfig(
                sensor_type='rainfall',
                unit='mm',
                valid_ranges={
                    'intensity': (0, 200),
                    'cumulative_1h': (0, 500),
                    'cumulative_24h': (0, 1000)
                },
                alert_thresholds={'warning': 30, 'critical': 100},
                description='Rainfall measurement sensor'
            ),
            'temperature': SensorConfig(
                sensor_type='temperature',
                unit='°C',
                valid_ranges={'current': (-20, 60), 'humidity': (0, 100)},
                description='Temperature and humidity sensor'
            ),
            'gnss': SensorConfig(
                sensor_type='gnss',
                unit='degrees/meters',
                valid_ranges={
                    'latitude': (-90, 90),
                    'longitude': (-180, 180),
                    'altitude': (-500, 10000)
                },
                description='GNSS/GPS positioning sensor'
            )
        }
        self.sensors = default_sensors
        print(f"[CONFIG] Created {len(default_sensors)} default sensor configurations")
    
    def _create_default_devices(self):
        """Create default device configurations"""
        default_devices = {
            'DEVICE001': DeviceConfig(
                device_id='DEVICE001',
                site_id='SITE01',
                project_id='PRJ001',
                sensor_types=['tilt', 'vibration', 'displacement', 'rainfall', 'temperature', 'gnss'],
                name='Sensor 1',
                base_lat=20.9603,
                base_lon=107.0658
            ),
            'DEVICE002': DeviceConfig(
                device_id='DEVICE002',
                site_id='SITE02',
                project_id='PRJ001',
                sensor_types=['tilt', 'vibration', 'displacement', 'rainfall', 'temperature', 'gnss'],
                name='Sensor 2',
                base_lat=20.0280,
                base_lon=105.8545
            )
        }
        self.devices = default_devices
        print(f"[CONFIG] Created {len(default_devices)} default device configurations")
    
    def get_device(self, device_id: str) -> Optional[DeviceConfig]:
        """Get device configuration by device ID"""
        return self.devices.get(device_id)
    
    def get_all_devices(self) -> List[DeviceConfig]:
        """Get all device configurations"""
        return list(self.devices.values())
    
    def get_sensor(self, sensor_type: str) -> Optional[SensorConfig]:
        """Get sensor configuration by sensor type"""
        return self.sensors.get(sensor_type)
    
    def get_all_sensors(self) -> List[SensorConfig]:
        """Get all sensor configurations"""
        return list(self.sensors.values())
    
    def get_device_sensors(self, device_id: str) -> List[SensorConfig]:
        """Get all sensors for a specific device"""
        device = self.get_device(device_id)
        if not device:
            return []
        
        return [self.get_sensor(st) for st in device.sensor_types if self.get_sensor(st)]
    
    def is_sensor_type_valid(self, sensor_type: str) -> bool:
        """Check if a sensor type is valid"""
        return sensor_type in self.sensors
    
    def get_valid_ranges(self, sensor_type: str) -> Optional[Dict[str, tuple]]:
        """Get valid ranges for a sensor type"""
        sensor = self.get_sensor(sensor_type)
        return sensor.valid_ranges if sensor else None
    
    def get_alert_thresholds(self, sensor_type: str) -> Optional[Dict[str, float]]:
        """Get alert thresholds for a sensor type"""
        sensor = self.get_sensor(sensor_type)
        return sensor.alert_thresholds if sensor else None
    
    def add_device(self, device: DeviceConfig):
        """Add a new device configuration"""
        self.devices[device.device_id] = device
    
    def add_sensor(self, sensor: SensorConfig):
        """Add a new sensor configuration"""
        self.sensors[sensor.sensor_type] = sensor
    
    def save_devices(self, filepath: str = None):
        """Save device configurations to JSON file"""
        if filepath is None:
            filepath = os.path.join(self.config_dir, 'devices.json')
        
        try:
            data = {
                'devices': [device.to_dict() for device in self.devices.values()]
            }
            os.makedirs(os.path.dirname(filepath) or '.', exist_ok=True)
            with open(filepath, 'w') as f:
                json.dump(data, f, indent=2)
            print(f"[CONFIG] Saved device configurations to {filepath}")
        except Exception as e:
            print(f"[CONFIG] Error saving devices: {e}")
    
    def save_sensors(self, filepath: str = None):
        """Save sensor configurations to JSON file"""
        if filepath is None:
            filepath = os.path.join(self.config_dir, 'sensors.json')
        
        try:
            data = {
                'sensors': [sensor.to_dict() for sensor in self.sensors.values()]
            }
            os.makedirs(os.path.dirname(filepath) or '.', exist_ok=True)
            with open(filepath, 'w') as f:
                json.dump(data, f, indent=2)
            print(f"[CONFIG] Saved sensor configurations to {filepath}")
        except Exception as e:
            print(f"[CONFIG] Error saving sensors: {e}")


# Global configuration manager instance
_config_manager: Optional[ConfigurationManager] = None


def get_config_manager(config_dir: str = None) -> ConfigurationManager:
    """Get or create the global configuration manager"""
    global _config_manager
    if _config_manager is None:
        _config_manager = ConfigurationManager(config_dir)
    return _config_manager
