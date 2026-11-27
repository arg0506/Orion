import {
  Account,
  Asset,
  BASE_FEE,
  FeeBumpTransaction,
  Horizon,
  Keypair,
  Memo,
  Operation,
  StrKey,
  Transaction,
  TransactionBuilder,
  hash,
} from '@stellar/stellar-sdk';
import type { Network } from '../networks';
import { type ChainAdapter, type TrackedTx, newId } from './types';

export type StellarKeys = { keypair: Keypair };
export const stellarKeysFromSeed = (seed32: Uint8Array): StellarKeys => ({ keypair: Keypair.fromRawEd25519Seed(Buffer.from(seed32)) });

/**
 * stellar-core only replaces a queued transaction (same source + sequence)
 * if the new one pays at least 10x the fee. Cancel and speed-up both rely on this.
 */
export const REPLACE_BY_FEE_MULTIPLIER = 10;
const FAST_TIMEOUT_S = 30;
const NORMAL_TIMEOUT_S = 120;
const MEMO_MAX_BYTES = 28;

const servers = new Map<string, Horizon.Server>();
export function horizon(net: Network) {
  let s = servers.get(net.rpcUrl);
  if (!s) {
    s = new Horizon.Server(net.rpcUrl, { allowHttp: net.rpcUrl.startsWith('http://') });
    servers.set(net.rpcUrl, s);
  }
  return s;
}

async function feePerOp(net: Network, speed: 'normal' | 'fast') {
  try {
    const stats = await horizon(net).feeStats();
    const p = Number(speed === 'fast' ? stats.fee_charged.p90 : stats.fee_charged.p50);
    return String(Math.max(Number(BASE_FEE), p));
  } catch {
    return speed === 'fast' ? '1000' : BASE_FEE;
  }
}

// ── Pure builders (unit-tested offline) ─────────────────────────────────────

export function buildPayment(p: {
  source: Account;
  keypair: Keypair;
  to: string;
  amount: string;
  memo?: string;
  createsAccount: boolean;
  fee: string;
  passphrase: string;
  timeoutSeconds: number;
}) {
  const memo = p.memo?.trim();
  if (memo && new TextEncoder().encode(memo).length > MEMO_MAX_BYTES) throw new Error(`Memo is longer than ${MEMO_MAX_BYTES} bytes`);
  let b = new TransactionBuilder(p.source, { fee: p.fee, networkPassphrase: p.passphrase })
    .addOperation(
      p.createsAccount
        ? Operation.createAccount({ destination: p.to, startingBalance: p.amount })
        : Operation.payment({ destination: p.to, asset: Asset.native(), amount: p.amount })
    )
    .setTimeout(p.timeoutSeconds);
  if (memo) b = b.addMemo(Memo.text(memo));
  const tx = b.build();
  tx.sign(p.keypair);
  return tx;
}

/** Same source and sequence as the pending tx, a no-op bump, 10x the fee: whichever lands first wins. */
export function buildCancel(p: { keypair: Keypair; pending: Transaction; passphrase: string }) {
  const seq = BigInt(p.pending.sequence);
  const source = new Account(p.keypair.publicKey(), (seq - 1n).toString());
  const pendingFeePerOp = BigInt(p.pending.fee) / BigInt(p.pending.operations.length);
  const fee = (pendingFeePerOp * BigInt(REPLACE_BY_FEE_MULTIPLIER) + 1n).toString();
  const tx = new TransactionBuilder(source, { fee, networkPassphrase: p.passphrase })
    .addOperation(Operation.bumpSequence({ bumpTo: seq.toString() }))
    .setTimeout(FAST_TIMEOUT_S)
    .build();
  tx.sign(p.keypair);
  return tx;
}

/** Wrap the pending tx in a fee-bump paying 10x: the inner transaction (and its hash) stays the same. */
export function buildSpeedUp(p: { keypair: Keypair; pending: Transaction; passphrase: string }) {
  const pendingFeePerOp = BigInt(p.pending.fee) / BigInt(p.pending.operations.length);
  const baseFee = (pendingFeePerOp * BigInt(REPLACE_BY_FEE_MULTIPLIER) + 1n).toString();
  const fb = TransactionBuilder.buildFeeBumpTransaction(p.keypair, baseFee, p.pending, p.passphrase);
  fb.sign(p.keypair);
  return fb;
}

async function submitAsync(net: Network, tx: Transaction | FeeBumpTransaction) {
  const res = await horizon(net).submitAsyncTransaction(tx);
  if (res.tx_status === 'ERROR') throw new Error(`Rejected by the network (${res.error_result_xdr ? 'see explorer' : 'unknown reason'})`);
  if (res.tx_status === 'TRY_AGAIN_LATER') throw new Error('The network is busy. Try again with a higher fee.');
  return res.hash;
}

