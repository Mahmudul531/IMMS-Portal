import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Settings, Save, RotateCcw, CheckCircle, Info, Percent } from 'lucide-react';
import toast from 'react-hot-toast';

interface TierRate {
    tier: string;
    label: string;
    description: string;
    rate: number;
    color: string;
    minRate: number;
    maxRate: number;
}

const DEFAULT_TIERS: TierRate[] = [
    { tier: 'Tier 1', label: 'Premium Shops', description: 'High-volume flagship pharmacy outlets', rate: 8.0, color: '#10b981', minRate: 0, maxRate: 20 },
    { tier: 'Tier 2', label: 'Mid-Range Shops', description: 'Medium-volume pharmacy outlets', rate: 5.5, color: '#3b82f6', minRate: 0, maxRate: 20 },
    { tier: 'Tier 3', label: 'Standard Shops', description: 'General retail pharmacy outlets', rate: 3.0, color: '#f59e0b', minRate: 0, maxRate: 20 },
];

const STORAGE_KEY = 'phar_commission_rates';

export default function CommissionPreference() {
    const { isDark } = useTheme();
    const [tiers, setTiers] = useState<TierRate[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                return DEFAULT_TIERS.map((def, i) => ({ ...def, rate: parsed[i]?.rate ?? def.rate }));
            }
        } catch {}
        return DEFAULT_TIERS;
    });
    const [saved, setSaved] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(() => localStorage.getItem('phar_commission_saved_at'));

    const col = {
        bg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.88)',
        border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        text: isDark ? 'white' : '#0f172a',
        textSub: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.55)',
        textMuted: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)',
        label: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
        inputBg: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        inputBorder: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
        trackBg: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        shadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.06)',
        infoBg: isDark ? 'rgba(59,130,246,0.07)' : 'rgba(59,130,246,0.06)',
        infoBorder: isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.2)',
    };

    const updateRate = (idx: number, val: number) => {
        setTiers(prev => prev.map((t, i) => i === idx ? { ...t, rate: Math.min(t.maxRate, Math.max(t.minRate, val)) } : t));
        setSaved(false);
    };

    const handleSave = () => {
        const rates = tiers.map(t => ({ tier: t.tier, rate: t.rate }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rates));
        const now = new Date().toLocaleString('en-BD');
        localStorage.setItem('phar_commission_saved_at', now);
        setLastSaved(now);
        setSaved(true);
        toast.success('Commission rates saved successfully!');
        setTimeout(() => setSaved(false), 3000);
    };

    const handleReset = () => {
        setTiers(DEFAULT_TIERS);
        setSaved(false);
        toast('Commission rates reset to defaults', { icon: '↩' });
    };

    // Total commission preview
    const sampleSales = [500000, 300000, 200000];
    const totalCommission = tiers.reduce((sum, t, i) => sum + (sampleSales[i] * t.rate) / 100, 0);

    return (
        <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '0.5rem' }}>
                    <div style={{
                        width: 42, height: 42, borderRadius: 12,
                        background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 16px rgba(139,92,246,0.35)',
                    }}>
                        <Settings size={20} color="white" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: col.text }}>
                            Commission Preference
                        </h1>
                        <p style={{ margin: 0, color: col.textSub, fontSize: '0.875rem' }}>
                            Customize commission rates by shop tier
                        </p>
                    </div>
                </div>
                {lastSaved && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        <CheckCircle size={13} />
                        Last saved: {lastSaved}
                    </div>
                )}
            </div>

            {/* Info Box */}
            <div style={{
                background: col.infoBg, border: `1px solid ${col.infoBorder}`,
                borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem',
                display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
                <Info size={16} color="#60a5fa" style={{ marginTop: 2, flexShrink: 0 }} />
                <div style={{ fontSize: '0.82rem', color: isDark ? '#93c5fd' : '#1d4ed8', lineHeight: 1.6 }}>
                    Commission rates are applied to each shop's total sales based on their tier classification.
                    Changes take effect on the next commission calculation. Tier 1 shops receive the highest rates as incentive.
                </div>
            </div>

            {/* Tier Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
                {tiers.map((tier, idx) => (
                    <div key={tier.tier} style={{
                        background: col.bg, border: `1px solid ${col.border}`,
                        borderRadius: 16, padding: '1.75rem',
                        boxShadow: col.shadow,
                        borderTop: `3px solid ${tier.color}`,
                        transition: 'all 0.3s',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <span style={{
                                        display: 'inline-block', padding: '2px 10px', borderRadius: 20,
                                        background: `${tier.color}22`, color: tier.color,
                                        fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase',
                                    }}>{tier.tier}</span>
                                </div>
                                <div style={{ fontWeight: 700, fontSize: '1rem', color: col.text }}>{tier.label}</div>
                                <div style={{ color: col.textMuted, fontSize: '0.8rem', marginTop: 2 }}>{tier.description}</div>
                            </div>

                            {/* Rate Display */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                background: `${tier.color}15`, border: `1px solid ${tier.color}40`,
                                borderRadius: 12, padding: '0.75rem 1.25rem',
                            }}>
                                <Percent size={18} color={tier.color} />
                                <span style={{ fontSize: '2rem', fontWeight: 900, color: tier.color, lineHeight: 1 }}>
                                    {tier.rate.toFixed(1)}
                                </span>
                                <span style={{ color: col.textMuted, fontSize: '0.8rem', fontWeight: 600 }}>rate</span>
                            </div>
                        </div>

                        {/* Slider + Number Input */}
                        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.75rem', color: col.textMuted }}>0%</span>
                                    <span style={{ fontSize: '0.75rem', color: col.label, fontWeight: 600 }}>Commission Rate</span>
                                    <span style={{ fontSize: '0.75rem', color: col.textMuted }}>20%</span>
                                </div>
                                <div style={{ position: 'relative', height: 6 }}>
                                    {/* Track */}
                                    <div style={{
                                        position: 'absolute', inset: 0, borderRadius: 6,
                                        background: col.trackBg,
                                    }} />
                                    {/* Fill */}
                                    <div style={{
                                        position: 'absolute', left: 0, top: 0, bottom: 0,
                                        borderRadius: 6, background: tier.color,
                                        width: `${(tier.rate / 20) * 100}%`,
                                        transition: 'width 0.15s',
                                    }} />
                                    <input
                                        type="range" min={0} max={20} step={0.1}
                                        value={tier.rate}
                                        onChange={e => updateRate(idx, parseFloat(e.target.value))}
                                        style={{
                                            position: 'absolute', inset: 0, width: '100%', opacity: 0,
                                            cursor: 'pointer', height: '100%', margin: 0,
                                        }}
                                    />
                                </div>
                                <input
                                    type="range" min={0} max={20} step={0.1}
                                    value={tier.rate}
                                    onChange={e => updateRate(idx, parseFloat(e.target.value))}
                                    style={{
                                        width: '100%', marginTop: '0.75rem', accentColor: tier.color,
                                        cursor: 'pointer',
                                    }}
                                />
                            </div>

                            {/* Number input */}
                            <div style={{ flexShrink: 0 }}>
                                <div style={{ fontSize: '0.7rem', color: col.textMuted, marginBottom: '0.25rem', textAlign: 'center' }}>
                                    Manual
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="number" min={0} max={20} step={0.1}
                                        value={tier.rate}
                                        onChange={e => updateRate(idx, parseFloat(e.target.value) || 0)}
                                        style={{
                                            width: 80, textAlign: 'center',
                                            background: col.inputBg, border: `1px solid ${col.inputBorder}`,
                                            color: col.text, borderRadius: 10, padding: '0.5rem 0.5rem 0.5rem 0.5rem',
                                            fontSize: '0.95rem', fontWeight: 700, outline: 'none',
                                        }}
                                    />
                                    <span style={{
                                        position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                                        color: tier.color, fontWeight: 700, fontSize: '0.8rem', pointerEvents: 'none',
                                    }}>%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Preview Card */}
            <div style={{
                background: col.bg, border: `1px solid ${col.border}`,
                borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem',
                boxShadow: col.shadow,
            }}>
                <h3 style={{ margin: '0 0 1rem', color: col.text, fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Sample Commission Preview
                </h3>
                <p style={{ margin: '0 0 1rem', color: col.textMuted, fontSize: '0.8rem' }}>
                    Based on sample monthly sales: Tier 1 = ৳5L, Tier 2 = ৳3L, Tier 3 = ৳2L
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
                    {tiers.map((t, i) => (
                        <div key={t.tier} style={{
                            background: `${t.color}10`, border: `1px solid ${t.color}30`,
                            borderRadius: 12, padding: '0.875rem 1rem',
                        }}>
                            <div style={{ color: t.color, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                                {t.tier}
                            </div>
                            <div style={{ color: col.text, fontWeight: 800, fontSize: '1.1rem' }}>
                                ৳{((sampleSales[i] * t.rate) / 100).toLocaleString('en-BD', { maximumFractionDigits: 0 })}
                            </div>
                            <div style={{ color: col.textMuted, fontSize: '0.72rem', marginTop: 2 }}>
                                {t.rate}% of ৳{(sampleSales[i] / 100000).toFixed(1)}L
                            </div>
                        </div>
                    ))}
                    <div style={{
                        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                        border: `1px solid ${col.border}`,
                        borderRadius: 12, padding: '0.875rem 1rem',
                    }}>
                        <div style={{ color: col.textMuted, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                            Total
                        </div>
                        <div style={{ color: '#10b981', fontWeight: 800, fontSize: '1.1rem' }}>
                            ৳{totalCommission.toLocaleString('en-BD', { maximumFractionDigits: 0 })}
                        </div>
                        <div style={{ color: col.textMuted, fontSize: '0.72rem', marginTop: 2 }}>Combined commission</div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.875rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button onClick={handleReset} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '0.75rem 1.5rem', borderRadius: 10, border: `1px solid ${col.inputBorder}`,
                    background: 'transparent', color: col.textSub,
                    fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                }}>
                    <RotateCcw size={15} /> Reset Defaults
                </button>
                <button onClick={handleSave} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '0.75rem 1.75rem', borderRadius: 10, border: 'none',
                    background: saved ? '#10b981' : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                    color: 'white', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
                    boxShadow: saved ? '0 4px 16px rgba(16,185,129,0.35)' : '0 4px 16px rgba(139,92,246,0.35)',
                    transition: 'all 0.3s',
                }}>
                    {saved ? <><CheckCircle size={15} /> Saved!</> : <><Save size={15} /> Save Rates</>}
                </button>
            </div>
        </div>
    );
}
