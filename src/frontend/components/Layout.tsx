import React, { useState } from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  return (
    <div id="wepos-main">
      <Sidebar
        currentPage={currentPage}
        onPageChange={onPageChange}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      <div className="wepos-main-content">
        {children}
      </div>
    </div>
  );
};

export default Layout;
