import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import {
  isConnected as checkFreighterInstalled,
  getAddress,
  getNetworkDetails,
  requestAccess,
  WatchWalletChanges,
} from '@stellar/freighter-api';
import { fetchAccountDetails, fundWithFriendbot, NETWORK_PASSPHRASE } from '../services/stellar';
import { fetchUsdPrices, PriceMap } from '../services/price';
import { WalletState, AccountData } from '../types';
import { toast } from 'react-hot-toast';

export type WalletType = 'freighter' | 'metamask';

const SEPOLIA_CHAIN_ID = '0xaa36a7';

interface WalletContextType {
  wallet: WalletState;
  account: AccountData | null;
  accountError: string | null;
  isLoadingAccount: boolean;
  prices: PriceMap;
  connect: (type?: WalletType) => Promise<string | null>;
  disconnect: () => void;
  refreshAccount: (opts?: { silent?: boolean }) => Promise<void>;
  requestAirdrop: () => Promise<void>;
  switchToSepolia: () => Promise<void>;
  isFunding: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const isIFrame = () => {
  try {
    return typeof window !== 'undefined' && window.self !== window.top;
  } catch {
    return true;
  }
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within a WalletProvider');
  return context;
};

const ethereum = () => (typeof window !== 'undefined' ? (window as any).ethereum : undefined);

const evmNetworkName = (chainId: string) =>
  chainId === '0x1' ? 'Ethereum mainnet' : chainId === SEPOLIA_CHAIN_ID ? 'Sepolia' : `Chain ${parseInt(chainId, 16)}`;

const FREIGHTER_NETWORK_NAMES: Record<string, string> = { PUBLIC: 'Mainnet', TESTNET: 'Testnet', FUTURENET: 'Futurenet', STANDALONE: 'Local network' };
const freighterNetworkName = (n: string) => FREIGHTER_NETWORK_NAMES[n] || n || 'Unknown network';

const freighterInstalled = () =>
  checkFreighterInstalled()
    .then((res) => !!(res && !res.error && res.isConnected))
    .catch(() => false);

const EMPTY_WALLET: WalletState = {
  isConnected: false,
  isInstalled: false,
  publicKey: null,
  network: null,
  status: 'disconnected',
  error: null,
  walletType: null,
  networkOk: false,
};

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [wallet, setWallet] = useState<WalletState>(EMPTY_WALLET);
  const [account, setAccount] = useState<AccountData | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [prices, setPrices] = useState<PriceMap>({});
  const watcherRef = useRef<WatchWalletChanges | null>(null);

