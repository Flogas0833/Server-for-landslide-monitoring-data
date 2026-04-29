import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MapComponent from '../components/MapComponent';
import DevicePanel from '../components/DevicePanel';
import QueryStatus from '../components/QueryStatus';
import UserMenu from '../components/UserMenu';
import { useDevices, useDeviceDetail } from '../hooks/useDevices';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Separator } from '../components/ui';
import { BarChart3, MapPin, Gauge } from 'lucide-react';

export default function MapPage() {
    const [selectedDeviceId, setSelectedDeviceId] = useState(null);
    const devicesQuery = useDevices();
    const { data: deviceDetail } = useDeviceDetail(selectedDeviceId);
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold flex items-center gap-2">
                                <MapPin className="w-8 h-8 text-primary" />
                                Bản Đồ Cảm Biến Giám Sát
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Theo dõi vị trí và trạng thái các thiết bị trong thời gian thực
                            </p>
                        </div>
                        <UserMenu />
                    </div>

                    <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
                        <QueryStatus query={devicesQuery} label="Trạng thái thiết bị" />
                        <Button
                            onClick={() => navigate('/dashboard')}
                            variant="default"
                            className="gap-2"
                        >
                            <BarChart3 className="w-4 h-4" />
                            Xem Bảng Điều Khiển
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto p-4" style={{ height: 'calc(100vh - 180px)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem', height: '100%' }}>
                    {/* Map Section */}
                    <div style={{ height: '100%', borderRadius: '0.5rem', border: '1px solid #ccc', backgroundColor: '#fff', overflow: 'hidden' }}>
                        <MapComponent onDeviceSelect={setSelectedDeviceId} />
                    </div>

                    {/* Sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingBottom: '1rem' }}>
                        {/* Device Panel */}
                        <DevicePanel
                            selectedDeviceId={selectedDeviceId}
                            onDeviceSelect={setSelectedDeviceId}
                        />

                        {/* Device Details */}
                        {selectedDeviceId && deviceDetail && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Gauge className="w-5 h-5" />
                                        Chi Tiết Thiết Bị
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">ID Thiết Bị</p>
                                        <p className="font-mono font-semibold">{deviceDetail.device_id}</p>
                                    </div>

                                    <Separator />

                                    <div>
                                        <p className="text-muted-foreground">Tọa Độ</p>
                                        <p className="text-sm">
                                            {deviceDetail.latitude?.toFixed(6)}°,{' '}
                                            {deviceDetail.longitude?.toFixed(6)}°
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-muted-foreground">Độ Cao</p>
                                        <p className="font-semibold">{deviceDetail.altitude?.toFixed(1)} m</p>
                                    </div>

                                    {deviceDetail.readings && (
                                        <>
                                            <Separator />
                                            <div className="space-y-2">
                                                <p className="font-semibold">Dữ Liệu Mới Nhất</p>

                                                {deviceDetail.readings.tilt?.[0] && (
                                                    <div className="bg-muted p-2 rounded">
                                                        <Badge className="mb-1">Tilt</Badge>
                                                        <p className="text-xs">
                                                            Roll: <span className="font-mono">{deviceDetail.readings.tilt[0].data?.roll}°</span>
                                                        </p>
                                                        <p className="text-xs">
                                                            Pitch: <span className="font-mono">{deviceDetail.readings.tilt[0].data?.pitch}°</span>
                                                        </p>
                                                    </div>
                                                )}

                                                {deviceDetail.readings.vibration?.[0] && (
                                                    <div className="bg-muted p-2 rounded">
                                                        <Badge className="mb-1">Vibration</Badge>
                                                        <p className="text-xs">
                                                            {deviceDetail.readings.vibration[0].data?.frequency}
                                                            <span className="text-muted-foreground"> Hz</span>
                                                        </p>
                                                    </div>
                                                )}

                                                {deviceDetail.readings.displacement?.[0] && (
                                                    <div className="bg-muted p-2 rounded">
                                                        <Badge className="mb-1">Displacement</Badge>
                                                        <p className="text-xs">
                                                            {deviceDetail.readings.displacement[0].data?.cumulative}
                                                            <span className="text-muted-foreground"> mm</span>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
