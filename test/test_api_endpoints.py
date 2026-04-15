"""
Test Script for Enhanced API Endpoints
Tests pagination, filtering, and export functionality
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:5000"

def print_section(title):
    """Print a formatted section header"""
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}\n")

def test_health():
    """Test health check endpoint"""
    print_section("1. Health Check")
    try:
        response = requests.get(f"{BASE_URL}/api/health")
        print(f"Status: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
    except Exception as e:
        print(f"❌ Error: {e}")

def test_devices():
    """Test devices list endpoint"""
    print_section("2. List All Devices")
    try:
        response = requests.get(f"{BASE_URL}/api/devices")
        data = response.json()
        print(f"Status: {response.status_code}")
        print(f"Total devices: {len(data)}")
        if data:
            print("\nFirst device:")
            print(json.dumps(data[0], indent=2))
    except Exception as e:
        print(f"❌ Error: {e}")

def test_statistics():
    """Test statistics endpoint"""
    print_section("3. System Statistics")
    try:
        response = requests.get(f"{BASE_URL}/api/statistics")
        print(f"Status: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
    except Exception as e:
        print(f"❌ Error: {e}")

def test_sensor_data_basic():
    """Test basic sensor data endpoint with pagination"""
    print_section("4. Get Sensor Data with Pagination")
    try:
        # Get first batch
        response = requests.get(
            f"{BASE_URL}/api/sensor/tilt",
            params={
                'limit': 5,
                'offset': 0
            }
        )
        print(f"Status: {response.status_code}")
        data = response.json()
        
        if 'pagination' in data:
            print(f"\nPagination Info:")
            print(f"  Total records: {data['pagination']['total']}")
            print(f"  Page: {data['pagination']['page']}/{data['pagination']['total_pages']}")
            print(f"  Records returned: {len(data['data'])}")
            
            if data['data']:
                print(f"\nFirst record:")
                print(json.dumps(data['data'][0], indent=2))
        else:
            print("Legacy response format (no pagination)")
            print(f"Records returned: {len(data)}")
            if data:
                print(json.dumps(data[0:2], indent=2))
    except Exception as e:
        print(f"❌ Error: {e}")

def test_sensor_history_with_filters():
    """Test sensor history endpoint with date filtering"""
    print_section("5. Sensor History with Date Filtering")
    
    # Calculate date range
    end_date = datetime.now().isoformat()
    start_date = (datetime.now() - timedelta(days=7)).isoformat()
    
    print(f"Date range: {start_date[:19]} to {end_date[:19]}")
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/sensor-history",
            params={
                'sensor_type': 'tilt',
                'start_date': start_date,
                'end_date': end_date,
                'limit': 10,
                'offset': 0
            }
        )
        print(f"\nStatus: {response.status_code}")
        data = response.json()
        
        if 'error' not in data:
            print(f"Pagination Info:")
            print(f"  Total records: {data['pagination']['total']}")
            print(f"  Records returned: {len(data['data'])}")
            
            if data['data']:
                print(f"\nFirst record:")
                print(json.dumps(data['data'][0], indent=2))
        else:
            print(json.dumps(data, indent=2))
    except Exception as e:
        print(f"❌ Error: {e}")

def test_device_filter():
    """Test filtering by specific device"""
    print_section("6. Filter by Device ID")
    
    try:
        # First get a device ID from the devices list
        response = requests.get(f"{BASE_URL}/api/devices")
        devices = response.json()
        
        if devices:
            device_id = devices[0]['device_id']
            print(f"Testing with device: {device_id}\n")
            
            response = requests.get(
                f"{BASE_URL}/api/sensor-history",
                params={
                    'sensor_type': 'vibration',
                    'device_id': device_id,
                    'limit': 5
                }
            )
            print(f"Status: {response.status_code}")
            data = response.json()
            
            if 'error' not in data:
                print(f"Total records for {device_id}: {data['pagination']['total']}")
                if data['data']:
                    print(f"\nFirst record:")
                    print(json.dumps(data['data'][0], indent=2))
        else:
            print("No devices found. Please register a device first.")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_export_csv():
    """Test CSV export endpoint"""
    print_section("7. Export to CSV")
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/export/csv",
            params={
                'sensor_type': 'displacement',
                'limit': 10
            }
        )
        
        print(f"Status: {response.status_code}")
        print(f"Content-Type: {response.headers.get('Content-Type', 'N/A')}")
        print(f"Content-Disposition: {response.headers.get('Content-Disposition', 'N/A')}")
        
        # Show first 500 characters of CSV
        csv_content = response.text
        print(f"\nCSV Preview (first 500 chars):")
        print("-" * 70)
        print(csv_content[:500])
        if len(csv_content) > 500:
            print("... (truncated)")
        print("-" * 70)
        
        # Save to file
        filename = f"export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        with open(f"/tmp/{filename}", 'w') as f:
            f.write(csv_content)
        print(f"\n✅ CSV exported to /tmp/{filename}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

def test_export_json():
    """Test JSON export endpoint"""
    print_section("8. Export to JSON")
    
    try:
        end_date = datetime.now().isoformat()
        start_date = (datetime.now() - timedelta(days=1)).isoformat()
        
        response = requests.get(
            f"{BASE_URL}/api/export/json",
            params={
                'sensor_type': 'rainfall',
                'start_date': start_date,
                'end_date': end_date
            }
        )
        
        print(f"Status: {response.status_code}")
        print(f"Content-Type: {response.headers.get('Content-Type', 'N/A')}")
        
        try:
            data = response.json()
            print(f"\nJSON Structure:")
            print(f"  Export timestamp: {data.get('export_timestamp')}")
            print(f"  Total records: {data.get('total_records')}")
            print(f"  Filters applied:")
            for key, value in data.get('filters', {}).items():
                print(f"    - {key}: {value}")
            
            if data.get('data'):
                print(f"\nFirst record sample:")
                print(json.dumps(data['data'][0], indent=2))
            
            # Save to file
            filename = f"export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(f"/tmp/{filename}", 'w') as f:
                json.dump(data, f, indent=2)
            print(f"\n✅ JSON exported to /tmp/{filename}")
        except:
            print(response.text[:500])
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_error_handling():
    """Test error handling"""
    print_section("9. Error Handling")
    
    try:
        # Missing required parameter
        response = requests.get(f"{BASE_URL}/api/sensor-history")
        print("Missing sensor_type parameter:")
        print(f"Status: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
        
        # Invalid pagination
        response = requests.get(
            f"{BASE_URL}/api/sensor/tilt",
            params={'limit': 10000}  # Over limit
        )
        print(f"\nLarge limit parameter (should be capped at 1000):")
        print(f"Status: {response.status_code}")
        if 'pagination' in response.json():
            print(f"Limit applied: {response.json()['pagination']['limit']}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    """Run all tests"""
    print("\n" + "="*70)
    print("  ENHANCED API ENDPOINTS TEST SUITE")
    print("  Server: http://localhost:5000")
    print("="*70)
    
    try:
        test_health()
        test_devices()
        test_statistics()
        test_sensor_data_basic()
        test_sensor_history_with_filters()
        test_device_filter()
        test_export_csv()
        test_export_json()
        test_error_handling()
        
        print_section("✅ ALL TESTS COMPLETED")
        
    except KeyboardInterrupt:
        print("\n\n❌ Tests interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")

if __name__ == '__main__':
    main()
