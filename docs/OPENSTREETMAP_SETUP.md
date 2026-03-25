# 🗺️ OpenStreetMap Sensor Visualization Setup

Hướng dẫn cài đặt và sử dụng bản đồ tương tác để hiển thị vị trí các cảm biến sạt lở.

## 📋 Yêu Cầu

- Python 3.7+
- MQTT Broker (Mosquitto)
- SQLite (tích hợp sẵn trong Python)

## 🚀 Cài Đặt

### 1. Cập Nhật Dependencies

```bash
# Cài đặt các gói Python cần thiết
pip install -r config/requirements_mqtt.txt
```

Các gói mới được thêm:
- `flask==2.3.0` - Web server framework
- `flask-cors==4.0.0` - Hỗ trợ CORS cho API

### 2. Cơ Sở Dữ Liệu

Cơ sở dữ liệu SQLite sẽ tự động được tạo khi chạy lần đầu tiên.

**Vị trí**: `database/sensors.db`

**Bảng dữ liệu**:
- `sensor_readings` - Lưu trữ tất cả các đo lường từ cảm biến
- `devices` - Lưu trữ thông tin thiết bị với vị trí gần nhất

## ▶️ Chạy Hệ Thống

### Terminal 1: MQTT Broker
```bash
# Khởi động Mosquitto (trên Linux)
sudo systemctl start mosquitto

# Hoặc chạy trực tiếp (nếu chưa cài dịch vụ)
mosquitto -c config/mosquitto.conf
```

### Terminal 2: Server MQTT (Nhận Dữ Liệu)
```bash
cd backend
python3 mqtt_subscriber.py
```

Kết quả:
```
✓ Connected to MQTT broker: localhost:1883
  → Subscribed to: landslide/project/PRJ001/+/device/+/data/#
  → Subscribed to: landslide/project/PRJ001/+/device/+/status
...
```

### Terminal 3: Thiết Bị Mô Phỏng (Gửi Dữ Liệu)
```bash
cd backend
python3 mqtt_publisher.py
```

### Terminal 4: Web Server (Bản Đồ & Dashboard)
```bash
cd backend
python3 web_server.py
```

Kết quả:
```
🚀 Starting Web Server on http://localhost:5000
📍 Interactive Map: http://localhost:5000/
📊 Dashboard: http://localhost:5000/dashboard
```

## 🌐 Truy Cập Web Interface

### Bản Đồ Tương Tác (Map)
```
👉 http://localhost:5000/
```

**Tính năng**:
- 🗺️ Hiển thị bản đồ OpenStreetMap toàn thế giới
- 🛰️ Các cảm biến hiển thị dưới dạng marker
- 📋 Danh sách cảm biến trên thanh bên
- 🔍 Tìm kiếm cảm biến theo tên
- 📊 Xem dữ liệu cảm biến khi click marker
- 🎨 Giao diện đáp ứng (Mobile-friendly)

### Bảng Điều Khiển (Dashboard)
```
👉 http://localhost:5000/dashboard
```

**Tính năng**:
- 📈 Thống kê tổng quát (số cảm biến, tình trạng)
- 📊 Bảng dữ liệu chi tiết cho từng loại cảm biến
- 🔄 Cập nhật tự động mỗi 5 giây
- 📱 Giao diện phản hồi trên di động

## 🔌 API Endpoints

### Lấy danh sách tất cả cảm biến
```
GET /api/devices
```

**Response**:
```json
[
    {
        "device_id": "DEVICE001",
        "project_id": "PRJ001",
        "site_id": "SITE001",
        "latitude": 21.028531,
        "longitude": 105.854236,
        "altitude": 125.45,
        "name": "Sensor 1",
        "status": "active",
        "last_update": "2026-03-25T10:30:00"
    }
]
```

### Lấy chi tiết cảm biến
```
GET /api/device/{device_id}
```

### Lấy dữ liệu theo loại cảm biến
```
GET /api/sensor/{sensor_type}?limit=10
```

Các loại cảm biến: `tilt`, `vibration`, `displacement`, `rainfall`, `temperature`

### Lấy thống kê hệ thống
```
GET /api/statistics
```

### Đăng ký cảm biến mới
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

