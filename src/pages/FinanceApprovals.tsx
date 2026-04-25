import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { BarChart2, CheckCircle, XCircle, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '') + '/api';

const FinanceApprovals = () => {
    const { user } = useAuth();
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadPayments = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API}/payments`);
            
            // Filter based on role: Engineers see PENDING_ENGINEER, Admins see PENDING_ADMIN and APPROVED
            let filtered = res.data || [];
            if (user?.role === 'ENGINEER') {
                filtered = filtered.filter((p: any) => p.status === 'PENDING_ENGINEER');
            } else if (user?.role === 'ADMIN') {
                filtered = filtered.filter((p: any) => p.status === 'PENDING_ADMIN' || p.status === 'APPROVED');
            }
            setPayments(filtered);
        } catch (err) {
            toast.error('Failed to load pending payments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPayments();
    }, [user?.role]);

    const handleApprove = async (paymentId: number) => {
        if (!window.confirm("Approve this payment request?")) return;
        try {
            toast.loading('Approving payment...');
            await axios.put(`${API}/payments/${paymentId}/approve?role=${user?.role}`);
            toast.dismiss();
            toast.success('Payment approved successfully');
            loadPayments();
        } catch (err: any) {
            toast.dismiss();
            toast.error(err.response?.data || 'Failed to approve payment');
        }
    };

    const handleReject = async (paymentId: number) => {
        const note = prompt("Enter rejection reason:");
        if (note === null) return; // User cancelled
        try {
            toast.loading('Rejecting payment...');
            await axios.put(`${API}/payments/${paymentId}/reject?note=${encodeURIComponent(note)}`);
            toast.dismiss();
            toast.success('Payment rejected');
            loadPayments();
        } catch (err: any) {
            toast.dismiss();
            toast.error(err.response?.data || 'Failed to reject payment');
        }
    };

    if (loading) return <div className="page-container" style={{ textAlign: 'center', padding: '3rem' }}>Loading payments...</div>;

    return (
        <div className="page-container fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BarChart2 color="var(--primary)" /> Pending Payment Approvals
                </h1>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Work Order & Task</th>
                            <th>Contractor</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.map(p => (
                            <tr key={p.id}>
                                <td>
                                    <strong>{p.workOrder?.jobTitle}</strong><br/>
                                    <small style={{color:'var(--text-muted)'}}>{p.workOrder?.jobCode}</small><br/>
                                    {p.task && (
                                        <span style={{ fontSize: '0.8rem', color: 'var(--primary)', background: 'rgba(16,185,129,0.08)', padding: '2px 6px', borderRadius: 12 }}>
                                            Task: {p.task.title}
                                        </span>
                                    )}
                                </td>
                                <td>{p.vendor?.fullName || p.vendor?.username}</td>
                                <td style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)' }}>৳{p.amount}</td>
                                <td>
                                    <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, background: p.status === 'APPROVED' ? 'rgba(16,185,129,0.1)' : '#fef3c7', color: p.status === 'APPROVED' ? '#10b981' : '#d97706' }}>
                                        {p.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {p.status !== 'APPROVED' && (
                                            <>
                                                <button className="btn btn-primary" onClick={() => handleApprove(p.id)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', width: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <CheckCircle size={14} /> Approve
                                                </button>
                                                <button className="btn" onClick={() => handleReject(p.id)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', width: 'auto', display: 'flex', alignItems: 'center', gap: 4, background: '#fee2e2', color: '#ef4444', border: 'none' }}>
                                                    <XCircle size={14} /> Reject
                                                </button>
                                            </>
                                        )}
                                        {p.status === 'APPROVED' && p.invoiceUrl && (
                                            <a href={p.invoiceUrl} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', width: 'auto', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                                                <Download size={14} /> Invoice
                                            </a>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {payments.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No pending approvals.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FinanceApprovals;
