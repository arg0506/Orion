import { getAddress, hexToString, isHex, type Hex, decodeFunctionData, parseAbi, formatEther } from 'viem';
import type { DappRequest } from '../messages';
import { ERR, perr, ProviderError } from '../messages';
import { requestApproval } from '../approvals';
import { activeNetwork, addresses, allNetworks, broadcastAccounts, getSettings, isPermitted, isUnlocked, keys, revoke, saveSettings, upsertTx } from '../wallet';
import { evmAdapter, evmClient, evmFees } from '../chains/evm';
import { ensureConnected, requirePermission } from './connect';
import { startTracking } from '../tracker';

const SIGNING_UNSUPPORTED = new Set(['eth_sign', 'eth_signTransaction', 'eth_signTypedData', 'eth_signTypedData_v1', 'eth_signTypedData_v3']);
const hexChain = (id: number) => '0x' + id.toString(16);

/** Recognise common calls so the approval screen can say what a transaction does. */
const KNOWN = parseAbi([
  'function transfer(address to, uint256 amount)',
  'function approve(address spender, uint256 amount)',
  'function transferFrom(address from, address to, uint256 amount)',
  'function setApprovalForAll(address operator, bool approved)',
]);

function describeCall(data?: Hex) {
  if (!data || data === '0x') return null;
  try {
    const d = decodeFunctionData({ abi: KNOWN, data });
    const args = (d.args ?? []).map((a) => (typeof a === 'bigint' ? a.toString() : String(a)));
    const warn = d.functionName === 'approve' && BigInt(args[1] ?? 0) > 10n ** 30n ? 'Unlimited token approval: this site could move all of this token.' : d.functionName === 'setApprovalForAll' && args[1] === 'true' ? 'Grants control over every NFT in this collection.' : undefined;
    return { fn: d.functionName, args, warn };
  } catch {
    return { fn: `Contract call ${data.slice(0, 10)}`, args: [], warn: undefined };
  }
}

function readableMessage(hex: string) {
  if (!isHex(hex)) return hex;
  try {
    const s = hexToString(hex as Hex);
    return /^[\x09\x0A\x0D\x20-\x7E -￿]*$/.test(s) ? s : hex;
  } catch {
    return hex;
  }
}

