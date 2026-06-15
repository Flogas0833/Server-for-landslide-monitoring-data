#!/bin/bash

# ============================================================================
# Database Management Script
# Usage: ./scripts/manage_db.sh [init|reset|seed|status|backup|restore]
# ============================================================================

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DATABASE_DIR="$PROJECT_ROOT/database"
VENV_PYTHON="$PROJECT_ROOT/.venv/bin/python"

# Check if venv Python exists
if [ ! -f "$VENV_PYTHON" ]; then
    VENV_PYTHON="python3"
fi

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default values
COMMAND=${1:-help}
DB_PATH="$DATABASE_DIR/sensors.db"
BACKUP_DIR="$DATABASE_DIR/backups"

# ============================================================================
# FUNCTIONS
# ============================================================================

print_header() {
    echo -e "\n${BLUE}════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Initialize database
init_database() {
    print_header "Initializing Database"
    
    # Ensure directory exists
    mkdir -p "$DATABASE_DIR"
    print_success "Database directory ready"
    
    # Run initialization
    cd "$PROJECT_ROOT"
    $VENV_PYTHON -c "
import sys
sys.path.insert(0, 'backend')
from db_init import initialize_app_database
print()
initialize_app_database()
"
    
    if [ $? -eq 0 ]; then
        print_success "Database initialized successfully"
    else
        print_error "Failed to initialize database"
        exit 1
    fi
}

# Reset database (delete and recreate)
reset_database() {
    print_header "Resetting Database"
    
    if [ -f "$DB_PATH" ]; then
        print_info "Backing up existing database..."
        mkdir -p "$BACKUP_DIR"
        BACKUP_FILE="$BACKUP_DIR/sensors.db.backup_$(date +%Y%m%d_%H%M%S)"
        cp "$DB_PATH" "$BACKUP_FILE"
        print_success "Backup created: $BACKUP_FILE"
        
        print_info "Deleting existing database..."
        rm "$DB_PATH"
        print_success "Database deleted"
    else
        print_info "No existing database to backup"
    fi
    
    # Initialize fresh
    init_database
}

# Seed database with fresh data
seed_database() {
    print_header "Seeding Database"
    
    cd "$PROJECT_ROOT"
    $VENV_PYTHON -c "
import sys
sys.path.insert(0, 'backend')
from db_init import SensorDatabase, seed_database
print()
db = SensorDatabase()
seed_database(db, force=True)
"
    
    if [ $? -eq 0 ]; then
        print_success "Database seeded successfully"
    else
        print_error "Failed to seed database"
        exit 1
    fi
}

# Show database status
show_status() {
    print_header "Database Status"
    
    if [ ! -f "$DB_PATH" ]; then
        print_error "Database does not exist: $DB_PATH"
        echo "Run: ./scripts/manage_db.sh init"
        return 1
    fi
    
    print_success "Database file exists"
    echo -e "Location: ${YELLOW}$DB_PATH${NC}"
    echo -e "Size: ${YELLOW}$(du -h "$DB_PATH" | cut -f1)${NC}"
    echo ""
    
    # Show user count
    print_info "Users in database:"
    $VENV_PYTHON -c "
import sys
sys.path.insert(0, 'backend')
from database import SensorDatabase
db = SensorDatabase()
users = db.get_all_users()
if users:
    for user in users:
        print(f'  • {user[\"username\"]:15} ({user[\"role\"]:10}) - {user[\"email\"]}')
else:
    print('  No users found')
" 2>/dev/null || echo "  (Could not query users)"
    
    # Show device count
    print_info "Devices in database:"
    $VENV_PYTHON -c "
import sys
sys.path.insert(0, 'backend')
from database import SensorDatabase
db = SensorDatabase()
devices = db.get_all_devices()
if devices:
    print(f'  Total: {len(devices)} device(s)')
else:
    print('  No devices found')
" 2>/dev/null || echo "  (Could not query devices)"
    
    # Show recent readings
    print_info "Recent readings:"
    $VENV_PYTHON -c "
import sys
sys.path.insert(0, 'backend')
from database import SensorDatabase
db = SensorDatabase()
readings = db.get_latest_sensor_readings(limit=5)
if readings:
    print(f'  Total readings: {db.get_sensor_reading_count()}')
else:
    print('  No readings found')
" 2>/dev/null || echo "  (Could not query readings)"
    
    echo ""
}

# Create backup
backup_database() {
    print_header "Backing Up Database"
    
    if [ ! -f "$DB_PATH" ]; then
        print_error "Database does not exist: $DB_PATH"
        return 1
    fi
    
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/sensors.db.backup_$(date +%Y%m%d_%H%M%S)"
    cp "$DB_PATH" "$BACKUP_FILE"
    
    print_success "Database backed up"
    echo "Backup file: ${YELLOW}$BACKUP_FILE${NC}"
    echo "Size: $(du -h "$BACKUP_FILE" | cut -f1)"
    echo ""
}

# List backups
list_backups() {
    print_header "Available Backups"
    
    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR 2>/dev/null)" ]; then
        print_info "No backups found"
        return
    fi
    
    ls -lh "$BACKUP_DIR" | grep -v '^total' | awk '{print "  " $9 " (" $5 ")"}'
    echo ""
}

