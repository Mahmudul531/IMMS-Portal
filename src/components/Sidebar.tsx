import { NavLink } from 'react-router-dom';
import { usePharAuth } from '../context/AuthContext';
import { LayoutDashboard, Upload, LogOut, Pill } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Sidebar() {
    const { user, logout } = usePharAuth();
    const navigate = useNavigate();

    const navStyle = ({ isActive }: { isActive: boolean }) => ({
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0.75rem 1rem', borderRadius: 10, textDecoration: 'none',
        fontSize: '0.9rem', fontWeight: 600, transition: 'all 0.2s',
        background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
        color: isActive ? '#93c5fd' : 'rgba(255,255,255,0.5)',
        borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
    });

    return (
        <div style={{
            width: 240, minHeight: '100vh', flexShrink: 0,
            background: 'rgba(255,255,255,0.03)', borderRight: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', flexDirection: 'column', padding: '1.5rem 1rem'
        }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2.5rem', padding: '0 0.5rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Pill size={20} color="white" />
                </div>
                <div>
                    <div style={{ color: 'white', fontWeight: 800, fontSize: '0.95rem', lineHeight: 1 }}>PharmaMetrics</div>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>Sales Intelligence</div>
                </div>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                <NavLink to="/dashboard" style={navStyle}>
                    <LayoutDashboard size={18} /> Dashboard
                </NavLink>
                <NavLink to="/upload" style={navStyle}>
                    <Upload size={18} /> Upload File
                </NavLink>
            </nav>

            {/* User */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem', marginTop: '1rem' }}>
                <div style={{ padding: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>{user?.fullName || user?.username}</div>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem' }}>{user?.role}</div>
                </div>
                <button onClick={() => { logout(); navigate('/login'); }} style={{
                    width: '100%', padding: '0.6rem 1rem', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: 'rgba(239,68,68,0.1)', color: '#fca5a5', fontSize: '0.85rem', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s'
                }}>
                    <LogOut size={16} /> Sign Out
                </button>
            </div>
        </div>
    );
}
