import { useActiveAlerts, useAcknowledgeAlert } from '../hooks/useAlerts';
import { formatTime } from '../utils/helpers';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Alert, AlertTitle, AlertDescription } from './ui';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function AlertPanel() {
    const { data: alertData = {} } = useActiveAlerts();
    const { mutate: acknowledgeAlert } = useAcknowledgeAlert();

    const alerts = alertData.alerts || [];
    const hasAlerts = alerts.length > 0;

    const getAlertVariant = (dangerLevel) => {
        const level = dangerLevel?.toLowerCase();
        if (level === 'critical') return 'destructive';
        if (level === 'high') return 'destructive';
        if (level === 'medium') return 'default';
        return 'secondary';
    };

    if (!hasAlerts) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Tình trạng cảnh báo
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-6">
                        <p className="text-muted-foreground">✓ Không có cảnh báo nào</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-destructive" />
                        Cảnh Báo Hoạt Động
                    </span>
                    <Badge variant="destructive">{alerts.length}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
                {alerts.map((alert) => (
                    <Alert key={alert.id} variant="destructive" className="border-destructive/50">
                        <div className="space-y-2">
                            <div className="flex items-start justify-between">
                                <AlertTitle className="font-semibold">
                                    {alert.sensor_type || 'Unknown'}
                                </AlertTitle>
                                <Badge variant={getAlertVariant(alert.danger_level)}>
                                    {alert.danger_level}
                                </Badge>
                            </div>
                            <AlertDescription className="text-sm">
                                {alert.message || 'Có vấn đề được phát hiện'}
                            </AlertDescription>
                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                                <div className="space-y-0.5">
                                    <p>Device: <span className="font-mono">{alert.device_id}</span></p>
                                    <p>Lúc: {formatTime(alert.triggered_at)}</p>
                                </div>
                                {!alert.acknowledged_at && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => acknowledgeAlert({ alertId: alert.id })}
                                    >
                                        Xác nhận
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Alert>
                ))}
            </CardContent>
        </Card>
    );
}
