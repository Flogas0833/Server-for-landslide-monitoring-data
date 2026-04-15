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
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Handle both new pagination format and legacy array format
                const records = data.data || data;
                displaySensorData(type, records);
            })
            .catch(error => {
                console.error(`Error loading ${type} data:`, error);
                // Show error in UI
                const containerId = `${type}-data`;
                const container = document.getElementById(containerId);
                if (container) {
                    container.innerHTML = `<div class="error">Lỗi tải dữ liệu: ${error.message}</div>`;
                }
            });
    });
}

/**
 * Display sensor data in table format
 */
function displaySensorData(sensorType, data) {
    const containerId = `${sensorType}-data`;
    const container = document.getElementById(containerId);

    // Handle null/undefined data
    if (!data) {
        container.innerHTML = '<div class="error">Không có dữ liệu</div>';
        return;
    }

    // Ensure data is array
    const records = Array.isArray(data) ? data : [];

    if (records.length === 0) {
        container.innerHTML = '<div class="loading">Không có dữ liệu</div>';
        return;
    }

    let html = `<table><thead><tr><th>Cảm Biến</th><th>Thời Gian</th>`;

    try {
        // Add columns based on sensor type
        switch (sensorType) {
            case 'tilt':
                html += `<th>Roll (°)</th><th>Pitch (°)</th></tr></thead><tbody>`;
                records.forEach(row => {
                    if (!row.device_id || !row.data) return;
                    const d = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
                    if (!d.roll || !d.pitch) return;
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
                records.forEach(row => {
                    if (!row.device_id || !row.data) return;
                    const d = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
                    if (!d.frequency || !d.amplitude_x || !d.amplitude_y || !d.amplitude_z) return;
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
                records.forEach(row => {
                    if (!row.device_id || !row.data) return;
                    const d = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
                    if (!d.horizontal || !d.vertical || !d.total || !d.cumulative) return;
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
                records.forEach(row => {
                    if (!row.device_id || !row.data) return;
                    const d = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
                    if (!d.intensity || !d.cumulative_1h || !d.cumulative_24h) return;
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
                records.forEach(row => {
                    if (!row.device_id || !row.data) return;
                    const d = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
                    if (!d.current || !d.humidity || !d.min_1h || !d.max_1h) return;
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
    } catch (error) {
        console.error(`Error displaying ${sensorType} data:`, error);
        container.innerHTML = `<div class="error">Lỗi hiển thị dữ liệu: ${error.message}</div>`;
    }
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

/**
 * Apply filters and load filtered data
 */
function applyFilters() {
    const sensorType = document.getElementById('filter-sensor').value;
    const deviceId = document.getElementById('filter-device').value;
    const startDate = document.getElementById('filter-start').value;
    const endDate = document.getElementById('filter-end').value;
    const limit = document.getElementById('filter-limit').value || 50;

    if (!sensorType) {
        showFilterMessage('Vui lòng chọn loại cảm biến', 'error');
        return;
    }

    showFilterMessage('Đang tải dữ liệu...', 'loading');

    // Build query parameters
    const params = new URLSearchParams({
        sensor_type: sensorType,
        limit: limit
    });

    if (deviceId) params.append('device_id', deviceId);
    if (startDate) params.append('start_date', new Date(startDate).toISOString());
    if (endDate) params.append('end_date', new Date(endDate).toISOString());

    // Fetch filtered data
    fetch(`/api/sensor-history?${params}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const records = data.data || data;

            // Display results
            const section = document.querySelector(`[id="${sensorType}-data"]`);
            if (section) {
                displaySensorData(sensorType, records);
            }

            // Show success message with record count
            const count = records.length || 0;
            showFilterMessage(`✅ Tìm thấy ${count} bản ghi`, 'success');
        })
        .catch(error => {
            console.error('Error applying filters:', error);
            showFilterMessage(`❌ Lỗi: ${error.message}`, 'error');
        });
}

/**
 * Reset all filters and reload default data
 */
function resetFilters() {
    document.getElementById('filter-sensor').value = 'tilt';
    document.getElementById('filter-device').value = '';
    document.getElementById('filter-start').value = '';
    document.getElementById('filter-end').value = '';
    document.getElementById('filter-limit').value = '50';
    document.getElementById('filter-message').innerHTML = '';

    // Reload all sensor data
    loadSensorData();
    showFilterMessage('✅ Đã đặt lại bộ lọc', 'success');
}

/**
 * Export sensor data as CSV or JSON
 */
function exportData(format) {
    const sensorType = document.getElementById('filter-sensor').value;
    const deviceId = document.getElementById('filter-device').value;
    const startDate = document.getElementById('filter-start').value;
    const endDate = document.getElementById('filter-end').value;

    if (!sensorType) {
        showFilterMessage('Vui lòng chọn loại cảm biến để xuất', 'error');
        return;
    }

    showFilterMessage('Đang chuẩn bị file...', 'loading');

    // Build query parameters
    const params = new URLSearchParams({
        sensor_type: sensorType,
        filename: `${sensorType}_${new Date().getTime()}`
    });

    if (deviceId) params.append('device_id', deviceId);
    if (startDate) params.append('start_date', new Date(startDate).toISOString());
    if (endDate) params.append('end_date', new Date(endDate).toISOString());

    // Determine endpoint based on format
    const endpoint = format === 'csv' ? '/api/export/csv' : '/api/export/json';

    // Download file
    fetch(`${endpoint}?${params}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Handle both direct file downloads and JSON responses
            const contentType = response.headers.get('content-type');

            if (contentType && (contentType.includes('text/csv') || contentType.includes('application/json'))) {
                return response.blob().then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${sensorType}_data.${format}`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                    showFilterMessage(`✅ File ${a.download} đã được tải xuống`, 'success');
                });
            } else {
                return response.json().then(data => {
                    if (data.error) {
                        throw new Error(data.error);
                    }
                    if (data.records === 0) {
                        throw new Error('Không có dữ liệu để xuất');
                    }

                    // Create and download JSON
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${sensorType}_data.${format}`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                    showFilterMessage(`✅ File ${a.download} đã được tải xuống (${data.records} bản ghi)`, 'success');
                });
            }
        })
        .catch(error => {
            console.error('Error exporting data:', error);
            showFilterMessage(`❌ Lỗi xuất file: ${error.message}`, 'error');
        });
}

/**
 * Show filter message
 */
function showFilterMessage(message, type) {
    const messageDiv = document.getElementById('filter-message');
    messageDiv.innerHTML = message;
    messageDiv.className = type;
}

/**
 * Global chart instance
 */
let chartInstance = null;

/**
 * Load and draw chart
 */
function loadChart() {
    const sensorType = document.getElementById('chart-sensor').value;
    const deviceId = document.getElementById('chart-device').value;
    const hours = document.getElementById('chart-hours').value;

    if (!sensorType) {
        showChartMessage('Vui lòng chọn loại cảm biến', 'error');
        return;
    }

    showChartMessage('Đang tải dữ liệu biểu đồ...', 'loading');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - hours * 60 * 60 * 1000);

    // Build parameters
    const params = new URLSearchParams({
        sensor_type: sensorType,
        limit: 500,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
    });

    if (deviceId) {
        params.append('device_id', deviceId);
    }

    // Fetch data
    fetch(`/api/sensor-history?${params}`)
        .then(response => {
            if (!response.ok) throw new Error('API error');
            return response.json();
        })
        .then(data => {
            const records = data.data || data;

            if (!records || records.length === 0) {
                showChartMessage('Không có dữ liệu để vẽ biểu đồ', 'error');
                return;
            }

            // Sort by timestamp
            records.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            // Create chart
            drawChart(sensorType, records);
            showChartMessage(`✅ Biểu đồ vẽ thành công (${records.length} điểm dữ liệu)`, 'success');
        })
        .catch(error => {
            console.error('Chart error:', error);
            showChartMessage(`❌ Lỗi: ${error.message}`, 'error');
        });
}

/**
 * Draw chart based on sensor type
 */
function drawChart(sensorType, records) {
    const ctx = document.getElementById('dataChart').getContext('2d');

    let datasets = [];
    let labels = [];

    // Format time labels
    labels = records.map(r => {
        const date = new Date(r.timestamp);
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    });

    // Extract data based on sensor type
    switch (sensorType) {
        case 'tilt':
            datasets = [
                {
                    label: 'Roll (°)',
                    data: records.map(r => extract(r.data, 'roll')),
                    borderColor: '#FF6384',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 3
                },
                {
                    label: 'Pitch (°)',
                    data: records.map(r => extract(r.data, 'pitch')),
                    borderColor: '#4BC0C0',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 3
                }
            ];
            break;

        case 'vibration':
            datasets = [
                {
                    label: 'Tần Số (Hz)',
                    data: records.map(r => extract(r.data, 'frequency')),
                    borderColor: '#FF9F40',
                    backgroundColor: 'rgba(255, 159, 64, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 3
                },
                {
                    label: 'Biên Độ X',
                    data: records.map(r => extract(r.data, 'amplitude_x')),
                    borderColor: '#36A2EB',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 3
                },
                {
                    label: 'Biên Độ Y',
                    data: records.map(r => extract(r.data, 'amplitude_y')),
                    borderColor: '#9966FF',
                    backgroundColor: 'rgba(153, 102, 255, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 3
                }
            ];
            break;

        case 'displacement':
            datasets = [
                {
                    label: 'Ngang (mm)',
                    data: records.map(r => extract(r.data, 'horizontal')),
                    borderColor: '#FF6384',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 3
                },
                {
                    label: 'Dọc (mm)',
                    data: records.map(r => extract(r.data, 'vertical')),
                    borderColor: '#36A2EB',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 3
                },
                {
                    label: 'Tích Lũy (mm)',
                    data: records.map(r => extract(r.data, 'cumulative')),
                    borderColor: '#FF0000',
                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    pointRadius: 4
                }
            ];
            break;

        case 'rainfall':
            datasets = [
                {
                    label: 'Cường Độ (mm/h)',
                    data: records.map(r => extract(r.data, 'intensity')),
                    borderColor: '#4BC0C0',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 3
                },
                {
                    label: '1 Giờ (mm)',
                    data: records.map(r => extract(r.data, 'cumulative_1h')),
                    borderColor: '#36A2EB',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 3
                }
            ];
            break;

        case 'temperature':
            datasets = [
                {
                    label: 'Nhiệt Độ (°C)',
                    data: records.map(r => extract(r.data, 'current')),
                    borderColor: '#FF6384',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 3
                },
                {
                    label: 'Độ Ẩm (%)',
                    data: records.map(r => extract(r.data, 'humidity')),
                    borderColor: '#4BC0C0',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 3
                }
            ];
            break;
    }

    // Destroy previous chart if exists
    if (chartInstance) {
        chartInstance.destroy();
    }

    // Create new chart
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                title: {
                    display: true,
                    text: `Biểu Đồ ${sensorType.toUpperCase()} - Thay Đổi Theo Thời Gian`,
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            }
        }
    });
}

/**
 * Extract value from nested data object
 */
function extract(data, key) {
    if (!data) return null;
    const val = typeof data === 'string' ? JSON.parse(data) : data;
    return val[key] || 0;
}

/**
 * Show chart message
 */
function showChartMessage(message, type) {
    const messageDiv = document.getElementById('chart-message');
    messageDiv.innerHTML = message;
    messageDiv.className = type;
}

// ============ ALERT SYSTEM ============

/**
 * Initialize alert polling on page load
 */
function initializeAlerts() {
    // Poll alerts every 10 seconds
    pollAlerts();
    setInterval(pollAlerts, 10000);
}

/**
 * Poll for active alerts
 */
function pollAlerts() {
    fetch('/api/alerts')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(data => {
            const alerts = data.alerts || [];
            displayAlerts(alerts);

            // Update warning count in stats
            const warningCount = alerts.filter(a => !a.acknowledged).length;
            document.getElementById('stat-warnings').textContent = warningCount;

            // Play sound if new critical alerts
            if (warningCount > 0) {
                const criticalAlerts = alerts.filter(a => !a.acknowledged && a.danger_level === 'critical');
                if (criticalAlerts.length > 0) {
                    playAlertSound();
                }
            }
        })
        .catch(error => console.error('Error polling alerts:', error));
}

/**
 * Display alerts in the alert panel
 */
function displayAlerts(alerts) {
    const alertPanel = document.getElementById('alert-panel');
    const alertList = document.getElementById('alert-list');

    // Filter unacknowledged alerts
    const unacknowledged = alerts.filter(a => !a.acknowledged);

    if (unacknowledged.length === 0) {
        alertPanel.style.display = 'none';
        return;
    }

    // Show alert panel
    alertPanel.style.display = 'block';

    // Generate alert items HTML
    let html = '';
    unacknowledged.forEach(alert => {
        const timestamp = new Date(alert.timestamp).toLocaleString('vi-VN');
        const dangerLevel = alert.danger_level.toUpperCase();

        html += `
            <div class="alert-item">
                <div class="alert-content">
                    <div class="alert-badge ${alert.danger_level}">
                        ${dangerLevel}
                    </div>
                    <div class="alert-message">
                        ${alert.message}
                    </div>
                    <div class="alert-details">
                        <strong>Device:</strong> ${alert.device_id} | 
                        <strong>Sensor:</strong> ${alert.sensor_type} | 
                        <strong>Value:</strong> ${formatValue(alert.value)}
                    </div>
                    <div class="alert-time">${timestamp}</div>
                </div>
                <div class="alert-actions">
                    <button class="btn-acknowledge" onclick="acknowledgeAlert(${alert.id})">
                        ✓ Xác Nhận
                    </button>
                </div>
            </div>
        `;
    });

    alertList.innerHTML = html;
}

/**
 * Acknowledge an alert
 */
function acknowledgeAlert(alertId) {
    fetch(`/api/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user: 'operator' })
    })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(data => {
            console.log('Alert acknowledged:', data);
            // Refresh alerts immediately
            pollAlerts();
        })
        .catch(error => console.error('Error acknowledging alert:', error));
}

/**
 * Close alert panel
 */
function closeAlertPanel() {
    const alertPanel = document.getElementById('alert-panel');
    alertPanel.style.display = 'none';
}

/**
 * Format alert value based on precision
 */
function formatValue(value) {
    if (typeof value !== 'number') return value;
    return value.toFixed(2);
}

/**
 * Play alert sound for critical alerts
 */
function playAlertSound() {
    // Create a simple beep sound using Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 1000; // Hz
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.warn('Could not play alert sound:', e);
    }
}

// Start alert polling when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeAlerts();
});
