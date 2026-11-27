export interface WalletState {
  isConnected: boolean;
  isInstalled: boolean;
  publicKey: string | null;
  network: string | null;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  error: string | null;
  walletType?: 'freighter' | 'metamask' | null;
  /** True when the wallet is on the network Orion expects (Stellar testnet / Sepolia). */
  networkOk: boolean;
}

export interface AccountData {
  publicKey: string;
  xlmBalance: string;
  sequenceNumber: string;
  exists: boolean;
  lastUpdated: string;
  subentryCount?: number;
  assets?: { code: string; issuer: string; balance: string }[];
}

export interface MultiAccountItem {
  id: string;
  address: string;
  label?: string;
  xlmBalance: string;
  exists: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

export interface TransactionHistoryItem {
  hash: string;
  sender: string;
  recipient: string;
  amount: string;
  memo: string;
  timestamp: string;
  status: 'success' | 'failed';
  error?: string;
  ledger?: number;
}
