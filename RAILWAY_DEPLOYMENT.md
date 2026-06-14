# 🚀 Deployment Guide: Railway.app

## Hướng Dẫn Deploy Hệ Thống Lên Railway.app (Miễn Phí - 1 Tháng)

### 📋 Điều Kiện Cần Thiết
- [x] GitHub account + repo pushed
- [ ] Railway account (free)
- [ ] Các environment variables sẵn sàng

---

## ⚡ Quick Start (5 Phút)

### Bước 1: Tạo Railway Account
1. Vào https://railway.app
2. Click "Sign In" → "GitHub"
3. Authorize Railway access to GitHub
4. Chọn repo của bạn

### Bước 2: Deploy
1. Dashboard Railway → "New Project"
2. Chọn "Deploy from GitHub repo"
3. Select: `Server-for-landslide-monitoring-data`
4. Railway tự build from Dockerfile
5. Chờ ~5-10 phút (first deploy)

### Bước 3: Set Environment Variables
1. Railway Dashboard → Project → "Variables"
2. Thêm từng biến này:

```
FLASK_ENV=production
FLASK_DEBUG=False
JWT_SECRET_KEY=<generate-new-secret-key>
ALLOWED_ORIGINS=https://your-railway-domain.railway.app
MQTT_BROKER=localhost
MQTT_PORT=1883
DATABASE_URL=sqlite:///./database/sensors.db
PORT=5000
```

### Bước 4: Get Your URL
- Railway Dashboard → "Deployments"
- Copy Public URL (e.g., `https://xxx-yyy.railway.app`)
- Test: `https://your-url/api/health`

---

## 🔑 Tạo JWT Secret Key (QUAN TRỌNG!)

Mở terminal, chạy:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Output sẽ giống:
```
X1_2b3cDe4FgHiJkLmNoPqRsT-uVwXyZ=
```

Copy value này vào Railway Variables: `JWT_SECRET_KEY`

---

## 🛠️ Troubleshooting

### ❌ "Module not found" Error
**Nguyên nhân:** dependencies chưa cài
**Fix:** 
- Kiểm tra `requirements.txt` có đầy đủ
- Railway logs: Dashboard → "Logs" xem chi tiết

### ❌ "Port already in use"
**Nguyên nhân:** PORT không được set
**Fix:** 
- Set `PORT=5000` trong Railway Variables

### ❌ CORS Errors
**Nguyên nhân:** `ALLOWED_ORIGINS` sai
**Fix:**
```
ALLOWED_ORIGINS=https://your-railway-domain.railway.app,https://yourdomain.com
```

### ❌ Database Connection Error
**Nguyên nhân:** SQLite path sai trong container
**Fix:**
```
DATABASE_URL=sqlite:////tmp/sensors.db
```
(4 slashes cho absolute path)

---

## 📊 Monitoring

- **Logs:** Dashboard → "Logs" (real-time)
- **CPU/Memory:** Dashboard → "Metrics"
- **Deployment Status:** Dashboard → "Deployments"

---

## 🧹 Cleanup (Sau 1 tháng)

Railway tính tiền theo cách sử dụng. Để xoá:
1. Dashboard → "Settings"
2. Click "Delete Project"
3. Hết chi phí ✨

---

## 📝 Lưu Ý Quan Trọng

### Nếu có MQTT Broker Ngoài
- Set `MQTT_BROKER` thành IP công khai của broker
- Mở port 1883 trên firewall

### Nếu cần Database Persistent
- Railway cung cấp PostgreSQL add-on ($15/tháng)
- Hoặc dùng SQLite local (data sẽ mất khi redeploy)

### Tự Động Deploy từ GitHub
- Railway tự deploy mỗi khi bạn push lên GitHub
- Cấu hình trong Project Settings → "Deploy on Push"

---

## ✅ Test Checklist

Sau deploy, test các endpoints:
```bash
# Test API health
curl https://your-url/api/health

# Test login
curl -X POST https://your-url/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'

# Test protected endpoint (thay YYYY bằng token từ login)
curl https://your-url/api/devices \
  -H "Authorization: Bearer YYYY"
```

---

## 💡 Pro Tips

1. **Enable auto-redeploy:** Railway → Settings → "Auto Deploy" = ON
2. **Monitor logs:** Mở logs ngay khi deploy để bắt lỗi sớm
3. **Database backup:** Tải file `sensors.db` về trước deployment
4. **Test locally first:** `docker-compose up` test toàn bộ trước push

---

## 🆘 Need Help?
- Railway Docs: https://docs.railway.app
- Community: https://discord.gg/railway
- Check logs trong Railway Dashboard → "Logs"
