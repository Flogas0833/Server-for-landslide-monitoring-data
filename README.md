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

---

## 🏗️ ARCHITECTURE

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    LANDSLIDE MONITORING SYSTEM                   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│   FIELD DEVICES  │
├──────────────────┤
│ • Sensor Node 1  │
│ • Sensor Node 2  │
│ • Sensor Node N  │
│ (MQTT Clients)   │
└────────┬─────────┘
         │ MQTT Publish
         │ (Topic-based)
         ▼
┌──────────────────────────────────────┐
│   MOSQUITTO BROKER (Port 1883)      │
│   Message Queue & Routing            │
└────────┬─────────────────────────────┘
         │ MQTT Subscribe
         ▼
┌─────────────────────────────────────────────────┐
│          BACKEND (Python Flask)                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐  │
│  │   MQTT Subscriber                       │  │
│  │  • Listen to sensor topics              │  │
│  │  • Parse JSON data                      │  │
│  │  • Check thresholds (AlertManager)      │  │
│  │  • Save to database                     │  │
│  └────────────────┬────────────────────────┘  │
│                   │                            │
│  ┌────────────────▼────────────────────────┐  │
│  │   AlertManager                          │  │
│  │  • Check danger levels (LOW/MED/HIGH)   │  │
│  │  • Create alerts when thresholds exceed │  │
│  │  • Store alerts in database             │  │
│  └─────────────────────────────────────────┘  │
│                   │                            │
│  ┌────────────────▼────────────────────────┐  │
│  │   Flask REST API Server                 │  │
│  │  • GET /api/devices                     │  │
│  │  • GET /api/sensor/{type}               │  │
│  │  • GET /api/alerts                      │  │
│  │  • POST /api/alerts/{id}/acknowledge    │  │
│  │  • POST /api/alerts/thresholds          │  │
│  │  • GET /api/export/csv|json             │  │
│  └─────────────────────────────────────────┘  │
└────────┬──────────────────────────┬────────────┘
         │ HTTP REST API            │
         │ (Port 5000)              │ SQLite
         ▼                          ▼
    ┌────────────────┐    ┌─────────────────────┐
    │  FRONTEND      │    │  DATABASE           │
    │ (HTML/CSS/JS)  │    │  (SQLite)           │
    │                │    │                     │
    │ • Dashboard    │    │ Tables:             │
    │ • Interactive  │    │ • sensor_readings   │
    │   Maps         │    │ • devices           │
    │ • Charts       │    │ • alerts            │
    │ • Alerts       │    │ • alert_thresholds  │
    │ • Filters      │    │                     │
    │ • Export       │    │ Indexes for fast    │
    │                │    │ queries             │
    └────────────────┘    └─────────────────────┘
         ▲
         │ Redirect HTTP
         │ (Port 5000)
         │
    ┌────────────────┐
    │   WEB BROWSER  │
    │  (User Access) │
    └────────────────┘
```

### Component Details

#### **1. Field Devices & MQTT Clients**
```
Each device publishes to specific MQTT topics:

Topic Format: device/{device_id}/sensor/{sensor_type}

Payload (JSON):
{
  "device_id": "DEVICE001",
  "sensor_type": "displacement",
  "timestamp": "2026-04-15T10:30:00Z",
  "data": {
    "horizontal": 45.2,     // mm
    "vertical": 32.1,       // mm
    "cumulative": 128.5     // mm (total movement)
  }
}

Example Topics:
├─ device/DEVICE001/sensor/tilt
├─ device/DEVICE001/sensor/vibration
├─ device/DEVICE001/sensor/displacement
├─ device/DEVICE001/sensor/rainfall
├─ device/DEVICE001/sensor/temperature
└─ device/DEVICE002/sensor/displacement
```

#### **2. Mosquitto MQTT Broker**
```
Function: Central message hub
- Receives messages from field devices
- Routes to subscribed clients (backend)
- Supports QoS levels for reliability
- Persistent message storage option

