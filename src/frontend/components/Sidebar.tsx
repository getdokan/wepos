import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Bolt,
  LogOut,
  ChevronsUpDown,
} from 'lucide-react';
import {
  LayoutMenu,
  LayoutMenuGroupData,
  SidebarHeader,
  SidebarFooter,
  Avatar,
  AvatarImage,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  useSidebar,
} from '@wedevs/plugin-ui';
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
  const { isMobile } = useSidebar();

  const currentUser = window.wepos?.current_user;

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

  const userInitials = currentUser?.name
    ? currentUser.name.split( ' ' ).map( ( n ) => n[0] ).join( '' ).toUpperCase().slice( 0, 2 )
    : '?';

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold">
            <Bolt className="h-5 w-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-lg font-bold">WePos</span>
          </div>
        </div>
      </SidebarHeader>

      <LayoutMenu
        groups={ menuGroups }
        activeItemId={ location.pathname }
        searchable={ false }
      />

      { sidebarFooter && (
        <SidebarFooter>
          { sidebarFooter }
        </SidebarFooter>
      ) }

      { currentUser && (
        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full items-center mb-3 gap-2 py-2 rounded-md text-left text-sm hover:bg-sidebar-accent outline-none cursor-pointer">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={ currentUser.avatar_url } alt={ currentUser.name } />
                <AvatarFallback>{ userInitials }</AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
                <span className="truncate font-medium">{ currentUser.name }</span>
                <span className="truncate text-xs text-muted-foreground">{ currentUser.role }</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56"
              side={ isMobile ? 'bottom' : 'right' }
              align="end"
              sideOffset={ 4 }
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">{ currentUser.name }</p>
                    <p className="text-xs text-muted-foreground">{ currentUser.email }</p>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={ handleLogout }>
                <LogOut className="mr-2 size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      ) }
    </>
  );
};

export default Sidebar;
