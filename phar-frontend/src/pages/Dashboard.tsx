import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { TrendingUp, ShoppingBag, Users, Award, RefreshCw, ChevronDown } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const PHAR = `${API}/phar/api`;

const COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

const fmt = (n: number) => new Intl.NumberFormat('en-BD', { maximumFractionDigits: 0 }).format(n);
const fmtBDT = (n: number) => '৳' + fmt(n);

const KpiCard = ({ icon: Icon, label, value, color, sub }: any) => (
    <div style={{
        background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '1.5rem',
        position: 'relative', overflow: 'hidden'
    }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: color, opacity: 0.15 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '0.75rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: color, opacity: 0.9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={22} color="white" />
            </div>
            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
        </div>
        <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.4rem' }}>{sub}</div>}
    </div>
);

const ChartCard = ({ title, children, style = {} }: any) => (
    <div style={{
        background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '1.5rem', ...style
    }}>
        <h3 style={{ margin: '0 0 1.25rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h3>
        {children}
    </div>
);

export default function Dashboard() {
    const [period, setPeriod] = useState('');
    const [periods, setPeriods] = useState<string[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [byZone, setByZone] = useState<any[]>([]);
    const [byTier, setByTier] = useState<any[]>([]);
    const [bySM, setBySM] = useState<any[]>([]);
    const [byShop, setByShop] = useState<any[]>([]);
    const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
    const [commission, setCommission] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async (p?: string) => {
        setLoading(true);
        const q = p ? `?period=${p}` : '';
        try {
            const [sumR, zonesR, tierR, smR, _srR, shopR, trendR, commR, perR] = await Promise.all([
                axios.get(`${PHAR}/dashboard/summary${q}`),
                axios.get(`${PHAR}/dashboard/by-zone${q}`),
                axios.get(`${PHAR}/dashboard/by-tier${q}`),
                axios.get(`${PHAR}/dashboard/by-sm${q}`),
                axios.get(`${PHAR}/dashboard/by-sr${q}`),
                axios.get(`${PHAR}/dashboard/by-shop${q}`),
                axios.get(`${PHAR}/dashboard/monthly-trend`),
                axios.get(`${PHAR}/dashboard/commission-summary${q}`),
                axios.get(`${PHAR}/dashboard/periods`),
            ]);
            setSummary(sumR.data);
            setByZone(zonesR.data);
            setByTier(tierR.data);
            setBySM(smR.data);
            // srR.data available if needed for future SR chart
            setByShop(shopR.data);
            setMonthlyTrend(trendR.data);
            setCommission(commR.data);
            setPeriods(perR.data);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { load(period); }, [period]);

    const tooltip = { contentStyle: { background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'white' }, labelStyle: { color: 'rgba(255,255,255,0.7)' } };

    return (
        <div style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'white' }}>Sales Dashboard</h1>
                    <p style={{ margin: '0.25rem 0 0', color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>Pharmaceutical Sales Analytics</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <select
                            value={period} onChange={e => setPeriod(e.target.value)}
                            style={{
                                appearance: 'none', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                                color: 'white', padding: '0.6rem 2.5rem 0.6rem 1rem', borderRadius: 10, fontSize: '0.875rem', cursor: 'pointer', outline: 'none'
                            }}
                        >
                            <option value="" style={{ background: '#1e293b' }}>All Periods</option>
                            {periods.map(p => <option key={p} value={p} style={{ background: '#1e293b' }}>{p}</option>)}
                        </select>
                        <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }} />
                    </div>
                    <button onClick={() => load(period)} style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 10, padding: '0.6rem 1rem', color: '#60a5fa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', fontWeight: 600 }}>
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '5rem', color: 'rgba(255,255,255,0.4)' }}>Loading analytics...</div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        <KpiCard icon={TrendingUp} label="Total Sales" value={fmtBDT(summary?.totalSales || 0)} color="#3b82f6" sub="Gross Revenue" />
                        <KpiCard icon={Award} label="Total Commission" value={fmtBDT(summary?.totalCommission || 0)} color="#10b981" sub="Earned by shops" />
                        <KpiCard icon={ShoppingBag} label="Active Shops" value={fmt(summary?.activeShops || 0)} color="#f59e0b" sub="Unique shops with sales" />
                        <KpiCard icon={Users} label="Active SRs" value={fmt(summary?.activeSRs || 0)} color="#8b5cf6" sub="Sales Representatives" />
                    </div>

                    {/* Monthly Trend + Tier Pie */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <ChartCard title="Monthly Sales Trend">
                            <ResponsiveContainer width="100%" height={240}>
                                <LineChart data={monthlyTrend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
                                    <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} tickFormatter={v => '৳' + fmt(v)} />
                                    <Tooltip {...tooltip} formatter={(v: any) => fmtBDT(v)} />
                                    <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        <ChartCard title="Sales by Tier">
                            <ResponsiveContainer width="100%" height={240}>
                                <PieChart>
                                    <Pie data={byTier} dataKey="sales" nameKey="tier" cx="50%" cy="50%" outerRadius={90} label={(props: any) => `${props.tier} ${((props.percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                                        {byTier.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip {...tooltip} formatter={(v: any) => fmtBDT(v)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>

                    {/* Zone + SM Charts */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <ChartCard title="Sales by Zone">
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={byZone} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} tickFormatter={v => '৳' + fmt(v)} />
                                    <YAxis type="category" dataKey="zone" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} width={90} />
                                    <Tooltip {...tooltip} formatter={(v: any) => fmtBDT(v)} />
                                    <Bar dataKey="sales" fill="#3b82f6" radius={[0, 6, 6, 0]}>
                                        {byZone.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        <ChartCard title="Sales by Sales Manager">
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={bySM} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} tickFormatter={v => '৳' + fmt(v)} />
                                    <YAxis type="category" dataKey="salesManager" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} width={100} />
                                    <Tooltip {...tooltip} formatter={(v: any) => fmtBDT(v)} />
                                    <Bar dataKey="sales" fill="#10b981" radius={[0, 6, 6, 0]}>
                                        {bySM.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>

                    {/* Top Shops bar chart */}
                    <ChartCard title="Top 10 Shops by Sales" style={{ marginBottom: '1rem' }}>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={byShop.slice(0, 10)}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="shop" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} tickFormatter={v => '৳' + fmt(v)} />
                                <Tooltip {...tooltip} formatter={(v: any) => fmtBDT(v)} />
                                <Bar dataKey="sales" radius={[6, 6, 0, 0]}>
                                    {byShop.slice(0, 10).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Commission Summary Table */}
                    <ChartCard title="Commission Summary by SR">
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                <thead>
                                    <tr>
                                        {['Sales Representative', 'Total Sales', 'Total Commission', 'Commission Rate'].map(h => (
                                            <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {commission.map((r: any, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                            <td style={{ padding: '0.75rem 1rem', color: 'white', fontWeight: 600 }}>{r.sr}</td>
                                            <td style={{ padding: '0.75rem 1rem', color: '#60a5fa' }}>{fmtBDT(r.totalSales)}</td>
                                            <td style={{ padding: '0.75rem 1rem', color: '#34d399' }}>{fmtBDT(r.totalCommission)}</td>
                                            <td style={{ padding: '0.75rem 1rem', color: 'rgba(255,255,255,0.5)' }}>
                                                {r.totalSales > 0 ? ((r.totalCommission / r.totalSales) * 100).toFixed(1) + '%' : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                    {commission.length === 0 && (
                                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.25)' }}>No data. Upload an Excel file to get started.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </ChartCard>
                </>
            )}
        </div>
    );
}
