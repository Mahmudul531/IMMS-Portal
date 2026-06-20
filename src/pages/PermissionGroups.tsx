import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit2, Shield, X, Check, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const ROLES = ['ENGINEER', 'TECHNICIAN', 'VENDOR'];

const PERMISSION_CATEGORIES = [
    {
        category: 'Infrastructure',
        color: '#0ea5e9',
        permissions: [
            { key: 'VIEW_INFRASTRUCTURE',   label: 'View Infrastructure' },
            { key: 'CREATE_INFRASTRUCTURE', label: 'Create Infrastructure' },
            { key: 'EDIT_INFRASTRUCTURE',   label: 'Edit Infrastructure' },
            { key: 'DELETE_INFRASTRUCTURE', label: 'Delete Infrastructure' },
        ],
    },
    {
        category: 'Assets',
        color: '#8b5cf6',
        permissions: [
            { key: 'VIEW_ASSETS',   label: 'View Assets' },
            { key: 'CREATE_ASSET',  label: 'Create Assets' },
            { key: 'EDIT_ASSET',    label: 'Edit Assets' },
            { key: 'DELETE_ASSET',  label: 'Delete Assets' },
            { key: 'TRANSFER_ASSET', label: 'Transfer Assets' },
        ],
    },
    {
        category: 'Work Orders',
        color: '#f59e0b',
        permissions: [
            { key: 'VIEW_WORK_ORDERS',   label: 'View Work Orders' },
            { key: 'CREATE_WORK_ORDER',  label: 'Create Work Orders' },
            { key: 'EDIT_WORK_ORDER',    label: 'Edit Work Orders' },
            { key: 'ASSIGN_ENGINEER',    label: 'Assign Engineers to Work Orders' },
        ],
    },
    {
        category: 'Tasks',
        color: '#10b981',
        permissions: [
            { key: 'VIEW_TASKS',   label: 'View Tasks' },
            { key: 'CREATE_TASK',  label: 'Create Tasks' },
            { key: 'EDIT_TASK',    label: 'Edit Tasks' },
        ],
    },
    {
        category: 'Documents',
        color: '#6366f1',
        permissions: [
            { key: 'VIEW_DOCUMENTS',   label: 'View Documents' },
            { key: 'UPLOAD_DOCUMENT',  label: 'Upload Documents' },
            { key: 'DELETE_DOCUMENT',  label: 'Delete Documents' },
        ],
    },
    {
        category: 'Reports',
        color: '#ec4899',
        permissions: [
            { key: 'VIEW_REPORTS',         label: 'View Transfer Reports' },
            { key: 'VIEW_PAYMENT_REPORTS', label: 'View Payment Reports' },
        ],
    },
    {
        category: 'Finance',
        color: '#f97316',
        permissions: [
            { key: 'VIEW_FINANCE',    label: 'View Finance Module' },
            { key: 'APPROVE_PAYMENT', label: 'Approve Payments' },
        ],
    },
    {
        category: 'Tenders & Contracts',
        color: '#14b8a6',
        permissions: [
            { key: 'VIEW_TENDERS',    label: 'View Tenders' },
            { key: 'CREATE_TENDER',   label: 'Create Tenders' },
            { key: 'MANAGE_TENDERS',  label: 'Manage Tenders (Edit/Delete)' },
        ],
    },
    {
        category: 'User Management',
        color: '#ef4444',
        permissions: [
            { key: 'VIEW_USERS',               label: 'View User List' },
            { key: 'MANAGE_USERS',             label: 'Manage Users (Edit/Activate)' },
            { key: 'MANAGE_PERMISSION_GROUPS', label: 'Manage Permission Groups' },
        ],
    },
    {
        category: 'Vendor Actions',
        color: '#84cc16',
        permissions: [
            { key: 'VIEW_CONTRACTS',         label: 'View My Contracts' },
            { key: 'VIEW_VENDOR_PROJECTS',   label: 'View Assigned Projects' },
            { key: 'SUBMIT_PAYMENT_REQUEST', label: 'Submit Payment Requests' },
        ],
    },
];

// Flat list for "select all"
const ALL_KEYS = PERMISSION_CATEGORIES.flatMap(c => c.permissions.map(p => p.key));

