import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader } from '../components/ui';
import { Mountain } from 'lucide-react';

export default function LoginPage() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && user) {
            navigate('/');
        }
    }, [user, loading, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
            <div className="max-w-md w-full space-y-8 text-center">
                {/* Logo and Title */}
                <div className="space-y-4">
                    <div className="inline-flex p-4 bg-primary/10 rounded-full">
                        <Mountain className="w-12 h-12 text-primary" />
                    </div>
                    <h1 className="text-4xl font-bold text-foreground">
                        Hệ Thống Giám Sát Lở Đất
                    </h1>
                </div>

                {/* Loading State */}
                <div className="space-y-4">
                    <div className="flex justify-center">
                        <Loader />
                    </div>
                    <p className="text-lg text-muted-foreground font-medium">
                        Đang tải hệ thống...
                    </p>
                </div>

                {/* Status Info */}
                <div className="space-y-2">
                    <p className="text-muted-foreground">
                        Hệ thống giám sát sạt lở đất tự động
                    </p>
                    <p className="text-sm text-muted-foreground opacity-70">
                        {loading ? 'Đang kết nối...' : 'Sẵn sàng'}
                    </p>
                </div>

                {/* Footer */}
                <div className="text-xs text-muted-foreground pt-8">
                    <p>Phiên bản 1.0.0</p>
                </div>
            </div>
        </div>
    );
}
