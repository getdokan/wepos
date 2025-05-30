import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App';
import './styles/main.css';
import './store'; // Import to register all stores

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
    </React.StrictMode>,
  );
}
