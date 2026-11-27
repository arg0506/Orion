/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MultiAccountChecker from './pages/MultiAccountChecker';
import LandingPage from './pages/LandingPage';
const DeveloperHub = lazy(() => import('./pages/DeveloperHub'));
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
              <Route path="developer" element={<Suspense fallback={null}><DeveloperHub /></Suspense>} />
            </Route>
          </Routes>
        </HashRouter>
        
        {/* Toast notifications config */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#121729',
              color: '#eef1fa',
              border: '1px solid #232a42',
              fontFamily: 'inherit',
              fontSize: '14px',
              borderRadius: '12px',
              padding: '10px 16px',
              backdropFilter: 'blur(12px)',
            },
            success: {
              iconTheme: {
                primary: '#5bd6a0',
                secondary: '#0b0e1a',
              },
            },
            error: {
              iconTheme: {
                primary: '#ff6b7a',
                secondary: '#0b0e1a',
              },
            },
          }}
        />
      </WalletProvider>
    </AuthProvider>
  );
}
