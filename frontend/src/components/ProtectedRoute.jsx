import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/loginPage.css';

/**
 * Protected Route Component
 * 
 * @param {React.ReactNode} children - Component to render if authorized
 * @param {string|string[]} requiredRoles - Required role(s) to access this route
 * 
 * Usage:
 *   <ProtectedRoute requiredRoles="admin">
 *     <AdminPage />
 *   </ProtectedRoute>
 */
export const ProtectedRoute = ({ children, requiredRoles = null }) => {
    const { user, loading } = useAuth();

    console.log('[ProtectedRoute] user:', user, 'loading:', loading, 'requiredRoles:', requiredRoles);

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

    // Chưa đăng nhập
    if (!user) {
        console.log('[ProtectedRoute] Chưa có user, chuyển hướng đến /login');
        return <Navigate to="/login" replace />;
    }

    // Kiểm tra role nếu requiredRoles được chỉ định
    if (requiredRoles) {
        const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

        if (!roles.includes(user.role)) {
            console.warn(`[ProtectedRoute] User role "${user.role}" không được phép truy cập. Required: ${roles.join(',')}`);

            // Redirect dựa trên role của user
            return <Navigate to="/" replace />;
        }
    }

    console.log('[ProtectedRoute] User đã xác thực, cho phép truy cập');
    return children;
};
