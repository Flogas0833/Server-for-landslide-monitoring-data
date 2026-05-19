import { useState } from 'react';
import Statistics from '../components/Statistics';
import AlertPanel from '../components/AlertPanel';
import { SensorTable } from '../components/SensorTable';
import QueryStatus from '../components/QueryStatus';
import { Card, CardHeader, CardTitle, CardContent, Input, Button, Separator } from '../components/ui';
import { useStatistics } from '../hooks/useSensors';
import { LayoutGrid, Filter, Download } from 'lucide-react';
import { calculateUTCDateRange, getTodayGMT7 } from '../utils/helpers';

export default function DashboardPage() {
    const [selectedSensor, setSelectedSensor] = useState('tilt');
    const [deviceFilter, setDeviceFilter] = useState('');
    const [selectedDate, setSelectedDate] = useState(getTodayGMT7());
    const statsQuery = useStatistics();

    const sensorTypes = [
        { id: 'tilt', label: 'Tilt (Nghiêng)' },
        { id: 'vibration', label: 'Vibration (Rung)' },
        { id: 'displacement', label: 'Displacement (Chuyển vị)' },
        { id: 'rainfall', label: 'Rainfall (Mưa)' },
        { id: 'temperature', label: 'Temperature (Nhiệt độ)' },
    ];

    const calculateDateRange = () => {
        return calculateUTCDateRange(selectedDate);
    };

    const dateRange = calculateDateRange();
    const params = {
        limit: 9999999,
        device_id: deviceFilter || undefined,
        ...dateRange,
    };

    const handleExportExcel = () => {
        const queryParams = new URLSearchParams({
            sensor_type: selectedSensor,
            ...(deviceFilter && { device_id: deviceFilter }),
            start_date: dateRange.start_date,
            end_date: dateRange.end_date,
        });
        window.open(`/api/sensors/export?${queryParams.toString()}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card py-1 mb-2">
                <div className="px-4 py-1">
                    <div className="space-y-0">
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <LayoutGrid className="w-8 h-8 text-primary" />
                            Bảng Điều Khiển Giám Sát
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Phân tích dữ liệu cảm biến và theo dõi cảnh báo
                        </p>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                        <QueryStatus query={statsQuery} label="Trạng thái dữ liệu" verbose={true} />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-4 space-y-6">
                {/* Statistics Section */}
                <Statistics />

                <Separator />

                {/* Alert Section */}
                <AlertPanel showActions={false} />

                <Separator />

                {/* Data Table Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-primary" />
                            <h2 className="text-2xl font-bold">Bộ Lọc Dữ Liệu</h2>
                        </div>
                        <Button
                            onClick={handleExportExcel}
                            className="flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Xuất Excel
                        </Button>
                    </div>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Sensor Type Select */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Loại Cảm Biến</label>
                                    <select
                                        value={selectedSensor}
                                        onChange={(e) => setSelectedSensor(e.target.value)}
                                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                                    >
                                        {sensorTypes.map((type) => (
                                            <option key={type.id} value={type.id}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Device Filter */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Device ID (Tùy Chọn)</label>
                                    <Input
                                        type="text"
                                        placeholder="ví dụ: DEVICE001"
                                        value={deviceFilter}
                                        onChange={(e) => setDeviceFilter(e.target.value)}
                                    />
                                </div>

                                {/* Date Select */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Chọn Ngày</label>
                                    <Input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sensor Data Table */}
                <SensorTable sensorType={selectedSensor} params={params} />
            </main>
        </div>
    );
}
