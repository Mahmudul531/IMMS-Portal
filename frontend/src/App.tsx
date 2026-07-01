import React, { type ReactElement } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
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
import PaymentReports from './pages/PaymentReports';
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
import TaskAdd from './pages/TaskAdd';
import TaskList from './pages/TaskList';
import GanttChart from './pages/GanttChart';
import DocumentAdd from './pages/DocumentAdd';
import DocumentList from './pages/DocumentList';
import TenderAdd from './pages/TenderAdd';
import TenderList from './pages/TenderList';
import MyContracts from './pages/MyContracts';
import FinanceApprovals from './pages/FinanceApprovals';
import FinanceProjects from './pages/FinanceProjects';
import Sidebar from './components/Sidebar';
// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles, requiredPermission }: { children: ReactElement, allowedRoles?: string[], requiredPermission?: string | string[] }) => {
  const { user, hasPermission } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  
  if (requiredPermission) {
      if (Array.isArray(requiredPermission)) {
          const hasAny = requiredPermission.some(p => hasPermission(p));
          if (!hasAny) return <Navigate to="/dashboard" replace />;
      } else {
          if (!hasPermission(requiredPermission)) return <Navigate to="/dashboard" replace />;
      }
  }
  return children;
};

// Layout Wrapper
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  return (
    <div className="app-container">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(prev => !prev)} />
      <div className={`content-wrapper${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN', 'ENGINEER', 'TECHNICIAN', 'VENDOR']}><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />

          {/* Properties */}
          <Route path="/properties" element={<ProtectedRoute requiredPermission="VIEW_INFRASTRUCTURE"><Navigate to="/properties/list" replace /></ProtectedRoute>} />
          <Route path="/properties/add" element={<ProtectedRoute requiredPermission="CREATE_INFRASTRUCTURE"><AppLayout><PropertyAdd /></AppLayout></ProtectedRoute>} />
          <Route path="/properties/list" element={<ProtectedRoute requiredPermission="VIEW_INFRASTRUCTURE"><AppLayout><PropertyList /></AppLayout></ProtectedRoute>} />
          <Route path="/properties/setup" element={<ProtectedRoute requiredPermission="CREATE_INFRASTRUCTURE"><AppLayout><PropertySetup /></AppLayout></ProtectedRoute>} />
          <Route path="/properties/:id" element={<ProtectedRoute requiredPermission="VIEW_INFRASTRUCTURE"><AppLayout><PropertyDetail /></AppLayout></ProtectedRoute>} />

          {/* Assets */}
          <Route path="/assets" element={<ProtectedRoute requiredPermission="VIEW_ASSETS"><Navigate to="/assets/list" replace /></ProtectedRoute>} />
          <Route path="/assets/add" element={<ProtectedRoute requiredPermission="CREATE_ASSET"><AppLayout><AssetAdd /></AppLayout></ProtectedRoute>} />
          <Route path="/assets/list" element={<ProtectedRoute requiredPermission="VIEW_ASSETS"><AppLayout><AssetList /></AppLayout></ProtectedRoute>} />
          <Route path="/assets/setup" element={<ProtectedRoute requiredPermission="CREATE_ASSET"><AppLayout><AssetSetup /></AppLayout></ProtectedRoute>} />
          <Route path="/assets/:id" element={<ProtectedRoute requiredPermission="VIEW_ASSETS"><AppLayout><AssetDetail /></AppLayout></ProtectedRoute>} />

          {/* Projects / Work Orders */}
          <Route path="/work-orders" element={<ProtectedRoute requiredPermission={['VIEW_WORK_ORDERS', 'VIEW_VENDOR_PROJECTS']}><Navigate to="/work-orders/list" replace /></ProtectedRoute>} />
          <Route path="/work-orders/add" element={<ProtectedRoute requiredPermission="CREATE_WORK_ORDER"><AppLayout><ProjectAdd /></AppLayout></ProtectedRoute>} />
          <Route path="/work-orders/list" element={<ProtectedRoute requiredPermission={['VIEW_WORK_ORDERS', 'VIEW_VENDOR_PROJECTS']}><AppLayout><ProjectList /></AppLayout></ProtectedRoute>} />
          <Route path="/work-orders/setup" element={<ProtectedRoute requiredPermission="CREATE_WORK_ORDER"><AppLayout><ProjectSetup /></AppLayout></ProtectedRoute>} />
          <Route path="/work-orders/:id" element={<ProtectedRoute requiredPermission={['VIEW_WORK_ORDERS', 'VIEW_VENDOR_PROJECTS']}><AppLayout><ProjectDetail /></AppLayout></ProtectedRoute>} />

          {/* Users */}
          <Route path="/users" element={<ProtectedRoute requiredPermission="VIEW_USERS"><Navigate to="/users/list" replace /></ProtectedRoute>} />
          <Route path="/users/list" element={<ProtectedRoute requiredPermission="VIEW_USERS"><AppLayout><UserList /></AppLayout></ProtectedRoute>} />
          <Route path="/users/add" element={<ProtectedRoute requiredPermission="MANAGE_USERS"><AppLayout><UserAdd /></AppLayout></ProtectedRoute>} />
          <Route path="/users/permission-groups" element={<ProtectedRoute requiredPermission="MANAGE_PERMISSION_GROUPS"><AppLayout><PermissionGroups /></AppLayout></ProtectedRoute>} />

          {/* Personnel Detail — accessible from User List and Property Details */}
          <Route path="/personnel/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'ENGINEER', 'TECHNICIAN']}><AppLayout><PersonnelDetail /></AppLayout></ProtectedRoute>} />

          {/* Asset Transfer */}
          <Route path="/asset-transfer" element={<ProtectedRoute requiredPermission="TRANSFER_ASSET"><AppLayout><AssetTransfer /></AppLayout></ProtectedRoute>} />

          {/* Reports */}
          <Route path="/reports" element={<ProtectedRoute requiredPermission="VIEW_REPORTS"><Navigate to="/reports/transfers" replace /></ProtectedRoute>} />
          <Route path="/reports/transfers" element={<ProtectedRoute requiredPermission="VIEW_REPORTS"><AppLayout><Reports /></AppLayout></ProtectedRoute>} />
          <Route path="/reports/payments" element={<ProtectedRoute requiredPermission="VIEW_PAYMENT_REPORTS"><AppLayout><PaymentReports /></AppLayout></ProtectedRoute>} />
          {/* Tenders & Contracts */}
          <Route path="/tenders/add" element={<ProtectedRoute requiredPermission="CREATE_TENDER"><AppLayout><TenderAdd /></AppLayout></ProtectedRoute>} />
          <Route path="/tenders" element={<ProtectedRoute requiredPermission="VIEW_TENDERS"><AppLayout><TenderList /></AppLayout></ProtectedRoute>} />
          <Route path="/my-contracts" element={<ProtectedRoute requiredPermission="VIEW_CONTRACTS"><AppLayout><MyContracts /></AppLayout></ProtectedRoute>} />

          {/* Finance */}
          <Route path="/finance/approvals" element={<ProtectedRoute requiredPermission="VIEW_FINANCE"><AppLayout><FinanceApprovals /></AppLayout></ProtectedRoute>} />
          <Route path="/finance/projects" element={<ProtectedRoute requiredPermission="VIEW_FINANCE"><AppLayout><FinanceProjects /></AppLayout></ProtectedRoute>} />

          {/* Tasks & Gantt */}
          <Route path="/tasks" element={<ProtectedRoute requiredPermission="VIEW_TASKS"><Navigate to="/tasks/list" replace /></ProtectedRoute>} />
          <Route path="/tasks/add" element={<ProtectedRoute requiredPermission="CREATE_TASK"><AppLayout><TaskAdd /></AppLayout></ProtectedRoute>} />
          <Route path="/tasks/list" element={<ProtectedRoute requiredPermission="VIEW_TASKS"><AppLayout><TaskList /></AppLayout></ProtectedRoute>} />
          <Route path="/tasks/gantt" element={<ProtectedRoute requiredPermission="VIEW_TASKS"><AppLayout><GanttChart /></AppLayout></ProtectedRoute>} />

          {/* Documents & Drawings */}
          <Route path="/documents" element={<ProtectedRoute requiredPermission="VIEW_DOCUMENTS"><Navigate to="/documents/list" replace /></ProtectedRoute>} />
          <Route path="/documents/add" element={<ProtectedRoute requiredPermission="UPLOAD_DOCUMENT"><AppLayout><DocumentAdd /></AppLayout></ProtectedRoute>} />
          <Route path="/documents/list" element={<ProtectedRoute requiredPermission="VIEW_DOCUMENTS"><AppLayout><DocumentList /></AppLayout></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
