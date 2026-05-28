# ✅ Deployment Checklist

## 📋 Trước Khi Deployment

### 1. Chuẩn Bị Cấu Hình
- [ ] Cấu hình `.env` file cho backend
- [ ] Cấu hình `.env.production` file cho frontend
- [ ] Thay đổi `JWT_SECRET_KEY` thành key bảo mật ngẫu nhiên
- [ ] Thiết lập `MQTT_BROKER`, `MQTT_USERNAME`, `MQTT_PASSWORD`
- [ ] Cấu hình `ALLOWED_ORIGINS` với domain của bạn

### 2. Kiểm Tra Code
- [ ] Không có hardcoded credentials trong code
- [ ] Không có localhost URLs trong production config
- [ ] Kiểm tra tất cả imports hoạt động đúng
- [ ] Chạy linting: `npm run lint` (frontend)
- [ ] Test backend locally

### 3. Build & Test
- [ ] `npm run build` thành công trong frontend
- [ ] Backend start không lỗi: `python backend/web_server.py`
- [ ] Database migrations chạy đúng
- [ ] Test API endpoints: `curl http://localhost:5000/api/health`

### 4. Git & Version Control
- [ ] Commit tất cả changes: `git add . && git commit -m "Deploy"`
- [ ] Push lên GitHub: `git push origin main`
- [ ] Không có uncommitted changes
- [ ] Check `.gitignore` bao gồm `.env` và `/node_modules/`

---

## 🚀 Deployment Actions

### PHƯƠNG ÁN 1: Docker (Dễ nhất)
- [ ] Cài Docker và Docker Compose
- [ ] Chạy: `docker-compose up -d`
- [ ] Kiểm tra: `docker-compose ps`
- [ ] Test: `curl http://localhost/api/health`

### PHƯƠNG ÁN 2: DigitalOcean (Đề Nghị)
- [ ] Có tài khoản DigitalOcean
- [ ] Repo pushed lên GitHub
- [ ] Connect DigitalOcean → GitHub
- [ ] Tạo App Platform
- [ ] Set environment variables
- [ ] Deploy & chờ hoàn tất (5-10 phút)

### PHƯƠNG ÁN 3: AWS Lightsail
- [ ] Có tài khoản AWS
- [ ] Tạo Ubuntu 22.04 instance
- [ ] SSH vào instance
- [ ] Chạy setup commands (xem DEPLOYMENT_GUIDE.md)
- [ ] Configure Nginx
- [ ] Cấu hình Supervisor
- [ ] Test endpoints

### PHƯƠNG ÁN 4: Heroku
- [ ] Cài Heroku CLI
- [ ] `heroku login`
- [ ] `heroku create [app-name]`
- [ ] `git push heroku main`
- [ ] `heroku logs --tail`

---

## 🌐 Domain & SSL Setup

- [ ] Domain trỏ tới server IP
- [ ] DNS A record cấu hình
- [ ] SSL certificate được cấp (Let's Encrypt)
- [ ] HTTPS redirect cấu hình
- [ ] Test HTTPS: `https://yourdomain.com`

---

## ✔️ Post-Deployment Verification

### API Testing
- [ ] `/api/health` → 200 OK
- [ ] `/api/login` → 401 (unauthorized)
- [ ] `/api/devices` → 401 (cần auth)
- [ ] Tạo user test & login
- [ ] `GET /api/devices` → 200 với data

### Frontend Testing
- [ ] Homepage load không lỗi
- [ ] Login page render đúng
- [ ] Can đăng nhập được
- [ ] Dashboard hiển thị correctly
- [ ] Map component load
- [ ] API calls work (check Network tab)

### MQTT Testing
- [ ] Broker kết nối được
- [ ] Topics subscribe đúng
- [ ] Data nhận được từ devices/publisher
- [ ] Alerts trigger khi vượt threshold
- [ ] Database save data đúng

### Database Testing
- [ ] Database file/connection accessible
- [ ] Tables tồn tại (sensors, devices, alerts)
- [ ] Sample data có thể query
- [ ] Backups tạo được

---

## 📊 Monitoring Setup

- [ ] Logging enabled (check `/logs/` folder)
- [ ] Health check endpoint working
- [ ] Error tracking configured (Sentry optional)
- [ ] Performance monitoring setup (DataDog optional)
- [ ] Backup schedule configured
- [ ] Uptime monitoring setup (UptimeRobot)

---

## 🔒 Security Verification

- [ ] HTTPS enabled & working
- [ ] CORS configured cho domain chính xác
- [ ] JWT token validation working
- [ ] MQTT credentials cấu hình
- [ ] Database backups encrypted
- [ ] Sensitive env vars không commit
- [ ] Security headers set (HSTS, CSP, etc.)

---

## 📈 Performance Checks

- [ ] Frontend assets gzip compressed
- [ ] CSS/JS minified
- [ ] Database indexes created
- [ ] API response time < 500ms
- [ ] No console errors in browser
- [ ] Memory usage reasonable
- [ ] CPU usage < 50% under normal load

---

## 📞 Troubleshooting Guide

### 500 Error
```bash
# Check logs
docker-compose logs backend
# or
heroku logs --tail
# or
tail -f /var/log/flask_app.log
```

### MQTT Connection Failed
```bash
# Test connection
mosquitto_sub -h broker-host -u user -P pass -t "sensors/#"
# Check firewall
sudo ufw status
```

### Static files not loading
```bash
# Check build output
ls -la frontend/dist/
# Check Nginx logs
docker-compose logs nginx
# or
sudo tail -f /var/log/nginx/error.log
```

### Database locked
```bash
# Find process holding database
lsof database/sensors.db
# Kill process if needed
kill -9 <PID>
```

---

## 🎓 Links & Resources

- 📖 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Chi tiết từng phương pháp
- 🐳 [Docker Documentation](https://docs.docker.com/)
- ☁️ [DigitalOcean App Platform](https://docs.digitalocean.com/products/app-platform/)
- 🌐 [Nginx Reverse Proxy Guide](https://nginx.org/en/docs/)
- 🔐 [Let's Encrypt SSL Setup](https://letsencrypt.org/)
- 🔄 [MQTT Protocol](https://mosquitto.org/documentation/)

---

## 📝 Notes

**Deployment Date**: _____________________

**Platform**: _____________________

**Issues Encountered**:
```


```

**Resolutions**:
```


```

**Lessons Learned**:
```


```

---

**Last Updated**: May 28, 2026
