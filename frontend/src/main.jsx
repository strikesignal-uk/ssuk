import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

console.log('[SS] main.jsx loaded, mounting React...');

try {
  ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
  );
  console.log('[SS] React mounted successfully');
} catch (e) {
  console.error('[SS] React mount error:', e);
  document.getElementById('root').innerHTML = '<div style="padding:32px;color:red;background:#020617;font-family:monospace;min-height:100vh"><h2>App failed to start:</h2><pre>' + e.message + '</pre></div>';
}
