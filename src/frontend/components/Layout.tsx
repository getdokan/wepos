import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { __ } from '@wordpress/i18n';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="wepos-container">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                {__('WePOS', 'wepos')}
              </h1>
            </div>

            {/* Navigation */}
            <nav className="hidden md:block">
              <div className="flex space-x-8">
                <Link
                  to="/products"
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive('/products')
                      ? 'bg-wepos-primary text-white'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {__('Products', 'wepos')}
                </Link>
                <Link
                  to="/cart"
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive('/cart')
                      ? 'bg-wepos-primary text-white'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {__('Cart', 'wepos')}
                </Link>
                <Link
                  to="/orders"
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive('/orders')
                      ? 'bg-wepos-primary text-white'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {__('Orders', 'wepos')}
                </Link>
                <Link
                  to="/settings"
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive('/settings')
                      ? 'bg-wepos-primary text-white'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {__('Settings', 'wepos')}
                </Link>
              </div>
            </nav>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              <button className="wepos-btn wepos-btn-secondary">
                {__('Logout', 'wepos')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default Layout;
