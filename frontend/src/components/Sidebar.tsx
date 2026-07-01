import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Building2, MapPin, Wrench, LogOut, Users, Briefcase,
  ArrowRightLeft, FileText, ChevronDown, ChevronRight, Shield, FolderOpen,
  BarChart2, ClipboardList, BookOpen, Menu
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const { user, logout, hasPermission } = useAuth();
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

  // Helper: nav group item with toggle
  const NavGroup = ({
    icon, label, isOpen, onOpen, isActive: groupActive, dataTitle, children
  }: {
    icon: React.ReactNode;
    label: string;
    isOpen: boolean;
    onOpen: () => void;
    isActive: boolean;
    dataTitle: string;
    children: React.ReactNode;
  }) => (
    <div>
      <div
        className={`nav-item ${groupActive ? 'active' : ''}`}
        data-title={dataTitle}
        onClick={onOpen}
        style={{ cursor: 'pointer', justifyContent: 'space-between' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          <span style={{ flexShrink: 0 }}>{icon}</span>
          <span className="nav-label">{label}</span>
        </div>
        <span className="nav-chevron" style={{ flexShrink: 0 }}>
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </div>
      <div className="nav-submenu" style={isOpen && !collapsed ? { marginLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.3rem', marginBottom: '0.3rem' } : { display: 'none' }}>
        {children}
      </div>
    </div>
  );

  const SubLink = ({ to, label }: { to: string; label: string }) => (
    <Link
      to={to}
      className={`nav-item ${isActive(to) ? 'active' : ''}`}
      style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
    >
      {label}
    </Link>
  );

  return (
    <div className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-title">
          <MapPin size={20} style={{ flexShrink: 0 }} />
          <span className="sidebar-title-text">IMMS Portal</span>
        </div>
        <button className="sidebar-toggle" onClick={onToggle} title={collapsed ? 'Expand menu' : 'Collapse menu'}>
          <Menu size={18} />
        </button>
      </div>

      <div className="nav-menu">
        {/* Dashboard */}
        <Link to="/dashboard" className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`} data-title="Dashboard">
          <span style={{ flexShrink: 0 }}><LayoutDashboard size={20} /></span>
          <span className="nav-label">Dashboard</span>
        </Link>

        {/* Infrastructure */}
        {hasPermission('VIEW_INFRASTRUCTURE') && (
          <NavGroup
            icon={<Building2 size={20} />}
            label="Infrastructure"
            isOpen={propertiesOpen}
            onOpen={() => setPropertiesOpen(!propertiesOpen)}
            isActive={isPropertiesActive}
            dataTitle="Infrastructure"
          >
            <SubLink to="/properties/add" label="Add Infrastructure" />
            <SubLink to="/properties/list" label="Infrastructure List" />
            {hasPermission('CREATE_INFRASTRUCTURE') && (
              <SubLink to="/properties/setup" label="Infrastructure Setup" />
            )}
          </NavGroup>
        )}

        {/* Assets */}
        {hasPermission('VIEW_ASSETS') && (
          <NavGroup
            icon={<Wrench size={20} />}
            label="Assets"
            isOpen={assetsOpen}
            onOpen={() => setAssetsOpen(!assetsOpen)}
            isActive={isAssetsActive}
            dataTitle="Assets"
          >
            <SubLink to="/assets/add" label="Add Asset" />
            <SubLink to="/assets/list" label="Asset List" />
            {hasPermission('CREATE_ASSET') && (
              <SubLink to="/assets/setup" label="Asset Setup" />
            )}
          </NavGroup>
        )}

        {/* Projects / Work Orders */}
        {(hasPermission('VIEW_WORK_ORDERS') || hasPermission('VIEW_VENDOR_PROJECTS')) && (
          <NavGroup
            icon={<Briefcase size={20} />}
            label="Projects / Work Orders"
            isOpen={workOrdersOpen}
            onOpen={() => setWorkOrdersOpen(!workOrdersOpen)}
            isActive={isWorkOrdersActive}
            dataTitle="Projects"
          >
            {hasPermission('CREATE_WORK_ORDER') && (
              <SubLink to="/work-orders/add" label="Add Project" />
            )}
            <SubLink to="/work-orders/list" label="Project List" />
            {hasPermission('CREATE_WORK_ORDER') && (
              <SubLink to="/work-orders/setup" label="Work Order Setup" />
            )}
          </NavGroup>
        )}

        {/* Asset Transfer */}
        {hasPermission('TRANSFER_ASSET') && (
          <Link to="/asset-transfer" className={`nav-item ${isActive('/asset-transfer') ? 'active' : ''}`} data-title="Transfer Asset">
            <span style={{ flexShrink: 0 }}><ArrowRightLeft size={20} /></span>
            <span className="nav-label">Transfer Asset</span>
          </Link>
        )}

        {/* Reports */}
        {(hasPermission('VIEW_REPORTS') || hasPermission('VIEW_PAYMENT_REPORTS')) && (
          <NavGroup
            icon={<FileText size={20} />}
            label="Reports"
            isOpen={reportsOpen}
            onOpen={() => setReportsOpen(!reportsOpen)}
            isActive={isReportsActive}
            dataTitle="Reports"
          >
            {hasPermission('VIEW_REPORTS') && (
              <SubLink to="/reports/transfers" label="Asset Transfer" />
            )}
            {hasPermission('VIEW_PAYMENT_REPORTS') && (
              <SubLink to="/reports/payments" label="Payment History" />
            )}
          </NavGroup>
        )}

        {/* User Access */}
        {hasPermission('VIEW_USERS') && (
          <NavGroup
            icon={<Users size={20} />}
            label="User Access"
            isOpen={usersOpen}
            onOpen={() => setUsersOpen(!usersOpen)}
            isActive={isUsersActive}
            dataTitle="User Access"
          >
            {hasPermission('MANAGE_USERS') && (
              <SubLink to="/users/add" label="Add User" />
            )}
            <SubLink to="/users/list" label="User List" />
            {hasPermission('MANAGE_PERMISSION_GROUPS') && (
              <Link
                to="/users/permission-groups"
                className={`nav-item ${isActive('/users/permission-groups') ? 'active' : ''}`}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Shield size={13} /> Permission Groups
              </Link>
            )}
          </NavGroup>
        )}

        {/* Tenders */}
        {(hasPermission('VIEW_TENDERS') || hasPermission('VIEW_CONTRACTS')) && (
          <NavGroup
            icon={<ClipboardList size={20} />}
            label="Tenders"
            isOpen={tenderOpen}
            onOpen={() => setTenderOpen(!tenderOpen)}
            isActive={isTenderActive}
            dataTitle="Tenders"
          >
            {hasPermission('CREATE_TENDER') && (
              <SubLink to="/tenders/add" label="Add Tender" />
            )}
            {hasPermission('VIEW_TENDERS') && (
              <SubLink to="/tenders" label="Tender List" />
            )}
            {hasPermission('VIEW_CONTRACTS') && (
              <SubLink to="/my-contracts" label="My Contracts" />
            )}
          </NavGroup>
        )}

        {/* Finance */}
        {hasPermission('VIEW_FINANCE') && (
          <NavGroup
            icon={<BarChart2 size={20} />}
            label="Finance"
            isOpen={financeOpen}
            onOpen={() => setFinanceOpen(!financeOpen)}
            isActive={isFinanceActive}
            dataTitle="Finance"
          >
            <SubLink to="/finance/approvals" label="Pending Approvals" />
            <SubLink to="/finance/projects" label="Current Projects" />
          </NavGroup>
        )}

        {/* Tasks */}
        {hasPermission('VIEW_TASKS') && (
          <NavGroup
            icon={<ClipboardList size={20} />}
            label="Tasks"
            isOpen={tasksOpen}
            onOpen={() => setTasksOpen(!tasksOpen)}
            isActive={isTasksActive}
            dataTitle="Tasks"
          >
            {hasPermission('CREATE_TASK') && (
              <SubLink to="/tasks/add" label="Add Task" />
            )}
            <SubLink to="/tasks/list" label="Task List" />
            <Link
              to="/tasks/gantt"
              className={`nav-item ${isActive('/tasks/gantt') ? 'active' : ''}`}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <BarChart2 size={13} /> Gantt Chart
            </Link>
          </NavGroup>
        )}

        {/* Document & Drawing */}
        {hasPermission('VIEW_DOCUMENTS') && (
          <NavGroup
            icon={<FolderOpen size={20} />}
            label="Document & Drawing"
            isOpen={docsOpen}
            onOpen={() => setDocsOpen(!docsOpen)}
            isActive={isDocumentsActive}
            dataTitle="Documents"
          >
            <SubLink to="/documents/add" label="Upload Document" />
            <SubLink to="/documents/list" label="Document List" />
          </NavGroup>
        )}

        {/* User Manual */}
        <a
          href="/docs.html"
          target="_blank"
          rel="noreferrer"
          className="nav-item"
          data-title="User Manual"
          style={{ textDecoration: 'none' }}
        >
          <span style={{ flexShrink: 0 }}><BookOpen size={20} /></span>
          <span className="nav-label">User Manual</span>
        </a>
      </div>

      {/* Logout */}
      <button className="btn logout-btn" onClick={logout}>
        <LogOut size={18} style={{ flexShrink: 0 }} />
        <span className="logout-btn-label">Logout</span>
      </button>
    </div>
  );
};

export default Sidebar;
