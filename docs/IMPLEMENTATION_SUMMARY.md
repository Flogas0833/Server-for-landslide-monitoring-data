# 🗺️ OpenStreetMap Visualization - Tóm Tắt Triển Khai

Đã hoàn thành triển khai hệ thống bản đồ tương tác để hiển thị vị trí các cảm biến giám sát sạt lở trên OpenStreetMap.

---

## 📊 Tóm Tắt Các Thay Đổi

### ✅ Tệp Mới Được Tạo

#### Backend (Python)
| Tệp | Mục Đích | Kích Thước |
|-----|---------|-----------|
| `backend/database.py` | Module SQLite database | ~400 dòng |
| `backend/web_server.py` | Flask REST API + Web server | ~200 dòng |

#### Frontend (HTML/CSS/JavaScript)
| Tệp | Mục Đích |
|-----|---------|
| `frontend/index.html` | Bản đồ OpenStreetMap tương tác |
| `frontend/dashboard.html` | Bảng điều khiển dữ liệu |
| `frontend/static/css/style.css` | CSS cho bản đồ (Responsive) |
| `frontend/static/css/dashboard.css` | CSS cho dashboard |
| `frontend/static/js/map.js` | Leaflet.js + bản đồ logic |
| `frontend/static/js/dashboard.js` | Dashboard logic |

#### Documentation
| Tệp | Nội Dung |
|-----|---------|
| `docs/OPENSTREETMAP_SETUP.md` | Hướng dẫn cài đặt chi tiết (Tiếng Việt) |
| `OPENSTREETMAP_QUICKSTART.md` | Bắt đầu nhanh |
| `quick_start.sh` | Script khởi động tự động |

### ✅ Tệp Đã Được Cập Nhật

| Tệp | Thay Đổi |
|-----|----------|
| `config/requirements_mqtt.txt` | Thêm `flask==2.3.0` và `flask-cors==4.0.0` |
| `backend/mqtt_subscriber.py` | Thêm database integration, lưu trữ dữ liệu |

### ✅ Cơ Sở Dữ Liệu

**Tệp**: `database/sensors.db` (SQLite - tự tạo)

**Bảng**:
- `sensor_readings` - Lưu toàn bộ dữ liệu cảm biến
- `devices` - Thông tin thiết bị + vị trí mới nhất

**Tính năng**:
- ✓ Persistent storage của tất cả dữ liệu
- ✓ Indexes cho tìm kiếm nhanh
- ✓ JSON support cho dữ liệu phức tạp

---

## 🌐 API Endpoints

### REST API Specification

```
Base URL: http://localhost:5000/api
```

#### 1. Danh sách tất cả cảm biến
```
GET /api/devices
```
**Response**: Array of devices with current location

#### 2. Chi tiết cảm biến
```
GET /api/device/{device_id}
```
**Response**: Device location + latest readings for all sensor types

#### 3. Dữ liệu theo loại cảm biến
```
GET /api/sensor/{sensor_type}?limit=10
```
Sensor types: `tilt`, `vibration`, `displacement`, `rainfall`, `temperature`

#### 4. Thống kê hệ thống
```
GET /api/statistics
```
**Response**: Tổng số cảm biến, số cảm biến hoạt động, etc.

#### 5. Đăng ký cảm biến mới
```
POST /api/register-device
Content-Type: application/json

{
    "device_id": "DEVICE001",
    "project_id": "PRJ001",
    "site_id": "SITE001",
    "latitude": 21.028531,
    "longitude": 105.854236,
    "name": "Sensor 1"
}
```

---

## 🚀 Cách Sử Dụng

### Yêu Cầu
- Python 3.7+
- Mosquitto MQTT Broker
- (Optional) Curl để test API

### Cài Đặt

```bash
# 1. Cài dependencies
pip install -r config/requirements_mqtt.txt

# 2. Khởi động (mỗi cái trong terminal riêng biệt)

# Terminal 1: MQTT Broker
sudo systemctl start mosquitto

# Terminal 2: MQTT Subscriber (nhận dữ liệu)
cd backend
python3 mqtt_subscriber.py

# Terminal 3: Thiết bị mô phỏng (gửi dữ liệu)
cd backend
python3 mqtt_publisher.py

# Terminal 4: Web Server
cd backend
python3 web_server.py
```

### Truy Cập

- 📍 **Bản đồ**: http://localhost:5000/
- 📊 **Dashboard**: http://localhost:5000/dashboard
- 📡 **API**: http://localhost:5000/api/devices

---

## 🎨 Tính Năng Giao Diện

### Bản Đồ Tương Tác
- 🗺️ OpenStreetMap (công khai, miễn phí)
- 🎯 Marker cho từng cảm biến
- 📋 Danh sách device trên bên trái
- 🔍 Tìm kiếm cảm biến
- 📱 Responsive design (các thiết bị di động)
- 🔄 Cập nhật tự động mỗi 10 giây

