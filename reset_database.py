#!/usr/bin/env python3
"""
Database Reset Script - Xóa toàn bộ dữ liệu cũ và tái khởi tạo database
"""

import os
import sys
import sqlite3
from pathlib import Path

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.database import SensorDatabase


def confirm_deletion():
    """Ask for confirmation before deletion"""
    print("=" * 60)
    print("⚠️  CẢNH BÁO: BẠN SẮP XÓA TOÀN BỘ DATABASE")
    print("=" * 60)
    print("\nAction: Xóa tất cả dữ liệu sensor cũ")
    print("Dữ liệu sẽ KHÔNG THỂ PHỤC HỒI được")
    print("\nNhập 'YES' để xác nhận xóa: ", end="")
    
    response = input().strip().upper()
    return response == "YES"


def reset_database():
    """Reset database - delete only sensor_readings data, keep other tables intact"""
    db_path = os.path.join(os.path.dirname(__file__), "database", "sensors.db")
    
    try:
        # Check if database exists
        if os.path.exists(db_path):
            print(f"📁 Tìm thấy database: {db_path}")
            print(f"📊 Kích thước: {os.path.getsize(db_path) / 1024:.2f} KB")
            
            # Ask for confirmation
            if not confirm_deletion():
                print("\n❌ Hủy thao tác xóa database")
                return False
            
            # Connect to database and clear only sensor_readings
            print("\n🗑️  Đang xóa dữ liệu sensor_readings...")
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Delete only sensor_readings data
            cursor.execute("DELETE FROM sensor_readings")
            cursor.execute("DELETE FROM sqlite_sequence WHERE name='sensor_readings'")
            
            conn.commit()
            conn.close()
            print("✅ Xóa dữ liệu thành công - Các bảng khác vẫn nguyên vẹn")
        else:
            print(f"ℹ️  Database không tồn tại: {db_path}")
            # Initialize database if it doesn't exist
            print("\n🔄 Đang khởi tạo database mới...")
            db = SensorDatabase(db_path)
            print("✅ Khởi tạo thành công")
        
        # Verify
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
        tables = cursor.fetchall()
        
        # Get row counts for each table
        print("\n" + "=" * 60)
        print("✨ HOÀN TẤT RESET DATABASE")
        print("=" * 60)
        print(f"📁 Database: {db_path}")
        print(f"📊 Bảng hiện có:")
        for table in tables:
            table_name = table[0]
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            print(f"   - {table_name}: {count} bản ghi")
        
        conn.close()
        print("\n✅ Database sẵn sàng sử dụng\n")
        return True
        
    except Exception as e:
        print(f"\n❌ Lỗi: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = reset_database()
    sys.exit(0 if success else 1)
