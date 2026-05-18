import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader, Button, Input, Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui';
import { Mountain, Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
    const { user, loading, login, error } = useAuth();
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [loginError, setLoginError] = useState('');

    useEffect(() => {
        if (!loading && user) {
            navigate('/');
        }
    }, [user, loading, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setLoginError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.username || !formData.password) {
            setLoginError('Vui lòng nhập username và password');
            return;
        }

        setIsLoading(true);
        const result = await login(formData.username, formData.password);
        setIsLoading(false);

        if (!result.success) {
            setLoginError(result.error || 'Đăng nhập thất bại');
        }
    };

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                {/* Header */}
                <header className="border-b bg-card sticky top-0 z-40">
                    <div className="max-w-7xl mx-auto px-4 py-1">
                        <div className="flex items-center gap-3">
                            <Mountain className="w-8 h-8 text-primary" />
                            <h1 className="text-xl font-bold">Hệ Thống Giám Sát Lở Đất</h1>
                        </div>
                    </div>
                </header>

                {/* Loading Content */}
                <main className="max-w-7xl mx-auto p-4 flex items-center justify-center min-h-[calc(100vh-80px)]">
                    <div className="text-center space-y-4">
                        <Loader className="w-12 h-12 text-primary mx-auto" />
                        <p className="text-lg text-muted-foreground font-medium">
                            Đang tải hệ thống...
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-1">
                    <div className="flex items-center gap-3">
                        <Mountain className="w-8 h-8 text-primary" />
                        <h1 className="text-xl font-bold">Hệ Thống Giám Sát Lở Đất</h1>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto p-4 flex items-center justify-center min-h-[calc(100vh-80px)]">
                <div className="w-full max-w-md">
                    {/* Login Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2 mb-2">
                                <LogIn className="w-6 h-6 text-primary" />
                                <CardTitle className="text-2xl">Đăng Nhập</CardTitle>
                            </div>
                            <CardDescription>
                                Vui lòng nhập thông tin đăng nhập để truy cập hệ thống
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Error Message */}
                                {(loginError || error) && (
                                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                                        <p className="text-sm text-red-700 dark:text-red-400">
                                            {loginError || error}
                                        </p>
                                    </div>
                                )}

                                {/* Username Field */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-foreground">
                                        Tên Đăng Nhập
                                    </label>
                                    <Input
                                        type="text"
                                        name="username"
                                        placeholder="Nhập tên đăng nhập"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        disabled={isLoading}
                                        className="w-full"
                                    />
                                </div>

                                {/* Password Field */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-foreground">
                                        Mật Khẩu
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            placeholder="Nhập mật khẩu"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            disabled={isLoading}
                                            className="w-full pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="w-4 h-4" />
                                            ) : (
                                                <Eye className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    disabled={isLoading || !formData.username || !formData.password}
                                    className="w-full"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader className="w-4 h-4" />
                                            <span>Đang đăng nhập...</span>
                                        </div>
                                    ) : (
                                        'Đăng Nhập'
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Footer */}
                    <div className="text-center mt-6 space-y-1 text-xs text-muted-foreground">
                        <p>Hệ thống giám sát sạt lở đất tự động</p>
                        <p>Phiên bản 1.0.0</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
