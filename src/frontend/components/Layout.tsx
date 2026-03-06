import React, { useCallback, useRef } from 'react';
import {
  Layout as PUILayout,
  LayoutBody,
  LayoutSidebar,
  LayoutMain,
  LayoutHeader,
  useSidebar,
} from '@wedevs/plugin-ui';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const LayoutContent: React.FC<LayoutProps> = ({ children }) => {
  const { showSidebar, hideSidebar } = useSidebar();
  const sidebarRef = useRef<HTMLElement>( null );

  const handleMouseLeave = useCallback( () => {
    // Don't collapse if a dropdown/popover is open inside the sidebar
    const hasOpenPopover = sidebarRef.current?.querySelector( '[data-state="open"]' );
    if ( hasOpenPopover ) {
      return;
    }
    hideSidebar();
  }, [ hideSidebar ] );

  return (
    <LayoutBody className="h-full overflow-hidden">
      <LayoutSidebar
        ref={ sidebarRef }
        collapsible="icon"
        variant="sidebar"
        onMouseEnter={ showSidebar }
        onMouseLeave={ handleMouseLeave }
      >
        <Sidebar />
      </LayoutSidebar>
      <LayoutMain className="h-full overflow-hidden flex flex-col">
        {/* <LayoutHeader className="shrink-0 flex items-center gap-2 px-4" /> */}
        <div className="flex-1 min-h-0 overflow-hidden p-2">
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
