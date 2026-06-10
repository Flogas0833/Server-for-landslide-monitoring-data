/**
 * Format timestamp to readable format (GMT+7)
 * Handles timestamps from backend (UTC ISO format without Z suffix)
 * and converts them to GMT+7 for display
 */
export const formatTime = (timestamp) => {
    if (!timestamp) return '-';

    try {
        // Parse the timestamp
        // Backend returns UTC timestamps without Z suffix (e.g., "2026-06-10T12:31:11.201541")
        // We need to explicitly treat them as UTC
        let dateString = timestamp;

        // If timestamp doesn't have timezone info, assume UTC and add Z suffix
        if (typeof timestamp === 'string' && !timestamp.endsWith('Z') && !timestamp.includes('+')) {
            // Check if it's ISO-like format (YYYY-MM-DD or similar)
            if (/^\d{4}-\d{2}-\d{2}/.test(timestamp)) {
                dateString = timestamp + 'Z';
            }
        }

        const date = new Date(dateString);

        // Check if date is valid
        if (isNaN(date.getTime())) {
            console.warn('Invalid timestamp format:', timestamp);
            return '-';
        }

        // Format in GMT+7 using Intl API
        // The browser will handle timezone conversion from UTC properly
        const formatter = new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'Asia/Bangkok' // GMT+7
        });

        return formatter.format(date);
    } catch (e) {
        console.error('Error formatting time:', e, timestamp);
        return '-';
    }
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

/**
 * Translate role to Vietnamese
 */
export const translateRole = (role) => {
    const roleMap = {
        'user': 'Người Dùng',
        'operator': 'Nhân Viên Vận Hành',
        'admin': 'Quản Trị Viên',
    };
    return roleMap[role] || role;
};

/**
 * Translate audit action to Vietnamese
 */
export const translateAction = (action) => {
    const actionMap = {
        'login_success': 'Đăng nhập thành công',
        'login_failed': 'Đăng nhập thất bại',
        'logout': 'Đăng xuất',
        'export_data': 'Xuất dữ liệu',
        'import_data': 'Nhập dữ liệu',
        'user_created': 'Tạo người dùng',
        'create_user': 'Tạo người dùng',
        'user_updated': 'Cập nhật người dùng',
        'user_deleted': 'Xóa người dùng',
        'update_province': 'Cập nhật tỉnh thành',
        'update_user_province': 'Cập nhật tỉnh thành',
        'device_created': 'Tạo thiết bị',
        'device_updated': 'Cập nhật thiết bị',
        'device_deleted': 'Xóa thiết bị',
        'alert_acknowledge': 'Xác nhận cảnh báo',
        'alert_acknowledged': 'Xác nhận cảnh báo',
        'acknowledge_alert': 'Xác nhận cảnh báo',
        'settings_changed': 'Thay đổi cài đặt',
        'update_threshold': 'Cập nhật ngưỡng cảnh báo',
        'update_threshold_by_province': 'Cập nhật ngưỡng theo tỉnh',
        'reset_threshold': 'Đặt lại ngưỡng cảnh báo',
    };
    return actionMap[action] || action.replace(/_/g, ' ');
};

/**
 * Get today's date string in GMT+7 timezone
 * Returns date in YYYY-MM-DD format
 * 
 * @returns {string} Today's date in YYYY-MM-DD format (GMT+7)
 */
export const getTodayGMT7 = () => {
    const formatter = new Intl.DateTimeFormat('sv-SE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Asia/Bangkok' // GMT+7
    });
    return formatter.format(new Date());
};

/**
 * Calculate UTC date range for a given GMT+7 date
 * Converts GMT+7 midnight-to-midnight range to UTC equivalents
 * 
 * @param {string} dateStr - Date string in YYYY-MM-DD format (interpreted as GMT+7)
 * @returns {Object} Object with start_date and end_date in UTC ISO format
 */
export const calculateUTCDateRange = (dateStr) => {
    // Parse the date string (YYYY-MM-DD)
    const [year, month, day] = dateStr.split('-').map(Number);

    // Create UTC midnight for the selected date: 2026-05-19T00:00:00Z
    const utcMidnight = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

    // Start of day in GMT+7 = UTC midnight - 7 hours
    // So we need to subtract 7 hours from UTC midnight
    const startUTC = new Date(utcMidnight.getTime() - 7 * 60 * 60 * 1000);

    // End of day in GMT+7 = next day UTC midnight - 7 hours - 1ms
    const endUTC = new Date(startUTC.getTime() + 24 * 60 * 60 * 1000 - 1);

    return {
        start_date: startUTC.toISOString(),
        end_date: endUTC.toISOString(),
    };
};

/**
 * Translate resource type to Vietnamese
 */
export const translateResourceType = (type) => {
    const typeMap = {
        'user': 'Người dùng',
        'sensor': 'Cảm biến',
        'device': 'Thiết bị',
        'alert': 'Cảnh báo',
        'system': 'Hệ thống',
        'alert_thresholds': 'Ngưỡng cảnh báo',
    };
    return typeMap[type] || type;
};
