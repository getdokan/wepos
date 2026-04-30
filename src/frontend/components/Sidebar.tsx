import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
} from 'lucide-react';
import {
  LayoutMenu,
  LayoutMenuGroupData,
  SidebarFooter,
} from '@wedevs/plugin-ui';
import { applyFilters } from '../hooks/useExtensions';
import { __ } from '@wordpress/i18n';
import ThemeModeSwitcher from './ThemeModeSwitcher';

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

  const menuGroups = useMemo< LayoutMenuGroupData[] >( () => {
    const mainItems: WeposSidebarMenuItem[] = [
      {
        id: '/',
        label: __( 'Home', 'wepos' ),
        icon: <Home className="size-4" />,
        onClick: () => handleNavigation( '/' ),
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
        label: __( 'Main', 'wepos' ),
        secondaryLabel: __( 'Primary navigation', 'wepos' ),
        items: filteredMainItems,
      },
    ];

    if ( filteredAppItems.length > 0 ) {
      groups.push( {
        id: 'settings-group',
        label: __( 'App', 'wepos' ),
        items: filteredAppItems,
      } );
    }

    return groups;
  }, [ navigate ] );

  // Allow pro/extensions to render content in the sidebar footer (e.g. settings button)
  const sidebarFooter = applyFilters< React.ReactNode >(
    'wepos_react_sidebar_footer',
    null,
  );

  return (
    <>
      <LayoutMenu
        groups={ menuGroups }
        activeItemId={ location.pathname }
        searchable={ false }
        showGroupLabels={ false }
      />

      <SidebarFooter>
        <ThemeModeSwitcher />
        { sidebarFooter }
      </SidebarFooter>
    </>
  );
};

export default Sidebar;
