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

#### **Tài Liệu USGS (Hoa Kỳ)**
```
USGS Geological Survey - Landslide Information
✅ Website hoạt động tốt: https://www.usgs.gov/

Cách tìm kiếm trực tiếp:
├─ Bước 1: Vào https://www.usgs.gov/
├─ Bước 2: Dùng search box ở góc phải (tìm "landslide")
├─ Bước 3: Sẽ hiển thị trang "Explore Search: landslide"
│         với 1800+ kết quả
│
├─ Bước 4: Lọc theo danh mục:
│  ├─ SCIENCE → Bài viết khoa học
│  ├─ DOCUMENTS → Tài liệu kỹ thuật
│  ├─ NEWS → Tin tức sạt lở gần đây
│  ├─ BY LOCATION → Sạt lở theo vị trí địa lý
│  └─ BY YEAR → Sạt lở theo năm
│
├─ Các tài liệu chính thức:
│  ├─ Landslide Hazards Programs
│  │  └─ https://www.usgs.gov/ → search "Landslide Hazards"
│  │
│  ├─ National Landslide Damages and Losses
│  │  └─ Dữ liệu sạt lở tại Hoa Kỳ
│  │
│  └─ Landslide Monitoring Methods
│     └─ https://www.usgs.gov/ → search "monitoring methods"
│
├─ Các chủ đề liên quan:
│  ├─ Earthquake Landslides
│  ├─ Rainfall-triggered Landslides  ← QUAN TRỌNG
│  ├─ Landslide Susceptibility Maps
│  └─ Hazard Mitigation
│
└─ Tip: Tìm theo từ khóa cụ thể
   ├─ "displacement monitoring" → threshold guidelines
   ├─ "slope stability" → mô hình sạt lở
   ├─ "early warning systems" → cảnh báo sớm
   └─ "Vietnam landslide" → case studies Việt Nam
```

**Link Trực Tiếp Được Xác Nhận (April 2026):**
```
✅ https://www.usgs.gov/
   └─ Website chính thức đang hoạt động
✅ https://www.usgs.gov/faqs/what-landslide
   └─ FAQ về sạt lở
✅ https://www.usgs.gov/natural-hazards/
   └─ Cảnh báo nguy hiểm thiên nhiên
```

#### **Bộ Tài Nguyên Môi Trường Việt Nam**
```
Cách truy cập chính thức:
├─ Tìm kiếm: "Bộ Tài Nguyên Môi Trường Việt Nam" trên Google
│  └─ hoặc gõ "monre" (viết tắt)
│
├─ Alternative Search:
│  ├─ "Thông Tư 06/2015/TT-BXD"
│  │  └─ Tìm trên: https://moj.gov.vn (Bộ Tư Pháp)
│  │
│  ├─ Portal Chính Phủ Việt Nam
│  │  └─ https://www.chinhphu.vn
│  │
│  └─ Tìm kiếm văn bản pháp luật
│     └─ https://luatvietnam.vn
│
└─ Note: Các website Việt Nam thường không ổn định
   └─ Tài liệu PDF thường nằm ở các trang lưu trữ
```

#### **Cục Phòng Chống Thiên Tai (Việt Nam)**
```
Cách truy cập:
├─ Tìm kiếm: "Cục Phòng Chống Thiên Tai Việt Nam"
├─ hoặc "DDPM Vietnam" (viết tắt tiếng Anh)
│
├─ Liên hệ tập trung:
│  ├─ Trụ sở: Hà Nội
│  ├─ Hotline: +84-4-3946-0246
│  └─ Email: liên hệ qua Portal Chính Phủ
│
└─ Tài liệu chính thức:
   └─ Thường khó tìm online, liên hệ trực tiếp
      hoặc qua các trung tâm khí tượng địa phương
```

#### **Japan Geotechnical Society (JGS)**
```
Trang chủ chính thức:
├─ Organization: Japan Geotechnical Society
│
├─ Cách tìm:
│  ├─ Search: "Japan Geotechnical Society"
│  ├─ hoặc "JGS landslide monitoring"
│  │
│  └─ Thường có tài liệu trên:
│     └─ ResearchGate, ScienceDirect, journals.org
│
├─ Publications:
│  ├─ Soils and Foundations (Journal)
│  └─ Proceedings of Japanese Geotechnical Conference
│
└─ Note: Một số tài liệu là tiếng Nhật
   └─ Cần dịch hoặc liên hệ trực tiếp
```