## 📊 Cấu Trúc Cơ Sở Dữ Liệu

### sensor_readings
```sql
- id (INTEGER, Primary Key)
- device_id (TEXT)
- sensor_type (TEXT)
- timestamp (TEXT)
- data (JSON)
- unit (TEXT)
- quality (INTEGER)
- latitude (REAL)
- longitude (REAL)
- altitude (REAL)
- created_at (TIMESTAMP)
```

### devices
```sql
- device_id (TEXT, Primary Key)
- project_id (TEXT)
- site_id (TEXT)
- latitude (REAL)
- longitude (REAL)
- altitude (REAL)
- name (TEXT)
- description (TEXT)
- last_update (TIMESTAMP)
- status (TEXT)
```

## 📂 Cấu Trúc Thư Mục Mới

```
backend/
├── database.py          # Module cơ sở dữ liệu
├── web_server.py        # Flask web server
├── mqtt_subscriber.py   # Đã cập nhật để lưu vào DB
└── mqtt_publisher.py

frontend/
├── index.html           # Bản đồ tương tác
├── dashboard.html       # Bảng điều khiển
└── static/
    ├── css/
    │   ├── style.css        # CSS cho bản đồ
    │   └── dashboard.css    # CSS cho dashboard
    └── js/
        ├── map.js           # JavaScript cho bản đồ
        └── dashboard.js     # JavaScript cho dashboard

database/
└── sensors.db           # Tệp cơ sở dữ liệu SQLite (tự tạo)
```

## 🛠️ Khắc Phục Sự Cố

### Lỗi: "Module not found: database"
**Giải pháp**: Đảm bảo bạn đang chạy từ thư mục `backend/`
```bash
cd backend
python3 web_server.py
```

### Lỗi: "Address already in use" (Cổng 5000)
**Giải pháp**: Thay đổi cổng trong `web_server.py`
```python
app.run(debug=True, host='0.0.0.0', port=5001)  # Sử dụng cổng 5001
```

### Không thấy cảm biến trên bản đồ
**Giải pháp**: 
1. Đảm bảo thiết bị gửi dữ liệu GNSS (có latitude/longitude)
2. Kiểm tra log của `mqtt_subscriber.py` để xem dữ liệu có được nhận không
3. Kiểm tra database: `sqlite3 database/sensors.db "SELECT * FROM devices;"`

### Bản đồ không hiển thị
**Giải pháp**: Kiểm tra kết nối internet (bản đồ OpenStreetMap cần tải tiles từ internet)

## 🔧 Tùy Chỉnh

### Thay đổi vị trí trung tâm bản đồ
Trong `frontend/static/js/map.js`:
```javascript
map = L.map('map').setView([21.0285, 105.8542], 10);  // Tọa độ Hà Nội, zoom level 10
```

### Thay đổi khoảng thời gian làm mới
Trong `frontend/static/js/map.js`:
```javascript
setInterval(loadDevices, 10000);  // Làm mới mỗi 10 giây
```

### Thêm loại cảm biến mới
1. Cập nhật `DataValidator.VALID_RANGES` trong `mqtt_subscriber.py`
2. Thêm xử lý hiển thị trong `frontend/static/js/map.js`

## 📝 Ghi Chú

- Bản đồ sử dụng **Leaflet.js** - thư viện nhẹ để làm việc với OpenStreetMap
- Dữ liệu được lưu trữ **cục bộ** trong SQLite, không cần máy chủ cơ sở dữ liệu bên ngoài
- API hoàn toàn **RESTful** và có thể tích hợp với các ứng dụng khác
- Tất cả dữ liệu **cập nhật tự động** từ MQTT broker

## 🚀 Tiếp Theo

### Tính năng có thể thêm:
- 📈 Biểu đồ dữ liệu theo thời gian
- 🔔 Thông báo cảnh báo thời gian thực (WebSocket)
- 💾 Xuất dữ liệu CSV/Excel
- 🏔️ Bản đồ 3D với độ cao
- 🔐 Xác thực người dùng
- 📊 Thống kê nâng cao và phân tích xu hướng

---

**Phiên bản**: 1.0  
**Ngày cập nhật**: 2026-03-25
