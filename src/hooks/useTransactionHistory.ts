import { useState, useEffect } from 'react';
import { TransactionHistoryItem } from '../types';

export const useTransactionHistory = (senderPublicKey: string | null) => {
  const [history, setHistory] = useState<TransactionHistoryItem[]>([]);

  // Load history from localStorage
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
  }, []);

  // Filter history for current logged-in user if public key is provided
  const userHistory = senderPublicKey
    ? history.filter(
        (tx) =>
          tx.sender.toLowerCase() === senderPublicKey.toLowerCase() ||
          tx.recipient.toLowerCase() === senderPublicKey.toLowerCase()
      )
    : [];

  const addTransaction = (tx: Omit<TransactionHistoryItem, 'timestamp'>) => {
    const newTx: TransactionHistoryItem = {
      ...tx,
      timestamp: new Date().toISOString(),
    };

    setHistory((prev) => {
      const updated = [newTx, ...prev];
      localStorage.setItem('stellar_tx_history', JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    localStorage.removeItem('stellar_tx_history');
    setHistory([]);
  };

  return {
    history: userHistory,
    allHistory: history,
    addTransaction,
    clearHistory,
  };
};
