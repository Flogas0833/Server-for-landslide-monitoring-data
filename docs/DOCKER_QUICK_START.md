# 🚀 Quick Start: Deploy with Docker Locally

Hướng dẫn nhanh nhất để test deployment trên máy local của bạn.

---

## ⚙️ Yêu Cầu

1. **Docker Desktop** - Tải từ https://www.docker.com/products/docker-desktop
2. **Git** - Để clone/commit
3. **Ports Trống**: 5000, 5173, 1883, 80, 443

---

## 🎯 Các Bước (5 phút)

### Bước 1: Chuẩn Bị Thư Mục Dự Án

```bash
cd /path/to/Server-for-landslide-monitoring-data

# Tạo .env từ template
cp .env.example .env

# Chỉnh sửa .env (tùy chọn)
nano .env
# Hoặc dùng editor yêu thích của bạn
```

### Bước 2: Build & Start với Docker Compose

```bash
# Build images (lần đầu có thể mất 5-10 phút)
docker-compose build

# Start tất cả services
docker-compose up -d

# Kiểm tra status
docker-compose ps
```

**Output mong muốn:**
```
NAME                  STATUS
landslide-mosquitto   Up 2 minutes (healthy)
landslide-backend     Up 2 minutes (healthy)
landslide-frontend    Up 2 minutes
landslide-nginx       Up 2 minutes
```

### Bước 3: Test Services

```bash
# Test Backend API
curl http://localhost:5000/api/health

# Output:
# {"status":"healthy","timestamp":"2026-05-28T...","database":"connected"}

# Test Frontend
curl http://localhost:80

# Test MQTT
mosquitto_sub -h localhost -p 1883 -t "sensors/#"
```

---

## 🌐 Access Applications

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:3000 | React Dashboard |
| **Nginx** | http://localhost | Reverse Proxy (recommended) |
| **Backend API** | http://localhost:5000/api | REST API |
| **MQTT** | mqtt://localhost:1883 | Message Broker |

---

## 📊 Monitor Services

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mosquitto

# View running processes
docker-compose exec backend ps aux
```

---

## 🔧 Common Commands

### Start/Stop Services

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose stop

# Stop & remove containers
docker-compose down

# Restart specific service
docker-compose restart backend

# Rebuild images
docker-compose build --no-cache
```

### Troubleshooting

```bash
# Check if ports are in use
sudo lsof -i :5000
sudo lsof -i :5173
sudo lsof -i :1883

# Kill process using a port
sudo lsof -ti:5000 | xargs kill -9

# Clear Docker system
docker system prune -a

# Rebuild everything from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Database Management

```bash
# Access SQLite database
docker-compose exec backend sqlite3 database/sensors.db

# Backup database
docker-compose exec backend cp database/sensors.db database/sensors.db.backup

# Restore database
docker-compose exec backend cp database/sensors.db.backup database/sensors.db
```

---

## 🧪 Testing

### 1. Test Login

```bash
# Tạo user mới (nếu API hỗ trợ)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123",
    "email": "test@example.com"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123"
  }'

# Response sẽ chứa access_token
```

### 2. Test API with Token

```bash
# Sử dụng token từ login response
TOKEN="your-access-token-here"

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/devices

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/sensors/tilt
```

### 3. Test MQTT

```bash
# Terminal 1: Subscribe to topics
docker-compose exec mosquitto mosquitto_sub -h localhost -t "sensors/#" -v

# Terminal 2: Publish test message
docker-compose exec mosquitto mosquitto_pub -h localhost \
  -t "sensors/device001/tilt" \
  -m '{"timestamp":"2026-05-28T10:00:00Z","value":2.5,"unit":"degrees"}'
```

---

## 📝 Editing & Development

### Hệ Thống Hot Reload

**Frontend** (Vite automatically reloads):
```bash
# Edit file như src/components/Dashboard.jsx
# Browser sẽ tự reload khi file thay đổi
```

**Backend** (Auto-reload disabled in production, cần restart):
```bash
# Nếu muốn hot-reload cho development:
# Chỉnh sửa docker-compose.yml:
# command: python -m flask run --host=0.0.0.0 --reload

# Restart container
docker-compose restart backend
```

### Edit Configuration

```bash
# Edit environment variables
nano .env
# Restart containers để áp dụng
docker-compose restart backend frontend

# Edit MQTT config
nano config/mosquitto.conf
docker-compose restart mosquitto

# Edit Nginx config
nano docker/nginx.conf
docker-compose restart nginx
```

---

## 🚀 Next: Prepare for Real Deployment

Khi bạn đã test thành công locally, chuẩn bị cho production:

### 1. Chọn Cloud Platform

```bash
# Tùy chọn (xem so sánh chi phí & độ khó):
# ★ DigitalOcean App Platform (Dễ nhất)
# ★ Railway.app (Miễn phí thử)
# ★ AWS Lightsail (Giá rẻ, full control)
# ★ Heroku (Phổ biến nhưng đắt hơn)
```

### 2. Prepare Repository

```bash
# Đảm bảo tất cả changes committed
git add .
git commit -m "Ready for deployment"
git push origin main

# Kiểm tra .gitignore
cat .gitignore
# Phải include: .env, node_modules/, *.db, .venv/
```

### 3. Read Deployment Guide

```bash
# Chi tiết các phương pháp deployment
cat docs/DEPLOYMENT_GUIDE.md

# Checklist
cat docs/DEPLOYMENT_CHECKLIST.md
```

### 4. Deploy!

```bash
# Chạy deployment script (tùy chọn)
bash scripts/deploy.sh production digitalocean
# hoặc
bash scripts/deploy.sh production heroku
```

---

## 🆘 Troubleshooting

### Frontend không load

```bash
# Kiểm tra frontend container
docker-compose logs frontend

# Kiểm tra Nginx
docker-compose logs nginx

# Restart frontend
docker-compose restart frontend
docker-compose restart nginx
```

### Backend 500 Error

```bash
# Xem chi tiết lỗi
docker-compose logs backend

# SSH vào container
docker-compose exec backend bash

# Check database
sqlite3 database/sensors.db ".tables"

# Check environment
env | grep FLASK
```

### MQTT không kết nối

```bash
# Kiểm tra mosquitto
docker-compose logs mosquitto

# Test kết nối
docker-compose exec mosquitto mosquitto_sub -h mosquitto -t "test"

# Kiểm tra network
docker network ls
docker network inspect $(docker network ls -q)
```

### Port conflict

```bash
# Tìm process dùng port
sudo lsof -i :5000

# Thay port trong docker-compose.yml
# "5000:5000" → "5001:5000"

# Hoặc kill process
sudo kill -9 $(lsof -t -i:5000)
```

---

## 📚 Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Flask Development](https://flask.palletsprojects.com/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Mosquitto MQTT](https://mosquitto.org/)

---

## ✅ Next Steps

- [ ] Chạy `docker-compose up -d` thành công
- [ ] Access http://localhost hoạt động
- [ ] Test login & API endpoints
- [ ] Read DEPLOYMENT_GUIDE.md cho production setup
- [ ] Choose cloud platform
- [ ] Follow deployment steps

---

**Happy Deploying! 🎉**

Nếu có vấn đề, kiểm tra logs: `docker-compose logs -f`

---

**Version**: 1.0  
**Updated**: May 28, 2026
