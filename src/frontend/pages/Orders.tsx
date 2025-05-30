import React from 'react';
import Layout from '../components/Layout';

const OrdersPage: React.FC = () => {
  return (
    <Layout>
      <div className="wepos-content-product">
        <div className="flex h-full flex-col">
          <div className="mb-6">
            <h1 className="mb-2 text-2xl font-bold text-gray-800">Orders</h1>
            <p className="text-gray-600">Manage and view your orders</p>
          </div>

          <div className="flex-1 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="py-20 text-center">
              <svg
                className="mx-auto mb-4 h-16 w-16 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mb-2 text-lg font-medium text-gray-800">
                Orders Management
              </h3>
              <p className="text-gray-500">
                This page will contain order management functionality
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrdersPage;
