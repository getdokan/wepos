import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const SIDEBAR_STORAGE_KEY = 'wepos-sidebar-collapsed';

const Layout: React.FC<LayoutProps> = ({ children }) => {
  // Initialize state from localStorage or default to collapsed
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      return stored !== null ? JSON.parse(stored) : true;
    } catch (error) {
      console.warn('Failed to load sidebar state from localStorage:', error);
      return true; // Default to collapsed if localStorage fails
    }
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(
        SIDEBAR_STORAGE_KEY,
        JSON.stringify(sidebarCollapsed),
      );
    } catch (error) {
      console.warn('Failed to save sidebar state to localStorage:', error);
    }
  }, [sidebarCollapsed]);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev: boolean) => !prev);
  };

  return (
    <div id="wepos-main">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      <div className="wepos-main-content">{children}</div>
    </div>
  );
};

export default Layout;
