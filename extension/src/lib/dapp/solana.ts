import bs58 from 'bs58';
import type { DappRequest } from '../messages';
import { ERR, perr, ProviderError } from '../messages';
import { requestApproval } from '../approvals';
import { activeNetwork, addresses, allNetworks, isPermitted, isUnlocked, keys, revoke, upsertTx } from '../wallet';
import { solanaAdapter } from '../chains/solana';
import { ensureConnected, requirePermission } from './connect';
import { startTracking } from '../tracker';

const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const toB64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));

async function netForChain(chain?: string) {
  if (chain) {
    const n = (await allNetworks()).find((x) => x.family === 'solana' && x.caip === chain);
    if (n) return n;
  }
  return activeNetwork('solana');
}

export async function handleSolana(req: DappRequest): Promise<unknown> {
  const p = req.params ?? {};
  switch (req.method) {
    case 'getState': {
      const ok = (await isPermitted(req.origin, 'solana')) && (await isUnlocked());
      return { accounts: ok ? [(await addresses()).solana] : [], chain: (await activeNetwork('solana')).caip };
    }
    case 'connect': {
      if (p.onlyIfTrusted && !((await isPermitted(req.origin, 'solana')) && (await isUnlocked()))) throw perr(ERR.userRejected);
      await ensureConnected(req);
      return { accounts: [(await addresses()).solana], chain: (await activeNetwork('solana')).caip };
    }
    case 'disconnect':
      await revoke(req.origin, 'solana');
      return null;

    case 'signTransaction':
    case 'signAndSendTransaction': {
      await requirePermission(req);
      const net = await netForChain(p.chain);
      const bytes = fromB64(p.transaction);
      let summary;
      try {
        summary = solanaAdapter.describeTransaction(bytes);
      } catch {
        throw new ProviderError(-32602, 'Could not read this transaction');
      }
      const send = req.method === 'signAndSendTransaction';
      await requestApproval({ kind: send ? 'sendTransaction' : 'signTransaction', family: 'solana', origin: req.origin, favicon: req.favicon, networkId: net.id, details: { ...summary, send } });
      const k = await keys();
      const signed = solanaAdapter.signTransactionBytes(k.solana, bytes);
      if (!send) return { signedTransaction: toB64(signed) };
      const tracked = await solanaAdapter.sendSignedBytes(net, signed, { from: k.solana.keypair.publicKey.toBase58(), origin: req.origin });
      await upsertTx(tracked);
      startTracking();
      return { signature: toB64(bs58.decode(tracked.hash)) };
    }

    case 'signMessage': {
      await requirePermission(req);
      const msg = fromB64(p.message);
      let text: string;
      try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(msg);
      } catch {
        text = `0x${Array.from(msg, (b) => b.toString(16).padStart(2, '0')).join('')}`;
      }
      await requestApproval({ kind: 'signMessage', family: 'solana', origin: req.origin, favicon: req.favicon, details: { message: text } });
      const k = await keys();
      return { signature: toB64(solanaAdapter.signMessage(k.solana, msg)) };
    }
  }
  throw perr(ERR.unsupported, `Orion does not support ${req.method} on Solana`);
}
