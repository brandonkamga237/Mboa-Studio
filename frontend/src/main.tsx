import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#FDFAF7',
          color: '#1E2D4A',
          border: '1px solid #D1C9BE',
          borderRadius: '6px',
          fontSize: '13px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
          fontFamily: 'Source Sans 3, sans-serif',
        },
        success: { iconTheme: { primary: '#15803D', secondary: '#FDFAF7' } },
        error:   { iconTheme: { primary: '#DC2626', secondary: '#FDFAF7' } },
        duration: 3000,
      }}
    />
    <App />
  </React.StrictMode>
);
