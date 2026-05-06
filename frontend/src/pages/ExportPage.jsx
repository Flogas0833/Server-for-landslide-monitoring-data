import { useState } from 'react';
import axios from 'axios';
import { Download, FileJson, FileText, Filter, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Separator, Badge } from '../components/ui';
import '../styles/adminPages.css';

export default function ExportPage() {
    const [loading, setLoading] = useState(false);
    const [exportFormat, setExportFormat] = useState('csv');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [deviceId, setDeviceId] = useState('');
    const [sensorType, setSensorType] = useState('');
    const [exportedFiles, setExportedFiles] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');

    const handleExport = async () => {
        if (!startDate || !endDate) {
            alert('Vui lòng chọn ngày bắt đầu và ngày kết thúc');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const params = new URLSearchParams({
                start_date: new Date(startDate).toISOString(),
                end_date: new Date(endDate).toISOString(),
                format: exportFormat,
            });

            if (deviceId) params.append('device_id', deviceId);
            if (sensorType) params.append('sensor_type', sensorType);

            const response = await axios.get(`/api/export/data?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `export_${new Date().getTime()}.${exportFormat}`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);

            // Add to exported files list
            const newFile = {
                id: Date.now(),
                name: `export_${new Date().getTime()}.${exportFormat}`,
                format: exportFormat,
                dateRange: `${startDate} to ${endDate}`,
                size: (response.data.size / 1024).toFixed(2),
                createdAt: new Date(),
            };
            setExportedFiles([newFile, ...exportedFiles]);
            setSuccessMessage('✓ Xuất dữ liệu thành công!');

            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error exporting data:', error);
            alert('Lỗi khi xuất dữ liệu. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setStartDate('');
        setEndDate('');
        setDeviceId('');
        setSensorType('');
        setExportFormat('csv');
    };

    const setQuickRange = (days) => {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

        const formatDate = (date) => date.toISOString().split('T')[0];
        setStartDate(formatDate(startDate));
        setEndDate(formatDate(endDate));
    };

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h1>
                    <Download size={28} />
                    Xuất Dữ Liệu
                </h1>
                <p className="subtitle">Tải xuống dữ liệu cảm biến dưới dạng CSV hoặc JSON</p>
            </div>

            {successMessage && (
                <Card className="mb-6 bg-green-50 border-green-200">
                    <CardContent className="pt-6 flex items-center gap-2 text-green-700">
                        <CheckCircle2 size={24} />
                        {successMessage}
                    </CardContent>
                </Card>
            )}

            {/* Export Form */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter size={20} />
                        Cài Đặt Xuất Dữ Liệu
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Format Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Định Dạng Xuất</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="csv"
                                    checked={exportFormat === 'csv'}
                                    onChange={(e) => setExportFormat(e.target.value)}
                                    className="rounded"
                                />
                                <FileText size={18} />
                                <span>CSV (Excel)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="json"
                                    checked={exportFormat === 'json'}
                                    onChange={(e) => setExportFormat(e.target.value)}
                                    className="rounded"
                                />
                                <FileJson size={18} />
                                <span>JSON</span>
                            </label>
                        </div>
                    </div>

                    {/* Date Range */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Khoảng Thời Gian</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                                <label className="text-xs text-muted-foreground">Ngày Bắt Đầu</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-foreground"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Ngày Kết Thúc</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-foreground"
                                />
                            </div>
                        </div>

                        {/* Quick Range Buttons */}
                        <div className="flex flex-wrap gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setQuickRange(1)}
                            >
                                1 Ngày
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setQuickRange(7)}
                            >
                                1 Tuần
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setQuickRange(30)}
                            >
                                1 Tháng
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setQuickRange(90)}
                            >
                                3 Tháng
                            </Button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Bộ Lọc (Tùy Chọn)</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-muted-foreground">Thiết Bị</label>
                                <Input
                                    placeholder="Để trống để xuất tất cả"
                                    value={deviceId}
                                    onChange={(e) => setDeviceId(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Loại Cảm Biến</label>
                                <select
                                    value={sensorType}
                                    onChange={(e) => setSensorType(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-foreground"
                                >
                                    <option value="">Tất cả loại cảm biến</option>
                                    <option value="tilt">Tilt (Nghiêng)</option>
                                    <option value="vibration">Vibration (Rung)</option>
                                    <option value="displacement">Displacement (Chuyển vị)</option>
                                    <option value="rainfall">Rainfall (Mưa)</option>
                                    <option value="temperature">Temperature (Nhiệt độ)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <Button
                            onClick={handleExport}
                            disabled={loading || !startDate || !endDate}
                            className="flex-1 gap-2"
                        >
                            <Download size={18} />
                            {loading ? 'Đang Xuất...' : 'Xuất Dữ Liệu'}
                        </Button>
                        <Button
                            onClick={resetForm}
                            variant="outline"
                        >
                            Xóa
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Export History */}
            {exportedFiles.length > 0 && (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle>Lịch Sử Xuất ({exportedFiles.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {exportedFiles.map((file) => (
                                    <div
                                        key={file.id}
                                        className="flex items-center justify-between p-3 bg-muted rounded-md"
                                    >
                                        <div className="flex items-center gap-3">
                                            {file.format === 'csv' ? (
                                                <FileText className="w-5 h-5 text-blue-600" />
                                            ) : (
                                                <FileJson className="w-5 h-5 text-green-600" />
                                            )}
                                            <div>
                                                <p className="font-medium">{file.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {file.dateRange} • {file.size} KB • {file.createdAt.toLocaleTimeString('vi-VN')}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="uppercase text-xs">
                                            {file.format}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Separator className="my-6" />
                </>
            )}
        </div>
    );
}
