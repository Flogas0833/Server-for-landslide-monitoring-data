/**
 * Format timestamp to readable format
 */
export const formatTime = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
};

/**
 * Format date for display
 */
export const formatDate = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN');
};

/**
 * Get status class name
 */
export const getStatusClass = (device) => {
    const alertStatus = device.alert_status || 'normal';

    if (alertStatus === 'critical') {
        return 'danger';
    } else if (alertStatus === 'warning') {
        return 'warning';
    }

    const status = device.status || 'active';
    switch (status) {
        case 'danger':
            return 'danger';
        case 'warning':
            return 'warning';
        default:
            return 'active';
    }
};

/**
 * Get alert color
 */
export const getAlertColor = (level) => {
    switch (level?.toLowerCase()) {
        case 'critical':
            return '#e74c3c';
        case 'high':
            return '#e67e22';
        case 'medium':
            return '#f39c12';
        case 'low':
            return '#3498db';
        default:
            return '#95a5a6';
    }
};

/**
 * Download file helper
 */
export const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
};

/**
 * Format number with units
 */
export const formatValue = (value, decimals = 2) => {
    if (value === null || value === undefined) return '-';
    return typeof value === 'number' ? value.toFixed(decimals) : value;
};
