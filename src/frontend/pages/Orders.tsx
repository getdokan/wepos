import React from 'react';
import { ShoppingBag } from 'lucide-react';
import Layout from '../components/Layout';

const OrdersPage: React.FC = () => {
  return (
    <Layout>
      <div className="flex-1 bg-background p-6">
        <div className="flex h-full flex-col">
          <div className="mb-6">
            <h1 className="mb-2 text-2xl font-bold text-foreground">Orders</h1>
            <p className="text-muted-foreground">Manage and view your orders</p>
          </div>

          <div className="flex-1 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="py-20 text-center">
              <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
              <h3 className="mb-2 text-lg font-medium text-foreground">
                Orders Management
              </h3>
              <p className="text-muted-foreground">
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