  // Reference prices (refreshed every minute while the app is open)
  useEffect(() => {
    const load = () => fetchUsdPrices().then(setPrices).catch(() => {});
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  const clearStorage = () => {
    ['stellar_pubkey', 'metamask_pubkey', 'wallet_type', 'sim_eth_balance'].forEach((k) => localStorage.removeItem(k));
  };

  const setFreighterState = (address: string, network: string, passphrase: string) => {
    setWallet({
      isConnected: true,
      isInstalled: true,
      publicKey: address,
      network: freighterNetworkName(network),
      status: 'connected',
      error: null,
      walletType: 'freighter',
      networkOk: passphrase === NETWORK_PASSPHRASE,
    });
  };

  const setMetaMaskState = (address: string, chainId: string) => {
    setWallet({
      isConnected: true,
      isInstalled: true,
      publicKey: address,
      network: evmNetworkName(chainId),
      status: 'connected',
      error: null,
      walletType: 'metamask',
      networkOk: chainId === SEPOLIA_CHAIN_ID,
    });
  };

  // Detect wallets and restore the last session (only if the wallet still grants access)
  useEffect(() => {
    (async () => {
      const hasFreighter = await freighterInstalled();
      const hasMetaMask = !!ethereum();
      setWallet((prev) => ({ ...prev, isInstalled: hasFreighter || hasMetaMask }));

      const saved = localStorage.getItem('wallet_type') as WalletType | null;
      // Old builds stored a fake "0xSIM_" wallet — drop it
      if (localStorage.getItem('metamask_pubkey')?.startsWith('0xSIM')) clearStorage();

      try {
        if (saved === 'metamask' && hasMetaMask) {
          const accounts: string[] = await ethereum().request({ method: 'eth_accounts' });
          if (accounts[0]) {
            const chainId = await ethereum().request({ method: 'eth_chainId' });
            setMetaMaskState(accounts[0], chainId);
          } else clearStorage();
        } else if ((saved === 'freighter' || localStorage.getItem('stellar_pubkey')) && hasFreighter) {
          const addr = await getAddress();
          if (addr.address) {
            const net = await getNetworkDetails();
            setFreighterState(addr.address, net.network, net.networkPassphrase);
          } else clearStorage();
        }
      } catch (err) {
        console.error('Could not restore wallet session:', err);
        clearStorage();
      }
    })();
  }, []);

  // Freighter: follow account and network switches made inside the extension
  useEffect(() => {
    if (wallet.walletType !== 'freighter') return;
    const watcher = new WatchWalletChanges(3000);
    watcherRef.current = watcher;
    watcher.watch(({ address, network, networkPassphrase, error }) => {
      if (error || !address) return;
      setWallet((prev) => {
        if (prev.walletType !== 'freighter') return prev;
        if (prev.publicKey === address && prev.network === freighterNetworkName(network)) return prev;
        if (prev.publicKey !== address) {
          localStorage.setItem('stellar_pubkey', address);
          toast('Switched to a different Freighter account.');
        }
        return { ...prev, publicKey: address, network: freighterNetworkName(network), networkOk: networkPassphrase === NETWORK_PASSPHRASE };
      });
    });
    return () => watcher.stop();
  }, [wallet.walletType]);

  // MetaMask: follow account and chain switches
  useEffect(() => {
    const provider = ethereum();
    if (!provider || wallet.walletType !== 'metamask') return;

    const onAccounts = (accounts: string[]) => {
      if (!accounts.length) return disconnect();
      localStorage.setItem('metamask_pubkey', accounts[0]);
      setWallet((prev) => ({ ...prev, publicKey: accounts[0] }));
    };
    const onChain = (chainId: string) =>
      setWallet((prev) => ({ ...prev, network: evmNetworkName(chainId), networkOk: chainId === SEPOLIA_CHAIN_ID }));

    provider.on('accountsChanged', onAccounts);
    provider.on('chainChanged', onChain);
    return () => {
      provider.removeListener?.('accountsChanged', onAccounts);
      provider.removeListener?.('chainChanged', onChain);
    };
  }, [wallet.walletType]);

  const loadAccountData = useCallback(async (pubKey: string, type: WalletType) => {
    setIsLoadingAccount(true);
    setAccountError(null);
    try {
      if (type === 'metamask') {
        const balanceHex: string = await ethereum().request({ method: 'eth_getBalance', params: [pubKey, 'latest'] });
        const balanceEth = balanceHex ? Number(BigInt(balanceHex)) / 1e18 : 0;
        setAccount({
          publicKey: pubKey,
          xlmBalance: balanceEth.toFixed(6),
          sequenceNumber: 'N/A',
          exists: true,
          lastUpdated: new Date().toISOString(),
        });
      } else {
        setAccount(await fetchAccountDetails(pubKey));
      }
    } catch (err: any) {
      console.error('Error fetching account data:', err);
      // Never show a made-up balance — surface the error instead.
      setAccount(null);
      setAccountError(err?.message || 'Could not load your balance.');
    } finally {
      setIsLoadingAccount(false);
    }
  }, []);

  useEffect(() => {
    if (wallet.publicKey && wallet.isConnected && wallet.walletType) {
      loadAccountData(wallet.publicKey, wallet.walletType);
    } else {
      setAccount(null);
      setAccountError(null);
    }
  }, [wallet.publicKey, wallet.isConnected, wallet.walletType, wallet.network, loadAccountData]);

  const connect = async (type: WalletType = 'freighter'): Promise<string | null> => {
    setWallet((prev) => ({ ...prev, status: 'connecting', error: null }));

    const fail = (msg: string, installed = true) => {
      setWallet((prev) => ({ ...prev, isConnected: false, isInstalled: installed, status: 'error', error: msg, walletType: null }));
      toast.error(msg);
      return null;
    };

    if (type === 'metamask') {
      const provider = ethereum();
      if (!provider) return fail('MetaMask is not installed in this browser.', wallet.isInstalled);
      try {
        const accounts: string[] = await provider.request({ method: 'eth_requestAccounts' });
        if (!accounts[0]) return fail('MetaMask did not share an account.');
        const chainId = await provider.request({ method: 'eth_chainId' });
        setMetaMaskState(accounts[0], chainId);
        localStorage.setItem('wallet_type', 'metamask');
        localStorage.setItem('metamask_pubkey', accounts[0]);
        toast.success('MetaMask connected');
        return accounts[0];
      } catch (err: any) {
        return fail(err?.code === 4001 ? 'You declined the MetaMask connection.' : err?.message || 'MetaMask connection failed.');
      }
    }

    if (!(await freighterInstalled())) return fail('Freighter is not installed in this browser.', wallet.isInstalled);
    try {
      const access = await requestAccess();
      if (access.error) throw new Error(access.error.message || String(access.error));
      if (!access.address) return fail('Freighter is locked or did not share an account.');
      const net = await getNetworkDetails();
      setFreighterState(access.address, net.network, net.networkPassphrase);
      localStorage.setItem('wallet_type', 'freighter');
      localStorage.setItem('stellar_pubkey', access.address);
      toast.success('Freighter connected');
      return access.address;
    } catch (err: any) {
      return fail(err?.message || 'You declined the Freighter connection.');
    }
  };

  const switchToSepolia = async () => {
    try {
      await ethereum()?.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: SEPOLIA_CHAIN_ID }] });
    } catch (err: any) {
      toast.error(err?.message || 'Could not switch MetaMask to Sepolia.');
    }
  };

  function disconnect() {
    watcherRef.current?.stop();
    clearStorage();
    setWallet((prev) => ({ ...EMPTY_WALLET, isInstalled: prev.isInstalled }));
    setAccount(null);
    setAccountError(null);
    toast.success('Wallet disconnected');
  }

  const refreshAccount = async (opts?: { silent?: boolean }) => {
    if (!wallet.publicKey || !wallet.walletType) return;
    await loadAccountData(wallet.publicKey, wallet.walletType);
    if (!opts?.silent) toast.success('Balance updated');
  };

  const requestAirdrop = async () => {
    if (!wallet.publicKey) return void toast.error('Connect a wallet first.');
    if (wallet.walletType === 'metamask') return void toast.error('Friendbot only funds Stellar testnet accounts.');

    setIsFunding(true);
    const t = toast.loading('Asking Friendbot for 10,000 test XLM…');
    try {
      await fundWithFriendbot(wallet.publicKey);
      toast.success('Funded with 10,000 test XLM', { id: t });
      await loadAccountData(wallet.publicKey, 'freighter');
    } catch (err: any) {
      toast.error(err?.message || 'Friendbot could not fund this account.', { id: t });
    } finally {
      setIsFunding(false);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        account,
        accountError,
        isLoadingAccount,
        prices,
        connect,
        disconnect,
        refreshAccount,
        requestAirdrop,
        switchToSepolia,
        isFunding,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
