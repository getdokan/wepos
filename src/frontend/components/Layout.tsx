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
      className="bg-background h-screen fixed inset-0 overflow-hidden"
      defaultSidebarOpen
      sidebarBreakpoint="lg"
      sidebarPosition="left"
      sidebarVariant="drawer"
    >
      <LayoutHeader className="h-16 bg-white px-6">
        {headerContent}
      </LayoutHeader>
      <LayoutBody className="h-[calc(100vh-64px)] overflow-hidden">
        <React.Fragment key=".0">
          <LayoutSidebar className="h-full">
            <Sidebar />
          </LayoutSidebar>
          <LayoutMain className="h-full overflow-hidden">{children}</LayoutMain>
        </React.Fragment>
      </LayoutBody>
    </PUILayout>
  );
};
export default Layout;
