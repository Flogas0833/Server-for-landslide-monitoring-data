/*
 * Interactive Map using Leaflet.js and OpenStreetMap
 * Displays sensor locations from the monitoring system
 */

let map;
let markers = {};
let devicesData = [];
let selectedDeviceId = null;

// Initialize map when page loads
document.addEventListener('DOMContentLoaded', initializeMap);

function initializeMap() {
    // Create map centered on Vietnam (Hanoi area)
    map = L.map('map').setView([21.0285, 105.8542], 10);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 2
    }).addTo(map);

    // Add zoom controls
    L.control.zoom({ position: 'topleft' }).addTo(map);

    // Add scale
    L.control.scale().addTo(map);

    // Add geocoder search
    L.Control.geocoder().addTo(map);

    // Load devices and markers
    loadDevices();

    // Refresh data every 10 seconds
    setInterval(loadDevices, 10000);
}

/**
 * Load all devices from API and update markers
 */
function loadDevices() {
    fetch('/api/devices')
        .then(response => response.json())
        .then(devices => {
            devicesData = devices;
            updateMarkers(devices);
            updateDeviceList(devices);
            updateHeader(devices);
        })
        .catch(error => console.error('Error loading devices:', error));
}

/**
 * Update map markers for all devices
 */
function updateMarkers(devices) {
    const currentMarkers = new Set();

    devices.forEach(device => {
        const markerId = device.device_id;
        currentMarkers.add(markerId);

        if (!markers[markerId]) {
            // Create new marker
            const marker = createMarker(device);
            markers[markerId] = marker;
        } else {
            // Update existing marker position
            markers[markerId].setLatLng([device.latitude, device.longitude]);
        }
    });

    // Remove markers for devices no longer in list
    Object.keys(markers).forEach(markerId => {
        if (!currentMarkers.has(markerId)) {
            map.removeLayer(markers[markerId]);
            delete markers[markerId];
        }
    });
}

/**
 * Create a custom marker for a device
 */
function createMarker(device) {
    const customIcon = L.divIcon({
        html: `<div class="sensor-marker ${getStatusClass(device.status)}">
                    🛰️
                </div>`,
        iconSize: [40, 40],
        className: 'custom-marker'
    });

    const marker = L.marker([device.latitude, device.longitude], {
        icon: customIcon,
        title: device.name
    }).addTo(map);

    // Bind popup with device info
    const popupContent = `
        <div style="font-size: 0.85rem;">
            <strong>${device.name}</strong><br/>
            <small>ID: ${device.device_id}</small><br/>
            <small>Tọa độ: ${device.latitude.toFixed(6)}, ${device.longitude.toFixed(6)}</small><br/>
            ${device.altitude ? `<small>Độ cao: ${device.altitude.toFixed(1)}m</small><br/>` : ''}
            <small>Cập nhật: ${formatTime(device.last_update)}</small><br/>
            <a href="#" onclick="showDeviceDetails('${device.device_id}'); return false;" 
               style="color: #3498db; text-decoration: none;">
                → Xem chi tiết
            </a>
        </div>
    `;

    marker.bindPopup(popupContent);

    // Click event to show details
    marker.on('click', () => {
        selectedDeviceId = device.device_id;
        showDeviceDetails(device.device_id);
    });

    return marker;
}

/**
 * Get status CSS class for marker
 */
function getStatusClass(status) {
    switch (status) {
        case 'danger':
            return 'danger';
        case 'warning':
            return 'warning';
        default:
            return 'active';
    }
}

/**
 * Show device details in popup
 */
function showDeviceDetails(deviceId) {
    fetch(`/api/device/${deviceId}`)
        .then(response => response.json())
        .then(data => {
            displayDevicePopup(deviceId, data);
        })
        .catch(error => {
            console.error('Error fetching device details:', error);
            showError('Không thể tải chi tiết cảm biến');
        });
}

/**
 * Display device details popup
 */
