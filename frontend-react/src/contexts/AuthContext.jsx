import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Tự động đăng nhập khi tải ứng dụng
    useEffect(() => {
        const autoLogin = async () => {
            try {
                console.log('[Auth] Bắt đầu kiểm tra xác thực...');

                // Trước tiên kiểm tra xem đã đăng nhập chưa
                const checkResponse = await axios.get('/api/auth/check');

                console.log('[Auth] Check response:', checkResponse.data);

                if (checkResponse.data.authenticated) {
                    // Đã đăng nhập rồi
                    console.log('[Auth] Đã đăng nhập, user:', checkResponse.data.user);
                    setUser(checkResponse.data.user);
                    setLoading(false);
                    return;
                }

                // Nếu chưa đăng nhập, tự động đăng nhập
                console.log('[Auth] Chưa đăng nhập, thực hiện auto-login...');
                const loginResponse = await axios.post('/api/auth/auto-login', {});

                console.log('[Auth] Auto-login response:', loginResponse.data);

                if (loginResponse.data.success) {
                    console.log('[Auth] Auto-login thành công, user:', loginResponse.data.user);
                    setUser(loginResponse.data.user);
                    if (loginResponse.data.token) {
                        localStorage.setItem('auth_token', loginResponse.data.token);
                        console.log('[Auth] Token lưu vào localStorage');
                    }
                } else {
                    console.error('[Auth] Auto-login thất bại, sử dụng demo user');
                    // Fallback: use demo user
                    setUser({ id: 'demo', username: 'demo', role: 'admin' });
                }
            } catch (err) {
                console.error('[Auth] Lỗi auto-login:', err.message, err.response?.data);
                // Fallback: use demo user for testing
                console.log('[Auth] Fallback: sử dụng demo user');
                setUser({ id: 'demo', username: 'demo', role: 'admin' });
            } finally {
                console.log('[Auth] Hoàn thành kiểm tra, loading = false');
                // Thêm delay để splash screen hiển thị đủ lâu
                setTimeout(() => {
                    setLoading(false);
                }, 1500);
            }
        };

        autoLogin();
    }, []);

    const login = async (username, password) => {
        try {
            setError(null);
            const response = await axios.post('/api/auth/login', {
                username,
                password,
            });

            if (response.data.success) {
                setUser(response.data.user);
                // Store token in localStorage for API requests
                if (response.data.token) {
                    localStorage.setItem('auth_token', response.data.token);
                }
                return { success: true };
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Đăng nhập thất bại';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        }
    };

    const logout = async () => {
        try {
            await axios.post('/api/auth/logout', {});
            setUser(null);
            setError(null);
            localStorage.removeItem('auth_token');
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, error, login, logout }}>
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
