import { useState, useEffect } from 'react';
import { TransactionHistoryItem } from '../types';
import { collection, query, where, getDocs, addDoc, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export const useTransactionHistory = (senderPublicKey: string | null) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<TransactionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load transaction history based on auth state
  useEffect(() => {
    let active = true;

    const loadTxHistory = async () => {
      setLoading(true);
      if (user) {
        try {
          const q = query(collection(db, 'transactions'), where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          if (!active) return;

          const loadedTxs: TransactionHistoryItem[] = [];
          querySnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            loadedTxs.push({
              hash: data.hash || '',
              sender: data.sender || '',
              recipient: data.recipient || '',
              amount: data.amount || '0',
              memo: data.memo || '',
              status: data.status || 'success',
              error: data.error || undefined,
              ledger: data.ledger || undefined,
              timestamp: data.timestamp || new Date().toISOString(),
            });
          });

          // Sort descending by timestamp
          loadedTxs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setHistory(loadedTxs);
        } catch (err) {
          console.error('Failed to load transactions from Firestore:', err);
          toast.error('Failed to synchronize transaction history from cloud.');
        } finally {
          if (active) setLoading(false);
        }
      } else {
        // Guest mode fallback
        const saved = localStorage.getItem('stellar_tx_history');
        if (saved && active) {
          try {
            const parsed = JSON.parse(saved) as TransactionHistoryItem[];
            setHistory(parsed);
          } catch (err) {
            console.error('Failed to parse transaction history:', err);
          }
        } else if (active) {
          setHistory([]);
        }
        if (active) setLoading(false);
      }
    };

    loadTxHistory();

    return () => {
      active = false;
    };
  }, [user]);

  // Filter history for current active wallet if public key is provided
  const userHistory = senderPublicKey
    ? history.filter(
        (tx) =>
          tx.sender.toLowerCase() === senderPublicKey.toLowerCase() ||
          tx.recipient.toLowerCase() === senderPublicKey.toLowerCase()
      )
    : [];

  const addTransaction = async (tx: Omit<TransactionHistoryItem, 'timestamp'>) => {
    const newTx: TransactionHistoryItem = {
      ...tx,
      timestamp: new Date().toISOString(),
    };

    if (user) {
      try {
        await addDoc(collection(db, 'transactions'), {
          userId: user.uid,
          hash: newTx.hash,
          sender: newTx.sender,
          recipient: newTx.recipient,
          amount: newTx.amount,
          memo: newTx.memo || '',
          status: newTx.status,
          error: newTx.error || null,
          ledger: newTx.ledger || null,
          timestamp: newTx.timestamp,
        });
      } catch (err) {
        console.error('Failed to save transaction to Firestore:', err);
        toast.error('Failed to archive transaction receipt to cloud.');
      }
    } else {
      // Save to localStorage for guest
      const updated = [newTx, ...history];
      localStorage.setItem('stellar_tx_history', JSON.stringify(updated));
    }

    setHistory((prev) => [newTx, ...prev]);
  };

  const clearHistory = async () => {
    if (user) {
      try {
        const q = query(collection(db, 'transactions'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        const batch = writeBatch(db);
        querySnapshot.forEach((docSnapshot) => {
          batch.delete(docSnapshot.ref);
        });
        await batch.commit();
        toast.success('Cloud transaction logs cleared.');
      } catch (err) {
        console.error('Failed to clear transaction history from Firestore:', err);
        toast.error('Failed to clear transaction logs from cloud.');
        return;
      }
    } else {
      localStorage.removeItem('stellar_tx_history');
      toast.success('Local transaction logs cleared.');
    }
    
    setHistory([]);
  };

  return {
    history: userHistory,
    allHistory: history,
    addTransaction,
    clearHistory,
    loading
  };
};