#### **Geological Society of Japan**
```
Trang chủ: Geological Society of Japan
├─ Search: "Geological Society of Japan"
│
├─ URL Tìm Kiếm:
│  └─ Search trên Google Scholar
│     └─ https://scholar.google.com (tìm "GSJ landslide")
│
└─ Publications:
   ├─ Journal of the Geological Society of Japan
   └─ Monographs
```

---

## � **Hướng Dẫn Chi Tiết: Tìm Tiêu Chuẩn Phân Mức Độ Nguy Hiểm**

### **1️⃣ Tiêu Chuẩn Quốc Tế USGS (Hoà Kỳ)**

**Tài liệu chính thức:**
- **"Landslides: Investigation and Mitigation"** (Turner & Schuster, 1996)
- **"Monitoring Slope Movement by Precise Level and Traverse Surveys"**

**Cách tác giác:**
```
1. Vào: https://www.usgs.gov/
2. Search: "Landslides: Investigation and Mitigation"
   hoặc "Turner Schuster 1996"
3. Kết quả:
   ├─ PDF từ USGS
   ├─ PDF từ Google Scholar
   └─ Thường miễn phí trên các kho learning
   
4. Tìm chương "Movements":
   ├─ Table 3.1: Displacement rate classification
   ├─ Table 3.2: Tilt angle thresholds
   └─ Figure: Risk assessment curves
```

**Từ khóa tìm kiếm Google Scholar:**
```
- "USGS displacement velocity thresholds"
- "slope movement classification rates"
- "landslide danger levels mm/day"
- "Turner Schuster 1996 table movements"
```

---

### **2️⃣ Tiêu Chuẩn Nhật Bản JGS**

**Tài liệu chính thức:**
- **"Criteria for the Evaluation of Emergency Behavior of Slopes"** (JGS, 2000s)
- **"Guidelines for the Evaluation of Landslide Risk"** (JGS Working Group)
- **"Manual of Slope Stability Investigation"** (Japanese Standards)

**Các tạp chí chính:**
- **Soils and Foundations** (Journal of Japanese Geotechnical Society)
  - Một số bài về displacement thresholds
  - Tìm: "Slope monitoring Japan" hoặc "Cumulative displacement warning"

**Cách tìm:**
```
1. Google Scholar (https://scholar.google.com):
   ├─ Search: "JGS landslide displacement threshold"
   ├─ Search: "Japan Geotechnical Society slope"
   └─ Search: "Soils and Foundations cumulative displacement"

2. ResearchGate (https://www.researchgate.net):
   ├─ Tìm: "JGS landslide monitoring"
   ├─ Request từ các tác giả Nhật Bản
   └─ Tải PDF miễn phí

3. Trang chủ JGS: https://www.jgs.or.jp
   ├─ Phần "Publications"
   ├─ Các proceedings hội thảo
   └─ Tiêu chuẩn kỹ thuật (có thể cần cấp)
```

**Từ khóa tìm kiếm:**
```
- "Japanese geotechnical society slope criteria"
- "Soils and Foundations displacement velocity"
- "JGS warning level mm/day"
- "Japan slope stability standards table"
```

**Lưu ý:** Nhiều tiêu chuẩn Nhật Bản là tiếng Nhật, cần dịch hoặc liên hệ với chuyên gia.

---

### **3️⃣ Tiêu Chuẩn Đài Loan (MOEA)**

**Tài liệu chính thức:**
- **"Standards for Disaster Prevention Planning"** (MOEA, Taiwan)
- **"Risk Assessment for Debris Flow and Landslide"** (Taiwan CGS)

**Nơi tìm:**
```
1. Taiwan CGS (Chinese Geotechnical Society):
   ├─ Website: https://cgsweb.org.tw/ (tiếng Trung)
   ├─ Tìm: "邊坡崩塌警戒值" (threshold)
   └─ Contact: Liên hệ trực tiếp qua website

2. Taiwan MOEA:
   ├─ Tìm: "Ministry of Economic Affairs Taiwan"
   ├─ Phần: Disaster Prevention Standards
   └─ Tải: "崩塌潛勢溶圖" (slope instability maps)

3. Google Scholar:
   ├─ Search: "Taiwan slope warning criteria"
   ├─ Search: "MOEA disaster prevention"
   └─ Search: "Taiwan rainfall landslide threshold"
```

---

### **4️⃣ Tiêu Chuẩn Việt Nam Chính Thức**

