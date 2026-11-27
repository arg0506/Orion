/** Typed access to extension storage. `local` persists; `session` lives in memory until the browser closes. */
import { browser } from 'wxt/browser';
import type { EncryptedVault } from './keyring/vault';
import type { Family } from './networks';
import type { TrackedTx } from './chains/types';
import type { LogEntry } from './messages';

export interface Settings {
  showMainnets: boolean;
  autoLockMinutes: number;
  active: Record<Family, string>;
  customNetworks: { chainId: number; name: string; rpcUrl: string; symbol: string; explorerUrl?: string }[];
}

export interface Permission {
  origin: string;
  families: Family[];
  connectedAt: number;
}

interface LocalShape {
  vault?: EncryptedVault;
  settings?: Settings;
  permissions?: Record<string, Permission>;
  txs?: TrackedTx[];
  log?: LogEntry[];
}
interface SessionShape {
  mnemonic?: string;
  lastActive?: number;
}

export const local = {
  async get<K extends keyof LocalShape>(key: K): Promise<LocalShape[K]> {
    return (await browser.storage.local.get(key))[key] as LocalShape[K];
  },
  set<K extends keyof LocalShape>(key: K, value: LocalShape[K]) {
    return browser.storage.local.set({ [key]: value });
  },
  remove(keys: (keyof LocalShape)[]) {
    return browser.storage.local.remove(keys as string[]);
  },
};

export const session = {
  async get<K extends keyof SessionShape>(key: K): Promise<SessionShape[K]> {
    return (await browser.storage.session.get(key))[key] as SessionShape[K];
  },
  set<K extends keyof SessionShape>(key: K, value: SessionShape[K]) {
    return browser.storage.session.set({ [key]: value });
  },
  clear() {
    return browser.storage.session.clear();
  },
};
