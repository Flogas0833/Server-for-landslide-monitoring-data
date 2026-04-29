import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui';
import { LogOut, User } from 'lucide-react';

export default function UserMenu() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">{user.username}</span>
            </div>
            <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
            >
                <LogOut className="w-4 h-4" />
                Đăng xuất
            </Button>
        </div>
    );
}
