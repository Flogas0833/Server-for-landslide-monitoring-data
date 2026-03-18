# SETUP HƯỚNG DẪN MQTT

## 1. INSTALLATION & SETUP

### A. Cài đặt Mosquitto MQTT Broker (Linux/Ubuntu)

```bash
# Update package list
sudo apt-get update

# Install mosquitto
sudo apt-get install -y mosquitto mosquitto-clients

# Verify installation
mosquitto -v

# Check status
sudo systemctl status mosquitto

# Enable on startup
sudo systemctl enable mosquitto

# Start service
sudo systemctl start mosquitto
```

### B. Cài đặt Python Dependencies

```bash
# Navigate to project directory
cd /home/tlam/codes/Server-for-landslide-monitoring-data

# Install required packages
pip install -r requirements_mqtt.txt
```

---

## 2. MOSQUITTO CONFIGURATION

### Option 1: Default Configuration (Development)

#### Start Mosquitto with default config:
```bash
mosquitto -c mosquitto.conf
```

#### Or run as service:
```bash
sudo systemctl restart mosquitto
sudo systemctl status mosquitto
```

### Option 2: Configure with ACL & Authentication (Production)

#### Step 1: Copy configuration files
```bash
sudo cp mosquitto.conf /etc/mosquitto/
sudo cp mosquitto_acl.conf /etc/mosquitto/
```

#### Step 2: Create password file
```bash
# Create password file for user authentication
sudo mosquitto_passwd -c /etc/mosquitto/passwd device001
# Enter password when prompted

# Add more users
sudo mosquitto_passwd -b /etc/mosquitto/passwd device002 <password>
sudo mosquitto_passwd -b /etc/mosquitto/passwd server <password>
sudo mosquitto_passwd -b /etc/mosquitto/passwd admin <password>
```

#### Step 3: Update mosquitto.conf
```bash
sudo nano /etc/mosquitto/mosquitto.conf

# Uncomment/add these lines:
# allow_anonymous false
# password_file /etc/mosquitto/passwd
# acl_file /etc/mosquitto/acl.conf
```

#### Step 4: Restart service
```bash
sudo systemctl restart mosquitto
```

---

## 3. TEST MQTT CONNECTION

### Test 1: Check Broker is Running
```bash
# Check if mosquitto is listening on port 1883
netstat -tulpn | grep 1883

# Or
ss -tulpn | grep 1883
```

### Test 2: Subscribe to Topic
```bash
# Terminal 1: Subscribe to all landslide topics
mosquitto_sub -h localhost -p 1883 -t "landslide/#" -v

# Or specific device
mosquitto_sub -h localhost -p 1883 -t "landslide/project/PRJ001/+/device/+/data/#" -v
```

### Test 3: Publish Test Message
```bash
# Terminal 2: Publish test data
mosquitto_pub -h localhost -p 1883 -t "landslide/project/PRJ001/site/SITE01/device/DEVICE001/data/test" -m "Hello MQTT"
```

### Test 4: With Authentication
```bash
# Subscribe with username/password
mosquitto_sub -h localhost -p 1883 -u device001 -P <password> -t "landslide/#" -v

# Publish with authentication
mosquitto_pub -h localhost -p 1883 -u device001 -P <password> -t "topic" -m "message"
```

---

## 4. RUN PYTHON APPLICATIONS

### Step 1: Run MQTT Subscriber (Server)
```bash
# Terminal 1
python mqtt_subscriber.py

# Expected output:
# ✓ Connected to MQTT broker: localhost:1883
# → Subscribed to: landslide/project/PRJ001/+/device/+/data/#
# Listening for sensor data... (Press Ctrl+C to stop)
```

### Step 2: Run MQTT Publisher (Device Simulator)
```bash
# Terminal 2
python mqtt_publisher.py

# Expected output:
# ✓ Connected to MQTT broker: localhost:1883
#   Device ID: DEVICE001
# 
# ============================================================
# Starting sensor simulation for 300s
# Measurement interval: 15s
# ============================================================
# 
# [10:30:45] Sending measurements...
# [TILT] Roll: 5.23°, Pitch: 3.45°
# [VIBRATION] Frequency: 5.2Hz, Peak: 0.45g
# ...
```

### Step 3: Monitor in Real-time
```bash
# Terminal 3 (optional)
mosquitto_sub -h localhost -p 1883 -t "landslide/#" -v

# Will show all published messages in real-time
```

---

## 5. CONFIGURATION DETAILS

### mosquitto.conf (Key Settings)
```
listener 1883                    # Port for MQTT
protocol mqtt                    # Protocol version
persistence true                 # Store messages on disk
max_connections -1              # Unlimited connections
keepalive_interval 60           # Client keepalive (seconds)
message_size_limit 0            # No message size limit
```

