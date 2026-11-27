import { createPublicClient, http, isAddress, getAddress, toHex, type Hex, type PublicClient } from 'viem';
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';
import type { Network } from '../networks';
import { type ChainAdapter, type SendParams, type TrackedTx, fromUnits, newId, toUnits } from './types';

export type EvmKeys = { account: PrivateKeyAccount };
export const evmKeysFromPrivateKey = (pk: Uint8Array): EvmKeys => ({ account: privateKeyToAccount(toHex(pk)) });

const clients = new Map<string, PublicClient>();
export function evmClient(net: Network): PublicClient {
  const key = `${net.id}|${net.rpcUrl}`;
  let c = clients.get(key);
  if (!c) {
    c = createPublicClient({ transport: http(net.rpcUrl, { timeout: 15_000, retryCount: 1 }) }) as PublicClient;
    clients.set(key, c);
  }
  return c;
}

/** Replacements must raise both fees by at least 10% (geth's rule); we use 12.5% to be safe. */
const bump = (v: bigint) => (v * 1125n) / 1000n + 1n;
const max = (a: bigint, b: bigint) => (a > b ? a : b);

/** EIP-1559 fees. "fast" tips 2x the suggested priority fee so the tx lands in the next block or two. */
export async function evmFees(client: PublicClient, speed: 'normal' | 'fast') {
  const block = await client.getBlock({ blockTag: 'latest' });
  const base = block.baseFeePerGas ?? (await client.getGasPrice());
  let priority: bigint;
  try {
    priority = await client.estimateMaxPriorityFeePerGas();
  } catch {
    priority = 1_000_000_000n; // 1 gwei
  }
  if (priority === 0n) priority = 1_000_000_000n;
  if (speed === 'fast') priority = priority * 2n;
  return { maxPriorityFeePerGas: priority, maxFeePerGas: base * 2n + priority };
}

async function signAndSend(
  client: PublicClient,
  keys: EvmKeys,
  chainId: number,
  t: { to: Hex; value: bigint; data?: Hex; nonce: number; gas: bigint; maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }
) {
  const serialized = await keys.account.signTransaction({ type: 'eip1559', chainId, ...t });
  return client.sendRawTransaction({ serializedTransaction: serialized });
}

