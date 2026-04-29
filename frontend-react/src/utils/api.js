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
        const token = localStorage.getItem('auth_token');
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

    updateThreshold: async (sensor_type, threshold_name, value) => {
        const { data } = await api.post('/api/alerts/thresholds', {
            sensor_type,
            threshold_name,
            value,
        });
        return data;
    },
};

// Export APIs
export const exportAPI = {
    exportCSV: async (params = {}) => {
        const response = await api.get('/api/export/csv', { params, responseType: 'blob' });
        return response.data;
    },

    exportJSON: async (params = {}) => {
        const response = await api.get('/api/export/json', { params, responseType: 'json' });
        return response.data;
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
