/**
 * Runs against a real local EVM node (Hardhat or Anvil on 127.0.0.1:8545).
 * Automining is switched off so transactions sit in the mempool, which lets us
 * prove that speed-up and cancel really replace the original transaction.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { BUILTIN_NETWORKS } from '../networks';
import { deriveEvmPrivateKey, seedFromMnemonic } from '../keyring/derive';
import { evmAdapter, evmClient, evmKeysFromPrivateKey } from './evm';

const net = BUILTIN_NETWORKS.find((n) => n.id === 'evm:local')!;
const seed = seedFromMnemonic('test test test test test test test test test test test junk');
const alice = evmKeysFromPrivateKey(deriveEvmPrivateKey(seed, 0));
const bob = evmKeysFromPrivateKey(deriveEvmPrivateKey(seed, 5));

let up = false;
beforeAll(async () => {
  try {
    await evmClient(net).getChainId();
    up = true;
  } catch {
    if (process.env.REQUIRE_LOCAL_NODE) throw new Error('REQUIRE_LOCAL_NODE is set but no node is running on :8545');
    console.warn('No local EVM node on :8545, skipping integration tests');
  }
});

const rpc = (method: string, params: unknown[] = []) => evmClient(net).request({ method: method as any, params: params as any });
const mine = () => rpc('evm_mine');
const bobBalance = async () => (await evmAdapter.getBalance(net, bob.account.address)).amount;

describe('EVM fast send, speed-up and cancel (local node)', () => {
  it('speed-up replaces the pending transaction, and the payment happens exactly once', async () => {
    if (!up) return;
    await rpc('evm_setAutomine', [false]);
    const before = Number(await bobBalance());

    const tx = await evmAdapter.send(net, alice, { to: bob.account.address, amount: '1.5', speed: 'normal' });
    expect((await evmAdapter.getStatus(net, tx)).status).toBe('pending');

    const faster = await evmAdapter.speedUp!(net, alice, tx);
    expect(faster.hash).not.toBe(tx.hash);
    expect(faster.evm!.nonce).toBe(tx.evm!.nonce);
    expect(BigInt(faster.evm!.maxPriorityFeePerGas)).toBeGreaterThan(BigInt(tx.evm!.maxPriorityFeePerGas));

    await mine();
    expect((await evmAdapter.getStatus(net, faster)).status).toBe('confirmed');
    expect((await evmAdapter.getStatus(net, tx)).status).toBe('replaced');
    expect(Number(await bobBalance())).toBeCloseTo(before + 1.5, 6);
  });

  it('cancel replaces the pending payment with a 0-value self-transfer, so no money moves', async () => {
    if (!up) return;
    await rpc('evm_setAutomine', [false]);
    const before = await bobBalance();

    const tx = await evmAdapter.send(net, alice, { to: bob.account.address, amount: '2', speed: 'fast' });
    const cancel = await evmAdapter.cancel!(net, alice, tx);
    expect(cancel.to).toBe(alice.account.address);
    expect(cancel.amount).toBe('0');

    await mine();
    expect((await evmAdapter.getStatus(net, cancel)).status).toBe('confirmed');
    expect((await evmAdapter.getStatus(net, tx)).status).toBe('replaced');
    expect(await bobBalance()).toBe(before);
  });

  it('fast send confirms in the next block', async () => {
    if (!up) return;
    await rpc('evm_setAutomine', [true]);
    const tx = await evmAdapter.send(net, alice, { to: bob.account.address, amount: '0.01', speed: 'fast' });
    expect((await evmAdapter.getStatus(net, tx)).status).toBe('confirmed');
  });

  it('local faucet sets a balance', async () => {
    if (!up) return;
    const fresh = evmKeysFromPrivateKey(deriveEvmPrivateKey(seed, 42));
    await evmAdapter.faucet!(net, fresh.account.address);
    expect((await evmAdapter.getBalance(net, fresh.account.address)).amount).toBe('100');
  });
});