export const stellarAdapter: ChainAdapter<StellarKeys> & {
  signXdr(keys: StellarKeys, xdr: string, passphrase: string): string;
  signMessage(keys: StellarKeys, message: string): string;
} = {
  family: 'stellar',
  isValidAddress: (a) => StrKey.isValidEd25519PublicKey(a),

  async getBalance(net, address) {
    try {
      const acc = await horizon(net).loadAccount(address);
      const native = acc.balances.find((b: any) => b.asset_type === 'native');
      return { amount: native ? String(Number(native.balance)) : '0', exists: true };
    } catch (e: any) {
      if (e?.response?.status === 404) return { amount: '0', exists: false };
      throw e;
    }
  },

  async send(net, keys, p) {
    const server = horizon(net);
    const [source, fee, createsAccount] = await Promise.all([
      server.loadAccount(keys.keypair.publicKey()),
      feePerOp(net, p.speed),
      server
        .loadAccount(p.to)
        .then(() => false)
        .catch((e: any) => {
          if (e?.response?.status === 404) return true;
          throw e;
        }),
    ]);
    if (createsAccount && Number(p.amount) < 1) throw new Error('This address is new, so send at least 1 XLM to create it.');
    const timeout = p.speed === 'fast' ? FAST_TIMEOUT_S : NORMAL_TIMEOUT_S;
    const tx = buildPayment({ source, keypair: keys.keypair, to: p.to, amount: p.amount, memo: p.memo, createsAccount, fee, passphrase: net.passphrase!, timeoutSeconds: timeout });
    const h = await submitAsync(net, tx);
    const maxTime = Number(tx.timeBounds?.maxTime ?? 0) * 1000;
    return {
      id: newId(),
      family: 'stellar',
      networkId: net.id,
      hash: h,
      from: keys.keypair.publicKey(),
      to: p.to,
      amount: p.amount,
      symbol: 'XLM',
      memo: p.memo,
      createdAt: Date.now(),
      status: 'pending',
      kind: 'send',
      expiresAt: maxTime,
      stellar: { xdr: tx.toXDR(), sequence: tx.sequence, fee: tx.fee, maxTime },
    };
  },

  async getStatus(net, tx) {
    try {
      const rec: any = await horizon(net).transactions().transaction(tx.hash).call();
      return rec.successful ? { status: 'confirmed' } : { status: 'failed', error: 'Failed on the ledger' };
    } catch (e: any) {
      if (e?.response?.status !== 404) throw e;
      // Not in a ledger yet. After maxTime (+ a ledger of slack) it can never be included.
      if (tx.stellar?.maxTime && Date.now() > tx.stellar.maxTime + 6_000) return { status: 'expired' };
      return { status: 'pending' };
    }
  },

  async speedUp(net, keys, tx) {
    if (!tx.stellar) throw new Error('Missing transaction details');
    const inner = TransactionBuilder.fromXDR(tx.stellar.xdr, net.passphrase!) as Transaction;
    const fb = buildSpeedUp({ keypair: keys.keypair, pending: inner, passphrase: net.passphrase! });
    const h = await submitAsync(net, fb);
    return { ...tx, id: newId(), hash: h, createdAt: Date.now(), status: 'pending', kind: 'speedup', replaces: tx.id, stellar: { ...tx.stellar, fee: fb.fee, feeBumpOf: tx.hash } };
  },

  async cancel(net, keys, tx) {
    if (!tx.stellar) throw new Error('Missing transaction details');
    const inner = TransactionBuilder.fromXDR(tx.stellar.xdr, net.passphrase!) as Transaction;
    const c = buildCancel({ keypair: keys.keypair, pending: inner, passphrase: net.passphrase! });
    const h = await submitAsync(net, c);
    const maxTime = Number(c.timeBounds?.maxTime ?? 0) * 1000;
    return {
      ...tx,
      id: newId(),
      hash: h,
      to: keys.keypair.publicKey(),
      amount: '0',
      memo: undefined,
      createdAt: Date.now(),
      status: 'pending',
      kind: 'cancel',
      replaces: tx.id,
      expiresAt: maxTime,
      stellar: { xdr: c.toXDR(), sequence: c.sequence, fee: c.fee, maxTime },
    };
  },

  async faucet(net, address) {
    if (net.faucet?.kind !== 'friendbot' || !net.faucet.url) throw new Error('No faucet for this network');
    const res = await fetch(`${net.faucet.url}?addr=${encodeURIComponent(address)}`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (String(body?.detail ?? '').includes('already funded') || res.status === 400) throw new Error('Friendbot only funds new accounts. This one is already funded.');
      throw new Error('Friendbot could not fund this account');
    }
    return 'Funded with 10,000 XLM';
  },

  signXdr(keys, xdr, passphrase) {
    const tx = TransactionBuilder.fromXDR(xdr, passphrase);
    tx.sign(keys.keypair);
    return tx.toXDR();
  },

  /** SEP-53: sign sha256("Stellar Signed Message:\n" + message). Returns base64 signature. */
  signMessage(keys, message) {
    const payload = Buffer.concat([Buffer.from('Stellar Signed Message:\n'), Buffer.from(message)]);
    return keys.keypair.sign(hash(payload)).toString('base64');
  },
};

export type { TrackedTx };
