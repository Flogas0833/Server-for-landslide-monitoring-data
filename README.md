# Landslide Monitoring - MQTT Data Collection System

## 🎯 PROJECT OVERVIEW

Complete MQTT protocol for receiving sensor data from multiple field devices:

### 6 Sensor Types Monitored
- 🎯 **Tilt** - Inclinometer (slope angle)
- 🔊 **Vibration** - Accelerometer (ground movement)
- ➡️ **Displacement** - Distance sensor (cumulative movement)
- 🌧️ **Rainfall** - Rain gauge
- 🌡️ **Temperature** - Temp/Humidity sensor
- 🛰️ **GNSS** - GPS/GNSS positioning

## 🚀 QUICK START

### 1. Installation
```bash
# Install dependencies
pip install -r config/requirements_mqtt.txt

# Install Mosquitto broker
sudo apt-get install mosquitto mosquitto-clients
```

### 2. Start Broker
```bash
sudo systemctl start mosquitto
```

### 3. Run Tests
```bash
# mqtt protocol test
cd test
python3 test_mqtt_protocol.py

```

### 4. Run Simulation
```bash
# Terminal 1: Server receiver
cd backend
python3 mqtt_subscriber.py

# Terminal 2: Device simulator
python3 mqtt_publisher.py
```
