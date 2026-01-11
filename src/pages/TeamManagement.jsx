import React, { useState, useEffect, useRef } from 'react';
import { UserPlus, MoreVertical, Shield, Search, Trash2, UserX, UserCheck, Pencil } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AddUserModal from '../components/Team/AddUserModal';
import EditUserModal from '../components/Team/EditUserModal';
import BulkUploadModal from '../components/Team/BulkUploadModal';
import { roles as rolesList } from '../data/team';
import { formatAppName } from '../utils/formatters';
import '../styles/TeamManagement.css';

const TeamManagement = () => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [campusFilter, setCampusFilter] = useState('All');
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [isEditUserOpen, setIsEditUserOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [isBulkOpen, setIsBulkOpen] = useState(false);
    const [error, setError] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);
    const menuRef = useRef(null);

    const [currentUserRole, setCurrentUserRole] = useState(null);
    const [currentUserSchoolId, setCurrentUserSchoolId] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);

    useEffect(() => {
        const init = async () => {
            await fetchCurrentUser();
            await fetchSchools();
            await fetchUsers();
        };
        init();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setCurrentUserId(user.id);
            const { data } = await supabase
                .from('profiles')
                .select('role, school_id')
                .eq('id', user.id)
                .single();
            setCurrentUserRole(data?.role);
            setCurrentUserSchoolId(data?.school_id);
        }
    };

    const fetchSchools = async () => {
        try {
            const { data, error } = await supabase
                .from('schools')
                .select('*')
                .order('name');
            if (error) throw error;
            setSchools(data || []);
        } catch (error) {
            console.error('Error fetching schools:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    id,
                    full_name,
                    role,
                    school_id,
                    email,
                    status,
                    created_at,
                    schools (name)
                `)
                .order('full_name');

            if (error) throw error;

            const formattedData = data?.map(user => {
                const isUniversal = ['admin', 'rector', 'supervisor'].includes(user.role);
                return {
                    ...user,
                    school: isUniversal ? 'Global / Distrito' : (user.schools?.name || 'N/A')
                };
            }) || [];

            setUsers(formattedData);
        } catch (error) {
            console.error('Error fetching users:', error);
            setError('Failed to load team members.');
        } finally {
            setLoading(false);
        }
    };

    const handleUserAdded = () => {
        fetchUsers();
    };

    const canManipulateUser = (targetUserId) => {
        const targetUser = users.find(u => u.id === targetUserId);
        if (!targetUser || !currentUserRole) return false;

        // Admins and Rectors have full control
        if (['admin', 'rector'].includes(currentUserRole)) return true;

        if (currentUserRole === 'director') {
            return targetUser.role === 'coordinator' && targetUser.school_id === currentUserSchoolId;
        }

        return false;
    };

    const handleDeleteUser = async (userId) => {
        if (!canManipulateUser(userId)) {
            alert('No tienes permisos para eliminar a este usuario.');
            return;
        }

        if (!confirm('¿Estás seguro de que deseas eliminar permanentemente a este usuario?')) {
            return;
        }

        try {
            const { error } = await supabase.rpc('delete_user', { user_id: userId });
            if (error) throw error;
            setUsers(users.filter(u => u.id !== userId));
            setOpenMenuId(null);
            alert('Usuario eliminado exitosamente');
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Error al eliminar usuario: ' + error.message);
        }
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setIsEditUserOpen(true);
        setOpenMenuId(null);
    };

    const handleUserUpdated = () => {
        fetchUsers();
    };

    const handleToggleStatus = async (userId, currentStatus) => {
        if (!canManipulateUser(userId)) {
            alert('No tienes permisos para modificar a este usuario.');
            return;
        }

        const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ status: newStatus })
                .eq('id', userId);

            if (error) throw error;

            setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
            setOpenMenuId(null);
            alert(`Usuario ${newStatus === 'Active' ? 'activado' : 'desactivado'} exitosamente`);
        } catch (error) {
            console.error('Error toggling status:', error);
            alert('Error al cambiar estado: ' + error.message);
        }
    };

    const toggleMenu = (userId) => {
        setOpenMenuId(openMenuId === userId ? null : userId);
    };

    const getRoleColor = (role) => {
        const r = role?.toLowerCase();
        switch (r) {
            case 'rector': return 'var(--primary)';
            case 'director': return 'var(--secondary)';
            case 'supervisor': return 'var(--accent)';
            case 'coordinator': return 'var(--success)';
            case 'admin': return '#f59e0b';
            default: return 'var(--text-muted)';
        }
    };

    const roleMapping = {
        'Coordinador': 'coordinator',
        'Supervisor': 'supervisor',
        'Director de Campus': 'director',
        'Rector': 'rector',
        'Administrador': 'admin'
    };

    const filteredUsers = users.filter(user => {
        // Visibility Rules
        const isFromSameSchool = user.school_id === currentUserSchoolId;
        const isUniversalRole = ['admin', 'rector', 'supervisor'].includes(user.role);

        if (['coordinator', 'director'].includes(currentUserRole)) {
            if (!isFromSameSchool && !isUniversalRole) return false;
        }

        const name = user.full_name || '';
        const email = user.email || '';
        const school = user.school || '';
        const status = user.status || 'Active';

        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            school.toLowerCase().includes(searchTerm.toLowerCase());

        const dbRoleFilter = roleMapping[roleFilter] || roleFilter;
        const matchesRole = roleFilter === 'All' || user.role === dbRoleFilter;
        const matchesStatus = statusFilter === 'All' || status === statusFilter;
        const matchesCampus = campusFilter === 'All' || user.school === campusFilter;

        return matchesSearch && matchesRole && matchesStatus && matchesCampus;
    });

    return (
        <div className="team-container">
            <div className="page-header">
                <div>
                    <h1>Team Management</h1>
                    <p className="subtitle">Manage access and roles across the district</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {['admin', 'rector'].includes(currentUserRole) && (
                        <button
                            className="btn-secondary"
                            onClick={() => setIsBulkOpen(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '0.5rem 1rem',
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                color: '#64748b'
                            }}
                        >
                            <UserPlus size={18} />
                            Importar
                        </button>
                    )}
                    {['admin', 'rector', 'director'].includes(currentUserRole) && (
                        <button className="btn-primary" onClick={() => setIsAddUserOpen(true)}>
                            <UserPlus size={18} style={{ marginRight: '8px' }} />
                            Add User
                        </button>
                    )}
                </div>
            </div>

            <div className="content-card">
                <div className="table-controls">
                    <div className="search-box">
                        <Search size={20} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or campus..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="filters">
                        <select
                            className="btn-filter"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <option value="All">Role: All</option>
                            {rolesList.map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>

                        {currentUserRole === 'rector' && (
                            <select
                                className="btn-filter"
                                value={campusFilter}
                                onChange={(e) => setCampusFilter(e.target.value)}
                            >
                                <option value="All">Campus: Todos</option>
                                {schools.map(school => (
                                    <option key={school.id} value={school.name}>{school.name}</option>
                                ))}
                            </select>
                        )}
                        <select
                            className="btn-filter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="All">Status: All</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-muted">Loading team members...</div>
                ) : error ? (
                    <div className="p-8 text-center text-red-500">{error}</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>School/Scope</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map(user => (
                                    <tr key={user.id}>
                                        <td className="user-cell">
                                            <div className="user-avatar">{(user.full_name || '?').charAt(0)}</div>
                                            <div className="user-details">
                                                <span className="name">{formatAppName(user.full_name, user.email)}</span>
                                                <span className="email">{user.email}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="role-badge" style={{
                                                color: getRoleColor(user.role),
                                                backgroundColor: `color-mix(in srgb, ${getRoleColor(user.role)} 10%, transparent)`
                                            }}>
                                                <Shield size={12} style={{ marginRight: '4px' }} />
                                                {user.role}
                                            </span>
                                        </td>
                                        <td>{user.school}</td>
                                        <td>
                                            <span className={`status-dot ${user.status ? user.status.toLowerCase() : 'active'}`}></span>
                                            {user.status || 'Active'}
                                        </td>
                                        <td>
                                            {canManipulateUser(user.id) ? (
                                                <div className="action-menu-container" ref={openMenuId === user.id ? menuRef : null}>
                                                    <button
                                                        className="btn-icon"
                                                        onClick={() => toggleMenu(user.id)}
                                                    >
                                                        <MoreVertical size={18} />
                                                    </button>
                                                    {openMenuId === user.id && (
                                                        <div className="action-menu">
                                                            <button
                                                                className="action-menu-item"
                                                                onClick={() => handleEditUser(user)}
                                                            >
                                                                <Pencil size={16} /> Editar
                                                            </button>
                                                            <button
                                                                className="action-menu-item"
                                                                onClick={() => handleToggleStatus(user.id, user.status || 'Active')}
                                                            >
                                                                {(user.status || 'Active') === 'Active' ? (
                                                                    <><UserX size={16} /> Desactivar</>
                                                                ) : (
                                                                    <><UserCheck size={16} /> Activar</>
                                                                )}
                                                            </button>
                                                            <button
                                                                className="action-menu-item danger"
                                                                onClick={() => handleDeleteUser(user.id)}
                                                            >
                                                                <Trash2 size={16} /> Eliminar
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-muted" style={{ fontSize: '0.8rem' }}>Solo lectura</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center p-8 text-muted">No users found matching your filters.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <AddUserModal
                isOpen={isAddUserOpen}
                onClose={() => setIsAddUserOpen(false)}
                onUserAdded={handleUserAdded}
            />
            <BulkUploadModal
                isOpen={isBulkOpen}
                onClose={() => setIsBulkOpen(false)}
                onUploadComplete={handleUserAdded}
            />
            <EditUserModal
                isOpen={isEditUserOpen}
                onClose={() => setIsEditUserOpen(false)}
                user={editingUser}
                onUserUpdated={handleUserUpdated}
            />
        </div>
    );
};

export default TeamManagement;
