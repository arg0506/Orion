/** EIP-1193 provider, announced through EIP-6963 so it coexists with other wallets. */
import { rpc, onWalletEvent } from './transport';
import { ORION_ICON } from './icon';

type Handler = (...args: any[]) => void;

class OrionEthereumProvider {
  readonly isOrion = true;
  readonly isMetaMask = false;
  chainId: string | null = null;
  selectedAddress: string | null = null;
  private handlers = new Map<string, Set<Handler>>();

  constructor() {
    onWalletEvent((e) => {
      if (!e?.evm) return;
      const { accounts, chainId } = e.evm as { accounts: string[]; chainId: string };
      if (chainId !== this.chainId) {
        const first = this.chainId === null;
        this.chainId = chainId;
        if (!first) this.emit('chainChanged', chainId);
      }
      const now = accounts[0] ?? null;
      if (now !== this.selectedAddress) {
        this.selectedAddress = now;
        this.emit('accountsChanged', accounts);
      }
    });
    rpc<string>('evm', 'eth_chainId')
      .then((id) => {
        this.chainId = id;
        this.emit('connect', { chainId: id });
      })
      .catch(() => {});
  }

  async request({ method, params }: { method: string; params?: unknown[] | object }) {
    const result = await rpc('evm', method, params);
    if (method === 'eth_requestAccounts' || method === 'eth_accounts') this.selectedAddress = (result as string[])[0] ?? null;
    if (method === 'eth_chainId') this.chainId = result as string;
    return result;
  }

  on(event: string, fn: Handler) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(fn);
    return this;
  }
  removeListener(event: string, fn: Handler) {
    this.handlers.get(event)?.delete(fn);
    return this;
  }
  off = this.removeListener;
  private emit(event: string, ...args: any[]) {
    this.handlers.get(event)?.forEach((fn) => {
      try {
        fn(...args);
      } catch (err) {
        console.error(err);
      }
    });
  }
  /** Legacy helpers some older dapps still call. */
  enable() {
    return this.request({ method: 'eth_requestAccounts' });
  }
  isConnected() {
    return this.chainId !== null;
  }
}

export function installEvm() {
  const provider = new OrionEthereumProvider();
  const info = Object.freeze({ uuid: crypto.randomUUID(), name: 'Orion', icon: ORION_ICON, rdns: 'app.orion.wallet' });
  const announce = () => window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail: Object.freeze({ info, provider }) }));
  window.addEventListener('eip6963:requestProvider', announce);
  announce();
  // Only claim window.ethereum if no other wallet did; EIP-6963 is the proper route.
  if (!(window as any).ethereum) {
    try {
      Object.defineProperty(window, 'ethereum', { value: provider, configurable: true, writable: false });
    } catch {
      /* another wallet locked it */
    }
  }
  return provider;
}