# Restore from backup
restore_database() {
    print_header "Restoring From Backup"
    
    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR 2>/dev/null)" ]; then
        print_error "No backups found"
        return 1
    fi
    
    # Show available backups
    echo "Available backups:"
    ls -1 "$BACKUP_DIR" | nl
    echo ""
    
    read -p "Enter backup number to restore: " backup_num
    
    BACKUP_FILE=$(ls -1 "$BACKUP_DIR" | sed -n "${backup_num}p")
    
    if [ -z "$BACKUP_FILE" ]; then
        print_error "Invalid selection"
        return 1
    fi
    
    print_info "Creating backup of current database..."
    if [ -f "$DB_PATH" ]; then
        CURRENT_BACKUP="$BACKUP_DIR/sensors.db.backup_before_restore_$(date +%Y%m%d_%H%M%S)"
        cp "$DB_PATH" "$CURRENT_BACKUP"
        print_success "Current database backed up to: $CURRENT_BACKUP"
    fi
    
    print_info "Restoring: $BACKUP_FILE"
    cp "$BACKUP_DIR/$BACKUP_FILE" "$DB_PATH"
    print_success "Database restored successfully"
    echo ""
}

# Show help
show_help() {
    cat << 'EOF'

╔════════════════════════════════════════════════════════════════════════════╗
║                     DATABASE MANAGEMENT SCRIPT                             ║
╚════════════════════════════════════════════════════════════════════════════╝

USAGE:
  ./scripts/manage_db.sh [COMMAND]

COMMANDS:

  init               Initialize database (creates tables and seeds with defaults)
  reset              Reset database (delete and recreate with seed)
  seed               Re-seed database with default users and data
  status             Show database status, user count, and recent data
  backup             Create a backup of current database
  backups            List all available backups
  restore            Restore database from a backup
  help               Show this help message

EXAMPLES:

  # Initialize a new database
  ./scripts/manage_db.sh init

  # Show current database status
  ./scripts/manage_db.sh status

  # Create a backup
  ./scripts/manage_db.sh backup

  # Reset database to fresh state
  ./scripts/manage_db.sh reset

DATABASE LOCATION:
  database/sensors.db

BACKUPS LOCATION:
  database/backups/

DEFAULT CREDENTIALS:
  Username: admin      | Password: admin123    | Role: admin
  Username: operator   | Password: operator123  | Role: operator
  Username: user       | Password: user123      | Role: user

⚠️  IMPORTANT: Change default passwords in production!

EOF
}

# ============================================================================
# MAIN
# ============================================================================

case "$COMMAND" in
    init)
        init_database
        ;;
    reset)
        read -p "Are you sure you want to reset the database? This cannot be undone. (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            reset_database
        else
            print_info "Operation cancelled"
        fi
        ;;
    seed)
        seed_database
        ;;
    status)
        show_status
        ;;
    backup)
        backup_database
        ;;
    backups)
        list_backups
        ;;
    restore)
        restore_database
        ;;
    help|--help|-h|"")
        show_help
        ;;
    *)
        print_error "Unknown command: $COMMAND"
        echo ""
        show_help
        exit 1
        ;;
esac

exit 0
