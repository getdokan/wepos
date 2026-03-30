import React from 'react';
import {
  Layout as PUILayout,
  LayoutBody,
  LayoutSidebar,
  LayoutMain,
  LayoutHeader,
  SidebarTrigger,
} from '@wedevs/plugin-ui';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const LayoutContent: React.FC<LayoutProps> = ({ children }) => {
  return (
    <LayoutBody className="h-full overflow-hidden">
      <LayoutSidebar
        collapsible="icon"
        variant="sidebar"
      >
        <Sidebar />
      </LayoutSidebar>
      <LayoutMain className="h-full overflow-hidden flex flex-col">
        <div className="md:hidden flex items-center p-2 border-b border-border">
          <SidebarTrigger />
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          {children}
        </div>
      </LayoutMain>
    </LayoutBody>
  );
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <PUILayout
      className="bg-background h-screen fixed inset-0 overflow-hidden"
      defaultSidebarOpen={false}
      namespace='wepos'
    >
      <LayoutContent>{children}</LayoutContent>
    </PUILayout>
  );
};
export default Layout;
