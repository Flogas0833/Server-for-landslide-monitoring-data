# Quick Reference: Adding Devices and Sensors

## Adding a New Device (No Code Changes Required)

### Step 1: Edit `config/devices.json`
```bash
nano config/devices.json
```

### Step 2: Add a new device entry
```json
{
  "device_id": "DEVICE003",
  "site_id": "SITE03",
  "project_id": "PRJ001",
  "name": "Sensor 3",
  "description": "Additional monitoring point at new location",
  "sensor_types": ["tilt", "vibration", "displacement", "rainfall", "temperature", "gnss"],
  "base_lat": 21.0528,
  "base_lon": 105.8545,
  "base_alt": 450.0
}
```

### Step 3: Restart the system
```bash
pkill -f mqtt_publisher.py
python3 backend/mqtt_publisher.py
```

## Adding a New Sensor Type (With Code)

### Step 1: Add to `config/sensors.json`
```json
{
  "sensor_type": "soil_moisture",
  "unit": "%",
  "description": "Soil moisture sensor",
  "valid_ranges": {
    "moisture_level": [0, 100],
    "salinity": [0, 10]
  },
  "alert_thresholds": {
    "warning": 15,
    "critical": 10
  }
}
```

### Step 2: Add to device `sensor_types`
Edit `config/devices.json`:
```json
{
  "device_id": "DEVICE001",
  "sensor_types": ["tilt", "vibration", "displacement", "soil_moisture"]
}
```

### Step 3: Add publish method in `mqtt_publisher.py`
```python
def publish_soil_moisture(self, moisture_level: float, salinity: float):
    """Publish soil moisture sensor data"""
    topic = f"landslide/project/{self.project_id}/site/{self.site_id}/device/{self.device_id}/data/soil_moisture"
    
    payload = {
        "device_id": self.device_id,
        "sensor_type": "soil_moisture",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "data": {
            "moisture_level": moisture_level,
            "salinity": salinity
        },
        "unit": "%",
        "quality": 95
    }
    
    json_payload = json.dumps(payload)
    payload["checksum"] = self.generate_checksum(json_payload)
    
    self.client.publish(topic, json.dumps(payload), qos=1, retain=False)
    print(f"[SOIL_MOISTURE] Level: {moisture_level}%, Salinity: {salinity}")
```

### Step 4: Call in `simulate_measurements()`
```python
self.publish_soil_moisture(
    moisture_level=random.uniform(30, 60),
    salinity=random.uniform(0.5, 2.0)
)
```

### Step 5: (Optional) Update device status display
If you want the web UI to show the sensor, it will automatically be included.

## Configuration Parameters Explained

### Device Configuration

```json
{
  "device_id": "DEVICE001",           // Unique identifier
  "site_id": "SITE01",                 // Site location ID
  "project_id": "PRJ001",              // Project ID
  "name": "Sensor 1",                  // Display name
  "description": "...",                // Human-readable description
  "sensor_types": [                    // List of sensors on this device
    "tilt", "vibration", ...
  ],
  "base_lat": 20.9603,                 // Starting latitude
  "base_lon": 107.0658,                // Starting longitude
  "base_alt": 500.0                    // Altitude (meters)
}
```

### Sensor Configuration

```json
{
  "sensor_type": "vibration",          // Must match in code
  "unit": "g (gravity)",                // Display unit
  "description": "...",                // What this sensor measures
  "valid_ranges": {                    // Acceptable data ranges per field
    "frequency": [0, 100],
    "amplitude_x": [0, 5]
  },
  "alert_thresholds": {                // Trigger alerts at these values
    "warning": 0.8,                    // Yellow alert
    "critical": 1.5                    // Red alert
  }
}
```

## Common Tasks

### Change Alert Thresholds
Edit `config/sensors.json`:
```json
{
  "sensor_type": "vibration",
  "alert_thresholds": {
    "warning": 0.7,      // Decreased from 0.8
    "critical": 1.3      // Decreased from 1.5
  }
}
```
✅ Changes take effect on next restart

### Modify Valid Ranges
Edit `config/sensors.json`:
```json
{
  "sensor_type": "displacement",
  "valid_ranges": {
    "horizontal": [0, 600],    // Increased from 500
    "vertical": [0, 600]       // Increased from 500
  }
}
```

### Add Multiple Devices at Once
```json
{
  "devices": [
    {
      "device_id": "DEVICE001",
      ...
    },
    {
      "device_id": "DEVICE002",
      ...
    },
    {
      "device_id": "DEVICE003",
      ...
    }
  ]
}
```

### View All Loaded Configurations
```python
from config_manager import get_config_manager

config = get_config_manager()

print("Devices:")
for device in config.get_all_devices():
    print(f"  - {device.device_id}: {device.name}")

print("\nSensors:")
for sensor in config.get_all_sensors():
    print(f"  - {sensor.sensor_type}: {sensor.unit}")
```

## Validation

### How to Test New Sensor

1. Add sensor to `config/sensors.json` ✓
2. Add to device `sensor_types` ✓
3. Implement plugin method in `mqtt_publisher.py` ✓
4. Call in `simulate_measurements()` ✓
5. Run publisher:
   ```bash
   python3 backend/mqtt_publisher.py
   ```
6. Check logs for valid data:
   ```
   [SENSOR_TYPE] Data: ...
   ✓ Valid reading
   ```

### Debug Configuration Loading

```python
from config_manager import get_config_manager

config = get_config_manager()

# Check if device exists
device = config.get_device("DEVICE001")
if device:
    print(f"✓ Device found: {device.name}")
else:
    print("✗ Device not found")

# Check if sensor is valid
if config.is_sensor_type_valid("vibration"):
    print("✓ Vibration sensor configured")
else:
    print("✗ Vibration sensor not configured")

# View sensor properties
thresholds = config.get_alert_thresholds("vibration")
print(f"Alert thresholds: {thresholds}")
```

## Troubleshooting

**Problem**: Device doesn't appear in the map
- ✓ Check `device_id` is in `config/devices.json`
- ✓ Check all required fields are present
- ✓ Check GNSS sensor is in `sensor_types`
- ✓ Restart mqtt_publisher

**Problem**: New sensor data not accepted
- ✓ Check sensor type is in `config/sensors.json`
- ✓ Check device has sensor in `sensor_types`
- ✓ Check field names match `valid_ranges` keys
- ✓ Check values are within valid ranges

**Problem**: Alert not triggering
- ✓ Check `alert_thresholds` exist for sensor type
- ✓ Check threshold values are correct
- ✓ Check sensor type matches check_alerts logic
- ✓ Verify data value exceeds threshold

**Problem**: Configuration not loading
- ✓ Check file exists: `config/devices.json`, `config/sensors.json`
- ✓ Check JSON syntax is valid (no trailing commas)
- ✓ Check permissions: `ls -la config/`
- ✓ Check logs for error messages

## Best Practices

1. **Use Descriptive Names**
   - Device: "Slope Monitor - North Ridge"
   - Site: "SITE_NORTH_SLOPE"

2. **Organize by Project**
   - Project: "PRJ_LANDSLIDE_2024"
   - Site: "SITE_AREA_A"

3. **Document Sensor Ranges**
   - Based on hardware specifications
   - Test before deploying

4. **Back up Configuration**
   ```bash
   cp config/devices.json config/devices.json.backup
   cp config/sensors.json config/sensors.json.backup
   ```

5. **Version Control**
   - Track JSON files in Git
   - Document sensor additions in CHANGELOG