### Bảng Điều Khiển
- 📊 Thống kê tổng quát
- 📈 Bảng dữ liệu cho mỗi loại cảm biến
- 🎨 Highlight dữ liệu bất thường
- 🔄 Cập nhật tự động mỗi 5 giây

---

## 📈 Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────┐
│         MQTT Devices (Cảm Biến)                │
│  Gửi: Tilt, Vibration, Rainfall, Temp, etc.   │
└─────────────────────────────────────────────────┘
                        │
                    MQTT Protocol
                   (Mosquitto Broker)
                        │
        ┌───────────────┴───────────────┐
        │                               │
┌──────────────────────┐     ┌─────────────────────┐
│  mqtt_subscriber.py  │     │  mqtt_publisher.py  │
│  (Server - nhận)     │     │  (Mô phỏng thiết bị)│
└──────────────────────┘     └─────────────────────┘
        │
        │ (Save data)
        ▼
┌──────────────────────┐
│   database.py        │
│   (SQLite DB)        │
└──────────────────────┘
        ▲
        │ (Query data)
        │
┌──────────────────────┐
│   web_server.py      │
│   (Flask REST API)   │
└──────────────────────┘
        ▲
        │ (HTTP Request)
        │
┌──────────────────────────────────────────┐
│   Frontend (HTML/CSS/JS)                 │
│  - Map (index.html)   - Dashboard        │
│  - Leaflet.js         - Bootstrap data   │
└──────────────────────────────────────────┘
```

---

## 🔒 Dữ Liệu Được Lưu Trữ

### Sensor Readings Table
```sql
- device_id (TEXT) - ID cảm biến
- sensor_type (TEXT) - Loại cảm biến (tilt, vibration, etc.)
- timestamp (TEXT) - Thời gian đo
- data (JSON) - Dữ liệu cảm biến (longitude, latitude, giá trị, etc.)
- unit (TEXT) - Đơn vị (°, m/s², mm, °C, etc.)
- quality (INTEGER) - Chất lượng dữ liệu (0-100)
- latitude (REAL) - Vĩ độ (nếu có)
- longitude (REAL) - Kinh độ (nếu có)
- altitude (REAL) - Độ cao (nếu có)
```

### Devices Table
```sql
- device_id (TEXT) - ID cảm biến
- project_id (TEXT) - ID dự án
- site_id (TEXT) - ID địa điểm
- latitude (REAL) - Vĩ độ mới nhất
- longitude (REAL) - Kinh độ mới nhất
- altitude (REAL) - Độ cao mới nhất
- name (TEXT) - Tên cảm biến
- status (TEXT) - Trạng thái (active/inactive)
- last_update (TIMESTAMP) - Cân khỏe lần cuối
```

---

## 🛠️ Khắc Phục Sự Cố

| Vấn Đề | Nguyên Nhân | Giải Pháp |
|-------|----------|----------|
| Cảm biến không hiển thị trên bản đồ | Thiết bị không gửi GNSS data | Kiểm tra mqtt_publisher.py `publish_gnss()` |
| Bản đồ không tải | Không có kết nối internet | OpenStreetMap cần tải tiles online |
| Port 5000 đang sử dụng | Ứng dụng khác đang chạy | Thay port: `app.run(port=5001)` |
| Database lỗi | File bị khóa | Delete `database/sensors.db` rồi chạy lại |

---

## 📚 Công Nghệ Được Sử Dụng

| Layer | Công Nghệ |
|-------|-----------|
| **Bản đồ** | Leaflet.js 1.9.4 + OpenStreetMap |
| **Backend** | Python 3.10 + Flask 2.3.0 |
| **Database** | SQLite3 (built-in) |
| **Real-time** | MQTT (Mosquitto) |
| **API** | REST (JSON) |
| **Frontend** | HTML5 + CSS3 + Vanilla JavaScript |
| **Responsive** | CSS Grid + Flexbox |

---

## 🚀 Tiếp Theo (Có Thể Thêm)

- [ ] Real-time updates với WebSocket thay thế polling
- [ ] Biểu đồ dữ liệu theo thời gian (Chart.js)
- [ ] Thông báo cảnh báo (Email/SMS/Push)
- [ ] Xuất báo cáo PDF/Excel
- [ ] Bản đồ 3D (Cesium.js)
- [ ] Xác thực người dùng (JWT)
- [ ] Multiple projects/sites management
- [ ] Data visualization (Heatmap)
- [ ] Mobile native app

---

## ✨ Tóm Tắt

✅ **Hoàn thành**: 
- Backend API với database
- Frontend bản đồ OpenStreetMap
- Dashboard với bảng dữ liệu
- Database persist dữ liệu
- Responsive design
- REST API đầy đủ

✅ **Sẵn sàng sử dụng**: Chạy 4 terminal, mở http://localhost:5000

✅ **Dễ mở rộng**: Kiến trúc modular, dễ thêm tính năng

---

**Version**: 1.0  
**Date**: 2026-03-25  
**Status**: ✓ Ready for production
