import { useState, useMemo } from 'react';
import { useDevices } from '../hooks/useDevices';
import { formatTime } from '../utils/helpers';
import '../styles/devicePanel.css';

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
        <div className="device-panel">
            <div className="panel-header">
                <h2>📋 Danh Sách Cảm Biến</h2>
            </div>

            <div className="search-box">
                <input
                    type="text"
                    placeholder="Tìm kiếm cảm biến..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>

            <div className="device-list">
                {isLoading ? (
                    <div className="loading">Đang tải...</div>
                ) : filteredDevices.length === 0 ? (
                    <div className="empty">Không có cảm biến nào</div>
                ) : (
                    filteredDevices.map((device) => (
                        <div
                            key={device.device_id}
                            className={`device-item ${selectedDeviceId === device.device_id ? 'active' : ''}`}
                            onClick={() => onDeviceSelect(device.device_id)}
                        >
                            <div className="device-info">
                                <h3>{device.name || device.device_id}</h3>
                                <p className="device-id">{device.device_id}</p>
                                <p className="device-location">
                                    📍 {device.latitude?.toFixed(4)}, {device.longitude?.toFixed(4)}
                                </p>
                                <p className="device-time">Cập nhật: {formatTime(device.last_update)}</p>
                            </div>
                            <div className={`device-status ${device.status}`}>
                                {device.status === 'active' ? '✓' : '✗'}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
