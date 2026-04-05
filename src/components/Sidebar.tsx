import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Building2, MapPin, Wrench, LogOut, Users, Briefcase, ArrowRightLeft, FileText } from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

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
          <Link to="/properties" className={`nav-item ${isActive('/properties') ? 'active' : ''}`}>
            <Building2 size={20} />
            Properties
          </Link>
        )}

        {['ADMIN', 'ENGINEER', 'TECHNICIAN'].includes(user.role) && (
          <Link to="/assets" className={`nav-item ${isActive('/assets') ? 'active' : ''}`}>
            <Wrench size={20} />
            Assets
          </Link>
        )}
        {['ADMIN', 'VENDOR'].includes(user.role) && (
          <Link to="/work-orders" className={`nav-item ${isActive('/work-orders') ? 'active' : ''}`}>
            <Briefcase size={20} />
            Work Orders
          </Link>
        )}

        {['ADMIN', 'ENGINEER'].includes(user.role) && (
          <Link to="/asset-transfer" className={`nav-item ${isActive('/asset-transfer') ? 'active' : ''}`}>
            <ArrowRightLeft size={20} />
            Transfer Asset
          </Link>
        )}

        {['ADMIN', 'ENGINEER'].includes(user.role) && (
          <Link to="/reports" className={`nav-item ${isActive('/reports') ? 'active' : ''}`}>
            <FileText size={20} />
            Reports
          </Link>
        )}

        {['ADMIN'].includes(user.role) && (
          <Link to="/users" className={`nav-item ${isActive('/users') ? 'active' : ''}`}>
            <Users size={20} />
            User Access
          </Link>
        )}
      </div>

      <button className="btn logout-btn" onClick={logout}>
        <LogOut size={20} style={{ marginRight: '8px' }} />
        Logout ({user.username})
      </button>
    </div>
  );
};

export default Sidebar;
