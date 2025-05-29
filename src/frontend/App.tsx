import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/Home';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      {/* Future routes can be added here:
      <Route path="/orders" element={<OrdersPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/customers" element={<CustomersPage />} />
      <Route path="/reports" element={<ReportsPage />} />
      */}
    </Routes>
  );
};

export default App;
