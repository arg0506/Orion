import type { Family, Network } from './networks';
import type { TrackedTx, Speed } from './chains/types';

/** Error codes shared by every provider (EIP-1193 numbering, reused for Solana/Stellar). */
export const ERR = {
  userRejected: { code: 4001, message: 'The user rejected the request.' },
  unauthorized: { code: 4100, message: 'This site is not connected to Orion. Request access first.' },
  unsupported: { code: 4200, message: 'Orion does not support this method.' },
  locked: { code: 4100, message: 'Orion is locked. Unlock it and try again.' },
  unknownChain: { code: 4902, message: 'Unrecognized chain. Add it with wallet_addEthereumChain first.' },
  internal: { code: -32603, message: 'Internal error' },
} as const;

export class ProviderError extends Error {
  constructor(public code: number, message: string, public data?: unknown) {
    super(message);
  }
}
export const perr = (e: { code: number; message: string }, msg?: string) => new ProviderError(e.code, msg ?? e.message);

/** A request coming from a web page, relayed by the content script. */
export interface DappRequest {
  family: Family;
  method: string;
  params?: any;
  origin: string;
  tabId?: number;
  favicon?: string;
}

export type ApprovalKind = 'connect' | 'signMessage' | 'signTypedData' | 'sendTransaction' | 'signTransaction' | 'addChain';

export interface Approval {
  id: string;
  kind: ApprovalKind;
  family: Family;
  origin: string;
  favicon?: string;
  networkId?: string;
  /** Human-readable details for the approval screen */
  details: Record<string, any>;
  createdAt: number;
}

export interface LogEntry {
  id: string;
  at: number;
  origin: string;
  family: Family;
  method: string;
  params?: string;
  ok: boolean;
  result?: string;
  error?: string;
  ms: number;
}

export interface WalletView {
  hasVault: boolean;
  unlocked: boolean;
  accounts: Partial<Record<Family, string>>;
  active: Record<Family, string>;
  networks: Network[];
  showMainnets: boolean;
  autoLockMinutes: number;
}

/** Messages from the popup / approval window to the background. */
export type UiMessage =
  | { type: 'ui:state' }
  | { type: 'ui:create'; mnemonic: string; password: string }
  | { type: 'ui:unlock'; password: string }
  | { type: 'ui:lock' }
  | { type: 'ui:reveal'; password: string }
  | { type: 'ui:reset' }
  | { type: 'ui:setNetwork'; family: Family; networkId: string }
  | { type: 'ui:settings'; showMainnets?: boolean; autoLockMinutes?: number }
  | { type: 'ui:balance'; family: Family }
  | { type: 'ui:send'; family: Family; to: string; amount: string; memo?: string; speed: Speed }
  | { type: 'ui:speedUp'; id: string }
  | { type: 'ui:cancel'; id: string }
  | { type: 'ui:faucet'; family: Family }
  | { type: 'ui:txs' }
  | { type: 'ui:clearTxs' }
  | { type: 'ui:permissions' }
  | { type: 'ui:revoke'; origin: string }
  | { type: 'ui:log' }
  | { type: 'ui:clearLog' }
  | { type: 'ui:approval:get'; id: string }
  | { type: 'ui:approval:resolve'; id: string; approved: boolean };

export type UiResponse<T = any> = { ok: true; data: T } | { ok: false; error: string };

export type { TrackedTx };
