import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './styles/main.css';

// Get the root element
const container = document.getElementById('wepos-react-app');

if (!container) {
  console.error('WePos: React app container not found');
} else {
  const root = createRoot(container);

  root.render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>
  );
}
