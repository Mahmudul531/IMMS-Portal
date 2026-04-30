import { useTheme } from '../context/ThemeContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, LabelList
} from 'recharts';

/* ── Shared helpers ── */
const tooltip = {
    contentStyle: { background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'white' },
    labelStyle: { color: 'rgba(255,255,255,0.7)' },
};

/* ── Section title banner (dark-blue like Excel) ── */
const SectionBanner = ({ title }: { title: string }) => (
    <div style={{
        background: 'linear-gradient(90deg,#1e3a8a,#1d4ed8)',
        color: 'white', fontWeight: 800, fontSize: '1rem',
        padding: '0.65rem 1.5rem', borderRadius: 10, marginBottom: '1.25rem',
        letterSpacing: '0.3px', textAlign: 'center',
        boxShadow: '0 4px 16px rgba(29,78,216,0.3)',
    }}>{title}</div>
);

const Card = ({ children, style = {}, isDark }: any) => (
    <div style={{
        background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.88)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        borderRadius: 16, padding: '1.25rem',
        boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.06)',
        ...style,
    }}>{children}</div>
);

const CardTitle = ({ title, isDark }: { title: string; isDark: boolean }) => (
    <div style={{
        fontWeight: 800, fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '0.5px',
        color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
        marginBottom: '1rem',
    }}>{title}</div>
);

/* ── SVG Donut Ring ── */
const DonutGauge = ({ pct, name, color = '#1d4ed8', size = 110, isDark }: { pct: number; name: string; color?: string; size?: number; isDark: boolean }) => {
    const r = (size - 16) / 2;
    const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;
    const textColor = isDark ? 'white' : '#0f172a';
    const trackColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={10} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none"
                    stroke={color} strokeWidth={10}
                    strokeDasharray={`${dash} ${circ - dash}`}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
                    fill={textColor} fontSize={size < 90 ? 13 : 15} fontWeight="800">
                    {pct}%
                </text>
            </svg>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)', textAlign: 'center', maxWidth: size }}>
                {name}
            </div>
        </div>
    );
};

/* ── SVG Semi-Circular (half-donut) Gauge ── */
const SemiGauge = ({ pct, region, isDark }: { pct: number; region: string; isDark: boolean }) => {
    const W = 130, H = 75;
    const cx = W / 2, cy = H - 4;
    const r = 56;
    // semi circle: from 180° to 0°  (left → right)
    const startAngle = Math.PI;          // 180°
    const endAngle = 0;                  // 0°
    const angle = startAngle - (pct / 100) * Math.PI;

    const polarX = (a: number) => cx + r * Math.cos(a);
    const polarY = (a: number) => cy - r * Math.sin(a);    // SVG y flipped

    const pathTrack = `M ${polarX(startAngle)} ${polarY(startAngle)} A ${r} ${r} 0 0 1 ${polarX(endAngle)} ${polarY(endAngle)}`;
    const pathFill = `M ${polarX(startAngle)} ${polarY(startAngle)} A ${r} ${r} 0 0 1 ${polarX(angle)} ${polarY(angle)}`;

    // Color by achievement
    const color = pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#b45309';
    const trackColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    const textColor = isDark ? 'white' : '#0f172a';
    const subColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
                {/* Track */}
                <path d={pathTrack} fill="none" stroke={trackColor} strokeWidth={11} strokeLinecap="round" />
                {/* Fill */}
                <path d={pathFill} fill="none" stroke={color} strokeWidth={11} strokeLinecap="round" />
                {/* Pct text */}
                <text x={cx} y={cy - 10} textAnchor="middle" fill={textColor} fontSize="15" fontWeight="900">{pct}%</text>
            </svg>
            <div style={{ fontSize: '0.73rem', fontWeight: 700, color: subColor, textAlign: 'center' }}>{region}</div>
        </div>
    );
};

