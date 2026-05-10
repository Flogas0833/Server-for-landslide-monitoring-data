import { useEffect, useState } from 'react';
import { Badge } from './ui';
import { RotateCw, AlertCircle, CheckCircle, Clock, HelpCircle } from 'lucide-react';

export default function QueryStatus({ query, label = "Trạng thái dữ liệu", verbose = false }) {
    const { isFetching, isLoading, error, data, dataUpdatedAt } = query;
    const [now, setNow] = useState(0);
    const [showHelp, setShowHelp] = useState(false);

    useEffect(() => {
        setNow(Date.now());
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getCacheAge = () => {
        if (!dataUpdatedAt) return null;
        const age = Math.max(0, Math.floor((now - dataUpdatedAt) / 1000));
        if (age < 60) return { short: `${age}s ago`, full: `${age} giây trước` };
        const minutes = Math.floor(age / 60);
        if (age < 3600) return { short: `${minutes}m ago`, full: `${minutes} phút trước` };
        const hours = Math.floor(age / 3600);
        return { short: `${hours}h ago`, full: `${hours} giờ trước` };
    };

    const cacheAge = getCacheAge();

    const helpText = {
        loading: "Đang tải dữ liệu lần đầu tiên. Vui lòng chờ...",
        updating: "Dữ liệu đang được cập nhật từ máy chủ. Thông tin sẽ sớm được làm mới.",
        cache: "Dữ liệu được lưu trong bộ nhớ tạm. Thời gian hiển thị là lúc dữ liệu cuối cùng được cập nhật.",
        error: "Có lỗi xảy ra khi tải dữ liệu. Vui lòng kiểm tra kết nối hoặc thử lại sau.",
        ready: "Dữ liệu sẵn sàng và không có lỗi. Bạn có thể sử dụng thông tin này."
    };

    // Verbose mode: hiển thị text mô tả rõ ràng
    if (verbose) {
        return (
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    {isLoading && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4 animate-spin" />
                            <span>Đang tải dữ liệu...</span>
                        </div>
                    )}

                    {isFetching && !isLoading && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <RotateCw className="w-4 h-4 animate-spin" />
                            <span>Đang cập nhật dữ liệu...</span>
                        </div>
                    )}

                    {data && !isLoading && !isFetching && cacheAge && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span>Dữ liệu cập nhật gần nhất <span className="font-semibold">{cacheAge.full}</span></span>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-destructive">
                            <AlertCircle className="w-4 h-4" />
                            <span>Lỗi: {error.message || 'Không xác định'}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Compact mode: hiển thị badges như trước
    return (
        <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
                {isLoading && (
                    <Badge variant="secondary" className="flex items-center gap-1" title={helpText.loading}>
                        <Clock className="w-3 h-3 animate-spin" />
                        Đang Tải...
                    </Badge>
                )}

                {isFetching && !isLoading && (
                    <Badge variant="secondary" className="flex items-center gap-1" title={helpText.updating}>
                        <RotateCw className="w-3 h-3 animate-spin" />
                        Đang Cập Nhật...
                    </Badge>
                )}

                {data && !isLoading && cacheAge && (
                    <Badge
                        variant="outline"
                        title={helpText.cache}
                        className="cursor-help"
                    >
                        💾 {cacheAge.short}
                    </Badge>
                )}

                {error && (
                    <Badge
                        variant="destructive"
                        className="flex items-center gap-1"
                        title={`Lỗi: ${error.message || 'Không xác định'}`}
                    >
                        <AlertCircle className="w-3 h-3" />
                        Lỗi
                    </Badge>
                )}

                {data && !error && !isFetching && (
                    <Badge
                        variant="default"
                        className="flex items-center gap-1"
                        title={helpText.ready}
                    >
                        <CheckCircle className="w-3 h-3" />
                        Sẵn Sàng
                    </Badge>
                )}
            </div>

            <div className="relative group">
                <button
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    onMouseEnter={() => setShowHelp(true)}
                    onMouseLeave={() => setShowHelp(false)}
                    title="Giúp đỡ: Nhấp để xem giải thích"
                >
                    <HelpCircle className="w-4 h-4" />
                </button>

                {showHelp && (
                    <div className="absolute bottom-full right-0 mb-2 bg-slate-900 text-white text-xs rounded-lg p-3 w-56 shadow-lg z-50 border border-slate-700">
                        <div className="space-y-2 text-left">
                            <p className="font-semibold">📊 Hướng dẫn trạng thái:</p>
                            <div className="space-y-1 text-slate-200">
                                <p><span className="font-medium">⏳ Đang Tải...</span> Lần đầu tiên lấy dữ liệu từ máy chủ</p>
                                <p><span className="font-medium">🔄 Đang Cập Nhật...</span> Dữ liệu đang được làm mới</p>
                                <p><span className="font-medium">💾 X giây/phút trước</span> Dữ liệu từ bộ nhớ tạm, cách đây bao lâu được cập nhật</p>
                                <p><span className="font-medium">✓ Sẵn Sàng</span> Dữ liệu mới nhất, không có lỗi</p>
                                <p><span className="font-medium">⚠️ Lỗi</span> Không thể tải dữ liệu</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
