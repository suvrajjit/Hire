import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('System: Initializing Hired.OS...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('System Error: Root element not found.');
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('System: Mount successful.');
} catch (error) {
  console.error('System Critical Error during mount:', error);
}