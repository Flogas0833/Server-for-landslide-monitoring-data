import { useEffect, useState } from 'react';
import { Badge } from './ui';
import { RotateCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function QueryStatus({ query }) {
    const { isFetching, isLoading, error, data, dataUpdatedAt } = query;
    const [now, setNow] = useState(0);

    useEffect(() => {
        setNow(Date.now());
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getCacheAge = () => {
        if (!dataUpdatedAt) return null;
        const age = Math.floor((now - dataUpdatedAt) / 1000);
        if (age < 60) return `${age}s ago`;
        if (age < 3600) return `${Math.floor(age / 60)}m ago`;
        return `${Math.floor(age / 3600)}h ago`;
    };

    const cacheAge = getCacheAge();

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {isLoading && (
                <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="w-3 h-3 animate-spin" />
                    Loading...
                </Badge>
            )}

            {isFetching && !isLoading && (
                <Badge variant="secondary" className="flex items-center gap-1">
                    <RotateCw className="w-3 h-3 animate-spin" />
                    Updating...
                </Badge>
            )}

            {data && !isLoading && cacheAge && (
                <Badge variant="outline" title="Data from cache">
                    💾 {cacheAge}
                </Badge>
            )}

            {error && (
                <Badge variant="destructive" className="flex items-center gap-1" title={error.message}>
                    <AlertCircle className="w-3 h-3" />
                    Error
                </Badge>
            )}

            {data && !error && !isFetching && (
                <Badge variant="default" className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Ready
                </Badge>
            )}
        </div>
    );
}
