import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { isConnected as checkFreighterInstalled, getNetwork, requestAccess } from '@stellar/freighter-api';
import { fetchAccountDetails, fundWithFriendbot } from '../services/stellar';
import { WalletState, AccountData } from '../types';
import { toast } from 'react-hot-toast';

interface WalletContextType {
  wallet: WalletState;
  account: AccountData | null;
  isLoadingAccount: boolean;
  connect: () => Promise<string | null>;
  disconnect: () => void;
  refreshAccount: () => Promise<void>;
  requestAirdrop: () => Promise<void>;
  isFunding: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    isInstalled: false,
    publicKey: null,
    network: null,
    status: 'disconnected',
    error: null,
  });

  const [account, setAccount] = useState<AccountData | null>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState<boolean>(false);
  const [isFunding, setIsFunding] = useState<boolean>(false);

  // Check if Freighter is installed on load
  useEffect(() => {
    const checkInstallation = async () => {
      try {
        const res = await checkFreighterInstalled();
        const installed = !!(res && !res.error && res.isConnected);
        setWallet((prev) => ({ ...prev, isInstalled: installed }));

        // If previously connected, try to restore connection
        const savedPublicKey = localStorage.getItem('stellar_pubkey');
        if (installed && savedPublicKey) {
          restoreConnection(savedPublicKey);
        }
      } catch (err: any) {
        console.error('Error checking Freighter installation:', err);
      }
    };

    checkInstallation();
  }, []);

  // Fetch account data when public key changes
  useEffect(() => {
    if (wallet.publicKey && wallet.isConnected) {
      loadAccountData(wallet.publicKey);
    } else {
      setAccount(null);
    }
  }, [wallet.publicKey, wallet.isConnected]);

  const loadAccountData = async (pubKey: string) => {
    setIsLoadingAccount(true);
    try {
      const data = await fetchAccountDetails(pubKey);
      setAccount(data);
    } catch (err: any) {
      console.error('Error fetching connected account data:', err);
      toast.error('Failed to retrieve account details from Stellar Testnet.');
    } finally {
      setIsLoadingAccount(false);
    }
  };

  const restoreConnection = async (pubKey: string) => {
    setWallet((prev) => ({ ...prev, status: 'connecting' }));
    try {
      const netRes = await getNetwork();
      const network = netRes && !netRes.error ? netRes.network : 'TESTNET';
      setWallet({
        isConnected: true,
        isInstalled: true,
        publicKey: pubKey,
        network: network,
        status: 'connected',
        error: null,
      });
    } catch (err: any) {
      console.error('Error restoring connection:', err);
      localStorage.removeItem('stellar_pubkey');
      setWallet({
        isConnected: false,
        isInstalled: true,
        publicKey: null,
        network: null,
        status: 'disconnected',
        error: 'Failed to reconnect to Freighter.',
      });
    }
  };

  const connect = async (): Promise<string | null> => {
    setWallet((prev) => ({ ...prev, status: 'connecting', error: null }));
    
    // Safety check if installed
    const checkRes = await checkFreighterInstalled();
    const installed = !!(checkRes && !checkRes.error && checkRes.isConnected);
    if (!installed) {
      const errMsg = 'Freighter wallet extension is not installed.';
      setWallet((prev) => ({
        ...prev,
        isInstalled: false,
        status: 'error',
        error: errMsg,
      }));
      toast.error(errMsg);
      return null;
    }

    try {
      // Prompt user for address permission
      const accessRes = await requestAccess();
      if (accessRes.error) {
        throw new Error(accessRes.error);
      }
      const pubKey = accessRes.address;
      
      if (!pubKey) {
        throw new Error('User rejected connection or wallet is locked.');
      }

      const netRes = await getNetwork();
      const network = netRes && !netRes.error ? netRes.network : 'TESTNET';
      
      setWallet({
        isConnected: true,
        isInstalled: true,
        publicKey: pubKey,
        network: network,
        status: 'connected',
        error: null,
      });

      localStorage.setItem('stellar_pubkey', pubKey);
      toast.success('Wallet connected successfully!');
      return pubKey;
    } catch (err: any) {
      console.error('Wallet connection failed:', err);
      const errMsg = err.message || 'User rejected the wallet connection request.';
      setWallet((prev) => ({
        ...prev,
        isConnected: false,
        status: 'error',
        error: errMsg,
      }));
      toast.error(errMsg);
      return null;
    }
  };

  const disconnect = () => {
    localStorage.removeItem('stellar_pubkey');
    setWallet({
      isConnected: false,
      isInstalled: true,
      publicKey: null,
      network: null,
      status: 'disconnected',
      error: null,
    });
    setAccount(null);
    toast.success('Wallet disconnected.');
  };

  const refreshAccount = async () => {
    if (wallet.publicKey) {
      await loadAccountData(wallet.publicKey);
      toast.success('Account balance refreshed!');
    }
  };

  const requestAirdrop = async () => {
    if (!wallet.publicKey) {
      toast.error('Connect wallet first.');
      return;
    }

    setIsFunding(true);
    const loadingToast = toast.loading('Requesting 10,000 XLM from Friendbot...');
    
    try {
      await fundWithFriendbot(wallet.publicKey);
      toast.success('Testnet account successfully funded with 10,000 XLM!', { id: loadingToast });
      await loadAccountData(wallet.publicKey);
    } catch (err: any) {
      console.error('Friendbot airdrop failed:', err);
      toast.error(err.message || 'Friendbot failed to fund your address. Please try again.', { id: loadingToast });
    } finally {
      setIsFunding(false);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        account,
        isLoadingAccount,
        connect,
        disconnect,
        refreshAccount,
        requestAirdrop,
        isFunding,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
