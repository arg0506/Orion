/** Solana Wallet Standard wallet: Phantom-style dapps discover Orion automatically. */
import { registerWallet } from '@wallet-standard/wallet';
import type { Wallet, WalletAccount, IdentifierString } from '@wallet-standard/base';
import bs58 from 'bs58';
import { rpc, onWalletEvent } from './transport';
import { ORION_ICON } from './icon';

const CHAINS = ['solana:mainnet', 'solana:devnet', 'solana:testnet', 'solana:localnet'] as const;
const FEATURES = ['solana:signTransaction', 'solana:signAndSendTransaction', 'solana:signMessage'] as const;
const toB64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

function account(address: string): WalletAccount {
  return Object.freeze({ address, publicKey: bs58.decode(address), chains: CHAINS as unknown as IdentifierString[], features: FEATURES as unknown as IdentifierString[], label: 'Orion' });
}

class OrionSolanaWallet implements Wallet {
  readonly version = '1.0.0' as const;
  readonly name = 'Orion';
  readonly icon = ORION_ICON as `data:image/svg+xml;base64,${string}`;
  readonly chains = CHAINS as unknown as IdentifierString[];
  #accounts: WalletAccount[] = [];
  #listeners = new Set<(p: { accounts?: readonly WalletAccount[] }) => void>();

  constructor() {
    onWalletEvent((e) => {
      if (!e?.solana) return;
      const next: string[] = e.solana.accounts;
      if (next.join() !== this.#accounts.map((a) => a.address).join()) this.#set(next);
    });
    rpc('solana', 'getState').then((s) => this.#set(s.accounts)).catch(() => {});
  }

  get accounts() {
    return this.#accounts;
  }

  #set(addresses: string[]) {
    this.#accounts = addresses.map(account);
    this.#listeners.forEach((l) => l({ accounts: this.#accounts }));
  }

  get features() {
    return {
      'standard:connect': {
        version: '1.0.0',
        connect: async (input?: { silent?: boolean }) => {
          const r = await rpc('solana', 'connect', { onlyIfTrusted: !!input?.silent });
          this.#set(r.accounts);
          return { accounts: this.#accounts };
        },
      },
      'standard:disconnect': {
        version: '1.0.0',
        disconnect: async () => {
          await rpc('solana', 'disconnect');
          this.#set([]);
        },
      },
      'standard:events': {
        version: '1.0.0',
        on: (_event: 'change', listener: (p: { accounts?: readonly WalletAccount[] }) => void) => {
          this.#listeners.add(listener);
          return () => this.#listeners.delete(listener);
        },
      },
      'solana:signTransaction': {
        version: '1.0.0',
        supportedTransactionVersions: ['legacy', 0],
        signTransaction: async (...inputs: { transaction: Uint8Array; chain?: string }[]) => {
          const out = [];
          for (const i of inputs) {
            const r = await rpc('solana', 'signTransaction', { transaction: toB64(i.transaction), chain: i.chain });
            out.push({ signedTransaction: fromB64(r.signedTransaction) });
          }
          return out;
        },
      },
      'solana:signAndSendTransaction': {
        version: '1.0.0',
        supportedTransactionVersions: ['legacy', 0],
        signAndSendTransaction: async (...inputs: { transaction: Uint8Array; chain: string }[]) => {
          const out = [];
          for (const i of inputs) {
            const r = await rpc('solana', 'signAndSendTransaction', { transaction: toB64(i.transaction), chain: i.chain });
            out.push({ signature: fromB64(r.signature) });
          }
          return out;
        },
      },
      'solana:signMessage': {
        version: '1.0.0',
        signMessage: async (...inputs: { message: Uint8Array }[]) => {
          const out = [];
          for (const i of inputs) {
            const r = await rpc('solana', 'signMessage', { message: toB64(i.message) });
            out.push({ signedMessage: i.message, signature: fromB64(r.signature), signatureType: 'ed25519' as const });
          }
          return out;
        },
      },
    };
  }
}

export function installSolana() {
  registerWallet(new OrionSolanaWallet() as unknown as Wallet);
}
