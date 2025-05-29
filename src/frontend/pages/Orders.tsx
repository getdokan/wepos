import React from 'react';
import Layout from '../components/Layout';

interface OrdersPageProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const OrdersPage: React.FC<OrdersPageProps> = ({ currentPage, onPageChange }) => {
  return (
    <Layout currentPage={currentPage} onPageChange={onPageChange}>
      <div className="wepos-content-product">
        <div className="flex flex-col h-full">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Orders</h1>
            <p className="text-gray-600">Manage and view your orders</p>
          </div>

          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center py-20">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Orders Management</h3>
              <p className="text-gray-500">This page will contain order management functionality</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrdersPage;
