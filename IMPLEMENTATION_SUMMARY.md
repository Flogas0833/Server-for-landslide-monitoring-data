# ✨ JWT Authentication & RBAC Implementation Summary

## 📅 Ngày Cập Nhật: May 3, 2026

---

## ✅ Các Thay Đổi Chính

### 1. Backend (Python/Flask)

#### 📁 File Mới:
- **`backend/jwt_auth_manager.py`** (🆕)
  - JWT token generation & validation
  - Role-Based Access Control (RBAC) manager
  - Decorators: `@require_auth()`, `@require_role()`, `@require_permission()`

#### 📝 File Cập Nhật:

- **`backend/database.py`**
  - ➕ Thêm `users` table (id, username, email, password_hash, role, site_ids, is_active, last_login)
  - ➕ Thêm `audit_logs` table (user_id, action, resource_type, resource_id, ip_address, timestamp)
  - ➕ Thêm methods: `create_user()`, `get_user_by_username()`, `get_user_by_id()`, `update_user_last_login()`, `add_audit_log()`, `get_audit_logs()`

- **`backend/web_server.py`**
  - ➕ Import JWT auth manager: `from jwt_auth_manager import JWTAuthManager, RBACManager, require_auth, require_role`
  - ➕ Thêm 5 authentication endpoints:
    - `POST /api/auth/register` - Đăng ký user mới
    - `POST /api/auth/login` - Đăng nhập (trả về access + refresh token)
    - `POST /api/auth/refresh` - Làm mới access token
    - `GET /api/auth/check` - Kiểm tra xác thực
    - `POST /api/auth/logout` - Đăng xuất
  - ➕ Thêm JWT protection vào các endpoints:
    - `GET /api/devices` - Yêu cầu authentication
    - `GET /api/sensor/<sensor_type>` - Yêu cầu authentication
    - `GET /api/statistics` - Yêu cầu authentication
    - `GET /api/sensor-history` - Yêu cầu authentication
    - `GET /api/export/csv` - Admin/Operator only
    - `GET /api/export/json` - Admin/Operator only
  - ✅ `GET /api/devices/public` - Vẫn public (không yêu cầu token)

### 2. Frontend (React/JavaScript)

#### 📝 File Cập Nhật:

- **`frontend/src/contexts/AuthContext.jsx`**
  - 🔄 Thay thế auto-login logic bằng JWT token-based auth
  - ➕ Thêm axios interceptors:
    - Request interceptor: Tự động thêm token vào headers
    - Response interceptor: Auto-refresh token khi hết hạn
  - ➕ Thêm methods: `register()`, `login()`, `logout()`
  - ✅ Token lưu trữ: `access_token` (localStorage), `refresh_token` (localStorage)
  - ✅ Automatic token refresh khi access token hết hạn

- **`frontend/src/pages/LoginPage.jsx`**
  - 🔄 Thay thế splash screen bằng login form hoàn chỉnh
  - ➕ Form fields: Username, Password (với toggle show/hide)
  - ➕ Xử lý error messages
  - ➕ Loading state
  - ➕ Demo credentials hint box
  - ✅ Responsive design

### 3. Configuration & Documentation

#### 📁 File Mới:

- **`seed_database.py`** (🆕)
  - Script khởi tạo database với 3 default users
  - Users: admin, operator, viewer

- **`docs/JWT_AUTH_GUIDE.md`** (🆕)
  - Hướng dẫn đầy đủ về JWT authentication & RBAC
  - Cài đặt & khởi động
  - Vai trò & quyền hạn
  - Thông tin đăng nhập mặc định
  - Quy trình đăng nhập
  - API endpoints reference
  - cURL examples
  - Troubleshooting guide
  - Best practices

#### 📝 File Cập Nhật:

- **`config/requirements_mqtt.txt`**
  - ➕ Thêm `PyJWT==2.8.0` cho JWT support
  - ➕ Thêm comments về bcrypt (cho production)

---

## 🔐 Vai Trò & Quyền Hạn (RBAC)

### 4 Roles:

