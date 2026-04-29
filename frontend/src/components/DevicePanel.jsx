import { useState, useMemo } from 'react';
import { useDevices } from '../hooks/useDevices';
import { formatTime } from '../utils/helpers';
import { Card, CardContent, CardHeader, CardTitle, Input, Badge, Button, Loader } from './ui';
import { MapPin, Wifi, WifiOff } from 'lucide-react';

export default function DevicePanel({ selectedDeviceId, onDeviceSelect }) {
    const [searchTerm, setSearchTerm] = useState('');
    const { data: devices = [], isLoading } = useDevices();

    const filteredDevices = useMemo(() => {
        return devices.filter(
            (device) =>
                device.device_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                device.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [devices, searchTerm]);

    return (
        <Card className="w-full h-full flex flex-col">
            <CardHeader className="pb-3">
                <CardTitle>Danh Sách Cảm Biến</CardTitle>
            </CardHeader>

            <div className="px-6 pb-3">
                <Input
                    type="text"
                    placeholder="Tìm kiếm cảm biến..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <CardContent className="flex-1 overflow-y-auto space-y-2">
                {isLoading ? (
                    <div className="flex justify-center items-center h-20">
                        <Loader />
                    </div>
                ) : filteredDevices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>Không có cảm biến nào</p>
                    </div>
                ) : (
                    filteredDevices.map((device) => (
                        <Button
                            key={device.device_id}
                            variant={selectedDeviceId === device.device_id ? 'default' : 'outline'}
                            className="w-full justify-start h-auto py-3 px-4"
                            onClick={() => onDeviceSelect(device.device_id)}
                        >
                            <div className="text-left w-full space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold">{device.name || device.device_id}</span>
                                    {device.status === 'active' ? (
                                        <Wifi className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <WifiOff className="w-4 h-4 text-red-600" />
                                    )}
                                </div>
                                <p className="text-xs opacity-70">{device.device_id}</p>
                                <div className="flex items-center gap-1 text-xs opacity-70">
                                    <MapPin className="w-3 h-3" />
                                    {device.latitude?.toFixed(4)}, {device.longitude?.toFixed(4)}
                                </div>
                                <p className="text-xs opacity-70">Cập nhật: {formatTime(device.last_update)}</p>
                            </div>
                        </Button>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