### mosquitto_acl.conf (Access Control)
```
user device001                   # Username
topic write landslide/.../+      # Can publish to these topics
topic read landslide/.../+/cmd   # Can subscribe to these topics
```

---

## 6. MONITORING MQTT BROKER

### View Broker Statistics
```bash
# Subscribe to system topics
mosquitto_sub -h localhost -p 1883 -t "\$SYS/#" -v

# Common system topics:
# $SYS/broker/clients/connected
# $SYS/broker/clients/disconnected
# $SYS/broker/messages/stored
# $SYS/broker/publish/messages/received
# $SYS/broker/subscribe/count
```

### View Broker Logs
```bash
# Real-time logs
sudo journalctl -u mosquitto -f

# Or check log file
sudo tail -f /var/log/mosquitto/mosquitto.log
```

---

## 7. TROUBLESHOOTING

### Issue: Connection Refused
```bash
# Check if mosquitto is running
sudo systemctl status mosquitto

# If not running, start it
sudo systemctl start mosquitto

# Check port is listening
netstat -tulpn | grep 1883
```

### Issue: Authentication Failed
```bash
# Check if ACL is configured
grep "acl_file" /etc/mosquitto/mosquitto.conf

# Verify password file exists
ls -la /etc/mosquitto/passwd

# Check ACL file exists
ls -la /etc/mosquitto/acl.conf
```

### Issue: Messages Not Delivered
```bash
# Check broker is running and accepting connections
mosquitto_sub -h localhost -p 1883 -t "\$SYS/broker/clients/connected"

# Verify topic names match exactly (case-sensitive)

# Check message persistence
ls -la /var/lib/mosquitto/
```

### Issue: High Memory Usage
```bash
# Check broker process
ps aux | grep mosquitto

# Reduce message persistence
# Edit mosquitto.conf: autosave_interval 1800

# Restart
sudo systemctl restart mosquitto
```

---

## 8. PERFORMANCE TUNING

### For High Volume (1000+ devices)

#### mosquitto.conf modifications:
```conf
# Increase limits
max_inflight_messages 1000
max_queued_messages 10000
max_connections 2000

# Performance
autosave_interval 3600
persistence false (if using database instead)

# Network
tcp_backlog 4096
listener 1883
max_connections -1
```

#### Run multiple listeners:
```conf
listener 1883
listener 1884
listener 1885
```

---

## 9. DOCKER SETUP (Alternative)

### Run Mosquitto in Docker
```bash
# Pull image
docker pull eclipse-mosquitto

# Run container
docker run -d \
  --name mosquitto \
  -p 1883:1883 \
  -p 9001:9001 \
  -v mosquitto_data:/mosquitto/data \
  -v mosquitto_logs:/mosquitto/log \
  -v $(pwd)/mosquitto.conf:/mosquitto/config/mosquitto.conf:ro \
  eclipse-mosquitto

# Check status
docker ps
docker logs mosquitto
```

---

## 10. QUICK START SCRIPT

Create a bash script `run_mqtt_system.sh`:

```bash
#!/bin/bash

# Start MQTT Broker
echo "Starting MQTT Broker..."
sudo systemctl start mosquitto
sleep 2
echo "Broker started ✓"

# Run Subscriber in background
echo "Starting Data Subscriber..."
python mqtt_subscriber.py &
SUB_PID=$!
sleep 2

# Run Publisher
echo "Starting Sensor Publisher..."
python mqtt_publisher.py
PUB_PID=$!

# Cleanup
trap "kill $SUB_PID $PUB_PID 2>/dev/null" EXIT

wait
```

### Make it executable and run:
```bash
chmod +x run_mqtt_system.sh
./run_mqtt_system.sh
```

---

## 11. FILE STRUCTURE

```
Server-for-landslide-monitoring-data/
├── MQTT_PROTOCOL_DESIGN.md        # Protocol specification
├── mqtt_publisher.py              # Device simulator
├── mqtt_subscriber.py             # Server data receiver
├── mosquitto.conf                 # Broker configuration
├── mosquitto_acl.conf             # Access control list
├── requirements_mqtt.txt          # Python dependencies
└── MQTT_SETUP.md                 # This file
```

---

## 12. NEXT STEPS

1. ✅ Install Mosquitto broker
2. ✅ Install Python dependencies
3. ✅ Configure MQTT broker
4. ✅ Test connections
5. ✅ Run publisher & subscriber
6. ⏳ Integrate with database
7. ⏳ Add data visualization
8. ⏳ Deploy to production

---

## REFERENCE LINKS

- Mosquitto Documentation: https://mosquitto.org/
- MQTT Standard: https://mqtt.org/
- Paho Python Client: https://github.com/eclipse/paho.mqtt.python
