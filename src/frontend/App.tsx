import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/Home';
import OrdersPage from './pages/Orders';
import CustomersPage from './pages/Customers';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/orders" element={<OrdersPage />} />
      <Route path="/customers" element={<CustomersPage />} />
    </Routes>
  );
};

export default App;
