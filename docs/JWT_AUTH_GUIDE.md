# 🔐 JWT Authentication & RBAC Implementation Guide

## 📋 Tổng Quan

Hệ thống giám sát sạt lở đất hiện tại sử dụng **JWT (JSON Web Token)** cho xác thực và **RBAC (Role-Based Access Control)** cho phân quyền.

### Các tính năng chính:
- ✅ JWT token-based authentication
- ✅ Access Token (15 phút) + Refresh Token (7 ngày)
- ✅ 4 vai trò: Admin, Operator, Viewer, Device
- ✅ Automatic token refresh
- ✅ Audit logging cho tất cả hành động
- ✅ Role-based API protection

---

## 🚀 Cài Đặt & Khởi Động

### 1. Cài đặt dependencies

```bash
cd /home/tlam/codes/Server-for-landslide-monitoring-data

# Activate virtual environment
source .venv/bin/activate

# Cài đặt requirements (bao gồm PyJWT)
pip install -r config/requirements_mqtt.txt
```

### 2. Seed database với users mặc định

```bash
python seed_database.py
```

Output sẽ tương tự như:
```
🌱 Seeding database with default users...

✅ Created user: admin
   - Email: admin@landslide.local
   - Role: admin
   - Password: admin123

✅ Created user: operator
   - Email: operator@landslide.local
   - Role: operator
   - Password: operator123

✅ Created user: viewer
   - Email: viewer@landslide.local
   - Role: viewer
   - Password: viewer123

✨ Database seeding complete!
```

### 3. Khởi động hệ thống

```bash
./start_system.sh
```

---

## 👥 Vai Trò & Quyền Hạn (Roles & Permissions)

### Admin
- ✅ Xem tất cả dữ liệu sensor
- ✅ Quản lý người dùng
- ✅ Cấu hình thiết bị
- ✅ Xuất báo cáo (CSV/JSON)
- ✅ Xem audit logs
- ✅ Quản lý cảnh báo

### Operator (Nhân viên vận hành)
- ✅ Xem dữ liệu sensor real-time
- ✅ Nhận cảnh báo
- ✅ Tạo/chỉnh sửa báo cáo
- ✅ Xuất dữ liệu
- ❌ Không thể xóa dữ liệu
- ❌ Không thể quản lý người dùng

### Viewer (Chỉ xem)
- ✅ Xem dashboard/map
- ✅ Xem dữ liệu công khai
- ✅ Xem cảnh báo
- ❌ Không thể xuất dữ liệu
- ❌ Không thể tạo báo cáo

### Device (Thiết bị IoT)
- ✅ Gửi dữ liệu sensor qua MQTT
- ✅ Nhận lệnh điều khiển
- ❌ Không thể đọc dữ liệu của user khác

---

## 🔑 Thông Tin Đăng Nhập Mặc Định

| Role     | Username | Password    | Email                      |
|----------|----------|-------------|----------------------------|
| Admin    | admin    | admin123    | admin@landslide.local      |
| Operator | operator | operator123 | operator@landslide.local   |
| Viewer   | viewer   | viewer123   | viewer@landslide.local     |

**⚠️ ĐỀ XUẤT:** Đổi mật khẩu mặc định ngay sau khi cài đặt!

---

## 📱 Quy Trình Đăng Nhập

### Frontend Flow:
```
1. User truy cập login page
   ↓
2. Nhập username + password
   ↓
3. Frontend gửi POST /api/auth/login
   ↓
4. Backend xác minh credentials
   ↓
5. Trả về access token + refresh token
   ↓
6. Frontend lưu tokens vào localStorage
   ↓
7. Tự động redirect đến dashboard
```

### Token Management:
```
Access Token (15 phút)
├─ Sử dụng cho tất cả API requests
├─ Lưu trữ: Memory (nguy hiểm hơn) hoặc sessionStorage
└─ Nếu hết hạn: Dùng refresh token để lấy token mới

Refresh Token (7 ngày)
├─ Sử dụng để lấy access token mới
├─ Lưu trữ: HttpOnly Secure Cookie
└─ Nếu hết hạn: Yêu cầu user đăng nhập lại
```

---

## 🔌 API Endpoints Authentication

### Public Endpoints (Không cần token):
```
GET  /api/devices/public       # Xem thiết bị công khai
POST /api/auth/login           # Đăng nhập
POST /api/auth/register        # Đăng ký
GET  /api/auth/check           # Kiểm tra xác thực
POST /api/auth/refresh         # Làm mới token
```

### Protected Endpoints (Cần authentication):

#### Admin Only:
```
GET  /api/audit-logs           # Xem audit logs
POST /api/users/create         # Tạo user mới
POST /api/users/{id}/role      # Thay đổi role
```

#### Admin + Operator:
```
GET  /api/sensor-history       # Xem lịch sử sensor
GET  /api/export/csv           # Xuất CSV
GET  /api/export/json          # Xuất JSON
```

#### Tất cả authenticated users:
```
GET  /api/devices              # Xem tất cả thiết bị
GET  /api/device/{id}          # Chi tiết thiết bị
GET  /api/statistics           # Thống kê
POST /api/auth/logout          # Đăng xuất
```

