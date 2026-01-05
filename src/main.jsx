import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // Importante: Esto carga los estilos definidos en el Canvas

/**
 * Renderizado principal de Verzing.
 * React.StrictMode ayuda a identificar problemas potenciales durante el desarrollo.
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)