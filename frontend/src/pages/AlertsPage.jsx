import { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, CheckCircle2, Clock, XCircle, Filter } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input, Separator } from '../components/ui';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui';
import '../styles/adminPages.css';

export default function AlertsPage() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterDevice, setFilterDevice] = useState('');
    const [filterSensorType, setFilterSensorType] = useState('');

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get('/api/alerts', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAlerts(response.data.alerts || []);
        } catch (error) {
            console.error('Error fetching alerts:', error);
            // Mock data fallback
            setAlerts([
                {
                    id: 1,
                    device_id: 'DEVICE_001',
                    sensor_type: 'tilt',
                    severity: 'high',
                    message: 'Độ nghiêng vượt ngưỡng cảnh báo',
                    value: 45.5,
                    threshold: 30,
                    created_at: new Date(Date.now() - 1800000).toISOString(),
                    acknowledged: false,
                    acknowledged_by: null,
                },
                {
                    id: 2,
                    device_id: 'DEVICE_002',
                    sensor_type: 'vibration',
                    severity: 'medium',
                    message: 'Rung động bất thường phát hiện',
                    value: 12.3,
                    threshold: 10,
                    created_at: new Date(Date.now() - 3600000).toISOString(),
                    acknowledged: true,
                    acknowledged_by: 'admin',
                },
                {
                    id: 3,
                    device_id: 'DEVICE_003',
                    sensor_type: 'displacement',
                    severity: 'low',
                    message: 'Chuyển vị tăng dần',
                    value: 5.2,
                    threshold: 10,
                    created_at: new Date(Date.now() - 7200000).toISOString(),
                    acknowledged: false,
                    acknowledged_by: null,
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const acknowledgeAlert = async (alertId) => {
        try {
            const token = localStorage.getItem('access_token');
            await axios.put(`/api/alerts/${alertId}/acknowledge`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAlerts(alerts.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
        } catch (error) {
            console.error('Error acknowledging alert:', error);
        }
    };

    const resolveAlert = async (alertId) => {
        try {
            const token = localStorage.getItem('access_token');
            await axios.delete(`/api/alerts/${alertId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAlerts(alerts.filter(a => a.id !== alertId));
        } catch (error) {
            console.error('Error resolving alert:', error);
        }
    };

    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'critical':
                return <XCircle className="w-5 h-5 text-red-600" />;
            case 'high':
                return <AlertCircle className="w-5 h-5 text-orange-600" />;
            case 'medium':
                return <AlertCircle className="w-5 h-5 text-yellow-600" />;
            default:
                return <Clock className="w-5 h-5 text-blue-600" />;
        }
    };

    const getSeverityBadge = (severity) => {
        const variants = {
            critical: 'destructive',
            high: 'outline',
            medium: 'outline',
            low: 'outline',
        };
        return variants[severity] || 'outline';
    };

    const filteredAlerts = alerts.filter(alert => {
        if (filterStatus !== 'all') {
            if (filterStatus === 'acknowledged' && !alert.acknowledged) return false;
            if (filterStatus === 'unacknowledged' && alert.acknowledged) return false;
        }
        if (filterDevice && !alert.device_id.toLowerCase().includes(filterDevice.toLowerCase())) return false;
        if (filterSensorType && alert.sensor_type !== filterSensorType) return false;
        return true;
    });

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h1>
                    <AlertCircle size={28} />
                    Quản Lý Cảnh Báo
                </h1>
                <p className="subtitle">Xem và quản lý các cảnh báo từ hệ thống giám sát</p>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter size={20} />
                        Bộ Lọc
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-sm font-medium">Trạng Thái</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-foreground"
                            >
                                <option value="all">Tất cả</option>
                                <option value="acknowledged">Đã xác nhận</option>
                                <option value="unacknowledged">Chưa xác nhận</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Thiết Bị</label>
                            <Input
                                placeholder="Tìm kiếm thiết bị..."
                                value={filterDevice}
                                onChange={(e) => setFilterDevice(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Loại Cảm Biến</label>
                            <select
                                value={filterSensorType}
                                onChange={(e) => setFilterSensorType(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-foreground"
                            >
                                <option value="">Tất cả</option>
                                <option value="tilt">Tilt (Nghiêng)</option>
                                <option value="vibration">Vibration (Rung)</option>
                                <option value="displacement">Displacement (Chuyển vị)</option>
                                <option value="rainfall">Rainfall (Mưa)</option>
                                <option value="temperature">Temperature (Nhiệt độ)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">&nbsp;</label>
                            <Button
                                onClick={() => {
                                    setFilterStatus('all');
                                    setFilterDevice('');
                                    setFilterSensorType('');
                                }}
                                variant="outline"
                                className="w-full"
                            >
                                Xóa Bộ Lọc
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Separator />

            {/* Alerts Table */}
            {loading ? (
                <Card>
                    <CardContent className="pt-6">
                        <p>Đang tải cảnh báo...</p>
                    </CardContent>
                </Card>
            ) : filteredAlerts.length === 0 ? (
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-muted-foreground">Không có cảnh báo nào</p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Danh Sách Cảnh Báo ({filteredAlerts.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Mức Độ</TableHead>
                                        <TableHead>Thiết Bị</TableHead>
                                        <TableHead>Cảm Biến</TableHead>
                                        <TableHead>Thông Báo</TableHead>
                                        <TableHead>Giá Trị</TableHead>
                                        <TableHead>Ngưỡng</TableHead>
                                        <TableHead>Thời Gian</TableHead>
                                        <TableHead>Trạng Thái</TableHead>
                                        <TableHead>Hành Động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAlerts.map((alert) => (
                                        <TableRow key={alert.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getSeverityIcon(alert.severity)}
                                                    <Badge variant={getSeverityBadge(alert.severity)}>
                                                        {alert.severity}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {alert.device_id}
                                            </TableCell>
                                            <TableCell className="capitalize">
                                                {alert.sensor_type}
                                            </TableCell>
                                            <TableCell>{alert.message}</TableCell>
                                            <TableCell className="text-right">
                                                <span className="font-semibold">{alert.value.toFixed(2)}</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {alert.threshold.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {new Date(alert.created_at).toLocaleString('vi-VN')}
                                            </TableCell>
                                            <TableCell>
                                                {alert.acknowledged ? (
                                                    <Badge variant="outline" className="bg-green-50 text-green-700">
                                                        ✓ Đã xác nhận
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="destructive">
                                                        Chưa xác nhận
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    {!alert.acknowledged && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => acknowledgeAlert(alert.id)}
                                                        >
                                                            <CheckCircle2 size={16} />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => resolveAlert(alert.id)}
                                                    >
                                                        Xóa
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-sm text-muted-foreground">Tổng Cảnh Báo</p>
                        <p className="text-3xl font-bold">{alerts.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-sm text-muted-foreground">Chưa Xác Nhận</p>
                        <p className="text-3xl font-bold text-red-600">
                            {alerts.filter(a => !a.acknowledged).length}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-sm text-muted-foreground">Đã Xác Nhận</p>
                        <p className="text-3xl font-bold text-green-600">
                            {alerts.filter(a => a.acknowledged).length}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-sm text-muted-foreground">Mức Độ Cao</p>
                        <p className="text-3xl font-bold text-orange-600">
                            {alerts.filter(a => ['critical', 'high'].includes(a.severity)).length}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
