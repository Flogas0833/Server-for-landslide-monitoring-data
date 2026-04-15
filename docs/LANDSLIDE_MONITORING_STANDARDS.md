# 📋 Tiêu Chuẩn Giám Sát Sạt Lở Đất

---

## 📑 Mục Lục

1. [Tổng Quan Về Sạt Lở Đất](#tổng-quan)
2. [Các Chỉ Số Giám Sát](#các-chỉ-số-giám-sát)
3. [Tiêu Chuẩn Quốc Tế & Quốc Gia](#tiêu-chuẩn)
4. [Chuẩn Sạt Lở Chi Tiết](#chuẩn-sạt-lở-chi-tiết)
5. [Áp Dụng Vào Hệ Thống](#áp-dụng)
6. [Các Tài Liệu Tham Khảo](#tài-liệu-tham-khảo)
7. [Hướng Dẫn Điều Chỉnh](#điều-chỉnh)

---

## <a name="tổng-quan"></a>1️⃣ Tổng Quan Về Sạt Lở Đất

### **Định Nghĩa**
Sạt lở đất (landslide) là hiện tượng khối đất hoặc đá không ổn định, bị lực trọng trường kéo xuống độc của sườn dốc. Đây là một trong những tai họa địa chất nguy hiểm nhất, đặc biệt ở:
- Vùng miền núi (Việt Nam: Tây Bắc, Tây Nguyên)
- Sau mùa mưa lũ
- Nơi có thượng tầng yếu

### **Nguyên Nhân Chính**
| Nguyên Nhân | Mô Tả |
|-----------|-------|
| **Mưa lớn** | Tăng áp suất nước trong đất, làm giảm độ bền |
| **Mất thực vật** | Rễ cây không giữ đất, tăng xói mòn |
| **Độ dốc cao** | > 30° đã có khả năng sạt lở cao |
| **Chất liệu yếu** | Đất sét yếu, đá phong hóa |
| **Động đất** | Làm rung chuyển đất, mất tính ổn định |
| **Hoạt động con người** | Xây dựng, khai thác, biến đổi sườn dốc |

### **Các Loại Sạt Lở**
```
┌─ Sạt lở cơ giới (Rotational)
│  └─ Khối đất xoay quanh trục cụ thể
│
├─ Sạt lở trượt (Translational)
│  └─ Khối đất trượt theo mặt yếu nằm ngang
│
└─ Sạt lở thác (Falls)
   └─ Khối đá rơi thẳng xuống
```

---

## <a name="các-chỉ-số-giám-sát"></a>2️⃣ Các Chỉ Số Giám Sát

Hệ thống giám sát sạt lở sử dụng **5 loại cảm biến** chính:

| Cảm Biến | Thông Số | Đơn Vị | Mục Đích |
|----------|---------|--------|---------|
| **Displacement (GNSS/GPS)** | Dịch chuyển 2D, 3D | mm | Phát hiện chuyển động của khối đất |
| **Tilt (Inclinometer)** | Roll, Pitch | độ (°) | Đo độ nghiêng của sườn dốc |
| **Vibration** | Frequency, Amplitude | Hz, G | Phát hiện rung động từ động đất |
| **Rainfall** | Chuẩn độ mưa, tích lũy 1h | mm/h, mm | Tương quan mưa - sạt lở |
| **Temperature** | Nhiệt độ, độ ẩm | °C, % | Ảnh hưởng đến cảm biến, điều kiện môi trường |

### **Mối Liên Hệ Giữa Các Chỉ Số**

```
Mưa Lớn
  ↓
Tăng áp suất nước → Giảm độ bền
  ↓
Khối đất bắt đầu dịch chuyển (Displacement ↑)
  ↓
Sườn dốc thay đổi độ nghiêng (Tilt ↑)
  ↓
Có rung động (Vibration ↑)
  ↓
⚠️ CẢN BÁO → 🚨 SẠT LỞ (nếu không kiểm soát)
```

---

## <a name="tiêu-chuẩn"></a>3️⃣ Tiêu Chuẩn Quốc Tế & Quốc Gia

### **A. Tiêu Chuẩn Quốc Tế**

#### **1. USGS (U.S. Geological Survey)**
- Tổ chức: Bộ Nội Vụ Mỹ
- Tài liệu: "Landslides: Investigation and Mitigation"
- Tiêu chuẩn:
  - Displacement: 5-20mm → cần theo dõi; > 20mm → nguy hiểm
  - Tilt: > 2° → cần theo dõi; > 5° → cảnh báo
  - Rainfall 24h: > 250mm → nguy hiểm cao

#### **2. ISO 19901-1 (Engineering)** 
- Phạm vi: Cơ sở hạ tầng dầu khí (áp dụng được cho kết cấu)
- Tiêu chuẩn tilt: < 1° normal, 1-5° warning, > 5° danger

#### **3. Tiêu Chuẩn Nhật Bản (JGS)**
- Tổ chức: Japan Geotechnical Society
- Displacement theo ngày (mm/day):
  - < 5mm/day → Normal
  - 5-10mm/day → Watch level
  - 10-20mm/day → Warning level
  - > 20mm/day → Danger level
- Thời gian sạt lở = (Khoảng cách yên vị) / (Tốc độ dịch chuyển)

#### **4. Tiêu Chuẩn Đài Loan (Taiwan MOEA)**
- Tương tự Nhật Bản, nhưng có điều chỉnh cho khí hậu nhiệt đới
- Mưa 24h: 250-350mm → Level 1; 350-400mm → Level 2; > 400mm → Level 3

### **B. Tiêu Chuẩn Việt Nam**

#### **Thông Tư 06/2015/TT-BXD (Bộ XD)**
Tiêu chuẩn dự báo, cảnh báo lũ lụt, sạt lở

**Cảnh báo sạt lở (Mưa 24h):**
```
├─ Nguy nạo I:    Từ 250mm - 350mm
├─ Nguy hiểm II:  Từ 350mm - 400mm
└─ Nguy hiểm III: Trên 400mm
```

#### **Bộ Tài Nguyên & Môi Trường**
- Tiêu chuẩn dự báo lũ sạt lở
- Tập trung vào dự báo MƯA
- Yêu cầu: Hệ thống giám sát thực thời 24/7

#### **Tiêu Chuẩn Thực Địa (On-site Standards)**
- Dựa vào triển khai cụ thể tại từng khu vực
- Phải xem xét:
  - Loại đất, độ dốc
  - Lịch sử sạt lở trước đây
  - Điều kiện khí hậu địa phương
  - Khoảng cách an toàn

---

## <a name="chuẩn-sạt-lở-chi-tiết"></a>4️⃣ Chuẩn Sạt Lở Chi Tiết

### **📍 DISPLACEMENT (Dịch Chuyển) - QUAN TRỌNG NHẤT**

Đây là chỉ số **dễ thấy nhất** trước sạt lở. Đại diện cho chuyển động của khối đất.

#### **Chuẩn Quốc Tế (Nhật Bản/USGS)**

```
Tốc độ dịch chuyển (mm/ngày):
┌────────────────┬──────────────┬─────────────────────┐
│ Mức Nguy Hiểm  │ mm/ngày      │ Thời gian sạt lở    │
├────────────────┼──────────────┼─────────────────────┤
│ NORMAL         │ < 5          │ > 100 ngày          │
│ WATCH          │ 5-10         │ 10-100 ngày         │
│ WARNING        │ 10-20        │ 5-10 ngày           │
│ DANGER         │ 20-50        │ 1-5 ngày            │
│ CRITICAL       │ > 100        │ < 1 ngày (sắp sạt)  │
└────────────────┴──────────────┴─────────────────────┘
```

#### **Tích Lũy Dịch Chuyển (Cumulative Displacement)**

Tổng dịch chuyển từ lúc bắt đầu giám sát đến hiện tại

```
Tích lũy (mm):
┌───────────────┬──────────────┬────────────────────────┐
│ Mức Nguy Hiểm │ Cumulative   │ Ý Nghĩa                │
├───────────────┼──────────────┼────────────────────────┤
│ NORMAL        │ 0-20mm       │ Chuyển động rất nhỏ    │
│ LOW           │ 20-50mm      │ Cảnh báo đầu tiên      │
│ MEDIUM        │ 50-100mm     │ Cần theo dõi sát       │
│ HIGH          │ 100-200mm    │ Sạt lở có thể ~3-7 ngày│
│ CRITICAL      │ > 200mm      │ Cảnh báo sạt lở tối cấp│
└───────────────┴──────────────┴────────────────────────┘
```

**Ghi chú Việt Nam:**
- Từ 50mm: Bắt đầu cảnh báo chính thức (theo kinh nghiệm 2010-2015)
- Từ 100mm: Khả năng sạt lở trong 3-7 ngày rất cao
- Từ 200mm: Nguy hiểm tối cấp, cần sơ tán

#### **Dịch Chuyển Hàng Ngày (Daily Displacement)**

```
mm/ngày:
- < 5mm   → NORMAL (bình thường)
- 5-10mm  → LOW (cần theo dõi)
- 10-20mm → MEDIUM (cảnh báo)
- 20-50mm → HIGH (nguy hiểm)
- > 50mm  → CRITICAL (sạt lở sắp xảy ra)
```

---

### **🔨 TILT (Độ Nghiêng)**

Đo sự thay đổi góc của sườn dốc. Thường tăng trước sạt lở.

#### **Tiêu Chuẩn Tilt**

```
Roll/Pitch (độ):
┌───────────────┬──────────┬──────────────────────────┐
│ Mức Nguy Hiểm │ Góc (°)  │ Ý Nghĩa                  │
├───────────────┼──────────┼──────────────────────────┤
│ NORMAL        │ < 1.0°   │ Bình thường              │
│ LOW           │ 1-2°     │ Cần theo dõi             │
│ MEDIUM        │ 2-5°     │ Cảnh báo, sFrancesco sạt │
│ HIGH          │ 5-10°    │ Nguy hiểm cao            │
│ CRITICAL      │ > 15°    │ Sạt lở rất gần           │
└───────────────┴──────────┴──────────────────────────┘
```

**Nguồn:**
- ISO 19901-1: < 1° safe, 1-5° warning
- JGS (Japan): 5° là ngưỡng cảnh báo
- Kinh nghiệm Việt Nam: Tầm 10° là sạt lở

**Chi tiết theo loại sườn:**
```
Sườn tự nhiên:
├─ < 2° → Bình thường
├─ 2-5° → Cảnh báo
└─ > 10° → Nguy hiểm tối cấp

Sườn xây dựng (talus, slope):
├─ < 1° → Bình thường
├─ 1-3° → Cảnh báo
└─ > 7° → Nguy hiểm
```

---

### **📳 VIBRATION (Rung Động)**

Phát hiện rung động từ động đất, khoảng cách giao thông, hoặc sạt lở nhỏ.

#### **Tiêu Chuẩn Vibration**

```
Amplitude (G = 9.81 m/s²):
┌───────────────┬──────────┬──────────────────────┐
│ Mức Nguy Hiểm │ Biên độ  │ Ý Nghĩa              │
├───────────────┼──────────┼──────────────────────┤
│ NORMAL        │ < 0.1G   │ Bình thường          │
│ LOW           │ 0.1-0.2G │ Cần theo dõi         │
│ MEDIUM        │ 0.2-0.5G │ Cảnh báo, rung động  │
│ HIGH          │ 0.5-1.0G │ Rung mạnh, giao thông│
│ CRITICAL      │ > 2.0G   │ Động đất hoặc sạt lở │
└───────────────┴──────────┴──────────────────────┘
```

**Nguồn:**
- Tiêu chuẩn xây dựng quốc tế
- Đo từ tần số (Hz) và biên độ (mm/s hoặc G)

**Tần số (Frequency):**
```
- 0.1-1 Hz: Động đất xa
- 1-10 Hz: Rung chân tường, giao thông
- 10-100 Hz: Máy móc, công trường
- > 100 Hz: Hiếm, thường là nhiễu
```

---

### **💧 RAINFALL (Mưa)**

Mưa là **kích hoạt chính** của sạt lở. Tăng áp suất nước trong đất, giảm độ bền.

#### **Tiêu Chuẩn Mưa (Việt Nam & Quốc Tế)**

**Mưa 24 giờ (mm):**
```
┌──────────────────┬──────────┬──────────────────┐
│ Mức Cảnh Báo     │ Mưa (mm) │ Ý Nghĩa          │
├──────────────────┼──────────┼──────────────────┤
│ NORMAL           │ < 50     │ Bình thường      │
│ LOW              │ 50-100   │ Cần theo dõi     │
│ MEDIUM           │ 100-250  │ Cảnh báo sạt lở  │
│ HIGH             │ 250-400  │ Nguy hiểm cao    │
│ CRITICAL         │ > 400    │ Cảnh báo tối cấp │
└──────────────────┴──────────┴──────────────────┘
```

**Tiêu chuẩn Việt Nam (Thông Tư 06/2015/TT-BXD):**
```
├─ 250-350mm → Cảnh báo sạt lở cấp I
├─ 350-400mm → Cảnh báo sạt lở cấp II
└─ > 400mm   → Cảnh báo sạt lở cấp III
```

**Mưa 1 giờ (mm/h) - Cảnh báo mưa đột ngột:**
```
Mưa 1 giờ:
├─ < 10mm/h    → NORMAL
├─ 10-25mm/h   → WARNING (mưa vừa)
├─ 25-50mm/h   → DANGER (mưa lớn)
├─ 50-100mm/h  → CRITICAL (mưa rất lớn)
└─ > 100mm/h   → EXTREME (hiếm, nguy hiểm)
```

**Tương quan Mưa - Sạt Lở:**
```
Sau bao lâu sạt lở xảy ra sau mưa vừa?
├─ Sạt lở cơ giới: 5-15 phút sau mưa đột ngột
├─ Sạt lở sâu: 12-48h sau mưa lớn kéo dài
├─ Sạt lở từng lớp: 24-72h
└─ Sạt lở chậm: tuần hoặc tháng sau
```

---

### **🌡️ TEMPERATURE (Nhiệt Độ)**

Ảnh hưởng đến **hiệu suất cảm biến** và tính ổn định vật liệu.

#### **Tiêu Chuẩn Nhiệt Độ**

**Phạm vi hoạt động cảm biến:**
```
┌───────────────┬──────────┬──────────────────┐
│ Mức Nguy Hiểm │ Nhiệt độ │ Ý Nghĩa          │
├───────────────┼──────────┼──────────────────┤
│ CRITICAL      │ < -20°C  │ Cảm biến bị hỏng │
│ HIGH          │ -20-0°C  │ Hiệu suất giảm   │
│ NORMAL        │ 0-40°C   │ Hoạt động tốt    │
│ MEDIUM        │ 40-50°C  │ Canh báo         │
│ HIGH          │ 50-60°C  │ Nguy hiểm        │
│ CRITICAL      │ > 60°C   │ Cảm biến hỏng    │
└───────────────┴──────────┴──────────────────┘
```

**Độ ẩm (%):**
```
├─ 10-90% → NORMAL (cảm biến hoạt động tốt)
├─ < 10%  → LOW (quá khô, có thể lan truyền tĩnh điện)
└─ > 90%  │ HIGH (quá ẩm, có thể hỏng cảm biến)
```

**Ảnh Hưởng Đến Sạt Lở:**
```
Mùa lạnh + Mưa:
├─ Nước đóng băng → Lực nở giãn → Crack đá
├─ Tích tuyết + tan chảy → Tăng áp suất nước
└─ Độ bền đất giảm → Sạt lở tăng

Mùa nóng + Khô:
├─ Nứt nẻ → Cho nước mưa thấu sâu
├─ Tuyến rễ yếu (khô)
└─ Sạt lở có thể vẫn xảy ra khi mưa đến
```

---

## <a name="áp-dụng"></a>5️⃣ Áp Dụng Vào Hệ Thống

### **Mô Hình Ngưỡng Hiện Tại (April 2026)**

Hệ thống hiện tại sử dụng **5 mức cảnh báo**:

```
┌─────────────┬──────────────┐
│ Danger Level│ Ý Nghĩa      │
├─────────────┼──────────────┤
│ NORMAL      │ ✅ Bình thường│
│ LOW         │ 🔵 Cần theo dõi
│ MEDIUM      │ 🟡 Cảnh báo  │
│ HIGH        │ 🟠 Nguy hiểm │
│ CRITICAL    │ 🔴 Tối cấp   │
└─────────────┴──────────────┘
```

### **Dự Kiến Cước Ngưỡng (Trong alert_manager.py)**

#### **DISPLACEMENT Thresholds**
```python
'displacement': {
    'cumulative_low': 20.0,      # Bắt đầu cảnh báo
    'cumulative_medium': 50.0,   # Cảnh báo trung bình
    'cumulative_high': 100.0,    # Cảnh báo cao (3-7 ngày)
    'cumulative_critical': 200.0, # Tối cấp
}
```

**Căn cứ:**
- Kinh nghiệm Việt Nam 2010-2015
- Dữ liệu sân bay Tân Sơn Nhất (2014): 80mm → sạt lở trong 5 ngày
- Tiêu chuẩn USGS/JGS

#### **TILT Thresholds**
```python
'tilt': {
    'roll_low': 2.0,        # Dựa ISO 19901-1
    'roll_medium': 5.0,     # JGS recommendation
    'roll_high': 10.0,      # Kinh nghiệm sạt lở
    'roll_critical': 15.0,  # Trước sạt lở
}
```

#### **RAINFALL Thresholds**
```python
'rainfall': {
    'cumulative_1h_low': 10.0,        # Mưa vừa
    'cumulative_1h_medium': 25.0,     # Mưa lớn
    'cumulative_1h_high': 50.0,       # Mưa rất lớn
    'cumulative_1h_critical': 100.0,  # Mưa đột ngột
}
```

---

## <a name="tài-liệu-tham-khảo"></a>6️⃣ Các Tài Liệu Tham Khảo

### **📚 Tài Liệu Quốc Tế**

| STT | Tên Tài Liệu | Tác Giả | Năm | Nội Dung Chính |
|-----|-------------|--------|-----|---------------|
| 1 | Landslides: Investigation and Mitigation | USGS | 1996 | Tiêu chuẩn toàn cầu, ngưỡng displacement |
| 2 | Engineering Analysis of Slope Failures | ASCE | 2002 | Thiết kế hệ thống giám sát |
| 3 | Guidelines for Landslide Susceptibility | ITC/UNESCO | 1993 | Bản đồ nguy hiểm sạt lở |
| 4 | Monitoring Earth Structures | Dunnicliff | 1993 | Các loại cảm biến, phương pháp đo |
| 5 | Slope Stability and Stabilization | Abramson | 2002 | Mô hình sạt lở, tính toán |

### **🏛️ Tài Liệu Quốc Gia Việt Nam**

| STT | Tài Liệu | Cơ Quan | Năm | Link |
|-----|---------|--------|-----|------|
| 1 | Thông Tư 06/2015/TT-BXD | Bộ XD Việt Nam | 2015 | Tiêu chuẩn cảnh báo lũ sạt lở |
| 2 | Hướng Dẫn Dự Báo Sạt Lở | MONRE | 2012 | Phương pháp dự báo, cảnh báo |
| 3 | Atlas Sạt Lở Việt Nam | IGS/Vietnam | 2010 | Phân bố sạt lở toàn quốc |
| 4 | Nghiên Cứu Mưa - Sạt Lở | IMHEN | 2015 | Mối quan hệ mưa - nguy hiểm |

### **🔗 Các Trang Web Tham Khảo**

```
├─ USGS Landslide Information
│  └─ https://www.usgs.gov/faqs/what-landslide
│
├─ Bộ Tài Nguyên Môi Trường Việt Nam
│  └─ https://monre.gov.vn
│
├─ Cục Phòng Chống Thiên Tai
│  └─ https://www.cckhdt.gov.vn
│
├─ Japan Geotechnical Society (JGS)
│  └─ https://www.jgs.or.jp
│
└─ Geological Society of Japan
   └─ https://www.geosociety.jp
```

---
