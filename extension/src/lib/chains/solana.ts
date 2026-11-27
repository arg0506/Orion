import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js';
import { ed25519 } from '@noble/curves/ed25519.js';
import bs58 from 'bs58';
import type { Network } from '../networks';
import { type ChainAdapter, type TrackedTx, fromUnits, newId, toUnits } from './types';

export type SolanaKeys = { keypair: Keypair };
export const solanaKeysFromSeed = (seed32: Uint8Array): SolanaKeys => ({ keypair: Keypair.fromSeed(seed32) });

const conns = new Map<string, Connection>();
export function solanaConnection(net: Network) {
  let c = conns.get(net.rpcUrl);
  if (!c) {
    c = new Connection(net.rpcUrl, { commitment: 'confirmed' });
    conns.set(net.rpcUrl, c);
  }
  return c;
}

/** Average slot is ~400ms; a blockhash stays valid for 150 blocks (~60s). */
const SLOT_MS = 400;
const toBase64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
const fromBase64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/** Priority fee in micro-lamports per compute unit. */
export async function priorityFee(conn: Connection, speed: 'normal' | 'fast'): Promise<number> {
  try {
    const recent = (await conn.getRecentPrioritizationFees()).map((f) => f.prioritizationFee).filter((f) => f > 0).sort((a, b) => a - b);
    if (recent.length) {
      const pct = recent[Math.floor(recent.length * (speed === 'fast' ? 0.75 : 0.5))] ?? 0;
      return Math.max(pct, speed === 'fast' ? 10_000 : 1_000);
    }
  } catch {
    /* fall through */
  }
  return speed === 'fast' ? 50_000 : 5_000;
}

/** Pure builder: a SOL transfer with a compute budget, so it can be tested without a network. */
export function buildTransfer(p: { from: Keypair; to: PublicKey; lamports: bigint; blockhash: string; microLamports: number }) {
  const tx = new Transaction({ feePayer: p.from.publicKey, recentBlockhash: p.blockhash });
  tx.add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: p.microLamports }),
    SystemProgram.transfer({ fromPubkey: p.from.publicKey, toPubkey: p.to, lamports: p.lamports })
  );
  tx.sign(p.from);
  return tx;
}

export function isSolanaAddress(a: string) {
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a)) return false;
  try {
    return new PublicKey(a).toBase58() === a;
  } catch {
    return false;
  }
}

