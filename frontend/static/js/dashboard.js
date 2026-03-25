/*
 * Dashboard JavaScript - Display sensor data tables and statistics
 */

// Load data when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadStatistics();
    loadSensorData();

    // Refresh every 5 seconds
    setInterval(() => {
        loadStatistics();
        loadSensorData();
        updateRefreshTime();
    }, 5000);

    updateRefreshTime();
});

/**
 * Load statistics
 */
function loadStatistics() {
    fetch('/api/statistics')
        .then(response => response.json())
        .then(data => {
            document.getElementById('stat-total').textContent = data.total_devices;
            document.getElementById('stat-active').textContent = data.active_devices;
            // Stat-warnings would need more complex logic to count
        })
        .catch(error => console.error('Error loading statistics:', error));
}

/**
 * Load sensor data for all types
 */
function loadSensorData() {
    const sensorTypes = ['tilt', 'vibration', 'displacement', 'rainfall', 'temperature'];

    sensorTypes.forEach(type => {
        fetch(`/api/sensor/${type}?limit=10`)
            .then(response => response.json())
            .then(data => {
                displaySensorData(type, data);
            })
            .catch(error => console.error(`Error loading ${type} data:`, error));
    });
}

/**
 * Display sensor data in table format
 */
function displaySensorData(sensorType, data) {
    const containerId = `${sensorType}-data`;
    const container = document.getElementById(containerId);

    if (!data || data.length === 0) {
        container.innerHTML = '<div class="loading">Không có dữ liệu</div>';
        return;
    }

    let html = `<table><thead><tr><th>Cảm Biến</th><th>Thời Gian</th>`;

    // Add columns based on sensor type
    switch (sensorType) {
        case 'tilt':
            html += `<th>Roll (°)</th><th>Pitch (°)</th></tr></thead><tbody>`;
            data.forEach(row => {
                const d = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
                html += `<tr>
                    <td class="device-id">${row.device_id}</td>
                    <td class="timestamp">${formatTime(row.timestamp)}</td>
                    <td class="value">${d.roll.toFixed(2)}</td>
                    <td class="value">${d.pitch.toFixed(2)}</td>
                </tr>`;
            });
            break;

        case 'vibration':
            html += `<th>Tần Số (Hz)</th><th>Biên Độ X</th><th>Biên Độ Y</th><th>Biên Độ Z</th></tr></thead><tbody>`;
            data.forEach(row => {
                const d = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
                html += `<tr>
                    <td class="device-id">${row.device_id}</td>
                    <td class="timestamp">${formatTime(row.timestamp)}</td>
                    <td class="value">${d.frequency.toFixed(1)}</td>
                    <td class="value">${d.amplitude_x.toFixed(2)}</td>
                    <td class="value">${d.amplitude_y.toFixed(2)}</td>
                    <td class="value">${d.amplitude_z.toFixed(2)}</td>
                </tr>`;
            });
            break;

        case 'displacement':
            html += `<th>Ngang (mm)</th><th>Dọc (mm)</th><th>Tổng (mm)</th><th>Tích Lũy (mm)</th></tr></thead><tbody>`;
            data.forEach(row => {
                const d = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
                const highlightClass = d.cumulative > 100 ? 'high' : '';
                html += `<tr>
                    <td class="device-id">${row.device_id}</td>
                    <td class="timestamp">${formatTime(row.timestamp)}</td>
                    <td class="value">${d.horizontal.toFixed(2)}</td>
                    <td class="value">${d.vertical.toFixed(2)}</td>
                    <td class="value">${d.total.toFixed(2)}</td>
                    <td class="value ${highlightClass}">${d.cumulative.toFixed(2)}</td>
                </tr>`;
            });
            break;

        case 'rainfall':
            html += `<th>Cường độ (mm/h)</th><th>1 Giờ (mm)</th><th>24 Giờ (mm)</th></tr></thead><tbody>`;
            data.forEach(row => {
                const d = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
                html += `<tr>
                    <td class="device-id">${row.device_id}</td>
                    <td class="timestamp">${formatTime(row.timestamp)}</td>
                    <td class="value">${d.intensity.toFixed(1)}</td>
                    <td class="value">${d.cumulative_1h.toFixed(1)}</td>
                    <td class="value">${d.cumulative_24h.toFixed(1)}</td>
                </tr>`;
            });
            break;

        case 'temperature':
            html += `<th>Nhiệt Độ (°C)</th><th>Độ Ẩm (%)</th><th>Min (°C)</th><th>Max (°C)</th></tr></thead><tbody>`;
            data.forEach(row => {
                const d = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
                html += `<tr>
                    <td class="device-id">${row.device_id}</td>
                    <td class="timestamp">${formatTime(row.timestamp)}</td>
                    <td class="value">${d.current.toFixed(1)}</td>
                    <td class="value">${d.humidity.toFixed(1)}</td>
                    <td class="value">${d.min_1h.toFixed(1)}</td>
                    <td class="value">${d.max_1h.toFixed(1)}</td>
                </tr>`;
            });
            break;
    }

    html += `</tbody></table>`;
    container.innerHTML = html;
}

/**
 * Format timestamp
 */
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

/**
 * Update refresh time display
 */
function updateRefreshTime() {
    const now = new Date();
    document.getElementById('refresh-time').textContent = `Cập nhật: ${now.toLocaleTimeString('vi-VN')}`;
}