| Role     | Quyền Hạn | Protected Endpoints |
|----------|-----------|-------------------|
| **Admin** | Tất cả | Tất cả authenticated endpoints |
| **Operator** | Xem + xuất dữ liệu | /api/sensor-history, /api/export/* |
| **Viewer** | Chỉ xem | /api/devices, /api/statistics |
| **Device** | Gửi dữ liệu MQTT | MQTT publish only |

### 3 Default Users:

```
username: admin      | password: admin123      | role: admin
username: operator   | password: operator123   | role: operator
username: viewer     | password: viewer123     | role: viewer
```

---

## 🔑 Token Flow

```
┌─────────────────────────────────────────────┐
│ Client (Browser)                             │
└──────────────────┬──────────────────────────┘
                   │
    1. POST /api/auth/login (username, password)
                   │
                   ▼
┌──────────────────────────────────────────────┐
│ Backend (Flask)                               │
│ ├─ Verify credentials                        │
│ ├─ Generate JWT tokens                       │
│ └─ Return tokens + user info                 │
└──────────────────┬──────────────────────────┘
                   │
    2. Response: access_token + refresh_token
                   │
                   ▼
┌──────────────────────────────────────────────┐
│ Client Storage                                │
│ ├─ access_token → localStorage               │
│ ├─ refresh_token → localStorage              │
│ └─ User info → state                         │
└──────────────────┬──────────────────────────┘
                   │
    3. Subsequent requests with Authorization header
                   │
                   ▼
┌──────────────────────────────────────────────┐
│ API Request (with Bearer token)              │
│ Authorization: Bearer <access_token>         │
└──────────────────────────────────────────────┘
```

---

## 📊 Database Schema Updates

### New Table: `users`
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'viewer',
    site_ids TEXT,
    is_active INTEGER DEFAULT 1,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### New Table: `audit_logs`
```sql
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT,
    action TEXT,
    resource_type TEXT,
    resource_id TEXT,
    old_values TEXT,
    new_values TEXT,
    ip_address TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);
```

---

## 🚀 Cách Sử Dụng

### 1. Cài Đặt & Khởi Động

```bash
cd /home/tlam/codes/Server-for-landslide-monitoring-data

# Activate venv
source .venv/bin/activate

# Cài đặt dependencies
pip install -r config/requirements_mqtt.txt

# Seed database
python3 seed_database.py

# Khởi động hệ thống
./start_system.sh
```

### 2. Đăng Nhập Frontend

1. Mở browser: `http://localhost:5173`
2. Nhập credentials (admin / admin123)
3. Nhấn "Đăng Nhập"
4. Sẽ redirect tới dashboard

### 3. Test API với cURL

```bash
# 1. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 2. Use token (copy từ response)
curl -X GET http://localhost:5000/api/devices \
  -H "Authorization: Bearer <access_token>"
```

---

## 🔒 Security Features

✅ **Implemented:**
- JWT token-based authentication
- Role-Based Access Control (RBAC)
- Automatic token refresh
- Audit logging tất cả hành động
- Protected API endpoints
- Password hashing (SHA256)
- Request validation

⚠️ **Not Yet Implemented (Production):**
- HTTPS/SSL
- Rate limiting
- Account lockout
- Bcrypt password hashing (thay vì SHA256)
- 2FA (Two-Factor Authentication)
- Email verification
- OAuth2/OpenID Connect

---

## 📝 File Structure Update

```
/backend
├── jwt_auth_manager.py       🆕 JWT & RBAC manager
├── database.py               ✏️ Users + audit tables
├── web_server.py             ✏️ Auth endpoints + JWT protection
├── auth_manager_session.py   ⚪ (deprecated, có thể xóa sau)
└── ... (khác)

/frontend/src
├── contexts/
│   └── AuthContext.jsx       ✏️ JWT-based auth
├── pages/
│   └── LoginPage.jsx         ✏️ Login form
└── ... (khác)

/docs
├── JWT_AUTH_GUIDE.md         🆕 Auth guide đầy đủ
└── ... (khác)

/config
└── requirements_mqtt.txt     ✏️ PyJWT dependency

/
├── seed_database.py          🆕 Initialize users
└── start_system.sh           ⚪ (sẵn có)
```

---

## 🧪 Testing Checklist

- [x] Python syntax validation (no syntax errors)
- [x] Database schema creation (users + audit_logs tables)
- [x] Seed database script (3 default users created)
- [x] Frontend login form (display + submit)
- [ ] API login endpoint (cần test live)
- [ ] Token generation & validation (cần test live)
- [ ] Protected endpoints (cần test live)
- [ ] Auto-refresh token (cần test live)
- [ ] Logout functionality (cần test live)

---

## 🎯 Next Steps

### Immediate:
1. Start the system: `./start_system.sh`
2. Test login with demo credentials
3. Test API requests with JWT token
4. Verify protected endpoints work

### Short Term:
1. Change default passwords
2. Set JWT_SECRET_KEY in environment
3. Test all roles (admin, operator, viewer)
4. Verify audit logs

### Medium Term:
1. Add rate limiting
2. Implement stronger password requirements
3. Add email verification
4. Setup HTTPS/SSL

### Long Term:
1. Implement 2FA
2. Add OAuth2 support
3. Implement account lockout
4. Use bcrypt instead of SHA256

---

## 📞 Support & Troubleshooting

Xem file `docs/JWT_AUTH_GUIDE.md` để:
- Detailed setup instructions
- API endpoints reference
- cURL examples
- Troubleshooting guide
- Best practices

---

**Status:** ✅ Implementation Complete  
**Version:** 1.0.0  
**Last Updated:** May 3, 2026
