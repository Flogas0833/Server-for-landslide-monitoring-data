import QueryStatus from './QueryStatus';
import { useStatistics } from '../hooks/useSensors';
import { useAlertStats } from '../hooks/useAlerts';
import { Card, CardContent } from './ui';
import { Satellite, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, isLoading }) => (
    <Card className="p-4">
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-semibold">
                    {isLoading ? '--' : value}
                </p>
            </div>
        </div>
    </Card>
);

export default function Statistics() {
    const statsQuery = useStatistics();
    const alertsQuery = useAlertStats();
    const { data: stats = {}, isLoading: statsLoading } = statsQuery;
    const { data: alertStats = {}, isLoading: alertsLoading } = alertsQuery;

    return (
        <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
                <QueryStatus query={statsQuery} label="Statistics" />
                <QueryStatus query={alertsQuery} label="Alerts" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={Satellite}
                    label="Tổng Cảm Biến"
                    value={stats.total_devices || 0}
                    isLoading={statsLoading}
                />

                <StatCard
                    icon={CheckCircle}
                    label="Cảm Biến Hoạt Động"
                    value={stats.active_devices || 0}
                    isLoading={statsLoading}
                />

                <StatCard
                    icon={AlertTriangle}
                    label="Cảnh Báo Hoạt Động"
                    value={alertStats.stats?.active_alerts || 0}
                    isLoading={alertsLoading}
                />

                <StatCard
                    icon={AlertCircle}
                    label="Cảnh Báo Hôm Nay"
                    value={alertStats.stats?.total_alerts_today || 0}
                    isLoading={alertsLoading}
                />
            </div>
        </div>
    );
}
