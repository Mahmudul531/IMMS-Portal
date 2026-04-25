import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Briefcase, UploadCloud, CheckCircle2, AlertCircle, FileText, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '') + '/api';

const MyContracts = () => {
    const { user } = useAuth();
    const [tenders, setTenders] = useState<any[]>([]);
    const [myProjects, setMyProjects] = useState<any[]>([]);
    const [availableProjects, setAvailableProjects] = useState<any[]>([]);
    const [myApplications, setMyApplications] = useState<any[]>([]);
    const [myWoApplications, setMyWoApplications] = useState<any[]>([]);
    const [myPayments, setMyPayments] = useState<any[]>([]);
    const [tasksMap, setTasksMap] = useState<Record<number, any[]>>({});
    
    const [activeTab, setActiveTab] = useState<'TENDERS' | 'AVAILABLE_PROJECTS' | 'PROJECTS'>('TENDERS');
    const [loading, setLoading] = useState(true);

    const [applyModal, setApplyModal] = useState<{ isOpen: boolean; workOrderId: number | null; type: 'TENDER' | 'WORK_ORDER' }>({ isOpen: false, workOrderId: null, type: 'TENDER' });
    const [bidAmount, setBidAmount] = useState('');
    const [bidFile, setBidFile] = useState<File | null>(null);

    const loadData = async () => {
        try {
            setLoading(true);
            const [woRes, appRes, payRes, tenderRes, tenderAppRes] = await Promise.all([
                axios.get(`${API}/work-orders`),
                axios.get(`${API}/work-orders/my-applications?vendorId=${user?.id}`).catch(() => ({data: []})),
                axios.get(`${API}/payments/my?vendorId=${user?.id}`),
                axios.get(`${API}/tenders`),
                axios.get(`${API}/tenders/my-applications?vendorId=${user?.id}`)
            ]);

            setTenders((tenderRes.data || []).filter((w: any) => w.status === 'OPEN' && w.method === 'OPEN_BID'));
            
            const allWo = woRes.data || [];
            const assigned = allWo.filter((w: any) => w.status === 'ASSIGNED' && w.vendor?.id === user?.id);
            setMyProjects(assigned);
            setAvailableProjects(allWo.filter((w: any) => w.status === 'PENDING' || w.status === 'APPLIED'));
            
            setMyApplications(tenderAppRes.data || []);
            setMyWoApplications(appRes.data || []);
            setMyPayments(payRes.data || []);

            // Fetch tasks for assigned projects to check completion
            const tMap: Record<number, any[]> = {};
            await Promise.all(assigned.map(async (p: any) => {
                try {
                    const tRes = await axios.get(`${API}/tasks?workOrderId=${p.id}`);
                    tMap[p.id] = tRes.data || [];
                } catch (e) { tMap[p.id] = []; }
            }));
            setTasksMap(tMap);

        } catch (err) {
            toast.error('Failed to load contracts data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user?.id]);

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            toast.loading('Submitting application...');
            
            if (applyModal.type === 'TENDER') {
                if (!bidFile) {
                    toast.dismiss();
                    return toast.error('Please upload required documents for Tender');
                }
                const formData = new FormData();
                formData.append('file', bidFile);
                await axios.post(`${API}/tenders/${applyModal.workOrderId}/applications?vendorId=${user?.id}&amount=${bidAmount}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await axios.post(`${API}/work-orders/${applyModal.workOrderId}/applications?vendorId=${user?.id}&amount=${bidAmount}`);
            }

            toast.dismiss();
            toast.success('Application submitted successfully!');
            setApplyModal({ isOpen: false, workOrderId: null, type: 'TENDER' });
            setBidAmount('');
            setBidFile(null);
            loadData();
        } catch (err: any) {
            toast.dismiss();
            toast.error(err.response?.data || 'Error submitting application');
        }
    };

    const handleApplyForPayment = async (workOrderId: number, taskId: number, taskName: string, maxAmount: number) => {
        const amount = prompt(`Enter payment amount to claim for task "${taskName}" (Max allowed: ৳${maxAmount}):`, maxAmount.toString());
        if (!amount || isNaN(Number(amount))) return;
        
        if (Number(amount) > maxAmount) {
            return toast.error(`Cannot claim more than ৳${maxAmount} for this task.`);
        }

        try {
            await axios.post(`${API}/payments?vendorId=${user?.id}&workOrderId=${workOrderId}&taskId=${taskId}&amount=${amount}`);
            toast.success('Payment request submitted successfully');
            loadData();
        } catch (err: any) {
            toast.error(err.response?.data || 'Failed to submit payment request');
        }
    };

    if (loading) return <div className="page-container" style={{ textAlign: 'center', padding: '3rem' }}>Loading contracts...</div>;

    return (
        <div className="page-container fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Briefcase color="var(--primary)" /> My Contracts
                </h1>
            </div>

            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', overflowX: 'auto' }}>
                <button 
                    style={{ background: 'none', border: 'none', padding: '0.75rem 1.5rem', fontWeight: 600, borderBottom: activeTab === 'TENDERS' ? '3px solid var(--primary)' : '3px solid transparent', color: activeTab === 'TENDERS' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    onClick={() => setActiveTab('TENDERS')}
                >
                    Available Tenders
                </button>
                <button 
                    style={{ background: 'none', border: 'none', padding: '0.75rem 1.5rem', fontWeight: 600, borderBottom: activeTab === 'AVAILABLE_PROJECTS' ? '3px solid var(--primary)' : '3px solid transparent', color: activeTab === 'AVAILABLE_PROJECTS' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    onClick={() => setActiveTab('AVAILABLE_PROJECTS')}
                >
                    Available Projects
                </button>
                <button 
                    style={{ background: 'none', border: 'none', padding: '0.75rem 1.5rem', fontWeight: 600, borderBottom: activeTab === 'PROJECTS' ? '3px solid var(--primary)' : '3px solid transparent', color: activeTab === 'PROJECTS' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    onClick={() => setActiveTab('PROJECTS')}
                >
                    My Assigned Projects
                </button>
            </div>

            {activeTab === 'TENDERS' && (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Job Title & Code</th>
                                <th>Property</th>
                                <th>Method</th>
                                <th>Budget</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tenders.map(t => {
                                const hasApplied = myApplications.some(a => a.workOrder?.id === t.id);
                                return (
                                    <tr key={t.id}>
                                        <td><strong>{t.jobTitle || t.description}</strong><br/><small style={{color:'var(--text-muted)'}}>{t.jobCode}</small></td>
                                        <td>{t.property?.name || '—'}</td>
                                        <td>{t.method}</td>
                                        <td>৳{t.budgetStart} - ৳{t.budgetEnd}</td>
                                        <td><span className="status-badge" style={{background: '#f1f5f9', color: '#64748b'}}>{t.status}</span></td>
                                        <td>
                                            {hasApplied ? (
                                                <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem', fontWeight: 600 }}><CheckCircle2 size={16}/> Applied</span>
                                            ) : (
                                                <button className="btn btn-primary" onClick={() => setApplyModal({ isOpen: true, workOrderId: t.id, type: 'TENDER' })} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', width: 'auto' }}>
                                                    Apply
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {tenders.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No open tenders available.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'AVAILABLE_PROJECTS' && (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Job Title & Code</th>
                                <th>Property</th>
                                <th>Method</th>
                                <th>Budget</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {availableProjects.map((p: any) => {
                                const hasApplied = myWoApplications.some((a: any) => a.workOrder?.id === p.id);
                                return (
                                    <tr key={p.id}>
                                        <td><strong>{p.jobTitle || p.description}</strong><br/><small style={{color:'var(--text-muted)'}}>{p.jobCode}</small></td>
                                        <td>{p.property?.name || '—'}</td>
                                        <td>{p.method}</td>
                                        <td>৳{p.budgetStart} - ৳{p.budgetEnd}</td>
                                        <td><span className="status-badge" style={{background: '#f1f5f9', color: '#64748b'}}>{p.status}</span></td>
                                        <td>
                                            {hasApplied ? (
                                                <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem', fontWeight: 600 }}><CheckCircle2 size={16}/> Applied</span>
                                            ) : (
                                                <button className="btn btn-primary" onClick={() => setApplyModal({ isOpen: true, workOrderId: p.id, type: 'WORK_ORDER' })} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', width: 'auto' }}>
                                                    Apply
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {availableProjects.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No open projects available.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'PROJECTS' && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {myProjects.map(p => {
                        const tasks = tasksMap[p.id] || [];
                        const completedCount = tasks.filter(t => t.completionPct === 100).length;
                        const allTasksDone = tasks.length > 0 && completedCount === tasks.length;
                        const payments = myPayments.filter(pay => pay.workOrder?.id === p.id);
                        const maxTaskAmount = tasks.length > 0 && p.amount ? Math.round((p.amount / tasks.length) * 100) / 100 : 0;

                        return (
                            <div key={p.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: '0 0 0.5rem 0' }}>{p.jobTitle || p.description}</h3>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                        <span>Code: {p.jobCode}</span>
                                        <span>Property: {p.property?.name || '—'}</span>
                                        <span style={{ color: allTasksDone ? 'var(--success)' : 'var(--warning)' }}>
                                            Tasks: {completedCount} / {tasks.length} Completed
                                        </span>
                                        {p.amount && (
                                            <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                                                Total Contract: ৳{p.amount.toLocaleString()}
                                            </span>
                                        )}
                                    </div>

                                    {tasks.length > 0 && (
                                        <div style={{ marginTop: '1rem', background: '#f1f5f9', padding: '0.75rem', borderRadius: '8px' }}>
                                            <strong style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Assigned Tasks (Max claim per task: ৳{maxTaskAmount}):</strong>
                                            <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {tasks.map(t => {
                                                    const taskPayment = payments.find(pay => pay.task?.id === t.id);
                                                    return (
                                                        <li key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                                            <div>
                                                                <span style={{ color: t.completionPct === 100 ? 'var(--success)' : 'inherit', fontWeight: t.completionPct === 100 ? 600 : 400 }}>
                                                                    {t.title} - {t.completionPct}% Completed
                                                                </span>
                                                                {taskPayment && (
                                                                    <div style={{ fontSize: '0.75rem', marginTop: 4, color: taskPayment.status === 'APPROVED' ? 'var(--success)' : (taskPayment.status === 'REJECTED' ? 'var(--danger)' : 'var(--warning)') }}>
                                                                        Payment: ৳{taskPayment.amount} ({taskPayment.status.replace('_', ' ')})
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                {taskPayment?.status === 'APPROVED' && taskPayment.invoiceUrl && (
                                                                    <a href={`${API}/payments/${taskPayment.id}/invoice/download`} target="_blank" rel="noreferrer" className="btn" style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.2rem 0.5rem', fontSize: '0.75rem', textDecoration: 'none' }}>
                                                                        Invoice
                                                                    </a>
                                                                )}
                                                                {!taskPayment && t.completionPct === 100 && (
                                                                    <button className="btn btn-primary" onClick={() => handleApplyForPayment(p.id, t.id, t.title, maxTaskAmount)} style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', width: 'auto' }}>
                                                                        Apply Payment
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {myProjects.length === 0 && <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>You have no assigned projects.</div>}
                </div>
            )}

            {/* Application Modal */}
            {applyModal.isOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="card" style={{ width: '100%', maxWidth: 500 }}>
                        <h2 style={{ marginTop: 0 }}>Apply for Tender</h2>
                        <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Bid Amount ($)</label>
                                <input type="number" className="form-input" required value={bidAmount} onChange={e => setBidAmount(e.target.value)} placeholder="0.00" />
                            </div>
                            {applyModal.type === 'TENDER' && (
                                <div className="form-group">
                                    <label>Contract / Proposal Document (PDF, ZIP)</label>
                                    <div className="file-drop-zone" style={{ border: '2px dashed var(--border)', padding: '2rem', textAlign: 'center', borderRadius: '8px', background: '#f8fafc' }}>
                                        <input type="file" required onChange={e => setBidFile(e.target.files?.[0] || null)} style={{ width: '100%' }} />
                                        {bidFile && <div style={{ marginTop: '1rem', color: 'var(--primary)', fontWeight: 600 }}><FileText size={18} style={{ verticalAlign: 'middle', marginRight: 6 }}/>{bidFile.name}</div>}
                                    </div>
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setApplyModal({ isOpen: false, workOrderId: null, type: 'TENDER' })}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <UploadCloud size={18} /> Submit Application
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyContracts;
