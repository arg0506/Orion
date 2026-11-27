import { defineContentScript } from 'wxt/utils/define-content-script';
import { installEvm } from '@/src/inpage/evm';
import { installSolana } from '@/src/inpage/solana';
import { installStellar } from '@/src/inpage/stellar';

/** Runs in the page's own JavaScript world so dapps can see the providers. */
export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  runAt: 'document_start',
  world: 'MAIN',
  main() {
    installEvm();
    installSolana();
    installStellar();
  },
});
