# Landslide Monitoring System — Tóm tắt

Nhỏ gọn: hệ thống thu thập dữ liệu cảm biến qua MQTT, xử lý cảnh báo và hiển thị trên giao diện web.

Phiên bản ngắn này mô tả chức năng chính và cách khởi động nhanh.

## Chức năng chính
- Thu thập dữ liệu từ nhiều loại cảm biến (tilt, vibration, displacement, rainfall, temperature, GNSS) qua MQTT.
- Kiểm tra ngưỡng và sinh cảnh báo (LOW/MEDIUM/HIGH) khi vượt ngưỡng.
- Lưu trữ dữ liệu vào SQLite và cung cấp REST API (Flask) trên cổng 5000.
- Giao diện web (React + Vite) hiển thị bản đồ, bảng dữ liệu, dashboard và quản lý cảnh báo.
- Triển khai dễ dàng bằng Docker / docker-compose.

## Thư mục chính
- `backend/` — Flask API, MQTT subscriber, alert manager, DB utils
- `frontend/` — React app (src, components, pages)
- `config/` — cấu hình broker và danh sách thiết bị
- `database/` — file SQLite (`sensors.db`)
- `scripts/` — các script tiện ích (khởi động, seed, reset, open_map)
- `docker/` — cấu hình Docker, `docker-entrypoint.sh`

## Khởi động nhanh (local)
1) Cài dependencies Python:
```bash
pip install -r config/requirements_mqtt.txt
```
2) Khởi động Mosquitto (nếu chưa có):
```bash
sudo systemctl start mosquitto
```
3) Seed database (nếu cần):
```bash
python scripts/seed_initial_data.py
```
4) Chạy backend (local):
```bash
python scripts/run.py
```
5) Chạy frontend (dev):
```bash
cd frontend
npm install
npm run dev
```

Hoặc dùng Docker Compose để triển khai toàn bộ:
```bash
docker compose up --build
```

## Liên hệ & ghi chú
- File cấu hình MQTT: `config/mosquitto.conf` và `config/mosquitto_acl.conf`.
- Script khởi động toàn hệ thống: `scripts/start_system.sh`.
- Nếu cần tôi có thể mở rộng README này theo mẫu báo cáo hoặc thêm sơ đồ ngắn.

