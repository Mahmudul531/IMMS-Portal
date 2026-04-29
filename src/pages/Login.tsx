import { useState } from 'react';
import axios from 'axios';
import { usePharAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Pill, Lock, User, AlertCircle, Loader2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function Login() {
    const { login } = usePharAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${API}/phar/api/auth/login`, { username, password });
            login(res.data);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f4c75 100%)',
            fontFamily: "'Inter', sans-serif"
        }}>
            {/* Animated background orbs */}
            <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'rgba(59,130,246,0.08)', top: -200, right: -200, filter: 'blur(80px)' }} />
                <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'rgba(16,185,129,0.06)', bottom: -100, left: -100, filter: 'blur(60px)' }} />
            </div>

            <div style={{
                background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24,
                padding: '3rem 2.5rem', width: '100%', maxWidth: 420,
                boxShadow: '0 32px 64px rgba(0,0,0,0.4)', position: 'relative'
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 72, height: 72, borderRadius: 20, marginBottom: '1rem',
                        background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                        boxShadow: '0 8px 32px rgba(59,130,246,0.4)'
                    }}>
                        <Pill size={36} color="white" />
                    </div>
                    <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>
                        PharmaMetrics
                    </h1>
                    <p style={{ margin: '0.4rem 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                        Sales Intelligence Dashboard
                    </p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.5rem',
                        display: 'flex', alignItems: 'center', gap: 8, color: '#fca5a5', fontSize: '0.875rem'
                    }}>
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Username
                        </label>
                        <div style={{ position: 'relative' }}>
                            <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                            <input
                                value={username} onChange={e => setUsername(e.target.value)}
                                required placeholder="Enter username"
                                style={{
                                    width: '100%', boxSizing: 'border-box', paddingLeft: 42, paddingRight: 14,
                                    paddingTop: 12, paddingBottom: 12, borderRadius: 12,
                                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                                    color: 'white', fontSize: '0.95rem', outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.6)'}
                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                            <input
                                type="password" value={password} onChange={e => setPassword(e.target.value)}
                                required placeholder="Enter password"
                                style={{
                                    width: '100%', boxSizing: 'border-box', paddingLeft: 42, paddingRight: 14,
                                    paddingTop: 12, paddingBottom: 12, borderRadius: 12,
                                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                                    color: 'white', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s'
                                }}
                                onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.6)'}
                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                            />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} style={{
                        width: '100%', padding: '0.9rem', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                        background: loading ? 'rgba(59,130,246,0.4)' : 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                        color: 'white', fontSize: '1rem', fontWeight: 700, letterSpacing: '0.3px',
                        boxShadow: loading ? 'none' : '0 4px 24px rgba(59,130,246,0.4)',
                        transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                    }}>
                        {loading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Signing in...</> : 'Sign In'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem' }}>
                    © 2024 PharmaMetrics · Sales Intelligence
                </p>
            </div>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
