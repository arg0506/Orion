export type Family = 'evm' | 'solana' | 'stellar';

export interface Faucet {
  kind: 'friendbot' | 'airdrop' | 'set-balance' | 'link';
  url?: string;
  label: string;
}

export interface Network {
  id: string;
  family: Family;
  name: string;
  symbol: string;
  decimals: number;
  rpcUrl: string;
  /** EVM chain id */
  chainId?: number;
  /** Stellar network passphrase */
  passphrase?: string;
  /** CAIP-2 style id used by Solana wallet-standard (e.g. solana:devnet) */
  caip?: string;
  kind: 'testnet' | 'local' | 'mainnet';
  /** Plain data (networks cross the extension message boundary, so no functions). */
  explorer?: { kind: 'etherscan' | 'solana' | 'stellar'; base: string; cluster?: string };
  faucet?: Faucet;
  custom?: boolean;
}

const etherscan = (base: string) => ({ kind: 'etherscan' as const, base });
const solscan = (cluster?: string) => ({ kind: 'solana' as const, base: 'https://explorer.solana.com', cluster });
const stellarExpert = (net: string) => ({ kind: 'stellar' as const, base: `https://stellar.expert/explorer/${net}` });

export function explorerTxUrl(n: Network, hash: string) {
  const e = n.explorer;
  if (!e) return undefined;
  if (e.kind === 'solana') return `${e.base}/tx/${hash}${e.cluster ? `?cluster=${e.cluster}` : ''}`;
  return `${e.base}/tx/${hash}`;
}
export function explorerAddressUrl(n: Network, address: string) {
  const e = n.explorer;
  if (!e) return undefined;
  if (e.kind === 'solana') return `${e.base}/address/${address}${e.cluster ? `?cluster=${e.cluster}` : ''}`;
  if (e.kind === 'stellar') return `${e.base}/account/${address}`;
  return `${e.base}/address/${address}`;
}

export const STELLAR_TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';
export const STELLAR_PUBLIC_PASSPHRASE = 'Public Global Stellar Network ; September 2015';
export const STELLAR_LOCAL_PASSPHRASE = 'Standalone Network ; February 2017';

