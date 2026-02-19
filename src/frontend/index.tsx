import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider } from '@wedevs/plugin-ui';
import App from './App';
import './styles/main.css';
import './store'; // Import to register all stores

// Get the root element
const container = document.getElementById('wepos-react-app');

const weposTokens = {
  primary: '#1ABC9C',
  primaryForeground: '#ffffff',
  secondary: '#3B80F4',
  border: '#E9EDF0',
  muted: '#BDC0C9',
  background: '#ffffff',
  foreground: '#192128',
  sidebar: '#192128',
  sidebarForeground: '#ffffff',
  sidebarPrimary: '#1ABC9C',
  sidebarPrimaryForeground: '#ffffff',
  sidebarAccent: '#1f2a35',
  sidebarAccentForeground: '#ffffff',
  sidebarBorder: '#1f2a35',
};

if (!container) {
  console.error('WePos: React app container not found');
} else {
  const root = createRoot(container);

  root.render(
    <React.StrictMode>
      <ThemeProvider pluginId="wepos" tokens={weposTokens}>
        <HashRouter>
          <App />
        </HashRouter>
      </ThemeProvider>
    </React.StrictMode>,
  );
}
