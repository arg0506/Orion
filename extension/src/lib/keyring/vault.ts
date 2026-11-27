/**
 * Encrypts the recovery phrase with the user's password.
 * PBKDF2-SHA256 (600k iterations, OWASP 2023) -> AES-256-GCM, all via WebCrypto.
 */
export interface EncryptedVault {
  version: 1;
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  salt: string; // base64
  iv: string; // base64
  ciphertext: string; // base64
}

export const PBKDF2_ITERATIONS = 600_000;
const enc = new TextEncoder();
const dec = new TextDecoder();

const b64 = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b instanceof Uint8Array ? b : new Uint8Array(b))));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function deriveKey(password: string, salt: Uint8Array, iterations: number) {
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptSecret(secret: string, password: string, iterations = PBKDF2_ITERATIONS): Promise<EncryptedVault> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, iterations);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(secret));
  return { version: 1, kdf: 'PBKDF2-SHA256', iterations, salt: b64(salt), iv: b64(iv), ciphertext: b64(ciphertext) };
}

export class WrongPasswordError extends Error {
  constructor() {
    super('Wrong password');
  }
}

export async function decryptSecret(vault: EncryptedVault, password: string): Promise<string> {
  const key = await deriveKey(password, unb64(vault.salt), vault.iterations);
  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(vault.iv) }, key, unb64(vault.ciphertext));
    return dec.decode(plain);
  } catch {
    throw new WrongPasswordError();
  }
}
