import { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, CheckCircle2, Clock, XCircle, Filter, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input, Separator, Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../components/ui';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui';
import '../styles/adminPages.css';

export default function AlertsPage() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterDevice, setFilterDevice] = useState('');
    const [filterSensorType, setFilterSensorType] = useState('');
    const [filterSeverity, setFilterSeverity] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get('/api/alerts', {
                params: { limit: 9999999 },
                headers: { Authorization: `Bearer ${token}` },
            });
            // Map danger_level from backend to severity for frontend
            const alertsWithSeverity = (response.data.alerts || []).map(alert => ({
                ...alert,
                severity: alert.danger_level || alert.severity
            }));
            setAlerts(alertsWithSeverity);
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
                    timestamp: new Date(Date.now() - 1800000).toISOString(),
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
                    timestamp: new Date(Date.now() - 3600000).toISOString(),
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
                    timestamp: new Date(Date.now() - 7200000).toISOString(),
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
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}').username || 'user';
            await axios.post(`/api/alerts/${alertId}/acknowledge`,
                { user: currentUser },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setAlerts(alerts.map(a => a.id === alertId ? { ...a, acknowledged: true, acknowledged_by: currentUser } : a));
        } catch (error) {
            console.error('Error acknowledging alert:', error);
            alert('Lỗi: Không thể đánh dấu cảnh báo đã xử lý');
        }
    };

    const resolveAlert = async (alertId) => {
        try {
            const token = localStorage.getItem('access_token');
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}').username || 'user';
            // Acknowledge alert first as deletion endpoint may not exist
            await axios.post(`/api/alerts/${alertId}/acknowledge`,
                { user: currentUser },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Then remove from UI
            setAlerts(alerts.filter(a => a.id !== alertId));
        } catch (error) {
            console.error('Error resolving alert:', error);
            alert('Lỗi: Không thể xóa cảnh báo');
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

    const getSeverityLabel = (severity) => {
        const labels = {
            critical: 'Nguy Hiểm',
            high: 'Cao',
            medium: 'Trung Bình',
            low: 'Thấp',
        };
        return labels[severity] || severity;
    };

    const filteredAlerts = alerts.filter(alert => {
        if (filterStatus !== 'all') {
            if (filterStatus === 'acknowledged' && !alert.acknowledged) return false;
            if (filterStatus === 'unacknowledged' && alert.acknowledged) return false;
        }
        if (filterDevice && !alert.device_id.toLowerCase().includes(filterDevice.toLowerCase())) return false;
        if (filterSensorType && alert.sensor_type !== filterSensorType) return false;
        if (filterSeverity && alert.severity !== filterSeverity) return false;
        return true;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedAlerts = filteredAlerts.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    const handleFilterChange = (setter, value) => {
        setter(value);
        setCurrentPage(1);
    };

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
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                            <label className="text-sm font-medium">Trạng Thái</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => handleFilterChange(setFilterStatus, e.target.value)}
                                className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-foreground"
                            >
                                <option value="all">Tất cả</option>
                                <option value="acknowledged">Đã xử lý</option>
                                <option value="unacknowledged">Chưa xử lý</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Thiết Bị</label>
                            <Input
                                placeholder="Tìm kiếm thiết bị..."
                                value={filterDevice}
                                onChange={(e) => handleFilterChange(setFilterDevice, e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Loại Cảm Biến</label>
                            <select
                                value={filterSensorType}
                                onChange={(e) => handleFilterChange(setFilterSensorType, e.target.value)}
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
                            <label className="text-sm font-medium">Mức Độ</label>
                            <select
                                value={filterSeverity}
                                onChange={(e) => handleFilterChange(setFilterSeverity, e.target.value)}
                                className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-foreground"
                            >
                                <option value="">Tất cả</option>
                                <option value="critical">Nguy Hiểm</option>
                                <option value="high">Cao</option>
                                <option value="medium">Trung Bình</option>
                                <option value="low">Thấp</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">&nbsp;</label>
                            <Button
                                onClick={() => {
                                    setFilterStatus('all');
                                    setFilterDevice('');
                                    setFilterSensorType('');
                                    setFilterSeverity('');
                                    setCurrentPage(1);
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
                                        <TableHead className="text-right">Giá Trị</TableHead>
                                        <TableHead className="text-right">Ngưỡng</TableHead>
                                        <TableHead>Thời Gian</TableHead>
                                        <TableHead>Trạng Thái</TableHead>
                                        <TableHead>Hành Động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedAlerts.map((alert) => (
                                        <TableRow key={alert.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getSeverityIcon(alert.severity)}
                                                    <Badge variant={getSeverityBadge(alert.severity)}>
                                                        {getSeverityLabel(alert.severity)}
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
                                            <TableCell className="text-right font-semibold whitespace-nowrap">
                                                {typeof alert.value === 'number' ? alert.value.toFixed(2) : alert.value}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold whitespace-nowrap">
                                                {typeof alert.threshold === 'number' ? alert.threshold.toFixed(2) : alert.threshold}
                                            </TableCell>
                                            <TableCell className="text-sm whitespace-nowrap">
                                                {(() => {
                                                    const date = new Date(alert.timestamp);
                                                    date.setHours(date.getHours() + 7);
                                                    return date.toLocaleString('vi-VN', {
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        second: '2-digit'
                                                    });
                                                })()}
                                            </TableCell>
                                            <TableCell>
                                                {alert.acknowledged ? (
                                                    <Badge variant="outline" className="bg-green-50 text-green-700">
                                                        ✓ Đã xử lý
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="destructive">
                                                        Chưa xử lý
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
                                                            title="Đánh dấu cảnh báo đã xử lý"
                                                        >
                                                            <CheckCircle2 size={16} />
                                                        </Button>
                                                    )}
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => resolveAlert(alert.id)}
                                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Xóa cảnh báo</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                <p className="text-sm text-muted-foreground">
                                    Trang {currentPage} của {totalPages} | Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredAlerts.length)} trên {filteredAlerts.length} cảnh báo
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        variant="outline"
                                        size="sm"
                                    >
                                        ← Trước
                                    </Button>
                                    <Button
                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        variant="outline"
                                        size="sm"
                                    >
                                        Sau →
                                    </Button>
                                </div>
                            </div>
                        )}
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
                        <p className="text-sm text-muted-foreground">Chưa Xử Lý</p>
                        <p className="text-3xl font-bold text-red-600">
                            {alerts.filter(a => !a.acknowledged).length}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-sm text-muted-foreground">Đã Xử Lý</p>
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
