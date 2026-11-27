import { describe, expect, it } from 'vitest';
import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { ed25519 } from '@noble/curves/ed25519.js';
import { buildTransfer, isSolanaAddress, solanaAdapter } from './solana';
import { deriveSolanaSeed, seedFromMnemonic } from '../keyring/derive';

const seed = seedFromMnemonic('test test test test test test test test test test test junk');
const keys = { keypair: Keypair.fromSeed(deriveSolanaSeed(seed, 0)) };
const to = Keypair.fromSeed(deriveSolanaSeed(seed, 1)).publicKey;
const blockhash = '11111111111111111111111111111111';

describe('Solana transfers', () => {
  it('builds a signed transfer with a priority fee and compute limit', () => {
    const tx = buildTransfer({ from: keys.keypair, to, lamports: 1_500_000_000n, blockhash, microLamports: 50_000 });
    expect(tx.instructions).toHaveLength(3);
    expect(tx.verifySignatures()).toBe(true);
    const d = solanaAdapter.describeTransaction(tx.serialize());
    expect(d.transfers).toEqual([{ to: to.toBase58(), sol: '1.5' }]);
    expect(d.programs).toContain(SystemProgram.programId.toBase58());
  });

  it('signs transactions a dapp hands over (wallet-standard bytes)', () => {
    const unsigned = buildTransfer({ from: keys.keypair, to, lamports: 1n, blockhash, microLamports: 1 });
    const bytes = unsigned.serialize({ requireAllSignatures: false, verifySignatures: false });
    const signed = solanaAdapter.signTransactionBytes(keys, bytes);
    expect(signed.length).toBe(bytes.length);
  });

  it('signs messages verifiably', () => {
    const msg = new TextEncoder().encode('Sign in to Orion test');
    const sig = solanaAdapter.signMessage(keys, msg);
    expect(ed25519.verify(sig, msg, keys.keypair.publicKey.toBytes())).toBe(true);
  });

  it('validates addresses', () => {
    expect(isSolanaAddress(to.toBase58())).toBe(true);
    expect(isSolanaAddress('not-an-address')).toBe(false);
    expect(isSolanaAddress(new PublicKey(0).toBase58())).toBe(true);
  });
});
