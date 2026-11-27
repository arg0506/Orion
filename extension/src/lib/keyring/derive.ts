/**
 * HD key derivation for every chain Orion supports, from one BIP-39 phrase.
 *
 *  EVM      secp256k1  BIP-32   m/44'/60'/0'/0/{i}   (MetaMask, Rabby)
 *  Solana   ed25519    SLIP-10  m/44'/501'/{i}'/0'   (Phantom, Solflare)
 *  Stellar  ed25519    SLIP-10  m/44'/148'/{i}'      (SEP-5: Freighter, Lobstr)
 */
import { generateMnemonic as gen, mnemonicToSeedSync, validateMnemonic as validate } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { HDKey } from '@scure/bip32';
import { hmac } from '@noble/hashes/hmac.js';
import { sha512 } from '@noble/hashes/sha2.js';
import { ed25519 } from '@noble/curves/ed25519.js';

export const generateMnemonic = (strength: 128 | 256 = 128) => gen(wordlist, strength);
export const validateMnemonic = (m: string) => validate(normalizeMnemonic(m), wordlist);
export const normalizeMnemonic = (m: string) => m.trim().toLowerCase().split(/\s+/).join(' ');

const HARDENED = 0x80000000;
const enc = new TextEncoder();

/** SLIP-10 ed25519 derivation. Only hardened indices exist for ed25519. */
export function slip10Ed25519(seed: Uint8Array, path: string): { key: Uint8Array; chainCode: Uint8Array } {
  let I = hmac(sha512, enc.encode('ed25519 seed'), seed);
  let key = I.slice(0, 32);
  let chainCode = I.slice(32);
  const segments = path.replace(/^m\/?/, '').split('/').filter(Boolean);
  for (const seg of segments) {
    if (!seg.endsWith("'")) throw new Error(`ed25519 paths must be fully hardened: ${path}`);
    const index = (parseInt(seg.slice(0, -1), 10) + HARDENED) >>> 0;
    const data = new Uint8Array(37);
    data[0] = 0;
    data.set(key, 1);
    new DataView(data.buffer).setUint32(33, index, false);
    I = hmac(sha512, chainCode, data);
    key = I.slice(0, 32);
    chainCode = I.slice(32);
  }
  return { key, chainCode };
}

export const paths = {
  evm: (i: number) => `m/44'/60'/0'/0/${i}`,
  solana: (i: number) => `m/44'/501'/${i}'/0'`,
  stellar: (i: number) => `m/44'/148'/${i}'`,
};

export function seedFromMnemonic(mnemonic: string): Uint8Array {
  return mnemonicToSeedSync(normalizeMnemonic(mnemonic));
}

/** 32-byte secp256k1 private key for EVM account i. */
export function deriveEvmPrivateKey(seed: Uint8Array, i = 0): Uint8Array {
  const node = HDKey.fromMasterSeed(seed).derive(paths.evm(i));
  if (!node.privateKey) throw new Error('Could not derive EVM key');
  return node.privateKey;
}

/** 32-byte ed25519 seed for Solana account i (expand with Keypair.fromSeed). */
export function deriveSolanaSeed(seed: Uint8Array, i = 0): Uint8Array {
  return slip10Ed25519(seed, paths.solana(i)).key;
}

/** 32-byte ed25519 seed for Stellar account i (expand with Keypair.fromRawEd25519Seed). */
export function deriveStellarSeed(seed: Uint8Array, i = 0): Uint8Array {
  return slip10Ed25519(seed, paths.stellar(i)).key;
}

export const ed25519PublicKey = (seed32: Uint8Array) => ed25519.getPublicKey(seed32);