export const solanaAdapter: ChainAdapter<SolanaKeys> & {
  signTransactionBytes(keys: SolanaKeys, bytes: Uint8Array): Uint8Array;
  sendSignedBytes(net: Network, signed: Uint8Array, meta: { from: string; origin?: string }): Promise<TrackedTx>;
  signMessage(keys: SolanaKeys, message: Uint8Array): Uint8Array;
  describeTransaction(bytes: Uint8Array): { instructions: number; programs: string[]; transfers: { to: string; sol: string }[] };
} = {
  family: 'solana',
  isValidAddress: isSolanaAddress,

  async getBalance(net, address) {
    const lamports = await solanaConnection(net).getBalance(new PublicKey(address), 'confirmed');
    return { amount: fromUnits(BigInt(lamports), 9), exists: true };
  },

  async send(net, keys, p) {
    const conn = solanaConnection(net);
    const to = new PublicKey(p.to);
    const lamports = toUnits(p.amount, 9);
    // Sending to a brand-new account must at least cover rent exemption, or the transfer fails.
    const [toInfo, rentMin] = await Promise.all([conn.getAccountInfo(to), conn.getMinimumBalanceForRentExemption(0)]);
    if (!toInfo && lamports < BigInt(rentMin)) {
      throw new Error(`This address is new, so send at least ${fromUnits(BigInt(rentMin), 9)} SOL (the rent-exempt minimum).`);
    }
    const [{ blockhash, lastValidBlockHeight }, microLamports, height] = await Promise.all([
      conn.getLatestBlockhash('confirmed'),
      priorityFee(conn, p.speed),
      conn.getBlockHeight('confirmed'),
    ]);
    const tx = buildTransfer({ from: keys.keypair, to, lamports, blockhash, microLamports });
    const raw = tx.serialize();
    const sig = await conn.sendRawTransaction(raw, { skipPreflight: false, maxRetries: 0, preflightCommitment: 'confirmed' });
    return {
      id: newId(),
      family: 'solana',
      networkId: net.id,
      hash: sig,
      from: keys.keypair.publicKey.toBase58(),
      to: to.toBase58(),
      amount: fromUnits(lamports, 9),
      symbol: 'SOL',
      createdAt: Date.now(),
      status: 'pending',
      kind: 'send',
      expiresAt: Date.now() + Math.max(0, lastValidBlockHeight - height) * SLOT_MS,
      solana: { raw: toBase64(raw), lastValidBlockHeight },
    };
  },

  async getStatus(net, tx) {
    const conn = solanaConnection(net);
    const { value } = await conn.getSignatureStatuses([tx.hash], { searchTransactionHistory: true });
    const s = value[0];
    if (s) {
      if (s.err) return { status: 'failed', error: JSON.stringify(s.err) };
      if (s.confirmationStatus === 'confirmed' || s.confirmationStatus === 'finalized') return { status: 'confirmed' };
      return { status: 'pending' };
    }
    // Not seen. Once the block height passes lastValidBlockHeight the tx can never land.
    if (tx.solana) {
      const height = await conn.getBlockHeight('confirmed');
      if (height > tx.solana.lastValidBlockHeight) return { status: 'expired' };
    }
    return { status: 'pending' };
  },

  /** Rebroadcast while pending: Solana drops transactions under load, resending is how wallets land them. */
  async keepAlive(net, tx) {
    if (!tx.solana) return;
    try {
      await solanaConnection(net).sendRawTransaction(fromBase64(tx.solana.raw), { skipPreflight: true, maxRetries: 0 });
    } catch {
      /* already processed or expired */
    }
  },

  async faucet(net, address) {
    const sol = net.kind === 'local' ? 10 : 1;
    const conn = solanaConnection(net);
    const sig = await conn.requestAirdrop(new PublicKey(address), sol * LAMPORTS_PER_SOL);
    const bh = await conn.getLatestBlockhash();
    await conn.confirmTransaction({ signature: sig, ...bh }, 'confirmed');
    return `Airdropped ${sol} SOL`;
  },

  signTransactionBytes(keys, bytes) {
    const tx = VersionedTransaction.deserialize(bytes);
    tx.sign([keys.keypair]);
    return tx.serialize();
  },

  async sendSignedBytes(net, signed, meta) {
    const conn = solanaConnection(net);
    const sig = await conn.sendRawTransaction(signed, { skipPreflight: false, maxRetries: 0 });
    let lastValidBlockHeight = 0;
    let expiresAt: number | undefined;
    try {
      const [{ lastValidBlockHeight: lv }, height] = await Promise.all([conn.getLatestBlockhash('confirmed'), conn.getBlockHeight('confirmed')]);
      lastValidBlockHeight = lv; // upper bound: the dapp's blockhash is at least this old
      expiresAt = Date.now() + Math.max(0, lv - height) * SLOT_MS;
    } catch {
      /* best effort */
    }
    return {
      id: newId(),
      family: 'solana',
      networkId: net.id,
      hash: sig,
      from: meta.from,
      to: '',
      amount: '',
      symbol: 'SOL',
      createdAt: Date.now(),
      status: 'pending',
      kind: 'dapp',
      origin: meta.origin,
      expiresAt,
      solana: { raw: toBase64(signed), lastValidBlockHeight },
    };
  },

  signMessage(keys, message) {
    return ed25519.sign(message, keys.keypair.secretKey.slice(0, 32));
  },

  describeTransaction(bytes) {
    const tx = VersionedTransaction.deserialize(bytes);
    const msg = tx.message;
    const keys = msg.staticAccountKeys;
    const programs = new Set<string>();
    const transfers: { to: string; sol: string }[] = [];
    for (const ix of msg.compiledInstructions) {
      const program = keys[ix.programIdIndex]?.toBase58() ?? 'lookup-table program';
      programs.add(program);
      // SystemProgram.transfer: u32 instruction index 2, then u64 lamports
      if (program === SystemProgram.programId.toBase58() && ix.data.length >= 12 && new DataView(ix.data.buffer, ix.data.byteOffset).getUint32(0, true) === 2) {
        const lamports = new DataView(ix.data.buffer, ix.data.byteOffset).getBigUint64(4, true);
        const toIndex = ix.accountKeyIndexes[1];
        const to = (toIndex !== undefined ? keys[toIndex]?.toBase58() : undefined) ?? 'unknown';
        transfers.push({ to, sol: fromUnits(lamports, 9) });
      }
    }
    return { instructions: msg.compiledInstructions.length, programs: [...programs], transfers };
  },
};

export { bs58 };
