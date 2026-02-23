import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  FileText,
  Users,
  Bolt,
  LogOut,
  Settings,
  Package,
} from 'lucide-react';
import { LayoutMenu, LayoutMenuGroupData } from '@wedevs/plugin-ui';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isCollapsed = false;

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      window.location.href = (window as any).wepos?.logout_url || '/';
    }
  };

  const menuGroups = useMemo<LayoutMenuGroupData[]>(() => [
    {
      id: 'main',
      label: 'Main',
      secondaryLabel: 'Primary navigation',
      items: [
        {
          id: '/',
          label: 'Home',
          icon: <Home className="size-4" />,
          onClick: () => handleNavigation('/'),
          secondaryLabel: 'Dashboard'
        },
        {
          id: '/orders',
          label: 'Orders',
          icon: <FileText className="size-4" />,
          onClick: () => handleNavigation('/orders'),
          secondaryLabel: 'Sales history'
        },
        {
          id: '/customers',
          label: 'Customers',
          icon: <Users className="size-4" />,
          onClick: () => handleNavigation('/customers'),
          secondaryLabel: 'Manage clients'
        },
      ],
    },
    {
      id: 'settings-group',
      label: 'App',
      items: [
        {
          id: 'settings',
          label: 'Settings',
          icon: <Settings className="size-4" />,
          onClick: () => {},
          secondaryLabel: 'Configuration'
        },
        {
          id: 'products',
          label: 'Products',
          icon: <Package className="size-4" />,
          onClick: () => {},
          secondaryLabel: 'Inventory'
        }
      ]
    }
  ], [navigate]);

  return (
    <div
      className="bg-sidebar flex flex-col h-full"
    >
      <div className="border-sidebar-border border-b p-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
            <Bolt className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold">
            WePos
          </span>
        </div>
      </div>

      <div className="flex-1 py-2 overflow-hidden">
        <LayoutMenu
          groups={menuGroups}
          activeItemId={location.pathname}
          searchable={true}
        />
      </div>
    </div>
  );
};

export default Sidebar;
