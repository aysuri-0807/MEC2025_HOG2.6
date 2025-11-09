/**
 * React application entry point.
 * Initializes the React root and renders the App component with error handling.
 * 
 * @author Ammaar Shareef
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Error boundary for better error handling
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found!');
} else {
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  } catch (error) {
    console.error('Error rendering app:', error);
    rootElement.innerHTML = `
      <div style="padding: 20px; color: white; background: #1a0000; min-height: 100vh; display: flex; align-items: center; justify-content: center; flex-direction: column;">
        <h1>Error Loading Application</h1>
        <p>${error.message}</p>
        <p style="margin-top: 20px; font-size: 12px; opacity: 0.7;">Please check the browser console for more details.</p>
      </div>
    `;
  }
}



