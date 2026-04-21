import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Building2, MapPin, Wrench, LogOut, Users, Briefcase, ArrowRightLeft, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [assetsOpen, setAssetsOpen] = useState(false);
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [workOrdersOpen, setWorkOrdersOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  
  const isAssetsActive = location.pathname.startsWith('/assets') || location.pathname.startsWith('/asset-preferences');
  const isPropertiesActive = location.pathname.startsWith('/properties');
  const isWorkOrdersActive = location.pathname.startsWith('/work-orders');
  const isReportsActive = location.pathname.startsWith('/reports');

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
                <Link to="/properties/add" className={`nav-item ${isActive('/properties/add') ? 'active' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>
                  Add Property
                </Link>
                <Link to="/properties/list" className={`nav-item ${isActive('/properties/list') ? 'active' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>
                  Property List
                </Link>
                {['ADMIN'].includes(user.role) && (
                  <Link to="/properties/setup" className={`nav-item ${isActive('/properties/setup') ? 'active' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>
                    Property Setup
                  </Link>
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
                <Link to="/assets/add" className={`nav-item ${isActive('/assets/add') ? 'active' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>
                  Add Asset
                </Link>
                <Link to="/assets/list" className={`nav-item ${isActive('/assets/list') ? 'active' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>
                  Asset List
                </Link>
                {['ADMIN'].includes(user.role) && (
                  <Link to="/asset-preferences" className={`nav-item ${isActive('/asset-preferences') ? 'active' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>
                    Asset Setup
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
        {['ADMIN', 'VENDOR'].includes(user.role) && (
          <div>
            <div className={`nav-item ${isWorkOrdersActive ? 'active' : ''}`} onClick={() => setWorkOrdersOpen(!workOrdersOpen)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Briefcase size={20} />
                Work Orders
              </div>
              {workOrdersOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
            
            {workOrdersOpen && (
              <div style={{ marginLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                <Link to="/work-orders/add" className={`nav-item ${isActive('/work-orders/add') ? 'active' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>
                  Add Work Order
                </Link>
                <Link to="/work-orders/list" className={`nav-item ${isActive('/work-orders/list') ? 'active' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>
                  Work Order List
                </Link>
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
                <Link to="/reports/transfers" className={`nav-item ${isActive('/reports/transfers') ? 'active' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>
                  Asset Transfer
                </Link>
                {/* Future reports can be added here easily */}
              </div>
            )}
          </div>
        )}

        {['ADMIN'].includes(user.role) && (
          <Link to="/users" className={`nav-item ${isActive('/users') ? 'active' : ''}`}>
            <Users size={20} />
            User Access
          </Link>
        )}
      </div>

      <div style={{ marginTop: 'auto', background: 'var(--primary)', padding: '1.5rem', borderRadius: '12px', color: 'white', marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>?</div>
          Need help?
        </h4>
        <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', opacity: 0.9 }}>Please check our docs</p>
        <button onClick={() => window.open('/docs.html', '_blank')} style={{ width: '100%', padding: '0.6rem', background: 'white', color: 'var(--primary)', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
          DOCUMENTATION
        </button>
      </div>

      <button className="btn logout-btn" onClick={logout} style={{ width: '100%', background: '#ef4444', color: 'white', border: 'none', padding: '0.8rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', cursor: 'pointer' }}>
        <LogOut size={20} style={{ marginRight: '8px' }} />
        Logout
      </button>
    </div>
  );
};

export default Sidebar;
