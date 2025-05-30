import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 15v-2a2 2 0 012-2h4a2 2 0 012 2v2"
          />
        </svg>
      ),
    },
    {
      id: 'orders',
      label: 'Orders',
      path: '/orders',
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      id: 'customers',
      label: 'Customers',
      path: '/customers',
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
          />
        </svg>
      ),
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
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
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
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={
                isCollapsed
                  ? 'M13 7l5 5-5 5M6 12h12'
                  : 'M11 17l-5-5 5-5M18 12H6'
              }
            />
          </svg>
        </button>

        <button
          className="nav-item logout-btn"
          type="button"
          title={isCollapsed ? 'Logout' : undefined}
        >
          <span className="nav-icon">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1"
              />
            </svg>
          </span>
          {!isCollapsed && <span className="nav-label">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
