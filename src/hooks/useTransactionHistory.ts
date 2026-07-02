import { useState, useEffect } from 'react';
import { TransactionHistoryItem } from '../types';
import { toast } from 'react-hot-toast';

export const useTransactionHistory = (senderPublicKey: string | null) => {
  const [history, setHistory] = useState<TransactionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load transaction history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('stellar_tx_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as TransactionHistoryItem[];
        setHistory(parsed);
      } catch (err) {
        console.error('Failed to parse transaction history:', err);
      }
    }
    setLoading(false);
  }, []);

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

    const updated = [newTx, ...history];
    localStorage.setItem('stellar_tx_history', JSON.stringify(updated));
    setHistory(updated);
  };

  const clearHistory = async () => {
    localStorage.removeItem('stellar_tx_history');
    toast.success('Local transaction logs cleared.');
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
