import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Statistics from '../components/Statistics';
import AlertPanel from '../components/AlertPanel';
import { SensorTable } from '../components/SensorTable';
import UserMenu from '../components/UserMenu';
import { Card, CardHeader, CardTitle, CardContent, Input, Button, Separator } from '../components/ui';
import { Map, BarChart3, Filter } from 'lucide-react';

export default function DashboardPage() {
    const [selectedSensor, setSelectedSensor] = useState('tilt');
    const [deviceFilter, setDeviceFilter] = useState('');
    const [hoursFilter, setHoursFilter] = useState(24);
    const navigate = useNavigate();

    const sensorTypes = [
        { id: 'tilt', label: 'Tilt (Nghiêng)' },
        { id: 'vibration', label: 'Vibration (Rung)' },
        { id: 'displacement', label: 'Displacement (Chuyển vị)' },
        { id: 'rainfall', label: 'Rainfall (Mưa)' },
        { id: 'temperature', label: 'Temperature (Nhiệt độ)' },
    ];

    const timeOptions = [
        { value: 1, label: '1 giờ' },
        { value: 6, label: '6 giờ' },
        { value: 12, label: '12 giờ' },
        { value: 24, label: '24 giờ' },
        { value: 168, label: '1 tuần' },
    ];

    const calculateDateRange = () => {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - hoursFilter * 60 * 60 * 1000);
        return {
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
        };
    };

    const dateRange = calculateDateRange();
    const params = {
        limit: 50,
        device_id: deviceFilter || undefined,
        ...dateRange,
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold flex items-center gap-2">
                                <BarChart3 className="w-8 h-8 text-primary" />
                                Bảng Điều Khiển Giám Sát
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Phân tích dữ liệu cảm biến và theo dõi cảnh báo
                            </p>
                        </div>
                        <UserMenu />
                    </div>

                    <div className="flex items-center justify-between mt-4">
                        <div></div>
                        <Button
                            onClick={() => navigate('/')}
                            variant="outline"
                            className="gap-2"
                        >
                            <Map className="w-4 h-4" />
                            Xem Bản Đồ
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto p-4 space-y-6">
                {/* Statistics Section */}
                <Statistics />

                <Separator />

                {/* Alert Section */}
                <AlertPanel />

                <Separator />

                {/* Data Table Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-primary" />
                        <h2 className="text-2xl font-bold">Bộ Lọc Dữ Liệu</h2>
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

                                {/* Time Range Select */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Khoảng Thời Gian</label>
                                    <select
                                        value={hoursFilter}
                                        onChange={(e) => setHoursFilter(parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                                    >
                                        {timeOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
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
