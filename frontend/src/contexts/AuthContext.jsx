import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Setup axios interceptor to add JWT token to requests
const setupAxiosInterceptors = () => {
    // Request interceptor: Add token to headers
    axios.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('access_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    // Response interceptor: Handle token refresh
    axios.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;

            // If token expired (401) and we have refresh token, try to refresh
            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;

                try {
                    const refreshToken = localStorage.getItem('refresh_token');
                    if (refreshToken) {
                        const response = await axios.post('/api/auth/refresh', {
                            refresh_token: refreshToken
                        });

                        if (response.data.success) {
                            localStorage.setItem('access_token', response.data.access_token);
                            originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
                            return axios(originalRequest);
                        }
                    }
                } catch (refreshError) {
                    console.error('[Auth] Token refresh failed:', refreshError);
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    window.location.href = '/login';
                }
            }

            return Promise.reject(error);
        }
    );
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initialize axios interceptors on mount
    useEffect(() => {
        setupAxiosInterceptors();
    }, []);

    // Check if user is authenticated on app load
    useEffect(() => {
        const checkAuth = async () => {
            try {
                console.log('[Auth] Checking authentication status...');

                const accessToken = localStorage.getItem('access_token');
                if (!accessToken) {
                    console.log('[Auth] No access token found');
                    setLoading(false);
                    return;
                }

                // Verify token is still valid
                const response = await axios.get('/api/auth/check');

                if (response.data.authenticated) {
                    console.log('[Auth] User authenticated:', response.data.user);
                    setUser(response.data.user);
                } else {
                    console.log('[Auth] User not authenticated');
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                }
            } catch (err) {
                console.error('[Auth] Error checking authentication:', err);
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const register = async (username, email, password) => {
        try {
            setError(null);
            const response = await axios.post('/api/auth/register', {
                username,
                email,
                password,
            });

            if (response.data.success) {
                return { success: true, message: 'Registration successful' };
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Registration failed';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        }
    };

    const login = async (username, password) => {
        try {
            setError(null);
            console.log('[Auth] Attempting login...');

            const response = await axios.post('/api/auth/login', {
                username,
                password,
            });

            if (response.data.success) {
                console.log('[Auth] Login successful');
                // Store tokens
                localStorage.setItem('access_token', response.data.access_token);
                localStorage.setItem('refresh_token', response.data.refresh_token);

                // Set user info
                setUser(response.data.user);

                return { success: true };
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Login failed';
            setError(errorMsg);
            console.error('[Auth] Login error:', errorMsg);
            return { success: false, error: errorMsg };
        }
    };

    const logout = async () => {
        try {
            console.log('[Auth] Logging out...');
            await axios.post('/api/auth/logout', {});
        } catch (err) {
            console.error('[Auth] Logout API error:', err);
        } finally {
            // Clear tokens and user regardless of API response
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            setUser(null);
            setError(null);
            console.log('[Auth] Logout complete');
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, error, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
