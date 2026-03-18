# MQTT GIAO THỨC TIẾP NHẬN DỮ LIỆU - TÓM TẮT

## 📋 TỔNG QUAN HỆ THỐNG

Hệ thống MQTT cho việc tiếp nhận dữ liệu từ **6 loại cảm biến**:
- 🎯 Tilt (Nghiêng)
- 🔊 Vibration (Rung)
- ➡️ Displacement (Dịch chuyển)
- 🌧️ Rainfall (Mưa)
- 🌡️ Temperature (Nhiệt độ)
- 🛰️ GNSS (GPS)

---

## 📁 FILES ĐÃ TẠO

### 1. 📖 Tài Liệu & Hướng Dẫn

**`MQTT_PROTOCOL_DESIGN.md`**
- Thiết kế giao thức MQTT chi tiết
- Topic structure và naming conventions
- Format JSON cho từng loại cảm biến
- QoS levels và Retain policies
- Alert mechanisms
- Security & Authentication
- Bandwidth optimization

**`MQTT_SETUP.md`**
- Hướng dẫn cài đặt từng bước
- Installation instructions (Linux/Ubuntu)
- Configuration steps
- Testing procedures
- Troubleshooting
- Performance tuning
- Docker setup alternative

**`MQTT_TEST_DATA.json`**
- Ví dụ JSON payload cho tất cả cảm biến
- Examples cho status, heartbeat, alerts
- Command & response examples
- Dùng để test manual hoặc integration

---

### 2. 🐍 Code Python

**`mqtt_publisher.py`** (Device Simulator)
- Class `SensorPublisher` để gửi dữ liệu
- Methods cho 6 loại cảm biến:
  - `publish_tilt()`
  - `publish_vibration()`
  - `publish_displacement()`
  - `publish_rainfall()`
  - `publish_temperature()`
  - `publish_gnss()`
- Hỗ trợ status, heartbeat
- Checksum validation
- Simulation mode
- **Dùng**: Mô phỏng thiết bị gửi dữ liệu

**`mqtt_subscriber.py`** (Server Receiver)
- Class `SensorDataSubscriber` để nhận dữ liệu
- Class `DataValidator` để validate dữ liệu
- Alert detection & triggering
- Real-time data processing
- Device status tracking
- Statistics gathering
- Callback functions
- **Dùng**: Server nhận & xử lý dữ liệu

---

### 3. ⚙️ Configuration Files

**`mosquitto.conf`**
- MQTT Broker configuration
- Listener settings (port 1883)
- Persistence configuration
- Logging setup
- Performance tuning
- TLS/SSL optional settings

**`mosquitto_acl.conf`**
- Access Control List
- Device permissions
- Server permissions
- Admin permissions
- Topic access rules

**`requirements_mqtt.txt`**
- Python dependencies
- `paho-mqtt` (MQTT client library)
- `python-dotenv` (environment variables)

---

## 🚀 QUICK START

### Step 1: Cài đặt
```bash
# Install dependencies
pip install -r requirements_mqtt.txt

# Install Mosquitto broker (Linux)
sudo apt-get install mosquitto mosquitto-clients
```

### Step 2: Start MQTT Broker
```bash
# Start service
sudo systemctl start mosquitto

# Or run directly
mosquitto -c mosquitto.conf
```

### Step 3: Run Server (Subscriber)
```bash
# Terminal 1
python mqtt_subscriber.py
```

### Step 4: Run Device Simulator (Publisher)
```bash
# Terminal 2
python mqtt_publisher.py
```

### Step 5: Monitor (Optional)
```bash
# Terminal 3
mosquitto_sub -h localhost -t "landslide/#" -v
```

---

## 📊 TOPIC STRUCTURE

```
landslide/
  └── project/{PROJECT_ID}/
       └── site/{SITE_ID}/
            └── device/{DEVICE_ID}/
                 ├── data/
                 │    ├── tilt              (QoS 1)
                 │    ├── vibration         (QoS 1)
                 │    ├── displacement      (QoS 1)
                 │    ├── rainfall          (QoS 1)
                 │    ├── temperature       (QoS 0)
                 │    └── gnss              (QoS 0)
                 ├── status                 (QoS 1, Retain=True)
                 ├── heartbeat              (QoS 0)
                 ├── command                (QoS 2)
                 └── response               (QoS 2)
```

---

## 📈 DATA FORMAT

### Mỗi Cảm Biến Gửi

```json
{
  "device_id": "DEVICE001",
  "sensor_type": "tilt",
  "timestamp": "2026-03-18T10:30:45.123Z",
  "data": {
    "roll": 5.23,
    "pitch": 3.45,
    ...
  },
  "unit": "degrees",
  "quality": 95,
  "sequence": 12345,
  "checksum": "abc123..."
}
```

---

## ⚠️ ALERT THRESHOLDS

| Cảm Biến | Warning | Critical |
|---------|---------|----------|
| Displacement | 5.0 mm | 8.0 mm |
| Vibration | 0.8 g | 1.5 g |
| Rainfall | 30 mm/h | 100 mm/h |

---

## ✅ VALIDATION RULES

| Cảm Biến | Phạm Vi Hợp Lệ |
|---------|--------|
| Tilt (roll/pitch) | -30° to 30° |
| Vibration | 0 to 5g |
| Displacement | 0 to 500mm |
| Rainfall | 0 to 200mm/h |
| Temperature | -20°C to 60°C |
| GNSS Lat | -90° to 90° |
| GNSS Lon | -180° to 180° |

---

## 🔐 SECURITY

