# MQTT Giao Thức Tiếp Nhận Dữ Liệu Cảm Biến Sạt Lở

## 1. KIẾN TRÚC MQTT TOPIC

### Topic Structure (Cấu Trúc Chủ Đề)
```
landslide/project/{project_id}/site/{site_id}/device/{device_id}/data/{sensor_type}
```

### Ví dụ Chi Tiết
```
landslide/project/PRJ001/site/SITE01/device/DEVICE001/data/tilt
landslide/project/PRJ001/site/SITE01/device/DEVICE001/data/vibration
landslide/project/PRJ001/site/SITE01/device/DEVICE001/data/displacement
landslide/project/PRJ001/site/SITE01/device/DEVICE001/data/rainfall
landslide/project/PRJ001/site/SITE01/device/DEVICE001/data/temperature
landslide/project/PRJ001/site/SITE01/device/DEVICE001/data/gnss
```

### Topics Bổ Sung
```
# Device Status
landslide/project/{proj_id}/site/{site_id}/device/{dev_id}/status
landslide/project/{proj_id}/site/{site_id}/device/{dev_id}/heartbeat
landslide/project/{proj_id}/site/{site_id}/device/{dev_id}/battery

# Server Command
landslide/project/{proj_id}/site/{site_id}/device/{dev_id}/command
landslide/project/{proj_id}/site/{site_id}/device/{dev_id}/config

# Alerts
landslide/project/{proj_id}/alerts/critical
landslide/project/{proj_id}/alerts/warning
```

---

## 2. FORMAT DỮ LIỆU PAYLOAD JSON CHO MỖI CẢM BIẾN

### 2.1 TILT (Cảm Biến Nghiêng)
```json
{
  "device_id": "DEVICE001",
  "sensor_type": "tilt",
  "timestamp": "2026-03-18T10:30:45.123Z",
  "data": {
    "roll": 5.23,           // độ nghiêng trái-phải (degrees)
    "pitch": 3.45,          // độ nghiêng trước-sau (degrees)
    "raw_x": 0.091,         // giá trị raw X axis
    "raw_y": 0.060          // giá trị raw Y axis
  },
  "unit": "degrees",
  "quality": 95,            // signal quality (%)
  "sequence": 12345         // message sequence number
}
```

### 2.2 VIBRATION (Cảm Biến Rung)
```json
{
  "device_id": "DEVICE001",
  "sensor_type": "vibration",
  "timestamp": "2026-03-18T10:30:45.123Z",
  "data": {
    "frequency": 5.2,        // Hz (tần số chính)
    "amplitude_x": 0.45,     // g (gia tốc X)
    "amplitude_y": 0.32,     // g (gia tốc Y)
    "amplitude_z": 0.98,     // g (gia tốc Z)
    "rms_value": 0.52,       // Root Mean Square
    "peak_value": 1.85       // Peak acceleration
  },
  "unit": "g (gravity)",
  "threshold_exceeded": false,
  "sequence": 12346
}
```

### 2.3 DISPLACEMENT (Cảm Biến Dịch Chuyển)
```json
{
  "device_id": "DEVICE001",
  "sensor_type": "displacement",
  "timestamp": "2026-03-18T10:30:45.123Z",
  "data": {
    "horizontal": 2.54,      // mm (dịch chuyển ngang)
    "vertical": 1.23,        // mm (dịch chuyển thẳng đứng)
    "total": 2.82,           // mm (tổng dịch chuyển)
    "cumulative": 45.67,     // mm (tích lũy từ lúc lắp đặt)
    "rate_of_change": 0.12   // mm/day (tốc độ thay đổi)
  },
  "unit": "mm",
  "alert_level": 0,          // 0=normal, 1=warning, 2=critical
  "sequence": 12347
}
```

### 2.4 RAINFALL (Cảm Biến Mưa)
```json
{
  "device_id": "DEVICE001",
  "sensor_type": "rainfall",
  "timestamp": "2026-03-18T10:30:45.123Z",
  "data": {
    "intensity": 12.4,       // mm/h (cường độ mưa)
    "cumulative_1h": 15.8,   // mm (lượng mưa 1 giờ)
    "cumulative_24h": 125.3, // mm (lượng mưa 24 giờ)
    "cumulative_total": 1250.5, // mm (tổng lượng mưa)
    "bucket_count": 158      // số lần hạt mưa ghi được
  },
  "unit": "mm",
  "rain_status": "raining",  // "no_rain", "light", "moderate", "heavy"
  "sequence": 12348
}
```

### 2.5 TEMPERATURE (Cảm Biến Nhiệt Độ)
```json
{
  "device_id": "DEVICE001",
  "sensor_type": "temperature",
  "timestamp": "2026-03-18T10:30:45.123Z",
  "data": {
    "current": 28.5,         // °C (nhiệt độ hiện tại)
    "min_1h": 25.2,          // °C (nhiệt độ tối thiểu 1h)
    "max_1h": 31.8,          // °C (nhiệt độ tối đa 1h)
    "avg_1h": 28.1,          // °C (nhiệt độ trung bình 1h)
    "humidity": 65.3         // % (độ ẩm tương đối)
  },
  "unit": "°C",
  "sensor_status": "ok",     // "ok", "error", "uncalibrated"
  "sequence": 12349
}
```

