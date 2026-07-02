/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MultiAccountChecker from './pages/MultiAccountChecker';
import LandingPage from './pages/LandingPage';
import { WalletProvider } from './context/WalletContext';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route element={<Layout />}>
              <Route path="terminal" element={<Dashboard />} />
              <Route path="monitor" element={<MultiAccountChecker />} />
            </Route>
          </Routes>
        </HashRouter>
        
        {/* Toast notifications config */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'rgba(15, 10, 30, 0.95)',
              color: '#f1f5f9',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontFamily: 'Share Tech Mono, monospace',
              fontSize: '13px',
              backdropFilter: 'blur(8px)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#0f0a1e',
              },
            },
            error: {
              iconTheme: {
                primary: '#f43f5e',
                secondary: '#0f0a1e',
              },
            },
          }}
        />
      </WalletProvider>
    </AuthProvider>
  );
}
