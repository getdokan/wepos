import React from 'react';
import Layout from '../components/Layout';

interface CustomersPageProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const CustomersPage: React.FC<CustomersPageProps> = ({ currentPage, onPageChange }) => {
  return (
    <Layout currentPage={currentPage} onPageChange={onPageChange}>
      <div className="wepos-content-product">
        <div className="flex flex-col h-full">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Customers</h1>
            <p className="text-gray-600">Manage customer information and history</p>
          </div>

          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center py-20">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Customer Management</h3>
              <p className="text-gray-500">This page will contain customer management functionality</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CustomersPage;
