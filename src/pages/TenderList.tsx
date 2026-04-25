import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ClipboardList, CheckCircle, FileText, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '') + '/api';

const TenderList = () => {
    const { user } = useAuth();
    const [tenders, setTenders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTender, setSelectedTender] = useState<any>(null);
    const [applications, setApplications] = useState<any[]>([]);

    const loadTenders = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API}/tenders`);
            setTenders(res.data.filter((t: any) => t.status === 'OPEN'));
        } catch (err) {
            toast.error('Failed to load tenders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTenders();
    }, []);

    const viewApplications = async (tender: any) => {
        setSelectedTender(tender);
        try {
            const res = await axios.get(`${API}/tenders/${tender.id}/applications`);
            setApplications(res.data || []);
        } catch (err) {
            toast.error('Failed to load applications');
        }
    };

    const handleAssignBid = async (applicationId: number) => {
        if (!window.confirm("Are you sure you want to approve this contractor and create a Work Order?")) return;
        
        try {
            toast.loading('Assigning project...');
            await axios.put(`${API}/tenders/${selectedTender.id}/approve-bid?applicationId=${applicationId}`);
            toast.dismiss();
            toast.success('Contractor assigned and Work Order created successfully!');
            setSelectedTender(null);
            loadTenders();
        } catch (err: any) {
            toast.dismiss();
            toast.error('Failed to assign contractor');
        }
    };

    const handleApproveDirect = async (tenderId: number) => {
        if (!window.confirm("Are you sure you want to approve this direct assignment and create a Work Order?")) return;
        
        try {
            toast.loading('Approving assignment...');
            await axios.put(`${API}/tenders/${tenderId}/approve-direct`);
            toast.dismiss();
            toast.success('Work Order created successfully!');
            loadTenders();
        } catch (err: any) {
            toast.dismiss();
            toast.error('Failed to approve assignment');
        }
    };

    if (loading) return <div className="page-container" style={{ textAlign: 'center', padding: '3rem' }}>Loading tenders...</div>;

    return (
        <div className="page-container fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ClipboardList color="var(--primary)" /> Tender List
                </h1>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Tender Title</th>
                            <th>Property</th>
                            <th>Method</th>
                            <th>Budget / Assigned Amt</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tenders.map(t => (
                            <tr key={t.id}>
                                <td><strong>{t.title}</strong><br/><small style={{color:'var(--text-muted)'}}>{t.description?.substring(0, 50)}...</small></td>
                                <td>{t.property?.name || '—'}</td>
                                <td>{t.method.replace('_', ' ')}</td>
                                <td>
                                    {t.method === 'DIRECT_ASSIGN' ? (
                                        <strong style={{color:'var(--primary)'}}>৳{t.assignedAmount}</strong>
                                    ) : (
                                        <span>৳{t.budgetStart} - ৳{t.budgetEnd}</span>
                                    )}
                                </td>
                                <td>
                                    {t.method === 'OPEN_BID' ? (
                                        <button className="btn btn-secondary" onClick={() => viewApplications(t)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', width: 'auto' }}>
                                            View Bids
                                        </button>
                                    ) : (
                                        <button className="btn btn-primary" onClick={() => handleApproveDirect(t.id)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', width: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <CheckCircle size={14} /> Approve & Convert
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {tenders.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No open tenders found.</td></tr>}
                    </tbody>
                </table>
            </div>

            {selectedTender && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="card" style={{ width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                            <div>
                                <h2 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Bids for {selectedTender.jobTitle}</h2>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Code: {selectedTender.jobCode}</span>
                            </div>
                            <button className="btn btn-secondary" onClick={() => setSelectedTender(null)} style={{ padding: '0.5rem', width: 'auto' }}><X size={18} /></button>
                        </div>
                        
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Contractor</th>
                                        <th>Bid Amount</th>
                                        <th>Document</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {applications.map(app => (
                                        <tr key={app.id}>
                                            <td><strong>{app.vendor?.fullName || app.vendor?.username}</strong></td>
                                            <td><strong>৳{app.amount}</strong></td>
                                            <td>
                                                {app.documentUrl ? (
                                                    <a href={app.documentUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', color: 'var(--primary)', fontSize: '0.85rem' }}>
                                                        <FileText size={16} /> View Document
                                                    </a>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No document</span>
                                                )}
                                            </td>
                                            <td>
                                                <button className="btn btn-primary" onClick={() => handleAssignBid(app.id)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', width: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <CheckCircle size={14} /> Approve & Convert
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {applications.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: '1.5rem' }}>No bids received yet.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TenderList;
