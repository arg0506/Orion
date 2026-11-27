import type { Family, Network } from '../networks';

export type TxStatus = 'pending' | 'confirmed' | 'failed' | 'expired' | 'replaced';
export type Speed = 'normal' | 'fast';

/** A transaction Orion submitted and is still tracking. Stored in extension storage. */
export interface TrackedTx {
  id: string;
  family: Family;
  networkId: string;
  hash: string;
  from: string;
  to: string;
  /** Human-readable amount in the native token, e.g. "0.5" */
  amount: string;
  symbol: string;
  memo?: string;
  createdAt: number;
  status: TxStatus;
  /** Why this tx exists: a normal send, a dapp request, or a replacement */
  kind: 'send' | 'dapp' | 'cancel' | 'speedup';
  origin?: string;
  /** id of the tx this one replaces (for cancel / speed-up) */
  replaces?: string;
  replacedBy?: string;
  error?: string;
  /** When a Solana / Stellar tx can no longer land (ms epoch), if known */
  expiresAt?: number;
  /** Chain-specific data needed to replace or rebroadcast */
  evm?: { nonce: number; to: string; value: string; data?: string; gas: string; maxFeePerGas: string; maxPriorityFeePerGas: string; chainId: number };
  solana?: { raw: string; lastValidBlockHeight: number };
  stellar?: { xdr: string; sequence: string; fee: string; maxTime: number; feeBumpOf?: string };
}

export interface Balance {
  /** decimal string in the native unit */
  amount: string;
  /** whether the account exists on chain (Stellar requires funding) */
  exists: boolean;
}

export interface SendParams {
  to: string;
  amount: string;
  memo?: string;
  speed: Speed;
}

export interface ChainAdapter<K> {
  family: Family;
  isValidAddress(address: string): boolean;
  getBalance(net: Network, address: string): Promise<Balance>;
  send(net: Network, keys: K, p: SendParams): Promise<TrackedTx>;
  getStatus(net: Network, tx: TrackedTx): Promise<{ status: TxStatus; error?: string }>;
  /** Re-send the same transaction with higher fees. Undefined where the chain can't do it safely. */
  speedUp?(net: Network, keys: K, tx: TrackedTx): Promise<TrackedTx>;
  /** Replace a pending transaction with a no-op so it can never land. */
  cancel?(net: Network, keys: K, tx: TrackedTx): Promise<TrackedTx>;
  /** Called while pending (e.g. Solana rebroadcast). */
  keepAlive?(net: Network, tx: TrackedTx): Promise<void>;
  faucet?(net: Network, address: string): Promise<string>;
}

export const newId = () => crypto.randomUUID();

/** Decimal string -> integer units, without floating point. */
export function toUnits(amount: string, decimals: number): bigint {
  const clean = amount.trim();
  if (!/^\d*\.?\d*$/.test(clean) || clean === '' || clean === '.') throw new Error('Enter a valid amount');
  const [whole, frac = ''] = clean.split('.');
  if (frac.length > decimals) throw new Error(`At most ${decimals} decimal places`);
  return BigInt(whole || '0') * 10n ** BigInt(decimals) + BigInt((frac + '0'.repeat(decimals)).slice(0, decimals) || '0');
}

/** Integer units -> trimmed decimal string. */
export function fromUnits(units: bigint, decimals: number): string {
  const neg = units < 0n;
  const u = neg ? -units : units;
  const base = 10n ** BigInt(decimals);
  const whole = u / base;
  const frac = (u % base).toString().padStart(decimals, '0').replace(/0+$/, '');
  return `${neg ? '-' : ''}${whole}${frac ? '.' + frac : ''}`;
}
