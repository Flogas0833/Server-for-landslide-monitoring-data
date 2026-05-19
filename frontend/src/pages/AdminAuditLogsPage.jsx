import { useState, useEffect } from 'react';
import { useRoleCheck } from '../hooks/useRoleCheck';
import { usePermissions } from '../hooks/useRoleCheck';
import { auditAPI } from '../utils/api';
import { FileText, Shield, AlertCircle, Filter } from 'lucide-react';
import { Card, CardContent, Button, Input } from '../components/ui';
import { translateAction, translateResourceType, formatTime } from '../utils/helpers';
import '../styles/adminPages.css';

// Helper function to get action badge color class
const getActionBadgeClass = (action) => {
    // Alert-related actions
    if (action === 'alert_acknowledge') {
        return 'action-badge action-alert';
    }
    // User management actions
    if (['create_user', 'user_created', 'user_updated', 'user_deleted'].includes(action)) {
        return 'action-badge action-user';
    }
    // Device actions
    if (['device_created', 'device_updated', 'device_deleted'].includes(action)) {
        return 'action-badge action-device';
    }
    // Settings/threshold actions
    if (['update_threshold', 'update_threshold_by_province', 'reset_threshold', 'settings_changed'].includes(action)) {
        return 'action-badge action-setting';
    }
    // Login/logout
    if (['login_success', 'login_failed', 'logout'].includes(action)) {
        return 'action-badge action-auth';
    }
    // Default
    return 'action-badge';
};