### 2.6 GNSS (GPS/GNSS)
```json
{
  "device_id": "DEVICE001",
  "sensor_type": "gnss",
  "timestamp": "2026-03-18T10:30:45.123Z",
  "data": {
    "latitude": 21.028531,   // độ
    "longitude": 105.854236, // độ
    "altitude": 125.45,      // m
    "horizontal_accuracy": 0.8, // m (độ chính xác ngang)
    "vertical_accuracy": 1.2,   // m (độ chính xác dọc)
    "satellites_tracked": 12,   // số vệ tinh
    "fix_type": "fix_3d",       // "no_fix", "fix_2d", "fix_3d"
    "pdop": 2.1               // Position Dilution of Precision
  },
  "unit": "degrees/meters",
  "gnss_status": "fixed",    // "no_fix", "searching", "fixed"
  "sequence": 12350
}
```

### 2.7 DEVICE STATUS (Trạng Thái Thiết Bị)
```json
{
  "device_id": "DEVICE001",
  "device_name": "Sensor Point A",
  "timestamp": "2026-03-18T10:30:45.123Z",
  "status": "online",        // "online", "offline", "error"
  "battery_level": 87,       // % (mức pin)
  "signal_strength": -65,    // dBm (cường độ tín hiệu)
  "last_message_sent": "2026-03-18T10:30:40.000Z",
  "message_count": 12345,    // tổng số tin nhắn đã gửi
  "error_count": 2,          // số lỗi gần đây
  "uptime": 86400,           // giây (thời gian hoạt động)
  "firmware_version": "v1.2.3"
}
```

### 2.8 HEARTBEAT (Nhịp Tim - Kiểm Tra Sống)
```json
{
  "device_id": "DEVICE001",
  "timestamp": "2026-03-18T10:30:45.123Z",
  "status": "alive",
  "battery": 87,
  "signal": -65,
  "message_id": "HEARTBEAT_12345"
}
```

---

## 3. CẤU HÌNH MQTT QoS VÀ RETAIN

### QoS (Quality of Service) Levels
```
Sensor Data (tilt, vibration, displacement, etc.):
  → QoS 1 (At Least Once)
  → Đảm bảo dữ liệu đến ít nhất 1 lần, không mất

Device Status & Heartbeat:
  → QoS 0 (Fire and Forget) 
  → Nếu mất không sao

Alerts & Critical Events:
  → QoS 2 (Exactly Once)
  → Đảm bảo tin tức không mất và không trùng lặp

Commands & Config:
  → QoS 2 (Exactly Once)
  → Đảm bảo lệnh được thực hiện đúng 1 lần
```

### RETAIN Flag
```
Sensor Data:
  → RETAIN = false (không giữ lại)
  → Muốn dữ liệu real-time

Device Status:
  → RETAIN = true (giữ lại)
  → New subscriber nhận ngay trạng thái mới nhất

Configuration:
  → RETAIN = true (giữ lại)
  → Thiết bị reconnect vẫn biết config hiện tại
```

---

## 4. CHUẨN ĐẶT TÊN THIẾT BỊ

```
Format: {LOCATION}_{SENSOR_TYPE}_{NUMBER}

Ví dụ:
- SLOPE_A_TILT_01
- SLOPE_A_VIBRATION_01
- SLOPE_A_DISPLACEMENT_01
- SLOPE_B_RAINFALL_01
- SLOPE_B_TEMPERATURE_01
- SLOPE_B_GNSS_01

Hoặc:
- DEVICE_PRJXXX_SITEYY_001
```

---

## 5. TẦN SUẤT GỬI DỮ LIỆU

```
Sensor Type          Recommended Interval    QoS
──────────────────────────────────────────────────
Tilt                 5-30 seconds            QoS 1
Vibration            10-60 seconds           QoS 1
Displacement         1-5 minutes             QoS 1
Rainfall             30 seconds - 2 minutes  QoS 1
Temperature          1-5 minutes             QoS 0
GNSS                 1-5 minutes             QoS 0
Heartbeat            30-60 seconds           QoS 0
Device Status        5-10 minutes            QoS 1
```

---

## 6. CẢNH BÁO (ALERTS)

### Alert Topics
```json
Topic: landslide/project/PRJ001/alerts/critical

Payload:
{
  "alert_id": "ALERT_2026_03_18_001",
  "timestamp": "2026-03-18T10:30:45.123Z",
  "severity": "critical",    // "info", "warning", "critical"
  "device_id": "DEVICE001",
  "location": {
    "latitude": 21.028531,
    "longitude": 105.854236,
    "site_name": "Slope A"
  },
  "message": "Displacement exceeded critical threshold",
  "sensor_type": "displacement",
  "current_value": 8.5,
  "threshold": 5.0,
  "unit": "mm",
  "recommended_action": "Evacuate area immediately"
}
```

