import { useState, useEffect } from 'react';
import { useRoleCheck } from '../hooks/useRoleCheck';
import { usePermissions } from '../hooks/useRoleCheck';
import axios from 'axios';
import { BarChart3, Shield } from 'lucide-react';
import { Card } from '../components/ui/card';
import '../styles/adminPages.css';

export const StatisticsPage = () => {
    const { isAdmin, isOperator } = useRoleCheck();
    const permissions = usePermissions();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch from API with token
                const token = localStorage.getItem('access_token');
                const response = await axios.get('/api/statistics', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setStats(response.data);
            } catch (error) {
                console.error('Error fetching statistics:', error);
                // Mock data fallback
                setStats({
                    total_devices: 15,
                    active_devices: 12,
                    sensor_types: ['tilt', 'vibration', 'displacement', 'rainfall', 'temperature', 'gnss'],
                    last_device_update: '2026-05-05T14:30:00',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (!permissions.canViewStatistics) {
        return (
            <div className="admin-page">
                <Card className="error-card">
                    <Shield size={48} />
                    <h2>Truy cập bị từ chối</h2>
                    <p>Bạn không có quyền xem thống kê. Operator và Admin mới có thể truy cập trang này.</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h1>
                    <BarChart3 size={28} />
                    Thống Kê Hệ Thống
                </h1>
                <p className="subtitle">Tổng quan về các thiết bị và cảm biến</p>
            </div>

            {loading ? (
                <Card>
                    <p>Đang tải thống kê...</p>
                </Card>
            ) : stats ? (
                <div className="stats-grid">
                    {/* Total Devices */}
                    <Card className="stat-card">
                        <div className="stat-content">
                            <h3>Tổng Thiết Bị</h3>
                            <p className="stat-value">{stats.total_devices}</p>
                        </div>
                        <div className="stat-icon">📱</div>
                    </Card>

                    {/* Active Devices */}
                    <Card className="stat-card">
                        <div className="stat-content">
                            <h3>Thiết Bị Hoạt Động</h3>
                            <p className="stat-value">{stats.active_devices}</p>
                        </div>
                        <div className="stat-icon">✅</div>
                    </Card>

                    {/* Sensor Types */}
                    <Card className="stat-card">
                        <div className="stat-content">
                            <h3>Loại Cảm Biến</h3>
                            <p className="stat-value">{stats.sensor_types?.length || 0}</p>
                        </div>
                        <div className="stat-icon">📊</div>
                    </Card>

                    {/* Last Update */}
                    <Card className="stat-card">
                        <div className="stat-content">
                            <h3>Cập Nhật Cuối Cùng</h3>
                            <p className="stat-time">
                                {stats.last_device_update
                                    ? new Date(stats.last_device_update).toLocaleString('vi-VN')
                                    : 'Chưa cập nhật'
                                }
                            </p>
                        </div>
                        <div className="stat-icon">⏰</div>
                    </Card>
                </div>
            ) : (
                <Card className="error-card">
                    <h2>Lỗi</h2>
                    <p>Không thể tải thống kê. Vui lòng thử lại.</p>
                </Card>
            )}

            {/* Sensor Types List */}
            {stats?.sensor_types && (
                <Card>
                    <h2>Danh Sách Loại Cảm Biến</h2>
                    <div className="sensor-types">
                        {stats.sensor_types.map((type) => (
                            <div key={type} className="sensor-type-badge">
                                📈 {type}
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
};

export default StatisticsPage;
