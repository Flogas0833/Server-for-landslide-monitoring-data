import { useState, useEffect } from 'react';
import { useRoleCheck } from '../hooks/useRoleCheck';
import { usePermissions } from '../hooks/useRoleCheck';
import { useAlertStats } from '../hooks/useAlerts';
import axios from 'axios';
import { BarChart3, Shield, AlertTriangle, TrendingUp, Activity, Satellite, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Separator } from '../components/ui';
import {
    BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import '../styles/adminPages.css';

// Custom Legend Component for sorted order
const CustomLegend = (props) => {
    const legendOrder = [
        { dataKey: 'total', name: 'Tổng Cảnh Báo', color: '#ef4444' },
        { dataKey: 'critical', name: 'Nguy Hiểm', color: '#dc2626' },
        { dataKey: 'warning', name: 'Cao', color: '#f97316' },
        { dataKey: 'medium', name: 'Trung Bình', color: '#fbbf24' },
        { dataKey: 'low', name: 'Thấp', color: '#3b82f6' }
    ];

    return (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', marginTop: '16px' }}>
            {legendOrder.map((item) => (
                <div key={item.dataKey} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                        style={{
                            width: '12px',
                            height: '12px',
                            backgroundColor: item.color,
                            borderRadius: '2px'
                        }}
                    />
                    <span style={{ fontSize: '14px', color: '#666' }}>{item.name}</span>
                </div>
            ))}
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, isLoading }) => (
    <Card className="p-4">
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-semibold">
                    {isLoading ? '--' : value}
                </p>
            </div>
        </div>
    </Card>
);

export const StatisticsPage = () => {
    const { isAdmin, isOperator } = useRoleCheck();
    const permissions = usePermissions();
    const { data: alertStats, isLoading: alertsLoading } = useAlertStats();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [alertLevelData, setAlertLevelData] = useState([]);
    const [dailyAlertData, setDailyAlertData] = useState([]);

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
                // Try public endpoint first (no auth required)
                console.log('[StatisticsPage] Fetching /api/statistics/public...');
                let statsResponse;
                try {
                    statsResponse = await axios.get('/api/statistics/public');
                    console.log('[StatisticsPage] /api/statistics/public success:', statsResponse.data);
                } catch (err) {
                    console.warn('[StatisticsPage] /api/statistics/public failed, trying authenticated endpoint:', err);
                    const token = localStorage.getItem('access_token');
                    statsResponse = await axios.get('/api/statistics', {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    console.log('[StatisticsPage] /api/statistics (auth) success:', statsResponse.data);
                }

                setStats(statsResponse.data);
                // Save to localStorage for fallback use
                localStorage.setItem('last_statistics', JSON.stringify(statsResponse.data));

                // Fetch daily alert data - try public endpoint first
                try {
                    console.log('[StatisticsPage] Fetching /api/alerts/daily/public...');
                    const dailyAlertsResponse = await axios.get('/api/alerts/daily/public');
                    console.log('[StatisticsPage] /api/alerts/daily/public success:', dailyAlertsResponse.data);
                    const dailyData = dailyAlertsResponse.data.daily_alerts || [];
                    setDailyAlertData(dailyData);
                    localStorage.setItem('daily_alert_data', JSON.stringify(dailyData));
                } catch (err) {
                    console.warn('[StatisticsPage] /api/alerts/daily/public failed, trying authenticated:', err);
                    try {
                        const token = localStorage.getItem('access_token');
                        const dailyAlertsResponse = await axios.get('/api/alerts/daily', {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        console.log('[StatisticsPage] /api/alerts/daily (auth) success:', dailyAlertsResponse.data);
                        const dailyData = dailyAlertsResponse.data.daily_alerts || [];
                        setDailyAlertData(dailyData);
                        localStorage.setItem('daily_alert_data', JSON.stringify(dailyData));
                    } catch (authErr) {
                        console.warn('Error fetching daily alerts with auth:', authErr);
                        const savedDailyData = localStorage.getItem('daily_alert_data');
                        if (savedDailyData) {
                            setDailyAlertData(JSON.parse(savedDailyData));
                        }
                    }
                }

                // Fetch dashboard statistics (device activity and sensor distribution)
            } catch (error) {
                console.error('Error fetching statistics:', error);

                // Try to load last saved data from localStorage
                const lastStats = localStorage.getItem('last_statistics');

                if (lastStats) {
                    setStats(JSON.parse(lastStats));
                }
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
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card py-1 mb-2">
                <div className="px-4 py-1">
                    <div className="space-y-0">
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <BarChart3 className="w-8 h-8 text-primary" />
                            Thống Kê Hệ Thống
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Tổng quan về các thiết bị, cảm biến và cảnh báo nguy hiểm
                        </p>
                    </div>
                </div>
            </header>

            {loading ? (
                <div className="px-4">
                    <Card>
                        <CardContent className="pt-6">
                            <p>Đang tải thống kê...</p>
                        </CardContent>
                    </Card>
                </div>
            ) : stats ? (
                <div className="px-4 space-y-6">
                    {/* Key Metrics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            icon={Satellite}
                            label="Tổng Thiết Bị"
                            value={stats.total_devices}
                            isLoading={loading}
                        />

                        <StatCard
                            icon={CheckCircle}
                            label="Thiết Bị Hoạt Động"
                            value={stats.active_devices}
                            isLoading={loading}
                        />

                        <StatCard
                            icon={AlertTriangle}
                            label="Tổng Cảnh Báo"
                            value={totalAlerts}
                            isLoading={loading}
                        />

                        <StatCard
                            icon={Activity}
                            label="Loại Cảm Biến"
                            value={stats.sensor_types?.length || 0}
                            isLoading={loading}
                        />
                    </div>

                    {/* Daily Alerts Trend Chart */}
                    {dailyAlertData.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp size={24} />
                                    Xu Hướng Cảnh Báo Theo Ngày
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-2">Biểu đồ thể hiện số lượng cảnh báo trong 30 ngày gần đây</p>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={400}>
                                    <LineChart data={dailyAlertData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="date"
                                            angle={-45}
                                            textAnchor="end"
                                            height={80}
                                        />
                                        <YAxis />
                                        <Tooltip
                                            formatter={(value) => [value, 'Số cảnh báo']}
                                            labelFormatter={(label) => `Ngày: ${label}`}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="total"
                                            stroke="#ef4444"
                                            strokeWidth={2}
                                            dot={{ fill: '#ef4444', r: 4 }}
                                            activeDot={{ r: 6 }}
                                            name="Tổng Cảnh Báo"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="critical"
                                            stroke="#dc2626"
                                            strokeWidth={2}
                                            dot={{ fill: '#dc2626', r: 4 }}
                                            activeDot={{ r: 6 }}
                                            name="Nguy Hiểm"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="warning"
                                            stroke="#f97316"
                                            strokeWidth={2}
                                            dot={{ fill: '#f97316', r: 4 }}
                                            activeDot={{ r: 6 }}
                                            name="Cao"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="medium"
                                            stroke="#fbbf24"
                                            strokeWidth={2}
                                            dot={{ fill: '#fbbf24', r: 4 }}
                                            activeDot={{ r: 6 }}
                                            name="Trung Bình"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="low"
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            dot={{ fill: '#3b82f6', r: 4 }}
                                            activeDot={{ r: 6 }}
                                            name="Thấp"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                                <CustomLegend />
                            </CardContent>
                        </Card>
                    )}

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

                </div>
            ) : (
                <div className="px-4">
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <h2 className="text-lg font-semibold text-destructive mb-2">Lỗi</h2>
                            <p className="text-muted-foreground">Không thể tải thống kê. Vui lòng thử lại.</p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default StatisticsPage;