function displayDevicePopup(deviceId, data) {
    const device = devicesData.find(d => d.device_id === deviceId);
    if (!device) return;

    const popup = document.getElementById('device-popup');
    const popupHeader = document.getElementById('popup-device-id');
    const popupContent = document.getElementById('popup-content');

    popupHeader.textContent = `📍 ${device.name}`;

    let htmlContent = `
        <div class="popup-section">
            <div class="popup-section-title">📍 Vị Trí</div>
            <div class="popup-item">
                <span class="popup-label">Vĩ độ:</span>
                <span class="popup-value">${device.latitude.toFixed(6)}°</span>
            </div>
            <div class="popup-item">
                <span class="popup-label">Kinh độ:</span>
                <span class="popup-value">${device.longitude.toFixed(6)}°</span>
            </div>
            ${device.altitude ? `
            <div class="popup-item">
                <span class="popup-label">Độ cao:</span>
                <span class="popup-value">${device.altitude.toFixed(1)} m</span>
            </div>
            ` : ''}
            <div class="popup-item">
                <span class="popup-label">Trạng thái:</span>
                <span class="popup-value">${device.status === 'active' ? '✓ Hoạt động' : '✗ Không hoạt động'}</span>
            </div>
            <div class="popup-item">
                <span class="popup-label">Cập nhật lần cuối:</span>
                <span class="popup-value">${formatTime(device.last_update)}</span>
            </div>
        </div>
    `;

    // Add latest sensor readings
    if (data.readings) {
        htmlContent += `<div class="popup-section">
            <div class="popup-section-title">📊 Dữ Liệu Cảm Biến</div>`;

        // Tilt data
        if (data.readings.tilt && data.readings.tilt.length > 0) {
            const tilt = data.readings.tilt[0].data;
            htmlContent += `
                <div class="popup-item">
                    <span class="popup-label">Nghiêng (Roll):</span>
                    <span class="popup-value">${tilt.roll.toFixed(2)}°</span>
                </div>
                <div class="popup-item">
                    <span class="popup-label">Nghiêng (Pitch):</span>
                    <span class="popup-value">${tilt.pitch.toFixed(2)}°</span>
                </div>
            `;
        }

        // Displacement data
        if (data.readings.displacement && data.readings.displacement.length > 0) {
            const disp = data.readings.displacement[0].data;
            htmlContent += `
                <div class="popup-item">
                    <span class="popup-label">Dịch chuyển (Dọc):</span>
                    <span class="popup-value">${disp.horizontal.toFixed(2)} mm</span>
                </div>
                <div class="popup-item">
                    <span class="popup-label">Dịch chuyển (Ngang):</span>
                    <span class="popup-value">${disp.vertical.toFixed(2)} mm</span>
                </div>
            `;
        }

        // Vibration data
        if (data.readings.vibration && data.readings.vibration.length > 0) {
            const vib = data.readings.vibration[0].data;
            htmlContent += `
                <div class="popup-item">
                    <span class="popup-label">Tần số rung:</span>
                    <span class="popup-value">${vib.frequency.toFixed(1)} Hz</span>
                </div>
            `;
        }

        // Temperature data
        if (data.readings.temperature && data.readings.temperature.length > 0) {
            const temp = data.readings.temperature[0].data;
            htmlContent += `
                <div class="popup-item">
                    <span class="popup-label">Nhiệt độ:</span>
                    <span class="popup-value">${temp.current.toFixed(1)}°C</span>
                </div>
                <div class="popup-item">
                    <span class="popup-label">Độ ẩm:</span>
                    <span class="popup-value">${temp.humidity.toFixed(1)}%</span>
                </div>
            `;
        }

        // Rainfall data
        if (data.readings.rainfall && data.readings.rainfall.length > 0) {
            const rain = data.readings.rainfall[0].data;
            htmlContent += `
                <div class="popup-item">
                    <span class="popup-label">Cường độ mưa:</span>
                    <span class="popup-value">${rain.intensity.toFixed(1)} mm/h</span>
                </div>
            `;
        }

        htmlContent += `</div>`;
    }

    popupContent.innerHTML = htmlContent;
    popup.style.display = 'flex';

    // Center map on device
    if (map && device) {
        map.setView([device.latitude, device.longitude], 14);
    }
}

/**
 * Close device details popup
 */
function closeDevicePopup() {
    document.getElementById('device-popup').style.display = 'none';
    selectedDeviceId = null;
}

/**
 * Update device list in side panel
 */
function updateDeviceList(devices) {
    const deviceList = document.getElementById('device-list');

    if (devices.length === 0) {
        deviceList.innerHTML = '<div class="loading">Không có cảm biến hoạt động</div>';
        return;
    }

    deviceList.innerHTML = devices.map(device => `
        <div class="device-item" onclick="selectDevice('${device.device_id}')">
            <div class="device-item-title">
                <span class="device-item-status"></span>
                ${device.name}
            </div>
            <div class="device-item-info">
                🆔 ${device.device_id}<br/>
                📍 ${device.latitude.toFixed(4)}, ${device.longitude.toFixed(4)}<br/>
                ⏰ ${formatTime(device.last_update)}
            </div>
        </div>
    `).join('');
}

/**
 * Select device and show details
 */
function selectDevice(deviceId) {
    selectedDeviceId = deviceId;
    showDeviceDetails(deviceId);
}

/**
 * Filter devices by search term
 */
function filterDevices() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const deviceItems = document.querySelectorAll('.device-item');

    deviceItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(searchTerm) ? 'block' : 'none';
    });
}

/**
 * Toggle side panel on mobile
 */
function togglePanel() {
    const panel = document.querySelector('.side-panel');
    panel.classList.toggle('open');
}

/**
 * Update header with device count
 */
function updateHeader(devices) {
    document.getElementById('device-count').textContent = `Cảm biến: ${devices.length}`;
    if (devices.length > 0) {
        const lastUpdate = devices.reduce((latest, device) =>
            new Date(device.last_update) > new Date(latest.last_update) ? device : latest
        );
        document.getElementById('last-update').textContent = `Cập nhật: ${formatTime(lastUpdate.last_update)}`;
    }
}

/**
 * Format timestamp to readable format
 */
function formatTime(timestamp) {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Show error message
 */
function showError(message) {
    console.error(message);
    // Could show a toast notification here
}
