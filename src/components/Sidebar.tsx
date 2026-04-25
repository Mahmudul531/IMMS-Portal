import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Building2, MapPin, Wrench, LogOut, Users, Briefcase, ArrowRightLeft, FileText, ChevronDown, ChevronRight, Shield, FolderOpen, BarChart2, ClipboardList, BookOpen } from 'lucide-react';
import { useState } from 'react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [assetsOpen, setAssetsOpen] = useState(false);
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [workOrdersOpen, setWorkOrdersOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [tenderOpen, setTenderOpen] = useState(false);
  const [financeOpen, setFinanceOpen] = useState(false);

  const isAssetsActive = location.pathname.startsWith('/assets');
  const isPropertiesActive = location.pathname.startsWith('/properties');
  const isWorkOrdersActive = location.pathname.startsWith('/work-orders');
  const isReportsActive = location.pathname.startsWith('/reports');
  const isDocumentsActive = location.pathname.startsWith('/documents');
  const isUsersActive = location.pathname.startsWith('/users') || location.pathname.startsWith('/personnel');
  const isTasksActive = location.pathname.startsWith('/tasks');
  const isTenderActive = location.pathname.startsWith('/tenders') || location.pathname.startsWith('/my-contracts');
  const isFinanceActive = location.pathname.startsWith('/finance');

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="sidebar">
      <div className="sidebar-title">
        <MapPin size={24} />
        IMMS Portal
      </div>

      <div className="nav-menu">
        <Link to="/dashboard" className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          Dashboard
        </Link>

        {['ADMIN', 'ENGINEER'].includes(user.role) && (
          <div>
            <div className={`nav-item ${isPropertiesActive ? 'active' : ''}`} onClick={() => setPropertiesOpen(!propertiesOpen)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Building2 size={20} />
                Properties
              </div>
              {propertiesOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
            {propertiesOpen && (
              <div style={{ marginLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                <Link to="/properties/add" className={`nav-item ${isActive('/properties/add') ? 'active' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>Add Property</Link>
                <Link to="/properties/list" className={`nav-item ${isActive('/properties/list') ? 'active' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>Property List</Link>
                {['ADMIN'].includes(user.role) && (
                  <Link to="/properties/setup" className={`nav-item ${isActive('/properties/setup') ? 'active' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>Property Setup</Link>
                )}
              </div>
            )}
          </div>
        )}

        {['ADMIN', 'ENGINEER', 'TECHNICIAN'].includes(user.role) && (
          <div>
            <div className={`nav-item ${isAssetsActive ? 'active' : ''}`} onClick={() => setAssetsOpen(!assetsOpen)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Wrench size={20} />
                Assets
              </div>
              {assetsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
            {assetsOpen && (
              <div style={{ marginLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                <Link to="/assets/add" className={`nav-item ${isActive('/assets/add') ? 'active' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>Add Asset</Link>
                <Link to="/assets/list" className={`nav-item ${isActive('/assets/list') ? 'active' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>Asset List</Link>
                {['ADMIN'].includes(user.role) && (
                  <Link to="/assets/setup" className={`nav-item ${isActive('/assets/setup') ? 'active' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>Asset Setup</Link>
                )}
              </div>
            )}
          </div>
        )}

        {['ADMIN', 'ENGINEER', 'VENDOR'].includes(user.role) && (
          <div>
            <div className={`nav-item ${isWorkOrdersActive ? 'active' : ''}`} onClick={() => setWorkOrdersOpen(!workOrdersOpen)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Briefcase size={20} />
                Projects / Work Orders
              </div>
              {workOrdersOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
            {workOrdersOpen && (
              <div style={{ marginLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                {['ADMIN'].includes(user.role) && (
                  <Link to="/work-orders/add" className={`nav-item ${isActive('/work-orders/add') ? 'active' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>Add Project</Link>
                )}
                <Link to="/work-orders/list" className={`nav-item ${isActive('/work-orders/list') ? 'active' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>Project List</Link>
                {['ADMIN'].includes(user.role) && (
                  <Link to="/work-orders/setup" className={`nav-item ${isActive('/work-orders/setup') ? 'active' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>Work Order Setup</Link>
                )}
              </div>
            )}
          </div>
        )}

        {['ADMIN', 'ENGINEER'].includes(user.role) && (
          <Link to="/asset-transfer" className={`nav-item ${isActive('/asset-transfer') ? 'active' : ''}`}>
            <ArrowRightLeft size={20} />
            Transfer Asset
          </Link>
        )}

        {['ADMIN', 'ENGINEER'].includes(user.role) && (
          <div>
            <div className={`nav-item ${isReportsActive ? 'active' : ''}`} onClick={() => setReportsOpen(!reportsOpen)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FileText size={20} />
                Reports
              </div>
              {reportsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
            {reportsOpen && (
              <div style={{ marginLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                <Link to="/reports/transfers" className={`nav-item ${isActive('/reports/transfers') ? 'active' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>Asset Transfer</Link>
                <Link to="/reports/payments" className={`nav-item ${isActive('/reports/payments') ? 'active' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>Payment History</Link>
              </div>
            )}
          </div>
        )}

        {['ADMIN'].includes(user.role) && (
          <div>
            <div className={`nav-item ${isUsersActive ? 'active' : ''}`} onClick={() => setUsersOpen(!usersOpen)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Users size={20} />
                User Access
              </div>
              {usersOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
            {usersOpen && (
              <div style={{ marginLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                <Link to="/users/add" className={`nav-item ${isActive('/users/add') ? 'active' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>Add User</Link>
                <Link to="/users/list" className={`nav-item ${isActive('/users/list') ? 'active' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>User List</Link>
                <Link to="/users/permission-groups" className={`nav-item ${isActive('/users/permission-groups') ? 'active' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Shield size={14} /> Permission Groups
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Tender Lifecycle */}
        {['ADMIN', 'VENDOR'].includes(user.role) && (
          <div>
            <div className={`nav-item ${isTenderActive ? 'active' : ''}`} onClick={() => setTenderOpen(!tenderOpen)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <ClipboardList size={20} />
                Tenders
              </div>
              {tenderOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
            {tenderOpen && (
              <div style={{ marginLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                {['ADMIN'].includes(user.role) && (
                  <Link to="/tenders/add" className={`nav-item ${isActive('/tenders/add') ? 'active' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>Add Tender</Link>
                )}
                {['ADMIN'].includes(user.role) && (
                  <Link to="/tenders" className={`nav-item ${isActive('/tenders') ? 'active' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>Tender List</Link>
                )}
                {['VENDOR'].includes(user.role) && (
                  <Link to="/my-contracts" className={`nav-item ${isActive('/my-contracts') ? 'active' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>My Contracts</Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* Finance Workflow */}
        {['ADMIN', 'ENGINEER'].includes(user.role) && (
          <div>
            <div className={`nav-item ${isFinanceActive ? 'active' : ''}`} onClick={() => setFinanceOpen(!financeOpen)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <BarChart2 size={20} />
                Finance
              </div>
              {financeOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
            {financeOpen && (
              <div style={{ marginLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                <Link to="/finance/approvals" className={`nav-item ${isActive('/finance/approvals') ? 'active' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>Pending Approvals</Link>
                <Link to="/finance/projects" className={`nav-item ${isActive('/finance/projects') ? 'active' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>Current Projects</Link>
              </div>
            )}
          </div>
        )}

        {/* Tasks */}
        {['ADMIN', 'ENGINEER', 'TECHNICIAN'].includes(user.role) && (
          <div>
            <div className={`nav-item ${isTasksActive ? 'active' : ''}`} onClick={() => setTasksOpen(!tasksOpen)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <ClipboardList size={20} />
                Tasks
              </div>
              {tasksOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
            {tasksOpen && (
              <div style={{ marginLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                {['ADMIN', 'ENGINEER'].includes(user.role) && (
                  <Link to="/tasks/add" className={`nav-item ${isActive('/tasks/add') ? 'active' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>Add Task</Link>
                )}
                <Link to="/tasks/list" className={`nav-item ${isActive('/tasks/list') ? 'active' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>Task List</Link>
                <Link to="/tasks/gantt" className={`nav-item ${isActive('/tasks/gantt') ? 'active' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <BarChart2 size={14} /> Gantt Chart
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Document & Drawing */}
        <div>
          <div
            className={`nav-item ${isDocumentsActive ? 'active' : ''}`}
            onClick={() => setDocsOpen(!docsOpen)}
            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <FolderOpen size={20} />
              Document & Drawing
            </div>
            {docsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
          {docsOpen && (
            <div style={{ marginLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
              <Link to="/documents/add" className={`nav-item ${isActive('/documents/add') ? 'active' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>Upload Document</Link>
              <Link to="/documents/list" className={`nav-item ${isActive('/documents/list') ? 'active' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>Document List</Link>
            </div>
          )}
        </div>

        {/* User Manual */}
        <a
          href="/docs.html"
          target="_blank"
          rel="noreferrer"
          className="nav-item"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
        >
          <BookOpen size={20} />
          User Manual
        </a>
      </div>

      <button
        className="btn logout-btn"
        onClick={logout}
        style={{
          width: '100%',
          background: '#ef4444',
          color: 'white',
          border: 'none',
          padding: '0.75rem',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontWeight: 700,
          fontSize: '0.875rem',
          cursor: 'pointer',
          marginTop: 'auto',
        }}
      >
        <LogOut size={18} /> Logout
      </button>
    </div>
  );
};

export default Sidebar;
