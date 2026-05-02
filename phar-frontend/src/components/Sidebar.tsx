import { NavLink, useNavigate } from 'react-router-dom';
import { usePharAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
    LayoutDashboard, Upload, LogOut, Pill, ChevronDown, ChevronRight,
    Settings, BarChart3, Sun, Moon, TrendingUp, Activity
} from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
    const { user, logout } = usePharAuth();
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const [commissionOpen, setCommissionOpen] = useState(false);

    const s = {
        sidebar: {
            width: 248, minHeight: '100vh', flexShrink: 0,
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.88)',
            borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
            backdropFilter: 'blur(20px)',
            display: 'flex', flexDirection: 'column' as const, padding: '1.5rem 0.875rem',
            transition: 'background 0.3s ease, border-color 0.3s ease',
            boxShadow: isDark ? 'none' : '2px 0 16px rgba(0,0,0,0.06)',
        },
        logo: {
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: '2rem', padding: '0 0.5rem',
        },
        logoIcon: {
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(59,130,246,0.35)',
        },
        brandName: { color: isDark ? 'white' : '#0f172a', fontWeight: 800, fontSize: '0.95rem', lineHeight: 1 },
        brandSub: { color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)', fontSize: '0.68rem', marginTop: 2 },
        sectionLabel: {
            padding: '0.4rem 0.75rem 0.2rem',
            fontSize: '0.65rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' as const,
            color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)',
        },
        divider: {
            height: 1, margin: '0.75rem 0',
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
        },
    };

    const navStyle = ({ isActive }: { isActive: boolean }) => ({
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '0.65rem 0.875rem', borderRadius: 10, textDecoration: 'none',
        fontSize: '0.875rem', fontWeight: 600, transition: 'all 0.2s',
        background: isActive
            ? (isDark ? 'rgba(59,130,246,0.15)' : 'rgba(37,99,235,0.1)')
            : 'transparent',
        color: isActive
            ? (isDark ? '#93c5fd' : '#2563eb')
            : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.55)'),
        borderLeft: isActive
            ? `3px solid ${isDark ? '#3b82f6' : '#2563eb'}`
            : '3px solid transparent',
    });

    const subNavStyle = ({ isActive }: { isActive: boolean }) => ({
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '0.55rem 0.875rem 0.55rem 2.25rem', borderRadius: 10, textDecoration: 'none',
        fontSize: '0.82rem', fontWeight: 500, transition: 'all 0.2s',
        background: isActive
            ? (isDark ? 'rgba(59,130,246,0.12)' : 'rgba(37,99,235,0.08)')
            : 'transparent',
        color: isActive
            ? (isDark ? '#93c5fd' : '#2563eb')
            : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)'),
        borderLeft: isActive
            ? `2px solid ${isDark ? '#3b82f6' : '#2563eb'}`
            : '2px solid transparent',
        marginLeft: 8,
    });

    return (
        <div style={s.sidebar}>
            {/* Logo */}
            <div style={s.logo}>
                <div style={s.logoIcon}>
                    <Pill size={20} color="white" />
                </div>
                <div>
                    <div style={s.brandName}>PharmaMetrics</div>
                    <div style={s.brandSub}>Sales Intelligence</div>
                </div>
            </div>

            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="theme-toggle"
                style={{
                    marginBottom: '1.25rem', width: '100%', justifyContent: 'center',
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.6)',
                    padding: '0.5rem 1rem', borderRadius: 10, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 600,
                    transition: 'all 0.2s',
                }}
            >
                {isDark ? <Sun size={14} /> : <Moon size={14} />}
                {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>

            {/* Nav */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
                <div style={s.sectionLabel}>Main</div>

                <NavLink to="/dashboard" style={navStyle}>
                    <LayoutDashboard size={17} /> Dashboard
                </NavLink>

                <NavLink to="/portfolio" style={navStyle}>
                    <Activity size={17} /> Portfolio ACH
                </NavLink>

                <NavLink to="/upload" style={navStyle}>
                    <Upload size={17} /> Upload File
                </NavLink>

                <div style={s.divider} />
                <div style={s.sectionLabel}>Finance</div>

                {/* Commission Expandable Group */}
                <div>
                    <button
                        onClick={() => setCommissionOpen(o => !o)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 9, width: '100%',
                            padding: '0.65rem 0.875rem', borderRadius: 10, border: 'none', cursor: 'pointer',
                            fontSize: '0.875rem', fontWeight: 600, transition: 'all 0.2s',
                            background: commissionOpen
                                ? (isDark ? 'rgba(59,130,246,0.08)' : 'rgba(37,99,235,0.06)')
                                : 'transparent',
                            color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.55)',
                            borderLeft: '3px solid transparent',
                        }}
                    >
                        <TrendingUp size={17} />
                        <span style={{ flex: 1, textAlign: 'left' }}>Commission</span>
                        {commissionOpen
                            ? <ChevronDown size={14} style={{ opacity: 0.5 }} />
                            : <ChevronRight size={14} style={{ opacity: 0.5 }} />
                        }
                    </button>

                    {commissionOpen && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.15rem', animation: 'fadeIn 0.2s ease' }}>
                            <NavLink to="/dashboard" style={subNavStyle}>
                                <BarChart3 size={14} /> Commission Summary
                            </NavLink>
                            <NavLink to="/commission-preference" style={subNavStyle}>
                                <Settings size={14} /> Commission Preference
                            </NavLink>
                        </div>
                    )}
                </div>

                {/* Sign Out below Finance */}
                <div style={{ marginTop: '0.75rem' }}>
                    <button
                        onClick={() => { logout(); navigate('/login'); }}
                        style={{
                            width: '100%', padding: '0.6rem 0.875rem', borderRadius: 10, border: 'none', cursor: 'pointer',
                            background: 'rgba(239,68,68,0.08)', color: '#f87171',
                            fontSize: '0.82rem', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
                        }}
                    >
                        <LogOut size={15} /> Sign Out
                    </button>
                </div>
            </nav>

            {/* User Info strip at bottom */}
            <div style={{
                borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}`,
                paddingTop: '0.75rem', marginTop: '0.75rem',
                display: 'flex', alignItems: 'center', gap: 8, padding: '0.6rem 0.5rem',
            }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: 'white', fontSize: '0.7rem', fontWeight: 800 }}>{(user?.fullName || user?.username || '?')[0].toUpperCase()}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: isDark ? 'white' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.fullName || user?.username}</div>
                    <div style={{ fontSize: '0.62rem', color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)' }}>{user?.role}</div>
                </div>
            </div>
        </div>
    );
}
