import { browser } from 'wxt/browser';
import { defineContentScript } from 'wxt/utils/define-content-script';

/** Isolated-world relay between the page and the background service worker. */
export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  runAt: 'document_start',
  main() {
    window.addEventListener('message', async (e) => {
      if (e.source !== window || e.data?.target !== 'orion-content') return;
      const { id, family, method, params } = e.data;
      let reply;
      try {
        reply = await browser.runtime.sendMessage({ type: 'orion:dapp', req: { family, method, params } });
      } catch (err: any) {
        reply = { ok: false, error: { code: -32603, message: 'Orion was updated or restarted. Reload the page.' } };
      }
      window.postMessage({ target: 'orion-inpage', id, reply }, window.location.origin);
    });

    browser.runtime.onMessage.addListener((msg: any) => {
      if (msg?.type === 'orion:event') window.postMessage({ target: 'orion-inpage', event: msg }, window.location.origin);
    });
  },
});
