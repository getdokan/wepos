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
    <div
      className={`wepos-sidebar bg-wepos-dark shadow-wepos-lg flex flex-col text-white transition-all duration-300 ease-in-out ${isCollapsed ? 'collapsed' : 'expanded'}`}
    >
      <div className="border-wepos-dark-lighter relative border-b p-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="bg-wepos-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white">
            <Bolt className="h-6 w-6" />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-bold text-white transition-opacity duration-300">
              WePos
            </span>
          )}
        </div>
      </div>

      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                className={`hover:bg-wepos-dark-lighter nav-item relative flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-gray-300 transition-all duration-200 hover:text-white ${
                  location.pathname === item.path
                    ? 'bg-wepos-primary text-white'
                    : ''
                } ${isCollapsed ? 'justify-center px-3' : ''}`}
                onClick={() => handleNavigation(item.path)}
                type="button"
                title={isCollapsed ? item.label : undefined}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!isCollapsed && (
                  <span className="nav-label text-sm font-medium whitespace-nowrap transition-opacity duration-300">
                    {item.label}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-wepos-dark-lighter relative border-t p-2">
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
          className="hover:bg-wepos-dark-lighter nav-item relative flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-gray-300 text-red-300 transition-all duration-200 hover:bg-red-900/20 hover:text-red-200 hover:text-white"
          type="button"
          title={isCollapsed ? 'Logout' : undefined}
        >
          <span className="flex-shrink-0">
            <LogOut className="h-5 w-5" />
          </span>
          {!isCollapsed && (
            <span className="nav-label text-sm font-medium whitespace-nowrap transition-opacity duration-300">
              Logout
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