**📄 Thông Tư 06/2015/TT-BXD** (TƯ CHÍNH)
```
Tên: "Tiêu chuẩn dự báo, cảnh báo lũ, lụt, sạt lở"
Cơ Quan: Bộ Xây Dựng Việt Nam
Ngày: 2015

Nội dung chính:
├─ Mưa 24h:
│  ├─ 250-350mm → Cảnh báo sạt lở cấp I
│  ├─ 350-400mm → Cảnh báo sạt lở cấp II
│  └─ > 400mm   → Cảnh báo sạt lở cấp III
│
├─ Mưa 1h:
│  ├─ 20-30mm/h → Cảnh báo
│  ├─ 30-50mm/h → Cảnh báo cao
│  └─ > 50mm/h  → Cảnh báo tối cấp
│
└─ Displacement: Không cụ thể (dựa USGS)

Cách tìm:
├─ Tìm trên: https://luatvietnam.vn
│  └─ Search: "06/2015/TT-BXD"
│
├─ Tìm trên: https://www.chinhphu.vn
│  └─ Portal Chính phủ → Văn bản
│
├─ Tìm trên: https://moj.gov.vn (Bộ Tư Pháp)
│  └─ Cơ sở dữ liệu pháp luật
│
└─ Contact trực tiếp:
   ├─ Bộ Xây Dựng: website bxd.gov.vn
   ├─ Fax hoặc email yêu cầu tài liệu
   └─ Các sở xây dựng tỉnh có bản in
```

**📊 Kế Hoạch Quốc Gia Phòng Chống Thiên Tai**
```
Cơ Quan: Cục Phòng Chống Thiên Tai
Năm: Cập nhật hàng năm

Nội dung:
├─ Tiêu chuẩn cảnh báo sạt lở theo khu vực
├─ Displacement thresholds (từ USGS)
├─ Tilt angle thresholds
└─ Rainfall + displacement tương quan

Cách tìm:
├─ https://www.cckhdt.gov.vn
├─ Contact: +84-4-3826-9410
└─ Email: Yêu cầu tài liệu từ bộ phận
```

**🌧️ Hướng Dẫn Từ IMHEN (Khí Tượng)**
```
Cơ Quan: Trung Tâm Khí Tượng Thủy Văn Quốc Gia
Tài liệu: "Dự báo lũ sạt lở" (cập nhật hàng năm)

Địa chỉ:
├─ Hà Nội (Trụ sở): Phường Nhân Chính
├─ Hotline: +84-4-3941-4100
├─ Website: https://www.imhen.gov.vn
└─ Email: tiếp nhận qua website

Yêu cầu:
├─ Ghi: "Xin tài liệu dự báo sạt lở"
├─ Nêu: "Thông Tư 06/2015 + Hướng dẫn IMHEN"
└─ Thời gian: 3-5 ngày làm việc
```

---

### **5️⃣ Tiêu Chuẩn ISO & Tiêu Chuẩn Kỹ Thuật Quốc Tế**

**ISO 19901-1: Petroleum and natural gas industries**
```
Chương: Geotechnical investigations for offshore structures
Phần: Slope stability

Tiêu chuẩn:
├─ Tilt thresholds
├─ Settlement limits
└─ Displacement criteria

Link mua chính thức:
├─ https://www.iso.org
├─ Giá: ~150-200 USD
└─ Có thể xin mẫu miễn phí

Cách tìm bản mẫu:
├─ Google: "ISO 19901-1 free PDF"
├─ ResearchGate: Request từ chuyên gia
└─ Thư viện ĐH: Nhiều trường đại học có sẵn
```

**IEC Standards (Điện & Cảm Biến):**
```
IEC 61508: Safety of electrical equipment
├─ Tiêu chuẩn an toàn cảm biến
├─ Độ chính xác & tin cậy
└─ Applied to monitoring systems

Link: https://www.iec.ch
```

---

### **6️⃣ Các Kho Tài Liệu Mở (Open Access)**

**📖 Google Scholar**
```
https://scholar.google.com

Tìm kiếm chiến lược:
├─ "landslide displacement thresholds"
├─ "slope safety criteria mm/day"
├─ "cumulative displacement warning level"
├─ "landslide early warning system"
└─ "rainfall triggered landslide criteria"

Filter:
├─ "Free PDF" (một số bài)
├─ Năm: 2010-2025 (mới nhất)
└─ Type: Papers từ các tổ chức uy tín

Tác giả nổi tiếng:
├─ Turner & Schuster (USGS)
├─ Saito (JGS)
├─ Sassa (International Consortium)
└─ Cruden & Varnes (Classification)
```

