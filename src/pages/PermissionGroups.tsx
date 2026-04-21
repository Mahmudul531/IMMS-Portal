import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit2, Shield, X, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const ALL_PERMISSIONS = [
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
    { key: 'TRANSFER_ASSET', label: 'Transfer Assets' },
    { key: 'VIEW_ASSETS', label: 'View Assets' },
];

const PermissionGroups = () => {
    const [groups, setGroups] = useState<any[]>([]);
    const [name, setName] = useState('');
    const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);

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

    const selectAll = () => setSelectedPerms(ALL_PERMISSIONS.map(p => p.key));
    const clearAll = () => setSelectedPerms([]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { toast.error('Group name required'); return; }
        try {
            const payload = { name: name.trim(), permissions: selectedPerms.join(',') };
            if (editingId) {
                await axios.put(`${API}/api/permission-groups/${editingId}`, payload);
                toast.success('Group updated');
            } else {
                await axios.post(`${API}/api/permission-groups`, payload);
                toast.success('Group created');
            }
            resetForm();
            fetchGroups();
        } catch { toast.error('Failed to save group'); }
    };

    const startEdit = (g: any) => {
        setEditingId(g.id);
        setName(g.name);
        setSelectedPerms(g.permissions ? g.permissions.split(',').filter(Boolean) : []);
    };

    const resetForm = () => {
        setEditingId(null);
        setName('');
        setSelectedPerms([]);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this group?')) return;
        try {
            await axios.delete(`${API}/api/permission-groups/${id}`);
            toast.success('Deleted');
            fetchGroups();
        } catch { toast.error('Delete failed'); }
    };

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Shield size={24} style={{ color: 'var(--primary)' }} /> Permission Groups
                </h2>
            </div>

            {/* Create / Edit Form */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--primary)', borderBottom: '2px solid var(--bg-main)', paddingBottom: '0.5rem' }}>
                    {editingId ? 'Edit Group' : 'Create New Permission Group'}
                </h3>
                <form onSubmit={handleSave}>
                    <div className="form-group" style={{ marginBottom: '1.5rem', maxWidth: '400px' }}>
                        <label className="form-label">Group Name <span style={{ color: 'red' }}>*</span></label>
                        <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Site Engineers, Finance Team" required />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <label className="form-label" style={{ margin: 0 }}>Assign Permissions</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button type="button" className="btn" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', width: 'auto', height: 'auto', minHeight: 0 }} onClick={selectAll}>Select All</button>
                                <button type="button" className="btn" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', width: 'auto', height: 'auto', minHeight: 0 }} onClick={clearAll}>Clear All</button>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                            {ALL_PERMISSIONS.map(p => (
                                <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.6rem 1rem', border: `2px solid ${selectedPerms.includes(p.key) ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '8px', cursor: 'pointer', background: selectedPerms.includes(p.key) ? 'rgba(16,185,129,0.08)' : 'white', transition: 'all 0.15s' }}>
                                    <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: `2px solid ${selectedPerms.includes(p.key) ? 'var(--primary)' : 'var(--border)'}`, background: selectedPerms.includes(p.key) ? 'var(--primary)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }} onClick={() => togglePerm(p.key)}>
                                        {selectedPerms.includes(p.key) && <Check size={12} color="white" strokeWidth={3} />}
                                    </div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: selectedPerms.includes(p.key) ? 600 : 400, color: selectedPerms.includes(p.key) ? 'var(--primary)' : 'inherit' }}>{p.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                        <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0.6rem 2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Plus size={18} /> {editingId ? 'Update Group' : 'Create Group'}
                        </button>
                        {editingId && (
                            <button type="button" className="btn" onClick={resetForm} style={{ width: 'auto', padding: '0.6rem 1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                                <X size={16} /> Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Groups List */}
            <div className="card">
                <h3 style={{ margin: '0 0 1.5rem 0' }}>Existing Permission Groups</h3>
                {groups.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: '8px' }}>
                        No permission groups yet.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {groups.map(g => {
                            const perms = g.permissions ? g.permissions.split(',').filter(Boolean) : [];
                            return (
                                <div key={g.id} style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem 1.25rem', borderLeft: '4px solid var(--primary)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                        <div>
                                            <span style={{ fontWeight: 700, fontSize: '1rem' }}>{g.name}</span>
                                            <span style={{ marginLeft: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{perms.length} permissions</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="action-btn" onClick={() => startEdit(g)} title="Edit"><Edit2 size={15} /></button>
                                            <button className="action-btn" onClick={() => handleDelete(g.id)} title="Delete" style={{ color: 'var(--danger)' }}><Trash2 size={15} /></button>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {perms.length === 0 ? (
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No permissions assigned</span>
                                        ) : perms.map((p: string) => (
                                            <span key={p} style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--primary)', padding: '2px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600 }}>
                                                {p.replace(/_/g, ' ')}
                                            </span>
                                        ))}
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
