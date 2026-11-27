import { describe, expect, it } from 'vitest';
import { Account, Keypair, Operation, TransactionBuilder, hash } from '@stellar/stellar-sdk';
import { buildCancel, buildPayment, buildSpeedUp, REPLACE_BY_FEE_MULTIPLIER, stellarAdapter } from './stellar';
import { deriveStellarSeed, seedFromMnemonic } from '../keyring/derive';
import { STELLAR_TESTNET_PASSPHRASE as PASS } from '../networks';

const kp = Keypair.fromRawEd25519Seed(Buffer.from(deriveStellarSeed(seedFromMnemonic('test test test test test test test test test test test junk'), 0)));
const dest = Keypair.random().publicKey();
const pending = () =>
  buildPayment({ source: new Account(kp.publicKey(), '1000'), keypair: kp, to: dest, amount: '25', memo: 'invoice 7', createsAccount: false, fee: '200', passphrase: PASS, timeoutSeconds: 30 });

describe('Stellar payments', () => {
  it('builds a signed payment with memo and a 30s time bound', () => {
    const tx = pending();
    expect(tx.sequence).toBe('1001');
    expect(tx.operations[0]!.type).toBe('payment');
    expect(Number(tx.timeBounds!.maxTime) - Math.floor(Date.now() / 1000)).toBeLessThanOrEqual(30);
    expect(kp.verify(tx.hash(), tx.signatures[0]!.signature())).toBe(true);
  });
  it('uses createAccount for brand-new addresses', () => {
    const tx = buildPayment({ source: new Account(kp.publicKey(), '1'), keypair: kp, to: dest, amount: '2', createsAccount: true, fee: '100', passphrase: PASS, timeoutSeconds: 30 });
    expect(tx.operations[0]!.type).toBe('createAccount');
  });
  it('rejects memos over 28 bytes', () => {
    expect(() => buildPayment({ source: new Account(kp.publicKey(), '1'), keypair: kp, to: dest, amount: '1', memo: 'é'.repeat(15), createsAccount: false, fee: '100', passphrase: PASS, timeoutSeconds: 30 })).toThrow();
  });
});

describe('Stellar cancel and speed-up', () => {
  it('cancel reuses the same sequence with a no-op bump and 10x fee', () => {
    const p = pending();
    const c = buildCancel({ keypair: kp, pending: p, passphrase: PASS });
    expect(c.sequence).toBe(p.sequence);
    expect(c.operations[0]!.type).toBe('bumpSequence');
    expect(BigInt(c.fee)).toBeGreaterThanOrEqual(BigInt(p.fee) * BigInt(REPLACE_BY_FEE_MULTIPLIER));
  });
  it('speed-up wraps the same inner tx in a fee bump paying 10x', () => {
    const p = pending();
    const fb = buildSpeedUp({ keypair: kp, pending: p, passphrase: PASS });
    expect(fb.innerTransaction.hash().toString('hex')).toBe(p.hash().toString('hex'));
    expect(BigInt(fb.fee)).toBeGreaterThanOrEqual(BigInt(p.fee) * BigInt(REPLACE_BY_FEE_MULTIPLIER));
    expect(TransactionBuilder.fromXDR(fb.toXDR(), PASS)).toBeTruthy();
  });
});

describe('Stellar dapp signing', () => {
  it('signs XDR from a dapp', () => {
    const unsigned = new TransactionBuilder(new Account(kp.publicKey(), '5'), { fee: '100', networkPassphrase: PASS }).addOperation(Operation.bumpSequence({ bumpTo: '6' })).setTimeout(30).build();
    const signed = TransactionBuilder.fromXDR(stellarAdapter.signXdr({ keypair: kp }, unsigned.toXDR(), PASS), PASS);
    expect(signed.signatures).toHaveLength(1);
  });
  it('signs messages per SEP-53', () => {
    const sig = Buffer.from(stellarAdapter.signMessage({ keypair: kp }, 'hello orion'), 'base64');
    expect(kp.verify(hash(Buffer.concat([Buffer.from('Stellar Signed Message:\n'), Buffer.from('hello orion')])), sig)).toBe(true);
  });
});
