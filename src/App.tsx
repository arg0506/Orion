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
              background: '#ffffff',
              color: '#141414',
              border: '1px solid #e4e2dc',
              boxShadow: '0 12px 32px -14px rgba(20,20,20,0.25)',
              fontFamily: 'inherit',
              fontSize: '14px',
              borderRadius: '12px',
              padding: '10px 16px',
              backdropFilter: 'blur(12px)',
            },
            success: {
              iconTheme: {
                primary: '#1f9d5c',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#d93b4b',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </WalletProvider>
    </AuthProvider>
  );
}
