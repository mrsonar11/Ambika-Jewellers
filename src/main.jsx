import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { RateProvider } from './contexts/RateContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <RateProvider>
      <AuthProvider>
        <App />
        <Toaster />
      </AuthProvider>
    </RateProvider>
  </ThemeProvider>
);