const PermissionGroups = () => {
    const [groups, setGroups] = useState<any[]>([]);
    const [name, setName] = useState('');
    const [targetRole, setTargetRole] = useState('ENGINEER');
    const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [filterRole, setFilterRole] = useState('');

    const fetchGroups = async () => {
        try {
            const { data } = await axios.get(`${API}/api/permission-groups`);
            setGroups(Array.isArray(data) ? data : []);
        } catch { toast.error('Failed to load permission groups'); }
    };

    useEffect(() => { fetchGroups(); }, []);

    const togglePerm = (key: string) => {
        setSelectedPerms(prev => prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]);
    };

    const toggleCategory = (keys: string[]) => {
        const allSelected = keys.every(k => selectedPerms.includes(k));
        if (allSelected) {
            setSelectedPerms(prev => prev.filter(p => !keys.includes(p)));
        } else {
            setSelectedPerms(prev => [...new Set([...prev, ...keys])]);
        }
    };

    const selectAll = () => setSelectedPerms([...ALL_KEYS]);
    const clearAll = () => setSelectedPerms([]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { toast.error('Group name required'); return; }
        if (!targetRole) { toast.error('Select a target role'); return; }
        try {
            const payload = { name: name.trim(), permissions: selectedPerms.join(','), targetRole };
            if (editingId) {
                await axios.put(`${API}/api/permission-groups/${editingId}`, payload);
                toast.success('Group updated — changes take effect on next login or refresh');
            } else {
                await axios.post(`${API}/api/permission-groups`, payload);
                toast.success('Group created successfully');
            }
            resetForm();
            fetchGroups();
        } catch { toast.error('Failed to save group'); }
    };

    const startEdit = (g: any) => {
        setEditingId(g.id);
        setName(g.name);
        setTargetRole(g.targetRole || 'ENGINEER');
        setSelectedPerms(g.permissions ? g.permissions.split(',').filter(Boolean) : []);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setEditingId(null);
        setName('');
        setTargetRole('ENGINEER');
        setSelectedPerms([]);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this permission group? Users assigned to this group will lose permissions on next refresh.')) return;
        try {
            await axios.delete(`${API}/api/permission-groups/${id}`);
            toast.success('Deleted');
            fetchGroups();
        } catch { toast.error('Delete failed'); }
    };

    const roleColor = (role: string) => {
        switch (role) {
            case 'ENGINEER': return '#0ea5e9';
            case 'TECHNICIAN': return '#8b5cf6';
            case 'VENDOR': return '#f59e0b';
            default: return 'var(--primary)';
        }
    };

    const displayGroups = filterRole ? groups.filter(g => g.targetRole === filterRole) : groups;

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Shield size={24} style={{ color: 'var(--primary)' }} /> Permission Groups
                </h2>
                <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Define what each role can access. Changes take effect when users refresh their browser.
                </p>
            </div>

            {/* Create / Edit Form */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--primary)', borderBottom: '2px solid var(--bg-main)', paddingBottom: '0.5rem' }}>
                    {editingId ? '✏️ Edit Permission Group' : '➕ Create New Permission Group'}
                </h3>
                <form onSubmit={handleSave}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', maxWidth: '600px' }}>
                        <div className="form-group">
                            <label className="form-label">Group Name <span style={{ color: 'red' }}>*</span></label>
                            <input className="form-input" value={name} onChange={e => setName(e.target.value)}
                                placeholder="e.g. Site Engineers, Field Technicians" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Target Role <span style={{ color: 'red' }}>*</span></label>
                            <select className="form-input" value={targetRole} onChange={e => setTargetRole(e.target.value)} required>
                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <label className="form-label" style={{ margin: 0 }}>
                                Assign Permissions <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.85rem' }}>({selectedPerms.length} selected)</span>
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button type="button" className="btn" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', width: 'auto', height: 'auto', minHeight: 0 }} onClick={selectAll}>Select All</button>
                                <button type="button" className="btn" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', width: 'auto', height: 'auto', minHeight: 0 }} onClick={clearAll}>Clear All</button>
                            </div>
                        </div>

                        {PERMISSION_CATEGORIES.map(cat => {
                            const catKeys = cat.permissions.map(p => p.key);
                            const allSelected = catKeys.every(k => selectedPerms.includes(k));
                            const someSelected = catKeys.some(k => selectedPerms.includes(k));
                            return (
                                <div key={cat.category} style={{ marginBottom: '1rem', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                                    <div
                                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.6rem 1rem', background: allSelected ? `${cat.color}18` : someSelected ? `${cat.color}0a` : '#f8fafc', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                                        onClick={() => toggleCategory(catKeys)}
                                    >
                                        <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: `2px solid ${allSelected ? cat.color : someSelected ? cat.color : 'var(--border)'}`, background: allSelected ? cat.color : someSelected ? `${cat.color}40` : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            {allSelected && <Check size={11} color="white" strokeWidth={3} />}
                                            {someSelected && !allSelected && <div style={{ width: 8, height: 2, background: cat.color }} />}
                                        </div>
                                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: cat.color }}>{cat.category}</span>
                                        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {catKeys.filter(k => selectedPerms.includes(k)).length}/{catKeys.length}
                                        </span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem', padding: '0.75rem' }}>
                                        {cat.permissions.map(p => (
                                            <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem 0.75rem', border: `1.5px solid ${selectedPerms.includes(p.key) ? cat.color : 'var(--border)'}`, borderRadius: '7px', cursor: 'pointer', background: selectedPerms.includes(p.key) ? `${cat.color}10` : 'white', transition: 'all 0.12s' }}>
                                                <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${selectedPerms.includes(p.key) ? cat.color : 'var(--border)'}`, background: selectedPerms.includes(p.key) ? cat.color : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} onClick={() => togglePerm(p.key)}>
                                                    {selectedPerms.includes(p.key) && <Check size={10} color="white" strokeWidth={3} />}
                                                </div>
                                                <span style={{ fontSize: '0.82rem', fontWeight: selectedPerms.includes(p.key) ? 600 : 400, color: selectedPerms.includes(p.key) ? cat.color : 'inherit' }}>{p.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                        <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0.6rem 2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Plus size={18} /> {editingId ? 'Update Group' : 'Create Group'}
                        </button>
                        {editingId && (
                            <button type="button" className="btn" onClick={resetForm} style={{ width: 'auto', padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                                <X size={16} /> Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Groups List */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0 }}>Existing Permission Groups</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <Users size={16} style={{ color: 'var(--text-muted)' }} />
                        <select className="form-input" value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem', minWidth: 140 }}>
                            <option value="">All Roles</option>
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                </div>
                {displayGroups.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: '8px' }}>
                        No permission groups yet. Create one above.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {displayGroups.map(g => {
                            const perms = g.permissions ? g.permissions.split(',').filter(Boolean) : [];
                            const rc = roleColor(g.targetRole);
                            return (
                                <div key={g.id} style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem 1.25rem', borderLeft: `4px solid ${rc}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                            <span style={{ fontWeight: 700, fontSize: '1rem' }}>{g.name}</span>
                                            {g.targetRole && (
                                                <span style={{ background: rc + '18', color: rc, border: `1px solid ${rc}40`, padding: '2px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700 }}>
                                                    {g.targetRole}
                                                </span>
                                            )}
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{perms.length} permissions</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="action-btn" onClick={() => startEdit(g)} title="Edit"><Edit2 size={15} /></button>
                                            <button className="action-btn" onClick={() => handleDelete(g.id)} title="Delete" style={{ color: 'var(--danger)' }}><Trash2 size={15} /></button>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                        {perms.length === 0 ? (
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No permissions assigned</span>
                                        ) : perms.map((p: string) => {
                                            // Find category color
                                            const catColor = PERMISSION_CATEGORIES.find(c => c.permissions.some(x => x.key === p))?.color || 'var(--primary)';
                                            const label = PERMISSION_CATEGORIES.flatMap(c => c.permissions).find(x => x.key === p)?.label || p.replace(/_/g, ' ');
                                            return (
                                                <span key={p} style={{ background: catColor + '15', color: catColor, padding: '2px 9px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600 }}>
                                                    {label}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PermissionGroups;
