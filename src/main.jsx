import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css' // Importante: Esto carga los estilos definidos en el Canvas

// Minimal error overlay so runtime errors are visible on the page
function showErrorOverlay(title, details) {
  try {
    let el = document.getElementById('error-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'error-overlay';
      el.style.position = 'fixed';
      el.style.inset = '0';
      el.style.padding = '24px';
      el.style.background = 'rgba(0,0,0,0.85)';
      el.style.color = '#fff';
      el.style.zIndex = '99999';
      el.style.overflow = 'auto';
      el.style.fontFamily = 'system-ui,Segoe UI,Roboto,Arial,monospace';
      el.style.whiteSpace = 'pre-wrap';
      document.body.appendChild(el);
    }
    el.innerHTML = `<h2 style="margin:0 0 8px 0;color:#ff9f1c">${title}</h2><pre style="margin:0;font-size:13px;line-height:1.4;">${(details||'').toString()}</pre>`;
  } catch (e) {
    // fallback to console
    // eslint-disable-next-line no-console
    console.error('Error overlay failed', e);
  }
}

window.addEventListener('error', (e) => {
  try { e.preventDefault(); } catch (er) {}
  showErrorOverlay('Runtime Error', (e.error && (e.error.stack || e.error.message)) || e.message || String(e));
  // eslint-disable-next-line no-console
  console.error(e.error || e.message || e);
});
window.addEventListener('unhandledrejection', (e) => {
  try { e.preventDefault(); } catch (er) {}
  const reason = e.reason || (e.detail && e.detail.reason) || e;
  showErrorOverlay('Unhandled Rejection', (reason && (reason.stack || reason.message)) || String(reason));
  // eslint-disable-next-line no-console
  console.error(reason);
});

// Import the app after overlay is ready so we can capture module errors
import('./App.jsx').then(({ default: App }) => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}).catch(err => {
  showErrorOverlay('Failed to load app', err && (err.stack || err.message) || String(err));
  // eslint-disable-next-line no-console
  console.error('Failed to import App:', err);
});