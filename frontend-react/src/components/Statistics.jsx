import { useStatistics } from '../hooks/useSensors';
import { useAlertStats } from '../hooks/useAlerts';
import '../styles/statistics.css';

export default function Statistics() {
    const { data: stats = {}, isLoading: statsLoading } = useStatistics();
    const { data: alertStats = {}, isLoading: alertsLoading } = useAlertStats();

    return (
        <div className="stats-container">
            <div className="stat-card">
                <div className="stat-icon">🛰️</div>
                <div className="stat-content">
                    <div className="stat-label">Tổng Cảm Biến</div>
                    <div className="stat-value">
                        {statsLoading ? '--' : stats.total_devices || 0}
                    </div>
                </div>
            </div>

            <div className="stat-card">
                <div className="stat-icon">✓</div>
                <div className="stat-content">
                    <div className="stat-label">Cảm Biến Hoạt Động</div>
                    <div className="stat-value">
                        {statsLoading ? '--' : stats.active_devices || 0}
                    </div>
                </div>
            </div>

            <div className="stat-card">
                <div className="stat-icon">🚨</div>
                <div className="stat-content">
                    <div className="stat-label">Cảnh Báo Hoạt Động</div>
                    <div className="stat-value">
                        {alertsLoading ? '--' : alertStats.stats?.active_alerts || 0}
                    </div>
                </div>
            </div>

            <div className="stat-card">
                <div className="stat-icon">⚠️</div>
                <div className="stat-content">
                    <div className="stat-label">Cảnh Báo Hôm Nay</div>
                    <div className="stat-value">
                        {alertsLoading ? '--' : alertStats.stats?.total_alerts_today || 0}
                    </div>
                </div>
            </div>
        </div>
    );
}
