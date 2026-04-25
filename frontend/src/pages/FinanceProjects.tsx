import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '') + '/api';

const FinanceProjects = () => {
    const [projects, setProjects] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const [woRes, payRes] = await Promise.all([
                    axios.get(`${API}/work-orders`),
                    axios.get(`${API}/payments`)
                ]);
                const allWo = woRes.data || [];
                setProjects(allWo.filter((w: any) => w.status === 'ASSIGNED' || w.status === 'COMPLETED'));
                setPayments(payRes.data || []);
            } catch (err) {
                toast.error('Failed to load projects');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <div className="page-container" style={{ textAlign: 'center', padding: '3rem' }}>Loading finance data...</div>;

    return (
        <div className="page-container fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BarChart2 color="var(--primary)" /> Current Projects Finances
                </h1>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Project / Work Order</th>
                            <th>Contractor</th>
                            <th>Budget</th>
                            <th>Total Approved Paid</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map(p => {
                            const projectPayments = payments.filter(pay => pay.workOrder?.id === p.id && pay.status === 'APPROVED');
                            const totalPaid = projectPayments.reduce((sum, pay) => sum + pay.amount, 0);
                            
                            return (
                                <tr key={p.id}>
                                    <td><strong>{p.jobTitle || p.description}</strong><br/><small style={{color:'var(--text-muted)'}}>{p.jobCode}</small></td>
                                    <td>{p.vendor?.fullName || p.vendor?.username}</td>
                                    <td>৳{p.budgetStart} - ৳{p.budgetEnd}</td>
                                    <td style={{ fontSize: '1.05rem', fontWeight: 600, color: totalPaid > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                                        ৳{totalPaid}
                                    </td>
                                    <td><span className="status-badge" style={{background: '#f1f5f9', color: '#64748b'}}>{p.status}</span></td>
                                </tr>
                            );
                        })}
                        {projects.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No active projects found.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FinanceProjects;
