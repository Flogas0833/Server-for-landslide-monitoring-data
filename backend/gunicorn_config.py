# ============================================================================
# Gunicorn Configuration for Production
# Usage: gunicorn -c backend/gunicorn_config.py backend.web_server:app
# ============================================================================

import multiprocessing
import os
from datetime import datetime

# Server Socket
bind = os.environ.get('API_HOST', '0.0.0.0') + ':' + os.environ.get('API_PORT', '5000')
backlog = 2048

# Worker Processes
workers = int(os.environ.get('API_WORKERS', multiprocessing.cpu_count() * 2 + 1))
worker_class = 'sync'  # 'sync', 'eventlet', 'gevent', 'tornado', 'gthread'
worker_connections = 1000
keepalive = 2

# Timeout
timeout = 60
graceful_timeout = 30

# Logging
accesslog = os.path.join(os.path.dirname(__file__), '..', 'logs', 'access.log')
errorlog = os.path.join(os.path.dirname(__file__), '..', 'logs', 'error.log')
loglevel = os.environ.get('LOG_LEVEL', 'info').lower()

# Log format
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = 'landslide-monitoring'

# Server mechanics
daemon = False
pidfile = os.path.join(os.path.dirname(__file__), '..', 'logs', 'gunicorn.pid')
umask = 0
user = None
group = None
tmp_upload_dir = None

# SSL (uncomment if using SSL)
# keyfile = '/path/to/keyfile'
# certfile = '/path/to/certfile'
# ssl_version = 'TLSv1_2'

# Server Hooks
def on_starting(server):
    """Called when the master process is initializing."""
    print(f"[{datetime.now()}] Gunicorn starting with {workers} workers...")

def when_ready(server):
    """Called when the arbiter has loaded the application and is ready."""
    print(f"[{datetime.now()}] Gunicorn is ready. Spawning workers")

def on_exit(server):
    """Called when the arbiter is stopping."""
    print(f"[{datetime.now()}] Gunicorn master shutdown...")

# Application
wsgi_app = 'backend.web_server:app'
paste = None
proxy_protocol = True
proxy_allow_ips = ['*']  # Set to specific IPs in production

# Reloading
reload = False
reload_extra_files = []

# SSL redirect (uncomment to enable)
# secure_scheme_headers = {
#     'X-FORWARDED-PROTOCOL': 'ssl',
#     'X-FORWARDED-PROTO': 'https',
#     'X-FORWARDED-SSL': 'on',
# }

print(f"""
╔════════════════════════════════════════════════════════════╗
║   Landslide Monitoring System - Gunicorn Configuration    ║
╠════════════════════════════════════════════════════════════╣
║ Bind:          {bind:<47}║
║ Workers:       {workers:<47}║
║ Worker Class:  {worker_class:<47}║
║ Timeout:       {timeout} seconds{' '*34}║
║ Log Level:     {loglevel:<47}║
║ Access Log:    {accesslog:<47}║
║ Error Log:     {errorlog:<47}║
╚════════════════════════════════════════════════════════════╝
""")
