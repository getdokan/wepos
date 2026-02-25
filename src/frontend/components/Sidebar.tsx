import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Bolt,
} from 'lucide-react';
import { LayoutMenu, LayoutMenuGroupData } from '@wedevs/plugin-ui';
import { applyFilters, doAction } from '../hooks/useExtensions';

export interface WeposSidebarMenuItem {
	id: string;
	label: string;
	icon: React.ReactNode;
	onClick: () => void;
	secondaryLabel?: string;
}

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = ( path: string ) => {
    navigate( path );
  };

  const handleLogout = () => {
    if ( window.confirm( 'Are you sure you want to logout?' ) ) {
      // Fire action so pro can clear cashier session before redirect
      doAction( 'wepos_react_before_logout' );
      window.location.href = ( window as any ).wepos?.logout_url || '/';
    }
  };

  const menuGroups = useMemo< LayoutMenuGroupData[] >( () => {
    const mainItems: WeposSidebarMenuItem[] = [
      {
        id: '/',
        label: 'Home',
        icon: <Home className="size-4" />,
        onClick: () => handleNavigation( '/' ),
        secondaryLabel: 'Dashboard',
      },
    ];

    const appItems: WeposSidebarMenuItem[] = [];

    // Allow pro/extensions to modify menu items (pass navigate so extensions can add clickable items)
    const filteredMainItems = applyFilters< WeposSidebarMenuItem[] >(
      'wepos_react_sidebar_main_items',
      mainItems,
      navigate,
    );

    const filteredAppItems = applyFilters< WeposSidebarMenuItem[] >(
      'wepos_react_sidebar_app_items',
      appItems,
      navigate,
    );

    const groups: LayoutMenuGroupData[] = [
      {
        id: 'main',
        label: 'Main',
        secondaryLabel: 'Primary navigation',
        items: filteredMainItems,
      },
    ];

    if ( filteredAppItems.length > 0 ) {
      groups.push( {
        id: 'settings-group',
        label: 'App',
        items: filteredAppItems,
      } );
    }

    return groups;
  }, [ navigate ] );

  // Allow pro to render extra content in the sidebar footer (e.g. cashier info)
  const sidebarFooter = applyFilters< React.ReactNode >(
    'wepos_react_sidebar_footer',
    null,
  );

  return (
    <div className="bg-sidebar flex h-full flex-col">
      <div className="border-sidebar-border border-b p-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
            <Bolt className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold">WePos</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden py-2">
        <LayoutMenu
          groups={ menuGroups }
          activeItemId={ location.pathname }
          searchable={ true }
        />
      </div>

      { sidebarFooter }
    </div>
  );
};

export default Sidebar;
