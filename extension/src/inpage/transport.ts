/** Page-side half of the bridge: posts requests to the content script and matches replies by id. */
import type { Family } from '../lib/networks';

type Reply = { ok: true; result: any } | { ok: false; error: { code: number; message: string } };
const pending = new Map<string, (r: Reply) => void>();
const listeners = new Set<(e: any) => void>();

export class OrionRpcError extends Error {
  constructor(public code: number, message: string) {
    super(message);
  }
}

window.addEventListener('message', (e) => {
  if (e.source !== window || e.data?.target !== 'orion-inpage') return;
  if (e.data.event) return listeners.forEach((l) => l(e.data.event));
  const cb = pending.get(e.data.id);
  if (cb) {
    pending.delete(e.data.id);
    cb(e.data.reply);
  }
});

export function rpc<T = any>(family: Family, method: string, params?: unknown): Promise<T> {
  const id = crypto.randomUUID();
  return new Promise<T>((resolve, reject) => {
    pending.set(id, (r) => (r.ok ? resolve(r.result) : reject(new OrionRpcError(r.error.code, r.error.message))));
    window.postMessage({ target: 'orion-content', id, family, method, params }, window.location.origin);
  });
}

export const onWalletEvent = (fn: (e: any) => void) => listeners.add(fn);