- **Authentication**: Username/Password (optional)
- **Encryption**: TLS/SSL on port 8883 (optional)
- **ACL**: Access Control List per device
- **Checksum**: MD5 validation for data integrity

---

## 📊 MONITORING

### Statistics Tracked
- Total messages received
- Valid/Invalid message count
- Alerts triggered
- Active devices
- Online devices
- Battery levels
- Signal strength

### Real-time Output
```
[10:30:45] [DEVICE001] DISPLACEMENT: h=2.54mm, v=1.23mm
[10:30:45] [DEVICE001] VIBRATION: freq=5.2Hz, peak=0.45g
[10:30:45] [DEVICE001] TEMPERATURE: 28.5°C, humidity=65.3%
[HEARTBEAT] DEVICE001 is alive
[STATUS] DEVICE001: Battery=87%, Signal=-65dBm
```

---

## 🔧 KEY FEATURES

✅ **6 Sensor Types** - Comprehensive monitoring
✅ **Real-time Data** - Immediate delivery
✅ **Validation** - Automatic data checking
✅ **Alerts** - Threshold-based notifications
✅ **Status Tracking** - Device health monitoring
✅ **Scalable** - Support multiple devices
✅ **QoS Levels** - Reliability management
✅ **Encryption** - Optional TLS security
✅ **Retry Logic** - Exponential backoff
✅ **Checksum** - Data integrity check

---

## 📱 DEVICE PAYLOAD EXAMPLES

### Tilt (Nghiêng)
```json
{"roll": 5.23, "pitch": 3.45, "raw_x": 0.091, "raw_y": 0.060}
```

### Vibration (Rung)
```json
{"frequency": 5.2, "amplitude_x": 0.45, "amplitude_y": 0.32, "amplitude_z": 0.98}
```

### Displacement (Dịch Chuyển)
```json
{"horizontal": 2.54, "vertical": 1.23, "total": 2.82, "cumulative": 45.67}
```

### Rainfall (Mưa)
```json
{"intensity": 12.4, "cumulative_1h": 15.8, "cumulative_24h": 125.3}
```

### Temperature (Nhiệt Độ)
```json
{"current": 28.5, "humidity": 65.3, "min_1h": 25.2, "max_1h": 31.8}
```

### GNSS (GPS)
```json
{"latitude": 21.028531, "longitude": 105.854236, "altitude": 125.45, "satellites": 12}
```

---

## 🔄 MESSAGE FLOW

```
Thiết Bị                    Broker                    Server
  │                           │                         │
  ├─ Publish Sensor Data ──→ │                         │
  │  (QoS 1: Tilt)          │─ Message Stored ──→     │
  │                           │                    Subscribe
  ├─ Publish Status ────────→ │                    Validate
  │  (QoS 1, Retain)         │─ Retained ──────→ Process
  │                           │                    Store
  ├─ Heartbeat ─────────────→ │                    Alert
  │  (QoS 0)                 │─ Immediate ──────→ Callback
  │                           │                         │
  ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ←
              (Subscribe to /command topic)
```

---

## 📚 FILE REFERENCES

```
Server-for-landslide-monitoring-data/
├── MQTT_PROTOCOL_DESIGN.md      ← Thiết kế chi tiết
├── MQTT_SETUP.md                ← Hướng dẫn cài đặt
├── MQTT_SUMMARY.md              ← File này (Tóm tắt)
├── MQTT_TEST_DATA.json          ← Ví dụ dữ liệu
├── mqtt_publisher.py            ← Device simulator
├── mqtt_subscriber.py           ← Server receiver
├── mosquitto.conf               ← Broker config
├── mosquitto_acl.conf           ← Access control
└── requirements_mqtt.txt        ← Dependencies
```

---

## 🎯 NEXT STEPS

1. ✅ Review protocol design (`MQTT_PROTOCOL_DESIGN.md`)
2. ✅ Follow setup guide (`MQTT_SETUP.md`)
3. ✅ Test with examples (`MQTT_TEST_DATA.json`)
4. ✅ Run publisher & subscriber
5. ⏳ Integrate with database
6. ⏳ Build web dashboard
7. ⏳ Deploy to production

---

## 💡 TIPS & BEST PRACTICES

### Development
- Use QoS 0 for temperature/GNSS (don't need reliability)
- Use QoS 1 for critical sensor data (displacement, vibration)
- Don't set Retain on sensor data (only on status)

### Production
- Enable TLS/SSL encryption
- Use username/password authentication
- Implement ACL for access control
- Monitor broker logs regularly
- Set up automatic backups

### Debugging
- Subscribe to all topics: `mosquitto_sub -t "#" -v`
- Monitor broker: `mosquitto_sub -t "$SYS/#" -v`
- Check logs: `tail -f /var/log/mosquitto/mosquitto.log`

---

## ❓ FAQ

**Q: Làm sao để test locally?**
A: Chạy Mosquitto trên localhost, run publisher & subscriber cùng lúc

**Q: Hỗ trợ bao nhiêu thiết bị?**
A: Mosquitto có thể hỗ trợ 1000+ devices, tùy hardware

**Q: Dữ liệu được lưu ở đâu?**
A: Hiện tại lưu trong memory của server, cần integrate database

**Q: Có thể scale up không?**
A: Có, set up cluster Mosquitto hoặc dùng message broker khác (Kafka)

**Q: Security như thế nào?**
A: Có thể enable TLS/SSL + username/password + ACL

---

Tài liệu này tóm tắt toàn bộ thiết kế giao thức MQTT. 
Để chi tiết, xem các file documentation và code.
