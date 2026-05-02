import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { TrendingUp, ShoppingBag, Users, Award, RefreshCw, ChevronDown, X, ArrowRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const PHAR = `${API}/phar/api`;
const COLORS = ['#3b82f6','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'];
const fmt = (n: number) => new Intl.NumberFormat('en-BD', { maximumFractionDigits: 0 }).format(n);
const fmtBDT = (n: number) => '৳' + fmt(n);

/* ── Scroll reveal hook ── */
function useReveal() {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = ref.current; if (!el) return;
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; obs.disconnect(); }
        }, { threshold: 0.08 });
        el.style.opacity = '0'; el.style.transform = 'translateY(32px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        obs.observe(el); return () => obs.disconnect();
    }, []);
    return ref;
}

/* ── Territory Donut ── */
const TerritoryDonut = ({ data, isDark }: { data: any[]; isDark: boolean }) => {
    const total = data.reduce((s, d) => s + (d.sales || 0), 0);
    const size = 160; const r = 58; const cx = size / 2; const cy = size / 2;
    const circ = 2 * Math.PI * r;
    let offset = 0;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={cx} cy={cy} r={r} fill="none" stroke={isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'} strokeWidth={14} />
                {data.map((d, i) => {
                    const pct = total > 0 ? d.sales / total : 0;
                    const dash = pct * circ; const gap = circ - dash;
                    const seg = <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                        stroke={COLORS[i % COLORS.length]} strokeWidth={14}
                        strokeDasharray={`${dash} ${gap}`}
                        strokeDashoffset={-offset}
                        transform={`rotate(-90 ${cx} ${cy})`} />;
                    offset += dash; return seg;
                })}
                <text x="50%" y="48%" textAnchor="middle" fill={isDark ? 'white' : '#0f172a'} fontSize="13" fontWeight="800">{fmtBDT(total)}</text>
                <text x="50%" y="62%" textAnchor="middle" fill={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'} fontSize="9">Total Territory</text>
            </svg>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', justifyContent: 'center', marginTop: '0.5rem' }}>
                {data.slice(0, 6).map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], display: 'inline-block' }} />
                        {d.zone}
                    </div>
                ))}
            </div>
        </div>
    );
};

const KpiCard = ({ icon: Icon, label, value, color, sub, isDark }: any) => {
    const ref = useReveal();
    return (
        <div ref={ref} style={{
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
            borderRadius: 16, padding: '1.5rem', position: 'relative', overflow: 'hidden',
            boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.06)',
        }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: color, opacity: 0.15 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '0.75rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={22} color="white" />
                </div>
                <span style={{ color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: isDark ? 'white' : '#0f172a', lineHeight: 1 }}>{value}</div>
            {sub && <div style={{ fontSize: '0.78rem', color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)', marginTop: '0.4rem' }}>{sub}</div>}
        </div>
    );
};

const ChartCard = ({ title, children, style = {}, isDark, action }: any) => {
    const ref = useReveal();
    return (
        <div ref={ref} style={{
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
            borderRadius: 16, padding: '1.5rem',
            boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.05)', ...style,
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)', fontSize: '0.95rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h3>
                {action}
            </div>
            {children}
        </div>
    );
};

/* ── Themed select style ── */
const selStyle = (isDark: boolean): React.CSSProperties => ({
    appearance: 'none',
    background: isDark ? 'rgba(255,255,255,0.06)' : '#ffffff',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)'}`,
    color: isDark ? 'white' : '#0f172a',
    padding: '0.6rem 2.5rem 0.6rem 1rem', borderRadius: 10,
    fontSize: '0.875rem', cursor: 'pointer', outline: 'none',
    boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.08)',
});

