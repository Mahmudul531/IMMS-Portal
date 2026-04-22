import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { UserPlus } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const PERMISSIONS_LIST = [
    { key: 'CREATE_ASSET', label: 'Create Assets' },
    { key: 'EDIT_ASSET', label: 'Edit Assets' },
    { key: 'DELETE_ASSET', label: 'Delete Assets' },
    { key: 'VIEW_REPORTS', label: 'View Reports' },
    { key: 'MANAGE_USERS', label: 'Manage Users' },
    { key: 'APPROVE_PAYMENT', label: 'Approve Payments' },
    { key: 'MANAGE_PROPERTIES', label: 'Manage Properties' },
    { key: 'VIEW_WORK_ORDERS', label: 'View Work Orders' },
    { key: 'CREATE_WORK_ORDER', label: 'Create Work Orders' },
    { key: 'ASSIGN_ENGINEER', label: 'Assign Engineers' },
];

// Non-vendor roles only (vendors are always created via registration)
const NON_VENDOR_ROLES = ['ADMIN', 'ENGINEER', 'TECHNICIAN'];

const UserAdd = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const editId = new URLSearchParams(location.search).get('id');

    const [properties, setProperties] = useState<any[]>([]);
    const [permissionGroups, setPermissionGroups] = useState<any[]>([]);

    // Personal Info
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [dob, setDob] = useState('');
    const [gender, setGender] = useState('');
    const [nidOrPassport, setNidOrPassport] = useState('');
    const [password, setPassword] = useState('');

    // Organization
    const [department, setDepartment] = useState('');
    const [designation, setDesignation] = useState('');
    const [propertyId, setPropertyId] = useState('');

    // Role & Permissions
    const [role, setRole] = useState('ENGINEER');
    const [permissionGroupId, setPermissionGroupId] = useState('');

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const [propsRes, pgRes] = await Promise.all([
                    axios.get(`${API}/api/properties`),
                    axios.get(`${API}/api/permission-groups`),
                ]);
                setProperties(Array.isArray(propsRes.data) ? propsRes.data : []);
                setPermissionGroups(Array.isArray(pgRes.data) ? pgRes.data : []);

                if (editId) {
                    const { data: u } = await axios.get(`${API}/api/users/${editId}`);
                    setFullName(u.fullName || '');
                    setUsername(u.username || '');
                    setEmail(u.email || '');
                    setPhone(u.phone || '');
                    setDob(u.dob || '');
                    setGender(u.gender || '');
                    setNidOrPassport(u.nidOrPassport || '');
                    setDepartment(u.department || '');
                    setDesignation(u.designation || '');
                    setPropertyId(u.propertyId?.toString() || '');
                    setRole(u.role || 'ENGINEER');
                    setPermissionGroupId(u.permissionGroupId?.toString() || '');
                }
            } catch { toast.error('Failed to load form data'); }
        };
        load();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editId && !password) { toast.error('Password is required for new users'); return; }

        // Vendor must have permission group before saving (non-vendors don't need it)
        const isVendor = role === 'VENDOR';
        if (!editId && isVendor && !permissionGroupId) {
            toast.error('A Vendor must be assigned a Permission Group');
            return;
        }

        setSaving(true);
        try {
            const payload: any = {
                fullName, username, email, phone, dob: dob || null,
                gender, nidOrPassport,
                // Don't send role on edit — protected by backend too
                role: editId ? undefined : role,
                department, designation,
                propertyId: propertyId ? parseInt(propertyId) : null,
                permissionGroupId: permissionGroupId ? parseInt(permissionGroupId) : null,
            };
            if (!editId) { payload.password = password; }

            if (editId) {
                await axios.put(`${API}/api/users/${editId}`, payload);
                toast.success('User updated');
            } else {
                await axios.post(`${API}/api/users/register`, payload);
                toast.success('User created');
            }
            navigate('/users/list');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save user');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="page-container fade-in" style={{ paddingBottom: '3rem' }}>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <UserPlus size={24} style={{ color: 'var(--primary)' }} />
                    {editId ? 'Edit User Profile' : 'Add New User'}
                </h2>
                <button className="btn" onClick={() => navigate('/users/list')} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    Cancel
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Personal Information */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--primary)', borderBottom: '2px solid var(--bg-main)', paddingBottom: '0.5rem' }}>Personal Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label className="form-label">Full Name <span style={{ color: 'red' }}>*</span></label>
                            <input className="form-input" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="e.g. Mohammad Rahman" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Username <span style={{ color: 'red' }}>*</span></label>
                            <input className="form-input" value={username} onChange={e => setUsername(e.target.value)} required placeholder="login username" disabled={!!editId} style={editId ? { opacity: 0.6 } : {}} />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email <span style={{ color: 'red' }}>*</span></label>
                            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone</label>
                            <input className="form-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+880..." />
                        </div>
                        {!editId && (
                            <div className="form-group">
                                <label className="form-label">Password <span style={{ color: 'red' }}>*</span></label>
                                <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required={!editId} />
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Date of Birth</label>
                            <input className="form-input" type="date" value={dob} onChange={e => setDob(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Gender</label>
                            <select className="form-input" value={gender} onChange={e => setGender(e.target.value)}>
                                <option value="">Select...</option>
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">NID / Passport No.</label>
                            <input className="form-input" value={nidOrPassport} onChange={e => setNidOrPassport(e.target.value)} />
                        </div>
                    </div>
                </div>

                {/* Organization */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--primary)', borderBottom: '2px solid var(--bg-main)', paddingBottom: '0.5rem' }}>Organization</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label className="form-label">Department</label>
                            <input className="form-input" value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Electrical, IT, Finance" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Designation</label>
                            <input className="form-input" value={designation} onChange={e => setDesignation(e.target.value)} placeholder="e.g. Senior Engineer" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Property / Location</label>
                            <select className="form-input" value={propertyId} onChange={e => setPropertyId(e.target.value)}>
                                <option value="">Not assigned</option>
                                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Role */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--primary)', borderBottom: '2px solid var(--bg-main)', paddingBottom: '0.5rem' }}>System Role</h3>

                    {editId ? (
                        // EDIT MODE: role is displayed but cannot be changed
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{
                                    padding: '6px 20px', borderRadius: '20px', fontWeight: 700, fontSize: '0.9rem',
                                    background: role === 'VENDOR' ? '#fff3e0' : 'rgba(16,185,129,0.1)',
                                    color: role === 'VENDOR' ? '#e65100' : 'var(--primary)',
                                    border: `2px solid ${role === 'VENDOR' ? '#ff9800' : 'var(--primary)'}`,
                                }}>
                                    {role}
                                </span>
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                    🔒 Role cannot be changed after creation
                                </span>
                            </div>
                            {role !== 'VENDOR' && (
                                <div style={{ marginTop: '1rem' }}>
                                    <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Change role (non-vendor only):</p>
                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        {NON_VENDOR_ROLES.map(r => (
                                            <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1.2rem', border: `2px solid ${role === r ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '8px', cursor: 'pointer', background: role === r ? 'rgba(16,185,129,0.08)' : 'white', transition: 'all 0.15s' }}>
                                                <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} style={{ transform: 'scale(1.2)' }} />
                                                <span style={{ fontWeight: role === r ? 700 : 400, color: role === r ? 'var(--primary)' : 'inherit' }}>{r}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        // CREATE MODE: choose role (non-vendor roles only — vendors register themselves)
                        <div>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                {NON_VENDOR_ROLES.map(r => (
                                    <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1.5rem', border: `2px solid ${role === r ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '8px', cursor: 'pointer', background: role === r ? 'rgba(16,185,129,0.08)' : 'white', transition: 'all 0.15s' }}>
                                        <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} style={{ transform: 'scale(1.2)' }} />
                                        <span style={{ fontWeight: role === r ? 700 : 400, color: role === r ? 'var(--primary)' : 'inherit' }}>{r}</span>
                                    </label>
                                ))}
                            </div>
                            <p style={{ margin: '0.75rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                ℹ️ Vendors must self-register via the login page and are activated by Admin.
                            </p>
                        </div>
                    )}
                </div>

                {/* Permissions */}
                <div className="card" style={{ marginBottom: '2rem', borderLeft: role === 'VENDOR' ? '4px solid var(--warning)' : undefined }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--primary)', borderBottom: '2px solid var(--bg-main)', paddingBottom: '0.5rem' }}>
                        Permission Group {role === 'VENDOR' && <span style={{ color: 'red' }}>*</span>}
                    </h3>
                    {role === 'VENDOR' && !permissionGroupId && (
                        <div style={{ background: '#fff3e0', border: '1px solid #ff9800', borderRadius: 8, padding: '0.6rem 0.9rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#7a3900' }}>
                            ⚠️ A Permission Group is required to activate vendor accounts.
                        </div>
                    )}
                    <div className="form-group" style={{ marginBottom: 0, maxWidth: '400px' }}>
                        <label className="form-label">Assign a Permission Group</label>
                        <select className="form-input" value={permissionGroupId} onChange={e => setPermissionGroupId(e.target.value)}>
                            <option value="">No specific group</option>
                            {permissionGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                        {permissionGroupId && (() => {
                            const group = permissionGroups.find(g => g.id === parseInt(permissionGroupId));
                            if (!group?.permissions) return null;
                            const perms = group.permissions.split(',').filter(Boolean);
                            return (
                                <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {perms.map((p: string) => (
                                        <span key={p} style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600 }}>
                                            {p.replace(/_/g, ' ')}
                                        </span>
                                    ))}
                                </div>
                            );
                        })()}
                        <small style={{ color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
                            Manage groups in <strong>User Access → Permission Groups</strong>
                        </small>
                    </div>
                </div>

                <div style={{ position: 'sticky', bottom: '1rem', background: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', border: '1px solid var(--border)', zIndex: 100 }}>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: '1.05rem', padding: '0.8rem' }} disabled={saving}>
                        {saving ? 'Saving...' : (editId ? 'Update User Profile' : 'Create User Account')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UserAdd;
