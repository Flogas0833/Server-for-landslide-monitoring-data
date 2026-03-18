# MQTT ARCHITECTURE DIAGRAMS

## 1. SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                        HIỆN TRƯỜNG (Field)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Slope Point  │  │ Slope Point  │  │ Slope Point  │           │
│  │    SITE01    │  │    SITE02    │  │    SITE03    │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
│         │                 │                 │                   │
│    ┌────▼─────┐      ┌────▼─────┐      ┌────▼─────┐            │
│    │ DEVICE001│      │ DEVICE002│      │ DEVICE003│     (等等)  │
│    │ 6 sensors│      │ 6 sensors│      │ 6 sensors│            │
│    └────┬─────┘      └────┬─────┘      └────┬─────┘            │
│         │                 │                 │                   │
│    ┌────▼─────┐      ┌────▼─────┐      ┌────▼─────┐            │
│    │   Tilt   │      │   Tilt   │      │   Tilt   │            │
│    │Vibration │      │Vibration │      │Vibration │            │
│    │Displace. │      │Displace. │      │Displace. │            │
│    │ Rainfall │      │ Rainfall │      │ Rainfall │            │
│    │   Temp   │      │   Temp   │      │   Temp   │            │
│    │  GNSS    │      │  GNSS    │      │  GNSS    │            │
│    └─────────┘      └─────────┘      └─────────┘            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │ MQTT/HTTP/LoRa
                           │
                    ┌──────▼──────┐
                    │ Edge Gateway │
                    │  (Optional)  │
                    └──────┬───────┘
                           │
                 ┌─────────▼────────┐
                 │  MQTT PROTOCOL   │
                 │  (QoS, Retain)   │
                 └─────────┬────────┘
                           │
                    ┌──────▼──────────┐
                    │  MQTT Broker    │
                    │  (Mosquitto)    │
                    │  Port: 1883     │
                    │  Port: 8883(SSL)│
                    └──────┬──────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
    ┌───▼────┐         ┌───▼────┐         ┌──▼──┐
    │Validate│         │Process │         │Store│
    │  Data  │         │ Data   │         │Data │
    └───┬────┘         └───┬────┘         └──┬──┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    ┌──────▼──────┐
                    │  Backend    │
                    │  Server     │
                    │  (Python)   │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
    ┌───▼────┐         ┌───▼────┐         ┌──▼──┐
    │Database│         │ Alert  │         │ API │
    │(SQL)   │         │System  │         │Node │
    └────────┘         └────────┘         └─────┘
```

---

## 2. DATA FLOW - MESSAGE LIFECYCLE

```
┌──────────────────────────────────────────────────────────────────┐
│                    DEVICE (Publisher)                             │
└──────────────────┬───────────────────────────────────────────────┘
                   │
        ┌──────────▼──────────┐
        │ Read Sensor Values  │
        │ (e.g., Tilt: 5.2°)  │
        └──────────┬──────────┘
                   │
        ┌──────────▼────────────┐
        │ Create JSON Payload   │
        │ Add timestamp         │
        │ Add metadata          │
        │ Calculate checksum    │
        └──────────┬────────────┘
                   │
        ┌──────────▼──────────────┐
        │ Publish to MQTT Broker  │
        │ Topic: landslide/...    │
        │ QoS: 1 (reliability)    │
        │ Retain: False           │
        └──────────┬──────────────┘
                   │
                   ▼
        ┌──────────────────────────┐
        │    MQTT BROKER           │
        │  (Message Dispatcher)    │
        │                          │
        │ • Store in queue         │
        │ • Forward to subscribers │
        │ • Ensure delivery (QoS)  │
        └──────────┬───────────────┘
                   │
        ┌──────────▼──────────────┐
        │  SERVER (Subscriber)    │
        │  Subscribe to topics    │
        └──────────┬──────────────┘
                   │
        ┌──────────▼──────────────┐
        │ Receive Message         │
        │ Decode JSON             │
        │ Parse fields            │
        └──────────┬──────────────┘
                   │
        ┌──────────▼──────────────┐
        │ VALIDATION              │
        │ • Check sensor type     │
        │ • Verify ranges         │
        │ • Validate timestamp    │
        │ • Check checksum        │
        └──────────┬──────────────┘
                   │
        ┌──────────▼──────────────┐
        │ ALERT CHECK             │
        │ • Compare with threshold│
        │ • Determine severity    │
        │ • Trigger alert if needed
        └──────────┬──────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
    ▼ (Normal)    ▼ (Warning)    ▼ (Critical)
 ┌─────────┐  ┌──────────┐   ┌──────────┐
 │ Store   │  │Store +   │   │Alert +   │
 │in DB    │  │Notify    │   │Urgent    │
 │         │  │Warning   │   │Notify    │
 └────┬────┘  └────┬─────┘   └────┬─────┘
      │            │              │
      └────────────┼──────────────┘
                   │
        ┌──────────▼──────────────┐
        │ CALLBACK/RESPONSE       │
        │ Update UI/Dashboard     │
        │ Log to file             │
        │ Send notifications      │
        └──────────────────────────┘
