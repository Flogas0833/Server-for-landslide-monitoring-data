import { useActiveAlerts, useAcknowledgeAlert } from '../hooks/useAlerts';
import { formatTime, getAlertColor } from '../utils/helpers';
import '../styles/alertPanel.css';

export default function AlertPanel() {
    const { data: alertData = {} } = useActiveAlerts();
    const { mutate: acknowledgeAlert } = useAcknowledgeAlert();

    const alerts = alertData.alerts || [];
    const hasAlerts = alerts.length > 0;

    if (!hasAlerts) {
        return (
            <div className="alert-panel-empty">
                <p>✓ Không có cảnh báo nào</p>
            </div>
        );
    }

    return (
        <div className="alert-panel">
            <div className="alert-header">
                <h3>🚨 Cảnh Báo Hoạt Động ({alerts.length})</h3>
            </div>

            <div className="alert-list">
                {alerts.map((alert) => (
                    <div key={alert.id} className={`alert-item alert-${alert.danger_level?.toLowerCase()}`}>
                        <div className="alert-content">
                            <div className="alert-title">
                                <span className="alert-icon">⚠️</span>
                                <strong>{alert.sensor_type || 'Unknown'}</strong>
                            </div>
                            <p className="alert-message">{alert.message || 'Có vấn đề được phát hiện'}</p>
                            <div className="alert-details">
                                <span>Device: {alert.device_id}</span>
                                <span>Mức: {alert.danger_level}</span>
                                <span>Lúc: {formatTime(alert.triggered_at)}</span>
                            </div>
                        </div>
                        {!alert.acknowledged_at && (
                            <button
                                className="btn-acknowledge"
                                onClick={() => acknowledgeAlert({ alertId: alert.id })}
                            >
                                Xác nhận
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
