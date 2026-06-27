import { useState } from 'react';
import MapComponent from '../components/MapComponent';
import DevicePanel from '../components/DevicePanel';
import QueryStatus from '../components/QueryStatus';
import { useDevices, useDeviceDetail } from '../hooks/useDevices';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Separator } from '../components/ui';
import { Map, Gauge } from 'lucide-react';

export default function MapPage() {
    const [selectedDeviceId, setSelectedDeviceId] = useState(null);
    const devicesQuery = useDevices();
    const { data: deviceDetail } = useDeviceDetail(selectedDeviceId);

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card py-1 mb-2">
                <div className="px-4 py-1">
                    <div className="space-y-0">
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <Map className="w-8 h-8 text-primary" />
                            Bản Đồ Cảm Biến Giám Sát
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Theo dõi vị trí và trạng thái các thiết bị trong thời gian thực
                        </p>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                        <QueryStatus query={devicesQuery} label="Trạng thái thiết bị" verbose={true} />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-4" style={{ height: 'calc(100vh - 180px)' }}>
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
                                                        <Badge className="mb-1">Tilt (Nghịeng)</Badge>
                                                        <p className="text-xs">
                                                            Góc Ngang: <span className="font-mono">{deviceDetail.readings.tilt[0].data?.roll}°</span>
                                                        </p>
                                                        <p className="text-xs">
                                                            Góc Dọc: <span className="font-mono">{deviceDetail.readings.tilt[0].data?.pitch}°</span>
                                                        </p>
                                                    </div>
                                                )}

                                                {deviceDetail.readings.vibration?.[0] && (
                                                    <div className="bg-muted p-2 rounded">
                                                        <Badge className="mb-1">Vibration (Rung)</Badge>
                                                        <p className="text-xs">
                                                            {deviceDetail.readings.vibration[0].data?.frequency}
                                                            <span className="text-muted-foreground"> Hz</span>
                                                        </p>
                                                    </div>
                                                )}

                                                {deviceDetail.readings.displacement?.[0] && (
                                                    <div className="bg-muted p-2 rounded">
                                                        <Badge className="mb-1">Displacement (Chuyển vị)</Badge>
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
