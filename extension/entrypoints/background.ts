import '@/src/polyfills';
import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/utils/define-background';
import type { DappRequest, UiMessage, UiResponse } from '@/src/lib/messages';
import { ProviderError } from '@/src/lib/messages';
import * as W from '@/src/lib/wallet';
import { getApproval, resolveApproval } from '@/src/lib/approvals';
import { startTracking } from '@/src/lib/tracker';
import { logged } from '@/src/lib/log';
import { local } from '@/src/lib/store';
import { handleEvm } from '@/src/lib/dapp/evm';
import { handleSolana } from '@/src/lib/dapp/solana';
import { handleStellar } from '@/src/lib/dapp/stellar';

async function handleUi(msg: UiMessage): Promise<unknown> {
  switch (msg.type) {
    case 'ui:state':
      return W.view();
    case 'ui:create':
      await W.createVault(msg.mnemonic, msg.password);
      return W.view();
    case 'ui:unlock':
      await W.unlock(msg.password);
      return W.view();
    case 'ui:lock':
      await W.lock();
      return W.view();
    case 'ui:reveal':
      return W.revealPhrase(msg.password);
    case 'ui:reset':
      await W.resetWallet();
      return W.view();
    case 'ui:setNetwork': {
      const s = await W.getSettings();
      await W.saveSettings({ active: { ...s.active, [msg.family]: msg.networkId } });
      await W.broadcastAccounts();
      return W.view();
    }
    case 'ui:settings':
      await W.saveSettings({
        ...(msg.showMainnets !== undefined ? { showMainnets: msg.showMainnets } : {}),
        ...(msg.autoLockMinutes !== undefined ? { autoLockMinutes: msg.autoLockMinutes } : {}),
      });
      return W.view();
    case 'ui:balance': {
      const net = await W.activeNetwork(msg.family);
      const addr = (await W.addresses())[msg.family];
      return { ...(await W.adapterFor(msg.family).getBalance(net, addr)), networkId: net.id };
    }
    case 'ui:send': {
      const net = await W.activeNetwork(msg.family);
      const k = await W.keys();
      const tx = await W.adapterFor(msg.family).send(net, k[msg.family], { to: msg.to.trim(), amount: msg.amount, memo: msg.memo, speed: msg.speed });
      await W.upsertTx(tx);
      startTracking();
      return tx;
    }
    case 'ui:speedUp':
    case 'ui:cancel': {
      const list = await W.txs();
      const orig = list.find((t) => t.id === msg.id);
      if (!orig || orig.status !== 'pending') throw new Error('This transaction is no longer pending');
      const net = (await W.networkById(orig.networkId))!;
      const adapter = W.adapterFor(orig.family);
      const fn = msg.type === 'ui:cancel' ? adapter.cancel : adapter.speedUp;
      if (!fn) throw new Error(`${msg.type === 'ui:cancel' ? 'Cancelling' : 'Speeding up'} is not possible on this chain`);
      const k = await W.keys();
      const repl = await fn.call(adapter, net, k[orig.family], orig);
      await W.upsertTx(repl);
      await W.upsertTx({ ...orig, replacedBy: repl.id });
      startTracking();
      return repl;
    }
    case 'ui:faucet': {
      const net = await W.activeNetwork(msg.family);
      const f = W.adapterFor(msg.family).faucet;
      if (!f || !net.faucet || net.faucet.kind === 'link') throw new Error('No built-in faucet for this network');
      return f.call(W.adapterFor(msg.family), net, (await W.addresses())[msg.family]);
    }
    case 'ui:txs':
      return W.txs();
    case 'ui:clearTxs':
      await local.set('txs', (await W.txs()).filter((t) => t.status === 'pending'));
      return W.txs();
    case 'ui:permissions':
      return Object.values(await W.permissions());
    case 'ui:revoke':
      await W.revoke(msg.origin);
      return Object.values(await W.permissions());
    case 'ui:log':
      return (await local.get('log')) ?? [];
    case 'ui:clearLog':
      await local.set('log', []);
      return [];
    case 'ui:approval:get':
      return getApproval(msg.id) ?? null;
    case 'ui:approval:resolve':
      await resolveApproval(msg.id, msg.approved, (msg as any).payload);
      return null;
  }
}

async function handleDapp(req: DappRequest) {
  return logged(req, () => {
    if (req.family === 'evm') return handleEvm(req);
    if (req.family === 'solana') return handleSolana(req);
    return handleStellar(req);
  });
}

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((msg: any, sender, sendResponse) => {
    if (msg?.type === 'orion:dapp') {
      // Trust the browser for the origin, never the page.
      const origin = sender.origin ?? (sender.url ? new URL(sender.url).origin : 'unknown');
      const req: DappRequest = { ...msg.req, origin, tabId: sender.tab?.id, favicon: sender.tab?.favIconUrl };
      handleDapp(req)
        .then((result) => sendResponse({ ok: true, result }))
        .catch((e: any) =>
          sendResponse({ ok: false, error: { code: e instanceof ProviderError ? e.code : e?.code ?? -32603, message: e?.shortMessage ?? e?.message ?? String(e) } })
        );
      return true;
    }
    if (typeof msg?.type === 'string' && msg.type.startsWith('ui:')) {
      // Only extension pages may drive the wallet UI API.
      if (sender.tab && !sender.url?.startsWith(browser.runtime.getURL('/' as any))) return;
      handleUi(msg as UiMessage)
        .then((data) => sendResponse({ ok: true, data } satisfies UiResponse))
        .catch((e: any) => sendResponse({ ok: false, error: e?.shortMessage ?? e?.message ?? String(e) } satisfies UiResponse));
      return true;
    }
  });

  browser.alarms.create('orion:autolock', { periodInMinutes: 1 });
  browser.alarms.onAlarm.addListener((a) => {
    if (a.name === 'orion:autolock') void W.autoLockCheck();
  });
  browser.runtime.onStartup.addListener(() => startTracking());
  startTracking();
});
