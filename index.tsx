import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { GlobalErrorHandler } from './components/GlobalErrorHandler';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <GlobalErrorHandler>
      <App />
    </GlobalErrorHandler>
  </React.StrictMode>
);
