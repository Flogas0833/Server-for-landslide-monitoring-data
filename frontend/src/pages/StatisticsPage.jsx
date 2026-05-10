import { useState, useEffect } from 'react';
import { useRoleCheck } from '../hooks/useRoleCheck';
import { usePermissions } from '../hooks/useRoleCheck';
import { useAlertStats } from '../hooks/useAlerts';
import axios from 'axios';
import { BarChart3, Shield, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Separator } from '../components/ui';
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
            {/* Header */}
            <header className="border-b bg-card py-4 mb-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <BarChart3 className="w-8 h-8 text-primary" />
                        Thống Kê Hệ Thống
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Tổng quan về các thiết bị, cảm biến và cảnh báo nguy hiểm
                    </p>
                </div>
            </header>

            {loading ? (
                <Card>
                    <CardContent className="pt-6">
                        <p>Đang tải thống kê...</p>
                    </CardContent>
                </Card>
            ) : stats ? (
                <div className="space-y-6">
                    {/* Key Metrics Cards */}
                    <div className="stats-grid">
                        {/* Total Devices */}
                        <Card className="stat-card metric-card">
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tổng Thiết Bị</p>
                                        <p className="text-3xl font-bold mt-2">{stats.total_devices}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Toàn bộ hệ thống</p>
                                    </div>
                                    <div className="text-3xl">📱</div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Active Devices */}
                        <Card className="stat-card metric-card">
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Thiết Bị Hoạt Động</p>
                                        <p className="text-3xl font-bold mt-2">{stats.active_devices}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {((stats.active_devices / stats.total_devices) * 100).toFixed(0)}% hoạt động
                                        </p>
                                    </div>
                                    <div className="text-3xl">✅</div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Alert Count */}
                        <Card className="stat-card metric-card alert-metric">
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tổng Cảnh Báo</p>
                                        <p className="text-3xl font-bold mt-2">{totalAlerts}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{criticalAlerts} nguy hiểm, {warningAlerts} cao</p>
                                    </div>
                                    <div className="text-3xl">🚨</div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Sensor Types */}
                        <Card className="stat-card metric-card">
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Loại Cảm Biến</p>
                                        <p className="text-3xl font-bold mt-2">{stats.sensor_types?.length || 0}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Các loại khác nhau</p>
                                    </div>
                                    <div className="text-3xl">📊</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts Section */}
                    <div className="charts-section">
                        {/* Device Activity Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Hoạt Động Thiết Bị (7 Ngày Qua)</CardTitle>
                            </CardHeader>
                            <CardContent>
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
                            </CardContent>
                        </Card>

                        {/* Sensor Distribution */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Phân Bố Các Loại Cảm Biến</CardTitle>
                            </CardHeader>
                            <CardContent>
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
                            </CardContent>
                        </Card>
                    </div>

                    {/* Alert Statistics Section */}
                    <Card className="alert-stats-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-destructive">
                                <AlertTriangle size={24} />
                                Thống Kê Cảnh Báo Nguy Hiểm
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-2">Chi tiết các mức độ cảnh báo trong hệ thống</p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="alert-charts-grid">
                                {/* Alert Level Distribution - Bar Chart */}
                                <div className="chart-card-wrapper">
                                    <h3 className="text-sm font-semibold mb-4">Phân Bố Theo Mức Độ</h3>
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
                                    <h3 className="text-sm font-semibold mb-4">Tỷ Lệ Cảnh Báo</h3>
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

                            <Separator />

                            {/* Alert Summary Cards */}
                            <div className="alert-summary-cards">
                                {alertLevelData.map((alert) => (
                                    <div key={alert.name} className="alert-summary-item" style={{ borderLeft: `4px solid ${alert.color}` }}>
                                        <div className="alert-summary-content">
                                            <h4 className="text-sm font-medium text-muted-foreground">{alert.name}</h4>
                                            <p className="alert-summary-value">{alert.value}</p>
                                        </div>
                                        <TrendingUp size={20} style={{ color: alert.color }} />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sensor Types List */}
                    {stats?.sensor_types && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity size={24} />
                                    Danh Sách Loại Cảm Biến
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {stats.sensor_types.map((type) => (
                                        <Badge key={type} variant="outline">
                                            📈 {type.toUpperCase()}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Last Update Info */}
                    <Separator />
                    <div className="text-center text-sm text-muted-foreground py-4">
                        <p>
                            <span className="font-semibold">Cập nhật cuối cùng:</span> {' '}
                            {stats.last_device_update
                                ? new Date(stats.last_device_update).toLocaleString('vi-VN')
                                : 'Chưa cập nhật'}
                        </p>
                    </div>
                </div>
            ) : (
                <Card>
                    <CardContent className="pt-6 text-center">
                        <h2 className="text-lg font-semibold text-destructive mb-2">Lỗi</h2>
                        <p className="text-muted-foreground">Không thể tải thống kê. Vui lòng thử lại.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default StatisticsPage;
