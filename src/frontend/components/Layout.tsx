import React from 'react';
import {
  Layout as PUILayout,
  LayoutBody,
  LayoutSidebar,
  LayoutMain,
  LayoutHeader,
  LayoutFooter,
  LayoutMenu,
} from '@wedevs/plugin-ui';
import Sidebar from './Sidebar';
import { House } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  headerContent?: React.ReactNode;
}

 const Layout: React.FC<LayoutProps> = ({ children, headerContent }) => {
  return (
    <PUILayout
      key="sidebar-true-left"
      className="bg-background"
      defaultSidebarOpen
      sidebarBreakpoint="lg"
      sidebarPosition="left"
      sidebarVariant="drawer"
    >
      <LayoutHeader className="h-16 bg-white px-6">
        {headerContent}
      </LayoutHeader>
      <LayoutBody>
        <React.Fragment key=".0">
          <LayoutSidebar>
            <Sidebar />
          </LayoutSidebar>
          <LayoutMain>{children}</LayoutMain>
        </React.Fragment>
      </LayoutBody>
    </PUILayout>
  );
};
export default Layout;