/* ── DATA ── */
const unitACHData = [
    { name: 'Afroza Akter', ach: 56 },
    { name: 'Dr. Alamgir\nMahfuz Abir', ach: 45 },
    { name: 'Dr. Aminul\nIslam', ach: 41 },
    { name: 'Dr. Prabal\nChakraborty', ach: 62 },
    { name: 'Dr. Rezwan', ach: 67 },
    { name: 'Dr.\nRoniuzzaman', ach: 50 },
    { name: 'Dr. Saifullah', ach: 183 },
    { name: 'Dr. Tumpa\nUkil', ach: 56 },
    { name: 'Humaira Afrin', ach: 58 },
    { name: 'Mehdi Hasan', ach: 79 },
    { name: 'Syed Riyad\nJahan', ach: 60 },
    { name: 'National', ach: 61 },
];

const supervisorACHData = [
    { name: 'Syed Riyad Jahan', ach: 109.89 },
    { name: 'Md. Rubaiat Nurul Hasan', ach: 106.01 },
    { name: 'Mridul Kabiraz', ach: 103.35 },
    { name: 'Md. Arifuzzaman', ach: 103.82 },
];

const portfolioHeadData = [
    { name: 'Md. Arifuzzaman', ach: 105.34 },
    { name: 'Md. Rubaiat\nNurul Hasan', ach: 106.01 },
];

const individualDonuts = [
    { name: 'Afroza Akter', pct: 97, color: '#3b82f6' },
    { name: 'Dr. Alamgir', pct: 119, color: '#10b981' },
    { name: 'Dr. Aminul', pct: 94, color: '#f59e0b' },
    { name: 'Dr. Prabal', pct: 103, color: '#8b5cf6' },
    { name: 'Mehdi', pct: 101, color: '#06b6d4' },
    { name: 'Syed Riyad', pct: 115, color: '#10b981' },
    { name: 'Dr. Rezwan', pct: 105, color: '#3b82f6' },
    { name: 'Dr.\nRoniuzzaman', pct: 103, color: '#f59e0b' },
    { name: 'Dr. Saifullah', pct: 177, color: '#ef4444' },
    { name: 'Dr. Tumpa', pct: 112, color: '#8b5cf6' },
    { name: 'Humaira', pct: 104, color: '#06b6d4' },
];

const sbuData = [
    { name: 'P', cumSale: 6.66, target: 13.54 },
    { name: 'AD', cumSale: 6.35, target: 11.51 },
    { name: 'PF', cumSale: 9.00, target: 13.56 },
];

const regions = [
    { name: 'B. Baria', pct: 42.39 },
    { name: 'Barishal', pct: 62.84 },
    { name: 'Bogra', pct: 48.78 },
    { name: 'Chattogra', pct: 78.27 },
    { name: 'Cumilla', pct: 44.90 },
    { name: 'Dhaka', pct: 53.30 },
    { name: 'Khulna', pct: 63.65 },
    { name: 'Mymensingh', pct: 41.35 },
    { name: 'Pabna', pct: 81.87 },
    { name: 'Rajshah', pct: 49.08 },
    { name: 'Rangpu', pct: 57.23 },
    { name: 'Tangail', pct: 70.11 },
];

/* ── National Bubble Overlap Chart (SVG) ── */
const NationalBubble = ({ isDark }: { isDark: boolean }) => {

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <svg width={160} height={130} viewBox="0 0 160 130">
                {/* AD - center large */}
                <circle cx={80} cy={65} r={48} fill="#1d4ed8" opacity={0.9} />
                {/* P - top-left overlap */}
                <circle cx={50} cy={45} r={38} fill="#1e40af" opacity={0.85} />
                {/* PF - right overlap */}
                <circle cx={110} cy={75} r={34} fill="#2563eb" opacity={0.8} />
                {/* Labels */}
                <text x={44} y={42} textAnchor="middle" fill="white" fontSize="10" fontWeight="800">P</text>
                <text x={44} y={55} textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="9">57.02%</text>
                <text x={80} y={62} textAnchor="middle" fill="white" fontSize="10" fontWeight="800">AD</text>
                <text x={80} y={74} textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="9">55.20%</text>
                <text x={112} y={72} textAnchor="middle" fill="white" fontSize="10" fontWeight="800">PF</text>
                <text x={112} y={84} textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="9">66.41%</text>
            </svg>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                National Ach%
            </div>
        </div>
    );
};

