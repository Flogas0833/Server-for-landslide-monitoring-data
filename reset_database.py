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
    """Reset database - delete old data and reinitialize"""
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
            
            # Delete old database file
            print("\n🗑️  Đang xóa file database cũ...")
            os.remove(db_path)
            print("✅ Xóa thành công")
        else:
            print(f"ℹ️  Database không tồn tại: {db_path}")
        
        # Reinitialize database
        print("\n🔄 Đang tái khởi tạo database...")
        db = SensorDatabase(db_path)
        print("✅ Tái khởi tạo thành công")
        
        # Verify
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        conn.close()
        
        print("\n" + "=" * 60)
        print("✨ HOÀN TẤT RESET DATABASE")
        print("=" * 60)
        print(f"📁 Database: {db_path}")
        print(f"📊 Tables tạo mới: {len(tables)}")
        for table in tables:
            print(f"   - {table[0]}")
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