---

## 💻 Sử Dụng API với JWT Token

### 1. Đăng Nhập & Lấy Token:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@landslide.local",
    "role": "admin"
  }
}
```

### 2. Sử dụng Token cho API Request:

```bash
curl -X GET http://localhost:5000/api/devices \
  -H "Authorization: Bearer eyJhbGc..."
```

### 3. Làm mới Token khi hết hạn:

```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJhbGc..."
  }'
```

---

## 🔧 Cấu Hình Environment Variables

Tạo file `.env` trong project root:

```bash
# JWT Configuration
JWT_SECRET_KEY=your-super-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# MQTT Configuration
MQTT_BROKER=localhost
MQTT_PORT=1883
MQTT_USERNAME=user
MQTT_PASSWORD=password

# Flask Configuration
FLASK_ENV=production
FLASK_DEBUG=0
```

**Quan trọng:** 
- Đổi `JWT_SECRET_KEY` trong production
- Sử dụng strong secret (tối thiểu 32 ký tự ngẫu nhiên)

```bash
# Tạo JWT secret mạnh:
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## 📊 Audit Logging

Tất cả các hành động của người dùng được ghi lại:

```sql
SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 10;
```

Các hành động được ghi:
- `login_success` - Đăng nhập thành công
- `login_failed` - Đăng nhập thất bại
- `logout` - Đăng xuất
- `user_registered` - Người dùng mới đăng ký
- `data_exported` - Xuất dữ liệu
- `device_created` - Tạo thiết bị mới
- Và các hành động khác...

---

## 🛡️ Best Practices

### ✅ Làm:
1. **Đổi mật khẩu mặc định** ngay lập tức
2. **Sử dụng HTTPS** trong production
3. **Rotate JWT_SECRET_KEY** định kỳ
4. **Kiểm tra audit logs** thường xuyên
5. **Sử dụng strong passwords** (tối thiểu 8 ký tự, mixed case)
6. **Disable auto-login** trong production
7. **Implement rate limiting** trên /login endpoint
8. **Monitor failed login attempts**

### ❌ Không làm:
1. ❌ Không lưu JWT token trong localStorage không được mã hóa
2. ❌ Không commit `.env` file vào git
3. ❌ Không sử dụng default credentials trong production
4. ❌ Không bypass authentication checks
5. ❌ Không log sensitive data (passwords, tokens)
6. ❌ Không gửi tokens qua URL query parameters

---

## 🐛 Troubleshooting

### Problem: "Missing authorization token"
**Giải pháp:** Kiểm tra xem token được gửi đúng format:
```
Authorization: Bearer <token>
```

### Problem: "Token has expired"
**Giải pháp:** Sử dụng refresh token để lấy access token mới:
```bash
POST /api/auth/refresh
Body: { "refresh_token": "..." }
```

### Problem: "Access denied. Required roles: admin, operator"
**Giải pháp:** User hiện tại không có quyền truy cập. Đảm bảo user có role phù hợp.

### Problem: Database khóa hoặc trống
**Giải pháp:** Chạy seed database lại:
```bash
python seed_database.py
```

---

## 📝 Thay Đổi User Role

### Via Python script:

```python
from database import SensorDatabase

db = SensorDatabase()

# Nếu cần chỉnh sửa database trực tiếp
import sqlite3
conn = sqlite3.connect("database/sensors.db")
cursor = conn.cursor()

# Thay đổi role của user
cursor.execute("UPDATE users SET role = 'operator' WHERE username = 'viewer'")
conn.commit()
conn.close()
```

---

## 🔄 Cập Nhật Code

Khi cần thêm endpoint mới, sử dụng decorators:

```python
from jwt_auth_manager import require_auth, require_role

# Yêu cầu authentication (bất kỳ role):
@app.route('/api/my-endpoint', methods=['GET'])
@require_auth()
def my_endpoint():
    return {'user': g.user}

# Chỉ cho admin:
@app.route('/api/admin-only', methods=['GET'])
@require_role('admin')
def admin_endpoint():
    return {'admin': True}

# Admin + Operator:
@app.route('/api/protected', methods=['GET'])
@require_auth(allowed_roles=['admin', 'operator'])
def protected_endpoint():
    return {'data': 'sensitive'}
```

---

## 📚 Tài Liệu Tham Khảo

- [PyJWT Documentation](https://pyjwt.readthedocs.io/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [JWT.io - JWT Decoder](https://jwt.io/)
- [OWASP - Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

## ✨ Các Bước Tiếp Theo

1. **Implement password hashing** với bcrypt (an toàn hơn SHA256)
2. **Add rate limiting** để chống brute force
3. **Implement 2FA** (Two-Factor Authentication)
4. **Add email verification** cho đăng ký
5. **Setup HTTPS** với SSL certificates
6. **Implement account lockout** sau N failed attempts
7. **Add OAuth2/OpenID Connect** tùy chọn

---

**Được cập nhật:** May 3, 2026  
**Phiên bản:** 1.0.0
