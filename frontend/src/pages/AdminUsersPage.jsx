import { useState, useEffect } from 'react';
import { useRoleCheck } from '../hooks/useRoleCheck';
import { usePermissions } from '../hooks/useRoleCheck';
import axios from 'axios';
import { Users, Plus, Trash2, Shield } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { translateRole } from '../utils/helpers';
import '../styles/adminPages.css';

export const AdminUsersPage = () => {
    const { isAdmin } = useRoleCheck();
    const permissions = usePermissions();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'user',
    });

    useEffect(() => {
        // TODO: Fetch users from API
        // Tạm thời sử dụng mock data
        setUsers([
            { id: 1, username: 'admin', email: 'admin@landslide.local', role: 'admin', lastLogin: '2026-05-05' },
            { id: 2, username: 'operator', email: 'operator@landslide.local', role: 'operator', lastLogin: '2026-05-05' },
            { id: 3, username: 'user', email: 'user@landslide.local', role: 'user', lastLogin: '2026-05-04' },
        ]);
        setLoading(false);
    }, []);

    const handleCreateUser = async () => {
        if (!formData.username || !formData.email || !formData.password) {
            alert('Vui lòng điền đầy đủ thông tin');
            return;
        }

        try {
            // TODO: Call API to create user
            console.log('Creating user:', formData);
            setShowForm(false);
            setFormData({ username: '', email: '', password: '', role: 'user' });
        } catch (error) {
            console.error('Error creating user:', error);
            alert('Lỗi tạo người dùng');
        }
    };

    if (!permissions.canManageUsers) {
        return (
            <div className="admin-page">
                <Card className="error-card">
                    <Shield size={48} />
                    <h2>Truy cập bị từ chối</h2>
                    <p>Bạn không có quyền quản lý người dùng. Chỉ admin mới có thể truy cập trang này.</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h1>
                    <Users size={28} />
                    Quản Lý Người Dùng
                </h1>
                <Button onClick={() => setShowForm(!showForm)}>
                    <Plus size={18} />
                    Tạo Người Dùng Mới
                </Button>
            </div>

            {/* Create User Form */}
            {showForm && (
                <Card className="form-card">
                    <h3>Tạo Người Dùng Mới</h3>
                    <div className="form-group">
                        <label>Username</label>
                        <Input
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            placeholder="Nhập username"
                        />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="Nhập email"
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <Input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Nhập password"
                        />
                    </div>
                    <div className="form-group">
                        <label>Vai Trò</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="form-select"
                        >
                            <option value="user">Người Dùng</option>
                            <option value="operator">Nhân Viên Vận Hành</option>
                            <option value="admin">Quản Trị Viên</option>
                        </select>
                    </div>
                    <div className="form-actions">
                        <Button onClick={handleCreateUser}>Tạo</Button>
                        <Button onClick={() => setShowForm(false)} variant="outline">Hủy</Button>
                    </div>
                </Card>
            )}

            {/* Users Table */}
            <Card className="users-table-card">
                {loading ? (
                    <p>Đang tải...</p>
                ) : (
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Tên Đăng Nhập</th>
                                <th>Email</th>
                                <th>Vai Trò</th>
                                <th>Lần Đăng Nhập Cuối</th>
                                <th>Hành Động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.username}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={`role-badge role-${user.role}`}>
                                            {translateRole(user.role)}
                                        </span>
                                    </td>
                                    <td>{user.lastLogin}</td>
                                    <td>
                                        <button className="delete-btn" title="Xóa">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Card>
        </div>
    );
};

export default AdminUsersPage;
