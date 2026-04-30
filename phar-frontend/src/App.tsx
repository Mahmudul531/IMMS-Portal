import './index.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { PharAuthProvider, usePharAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UploadFile from './pages/UploadFile';
import CommissionPreference from './pages/CommissionPreference';
import PortfolioMonitoring from './pages/PortfolioMonitoring';
import Sidebar from './components/Sidebar';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user } = usePharAuth();
    return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppLayout = ({ children }: { children: React.ReactNode }) => {
    const { isDark } = useTheme();
    return (
        <div style={{
            display: 'flex', minHeight: '100vh',
            background: isDark
                ? 'linear-gradient(135deg, #0f172a 0%, #1a2744 100%)'
                : 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%)',
            fontFamily: "'Inter', -apple-system, sans-serif",
            transition: 'background 0.3s ease',
        }}>
            <Sidebar />
            <div style={{ flex: 1, overflowY: 'auto' }}>{children}</div>
        </div>
    );
};

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><AppLayout><UploadFile /></AppLayout></ProtectedRoute>} />
            <Route path="/commission-preference" element={<ProtectedRoute><AppLayout><CommissionPreference /></AppLayout></ProtectedRoute>} />
            <Route path="/portfolio" element={<ProtectedRoute><AppLayout><PortfolioMonitoring /></AppLayout></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <PharAuthProvider>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: '#1e293b',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.1)',
                        }
                    }}
                />
                <Router>
                    <AppRoutes />
                </Router>
            </PharAuthProvider>
        </ThemeProvider>
    );
}
