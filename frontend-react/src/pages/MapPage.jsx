import { useState } from 'react';
import MapComponent from '../components/MapComponent';
import DevicePanel from '../components/DevicePanel';
import { useDeviceDetail } from '../hooks/useDevices';
import { formatTime } from '../utils/helpers';
import '../styles/mapPage.css';

export default function MapPage() {
    const [selectedDeviceId, setSelectedDeviceId] = useState(null);
    const { data: deviceDetail } = useDeviceDetail(selectedDeviceId);

    return (
        <div className="map-page">
            <header className="page-header">
                <h1>🛰️ Bản đồ Cảm Biến Giám Sát Sạt Lở</h1>
                <div className="header-info">
                    <span id="last-update">Cập nhật: --:--:--</span>
                </div>
            </header>

            <div className="map-layout">
                <MapComponent onDeviceSelect={setSelectedDeviceId} />

                <div className="side-panel-container">
                    <DevicePanel selectedDeviceId={selectedDeviceId} onDeviceSelect={setSelectedDeviceId} />

                    {selectedDeviceId && deviceDetail && (
                        <div className="device-detail-panel">
                            <h3>Chi Tiết Thiết Bị</h3>
                            <div className="detail-content">
                                <p>
                                    <strong>ID:</strong> {deviceDetail.device_id}
                                </p>
                                <p>
                                    <strong>Tọa độ:</strong> {deviceDetail.latitude?.toFixed(6)},{' '}
                                    {deviceDetail.longitude?.toFixed(6)}
                                </p>
                                <p>
                                    <strong>Độ cao:</strong> {deviceDetail.altitude?.toFixed(1)}m
                                </p>

                                {deviceDetail.readings && (
                                    <div className="readings-section">
                                        <h4>Dữ liệu Mới Nhất</h4>
                                        {deviceDetail.readings.tilt?.[0] && (
                                            <div className="reading">
                                                <strong>Tilt (Nghiêng):</strong> Roll: {deviceDetail.readings.tilt[0].data?.roll}°,
                                                Pitch: {deviceDetail.readings.tilt[0].data?.pitch}°
                                            </div>
                                        )}
                                        {deviceDetail.readings.vibration?.[0] && (
                                            <div className="reading">
                                                <strong>Vibration:</strong> Frequency: {deviceDetail.readings.vibration[0].data?.frequency}Hz
                                            </div>
                                        )}
                                        {deviceDetail.readings.displacement?.[0] && (
                                            <div className="reading">
                                                <strong>Displacement:</strong> Cumulative:{' '}
                                                {deviceDetail.readings.displacement[0].data?.cumulative}mm
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
