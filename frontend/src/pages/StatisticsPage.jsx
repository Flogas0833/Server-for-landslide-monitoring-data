import { useState, useEffect } from 'react';
import { useRoleCheck } from '../hooks/useRoleCheck';
import { usePermissions } from '../hooks/useRoleCheck';
import { useAlertStats } from '../hooks/useAlerts';
import axios from 'axios';
import { BarChart3, Shield, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { Card } from '../components/ui/card';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import '../styles/adminPages.css';

export const StatisticsPage = () => {
    const { isAdmin, isOperator } = useRoleCheck();
    const permissions = usePermissions();
    const { data: alertStats, isLoading: alertsLoading } = useAlertStats();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState([]);
    const [sensorData, setSensorData] = useState([]);
    const [alertLevelData, setAlertLevelData] = useState([]);

    const SENSOR_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];
    const ALERT_COLORS = {
        critical: '#ef4444',
        warning: '#f97316',
        info: '#3b82f6',
        resolved: '#22c55e'
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const response = await axios.get('/api/statistics', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setStats(response.data);

                // Prepare sensor distribution data
                if (response.data.sensor_types) {
                    const sensorDistribution = response.data.sensor_types.map(type => ({
                        name: type,
                        value: Math.floor(Math.random() * 50) + 10 // Mock data
                    }));
                    setSensorData(sensorDistribution);
                }

                // Prepare device activity chart data
                const deviceChartData = generateChartData();
                setChartData(deviceChartData);
            } catch (error) {
                console.error('Error fetching statistics:', error);
                setStats({
                    total_devices: 15,
                    active_devices: 12,
                    sensor_types: ['tilt', 'vibration', 'displacement', 'rainfall', 'temperature', 'gnss'],
                    last_device_update: '2026-05-05T14:30:00',
                });

                // Generate mock data
                const deviceChartData = generateChartData();
                setChartData(deviceChartData);
                setSensorData([
                    { name: 'tilt', value: 25 },
                    { name: 'vibration', value: 20 },
                    { name: 'displacement', value: 18 },
                    { name: 'rainfall', value: 22 },
                    { name: 'temperature', value: 19 },
                    { name: 'gnss', value: 15 }
                ]);
            } finally {
                setLoading(false);
            }
        };

        // Prepare alert level distribution
        if (alertStats?.stats) {
            const alertData = [
                { name: 'Nguy Hiểm', value: alertStats.stats.critical || 0, color: ALERT_COLORS.critical },
                { name: 'Cao', value: alertStats.stats.high || 0, color: ALERT_COLORS.warning },
                { name: 'Trung Bình', value: alertStats.stats.medium || 0, color: '#fbbf24' },
                { name: 'Thấp', value: alertStats.stats.low || 0, color: ALERT_COLORS.info }
            ];
            setAlertLevelData(alertData);
        }

        fetchStats();
    }, [alertStats]);

    const generateChartData = () => {
        return Array.from({ length: 7 }, (_, i) => ({
            name: `Ngày ${i + 1}`,
            active: Math.floor(Math.random() * 5) + 10,
            total: 15,
            alerts: Math.floor(Math.random() * 8)
        }));
    };

    const getAlertStats = () => {
        const total = alertLevelData.reduce((sum, item) => sum + item.value, 0);
        const critical = alertLevelData.find(item => item.name === 'Nguy Hiểm')?.value || 0;
        const warning = alertLevelData.find(item => item.name === 'Cảnh Báo')?.value || 0;
        return { total, critical, warning };
    };

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

    const { total: totalAlerts, critical: criticalAlerts, warning: warningAlerts } = getAlertStats();

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h1>
                    <BarChart3 size={28} />
                    Thống Kê Hệ Thống
                </h1>
                <p className="subtitle">Tổng quan về các thiết bị, cảm biến và cảnh báo nguy hiểm</p>
            </div>

            {loading ? (
                <Card>
                    <p>Đang tải thống kê...</p>
                </Card>
            ) : stats ? (
                <>
                    {/* Key Metrics Cards */}
                    <div className="stats-grid">
                        {/* Total Devices */}
                        <Card className="stat-card metric-card">
                            <div className="stat-content">
                                <h3>Tổng Thiết Bị</h3>
                                <p className="stat-value">{stats.total_devices}</p>
                                <p className="stat-subtitle">Toàn bộ hệ thống</p>
                            </div>
                            <div className="stat-icon">📱</div>
                        </Card>

                        {/* Active Devices */}
                        <Card className="stat-card metric-card">
                            <div className="stat-content">
                                <h3>Thiết Bị Hoạt Động</h3>
                                <p className="stat-value">{stats.active_devices}</p>
                                <p className="stat-subtitle">
                                    {((stats.active_devices / stats.total_devices) * 100).toFixed(0)}% hoạt động
                                </p>
                            </div>
                            <div className="stat-icon">✅</div>
                        </Card>

                        {/* Alert Count */}
                        <Card className="stat-card metric-card alert-metric">
                            <div className="stat-content">
                                <h3>Tổng Cảnh Báo</h3>
                                <p className="stat-value">{totalAlerts}</p>
                                <p className="stat-subtitle">{criticalAlerts} nguy hiểm, {warningAlerts} cao</p>
                            </div>
                            <div className="stat-icon">🚨</div>
                        </Card>

                        {/* Sensor Types */}
                        <Card className="stat-card metric-card">
                            <div className="stat-content">
                                <h3>Loại Cảm Biến</h3>
                                <p className="stat-value">{stats.sensor_types?.length || 0}</p>
                                <p className="stat-subtitle">Các loại khác nhau</p>
                            </div>
                            <div className="stat-icon">📊</div>
                        </Card>
                    </div>

                    {/* Charts Section */}
                    <div className="charts-section">
                        {/* Device Activity Chart */}
                        <Card className="chart-card">
                            <h2>Hoạt Động Thiết Bị (7 Ngày Qua)</h2>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="active" stroke="#22c55e" name="Hoạt Động" strokeWidth={2} />
                                    <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Tổng Cộng" strokeWidth={2} />
                                    <Line type="monotone" dataKey="alerts" stroke="#ef4444" name="Cảnh Báo" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </Card>

                        {/* Sensor Distribution */}
                        <Card className="chart-card">
                            <h2>Phân Bố Các Loại Cảm Biến</h2>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={sensorData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, value }) => `${name}: ${value}`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {sensorData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={SENSOR_COLORS[index % SENSOR_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card>
                    </div>

                    {/* Alert Statistics Section */}
                    <Card className="alert-stats-card">
                        <div className="alert-stats-header">
                            <h2>
                                <AlertTriangle size={24} />
                                Thống Kê Cảnh Báo Nguy Hiểm
                            </h2>
                            <p className="subtitle">Chi tiết các mức độ cảnh báo trong hệ thống</p>
                        </div>

                        <div className="alert-charts-grid">
                            {/* Alert Level Distribution - Bar Chart */}
                            <div className="chart-card-wrapper">
                                <h3>Phân Bố Theo Mức Độ</h3>
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={alertLevelData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="value" fill="#8884d8" radius={[8, 8, 0, 0]}>
                                            {alertLevelData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Alert Level Distribution - Pie Chart */}
                            <div className="chart-card-wrapper">
                                <h3>Tỷ Lệ Cảnh Báo</h3>
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={alertLevelData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, value }) => `${name}: ${value}`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {alertLevelData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Alert Summary Cards */}
                        <div className="alert-summary-cards">
                            {alertLevelData.map((alert) => (
                                <div key={alert.name} className="alert-summary-item" style={{ borderLeft: `4px solid ${alert.color}` }}>
                                    <div className="alert-summary-content">
                                        <h4>{alert.name}</h4>
                                        <p className="alert-summary-value">{alert.value}</p>
                                    </div>
                                    <TrendingUp size={20} style={{ color: alert.color }} />
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Sensor Types List */}
                    {stats?.sensor_types && (
                        <Card>
                            <h2>
                                <Activity size={24} className="inline-icon" />
                                Danh Sách Loại Cảm Biến
                            </h2>
                            <div className="sensor-types">
                                {stats.sensor_types.map((type) => (
                                    <div key={type} className="sensor-type-badge">
                                        📈 {type.toUpperCase()}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Last Update Info */}
                    <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px', textAlign: 'center' }}>
                        <p style={{ color: '#666', margin: 0 }}>
                            <span style={{ fontWeight: 'bold' }}>Cập nhật cuối cùng:</span> {' '}
                            {stats.last_device_update
                                ? new Date(stats.last_device_update).toLocaleString('vi-VN')
                                : 'Chưa cập nhật'}
                        </p>
                    </div>
                </>
            ) : (
                <Card className="error-card">
                    <h2>Lỗi</h2>
                    <p>Không thể tải thống kê. Vui lòng thử lại.</p>
                </Card>
            )}
        </div>
    );
};

export default StatisticsPage;