```

---

## 3. MQTT TOPIC HIERARCHY

```
landslide/
│
└── project/
    │
    ├── PRJ001/
    │   │
    │   ├── site/
    │   │   │
    │   │   ├── SITE01/
    │   │   │   │
    │   │   │   └── device/
    │   │   │       │
    │   │   │       ├── DEVICE001/
    │   │   │       │   │
    │   │   │       │   ├── data/
    │   │   │       │   │   ├── tilt              (QoS 1, Retain: N)
    │   │   │       │   │   ├── vibration        (QoS 1, Retain: N)
    │   │   │       │   │   ├── displacement     (QoS 1, Retain: N)
    │   │   │       │   │   ├── rainfall         (QoS 1, Retain: N)
    │   │   │       │   │   ├── temperature      (QoS 0, Retain: N)
    │   │   │       │   │   └── gnss             (QoS 0, Retain: N)
    │   │   │       │   │
    │   │   │       │   ├── status               (QoS 1, Retain: Y)
    │   │   │       │   ├── heartbeat            (QoS 0, Retain: N)
    │   │   │       │   ├── battery              (QoS 0, Retain: N)
    │   │   │       │   │
    │   │   │       │   ├── command              (QoS 2, Retain: N)
    │   │   │       │   ├── config               (QoS 2, Retain: Y)
    │   │   │       │   └── response             (QoS 2, Retain: N)
    │   │   │       │
    │   │   │       ├── DEVICE002/
    │   │   │       │   └── (tương tự)
    │   │   │       │
    │   │   │       └── DEVICE003/
    │   │   │           └── (tương tự)
    │   │   │
    │   │   └── SITE02/
    │   │       │
    │   │       └── device/
    │   │           └── (tương tự)
    │   │
    │   └── alerts/
    │       ├── critical                         (Severity: critical)
    │       └── warning                          (Severity: warning)
    │
    └── PRJ002/
        └── (tương tự)
```

---

## 4. COMPONENT COMMUNICATION

```
       ┌─────────────────┐
       │   Device 001    │
       │   (Publisher)   │
       └────────┬────────┘
                │ Publish
                │ landslide/project/PRJ001/
                │ site/SITE01/device/
                │ DEVICE001/data/tilt
                │
                ▼
       ┌─────────────────────────┐
       │   MQTT Broker           │
       │   (Message Broker)      │
       │   Port: 1883            │
       │   Topics: 1000+         │
       │   Connections: 100+     │
       └────────┬────────────────┘
                │ Distribute
    ┌───────────┼───────────┐
    │           │           │
    ▼           ▼           ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Server  │ │ Dashboard
│(Sub)   │ │(SUB)    │ │Monitor  │
└────┬────┘ └────┬────┘ └────┬────┘
     │           │           │
     │ Process   │ Display   │ Alert
     │           │           │
     ▼           ▼           ▼
┌──────────────────────────────────┐
│      Application Layer          │
│                                 │
│ • Data Validation              │
│ • Alert Detection              │
│ • Database Storage             │
│ • User Notifications           │
│ • Dashboard Updates            │
└────────────────────────────────┘
```

---

## 5. QoS LEVELS & MESSAGE GUARANTEE

```
┌────────────────────────────────────────────────────┐
│            PUBLISHER (Device)                      │
└────────────┬─────────────────────────────────────┘
             │
             ├─( QoS 0: Fire and Forget )
             │  • No acknowledgment
             │  • At most once delivery
             │  • Fastest (但可能丢失)
             │  └─► GNSS, Temperature
             │
             ├─( QoS 1: At Least Once )
             │  • PUBACK acknowledgment
             │  • At least once delivery
             │  • May receive duplicates
             │  └─► Tilt, Vibration, Displacement, Rainfall
             │
             └─( QoS 2: Exactly Once )
                • PUBREL acknowledgment
                • Exactly once delivery
                • No duplicates (但最慢)
                └─► Critical Commands, Config

                         │
                         ▼
        ┌────────────────────────────┐
        │    MQTT Broker             │
        │  (Message Storage Logic)   │
        └────────────┬───────────────┘
                     │ (Retain Flag)
                     │
        ┌────────────▼──────────────┐
        │ Retain = True: Keep last  │
        │ message for new subs      │
        │                           │
        │ Retain = False: Don't     │
        │ keep message persistence  │
        └────────────┬──────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │      Subscriber (Server)   │
        │                            │
        │ Receives message using     │
        │ same guarantee level       │
        └────────────────────────────┘
```

---

## 6. SENSOR DATA COLLECTION TIMELINE

```
Time    Device                  MQTT Broker              Server
────────────────────────────────────────────────────────────────

T0      ┌─ Tilt: 5.2° ─────► ├─ Queue Message ────► ├─ Receive (QoS 1)
        │                    │                      ├─ PUBACK Send
        │                    │◄─────────────────────┤
        │                    │                      ├─ Parse JSON
        │                    │                      ├─ Validate
        │                    │                      ├─ Check Alert
        │                    │                      ├─ Store DB
        │                    │                      └─ ✓ Success

