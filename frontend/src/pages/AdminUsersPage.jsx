import { useState, useEffect } from 'react';
import { useRoleCheck } from '../hooks/useRoleCheck';
import { usePermissions } from '../hooks/useRoleCheck';
import axios from 'axios';
import { Users, Plus, Trash2, Shield, Edit2, Save, X } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { translateRole } from '../utils/helpers';
import { userAPI } from '../utils/api';
import { VIETNAM_PROVINCES } from '../constants/provinces';
import '../styles/adminPages.css';

export const AdminUsersPage = () => {
    const { isAdmin } = useRoleCheck();
    const permissions = usePermissions();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingProvinceId, setEditingProvinceId] = useState(null);
    const [editingProvinceValue, setEditingProvinceValue] = useState('');
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'user',
        province: '',
    });

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const users = await userAPI.getAllUsers();
                setUsers(users);
            } catch (error) {
                console.error('Error fetching users:', error);
                alert('Lỗi tải danh sách người dùng');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleCreateUser = async () => {
        if (!formData.username || !formData.email || !formData.password) {
            alert('Vui lòng điền đầy đủ thông tin');
            return;
        }

        if (formData.role === 'operator' && !formData.province) {
            alert('Vui lòng chọn tỉnh thành cho nhân viên vận hành');
            return;
        }

        try {
            const newUser = await userAPI.createUser(formData);
            // Add the new user to the list
            setUsers([...users, {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
                province: newUser.province || '(Không có)',
                lastLogin: newUser.lastLogin,
            }]);
            setShowForm(false);
            setFormData({ username: '', email: '', password: '', role: 'user', province: '' });
        } catch (error) {
            console.error('Error creating user:', error);
            alert('Lỗi tạo người dùng');
        }
    };

    const handleSaveProvince = async (userId) => {
        try {
            await userAPI.updateUserProvinceById(userId, editingProvinceValue);
            // Update user in list
            setUsers(users.map(u => u.id === userId ? { ...u, province: editingProvinceValue } : u));
            setEditingProvinceId(null);
        } catch (error) {
            console.error('Error updating province:', error);
            alert('Lỗi cập nhật tỉnh thành');
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
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card py-1 mb-2">
                <div className="px-4 py-1">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0">
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                <Users className="w-8 h-8 text-primary" />
                                Quản Lý Người Dùng
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Quản lý người dùng và phân quyền truy cập hệ thống
                            </p>
                        </div>
                        <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
                            <Plus size={18} />
                            Tạo Người Dùng Mới
                        </Button>
                    </div>
                </div>
            </header>

            <div className="px-4">

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
                        {formData.role === 'operator' && (
                            <div className="form-group">
                                <label>Tỉnh Thành (Bắt buộc cho Nhân Viên Vận Hành)</label>
                                <select
                                    value={formData.province}
                                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                                    className="form-select"
                                >
                                    <option value="">-- Chọn Tỉnh Thành --</option>
                                    {VIETNAM_PROVINCES.map(province => (
                                        <option key={province} value={province}>{province}</option>
                                    ))}
                                </select>
                            </div>
                        )}
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
                                    <th>Tỉnh Thành</th>
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
                                        <td>
                                            {editingProvinceId === user.id ? (
                                                <div className="province-edit">
                                                    <select
                                                        value={editingProvinceValue}
                                                        onChange={(e) => setEditingProvinceValue(e.target.value)}
                                                        className="form-select-inline"
                                                    >
                                                        <option value="">-- Không có --</option>
                                                        {VIETNAM_PROVINCES.map(province => (
                                                            <option key={province} value={province}>{province}</option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        className="save-btn"
                                                        onClick={() => handleSaveProvince(user.id)}
                                                        title="Lưu"
                                                    >
                                                        <Save size={14} />
                                                    </button>
                                                    <button
                                                        className="cancel-btn"
                                                        onClick={() => setEditingProvinceId(null)}
                                                        title="Hủy"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="province-view">
                                                    <span>{user.province}</span>
                                                    {user.role === 'operator' && (
                                                        <button
                                                            className="edit-btn"
                                                            onClick={() => {
                                                                setEditingProvinceId(user.id);
                                                                // Convert '(Không có)' back to empty string for editing
                                                                setEditingProvinceValue(user.province === '(Không có)' ? '' : user.province || '');
                                                            }}
                                                            title="Chỉnh sửa"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
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
        </div>
    );
};

export default AdminUsersPage;