/* ── Custom bar label ── */
const renderBarLabel = (props: any) => {
    const { x, y, width, value } = props;
    return (
        <text x={x + width / 2} y={y - 5} fill="rgba(255,255,255,0.75)" fontSize={11} fontWeight={700} textAnchor="middle">
            {value}%
        </text>
    );
};

const renderHBarLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    return (
        <text x={x + width + 6} y={y + height / 2 + 4} fill="rgba(255,255,255,0.75)" fontSize={11} fontWeight={700}>
            {value}%
        </text>
    );
};

/* ══════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════ */
export default function PortfolioMonitoring() {
    const { isDark } = useTheme();
    const tickFill = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
    const gridStroke = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)';
    const textPrimary = isDark ? 'white' : '#0f172a';
    const textSub = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';

    return (
        <div style={{ padding: '1.75rem', maxWidth: 1400, margin: '0 auto' }}>

            {/* ── Page Title ── */}
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: textPrimary }}>
                    Portfolio Monitoring &amp; Performance Dashboard
                </h1>
                <p style={{ margin: '0.35rem 0 0', color: textSub, fontSize: '0.85rem' }}>
                    ACH Achievement Tracking · Sales Intelligence
                </p>
            </div>

            {/* ══ ROW 1: Info Metrics + Unit ACH ══ */}
            <Card isDark={isDark} style={{ marginBottom: '1.25rem' }}>
                <SectionBanner title="Unit ACH Monitoring" />

                {/* Working day info */}
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    {[
                        { label: 'Total Working Day', value: '26' },
                        { label: 'Working day passed', value: '26' },
                        { label: 'Days Covered', value: '100.00%' },
                    ].map(m => (
                        <div key={m.label} style={{
                            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                            borderRadius: 10, padding: '0.6rem 1.1rem',
                        }}>
                            <div style={{ fontSize: '0.7rem', color: textSub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{m.label}</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: textPrimary, marginTop: 2 }}>{m.value}</div>
                        </div>
                    ))}
                </div>

                <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={unitACHData} barSize={34}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis dataKey="name" tick={{ fill: tickFill, fontSize: 10 }} interval={0} />
                        <YAxis tick={{ fill: tickFill, fontSize: 11 }} domain={[0, 200]} tickFormatter={v => `${v}%`} />
                        <Tooltip {...tooltip} formatter={(v: any) => `${v}%`} />
                        <Bar dataKey="ach" radius={[6, 6, 0, 0]}>
                            {unitACHData.map((d, i) => (
                                <Cell key={i} fill={d.name === 'National' ? '#0d9488' : d.ach > 100 ? '#ef4444' : '#1d4ed8'} />
                            ))}
                            <LabelList dataKey="ach" content={renderBarLabel} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </Card>

            {/* ══ ROW 2: Supervisor ACH + Portfolio Head ACH ══ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                {/* Supervisor ACH */}
                <Card isDark={isDark}>
                    <CardTitle title="Supervisor ACH (%)" isDark={isDark} />
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={supervisorACHData} layout="vertical" barSize={22}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                            <XAxis type="number" domain={[95, 115]} tick={{ fill: tickFill, fontSize: 11 }} tickFormatter={v => `${v}%`} />
                            <YAxis type="category" dataKey="name" tick={{ fill: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)', fontSize: 11 }} width={145} />
                            <Tooltip {...tooltip} formatter={(v: any) => `${v}%`} />
                            <Bar dataKey="ach" fill="#1d4ed8" radius={[0, 6, 6, 0]}>
                                <LabelList dataKey="ach" content={renderHBarLabel} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </Card>

                {/* Portfolio Head ACH */}
                <Card isDark={isDark}>
                    <CardTitle title="Portfolio Head ACH%" isDark={isDark} />
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={portfolioHeadData} barSize={50}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                            <XAxis dataKey="name" tick={{ fill: tickFill, fontSize: 11 }} />
                            <YAxis domain={[100, 110]} tick={{ fill: tickFill, fontSize: 11 }} tickFormatter={v => `${v}%`} />
                            <Tooltip {...tooltip} formatter={(v: any) => `${v}%`} />
                            <Bar dataKey="ach" radius={[6, 6, 0, 0]}>
                                {portfolioHeadData.map((_, i) => (
                                    <Cell key={i} fill={i === 0 ? '#1d4ed8' : '#dc2626'} />
                                ))}
                                <LabelList dataKey="ach" content={renderBarLabel} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            {/* ══ ROW 3: Individual Donut Gauges ══ */}
            <Card isDark={isDark} style={{ marginBottom: '1.25rem' }}>
                <CardTitle title="Individual ACH% — Sales Doctors" isDark={isDark} />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', justifyContent: 'center' }}>
                    {individualDonuts.map(d => (
                        <DonutGauge key={d.name} pct={d.pct} name={d.name} color={d.color} isDark={isDark} />
                    ))}
                </div>
            </Card>

            {/* ══ ROW 4: Day Covered + National Ach% + SBU Chart ══ */}
            <div style={{ display: 'grid', gridTemplateColumns: '140px 180px 1fr', gap: '1.25rem', marginBottom: '1.25rem', alignItems: 'start' }}>
                {/* Day Covered donut */}
                <Card isDark={isDark} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.25rem 0.75rem' }}>
                    <DonutGauge pct={65.38} name="Day Covered" color="#1d4ed8" size={120} isDark={isDark} />
                </Card>

                {/* National Ach% overlapping bubbles */}
                <Card isDark={isDark} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem 0.5rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.78rem', color: textSub, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        National Ach%
                    </div>
                    <NationalBubble isDark={isDark} />
                </Card>

                {/* SBU Wise Target & Sales */}
                <Card isDark={isDark}>
                    <CardTitle title="SBU Wise Target & Sales (Cr.)" isDark={isDark} />
                    <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={sbuData} layout="vertical" barSize={18} barCategoryGap="35%">
                            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                            <XAxis type="number" tick={{ fill: tickFill, fontSize: 11 }} domain={[0, 15]} />
                            <YAxis type="category" dataKey="name" tick={{ fill: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)', fontSize: 12 }} width={30} />
                            <Tooltip {...tooltip} formatter={(v: any) => `${v} Cr.`} />
                            <Bar dataKey="cumSale" name="Cumulative Sale" fill="#dc2626" radius={[0, 6, 6, 0]}>
                                <LabelList dataKey="cumSale" position="right" style={{ fill: tickFill, fontSize: 10 }} formatter={(v: any) => `${v}`} />
                            </Bar>
                            <Bar dataKey="target" name="Target" fill="#1d4ed8" radius={[0, 6, 6, 0]}>
                                <LabelList dataKey="target" position="right" style={{ fill: tickFill, fontSize: 10 }} formatter={(v: any) => `${v}`} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    {/* Legend */}
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                        {[{ color: '#dc2626', label: 'Cumulative Sale' }, { color: '#1d4ed8', label: 'Target' }].map(l => (
                            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: textSub }}>
                                <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                                {l.label}
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* ══ ROW 5: Regional Semi-Circular Gauges ══ */}
            <Card isDark={isDark}>
                <CardTitle title="Regional Achievement % — Semi-Circular Gauges" isDark={isDark} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.75rem' }}>
                    {regions.map(r => (
                        <div key={r.name} style={{
                            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}`,
                            borderRadius: 12, padding: '0.75rem 0.5rem',
                            display: 'flex', justifyContent: 'center',
                        }}>
                            <SemiGauge pct={r.pct} region={r.name} isDark={isDark} />
                        </div>
                    ))}
                </div>
            </Card>

        </div>
    );
}