export const evmAdapter: ChainAdapter<EvmKeys> & {
  sendRaw(net: Network, keys: EvmKeys, req: { to: string; value?: bigint; data?: Hex; gas?: bigint }, speed: 'normal' | 'fast'): Promise<TrackedTx>;
} = {
  family: 'evm',
  isValidAddress: (a) => isAddress(a),

  async getBalance(net, address) {
    const wei = await evmClient(net).getBalance({ address: getAddress(address) });
    return { amount: fromUnits(wei, net.decimals), exists: true };
  },

  async send(net, keys, p: SendParams) {
    if (!isAddress(p.to)) throw new Error('That is not a valid EVM address');
    const value = toUnits(p.amount, net.decimals);
    const tx = await evmAdapter.sendRaw(net, keys, { to: p.to, value }, p.speed);
    return { ...tx, kind: 'send' };
  },

  /** Lower-level send used by both the wallet UI and dapp eth_sendTransaction. */
  async sendRaw(net, keys, req, speed) {
    const client = evmClient(net);
    const from = keys.account.address;
    const to = getAddress(req.to);
    const value = req.value ?? 0n;
    const [nonce, fees] = await Promise.all([client.getTransactionCount({ address: from, blockTag: 'pending' }), evmFees(client, speed)]);
    const gas = req.gas ?? (await client.estimateGas({ account: from, to, value, data: req.data }));
    const hash = await signAndSend(client, keys, net.chainId!, { to, value, data: req.data, nonce, gas, ...fees });
    return {
      id: newId(),
      family: 'evm',
      networkId: net.id,
      hash,
      from,
      to,
      amount: fromUnits(value, net.decimals),
      symbol: net.symbol,
      createdAt: Date.now(),
      status: 'pending',
      kind: 'send',
      evm: {
        nonce,
        to,
        value: value.toString(),
        data: req.data,
        gas: gas.toString(),
        maxFeePerGas: fees.maxFeePerGas.toString(),
        maxPriorityFeePerGas: fees.maxPriorityFeePerGas.toString(),
        chainId: net.chainId!,
      },
    };
  },

  async getStatus(net, tx) {
    const client = evmClient(net);
    try {
      const receipt = await client.getTransactionReceipt({ hash: tx.hash as Hex });
      return receipt.status === 'success' ? { status: 'confirmed' } : { status: 'failed', error: 'Reverted on chain' };
    } catch {
      // No receipt. If the nonce has been used by another transaction, this one was replaced.
      if (tx.evm) {
        const mined = await client.getTransactionCount({ address: tx.from as Hex, blockTag: 'latest' });
        if (mined > tx.evm.nonce) return { status: 'replaced' };
      }
      return { status: 'pending' };
    }
  },

  async speedUp(net, keys, tx) {
    if (!tx.evm) throw new Error('Missing transaction details');
    const client = evmClient(net);
    const fresh = await evmFees(client, 'fast');
    const maxPriorityFeePerGas = max(bump(BigInt(tx.evm.maxPriorityFeePerGas)), fresh.maxPriorityFeePerGas);
    let maxFeePerGas = max(bump(BigInt(tx.evm.maxFeePerGas)), fresh.maxFeePerGas);
    if (maxFeePerGas < maxPriorityFeePerGas) maxFeePerGas = maxPriorityFeePerGas;
    const e = tx.evm;
    const hash = await signAndSend(client, keys, e.chainId, {
      to: e.to as Hex,
      value: BigInt(e.value),
      data: e.data as Hex | undefined,
      nonce: e.nonce,
      gas: BigInt(e.gas),
      maxFeePerGas,
      maxPriorityFeePerGas,
    });
    return {
      ...tx,
      id: newId(),
      hash,
      createdAt: Date.now(),
      status: 'pending',
      kind: 'speedup',
      replaces: tx.id,
      evm: { ...e, maxFeePerGas: maxFeePerGas.toString(), maxPriorityFeePerGas: maxPriorityFeePerGas.toString() },
    };
  },

  async cancel(net, keys, tx) {
    if (!tx.evm) throw new Error('Missing transaction details');
    const client = evmClient(net);
    const fresh = await evmFees(client, 'fast');
    const maxPriorityFeePerGas = max(bump(BigInt(tx.evm.maxPriorityFeePerGas)), fresh.maxPriorityFeePerGas);
    let maxFeePerGas = max(bump(BigInt(tx.evm.maxFeePerGas)), fresh.maxFeePerGas);
    if (maxFeePerGas < maxPriorityFeePerGas) maxFeePerGas = maxPriorityFeePerGas;
    const self = keys.account.address;
    // A 0-value transfer to yourself with the same nonce: if it lands first, the original never can.
    const hash = await signAndSend(client, keys, tx.evm.chainId, {
      to: self,
      value: 0n,
      nonce: tx.evm.nonce,
      gas: 21_000n,
      maxFeePerGas,
      maxPriorityFeePerGas,
    });
    return {
      ...tx,
      id: newId(),
      hash,
      to: self,
      amount: '0',
      createdAt: Date.now(),
      status: 'pending',
      kind: 'cancel',
      replaces: tx.id,
      evm: { ...tx.evm, to: self, value: '0', data: undefined, gas: '21000', maxFeePerGas: maxFeePerGas.toString(), maxPriorityFeePerGas: maxPriorityFeePerGas.toString() },
    };
  },

  async faucet(net, address) {
    if (net.faucet?.kind !== 'set-balance') throw new Error('Use the faucet link for this network');
    const client = evmClient(net);
    const hundred = toHex(100n * 10n ** 18n);
    for (const method of ['anvil_setBalance', 'hardhat_setBalance'] as const) {
      try {
        await client.request({ method: method as any, params: [getAddress(address), hundred] as any });
        return 'Balance set to 100 ETH';
      } catch {
        /* try the next node flavour */
      }
    }
    throw new Error('The local node did not accept anvil_setBalance or hardhat_setBalance');
  },
};
