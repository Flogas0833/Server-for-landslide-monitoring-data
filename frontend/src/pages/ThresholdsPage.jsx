import { useRoleCheck } from '../hooks/useRoleCheck';
import ThresholdsManager from '../components/ThresholdsManager';
import Layout from '../components/Layout';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '../components/ui';

export default function ThresholdsPage() {
    const { isAdmin, isOperator } = useRoleCheck();

    if (!isAdmin && !isOperator) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-screen">
                    <Alert variant="destructive" className="max-w-md">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Truy cập Bị Từ Chối</AlertTitle>
                        <AlertDescription>
                            Bạn không có quyền truy cập trang này. Chỉ admin và operator mới có thể xem và chỉnh sửa ngưỡng cảnh báo.
                        </AlertDescription>
                    </Alert>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="p-6 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Quản Lý Ngưỡng Cảnh Báo</h1>
                    <p className="text-gray-600 mt-2">
                        Cấu hình các ngưỡng cảnh báo cho các cảm biến theo tình hình thực tế
                    </p>
                </div>

                <ThresholdsManager />
            </div>
        </Layout>
    );
}