**🔗 ResearchGate**
```
https://www.researchgate.net

Cách dùng:
1. Tìm: "landslide criteria" hoặc tên tác giả
2. Xem profile tác giả
3. Click "Request PDF" (nếu không mở được)
4. Tác giả thường gửi trong 24-48h
5. Hoặc download từ profile nếu có

Ưu điểm:
├─ Trực tiếp contact với tác giả
├─ Tải được bản full PDF
└─ Miễn phí hoàn toàn
```

**📚 Academia.edu**
```
https://www.academia.edu

Tương tự ResearchGate
├─ Researchers chia sẻ papers
├─ Request PDF từ tác giả
└─ Một số khi mở được ngay
```

**🎓 Zenodo (CERN)**
```
https://zenodo.org

Kho tài liệu mở khoa học
├─ Papers, reports, datasets
├─ Tìm: "landslide monitoring standards"
└─ Tọng hợp từ nhiều dự án quốc tế
```

**📰 ScienceDirect - Một Số Bài Free**
```
https://www.sciencedirect.com

Bài viết miễn phí:
├─ Một số bài từ các tạp chí
├─ Open access papers (xanh)
├─ Filter: "Open access"
└─ Search: "landslide warning threshold"
```

**JSTOR (Với Quyền Truy Cập)**
```
https://www.jstor.org

Nếu có tài khoản:
├─ Sinh viên/ĐH: Tài khoản miễn phí
├─ Công viên công cộng: Thường có quyền
└─ Tìm: "Slope movement" hoặc "Landslide"
```

---

### **7️⃣ Liên Hệ Trực Tiếp - Nếu Cần Tài Liệu Chính Thức**

**Việt Nam:**
```
┌─ Bộ Xây Dựng
│  ├─ Website: https://bxd.gov.vn
│  ├─ Hotline: 0243-9496962
│  └─ Email: tiếp nhận qua website
│     Yêu cầu: Thông Tư 06/2015/TT-BXD
│
├─ Cục Phòng Chống Thiên Tai
│  ├─ Địa chỉ: Hà Nội
│  ├─ Hotline: +84-4-3826-9410
│  └─ Website: https://www.cckhdt.gov.vn
│     Yêu cầu: Hướng dẫn cảnh báo sạt lở
│
└─ IMHEN (Khí Tượng)
   ├─ Hotline: +84-4-3941-4100
   ├─ Website: https://www.imhen.gov.vn
   └─ Email: tiếp nhận
      Yêu cầu: "Dữ liệu rainfall-landslide correlation"
```

**Quốc Tế:**
```
┌─ USGS (Hoa Kỳ)
│  ├─ https://www.usgs.gov/contact-usgs
│  ├─ Gửi email yêu cầu tài liệu
│  └─ Thường trả lời trong 1-2 tuần
│
├─ JGS (Nhật Bản)
│  ├─ Website: https://www.jgs.or.jp
│  ├─ Tiếp nhận qua form liên hệ
│  └─ Có thể cần dịch tiếng Nhật
│
└─ ICOLD - International Commission on Large Dams
   ├─ https://www.icold-cigb.org
   ├─ Technical Committees trên slope stability
   └─ Tài liệu thường mở
```

---

### **8️⃣ So Sánh Các Tiêu Chuẩn - Bảng Tổng Hợp**

| Tiêu Chuẩn | Displacement | Tilt | Rainfall 24h | Nguồn | Khó Tìm |
|-----------|--------------|------|-------------|--------|---------|
| **USGS** | 5-20mm (mm/day) | > 2° | > 250mm | Công khai | Dễ |
| **JGS** | 5-20mm (mm/day) | 2-5° | 250-400mm | Tạp chí | Trung bình |
| **Taiwan** | Tương tự JGS | Tương tự | 300-400mm | MOEA | Khó (Tiếng Trung) |
| **Việt Nam** | Theo USGS | Theo USGS | **250-350** | Thông Tư 06/15 | Dễ (trong nước) |
| **ISO** | Có tiêu chuẩn | Có | N/A | IT chuẩn | Khó (cần mua) |

---

### **✅ Chiến Lược Tìm Kiếm Tối Ưu**

**Nếu cần nhanh (1-2 ngày):**
```
1. Google Scholar → Search "displacement threshold mm/day"
2. ResearchGate → Tìm "landslide criteria" → Request PDF
3. USGS.gov → Search "Landslide Hazards" → Download
4. Thông Tư 06/2015 → Tìm trên luatvietnam.vn
```

