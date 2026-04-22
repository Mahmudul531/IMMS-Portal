import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Filter, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const ROLE_COLORS: Record<string, string> = {
    ADMIN: '#7c3aed',
    ENGINEER: '#0284c7',
    TECHNICIAN: '#0891b2',
    VENDOR: '#d97706',
};

const UserList = () => {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const fetchUsers = async () => {
        try {
            const { data } = await axios.get(`${API}/api/users`);
            setUsers(Array.isArray(data) ? [...data].reverse() : []);
        } catch { toast.error('Failed to load users'); }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleToggleStatus = async (id: number, status: boolean, userRow?: any) => {
        // Frontend guard: stop admin trying to activate a VENDOR without permission group
        if (status && userRow?.role === 'VENDOR' && !userRow?.permissionGroupId) {
            toast.error('Cannot activate: no Permission Group assigned. Edit their profile first.', { duration: 5000 });
            navigate(`/users/add?id=${id}`);
            return;
        }
        let note = '';
        if (!status) {
            const result = prompt('Reason for deactivating this user (required):');
            if (result === null || result.trim() === '') return;
            note = result.trim();
        }
        try {
            await axios.put(`${API}/api/users/${id}/status?active=${status}&note=${encodeURIComponent(note)}`);
            toast.success(status ? 'User activated' : 'User deactivated');
            fetchUsers();
        } catch (err: any) {
            const msg = err.response?.data;
            toast.error(typeof msg === 'string' && msg.trim() ? msg : 'Failed to update status', { duration: 6000 });
        }
    };

    const filtered = users.filter(u => {
        if (currentUser && u.id === currentUser.id) return false;
        if (statusFilter === 'ACTIVE' && u.active === false) return false;
        if (statusFilter === 'INACTIVE' && u.active !== false) return false;
        if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
        if (searchTerm) {
            const t = searchTerm.toLowerCase();
            if (!u.username?.toLowerCase().includes(t) && !u.email?.toLowerCase().includes(t) && !u.fullName?.toLowerCase().includes(t)) return false;
        }
        return true;
    });

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="page-container fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>User Management</h2>
                <button className="btn btn-primary" onClick={() => navigate('/users/add')} style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    + Add User
                </button>
            </div>

            <div className="card">
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', alignItems: 'center' }}>
                    <Filter size={18} style={{ color: 'var(--text-muted)' }} />
                    <input className="form-input" style={{ background: 'white', padding: '0.4rem 0.8rem', minWidth: '220px' }} placeholder="Search name, email..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
                    <select className="form-input" style={{ background: 'white', padding: '0.4rem 0.8rem', width: 'auto' }} value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setCurrentPage(1); }}>
                        <option value="ALL">All Roles</option>
                        <option value="ADMIN">Admin</option>
                        <option value="ENGINEER">Engineer</option>
                        <option value="TECHNICIAN">Technician</option>
                        <option value="VENDOR">Vendor</option>
                    </select>
                    <select className="form-input" style={{ background: 'white', padding: '0.4rem 0.8rem', width: 'auto' }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
                        <option value="ALL">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                    </select>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name / Username</th>
                                <th>Contact</th>
                                <th>Role</th>
                                <th>Department</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map(u => (
                                <tr key={u.id} style={{ opacity: u.active === false ? 0.65 : 1 }}>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{u.id}</td>
                                    <td>
                                        <div>
                                            <span
                                                onClick={() => navigate(`/personnel/${u.id}`)}
                                                style={{ fontWeight: 700, color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                            >
                                                {u.fullName || u.username} <ExternalLink size={13} style={{ opacity: 0.5 }} />
                                            </span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{u.username}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.85rem' }}>
                                            <div>{u.email || '—'}</div>
                                            <div style={{ color: 'var(--text-muted)' }}>{u.phone || ''}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: `${ROLE_COLORS[u.role] || '#666'}20`, color: ROLE_COLORS[u.role] || '#666' }}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.85rem' }}>
                                        {u.department && <div>{u.department}</div>}
                                        {u.designation && <div style={{ color: 'var(--text-muted)' }}>{u.designation}</div>}
                                    </td>
                                    <td>
                                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: u.active === false ? '#ffebee' : 'rgba(16,185,129,0.1)', color: u.active === false ? '#c62828' : '#10b981' }}>
                                            {u.active === false ? 'Inactive' : 'Active'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button className="action-btn" title="Edit" onClick={() => navigate(`/users/add?id=${u.id}`)} style={{ fontSize: '0.75rem' }}>Edit</button>
                                            {u.active !== false ? (
                                                <button className="btn" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', background: '#f57c00', color: 'white', width: 'auto', height: 'auto', minHeight: 0 }} onClick={() => handleToggleStatus(u.id, false, u)}>Deactivate</button>
                                            ) : (
                                                <button className="btn" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', background: '#2e7d32', color: 'white', width: 'auto', height: 'auto', minHeight: 0 }} onClick={() => handleToggleStatus(u.id, true, u)}>Activate</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {paginated.length === 0 && (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No users found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', alignItems: 'center' }}>
                        <button className="btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ width: 'auto', padding: '0.4rem 1rem' }}>Previous</button>
                        <span style={{ fontWeight: 600 }}>Page {currentPage} of {totalPages}</span>
                        <button className="btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ width: 'auto', padding: '0.4rem 1rem' }}>Next</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserList;