---

## 7. LỆNH ĐỊNH CẤU HÌNH TỪ SERVER

### Command Topic
```
Topic: landslide/project/PRJ001/site/SITE01/device/DEVICE001/command

Payload:
{
  "command_id": "CMD_001",
  "command_type": "calibrate",  // "calibrate", "reboot", "update_config", "test"
  "timestamp": "2026-03-18T10:30:45.123Z",
  "parameters": {
    "sensor_type": "displacement",
    "offset": 0.0
  }
}

Response Topic:
landslide/project/PRJ001/site/SITE01/device/DEVICE001/response

Response Payload:
{
  "command_id": "CMD_001",
  "status": "success",  // "success", "failed", "pending"
  "timestamp": "2026-03-18T10:30:50.123Z",
  "message": "Calibration completed"
}
```

---

## 8. BẢO MẬT MQTT

### Authentication
```
Username/Password:
  - Username: prj001_site01_device001
  - Password: secure_password_hash

Hoặc Token-based:
  - Bearer token with expiration
```

### TLS/SSL
```
- Use MQTTS (MQTT over TLS) on port 8883
- Certificate verification required
- Client certificates for mutual authentication
```

### Access Control (ACL)
```
Device001 có quyền:
- PUBLISH:   landslide/project/PRJ001/site/SITE01/device/DEVICE001/data/+
- PUBLISH:   landslide/project/PRJ001/site/SITE01/device/DEVICE001/status
- PUBLISH:   landslide/project/PRJ001/site/SITE01/device/DEVICE001/response
- SUBSCRIBE: landslide/project/PRJ001/site/SITE01/device/DEVICE001/command
- SUBSCRIBE: landslide/project/PRJ001/site/SITE01/device/DEVICE001/config
```

---

## 9. ERROR HANDLING & RETRY

### Message Structure Với Error Handling
```json
{
  "message_id": "MSG_12345",
  "device_id": "DEVICE001",
  "timestamp": "2026-03-18T10:30:45.123Z",
  "retry_count": 0,
  "max_retries": 3,
  "data": {...},
  "checksum": "abc123def456"  // CRC32 hoặc SHA256
}
```

### Retry Strategy
```
Exponential Backoff:
  Attempt 1: immediately
  Attempt 2: 5 seconds
  Attempt 3: 25 seconds  (5 * 5)
  Attempt 4: 125 seconds (25 * 5)
  
Max retries: 3
Timeout per attempt: 10 seconds
```

---

## 10. BANDWIDTH OPTIMIZATION

### Data Compression
```
- Sử dụng short field names: "t" thay vì "timestamp"
- Compress JSON payload nếu > 1KB
- Gửi chỉ những thay đổi (delta)
```

### Optimized Payload (Compact Format)
```json
{
  "d": "DEVICE001",         // device_id
  "t": "2026-03-18T10:30:45Z",
  "s": "displacement",      // sensor_type
  "v": 2.54,                // value (nếu single value)
  "q": 95                   // quality
}

Hoặc batch format:
{
  "d": "DEVICE001",
  "ts": [45000, 45010, 45020],
  "vals": [2.54, 2.56, 2.58]
}
```

---

## 11. MONITORING VÀ LOGGING

### Monitoring Metrics
```
- Messages per device per hour
- Average publish latency
- Failed message count
- Battery level trends
- Signal strength trends
- Connection uptime
```

### Log Level
```json
{
  "timestamp": "2026-03-18T10:30:45.123Z",
  "device_id": "DEVICE001",
  "event": "data_published",
  "level": "info",          // "debug", "info", "warning", "error"
  "message": "Displacement data published",
  "details": {...}
}
```

---

## 12. TESTING MQTT CONNECTION

### Test dengan mosquitto_pub
```bash
# Subscribe to topic
mosquitto_sub -h localhost -p 1883 -t "landslide/project/+/+/device/+/data/+" -v

# Publish test data
mosquitto_pub -h localhost -p 1883 -t "landslide/project/PRJ001/site/SITE01/device/DEVICE001/data/displacement" -m '{...}'
```

---

## 13. SUMMARY - QUICK REFERENCE

| Aspek | Chi Tiết |
|------|---------|
| **Broker** | Mosquitto / HiveMQ / EMQX |
| **Port** | 1883 (TCP), 8883 (TLS) |
| **Protocol** | MQTT v3.1.1 / v5.0 |
| **QoS** | 0, 1, 2 (tùy loại data) |
| **Retain** | true (status), false (sensor data) |
| **Topic** | `landslide/project/{proj}/{site}/device/{dev}/data/{sensor}` |
| **Auth** | Username/Password + TLS |
| **Encoding** | UTF-8 JSON |
| **Compression** | Optional gzip |

