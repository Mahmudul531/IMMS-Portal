import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  // Registration fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [nidOrPassport, setNidOrPassport] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${API}/api/users/login`, { username, password });
      login(response.data);
      navigate('/dashboard');
    } catch (err: any) {
      if (!err.response) {
        setError('Unable to connect to the server. Please check your internet connection or try again later.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (typeof err.response?.data === 'string' && err.response.data.trim() !== '') {
        setError(err.response.data);
      } else {
        setError('Invalid username or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRegSuccess(false);
    setLoading(true);
    try {
      await axios.post(`${API}/api/users/register`, {
        username,
        password,
        email,
        fullName,
        phone: phone || null,
        dob: dob || null,
        gender: gender || null,
        nidOrPassport: nidOrPassport || null,
        role: 'VENDOR',
      });
      setRegSuccess(true);
      // Reset all fields
      setUsername(''); setPassword(''); setEmail('');
      setFullName(''); setPhone(''); setDob('');
      setGender(''); setNidOrPassport('');
      setIsRegister(false);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchToRegister = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsRegister(true);
    setError('');
    setRegSuccess(false);
  };

  const switchToLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsRegister(false);
    setError('');
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: isRegister ? 520 : 400, width: '100%' }}>
        <h2 className="auth-title">{isRegister ? 'Vendor Registration' : 'Welcome to IMMS'}</h2>

        {error && (
          <div style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center', background: '#fff0f0', padding: '0.6rem', borderRadius: 8 }}>
            {error}
          </div>
        )}
        {regSuccess && (
          <div style={{ color: '#155724', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center', background: '#d4edda', padding: '0.75rem', borderRadius: 8, border: '1px solid #c3e6cb' }}>
            ✓ Registration successful! Please wait for Admin approval to login.
          </div>
        )}

        <form onSubmit={isRegister ? handleRegister : handleLogin}>

          {/* Registration-only: Full Name */}
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Full Name <span style={{ color: 'red' }}>*</span></label>
              <input
                type="text"
                className="form-input"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Mohammad Rahman"
                required
                disabled={loading}
              />
            </div>
          )}

          {/* Username */}
          <div className="form-group">
            <label className="form-label">Username <span style={{ color: 'red' }}>*</span></label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="username"
              required
              disabled={loading}
            />
          </div>

          {/* Registration-only: Email */}
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Email <span style={{ color: 'red' }}>*</span></label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          )}

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password <span style={{ color: 'red' }}>*</span></label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {/* Registration-only: extra personal info */}
          {isRegister && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+880..."
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dob}
                    onChange={e => setDob(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-input" value={gender} onChange={e => setGender(e.target.value)} disabled={loading}>
                    <option value="">Select...</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">NID / Passport No.</label>
                  <input
                    type="text"
                    className="form-input"
                    value={nidOrPassport}
                    onChange={e => setNidOrPassport(e.target.value)}
                    disabled={loading}
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Role locked banner */}
              <div style={{ background: '#fff8e1', border: '1px solid #ffcc02', borderRadius: 8, padding: '0.6rem 0.9rem', marginBottom: '1rem', fontSize: '0.82rem', color: '#7a5900', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1rem' }}>ℹ️</span>
                Registering as <strong>Vendor</strong>. Your account will be reviewed by an admin before activation.
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            disabled={loading}
          >
            {loading && <span className="btn-spinner" />}
            {loading
              ? (isRegister ? 'Registering...' : 'Signing in...')
              : (isRegister ? 'Complete Registration' : 'Login')}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          {isRegister ? (
            <span>Already have an account?{' '}
              <a href="#" style={{ color: 'var(--primary)', fontWeight: 600 }} onClick={switchToLogin}>Login here</a>
            </span>
          ) : (
            <span>Are you a Vendor?{' '}
              <a href="#" style={{ color: 'var(--primary)', fontWeight: 600 }} onClick={switchToRegister}>Register here</a>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
