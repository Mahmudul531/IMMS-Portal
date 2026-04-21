import React, { type ReactElement } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PropertyAdd from './pages/PropertyAdd';
import PropertyList from './pages/PropertyList';
import PropertySetup from './pages/PropertySetup';
import AssetAdd from './pages/AssetAdd';
import AssetList from './pages/AssetList';
import AssetSetup from './pages/AssetSetup';
import AssetTransfer from './pages/AssetTransfer';
import Reports from './pages/Reports';
import PropertyDetail from './pages/PropertyDetail';
import AssetDetail from './pages/AssetDetail';
import ProjectAdd from './pages/ProjectAdd';
import ProjectList from './pages/ProjectList';
import ProjectSetup from './pages/ProjectSetup';
import ProjectDetail from './pages/ProjectDetail';
import UserList from './pages/UserList';
import UserAdd from './pages/UserAdd';
import PermissionGroups from './pages/PermissionGroups';
import PersonnelDetail from './pages/PersonnelDetail';
import Sidebar from './components/Sidebar';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }: { children: ReactElement, allowedRoles?: string[] }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

// Layout Wrapper
const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="app-container">
    <Sidebar />
    <div className="content-wrapper">{children}</div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN', 'ENGINEER', 'TECHNICIAN', 'VENDOR']}><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />

          {/* Properties */}
          <Route path="/properties" element={<ProtectedRoute allowedRoles={['ADMIN', 'ENGINEER']}><Navigate to="/properties/list" replace /></ProtectedRoute>} />
          <Route path="/properties/add" element={<ProtectedRoute allowedRoles={['ADMIN', 'ENGINEER']}><AppLayout><PropertyAdd /></AppLayout></ProtectedRoute>} />
          <Route path="/properties/list" element={<ProtectedRoute allowedRoles={['ADMIN', 'ENGINEER']}><AppLayout><PropertyList /></AppLayout></ProtectedRoute>} />
          <Route path="/properties/setup" element={<ProtectedRoute allowedRoles={['ADMIN']}><AppLayout><PropertySetup /></AppLayout></ProtectedRoute>} />
          <Route path="/properties/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'ENGINEER', 'TECHNICIAN']}><AppLayout><PropertyDetail /></AppLayout></ProtectedRoute>} />

          {/* Assets */}
          <Route path="/assets" element={<ProtectedRoute allowedRoles={['ADMIN', 'ENGINEER', 'TECHNICIAN']}><Navigate to="/assets/list" replace /></ProtectedRoute>} />
          <Route path="/assets/add" element={<ProtectedRoute allowedRoles={['ADMIN', 'ENGINEER', 'TECHNICIAN']}><AppLayout><AssetAdd /></AppLayout></ProtectedRoute>} />
          <Route path="/assets/list" element={<ProtectedRoute allowedRoles={['ADMIN', 'ENGINEER', 'TECHNICIAN']}><AppLayout><AssetList /></AppLayout></ProtectedRoute>} />
          <Route path="/assets/setup" element={<ProtectedRoute allowedRoles={['ADMIN']}><AppLayout><AssetSetup /></AppLayout></ProtectedRoute>} />
          <Route path="/assets/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'ENGINEER', 'TECHNICIAN']}><AppLayout><AssetDetail /></AppLayout></ProtectedRoute>} />

          {/* Projects / Work Orders */}
          <Route path="/work-orders" element={<ProtectedRoute allowedRoles={['ADMIN', 'ENGINEER', 'VENDOR']}><Navigate to="/work-orders/list" replace /></ProtectedRoute>} />
          <Route path="/work-orders/add" element={<ProtectedRoute allowedRoles={['ADMIN']}><AppLayout><ProjectAdd /></AppLayout></ProtectedRoute>} />
          <Route path="/work-orders/list" element={<ProtectedRoute allowedRoles={['ADMIN', 'ENGINEER', 'VENDOR']}><AppLayout><ProjectList /></AppLayout></ProtectedRoute>} />
          <Route path="/work-orders/setup" element={<ProtectedRoute allowedRoles={['ADMIN']}><AppLayout><ProjectSetup /></AppLayout></ProtectedRoute>} />
          <Route path="/work-orders/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'ENGINEER', 'VENDOR']}><AppLayout><ProjectDetail /></AppLayout></ProtectedRoute>} />

          {/* Users */}
          <Route path="/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><Navigate to="/users/list" replace /></ProtectedRoute>} />
          <Route path="/users/list" element={<ProtectedRoute allowedRoles={['ADMIN']}><AppLayout><UserList /></AppLayout></ProtectedRoute>} />
          <Route path="/users/add" element={<ProtectedRoute allowedRoles={['ADMIN']}><AppLayout><UserAdd /></AppLayout></ProtectedRoute>} />
          <Route path="/users/permission-groups" element={<ProtectedRoute allowedRoles={['ADMIN']}><AppLayout><PermissionGroups /></AppLayout></ProtectedRoute>} />

          {/* Personnel Detail — accessible from User List and Property Details */}
          <Route path="/personnel/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'ENGINEER', 'TECHNICIAN']}><AppLayout><PersonnelDetail /></AppLayout></ProtectedRoute>} />

          {/* Asset Transfer */}
          <Route path="/asset-transfer" element={<ProtectedRoute allowedRoles={['ADMIN', 'ENGINEER']}><AppLayout><AssetTransfer /></AppLayout></ProtectedRoute>} />

          {/* Reports */}
          <Route path="/reports" element={<ProtectedRoute allowedRoles={['ADMIN', 'ENGINEER']}><Navigate to="/reports/transfers" replace /></ProtectedRoute>} />
          <Route path="/reports/transfers" element={<ProtectedRoute allowedRoles={['ADMIN', 'ENGINEER']}><AppLayout><Reports /></AppLayout></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
