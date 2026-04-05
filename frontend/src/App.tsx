import React, { type ReactElement } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import Assets from './pages/Assets';
import Users from './pages/Users';
import WorkOrders from './pages/WorkOrders';
import AssetTransfer from './pages/AssetTransfer';
import Reports from './pages/Reports';
import PropertyDetail from './pages/PropertyDetail';
import Sidebar from './components/Sidebar';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }: { children: ReactElement, allowedRoles?: string[] }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Layout Wrapper
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="content-wrapper">
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'ENGINEER', 'TECHNICIAN', 'VENDOR']}>
              <AppLayout><Dashboard /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/properties" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'ENGINEER']}>
              <AppLayout><Properties /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/properties/:id" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'ENGINEER', 'TECHNICIAN']}>
              <AppLayout><PropertyDetail /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/assets" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'ENGINEER', 'TECHNICIAN']}>
              <AppLayout><Assets /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/users" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AppLayout><Users /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/work-orders" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'VENDOR']}>
              <AppLayout><WorkOrders /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/asset-transfer" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'ENGINEER']}>
              <AppLayout><AssetTransfer /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'ENGINEER']}>
              <AppLayout><Reports /></AppLayout>
            </ProtectedRoute>
          } />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
