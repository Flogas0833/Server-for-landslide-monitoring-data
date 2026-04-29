import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/loginPage.css';

export const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    console.log('[ProtectedRoute] user:', user, 'loading:', loading);

    if (loading) {
        // Hiển thị splash screen loading khi đang xác thực
        return (
            <div className="login-container">
                <div className="splash-screen">
                    <div className="splash-content">
                        <h1 className="splash-title">
                            🏔️ Hệ Thống Giám Sát Lở Đất
                        </h1>

                        <div className="loading-spinner"></div>

                        <p className="splash-text">Đang tải hệ thống...</p>

                        <div className="splash-info">
                            <p>Hệ thống giám sát sạt lở đất tự động</p>
                            <p style={{ fontSize: '12px', marginTop: '10px', opacity: 0.7 }}>
                                Đang kết nối...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        console.log('[ProtectedRoute] Chưa có user, chuyển hướng đến /login');
        return <Navigate to="/login" replace />;
    }

    console.log('[ProtectedRoute] User đã xác thực, cho phép truy cập');
    return children;
};