T1      ├─ Vibration ──────► ├─ Queue Message ────► ├─ Receive
        │  0.45g             │                      ├─ PUBACK
        │                    │                      ├─ Process
        │                    │                      └─ ✓

T2      ├─ Displacement ───► ├─ Queue Message ────► ├─ Receive
        │  2.54mm            │                      ├─ PUBACK
        │                    │                      ├─ Check Threshold
        │                    │                      ├─ 🚨 Alert!
        │                    │                      └─ Notify

T3      ├─ Rainfall ───────► ├─ Queue Message ────► ├─ Receive
        │ 12.4mm/h           │                      ├─ PUBACK
        │                    │                      ├─ Process
        │                    │                      └─ ✓

T4      ├─ Temperature ────► ├─ Queue Message ────► ├─ Receive
        │ 28.5°C             │ (QoS 0)              ├─ Process
        │                    │ (No PUBACK)          ├─ Optional store
        │                    │                      └─ ✓

T5      ├─ GNSS ───────────► ├─ Queue Message ────► ├─ Receive
        │ Lat: 21.028        │ (QoS 0)              ├─ Update Location
        │ Lon: 105.854       │                      └─ ✓

T6      ├─ Heartbeat ──────► ├─ Queue Message ────► ├─ Register Alive
        │ DEVICE001 Online   │                      ├─ Update UI
        │                    │                      └─ ✓

T7      ├─ Status ─────────► ├─ Queue + Retain ──► ├─ Receive
        │ Battery: 87%       │ (Future subs        ├─ Battery Monitor
        │ Signal: -65dBm     │  get last message)  └─ ✓

─────────────────────────────────────────────────────────────────
Interval: 10-15 seconds per cycle
Typical latency: < 100ms per message
```

---

## 7. ERROR HANDLING & RETRY

```
┌────────────────────────────────────────────────┐
│        Device Publishes Message                │
└───────────────┬────────────────────────────────┘
                │
        ┌───────▼────────┐
        │Attempts to send│
        └───────┬────────┘
                │
    ┌───────────┼───────────┐
    │ Success   │ Failure   │
    ▼           ▼
 ┌────────┐  ┌──────────────┐
 │✓ Done │  │Message Queued │
 └────────┘  │(Local Buffer) │
             └────┬─────────┘
                  │
         ┌────────▼─────────┐
         │Retry Strategy    │
         │Exponential Boff. │
         └────────┬────────┘
                  │
        ┌─────────┼─────────┐
        │         │         │
      5s        25s       125s
        │         │         │
        ▼         ▼         ▼
      ┌──┐     ┌──┐     ┌───┐
      │R1│ --> │R2│ --> │R3│
      └──┘     └──┘     └───┘
        │       │         │
        ├─✓─────┼────┐    │
        │       ├─✓──┼────┤
        │       │    ├─✓──┤
        │       │    │    ├─ Fail
        │       │    │    └─ Discard
        │       │    │
        └───────┴────┴─── Success!
```

---

## 8. DEVICE LIFECYCLE

```
┌──────────────────────────────┐
│  Device Powers On            │   ┌─ Connect to MQTT Broker
│  (Initialization Phase)      │  
└──────────────────┬───────────┘   
                   │
        ┌──────────▼─────────┐
        │Connect to Broker   │ -─→ Wait for acknowledgment
        │HostName: localhost│
        │ Port: 1883         │
        └──────────┬─────────┘
                   │
        ┌──────────▼──────────┐
        │Authenticate         │ -─→ Send username/password
        │(if required)        │     Receive ACK
        └──────────┬──────────┘
                   │
        ┌──────────▼────────┐
        │Subscribe to       │ -─→ landslide/.../
        │Command Topics     │     device/DEVICE001/command
        └──────────┬────────┘
                   │
        ┌──────────▼─────────────┐
        │Publish Status Topic    │ -─→ Status: "online"
        │(Retain=True)           │     Battery: 95%
        └──────────┬─────────────┘
                   │
 ┌─────────────────▼─────────────────┐
 │   PERIODIC DATA COLLECTION LOOP   │
 │   (Every 10-15 seconds)           │
 │                                   │
 │ 1. Read all 6 sensors             │
 │ 2. Create JSON payload            │
 │ 3. Publish each sensor topic      │
 │ 4. Wait for acknowledgment        │
 │ 5. Repeat                         │
 │                                   │
 │   CONCURRENT OPERATIONS           │
 │ • Listen for /command topics      │
 │ • Update /status every 5min       │
 │ • Send heartbeat every 30sec      │
 │ • Monitor battery level           │
 └────────────────────────────────────┘
                   │
 ┌─────────────────▼──────────────────┐
 │ Device Shutdown Detected           │
 │ (Power loss / Manual shutdown)     │
 │                                    │
 │ • Send final Status: "offline"     │
 │ • Close connection (Graceful)      │
 │ • Or broker detects disconnect     │
 └────────────────────────────────────┘
```

---

Diagram này giúp hiểu rõ kiến trúc MQTT và cách dữ liệu di chuyển qua hệ thống.
