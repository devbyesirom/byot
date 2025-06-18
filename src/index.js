import React from 'react';
import ReactDOM from 'react-dom/client'; // Note the '/client' for React 18
import App from './App'; // Import your App component

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
