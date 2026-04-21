import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Briefcase, Plus, X, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const ProjectAdd = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const editId = new URLSearchParams(location.search).get('id');

    const [properties, setProperties] = useState<any[]>([]);
    const [assets, setAssets] = useState<any[]>([]);
    const [engineers, setEngineers] = useState<any[]>([]);
    const [methods, setMethods] = useState<any[]>([]);

    // Form state
    const [jobTitle, setJobTitle] = useState('');
    const [jobCode, setJobCode] = useState('');
    const [propertyId, setPropertyId] = useState('');
    const [method, setMethod] = useState('');
    const [publishDate, setPublishDate] = useState('');
    const [closeDate, setCloseDate] = useState('');
    const [budgetStart, setBudgetStart] = useState('');
    const [budgetEnd, setBudgetEnd] = useState('');
    const [eligibility, setEligibility] = useState('');
    const [fieldEngineerId, setFieldEngineerId] = useState('');
    const [selectedAssetIds, setSelectedAssetIds] = useState<number[]>([]);
    const [assetSearch, setAssetSearch] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const [propsRes, assetsRes, usersRes, methodsRes] = await Promise.all([
                    axios.get(`${API}/api/properties`),
                    axios.get(`${API}/api/assets`),
                    axios.get(`${API}/api/users`),
                    axios.get(`${API}/api/job-methods`),
                ]);
                setProperties(Array.isArray(propsRes.data) ? propsRes.data : []);
                setAssets(Array.isArray(assetsRes.data) ? assetsRes.data : []);
                setEngineers((Array.isArray(usersRes.data) ? usersRes.data : []).filter((u: any) => u.role === 'ENGINEER'));
                setMethods(Array.isArray(methodsRes.data) ? methodsRes.data : []);

                if (editId) {
                    const { data: wo } = await axios.get(`${API}/api/work-orders/${editId}`);
                    setJobTitle(wo.jobTitle || wo.description || '');
                    setJobCode(wo.jobCode || '');
                    setPropertyId(wo.property?.id?.toString() || '');
                    setMethod(wo.method || '');
                    setPublishDate(wo.publishDate || '');
                    setCloseDate(wo.closeDate || '');
                    setBudgetStart(wo.budgetStart || '');
                    setBudgetEnd(wo.budgetEnd || '');
                    setEligibility(wo.eligibility || '');
                    setFieldEngineerId(wo.fieldEngineer?.id?.toString() || '');
                    setSelectedAssetIds((wo.taggedAssets || []).map((a: any) => a.id));
                }
            } catch (err) {
                toast.error('Failed to load form data');
            }
        };
        load();
    }, []);

    const toggleAsset = (id: number) => {
        setSelectedAssetIds(prev =>
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        );
    };

    const filteredAssets = assets.filter(a => {
        const propMatch = propertyId ? String(a.property?.id) === propertyId : true;
        const searchMatch = assetSearch ? a.name?.toLowerCase().includes(assetSearch.toLowerCase()) : true;
        return propMatch && searchMatch;
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                jobTitle, jobCode, method,
                propertyId: propertyId ? parseInt(propertyId) : null,
                publishDate: publishDate || null,
                closeDate: closeDate || null,
                budgetStart: budgetStart || null,
                budgetEnd: budgetEnd || null,
                eligibility,
                fieldEngineerId: fieldEngineerId ? parseInt(fieldEngineerId) : null,
                assetIds: selectedAssetIds,
                description: jobTitle,
            };

            if (editId) {
                await axios.put(`${API}/api/work-orders/${editId}`, payload);
                toast.success('Project updated successfully');
            } else {
                await axios.post(`${API}/api/work-orders`, payload);
                toast.success('Project created successfully');
            }
            navigate('/work-orders/list');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save project');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="page-container fade-in" style={{ paddingBottom: '3rem' }}>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Briefcase size={24} style={{ color: 'var(--primary)' }} />
                    {editId ? 'Edit Project / Work Order' : 'New Project / Work Order'}
                </h2>
                <button className="btn" onClick={() => navigate('/work-orders/list')} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    Cancel
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Job Identity */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--primary)', borderBottom: '2px solid var(--bg-main)', paddingBottom: '0.5rem' }}>Job Identity</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label className="form-label">Job Title <span style={{ color: 'red' }}>*</span></label>
                            <input className="form-input" value={jobTitle} onChange={e => setJobTitle(e.target.value)} required placeholder="e.g. Electrical Maintenance Q2 2025" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Job Code <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(Unique ID)</span></label>
                            <input className="form-input" value={jobCode} onChange={e => setJobCode(e.target.value)} placeholder="e.g. JOB-2025-001" style={{ fontFamily: 'monospace', letterSpacing: '1px' }} />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Property / Location <span style={{ color: 'red' }}>*</span></label>
                            <select className="form-input" value={propertyId} onChange={e => { setPropertyId(e.target.value); setSelectedAssetIds([]); }} required>
                                <option value="">Select property...</option>
                                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Method <span style={{ color: 'red' }}>*</span></label>
                            <select className="form-input" value={method} onChange={e => setMethod(e.target.value)} required>
                                <option value="">Select method...</option>
                                {methods.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                                {methods.length === 0 && <option disabled>No methods — add via Work Order Setup</option>}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Field Engineer</label>
                            <select className="form-input" value={fieldEngineerId} onChange={e => setFieldEngineerId(e.target.value)}>
                                <option value="">Unassigned</option>
                                {engineers.map(u => <option key={u.id} value={u.id}>{u.fullName || u.username} ({u.designation || 'Engineer'})</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Timeline & Budget */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--primary)', borderBottom: '2px solid var(--bg-main)', paddingBottom: '0.5rem' }}>Timeline & Budget</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label className="form-label">Publish Date</label>
                            <input className="form-input" type="date" value={publishDate} onChange={e => setPublishDate(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Close Date</label>
                            <input className="form-input" type="date" value={closeDate} onChange={e => setCloseDate(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Budget Start (৳)</label>
                            <input className="form-input" type="number" step="0.01" value={budgetStart} onChange={e => setBudgetStart(e.target.value)} placeholder="Minimum" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Budget End (৳)</label>
                            <input className="form-input" type="number" step="0.01" value={budgetEnd} onChange={e => setBudgetEnd(e.target.value)} placeholder="Maximum" />
                        </div>
                    </div>
                </div>

                {/* Description / Eligibility */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--primary)', borderBottom: '2px solid var(--bg-main)', paddingBottom: '0.5rem' }}>Description & Eligibility</h3>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Job Description / Eligibility Criteria</label>
                        <textarea className="form-input" value={eligibility} onChange={e => setEligibility(e.target.value)} rows={5} placeholder="Describe the scope of work, qualifications required, terms and conditions..." />
                    </div>
                </div>

                {/* Asset Multi-Select */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary)', borderBottom: '2px solid var(--bg-main)', paddingBottom: '0.5rem' }}>
                        Tag Assets <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>({selectedAssetIds.length} selected)</span>
                    </h3>
                    
                    {selectedAssetIds.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1rem' }}>
                            {selectedAssetIds.map(id => {
                                const a = assets.find(x => x.id === id);
                                return a ? (
                                    <span key={id} style={{ background: 'var(--primary)', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {a.name}
                                        <button type="button" onClick={() => toggleAsset(id)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={12} /></button>
                                    </span>
                                ) : null;
                            })}
                        </div>
                    )}

                    <div style={{ position: 'relative', marginBottom: '1rem' }}>
                        <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input className="form-input" style={{ paddingLeft: '34px' }} placeholder="Search assets..." value={assetSearch} onChange={e => setAssetSearch(e.target.value)} />
                    </div>

                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                        {filteredAssets.length === 0 ? (
                            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                {propertyId ? 'No assets found for this property.' : 'Select a property to filter assets.'}
                            </div>
                        ) : filteredAssets.map(a => (
                            <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.6rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border)', background: selectedAssetIds.includes(a.id) ? 'rgba(16,185,129,0.08)' : 'white', transition: 'background 0.15s' }}>
                                <input type="checkbox" checked={selectedAssetIds.includes(a.id)} onChange={() => toggleAsset(a.id)} />
                                <span style={{ fontWeight: 600 }}>{a.name}</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.type} · {a.property?.name}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div style={{ position: 'sticky', bottom: '1rem', background: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', border: '1px solid var(--border)', zIndex: 100 }}>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: '1.05rem', padding: '0.8rem' }} disabled={saving}>
                        {saving ? 'Saving...' : (editId ? 'Update Project' : 'Create Project / Work Order')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProjectAdd;
