import { useState } from 'react';
import axios from 'axios';
import { Download, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from './ui';

export default function ExportCard({ dateRange, deviceFilter, sensorType }) {
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleExport = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const params = new URLSearchParams({
                start_date: dateRange.start_date,
                end_date: dateRange.end_date,
                format: 'csv',
            });

            if (deviceFilter) params.append('device_id', deviceFilter);
            if (sensorType) params.append('sensor_type', sensorType);

            const response = await axios.get(`/api/export/csv?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `export_sensor_data_${new Date().getTime()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);

            setSuccessMessage('✓ Xuất dữ liệu thành công!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error exporting data:', error);
            alert('Lỗi khi xuất dữ liệu. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Download size={20} />
                    Xuất Dữ Liệu
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {successMessage && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md text-green-700">
                        <CheckCircle2 size={20} />
                        {successMessage}
                    </div>
                )}
                <p className="text-sm text-muted-foreground">
                    Tải xuống dữ liệu cảm biến hiện tại dưới dạng tệp Excel (CSV)
                </p>
                <Button
                    onClick={handleExport}
                    disabled={loading}
                    className="w-full gap-2"
                >
                    <Download size={18} />
                    {loading ? 'Đang Xuất...' : 'Xuất dữ liệu (CSV)'}
                </Button>
            </CardContent>
        </Card>
    );
}