export default function Dashboard() {
    const { isDark } = useTheme();
    const [period, setPeriod] = useState('');
    const [zone, setZone] = useState('');
    const [periods, setPeriods] = useState<string[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [byZone, setByZone] = useState<any[]>([]);
    const [byTier, setByTier] = useState<any[]>([]);
    const [bySM, setBySM] = useState<any[]>([]);
    const [byShop, setByShop] = useState<any[]>([]);
    const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
    const [commission, setCommission] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAllShops, setShowAllShops] = useState(false);

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
            setSummary(sumR.data); setByZone(zonesR.data); setByTier(tierR.data);
            setBySM(smR.data); setByShop(shopR.data); setMonthlyTrend(trendR.data);
            setCommission(commR.data); setPeriods(perR.data);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { load(period); }, [period]);

    const zones = byZone.map(z => z.zone);
    const filteredShops = zone ? byShop.filter((s: any) => s.zone === zone) : byShop;
    const top10 = filteredShops.slice(0, 10);

    const tickFill = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
    const gridStroke = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    const tooltip = {
        contentStyle: { background: isDark ? '#1e293b' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderRadius: 10, color: isDark ? 'white' : '#0f172a' },
        labelStyle: { color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' },
    };

    const optBg = isDark ? '#1e293b' : '#ffffff';
    const optColor = isDark ? 'white' : '#0f172a';

    return (
        <div style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: isDark ? 'white' : '#0f172a' }}>Sales Dashboard</h1>
                    <p style={{ margin: '0.25rem 0 0', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)', fontSize: '0.875rem' }}>Pharmaceutical Sales Analytics</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Period */}
                    <div style={{ position: 'relative' }}>
                        <select value={period} onChange={e => setPeriod(e.target.value)} style={selStyle(isDark)}>
                            <option value="" style={{ background: optBg, color: optColor }}>All Periods</option>
                            {periods.map(p => <option key={p} value={p} style={{ background: optBg, color: optColor }}>{p}</option>)}
                        </select>
                        <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', pointerEvents: 'none' }} />
                    </div>
                    {/* Zone */}
                    <div style={{ position: 'relative' }}>
                        <select value={zone} onChange={e => setZone(e.target.value)} style={selStyle(isDark)}>
                            <option value="" style={{ background: optBg, color: optColor }}>All Zones</option>
                            {zones.map(z => <option key={z} value={z} style={{ background: optBg, color: optColor }}>{z}</option>)}
                        </select>
                        <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', pointerEvents: 'none' }} />
                    </div>
                    <button onClick={() => load(period)} style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 10, padding: '0.6rem 1rem', color: '#60a5fa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', fontWeight: 600 }}>
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '5rem', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>Loading analytics...</div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        <KpiCard isDark={isDark} icon={TrendingUp} label="Total Sales" value={fmtBDT(summary?.totalSales || 0)} color="#3b82f6" sub="Gross Revenue" />
                        <KpiCard isDark={isDark} icon={Award} label="Total Commission" value={fmtBDT(summary?.totalCommission || 0)} color="#10b981" sub="Earned by shops" />
                        <KpiCard isDark={isDark} icon={ShoppingBag} label="Active Shops" value={fmt(summary?.activeShops || 0)} color="#f59e0b" sub="Unique shops with sales" />
                        <KpiCard isDark={isDark} icon={Users} label="Active SRs" value={fmt(summary?.activeSRs || 0)} color="#8b5cf6" sub="Sales Representatives" />
                    </div>

                    {/* Monthly Trend + Tier Pie */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <ChartCard isDark={isDark} title="Monthly Sales Trend">
                            <ResponsiveContainer width="100%" height={240}>
                                <LineChart data={monthlyTrend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                                    <XAxis dataKey="month" tick={{ fill: tickFill, fontSize: 12 }} />
                                    <YAxis tick={{ fill: tickFill, fontSize: 12 }} tickFormatter={v => '৳' + fmt(v)} />
                                    <Tooltip {...tooltip} formatter={(v: any) => fmtBDT(v)} />
                                    <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartCard>
                        <ChartCard isDark={isDark} title="Sales by Tier">
                            <ResponsiveContainer width="100%" height={240}>
                                <PieChart>
                                    <Pie data={byTier} dataKey="sales" nameKey="tier" cx="50%" cy="50%" outerRadius={90}
                                        label={(props: any) => `${props.tier} ${((props.percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                                        {byTier.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip {...tooltip} formatter={(v: any) => fmtBDT(v)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>

                    {/* Zone + SM + Territory Donut */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 220px', gap: '1rem', marginBottom: '1rem' }}>
                        <ChartCard isDark={isDark} title="Sales by Zone">
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={byZone} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                                    <XAxis type="number" tick={{ fill: tickFill, fontSize: 11 }} tickFormatter={v => '৳' + fmt(v)} />
                                    <YAxis type="category" dataKey="zone" tick={{ fill: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', fontSize: 12 }} width={90} />
                                    <Tooltip {...tooltip} formatter={(v: any) => fmtBDT(v)} />
                                    <Bar dataKey="sales" fill="#3b82f6" radius={[0, 6, 6, 0]}>
                                        {byZone.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                        <ChartCard isDark={isDark} title="Sales by Sales Manager">
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={bySM} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                                    <XAxis type="number" tick={{ fill: tickFill, fontSize: 11 }} tickFormatter={v => '৳' + fmt(v)} />
                                    <YAxis type="category" dataKey="salesManager" tick={{ fill: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', fontSize: 12 }} width={100} />
                                    <Tooltip {...tooltip} formatter={(v: any) => fmtBDT(v)} />
                                    <Bar dataKey="sales" fill="#10b981" radius={[0, 6, 6, 0]}>
                                        {bySM.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                        {/* Territory Donut */}
                        <ChartCard isDark={isDark} title="Territory Sales">
                            <TerritoryDonut data={byZone} isDark={isDark} />
                        </ChartCard>
                    </div>

                    {/* Top Shops + All Shops Panel */}
                    <ChartCard isDark={isDark} title={`Top 10 Shops${zone ? ` — ${zone}` : ''}`} style={{ marginBottom: '1rem' }}
                        action={
                            <button onClick={() => setShowAllShops(v => !v)} style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                background: showAllShops ? 'rgba(59,130,246,0.2)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                                border: `1px solid ${showAllShops ? 'rgba(59,130,246,0.4)' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')}`,
                                color: showAllShops ? '#60a5fa' : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'),
                                borderRadius: 8, padding: '0.35rem 0.75rem', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                            }}>
                                {showAllShops ? <X size={13} /> : <ArrowRight size={13} />}
                                {showAllShops ? 'Close' : 'View All'}
                            </button>
                        }>
                        <div style={{ display: 'grid', gridTemplateColumns: showAllShops ? '1fr 1fr' : '1fr', gap: '1rem' }}>
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={top10}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                                    <XAxis dataKey="shop" tick={{ fill: tickFill, fontSize: 11 }} />
                                    <YAxis tick={{ fill: tickFill, fontSize: 11 }} tickFormatter={v => '৳' + fmt(v)} />
                                    <Tooltip {...tooltip} formatter={(v: any) => fmtBDT(v)} />
                                    <Bar dataKey="sales" radius={[6, 6, 0, 0]}>
                                        {top10.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                            {showAllShops && (
                                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                                        All Shops{zone ? ` in ${zone}` : ''}
                                    </div>
                                    {filteredShops.map((s: any, i: number) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}` }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], display: 'inline-block', flexShrink: 0 }} />
                                                <span style={{ fontSize: '0.82rem', color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)', fontWeight: 500 }}>{s.shop}</span>
                                            </div>
                                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#3b82f6' }}>{fmtBDT(s.sales)}</span>
                                        </div>
                                    ))}
                                    {filteredShops.length === 0 && <div style={{ textAlign: 'center', padding: '1rem', color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)', fontSize: '0.82rem' }}>No shops found</div>}
                                </div>
                            )}
                        </div>
                    </ChartCard>

                    {/* Commission Table */}
                    <ChartCard isDark={isDark} title="Commission Summary by SR">
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                <thead>
                                    <tr>
                                        {['Sales Representative', 'Total Sales', 'Total Commission', 'Commission Rate'].map(h => (
                                            <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}` }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {commission.map((r: any, i) => (
                                        <tr key={i} style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
                                            <td style={{ padding: '0.75rem 1rem', color: isDark ? 'white' : '#0f172a', fontWeight: 600 }}>{r.sr}</td>
                                            <td style={{ padding: '0.75rem 1rem', color: '#60a5fa' }}>{fmtBDT(r.totalSales)}</td>
                                            <td style={{ padding: '0.75rem 1rem', color: '#34d399' }}>{fmtBDT(r.totalCommission)}</td>
                                            <td style={{ padding: '0.75rem 1rem', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                                                {r.totalSales > 0 ? ((r.totalCommission / r.totalSales) * 100).toFixed(1) + '%' : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                    {commission.length === 0 && (
                                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)' }}>No data. Upload an Excel file to get started.</td></tr>
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
