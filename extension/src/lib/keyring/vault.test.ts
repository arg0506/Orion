import { describe, expect, it } from 'vitest';
import { decryptSecret, encryptSecret, WrongPasswordError } from './vault';

describe('vault', () => {
  const phrase = 'test test test test test test test test test test test junk';
  it('round-trips with the right password', async () => {
    const v = await encryptSecret(phrase, 'correct horse', 1000);
    expect(v.ciphertext).not.toContain('test');
    expect(await decryptSecret(v, 'correct horse')).toBe(phrase);
  });
  it('rejects the wrong password', async () => {
    const v = await encryptSecret(phrase, 'correct horse', 1000);
    await expect(decryptSecret(v, 'wrong')).rejects.toBeInstanceOf(WrongPasswordError);
  });
  it('uses a fresh salt and IV every time', async () => {
    const a = await encryptSecret(phrase, 'pw', 1000);
    const b = await encryptSecret(phrase, 'pw', 1000);
    expect(a.salt).not.toBe(b.salt);
    expect(a.iv).not.toBe(b.iv);
  });
});