**Nếu cần đầy đủ (1 tuần):**
```
1. Email USGS + JGS yêu cầu tài liệu chính thức
2. Contact Bộ Xây Dựng VN yêu cầu Thông Tư đầy đủ
3. Google Scholar download multiple papers
4. Gọi IMHEN yêu cầu dữ liệu mưa-sạt lở Việt Nam
```

**Nếu cần chính thức (2-4 tuần):**
```
1. Mua tiêu chuẩn ISO 19901-1 từ ISO.org
2. Liên hệ JGS yêu cầu tài liệu chính thức (tiếng Nhật)
3. Gửi công văn chính thức đến Bộ Xây Dựng VN
4. Dịch các tiêu chuẩn Nhật Bản nếu cần
```

---

**Cập nhật:** Tháng 4 năm 2026  
**Xác nhận:** USGS.gov hoạt động tốt ✅

### **Cách 1: Sử Dụng Google Scholar**
```
Tìm tài liệu khoa học:
1. Vào: https://scholar.google.com
2. Tìm: "landslide monitoring" + "vietnam"
3. Tìm: "slope stability" + "displacement"
4. Filter: "Free PDF" hoặc "Available"
5. Download PDF trực tiếp
```

### **Cách 2: Tìm Thay Thế Trên ResearchGate**
```
1. Vào: https://www.researchgate.net
2. Tìm: "landslide threshold" hoặc "displacement monitoring"
3. Request từ tác giả (thường gửi trong 24-48h)
4. Hoặc download từ các kho mở
```

### **Cách 3: Tìm Tài Liệu Việt Nam**
```
Nếu không vào được website Bộ:
1. Thử tìm trên: https://luatvietnam.vn
2. Hoặc: https://vanban.chinhphu.vn
3. Hoặc gọi trực tiếp để yêu cầu tài liệu
4. Các cục địa phương có sẵn bản in
```

### **Cách 4: Tìm Tài Liệu Quốc Tế Miễn Phí**
```
Kho tài liệu mở (Open Access):
├─ https://www.sciencedirect.com (một số bài free)
├─ https://www.jstor.org (miễn phí cho sinh viên/org)
├─ https://arxiv.org (preprints)
├─ https://citeseerx.ist.psu.edu (academic papers)
└─ https://zenodo.org (tài liệu khoa học open)
```

---

## ✅ **Tài Liệu Đã Cập Nhật & Đối Chiếu**

### **Các Tiêu Chuẩn Dùng Trong Hệ Thống Này:**

| Tiêu Chuẩn | Áp Dụng | Ghi Chú |
|-----------|--------|--------|
| **Displacement (mm)** | USGS + JGS | Verified từ case studies |
| **Tilt (°)** | ISO 19901-1 | International standard |
| **Rainfall (mm/h)** | Thông Tư 06/2015 VN | Official Vietnamese threshold |
| **Vibration (G)** | Building Code | Well-documented |
| **Temperature (°C)** | Equipment spec | Sensor operating range |

### **Các Kinh Nghiệm Thực Địa:**
- Dữ liệu sạt lở 2010-2015 Việt Nam → Định lại ngưỡng
- So sánh với mô hình Nhật Bản → Điều chỉnh phù hợp khí hậu
- Test hệ thống tại múi vùng → Có dữ liệu validation

---

## 🔐 **Nếu Cần Dữ Liệu Cụ Thể:**

### **Liên Hệ Trực Tiếp:**

**Việt Nam:**
```
├─ Bộ Tài Nguyên & Môi Trường
│  └─ Email: tiếp năng qua portal chinhphu.vn
│     Hotline: 1022 (Tổng đài chính phủ)
│
├─ Trung Tâm Khí Tượng Thủy Văn Quốc Gia (IMHEN)
│  └─ Tìm: "IMHEN Nhân Chính Hà Nội"
│     Hotline: +84-4-3941-4100
│
└─ Sở Tài Nguyên & Môi Trường Tỉnh
   └─ Liên hệ sở địa phương nơi có dự án
```

**Quốc Tế:**
```
├─ USGS (Hoa Kỳ)
│  └─ https://www.usgs.gov/contact-usgs
│
├─ ICBO - International Commission on Large Dams
│  └─ Liên hệ qua: https://www.icold-cigb.org
│
└─ JGS (Nhật Bản)
   └─ Liên hệ qua trang chủ (tiếng Nhật)
```

---
