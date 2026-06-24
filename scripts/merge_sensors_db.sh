#!/usr/bin/env bash
set -euo pipefail

TEMPLATE="database/sensors.db.template"
BACKUP="database/sensors.db.backup_20260513_130601"
TARGET="database/sensors.db"

if [ ! -f "$TEMPLATE" ]; then
  echo "Template DB not found: $TEMPLATE" >&2
  exit 1
fi
if [ ! -f "$BACKUP" ]; then
  echo "Backup DB not found: $BACKUP" >&2
  exit 1
fi

if [ -f "$TARGET" ]; then
  echo "Backing up existing target to ${TARGET}.bak"
  cp "$TARGET" "${TARGET}.bak"
fi

echo "Copying template to $TARGET"
cp "$TEMPLATE" "$TARGET"

echo "Merging data from backup into $TARGET"
sqlite3 "$TARGET" <<'SQL'
ATTACH 'database/sensors.db.backup_20260513_130601' AS src;
PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

-- Create missing tables from backup schema
CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL,
                sensor_type TEXT NOT NULL,
                danger_level TEXT NOT NULL,
                message TEXT,
                value REAL,
                threshold REAL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                acknowledged BOOLEAN DEFAULT 0,
                acknowledged_at TIMESTAMP,
                acknowledged_by TEXT
            );

CREATE TABLE IF NOT EXISTS alert_thresholds (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sensor_type TEXT NOT NULL,
                threshold_name TEXT NOT NULL,
                threshold_value REAL NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(sensor_type, threshold_name)
            );

-- Import rows; use INSERT OR IGNORE where UNIQUE constraints exist
INSERT OR IGNORE INTO devices SELECT * FROM src.devices;
INSERT OR IGNORE INTO users SELECT * FROM src.users;
INSERT OR IGNORE INTO sensor_readings SELECT * FROM src.sensor_readings;
INSERT INTO audit_logs SELECT * FROM src.audit_logs;
INSERT OR IGNORE INTO thresholds_by_province SELECT * FROM src.thresholds_by_province;
INSERT INTO alerts SELECT * FROM src.alerts;
INSERT OR IGNORE INTO alert_thresholds SELECT * FROM src.alert_thresholds;

COMMIT;
DETACH src;
SQL

echo "Merge complete. Verifying table counts:"
sqlite3 "$TARGET" <<'SQL'
SELECT 'devices', COUNT(*) FROM devices;
SELECT 'users', COUNT(*) FROM users;
SELECT 'sensor_readings', COUNT(*) FROM sensor_readings;
SELECT 'audit_logs', COUNT(*) FROM audit_logs;
SELECT 'thresholds_by_province', COUNT(*) FROM thresholds_by_province;
SELECT 'alerts', COUNT(*) FROM alerts;
SELECT 'alert_thresholds', COUNT(*) FROM alert_thresholds;
SQL

echo "Done."
