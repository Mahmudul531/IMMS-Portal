import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Filter, History, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '') + '/api';

const PaymentReports = () => {
    const [workOrders, setWorkOrders] = useState<any[]>([]);
    const [selectedWoId, setSelectedWoId] = useState('');
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchWo = async () => {
            try {
                const res = await axios.get(`${API}/work-orders`);
                setWorkOrders(res.data || []);
            } catch (err) {
                toast.error('Failed to load work orders');
            }
        };
        fetchWo();
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/payments`);
            setPayments(res.data || []);
        } catch (err) {
            toast.error('Failed to load payment history');
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedWoId(e.target.value);
    };

    const filteredPayments = selectedWoId 
        ? payments.filter(p => p.workOrder?.id.toString() === selectedWoId)
        : payments;

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <h1 className="page-title">
                    <FileText size={28} style={{ marginRight: '12px', color: '#10b981' }} />
                    Payment History
                </h1>
                <p className="page-subtitle">View financial history and invoices for projects and tenders.</p>
            </div>

            <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                        <Filter size={18} />
                        <span style={{ fontWeight: 500 }}>Filter by Project/Work Order:</span>
                    </div>
                    <select 
                        className="form-input" 
                        style={{ maxWidth: '400px', marginBottom: 0 }}
                        value={selectedWoId}
                        onChange={handleFilter}
                    >
                        <option value="">All Projects</option>
                        {workOrders.map(wo => (
                            <option key={wo.id} value={wo.id}>
                                {wo.jobTitle || wo.description} ({wo.jobCode})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <History size={20} color="#3b82f6" />
                    <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Payment Audit Log</h2>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading payment history...</div>
                ) : filteredPayments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No payment records found.</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date Applied</th>
                                <th>Project Code</th>
                                <th>Contractor</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Invoice</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPayments.map(p => (
                                <tr key={p.id}>
                                    <td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}</td>
                                    <td>
                                        {p.workOrder?.jobCode || '—'}
                                        {p.task && (
                                            <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: 4 }}>
                                                Task: {p.task.title}
                                            </div>
                                        )}
                                    </td>
                                    <td><strong>{p.vendor?.fullName || p.vendor?.username}</strong></td>
                                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>৳{p.amount}</td>
                                    <td>
                                        <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, background: p.status === 'APPROVED' ? 'rgba(16,185,129,0.1)' : (p.status === 'REJECTED' ? 'rgba(239,68,68,0.1)' : '#fef3c7'), color: p.status === 'APPROVED' ? '#10b981' : (p.status === 'REJECTED' ? '#ef4444' : '#d97706') }}>
                                            {p.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td>
                                        {p.status === 'APPROVED' ? (
                                            <a href={`${API}/payments/${p.id}/invoice/download`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', color: '#10b981', fontWeight: 600, fontSize: '0.85rem' }}>
                                                <Download size={16} /> PDF
                                            </a>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Not generated</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default PaymentReports;
