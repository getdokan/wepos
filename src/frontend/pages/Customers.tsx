import React from 'react';
import { Users } from 'lucide-react';
import Layout from '../components/Layout';

const CustomersPage: React.FC = () => {
  return (
    <Layout>
      <div className="flex-1 bg-background p-6">
        <div className="flex h-full flex-col">
          <div className="mb-6">
            <h1 className="mb-2 text-2xl font-bold text-foreground">Customers</h1>
            <p className="text-muted-foreground">
              Manage customer information and history
            </p>
          </div>

          <div className="flex-1 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="py-20 text-center">
              <Users className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
              <h3 className="mb-2 text-lg font-medium text-foreground">
                Customer Management
              </h3>
              <p className="text-muted-foreground">
                This page will contain customer management functionality
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CustomersPage;
