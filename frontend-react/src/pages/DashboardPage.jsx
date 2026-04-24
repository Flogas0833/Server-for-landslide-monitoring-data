import { useState } from 'react';
import Statistics from '../components/Statistics';
import AlertPanel from '../components/AlertPanel';
import { SensorTable } from '../components/SensorTable';
import '../styles/dashboardPage.css';

export default function DashboardPage() {
    const [selectedSensor, setSelectedSensor] = useState('tilt');
    const [deviceFilter, setDeviceFilter] = useState('');
    const [hoursFilter, setHoursFilter] = useState(24);

    const sensorTypes = ['tilt', 'vibration', 'displacement', 'rainfall', 'temperature'];

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
        <div className="dashboard-page">
            <header className="page-header">
                <h1>📊 Bảng Điều Khiển Giám Sát</h1>
                <div className="header-controls">
                    <a href="/" className="btn">
                        🗺️ Xem Bản Đồ
                    </a>
                </div>
            </header>

            <Statistics />

            <AlertPanel />

            <div className="charts-section">
                <h2>📈 Biểu Đồ Dữ Liệu Cảm Biến</h2>

                <div className="chart-controls">
                    <div className="control-group">
                        <label htmlFor="sensor-select">Chọn Loại Cảm Biến</label>
                        <select
                            id="sensor-select"
                            value={selectedSensor}
                            onChange={(e) => setSelectedSensor(e.target.value)}
                            className="control-select"
                        >
                            {sensorTypes.map((type) => (
                                <option key={type} value={type}>
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="control-group">
                        <label htmlFor="device-input">Device ID (Tùy Chọn)</label>
                        <input
                            id="device-input"
                            type="text"
                            placeholder="ví dụ: DEVICE001"
                            value={deviceFilter}
                            onChange={(e) => setDeviceFilter(e.target.value)}
                            className="control-input"
                        />
                    </div>

                    <div className="control-group">
                        <label htmlFor="hours-select">Khoảng Thời Gian</label>
                        <select
                            id="hours-select"
                            value={hoursFilter}
                            onChange={(e) => setHoursFilter(parseInt(e.target.value))}
                            className="control-select"
                        >
                            <option value={1}>1 giờ</option>
                            <option value={6}>6 giờ</option>
                            <option value={12}>12 giờ</option>
                            <option value={24}>24 giờ</option>
                            <option value={168}>1 tuần</option>
                        </select>
                    </div>
                </div>

                <div className="sensor-data-container">
                    <SensorTable sensorType={selectedSensor} params={params} />
                </div>
            </div>
        </div>
    );
}
