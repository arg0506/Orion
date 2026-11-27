import { describe, expect, it } from 'vitest';
import { privateKeyToAccount } from 'viem/accounts';
import { bytesToHex } from 'viem';
import { Keypair as SolKeypair } from '@solana/web3.js';
import { Keypair as StellarKeypair } from '@stellar/stellar-sdk';
import { deriveEvmPrivateKey, deriveSolanaSeed, deriveStellarSeed, seedFromMnemonic, slip10Ed25519, validateMnemonic } from './derive';

const hex = (b: Uint8Array) => Buffer.from(b).toString('hex');

describe('SLIP-10 ed25519 (official test vector 1)', () => {
  const seed = Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex');
  it('master key', () => {
    const { key, chainCode } = slip10Ed25519(seed, 'm');
    expect(hex(key)).toBe('2b4be7f19ee27bbf30c667b642d5f4aa69fd169872f8fc3059c08ebae2eb19e7');
    expect(hex(chainCode)).toBe('90046a93de5380a72b5e45010748567d5ea02bbf6522f979e05c0d8d8ca9fffb');
  });
  it("m/0'", () => {
    expect(hex(slip10Ed25519(seed, "m/0'").key)).toBe('68e0fe46dfb67e368c75379acec591dad19df3cde26e63b93a8e704f1dade7a3');
  });
  it('rejects non-hardened paths', () => {
    expect(() => slip10Ed25519(seed, 'm/0')).toThrow();
  });
});

describe('EVM (BIP-44, matches Hardhat/Anvil default accounts)', () => {
  const seed = seedFromMnemonic('test test test test test test test test test test test junk');
  it('account 0 and 1', () => {
    expect(privateKeyToAccount(bytesToHex(deriveEvmPrivateKey(seed, 0))).address).toBe('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
    expect(privateKeyToAccount(bytesToHex(deriveEvmPrivateKey(seed, 1))).address).toBe('0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
  });
});

describe('Stellar (SEP-5 official test vector 1)', () => {
  const seed = seedFromMnemonic('illness spike retreat truth genius clock brain pass fit cave bargain toe');
  it("m/44'/148'/0'", () => {
    const kp = StellarKeypair.fromRawEd25519Seed(Buffer.from(deriveStellarSeed(seed, 0)));
    expect(kp.publicKey()).toBe('GDRXE2BQUC3AZNPVFSCEZ76NJ3WWL25FYFK6RGZGIEKWE4SOOHSUJUJ6');
    expect(kp.secret()).toBe('SBGWSG6BTNCKCOB3DIFBGCVMUPQFYPA2G4O34RMTB343OYPXU5DJDVMN');
  });
});

describe('Solana', () => {
  it('derives a valid, stable keypair per index', () => {
    const seed = seedFromMnemonic('test test test test test test test test test test test junk');
    const a = SolKeypair.fromSeed(deriveSolanaSeed(seed, 0)).publicKey.toBase58();
    const b = SolKeypair.fromSeed(deriveSolanaSeed(seed, 1)).publicKey.toBase58();
    expect(a).not.toBe(b);
    expect(SolKeypair.fromSeed(deriveSolanaSeed(seed, 0)).publicKey.toBase58()).toBe(a);
    console.log('solana account 0 for the Hardhat test phrase:', a);
  });
});

describe('mnemonic validation', () => {
  it('accepts valid and rejects invalid phrases', () => {
    expect(validateMnemonic('  Test test test test test test test test test test test junk ')).toBe(true);
    expect(validateMnemonic('test test test test test test test test test test test test')).toBe(false);
  });
});
