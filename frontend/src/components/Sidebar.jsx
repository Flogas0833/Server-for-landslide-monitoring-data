import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRoleCheck } from '../hooks/useRoleCheck';
import { Menu, X, LogOut, BarChart3, Users, FileText, AlertCircle, Settings, LogIn } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardHeader, CardContent, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import '../styles/sidebar.css';

export const Sidebar = () => {
    const { user, logout } = useAuth();
    const { isAdmin, isOperator, isViewer } = useRoleCheck();
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    const closeMenu = () => setIsOpen(false);

    const isActive = (path) => location.pathname === path;

    // Menu items dựa trên role
    const getMenuItems = () => {
        const baseMenu = [
            {
                label: 'Map',
                path: '/',
                icon: '🗺️',
                show: true,
            },
        ];

        const adminMenu = [
            {
                label: 'Statistics',
                path: '/statistics',
                icon: <BarChart3 size={20} />,
                show: isAdmin,
            },
            {
                label: 'Users',
                path: '/admin/users',
                icon: <Users size={20} />,
                show: isAdmin,
            },
            {
                label: 'Audit Logs',
                path: '/admin/audit-logs',
                icon: <FileText size={20} />,
                show: isAdmin,
            },
            {
                label: 'Alerts',
                path: '/admin/alerts',
                icon: <AlertCircle size={20} />,
                show: isAdmin || isOperator,
            },
        ];

        const exportMenu = [
            {
                label: 'Export',
                path: '/export',
                icon: <Settings size={20} />,
                show: isAdmin || isOperator,
            },
        ];

        return [...baseMenu, ...adminMenu, ...exportMenu].filter(item => item.show);
    };

    const menuItems = getMenuItems();

    return (
        <>
            {/* Mobile Toggle Button */}
            <Button
                variant="ghost"
                size="icon"
                className="sidebar-toggle"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle menu"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>

            {/* Sidebar */}
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                {/* Sidebar Header */}
                <Card className="sidebar-header-card">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div className="sidebar-brand flex items-center gap-2">
                                <span className="brand-icon text-2xl">🏔️</span>
                                <span className="brand-text font-bold text-lg">Landslide</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="close-btn"
                                onClick={() => setIsOpen(false)}
                                aria-label="Close menu"
                            >
                                <X size={20} />
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                {/* User Info */}
                {user && (
                    <Card className="user-info-card">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="user-avatar flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground rounded-full font-bold">
                                    {user.username?.charAt(0).toUpperCase()}
                                </div>
                                <div className="user-details flex-1">
                                    <p className="user-name font-semibold text-sm">{user.username}</p>
                                    <Badge variant="outline" className="user-role mt-1">
                                        {user.role}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Navigation Menu */}
                <nav className="sidebar-nav flex-1 px-2 py-4 space-y-1">
                    {menuItems.map((item, index) => (
                        <Link
                            key={index}
                            to={item.path}
                            onClick={closeMenu}
                            className={`nav-link-wrapper ${isActive(item.path) ? 'nav-link-active' : ''}`}
                        >
                            <Button
                                variant={isActive(item.path) ? 'default' : 'ghost'}
                                className="nav-item w-full justify-start"
                            >
                                <span className="nav-icon flex-shrink-0">
                                    {typeof item.icon === 'string' ? item.icon : item.icon}
                                </span>
                                <span className="nav-label">{item.label}</span>
                            </Button>
                        </Link>
                    ))}
                </nav>

                {/* Sidebar Footer */}
                <Card className="sidebar-footer-card">
                    <CardFooter className="pt-4">
                        {user && (
                            <Button
                                variant="outline"
                                className="logout-btn w-full"
                                onClick={() => {
                                    logout();
                                    closeMenu();
                                }}
                            >
                                <LogOut size={18} />
                                <span>Logout</span>
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </aside>

            {/* Overlay */}
            {isOpen && (
                <div className="sidebar-overlay" onClick={closeMenu} />
            )}
        </>
    );
};

export default Sidebar;
