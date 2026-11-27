import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/gloock/400.css';
import '@fontsource-variable/instrument-sans';
import '@fontsource/ibm-plex-mono/400.css';
import './styles.css';

export function boot(node: React.ReactNode) {
  createRoot(document.getElementById('root')!).render(<React.StrictMode>{node}</React.StrictMode>);
}
