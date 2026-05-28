# 🚀 Hướng Dẫn Triển Khai (Deployment Guide)
## Hệ Thống Giám Sát Sạt Lở lên Web

Tài liệu này hướng dẫn các bước triển khai hệ thống lên môi trường production trên web.

---

## 📋 Mục Lục
1. [Kiến Trúc Deployment](#kiến-trúc-deployment)
2. [Lựa Chọn Nền Tảng](#lựa-chọn-nền-tảng)
3. [Chuẩn Bị Trước Deployment](#chuẩn-bị-trước-deployment)
4. [Triển Khai Chi Tiết](#triển-khai-chi-tiết)
5. [Cấu Hình Domain & SSL](#cấu-hình-domain--ssl)
6. [Giám Sát & Bảo Trì](#giám-sát--bảo-trì)

---

## 🏗️ Kiến Trúc Deployment

```
┌────────────────────────────────────────────────────────────┐
│                  NGƯỜI DÙNG (Internet)                      │
├────────────────────────────────────────────────────────────┤
│ Domain: yourdomain.com (HTTPS)                             │
│         ↓                                                   │
│ Load Balancer / Reverse Proxy (Nginx)                      │
└─────┬──────────────────────────────────────────────┬───────┘
      │                                              │
      ▼                                              ▼
┌─────────────────────────┐              ┌──────────────────────┐
│  Frontend Server        │              │  Backend Server      │
│  (React/Vite Build)     │              │  (Flask + Gunicorn)  │
│  Port: 3000             │              │  Port: 5000          │
│  - HTML/CSS/JS          │              │  - REST API          │
│  - Static Assets        │              │  - JWT Auth          │
│  - SPA Routing          │              │  - Database Queries  │
└─────────────────────────┘              └──────────┬───────────┘
                                                    │
                                         ┌──────────┴──────────┐
                                         │                     │
                                    ┌────▼────┐          ┌─────▼────┐
                                    │ Database │          │MQTT      │
                                    │(SQLite) │          │Broker    │
                                    │sensors.db           │Port:1883 │
                                    └─────────┘          └──────────┘
                                                              │
                                         ┌────────────────────┘
                                         │
                                    ┌────▼────────────┐
                                    │ Sensor Devices  │
                                    │ (MQTT Clients)  │
                                    └─────────────────┘
```

---

## 🌐 Lựa Chọn Nền Tảng

### **Đề Nghị Cho Các Quy Mô Khác Nhau:**

#### 1️⃣ **Nhỏ (Budget thấp, Học tập)**
- **Railway.app** ⭐ (Dễ nhất)
  - Free tier ban đầu
  - Deploy từ Git tự động
  - Hỗ trợ Python + Node.js
  - Chi phí: ~$5-20/tháng

- **Replit Deploy**
  - Miễn phí hosting cơ bản
  - Tích hợp Git
  - Chi phí: ~$7/tháng trở lên

#### 2️⃣ **Vừa (Doanh nghiệp nhỏ)**
- **DigitalOcean App Platform** ⭐
  - Dễ deploy
  - $12/tháng (1 container)
  - Database PostgreSQL bổ sung
  - Đáng tin cậy

- **Heroku** (tính phí cao hơn)
  - Eco Dynos: $5/tháng
  - Nhưng sắp ngừng free tier (2024)

- **AWS Lightsail**
  - VPS giá rẻ: $3.5-5/tháng
  - Full control Linux
  - Phù hợp nếu muốn custom

#### 3️⃣ **Lớn (Enterprise)**
- **AWS EC2 + RDS**
- **Google Cloud Platform**
- **Microsoft Azure**
- **VPS tự quản lý** (Linode, Vultr, Hetzner)

---

## ✅ Chuẩn Bị Trước Deployment

### **1. Kiểm Tra Các File Cấu Hình**

```bash
# Các file quan trọng cần kiểm tra:
✓ frontend/vite.config.js       # Base URL cho production
✓ backend/config_manager.py      # Đường dẫn database
✓ config/requirements_mqtt.txt   # Python dependencies
✓ backend/*.py                   # Kiểm tra hardcode paths
✓ frontend/.env                  # API endpoint
```

### **2. Chuẩn Bị Environment Variables**

**Tạo file `.env` cho backend:**
```bash
# backend/.env
FLASK_ENV=production
FLASK_DEBUG=False
DATABASE_URL=sqlite:///sensors.db
JWT_SECRET_KEY=your-very-secure-key-here-min-32-chars
MQTT_BROKER=mqtt_broker_hostname
MQTT_PORT=1883
MQTT_USERNAME=mqtt_user
MQTT_PASSWORD=mqtt_password
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
API_HOST=0.0.0.0
API_PORT=5000
```

**Tạo file `.env` cho frontend:**
```bash
# frontend/.env.production
VITE_API_URL=https://api.yourdomain.com
VITE_APP_NAME=Landslide Monitoring System
```

### **3. Build Production**

```bash
# Build React frontend
cd frontend
npm install
npm run build
# ✓ Tạo folder: frontend/dist/

# Kiểm tra backend dependencies
cd ../backend
pip install -r ../config/requirements_mqtt.txt
```

### **4. Kiểm Tra Database**

```bash
# Backup database cũ
cp database/sensors.db database/sensors.db.backup_$(date +%s)

# Kiểm tra schema
python3 backend/database.py
```

### **5. Kiểm Tra Security**

```bash
✓ Thay đổi JWT_SECRET_KEY (không dùng default)
✓ Bật HTTPS/SSL
✓ Cấu hình CORS chính xác
✓ Kiểm tra API authentication endpoints
✓ Bảo mật MQTT với username/password
✓ Kiểm tra file permissions (database, config)
```

---

## 🔧 Triển Khai Chi Tiết

### **PHƯƠNG ÁN 1: DigitalOcean App Platform** (⭐ Đề Nghị)

#### **Bước 1: Chuẩn Bị Repo GitHub**

```bash
# Tạo .gitignore (nếu chưa có)
cat > .gitignore << EOF
.venv/
__pycache__/
*.pyc
.env
.env.production
*.db
node_modules/
frontend/dist/
.DS_Store
EOF

# Commit và push lên GitHub
git add .
git commit -m "Prepare for deployment"
git push origin main
```

#### **Bước 2: Tạo app.yaml cho deployment**

```yaml
# app.yaml - DigitalOcean App Platform config
name: landslide-monitoring
services:
  - name: backend
    github:
      repo: your-username/Server-for-landslide-monitoring-data
      branch: main
    source_dir: /
    build_command: |
      pip install -r config/requirements_mqtt.txt
      cd frontend && npm install && npm run build
    run_command: |
      cd backend
      gunicorn -w 4 -b 0.0.0.0:5000 web_server:app
    envs:
      - key: FLASK_ENV
        value: production
      - key: DATABASE_URL
        value: sqlite:///sensors.db
      - key: JWT_SECRET_KEY
        scope: RUN_AND_BUILD_TIME
        value: ${JWT_SECRET_KEY}
      - key: MQTT_BROKER
        value: ${MQTT_BROKER}
      - key: ALLOWED_ORIGINS
        value: https://${APP_DOMAIN}
    http_port: 5000
    health_check:
      http_path: /api/health
    http_routes:
      - path: /
        component_name: backend

static_sites:
  - name: frontend
    github:
      repo: your-username/Server-for-landslide-monitoring-data
      branch: main
    source_dir: frontend/dist
    routes:
      - path: /
        component_name: frontend

databases:
  - name: sqlite-db
    engine: SQLITE
    production: true

ingress:
  rules:
    - match:
        domain: yourdomain.com
      component:
        name: backend
      preserve_path_prefix: true
    - match:
        domain: www.yourdomain.com
      component:
        name: backend
      preserve_path_prefix: true
```

#### **Bước 3: Deploy qua DigitalOcean Console**

1. Đăng nhập vào [DigitalOcean](https://www.digitalocean.com/)
2. **Create → App Platform**
3. Chọn repo GitHub của bạn
4. Chọn branch: `main`
5. Klik **Analyze** (DO sẽ gợi ý cấu hình)
6. Thêm Environment Variables:
   - `JWT_SECRET_KEY`: Tạo key bảo mật
   - `MQTT_BROKER`: IP/hostname broker MQTT
   - Các biến khác từ `.env`
7. Chọn plan ($12/tháng trở lên)
8. Klik **Create Resources** → Deploy!

---

### **PHƯƠNG ÁN 2: AWS Lightsail** (VPS Giá Rẻ)

#### **Bước 1: Tạo Lightsail Instance**

```bash
# 1. Vào AWS Lightsail Console
# 2. Create Instance → Linux/Unix → Ubuntu 22.04 LTS
# 3. Chọn $5/tháng plan
# 4. Nhập Instance name: "landslide-monitoring"
# 5. Create!

# SSH vào instance
ssh -i your-key.pem ubuntu@your-lightsail-ip
```

#### **Bước 2: Cài Đặt Dependencies**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Cài Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Cài Python & pip
sudo apt install -y python3 python3-pip python3-venv

# Cài Nginx
sudo apt install -y nginx

# Cài Mosquitto MQTT
sudo apt install -y mosquitto mosquitto-clients

# Cài Supervisor (quản lý processes)
sudo apt install -y supervisor
```

#### **Bước 3: Clone Repository**

```bash
cd /home/ubuntu
git clone https://github.com/your-username/Server-for-landslide-monitoring-data.git
cd Server-for-landslide-monitoring-data

# Tạo virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Cài dependencies
pip install -r config/requirements_mqtt.txt
```

#### **Bước 4: Build Frontend**

```bash
cd frontend
npm install
npm run build
cd ..
```

#### **Bước 5: Cấu Hình Nginx (Reverse Proxy)**

```bash
# Tạo Nginx config
sudo nano /etc/nginx/sites-available/landslide

# Thêm nội dung:
upstream flask_app {
    server 127.0.0.1:5000;
}

server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS (nếu có SSL)
    # return 301 https://$server_name$request_uri;

    # Frontend static files
    location / {
        root /home/ubuntu/Server-for-landslide-monitoring-data/frontend/dist;
        try_files $uri $uri/ /index.html;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # API endpoints
    location /api/ {
        proxy_pass http://flask_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
    }

    # Public files
    location /public/ {
        root /home/ubuntu/Server-for-landslide-monitoring-data/frontend;
    }
}
```

```bash
# Enable Nginx config
sudo ln -s /etc/nginx/sites-available/landslide /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### **Bước 6: Cấu Hình Supervisor cho Flask**

```bash
# Tạo supervisor config
sudo nano /etc/supervisor/conf.d/flask.conf

# Thêm nội dung:
[program:flask_app]
directory=/home/ubuntu/Server-for-landslide-monitoring-data
command=/home/ubuntu/Server-for-landslide-monitoring-data/.venv/bin/gunicorn \
    -w 4 \
    -b 127.0.0.1:5000 \
    backend.web_server:app
user=ubuntu
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/flask_app.log

[program:mqtt_subscriber]
directory=/home/ubuntu/Server-for-landslide-monitoring-data
command=/home/ubuntu/Server-for-landslide-monitoring-data/.venv/bin/python \
    backend/mqtt_subscriber.py
user=ubuntu
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/mqtt_subscriber.log
```

```bash
# Cập nhật supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start flask_app mqtt_subscriber
```

#### **Bước 7: Cấu Hình Mosquitto**

```bash
# Tạo password file
sudo mosquitto_passwd -c /etc/mosquitto/passwd mqtt_user

# Cấu hình ACL
sudo nano /etc/mosquitto/conf.d/default.conf

# Thêm:
password_file /etc/mosquitto/passwd
allow_anonymous false
listener 1883 0.0.0.0
```

```bash
sudo systemctl restart mosquitto
```

---

### **PHƯƠNG ÁN 3: Heroku** (Deprecated nhưng vẫn hoạt động)

```bash
# 1. Cài Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# 2. Đăng nhập
heroku login

# 3. Tạo app
heroku create your-app-name

# 4. Thêm environment variables
heroku config:set FLASK_ENV=production
heroku config:set JWT_SECRET_KEY=your-secret-key
heroku config:set MQTT_BROKER=your-mqtt-broker

# 5. Deploy
git push heroku main

# 6. Kiểm tra logs
heroku logs --tail
```

---

## 🔐 Cấu Hình Domain & SSL

### **Bước 1: Trỏ Domain**

**A. Nếu dùng DigitalOcean:**
1. Vào Networking → Domains
2. Thêm domain
3. Chỉnh DNS records:
   ```
   A Record: @     → Your-App-IP
   CNAME:    www   → @
   ```

**B. Nếu dùng Lightsail:**
1. Vào Route 53 (hoặc nhà cung cấp DNS)
2. Tạo A Record:
   ```
   Name: yourdomain.com
   Type: A
   Value: Your-Lightsail-IP
   ```

### **Bước 2: Cấu Hình SSL (HTTPS)**

**A. DigitalOcean (Tự động):**
- DO tự động cấu hình Let's Encrypt
- Không cần làm gì thêm

**B. Lightsail (Let's Encrypt + Certbot):**

```bash
# Cài Certbot
sudo apt install -y certbot python3-certbot-nginx

# Tạo certificate
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com

# Cập nhật Nginx config (tự động)
sudo certbot install --nginx

# Auto-renew
sudo systemctl enable certbot.timer
```

---

## 📊 Giám Sát & Bảo Trì

### **1. Kiểm Tra Health của ứng dụng**

```bash
# Thêm endpoint health check trong backend/web_server.py
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': now_utc_iso(),
        'database': 'connected',
        'mqtt': 'connected' if check_mqtt() else 'disconnected'
    }), 200
```

### **2. Giám Sát Logs**

```bash
# DigitalOcean App Platform
# → App Console → Runtime Logs

# AWS Lightsail
tail -f /var/log/flask_app.log
tail -f /var/log/mqtt_subscriber.log
sudo supervisorctl status

# Heroku
heroku logs --tail
```

### **3. Backup Database**

```bash
# Setup cron job tự động backup
crontab -e

# Thêm:
0 2 * * * cp /path/to/sensors.db /backups/sensors.db.$(date +\%Y\%m\%d)
0 3 * * * find /backups -name "*.db" -mtime +30 -delete
```

### **4. Monitoring Services**

```bash
# DigitalOcean Monitoring
# → Insights → Metrics

# Setup CloudWatch alerts (AWS)
# → CloudWatch → Alarms

# Uptime Monitoring (UptimeRobot, Pingdom, etc)
# Add endpoint: https://yourdomain.com/api/health
```

### **5. Update & Maintenance**

```bash
# Pull latest code
git pull origin main

# Update dependencies
pip install -r config/requirements_mqtt.txt --upgrade
cd frontend && npm update

# Rebuild frontend
npm run build

# Restart services
sudo supervisorctl restart flask_app
# hoặc
heroku restart
# hoặc
digitalocean-cli redeploy
```

---

## 🆘 Troubleshooting

### **500 Internal Server Error**
```bash
# Kiểm tra logs
tail -f /var/log/flask_app.log

# Kiểm tra database
sqlite3 database/sensors.db ".schema"

# Kiểm tra environment variables
heroku config
# hoặc
env | grep FLASK
```

### **MQTT Connection Error**
```bash
# Kiểm tra broker chạy chưa
ps aux | grep mosquitto

# Test MQTT connection
mosquitto_sub -h broker-hostname -u user -P password -t "sensors/#" -v

# Kiểm tra firewall
sudo ufw status
sudo ufw allow 1883/tcp
```

### **Frontend không load CSS/JS**
```bash
# Kiểm tra build
ls -la frontend/dist/

# Kiểm tra Nginx config
sudo nginx -t

# Kiểm tra browser cache
# Ctrl + Shift + Delete → Clear all
```

### **Database Locked Error**
```bash
# Kiểm tra processes
lsof database/sensors.db

# Restart services
sudo supervisorctl restart all
```

---

## 📈 Performance Tuning

### **Backend Optimization**

```python
# Tăng worker processes trong gunicorn
gunicorn -w 8 -b 0.0.0.0:5000 --threads 2 backend.web_server:app

# Thêm caching
from flask_caching import Cache
cache = Cache(app, config={'CACHE_TYPE': 'simple'})

@app.route('/api/devices')
@cache.cached(timeout=300)
def get_devices():
    ...
```

### **Frontend Optimization**

```javascript
// frontend/vite.config.js
export default {
  build: {
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'leaflet': ['leaflet', 'react-leaflet']
        }
      }
    }
  }
}
```

### **Database Optimization**

```sql
-- Tạo indexes
CREATE INDEX idx_device_id ON sensor_readings(device_id);
CREATE INDEX idx_timestamp ON sensor_readings(timestamp);
CREATE INDEX idx_sensor_type ON sensor_readings(sensor_type);

-- Cleanup old data (hàng tháng)
DELETE FROM sensor_readings 
WHERE timestamp < datetime('now', '-90 days');
```

---

## 🎓 Bản Checklist Deployment

```
PRE-DEPLOYMENT:
☐ Cấu hình environment variables
☐ Build frontend (npm run build)
☐ Test backend locally (python backend/web_server.py)
☐ Backup database cũ
☐ Review security settings
☐ Cấu hình domain
☐ Commit & push tất cả changes

DEPLOYMENT:
☐ Deploy ứng dụng
☐ Kiểm tra health check (/api/health)
☐ Test API endpoints
☐ Test frontend (login, dashboard, map)
☐ Kiểm tra MQTT connection
☐ Kiểm tra database operations

POST-DEPLOYMENT:
☐ Setup SSL/HTTPS
☐ Setup monitoring & alerts
☐ Setup automatic backups
☐ Setup auto-update (hoặc manual schedule)
☐ Document access credentials
☐ Train team on monitoring
```

---

## 📞 Support & Resources

- **DigitalOcean Docs**: https://docs.digitalocean.com/
- **Flask Deployment**: https://flask.palletsprojects.com/deployment/
- **React Build**: https://vitejs.dev/guide/build.html
- **Nginx Docs**: https://nginx.org/en/docs/
- **Let's Encrypt**: https://letsencrypt.org/
- **Mosquitto Docs**: https://mosquitto.org/documentation/

---

**Lần cập nhật cuối**: May 28, 2026
**Phiên bản**: 1.0
