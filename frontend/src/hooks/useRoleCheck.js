import { useAuth } from '../contexts/AuthContext';

/**
 * Hook để kiểm tra role của user
 * 
 * @param {string|string[]} requiredRoles - Role hoặc mảng các role được phép
 * @returns {object} { hasRole: bool, userRole: string }
 * 
 * Usage:
 *   const { hasRole } = useRoleCheck('admin');
 *   const { hasRole } = useRoleCheck(['admin', 'operator']);
 */
export const useRoleCheck = (requiredRoles) => {
    const { user } = useAuth();

    if (!user) {
        return { hasRole: false, userRole: null };
    }

    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    const hasRole = roles.includes(user.role);

    return {
        hasRole,
        userRole: user.role,
        isAdmin: user.role === 'admin',
        isOperator: user.role === 'operator',
        isViewer: user.role === 'viewer',
    };
};

/**
 * Hook để lấy thông tin quyền của user
 * 
 * @returns {object} permissions object
 */
export const usePermissions = () => {
    const { user } = useAuth();

    const permissions = {
        // User Management
        canManageUsers: user?.role === 'admin',

        // View Data
        canViewAllData: user?.role === 'admin',
        canViewOwnData: ['admin', 'operator', 'viewer'].includes(user?.role),

        // Export
        canExportData: ['admin', 'operator'].includes(user?.role),

        // Statistics
        canViewStatistics: ['admin', 'operator'].includes(user?.role),

        // Alerts
        canManageAlerts: user?.role === 'admin',
        canAcknowledgeAlerts: ['admin', 'operator'].includes(user?.role),
        canViewAlerts: user?.role !== null,

        // Device Management
        canManageDevices: user?.role === 'admin',

        // Audit
        canViewAuditLogs: user?.role === 'admin',

        // Reports
        canCreateReports: ['admin', 'operator'].includes(user?.role),
    };

    return permissions;
};
