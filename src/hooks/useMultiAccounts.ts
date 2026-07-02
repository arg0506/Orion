import { useState, useEffect, useCallback } from 'react';
import { MultiAccountItem } from '../types';
import { isValidAddress, fetchAccountDetails } from '../services/stellar';
import { toast } from 'react-hot-toast';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

export const useMultiAccounts = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<MultiAccountItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load accounts based on auth state
  useEffect(() => {
    let active = true;

    const loadAccounts = async () => {
      setLoading(true);
      if (user) {
        try {
          const q = query(collection(db, 'monitored_accounts'), where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          if (!active) return;

          const loadedAccounts: MultiAccountItem[] = [];
          querySnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            loadedAccounts.push({
              id: docSnapshot.id,
              address: data.address,
              label: data.label,
              xlmBalance: data.xlmBalance || '0',
              exists: data.exists ?? false,
              isLoading: false,
              error: data.error || null,
              lastUpdated: data.lastUpdated || null,
            });
          });
          setAccounts(loadedAccounts);
        } catch (err) {
          console.error('Failed to load accounts from Firestore:', err);
          toast.error('Failed to synchronize monitored accounts from cloud.');
        } finally {
          if (active) setLoading(false);
        }
      } else {
        // Guest mode fallback
        const saved = localStorage.getItem('stellar_monitored_accounts');
        if (saved && active) {
          try {
            const parsed = JSON.parse(saved);
            setAccounts(parsed.map((acc: any) => ({
              ...acc,
              isLoading: false,
            })));
          } catch (err) {
            console.error('Failed to parse monitored accounts:', err);
          }
        } else if (active) {
          setAccounts([]);
        }
        if (active) setLoading(false);
      }
    };

    loadAccounts();

    return () => {
      active = false;
    };
  }, [user]);

  // Sync guest changes to local storage helper
  const saveToLocalStorage = (updatedList: MultiAccountItem[]) => {
    if (!user) {
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
    }
  };

  const fetchSingleAccount = useCallback(async (id: string, address: string) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, isLoading: true, error: null } : acc))
    );

    try {
      const details = await fetchAccountDetails(address);
      
      if (user) {
        const docRef = doc(db, 'monitored_accounts', id);
        await updateDoc(docRef, {
          xlmBalance: details.xlmBalance,
          exists: details.exists,
          lastUpdated: details.lastUpdated,
          error: null,
        });
      }

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
      
      if (user) {
        try {
          const docRef = doc(db, 'monitored_accounts', id);
          await updateDoc(docRef, {
            error: errMsg,
          });
        } catch (e) {
          console.error('Failed to log account fetch error in Firestore:', e);
        }
      }

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
  }, [user]);

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

    const newId = user ? '' : crypto.randomUUID();
    const cleanLabel = label?.trim() || `Account ${accounts.length + 1}`;
    
    let targetId = newId;
    
    if (user) {
      try {
        const docRef = await addDoc(collection(db, 'monitored_accounts'), {
          userId: user.uid,
          address: cleanAddress,
          label: cleanLabel,
          xlmBalance: '0',
          exists: false,
          lastUpdated: null,
          error: null
        });
        targetId = docRef.id;
      } catch (err) {
        console.error('Failed to add account to Firestore:', err);
        toast.error('Failed to save monitored account to cloud database.');
        return false;
      }
    }

    const newItem: MultiAccountItem = {
      id: targetId,
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
      
      if (user) {
        const docRef = doc(db, 'monitored_accounts', targetId);
        await updateDoc(docRef, {
          xlmBalance: details.xlmBalance,
          exists: details.exists,
          lastUpdated: details.lastUpdated,
          error: null,
        });
      }

      setAccounts((prev) => {
        const next = prev.map((acc) =>
          acc.id === targetId
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
      if (user) {
        try {
          const docRef = doc(db, 'monitored_accounts', targetId);
          await updateDoc(docRef, {
            error: errMsg,
          });
        } catch (e) {
          console.error(e);
        }
      }

      setAccounts((prev) => {
        const next = prev.map((acc) =>
          acc.id === targetId
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
    if (user) {
      try {
        const docRef = doc(db, 'monitored_accounts', id);
        await deleteDoc(docRef);
      } catch (err) {
        console.error('Failed to delete account from Firestore:', err);
        toast.error('Failed to remove monitored account from cloud database.');
        return;
      }
    }

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