export async function handleEvm(req: DappRequest): Promise<unknown> {
  const net = await activeNetwork('evm');
  const p = req.params ?? [];

  switch (req.method) {
    case 'eth_chainId':
      return hexChain(net.chainId!);
    case 'net_version':
      return String(net.chainId);
    case 'eth_accounts':
      return (await isPermitted(req.origin, 'evm')) && (await isUnlocked()) ? [(await addresses()).evm] : [];
    case 'eth_requestAccounts':
    case 'wallet_requestPermissions':
      await ensureConnected(req);
      await broadcastAccounts();
      return req.method === 'eth_requestAccounts' ? [(await addresses()).evm] : [{ parentCapability: 'eth_accounts' }];
    case 'wallet_getPermissions':
      return (await isPermitted(req.origin, 'evm')) ? [{ parentCapability: 'eth_accounts' }] : [];
    case 'wallet_revokePermissions':
      await revoke(req.origin, 'evm');
      return null;

    case 'wallet_switchEthereumChain': {
      const want = parseInt(p[0]?.chainId, 16);
      const s = await getSettings();
      const target = (await allNetworks()).find((n) => n.family === 'evm' && n.chainId === want && (s.showMainnets || n.kind !== 'mainnet'));
      if (!target) throw perr(ERR.unknownChain);
      await saveSettings({ active: { ...s.active, evm: target.id } });
      await broadcastAccounts();
      return null;
    }

    case 'wallet_addEthereumChain': {
      const c = p[0] ?? {};
      const chainId = parseInt(c.chainId, 16);
      if (!chainId || !c.rpcUrls?.[0]) throw new ProviderError(-32602, 'chainId and rpcUrls are required');
      const existing = (await allNetworks()).find((n) => n.family === 'evm' && n.chainId === chainId);
      if (!existing) {
        await requestApproval({
          kind: 'addChain',
          family: 'evm',
          origin: req.origin,
          favicon: req.favicon,
          details: { chainId, name: c.chainName ?? `Chain ${chainId}`, rpcUrl: c.rpcUrls[0], symbol: c.nativeCurrency?.symbol ?? 'ETH', explorerUrl: c.blockExplorerUrls?.[0] },
        });
        const s = await getSettings();
        await saveSettings({
          customNetworks: [...s.customNetworks, { chainId, name: c.chainName ?? `Chain ${chainId}`, rpcUrl: c.rpcUrls[0], symbol: c.nativeCurrency?.symbol ?? 'ETH', explorerUrl: c.blockExplorerUrls?.[0] }],
        });
      }
      const s = await getSettings();
      await saveSettings({ active: { ...s.active, evm: existing?.id ?? `evm:custom-${chainId}` } });
      await broadcastAccounts();
      return null;
    }

    case 'personal_sign': {
      await requirePermission(req);
      const [message, addr] = p;
      const me = (await addresses().catch(() => null))?.evm;
      if (me && addr && getAddress(addr) !== me) throw new ProviderError(4100, 'That address is not the connected account');
      await requestApproval({ kind: 'signMessage', family: 'evm', origin: req.origin, favicon: req.favicon, networkId: net.id, details: { message: readableMessage(message) } });
      const k = await keys();
      return k.evm.account.signMessage({ message: isHex(message) ? { raw: message as Hex } : message });
    }

    case 'eth_signTypedData_v4': {
      await requirePermission(req);
      const typed = typeof p[1] === 'string' ? JSON.parse(p[1]) : p[1];
      await requestApproval({
        kind: 'signTypedData',
        family: 'evm',
        origin: req.origin,
        favicon: req.favicon,
        networkId: net.id,
        details: { domain: typed.domain, primaryType: typed.primaryType, message: typed.message },
      });
      const k = await keys();
      const { EIP712Domain: _ignored, ...types } = typed.types;
      return k.evm.account.signTypedData({ domain: typed.domain, types, primaryType: typed.primaryType, message: typed.message });
    }

    case 'eth_sendTransaction': {
      await requirePermission(req);
      const t = p[0] ?? {};
      const client = evmClient(net);
      const me = (await addresses().catch(() => null))?.evm;
      if (t.from && me && getAddress(t.from) !== me) throw new ProviderError(4100, 'That address is not the connected account');
      const value = t.value ? BigInt(t.value) : 0n;
      const data = (t.data ?? t.input) as Hex | undefined;
      // Simulate before asking: estimateGas fails with the revert reason if the call would revert.
      let gas: bigint | undefined = t.gas ? BigInt(t.gas) : undefined;
      let simulation: { ok: boolean; reason?: string } = { ok: true };
      try {
        gas = gas ?? (await client.estimateGas({ account: (me ?? t.from) as Hex, to: t.to, value, data }));
      } catch (e: any) {
        simulation = { ok: false, reason: e?.shortMessage ?? e?.message ?? 'This transaction is expected to fail' };
      }
      const fees = await evmFees(client, 'fast').catch(() => null);
      const estFee = gas && fees ? formatEther(gas * fees.maxFeePerGas) : undefined;
      const decision = await requestApproval({
        kind: 'sendTransaction',
        family: 'evm',
        origin: req.origin,
        favicon: req.favicon,
        networkId: net.id,
        details: { to: t.to ?? '(contract creation)', value: formatEther(value), symbol: net.symbol, call: describeCall(data), gas: gas?.toString(), maxFee: estFee, simulation },
      });
      const k = await keys();
      const tracked = await evmAdapter.sendRaw(net, k.evm, { to: t.to, value, data, gas: gas ? (gas * 12n) / 10n : undefined }, decision?.speed === 'normal' ? 'normal' : 'fast');
      await upsertTx({ ...tracked, kind: 'dapp', origin: req.origin });
      startTracking();
      return tracked.hash;
    }
  }

  if (SIGNING_UNSUPPORTED.has(req.method)) throw perr(ERR.unsupported, `${req.method} is not supported. Use personal_sign or eth_signTypedData_v4.`);
  if (/^(eth_|net_|web3_)/.test(req.method)) {
    // Read-only JSON-RPC goes straight to the active network.
    return evmClient(net).request({ method: req.method as any, params: p as any });
  }
  throw perr(ERR.unsupported, `Orion does not support ${req.method}`);
}
