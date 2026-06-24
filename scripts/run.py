#!/usr/bin/env python
"""
Application startup script
Handles database seeding before starting Flask server
"""

import os
import sys
import subprocess

def main():
    print("\n" + "="*70)
    print("🚀 STARTING LANDSLIDE MONITORING SYSTEM")
    print("="*70 + "\n")
    
    # Ensure we're in the app directory
    app_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(app_dir)
    
    print(f"📂 Working directory: {app_dir}\n")
    
    # Run seed script
    print("📊 Seeding database with initial data...")
    print("-"*70)
    try:
        result = subprocess.run([sys.executable, "seed_initial_data.py"], check=False)
        if result.returncode != 0:
            print(f"⚠️  Seed script exited with code {result.returncode}")
        print("-"*70 + "\n")
    except Exception as e:
        print(f"⚠️  Error running seed script: {e}\n")
    
    # Start Flask server
    print("🌐 Starting Flask server...")
    print("-"*70)
    
    try:
        # Try to use gunicorn (preferred for production)
        subprocess.run([
            sys.executable, "-m", "gunicorn",
            "--bind", "0.0.0.0:5000",
            "--workers", "4",
            "--timeout", "120",
            "--access-logfile", "-",
            "--error-logfile", "-",
            "backend.web_server:app"
        ])
    except Exception as e:
        print(f"⚠️  Gunicorn not available, falling back to Flask dev server: {e}")
        # Fallback to Flask development server
        os.environ['FLASK_APP'] = 'backend.web_server'
        os.environ['FLASK_ENV'] = 'production'
        
        import backend.web_server as web_server
        print("Starting Flask development server (production mode)...")
        web_server.app.run(host='0.0.0.0', port=5000, threaded=True)

if __name__ == "__main__":
    main()