Port: 1883 (unencrypted) / 8883 (SSL)
Config: config/mosquitto.conf
ACL: config/mosquitto_acl.conf
```

#### **3. Backend - MQTT Subscriber**
```
File: backend/mqtt_subscriber.py

Process Flow:
1. Connect to MQTT broker
2. Subscribe to device/*/sensor/* topics
3. Receive JSON payload
4. Parse sensor data
5. Check against AlertManager thresholds
6. Save to database
7. If threshold exceeded:
   └─ Create alert record
   └─ Log warning message
   └─ Update statistics
```

#### **4. Backend - Alert Manager**
```
File: backend/alert_manager.py

Features:
- Danger level classification (NORMAL, LOW, MEDIUM, HIGH, CRITICAL)
- Sensor-specific threshold checking
- Alert creation & persistence
- Alert acknowledgement tracking
- Threshold management (read/write)
- Statistics aggregation

Thresholds (customizable):
├─ Displacement cumulative: 20mm(L) → 50(M) → 100(H) → 200(C)
├─ Tilt: 2°(L) → 5°(M) → 10°(H) → 15°(C)
├─ Vibration: 0.2G(L) → 0.5G(M) → 1.0G(H) → 2.0G(C)
├─ Rainfall 1h: 10(L) → 25(M) → 50(H) → 100(C) mm/h
└─ Temperature: -20°C...60°C normal range
```

#### **5. Backend - Flask REST API**
```
File: backend/web_server.py
Port: 5000

Endpoints:

📌 Device Management:
  GET /api/devices                    → List all devices
  GET /api/device/{device_id}         → Device details

📊 Sensor Data:
  GET /api/sensor/{type}              → Latest readings
  GET /api/sensor-history             → Historical data
  POST /api/register-device           → Register new device

📈 Statistics:
  GET /api/statistics                 → System statistics
  GET /api/export/csv                 → Export CSV
  GET /api/export/json                → Export JSON

🚨 Alerts:
  GET /api/alerts                     → Active alerts
  GET /api/alerts/history             → Alert history
  POST /api/alerts/{id}/acknowledge   → Acknowledge alert
  GET /api/alerts/stats               → Alert statistics
  GET /api/alerts/thresholds          → View thresholds
  POST /api/alerts/thresholds         → Update threshold

🏥 Health:
  GET /api/health                     → Server status
```

#### **6. Frontend - Web UI**
```
Files:
├─ frontend/index.html                → Map view (OpenStreetMap)
├─ frontend/dashboard.html            → Data dashboard
│
├─ static/css/
│  ├─ style.css                       → Map styling
│  └─ dashboard.css                   → Dashboard styling
│
└─ static/js/
   ├─ map.js                          → Map interactions
   └─ dashboard.js                    → Data visualization

Features:
├─ 🗺️ Interactive Maps (Leaflet.js)
│  └─ Device pins with live locations
│
├─ 📊 Real-time Dashboard
│  ├─ Statistics cards (devices, warnings)
│  ├─ 📈 Interactive charts (Chart.js)
│  ├─ 📋 Data tables (all 5 sensor types)
│  ├─ 🔍 Filter & search
│  └─ 💾 CSV/JSON export
│
├─ 🚨 Alert Panel
│  ├─ Color-coded severity (RED=CRITICAL, etc)
│  ├─ Real-time polling (/api/alerts)
│  ├─ Acknowledge functionality
│  └─ Sound notifications for CRITICAL
│
└─ 📱 Responsive Design
   └─ Works on desktop, tablet, mobile
```

#### **7. Database - SQLite**
```
File: database/sensors.db

Tables:

sensor_readings:
├─ id (PK)
├─ device_id
├─ sensor_type
├─ data (JSON)
├─ timestamp
└─ Indexes: device_id, timestamp, sensor_type

devices:
├─ id (PK)
├─ device_id (UNIQUE)
├─ latitude, longitude
├─ last_reading_time
└─ device_info (JSON)

alerts:
├─ id (PK)
├─ device_id
├─ sensor_type
├─ danger_level
├─ message
├─ value, threshold
├─ timestamp
├─ acknowledged (bool)
├─ acknowledged_at
├─ acknowledged_by
└─ Indexes: device_id, timestamp, danger_level

alert_thresholds:
├─ id (PK)
├─ sensor_type
├─ threshold_name
├─ threshold_value
└─ updated_at
```

### Data Flow Diagram

```
Field Device              MQTT Broker            Backend            Database
(Sensor Node)            (Mosquitto)         (Python/Flask)        (SQLite)
     │                       │                      │                  │
     ├──── MQTT Publish ────→│                      │                  │
     │  (sensor data JSON)   │                      │                  │
     │                       │──── MQTT Sub ───────→│                  │
     │                       │   (receive data)     │                  │
     │                       │                      ├─ Parse JSON      │
     │                       │                      ├─ Check Alerts    │
     │                       │                      │                  │
     │                       │                      ├─ Save Reading ───→│
     │                       │                      │   (sensor_readings)
     │                       │                      │                  │
     │ (if threshold exceeded)                     │                  │
     │                       │                      ├─ Create Alert ──→│
     │                       │                      │   (alerts table) │
     │                       │                      │                  │
◄─────────────────────────────────────────────────────────────────────┤
Browser                    Flask API             Database Query      Results
Request                  (REST API)             (JOIN, filter, agg)   (JSON)
GET /api/alerts
     │
     │──────────────────────→│
     │                       ├─ Query DB
     │                       │ (SELECT * from alerts WHERE ...)
     │                       │                  │
     │                       │←─ Fetch results ─┤
     │                       │
     │←──── JSON Response ───┤
     │    [{id: 1, device_id: 'D001', ...}]
```

### Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Message Broker** | Mosquitto (MQTT) | 2.0+ | Real-time pub/sub messaging |
| **Backend Runtime** | Python | 3.10.12 | Server logic |
| **Web Framework** | Flask | 2.3.0 | REST API server |
| **MQTT Client** | Paho-MQTT | 1.6.1 | Python MQTT library |
| **Database** | SQLite | 3.x | Data persistence |
| **Frontend Framework** | HTML5/CSS3/JS (Vanilla) | ES6+ | Web UI |
| **Mapping Library** | Leaflet.js | 1.9+ | Interactive maps |
| **Charting Library** | Chart.js | 4.4.0 | Data visualization |
| **HTTP Server** | Flask (built-in) | - | Port 5000 |

### Project Structure

```
Server-for-landslide-monitoring-data/
├── backend/
│   ├── mqtt_subscriber.py      # MQTT listener & data processor
│   ├── mqtt_publisher.py       # Device simulator
│   ├── web_server.py           # Flask REST API
│   ├── alert_manager.py        # Alert logic & thresholds
│   ├── database.py             # Database operations
│   └── config_manager.py       # Configuration handling
│
├── frontend/
│   ├── index.html              # OpenStreetMap view
│   ├── dashboard.html          # Data dashboard
│   └── static/
│       ├── css/
│       │   ├── style.css       # Map styling
│       │   └── dashboard.css   # Dashboard styling
│       └── js/
│           ├── map.js          # Map interactions
│           └── dashboard.js    # Data visualization
│
├── config/
│   ├── mosquitto.conf          # MQTT broker config
│   ├── mosquitto_acl.conf      # Access control
│   ├── devices.json            # Device definitions
│   ├── sensors.json            # Sensor configurations
│   └── requirements_mqtt.txt   # Python dependencies
│
├── database/
│   └── sensors.db              # SQLite database (auto-created)
│
├── test/
│   ├── test_mqtt_protocol.py   # Unit tests
│   └── MQTT_TEST_DATA.json     # Test data
│
├── docs/
│   ├── MQTT_PROTOCOL_DESIGN.md
│   ├── MQTT_IMPLEMENTATION_README.md
│   ├── TECHNICAL_OVERVIEW.md
│   └── LANDSLIDE_MONITORING_STANDARDS.md  # Threshold reference
│
├── README.md                   # This file
├── start_system.sh            # Startup script
└── open_map.py                # Quick map launcher
```

---

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
