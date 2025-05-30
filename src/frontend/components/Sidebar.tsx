import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  FileText,
  Users,
  Bolt,
  ChevronRight,
  ChevronLeft,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      id: 'home',
      label: 'Home',
      path: '/',
      icon: <Home className="h-5 w-5" />,
    },
    {
      id: 'orders',
      label: 'Orders',
      path: '/orders',
      icon: <FileText className="h-5 w-5" />,
    },
    {
      id: 'customers',
      label: 'Customers',
      path: '/customers',
      icon: <Users className="h-5 w-5" />,
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className={`wepos-sidebar ${isCollapsed ? 'collapsed' : 'expanded'}`}>
      <div className="wepos-sidebar-header">
        <div className="wepos-logo">
          <div className="logo-circle">
            <Bolt className="h-6 w-6" />
          </div>
          {!isCollapsed && <span className="logo-text">WePos</span>}
        </div>
      </div>

      <nav className="wepos-sidebar-nav">
        <ul className="nav-list">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                className={`nav-item ${
                  location.pathname === item.path ? 'active' : ''
                }`}
                onClick={() => handleNavigation(item.path)}
                type="button"
                title={isCollapsed ? item.label : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                {!isCollapsed && (
                  <span className="nav-label">{item.label}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="wepos-sidebar-footer relative">
        <button
          className="hover:bg-wepos-dark-lighter flex w-full justify-center rounded p-1 text-gray-300 transition-colors duration-200 hover:text-white"
          onClick={onToggleCollapse}
          type="button"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>

        <button
          className="nav-item logout-btn"
          type="button"
          title={isCollapsed ? 'Logout' : undefined}
        >
          <span className="nav-icon">
            <LogOut className="h-5 w-5" />
          </span>
          {!isCollapsed && <span className="nav-label">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
