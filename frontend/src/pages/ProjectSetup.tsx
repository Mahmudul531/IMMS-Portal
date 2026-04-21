import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const ProjectSetup = () => {
    const [methods, setMethods] = useState<any[]>([]);
    const [newMethod, setNewMethod] = useState('');

    const fetchMethods = async () => {
        try {
            const { data } = await axios.get(`${API}/api/job-methods`);
            setMethods(Array.isArray(data) ? data : []);
        } catch { toast.error('Failed to load job methods'); }
    };

    useEffect(() => { fetchMethods(); }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMethod.trim()) return;
        try {
            await axios.post(`${API}/api/job-methods`, { name: newMethod.trim() });
            toast.success('Method added');
            setNewMethod('');
            fetchMethods();
        } catch { toast.error('Failed to add method (may already exist)'); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this method?')) return;
        try {
            await axios.delete(`${API}/api/job-methods/${id}`);
            toast.success('Deleted');
            fetchMethods();
        } catch { toast.error('Failed to delete'); }
    };

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Settings size={24} style={{ color: 'var(--primary)' }} /> Work Order Setup
                </h2>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>Add Job Method</h3>
                <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                        <label className="form-label">Method Name</label>
                        <input className="form-input" value={newMethod} onChange={e => setNewMethod(e.target.value)} placeholder="e.g. OTM, RFP, EoI, Tender, Direct Award" required />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: 'auto', height: '40px', padding: '0 1.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Plus size={18} /> Add
                    </button>
                </form>
            </div>

            <div className="card">
                <h3 style={{ margin: '0 0 1rem 0' }}>Registered Job Methods</h3>
                {methods.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: '8px' }}>
                        No job methods yet. Add one above.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                        {methods.map(m => (
                            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                <span style={{ fontWeight: 600 }}>{m.name}</span>
                                <button onClick={() => handleDelete(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', display: 'flex', padding: 0 }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectSetup;
