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
import DeveloperHub from './pages/DeveloperHub';
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
              <Route path="developer" element={<DeveloperHub />} />
            </Route>
          </Routes>
        </HashRouter>
        
        {/* Toast notifications config */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'rgba(9, 9, 11, 0.95)',
              color: '#f4f4f5',
              border: '1px solid rgba(39, 39, 42, 0.8)',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              borderRadius: '9999px',
              padding: '10px 16px',
              backdropFilter: 'blur(12px)',
            },
            success: {
              iconTheme: {
                primary: '#f4f4f5',
                secondary: '#09090b',
              },
            },
            error: {
              iconTheme: {
                primary: '#f43f5e',
                secondary: '#09090b',
              },
            },
          }}
        />
      </WalletProvider>
    </AuthProvider>
  );
}
