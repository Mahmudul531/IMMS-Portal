import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '') + '/api';

const TenderAdd = () => {
    const navigate = useNavigate();
    const [properties, setProperties] = useState<any[]>([]);
    const [vendors, setVendors] = useState<any[]>([]);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        budgetStart: '',
        budgetEnd: '',
        method: 'OPEN_BID',
        propertyId: '',
        assignedVendorId: '',
        assignedAmount: ''
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                const [propRes, userRes] = await Promise.all([
                    axios.get(`${API}/properties`),
                    axios.get(`${API}/users`)
                ]);
                setProperties(propRes.data || []);
                setVendors((userRes.data || []).filter((u: any) => u.role === 'VENDOR'));
            } catch (err) {
                toast.error('Failed to load setup data');
            }
        };
        loadData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            toast.loading('Creating tender...');
            const payload: any = {
                title: formData.title,
                description: formData.description,
                budgetStart: Number(formData.budgetStart),
                budgetEnd: Number(formData.budgetEnd),
                method: formData.method
            };
            if (formData.propertyId) {
                payload.property = { id: Number(formData.propertyId) };
            }
            if (formData.method === 'DIRECT_ASSIGN') {
                payload.assignedVendor = { id: Number(formData.assignedVendorId) };
                payload.assignedAmount = Number(formData.assignedAmount);
            }

            await axios.post(`${API}/tenders`, payload);
            toast.dismiss();
            toast.success('Tender created successfully!');
            navigate('/tenders');
        } catch (err: any) {
            toast.dismiss();
            const data = err.response?.data;
            const errorMsg = typeof data === 'string' && data.length > 0 
                ? data 
                : (data?.message || data?.error || 'Failed to create tender');
            toast.error(errorMsg);
        }
    };

    return (
        <div className="page-container fade-in">
            <h1 className="page-title">Create Tender / Contract</h1>
            <div className="card">
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label>Tender / Job Title</label>
                        <input className="form-input" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                    </div>

                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label>Description</label>
                        <textarea className="form-input" rows={3} required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                    </div>

                    <div className="form-group">
                        <label>Minimum Budget (৳)</label>
                        <input type="number" className="form-input" required value={formData.budgetStart} onChange={e => setFormData({...formData, budgetStart: e.target.value})} />
                    </div>

                    <div className="form-group">
                        <label>Maximum Budget (৳)</label>
                        <input type="number" className="form-input" required value={formData.budgetEnd} onChange={e => setFormData({...formData, budgetEnd: e.target.value})} />
                    </div>

                    <div className="form-group">
                        <label>Property Location</label>
                        <select className="form-input" value={formData.propertyId} onChange={e => setFormData({...formData, propertyId: e.target.value})}>
                            <option value="">Select Property...</option>
                            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Procurement Method</label>
                        <select className="form-input" value={formData.method} onChange={e => setFormData({...formData, method: e.target.value})}>
                            <option value="OPEN_BID">Open Bidding (Vendors apply)</option>
                            <option value="DIRECT_ASSIGN">Direct Assignment</option>
                        </select>
                    </div>

                    {formData.method === 'DIRECT_ASSIGN' && (
                        <>
                            <div className="form-group">
                                <label>Assign To Vendor</label>
                                <select className="form-input" required value={formData.assignedVendorId} onChange={e => setFormData({...formData, assignedVendorId: e.target.value})}>
                                    <option value="">Select Vendor...</option>
                                    {vendors.map(v => <option key={v.id} value={v.id}>{v.fullName || v.username}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Assigned Contract Amount (৳)</label>
                                <input type="number" className="form-input" required value={formData.assignedAmount} onChange={e => setFormData({...formData, assignedAmount: e.target.value})} />
                            </div>
                        </>
                    )}

                    <div style={{ gridColumn: '1 / -1', marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                        <button type="submit" className="btn btn-primary">Publish Tender</button>
                        <button type="button" className="btn btn-secondary" onClick={() => navigate('/tenders')}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TenderAdd;
