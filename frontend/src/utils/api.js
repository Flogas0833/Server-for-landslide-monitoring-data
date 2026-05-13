import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear auth token and redirect to login
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Device APIs
export const deviceAPI = {
    getAllDevices: async () => {
        // Use public endpoint first (no auth required), fallback to private
        try {
            const { data } = await api.get('/api/devices/public');
            // Extract devices array from response
            return data.devices || data || [];
        } catch (error) {
            // Fallback to authenticated endpoint
            const { data } = await api.get('/api/devices');
            return data || [];
        }
    },

    getDeviceDetail: async (deviceId) => {
        const { data } = await api.get(`/api/device/${deviceId}`);
        return data;
    },

    registerDevice: async (deviceData) => {
        const { data } = await api.post('/api/register-device', deviceData);
        return data;
    },

    getDevicesByProvince: async (province) => {
        const { data } = await api.get('/api/devices/by-province', {
            params: { province }
        });
        return data;
    },
};

// Sensor APIs
export const sensorAPI = {
    getSensorData: async (sensorType, params = {}) => {
        const { data } = await api.get(`/api/sensor/${sensorType}`, { params });
        return data;
    },

    getSensorHistory: async (params = {}) => {
        const { data } = await api.get('/api/sensor-history', { params });
        return data;
    },

    getStatistics: async () => {
        const { data } = await api.get('/api/statistics');
        return data;
    },
};

// Alert APIs
export const alertAPI = {
    getActiveAlerts: async (params = {}) => {
        const { data } = await api.get('/api/alerts', { params });
        return data;
    },

    getAlertHistory: async (params = {}) => {
        const { data } = await api.get('/api/alerts/history', { params });
        return data;
    },

    acknowledgeAlert: async (alertId, user = 'system') => {
        const { data } = await api.post(`/api/alerts/${alertId}/acknowledge`, { user });
        return data;
    },

    getAlertStats: async () => {
        const { data } = await api.get('/api/alerts/stats');
        return data;
    },

    getThresholds: async (params = {}) => {
        const { data } = await api.get('/api/alerts/thresholds', { params });
        return data;
    },

    getThresholdsPublic: async () => {
        const { data } = await api.get('/api/alerts/thresholds/public');
        return data;
    },

    getThresholdsDetails: async () => {
        try {
            // Try authenticated endpoint first
            const { data } = await api.get('/api/alerts/thresholds/details');
            return data;
        } catch (error) {
            // Fallback to public endpoint
            console.log('Falling back to public threshold endpoint');
            const { data } = await api.get('/api/alerts/thresholds/public');
            return data;
        }
    },

    updateThreshold: async (sensor_type, threshold_name, value) => {
        const { data } = await api.post('/api/alerts/thresholds', {
            sensor_type,
            threshold_name,
            value,
        });
        return data;
    },

    resetThresholds: async () => {
        const { data } = await api.post('/api/alerts/thresholds/reset');
        return data;
    },

    getAlertsByProvince: async (province, params = {}) => {
        const { data } = await api.get('/api/alerts/by-province', {
            params: { ...params, province }
        });
        return data;
    },

    getThresholdsByProvince: async (province, params = {}) => {
        const { data } = await api.get('/api/alerts/thresholds/by-province', {
            params: { ...params, province }
        });
        return data;
    },

    updateThresholdByProvince: async (province, sensor_type, threshold_name, value) => {
        const { data } = await api.post('/api/alerts/thresholds/by-province', {
            province,
            sensor_type,
            threshold_name,
            value,
        });
        return data;
    },
};

// User APIs
export const userAPI = {
    getAllUsers: async () => {
        const { data } = await api.get('/api/users');
        return data.users || [];
    },

    getCurrentUser: async () => {
        const { data } = await api.get('/api/users/me');
        return data;
    },

    createUser: async (userData) => {
        const { data } = await api.post('/api/users', userData);
        return data;
    },

    updateUserProvince: async (province) => {
        const { data } = await api.put('/api/users/me/province', { province });
        return data;
    },

    updateUserProvinceById: async (userId, province) => {
        const { data } = await api.put(`/api/users/${userId}/province`, { province });
        return data;
    },
};

// Audit Logs APIs
export const auditAPI = {
    getAuditLogs: async (params = {}) => {
        const { data } = await api.get('/api/audit-logs', { params });
        return data;
    },

    getAuditLogsByUser: async (userId, params = {}) => {
        const { data } = await api.get('/api/audit-logs', {
            params: { ...params, user_id: userId }
        });
        return data;
    },

    getAuditLogsFiltered: async (filters = {}) => {
        const params = {
            limit: filters.limit || 100,
            offset: filters.offset || 0,
            ...(filters.userId && { user_id: filters.userId }),
            ...(filters.username && { username: filters.username }),
            ...(filters.action && { action: filters.action }),
            ...(filters.resourceType && { resource_type: filters.resourceType }),
            ...(filters.ipAddress && { ip_address: filters.ipAddress }),
            ...(filters.startDate && { start_date: filters.startDate }),
            ...(filters.endDate && { end_date: filters.endDate }),
        };
        const { data } = await api.get('/api/audit-logs', { params });
        return data;
    },
};

// Health check
export const systemAPI = {
    healthCheck: async () => {
        const { data } = await api.get('/api/health');
        return data;
    },
};

export default api;
