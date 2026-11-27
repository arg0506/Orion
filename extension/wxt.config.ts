import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  srcDir: '.',
  vite: () => ({ plugins: [tailwindcss()] }),
  manifest: {
    name: 'Orion',
    description: 'A multi-chain wallet for developers: Ethereum & EVM, Solana and Stellar, with fast sends, cancel and speed-up.',
    permissions: ['storage', 'alarms', 'notifications'],
    host_permissions: ['http://*/*', 'https://*/*'],
    action: { default_title: 'Orion' },
    icons: { 16: 'icon/16.png', 32: 'icon/32.png', 48: 'icon/48.png', 128: 'icon/128.png' },
  },
});
