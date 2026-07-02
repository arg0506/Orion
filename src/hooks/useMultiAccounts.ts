import { useState, useEffect, useCallback } from 'react';
import { MultiAccountItem } from '../types';
import { isValidAddress, fetchAccountDetails } from '../services/stellar';
import { toast } from 'react-hot-toast';

export const useMultiAccounts = () => {
  const [accounts, setAccounts] = useState<MultiAccountItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load accounts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('stellar_monitored_accounts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAccounts(parsed.map((acc: any) => ({
          ...acc,
          isLoading: false,
        })));
      } catch (err) {
        console.error('Failed to parse monitored accounts:', err);
      }
    }
    setLoading(false);
  }, []);

  // Sync to local storage
  const saveToLocalStorage = (updatedList: MultiAccountItem[]) => {
    const serialized = updatedList.map(({ id, address, label, xlmBalance, exists, lastUpdated, error }) => ({
      id,
      address,
      label,
      xlmBalance,
      exists,
      lastUpdated,
      error,
    }));
    localStorage.setItem('stellar_monitored_accounts', JSON.stringify(serialized));
  };

  const fetchSingleAccount = useCallback(async (id: string, address: string) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, isLoading: true, error: null } : acc))
    );

    try {
      const details = await fetchAccountDetails(address);
      setAccounts((prev) => {
        const next = prev.map((acc) =>
          acc.id === id
            ? {
                ...acc,
                xlmBalance: details.xlmBalance,
                exists: details.exists,
                isLoading: false,
                lastUpdated: details.lastUpdated,
                error: null,
              }
            : acc
        );
        saveToLocalStorage(next);
        return next;
      });
    } catch (err: any) {
      const errMsg = err.message || 'Failed to fetch balance.';
      setAccounts((prev) => {
        const next = prev.map((acc) =>
          acc.id === id
            ? {
                ...acc,
                isLoading: false,
                error: errMsg,
              }
            : acc
        );
        saveToLocalStorage(next);
        return next;
      });
    }
  }, []);

  const addAccount = async (address: string, label?: string) => {
    const cleanAddress = address.trim();
    if (!cleanAddress) {
      toast.error('Address cannot be empty.');
      return false;
    }

    if (!isValidAddress(cleanAddress)) {
      toast.error('Invalid Stellar address format.');
      return false;
    }

    // Check duplicates
    if (accounts.some((acc) => acc.address.toLowerCase() === cleanAddress.toLowerCase())) {
      toast.error('Address is already in your monitor list.');
      return false;
    }

    const newId = crypto.randomUUID();
    const cleanLabel = label?.trim() || `Account ${accounts.length + 1}`;

    const newItem: MultiAccountItem = {
      id: newId,
      address: cleanAddress,
      label: cleanLabel,
      xlmBalance: '0',
      exists: false,
      isLoading: true,
      error: null,
      lastUpdated: null,
    };

    const updatedList = [...accounts, newItem];
    setAccounts(updatedList);
    saveToLocalStorage(updatedList);

    // Load initial balance details
    try {
      const details = await fetchAccountDetails(cleanAddress);
      setAccounts((prev) => {
        const next = prev.map((acc) =>
          acc.id === newId
            ? {
                ...acc,
                xlmBalance: details.xlmBalance,
                exists: details.exists,
                isLoading: false,
                lastUpdated: details.lastUpdated,
                error: null,
              }
            : acc
        );
        saveToLocalStorage(next);
        return next;
      });
      toast.success('Monitored account added!');
      return true;
    } catch (err: any) {
      const errMsg = err.message || 'Failed to resolve balance.';
      setAccounts((prev) => {
        const next = prev.map((acc) =>
          acc.id === newId
            ? {
                ...acc,
                isLoading: false,
                error: errMsg,
              }
            : acc
        );
        saveToLocalStorage(next);
        return next;
      });
      toast('Account added, but failed to fetch balance details.', { icon: '⚠️' });
      return true;
    }
  };

  const removeAccount = async (id: string) => {
    const updated = accounts.filter((acc) => acc.id !== id);
    setAccounts(updated);
    saveToLocalStorage(updated);
    toast.success('Account removed from monitor.');
  };

  const refreshAllAccounts = async () => {
    if (accounts.length === 0) {
      toast.error('No accounts to refresh.');
      return;
    }

    const promises = accounts.map((acc) => fetchSingleAccount(acc.id, acc.address));
    toast.promise(Promise.all(promises), {
      loading: 'Refreshing all account balances...',
      success: 'All accounts refreshed!',
      error: 'Some balances failed to refresh.',
    });
  };

  return {
    accounts,
    addAccount,
    removeAccount,
    refreshAccount: fetchSingleAccount,
    refreshAllAccounts,
    loading
  };
};