export const BUILTIN_NETWORKS: Network[] = [
  // ── EVM ──
  { id: 'evm:sepolia', family: 'evm', name: 'Sepolia', symbol: 'ETH', decimals: 18, chainId: 11155111, rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com', kind: 'testnet', explorer: etherscan('https://sepolia.etherscan.io'), faucet: { kind: 'link', url: 'https://cloud.google.com/application/web3/faucet/ethereum/sepolia', label: 'Open Sepolia faucet' } },
  { id: 'evm:base-sepolia', family: 'evm', name: 'Base Sepolia', symbol: 'ETH', decimals: 18, chainId: 84532, rpcUrl: 'https://sepolia.base.org', kind: 'testnet', explorer: etherscan('https://sepolia.basescan.org'), faucet: { kind: 'link', url: 'https://docs.base.org/chain/network-faucets', label: 'Base faucets' } },
  { id: 'evm:arbitrum-sepolia', family: 'evm', name: 'Arbitrum Sepolia', symbol: 'ETH', decimals: 18, chainId: 421614, rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc', kind: 'testnet', explorer: etherscan('https://sepolia.arbiscan.io') },
  { id: 'evm:op-sepolia', family: 'evm', name: 'OP Sepolia', symbol: 'ETH', decimals: 18, chainId: 11155420, rpcUrl: 'https://sepolia.optimism.io', kind: 'testnet', explorer: etherscan('https://sepolia-optimism.etherscan.io') },
  { id: 'evm:local', family: 'evm', name: 'Local (Anvil / Hardhat)', symbol: 'ETH', decimals: 18, chainId: 31337, rpcUrl: 'http://127.0.0.1:8545', kind: 'local', faucet: { kind: 'set-balance', label: 'Set balance to 100 ETH' } },
  { id: 'evm:mainnet', family: 'evm', name: 'Ethereum', symbol: 'ETH', decimals: 18, chainId: 1, rpcUrl: 'https://ethereum-rpc.publicnode.com', kind: 'mainnet', explorer: etherscan('https://etherscan.io') },
  { id: 'evm:base', family: 'evm', name: 'Base', symbol: 'ETH', decimals: 18, chainId: 8453, rpcUrl: 'https://mainnet.base.org', kind: 'mainnet', explorer: etherscan('https://basescan.org') },

  // ── Solana ──
  { id: 'solana:devnet', family: 'solana', name: 'Solana Devnet', symbol: 'SOL', decimals: 9, rpcUrl: 'https://api.devnet.solana.com', caip: 'solana:devnet', kind: 'testnet', explorer: solscan('devnet'), faucet: { kind: 'airdrop', label: 'Airdrop 1 SOL' } },
  { id: 'solana:testnet', family: 'solana', name: 'Solana Testnet', symbol: 'SOL', decimals: 9, rpcUrl: 'https://api.testnet.solana.com', caip: 'solana:testnet', kind: 'testnet', explorer: solscan('testnet'), faucet: { kind: 'airdrop', label: 'Airdrop 1 SOL' } },
  { id: 'solana:local', family: 'solana', name: 'Local validator', symbol: 'SOL', decimals: 9, rpcUrl: 'http://127.0.0.1:8899', caip: 'solana:localnet', kind: 'local', faucet: { kind: 'airdrop', label: 'Airdrop 10 SOL' } },
  { id: 'solana:mainnet', family: 'solana', name: 'Solana', symbol: 'SOL', decimals: 9, rpcUrl: 'https://api.mainnet-beta.solana.com', caip: 'solana:mainnet', kind: 'mainnet', explorer: solscan() },

  // ── Stellar ──
  { id: 'stellar:testnet', family: 'stellar', name: 'Stellar Testnet', symbol: 'XLM', decimals: 7, rpcUrl: 'https://horizon-testnet.stellar.org', passphrase: STELLAR_TESTNET_PASSPHRASE, kind: 'testnet', explorer: stellarExpert('testnet'), faucet: { kind: 'friendbot', url: 'https://friendbot.stellar.org', label: 'Fund with Friendbot' } },
  { id: 'stellar:local', family: 'stellar', name: 'Local Quickstart', symbol: 'XLM', decimals: 7, rpcUrl: 'http://localhost:8000', passphrase: STELLAR_LOCAL_PASSPHRASE, kind: 'local', faucet: { kind: 'friendbot', url: 'http://localhost:8000/friendbot', label: 'Fund with local Friendbot' } },
  { id: 'stellar:public', family: 'stellar', name: 'Stellar', symbol: 'XLM', decimals: 7, rpcUrl: 'https://horizon.stellar.org', passphrase: STELLAR_PUBLIC_PASSPHRASE, kind: 'mainnet', explorer: stellarExpert('public') },
];

export const DEFAULT_ACTIVE: Record<Family, string> = {
  evm: 'evm:sepolia',
  solana: 'solana:devnet',
  stellar: 'stellar:testnet',
};

export const FAMILY_LABEL: Record<Family, string> = { evm: 'Ethereum & EVM', solana: 'Solana', stellar: 'Stellar' };

/** Rebuild a custom EVM network (added by a dapp through wallet_addEthereumChain) from storage. */
export function customEvmNetwork(n: { chainId: number; name: string; rpcUrl: string; symbol: string; explorerUrl?: string }): Network {
  return {
    id: `evm:custom-${n.chainId}`,
    family: 'evm',
    name: n.name,
    symbol: n.symbol,
    decimals: 18,
    chainId: n.chainId,
    rpcUrl: n.rpcUrl,
    kind: 'testnet',
    custom: true,
    explorer: n.explorerUrl ? etherscan(n.explorerUrl.replace(/\/$/, '')) : undefined,
  };
}
