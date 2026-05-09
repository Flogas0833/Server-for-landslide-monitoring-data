import { useState, useEffect } from 'react';
import { useRoleCheck } from '../hooks/useRoleCheck';
import { usePermissions } from '../hooks/useRoleCheck';
import axios from 'axios';
import { FileText, Shield } from 'lucide-react';
import { Card } from '../components/ui/card';
import { translateAction, translateResourceType } from '../utils/helpers';
import '../styles/adminPages.css';

export const AdminAuditLogsPage = () => {
    const { isAdmin } = useRoleCheck();
    const permissions = usePermissions();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // TODO: Fetch audit logs from API
        // GET /api/audit-logs
        setLogs([
            {
                id: 1,
                username: 'admin',
                action: 'login_success',
                resource_type: 'user',
                timestamp: '2026-05-05T14:30:00',
                ip_address: '127.0.0.1',
            },
            {
                id: 2,
                username: 'operator',
                action: 'export_data',
                resource_type: 'sensor',
                timestamp: '2026-05-05T14:25:00',
                ip_address: '192.168.1.100',
            },
            {
                id: 3,
                username: 'admin',
                action: 'user_created',
                resource_type: 'user',
                timestamp: '2026-05-05T14:20:00',
                ip_address: '127.0.0.1',
            },
        ]);
        setLoading(false);
    }, []);

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
        <div className="admin-page">
            <div className="admin-header">
                <h1>
                    <FileText size={28} />
                    Nhật Ký Hoạt Động
                </h1>
                <p className="subtitle">Theo dõi tất cả hành động của người dùng trong hệ thống</p>
            </div>

            <Card className="logs-table-card">
                {loading ? (
                    <p>Đang tải...</p>
                ) : (
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
                                        <span className="action-badge">
                                            {translateAction(log.action)}
                                        </span>
                                    </td>
                                    <td>{translateResourceType(log.resource_type)}</td>
                                    <td>{new Date(log.timestamp).toLocaleString('vi-VN')}</td>
                                    <td className="mono">{log.ip_address}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Card>
        </div>
    );
};

export default AdminAuditLogsPage;
