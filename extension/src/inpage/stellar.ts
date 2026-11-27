/** SEP-43 style Stellar wallet interface, exposed at window.orion.stellar. Errors are returned, not thrown. */
import { rpc, OrionRpcError, onWalletEvent } from './transport';

const wrap = <T>(p: Promise<T>) => p.catch((e: OrionRpcError) => ({ error: { code: e.code ?? -1, message: e.message } }));

export function installStellar() {
  const listeners = new Set<(e: { address: string | null; network: string; networkPassphrase: string }) => void>();
  onWalletEvent((e) => e?.stellar && listeners.forEach((l) => l(e.stellar)));

  const api = Object.freeze({
    isConnected: () => wrap(rpc('stellar', 'isConnected')),
    isAllowed: () => wrap(rpc('stellar', 'isAllowed')),
    requestAccess: () => wrap(rpc('stellar', 'requestAccess')),
    getAddress: () => wrap(rpc('stellar', 'getAddress')),
    getNetwork: () => wrap(rpc('stellar', 'getNetwork')),
    signTransaction: (xdr: string, opts?: { networkPassphrase?: string; address?: string }) => wrap(rpc('stellar', 'signTransaction', { xdr, opts })),
    signMessage: (message: string, opts?: { networkPassphrase?: string; address?: string }) => wrap(rpc('stellar', 'signMessage', { message, opts })),
    signAuthEntry: async () => ({ error: { code: 4200, message: 'signAuthEntry is not supported yet' } }),
    onChange: (fn: (e: any) => void) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  });

  const w = window as any;
  w.orion = Object.freeze({ ...(w.orion ?? {}), stellar: api });
  window.dispatchEvent(new Event('orion:stellar#initialized'));
}
