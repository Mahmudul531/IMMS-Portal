import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { PharAuthProvider, usePharAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UploadFile from './pages/UploadFile';
import Sidebar from './components/Sidebar';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user } = usePharAuth();
    return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppLayout = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1a2744 100%)', fontFamily: "'Inter', -apple-system, sans-serif" }}>
        <Sidebar />
        <div style={{ flex: 1, overflowY: 'auto' }}>{children}</div>
    </div>
);

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><AppLayout><UploadFile /></AppLayout></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <PharAuthProvider>
            <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: 'white', border: '1px solid rgba(255,255,255,0.1)' } }} />
            <Router>
                <AppRoutes />
            </Router>
        </PharAuthProvider>
    );
}

export default App;
