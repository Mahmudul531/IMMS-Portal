import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/users/login`, {
        username,
        password
      });
      // Response returns the User entity map
      login(response.data);
      navigate('/dashboard');
    } catch (err: any) {
      if (!err.response) {
          // No response at all — network error or server is down
          setError('Unable to connect to the server. Please check your internet connection or try again later.');
      } else if (err.response?.data?.message) {
          setError(err.response.data.message);
      } else if (err.response && typeof err.response.data === 'string' && err.response.data.trim() !== '') {
          setError(err.response.data);
      } else {
          setError('Invalid username or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Welcome to IMMS</h2>
        
        {error && <div style={{color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.875rem', textAlign:'center'}}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required 
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required 
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}
            disabled={loading}
          >
            {loading && <span className="btn-spinner" />}
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