export const AdminAuditLogsPage = () => {
    const { isAdmin } = useRoleCheck();
    const permissions = usePermissions();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        total: 0,
        limit: 100,
        offset: 0
    });

    // Filter states
    const [filters, setFilters] = useState({
        username: '',
        action: '',
        resourceType: '',
        ipAddress: '',
        startDate: '',
        endDate: ''
    });

    const [uniqueActions, setUniqueActions] = useState([]);
    const [uniqueResourceTypes, setUniqueResourceTypes] = useState([]);

    const fetchAuditLogs = async (limit = 100, offset = 0, appliedFilters = {}) => {
        try {
            setLoading(true);
            setError(null);

            const filterParams = {
                limit,
                offset,
                username: appliedFilters.username || undefined,
                action: appliedFilters.action || undefined,
                resourceType: appliedFilters.resourceType || undefined,
                ipAddress: appliedFilters.ipAddress || undefined,
                startDate: appliedFilters.startDate || undefined,
                endDate: appliedFilters.endDate || undefined,
            };

            const result = await auditAPI.getAuditLogsFiltered(filterParams);
            setLogs(result.logs || []);
            setPagination(result.pagination || {});

            // Extract unique values for filter dropdowns
            if (result.logs) {
                const actions = [...new Set(result.logs.map(log => log.action))];
                const resourceTypes = [...new Set(result.logs.map(log => log.resource_type))];
                setUniqueActions(actions);
                setUniqueResourceTypes(resourceTypes);
            }
        } catch (err) {
            console.error('Error fetching audit logs:', err);
            setError('Không thể tải nhật ký hoạt động. Vui lòng thử lại sau.');
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuditLogs(pagination.limit, pagination.offset, filters);
    }, []);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleApplyFilters = () => {
        setPagination(prev => ({ ...prev, offset: 0 }));
        fetchAuditLogs(pagination.limit, 0, filters);
    };

    const handleResetFilters = () => {
        setFilters({
            username: '',
            action: '',
            resourceType: '',
            ipAddress: '',
            startDate: '',
            endDate: ''
        });
        setPagination(prev => ({ ...prev, offset: 0 }));
        fetchAuditLogs(pagination.limit, 0, {});
    };

    const handleNextPage = () => {
        const newOffset = pagination.offset + pagination.limit;
        if (newOffset < pagination.total) {
            setPagination(prev => ({ ...prev, offset: newOffset }));
            fetchAuditLogs(pagination.limit, newOffset, filters);
        }
    };

    const handlePrevPage = () => {
        const newOffset = Math.max(0, pagination.offset - pagination.limit);
        setPagination(prev => ({ ...prev, offset: newOffset }));
        fetchAuditLogs(pagination.limit, newOffset, filters);
    };

    const hasActiveFilters = Object.values(filters).some(v => v !== '');

    if (!permissions.canViewAuditLogs) {
        return (
            <div className="admin-page">
                <Card className="error-card">
                    <Shield size={48} />
                    <h2>Truy cập bị từ chối</h2>
                    <p>Bạn không có quyền xem audit logs. Chỉ admin mới có thể truy cập trang này.</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card py-1 mb-2">
                <div className="px-4 py-1">
                    <div className="space-y-0">
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <FileText className="w-8 h-8 text-primary" />
                            Nhật Ký Hoạt Động
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Theo dõi tất cả hành động của người dùng trong hệ thống
                        </p>
                    </div>
                </div>
            </header>

            <div className="px-4">
                {error && (
                    <Card className="error-banner">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </Card>
                )}

                {/* Filter Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-primary" />
                            <h2 className="text-2xl font-bold">Bộ Lọc Dữ Liệu</h2>
                        </div>
                        {hasActiveFilters && (
                            <Button
                                onClick={handleResetFilters}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                Xóa Bộ Lọc
                            </Button>
                        )}
                    </div>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                {/* Người Dùng */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Người Dùng</label>
                                    <Input
                                        type="text"
                                        name="username"
                                        value={filters.username}
                                        onChange={handleFilterChange}
                                        placeholder="Nhập tên..."
                                    />
                                </div>

                                {/* Hành Động */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Hành Động</label>
                                    <select
                                        name="action"
                                        value={filters.action}
                                        onChange={handleFilterChange}
                                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                                    >
                                        <option value="">Tất cả</option>
                                        {uniqueActions.map(action => (
                                            <option key={action} value={action}>
                                                {translateAction(action)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Loại Tài Nguyên */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Loại Tài Nguyên</label>
                                    <select
                                        name="resourceType"
                                        value={filters.resourceType}
                                        onChange={handleFilterChange}
                                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                                    >
                                        <option value="">Tất cả</option>
                                        {uniqueResourceTypes.map(type => (
                                            <option key={type} value={type}>
                                                {translateResourceType(type)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* IP Address */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">IP Address</label>
                                    <Input
                                        type="text"
                                        name="ipAddress"
                                        value={filters.ipAddress}
                                        onChange={handleFilterChange}
                                        placeholder="VD: 192.168.1.1"
                                    />
                                </div>

                                {/* Từ Ngày */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Từ Ngày</label>
                                    <Input
                                        type="datetime-local"
                                        name="startDate"
                                        value={filters.startDate}
                                        onChange={handleFilterChange}
                                    />
                                </div>

                                {/* Đến Ngày */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Đến Ngày</label>
                                    <Input
                                        type="datetime-local"
                                        name="endDate"
                                        value={filters.endDate}
                                        onChange={handleFilterChange}
                                    />
                                </div>
                            </div>

                            {/* Apply Button */}
                            <div className="flex gap-2 mt-6">
                                <Button
                                    onClick={handleApplyFilters}
                                    className="flex-1"
                                >
                                    Áp Dụng Bộ Lọc
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="logs-table-card">
                    {loading ? (
                        <p className="loading-text">Đang tải...</p>
                    ) : logs.length === 0 ? (
                        <p className="empty-text">Không có nhật ký nào</p>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="logs-table">
                                    <thead>
                                        <tr>
                                            <th>Người Dùng</th>
                                            <th>Hành Động</th>
                                            <th>Loại Tài Nguyên</th>
                                            <th>Thời Gian</th>
                                            <th>IP Address</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map((log) => (
                                            <tr key={log.id}>
                                                <td>{log.username}</td>
                                                <td>
                                                    <span className={getActionBadgeClass(log.action)}>
                                                        {translateAction(log.action)}
                                                    </span>
                                                </td>
                                                <td>{translateResourceType(log.resource_type)}</td>
                                                <td>{formatTime(log.timestamp)}</td>
                                                <td className="mono">{log.ip_address}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="pagination-controls">
                                <button
                                    onClick={handlePrevPage}
                                    disabled={pagination.offset === 0}
                                    className="pagination-btn"
                                >
                                    ← Trang Trước
                                </button>
                                <span className="pagination-info">
                                    Trang {Math.floor(pagination.offset / pagination.limit) + 1} / {Math.ceil(pagination.total / pagination.limit)}
                                    ({pagination.total} bản ghi)
                                </span>
                                <button
                                    onClick={handleNextPage}
                                    disabled={pagination.offset + pagination.limit >= pagination.total}
                                    className="pagination-btn"
                                >
                                    Trang Sau →
                                </button>
                            </div>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default AdminAuditLogsPage;
