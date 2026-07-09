import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../context/WalletContext';
import { useTransactionHistory } from '../hooks/useTransactionHistory';
import { fetchOnChainPayments } from '../services/stellar';
import { 
  Copy, 
  ExternalLink, 
  History, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  Globe, 
  Database,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function TransactionHistoryList() {
  const { wallet } = useWallet();
  const { history, clearHistory } = useTransactionHistory(wallet.publicKey);
  
  const [activeTab, setActiveTab] = useState<'on_chain' | 'archived'>('on_chain');
  const [onChainHistory, setOnChainHistory] = useState<any[]>([]);
  const [loadingOnChain, setLoadingOnChain] = useState(false);

  // Fetch real on-chain payment history from Horizon Testnet
  const handleFetchOnChain = useCallback(async (silent = false) => {
    if (!wallet.publicKey) return;
    if (!silent) setLoadingOnChain(true);
    
    try {
      const payments = await fetchOnChainPayments(wallet.publicKey, 15);
      setOnChainHistory(payments);
      if (!silent) {
        toast.success('On-chain ledger synchronized.');
      }
    } catch (err: any) {
      console.error('On-chain fetch error:', err);
      if (!silent) {
        toast.error('Failed to sync on-chain transaction ledger.');
      }
    } finally {
      if (!silent) setLoadingOnChain(false);
    }
  }, [wallet.publicKey]);

  useEffect(() => {
    if (wallet.publicKey) {
      handleFetchOnChain(true);
    } else {
      setOnChainHistory([]);
    }
  }, [wallet.publicKey, handleFetchOnChain]);

  const handleCopy = (hash: string) => {
    if (!hash || hash === 'N/A') return;
    navigator.clipboard.writeText(hash);
    toast.success('Hash copied!');
  };

  const shortenHash = (hash: string) => {
    if (!hash || hash === 'N/A') return 'N/A';
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'N/A';
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="p-6 sm:p-8 rounded-lg glass-panel shadow-2xl font-mono relative overflow-hidden group hover:border-white/25 transition-all duration-300">
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/10 group-hover:border-white/30 transition-colors" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/10 group-hover:border-white/30 transition-colors" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/10 group-hover:border-white/30 transition-colors" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/10 group-hover:border-white/30 transition-colors" />
      
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-white/5">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <History size={14} className="text-white" />
            Terminal Transaction Ledgers
          </h3>
          <p className="text-[10px] text-gray-500 mt-1">
            Check on-chain Stellar transactions or review local/cloud transaction receipts.
          </p>
        </div>
        
        {/* Tab Selector */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <div className="inline-flex rounded bg-black/40 p-0.5 border border-white/10 text-[9px] font-bold">
            <button
              onClick={() => setActiveTab('on_chain')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all cursor-pointer ${
                activeTab === 'on_chain' 
                  ? 'bg-white text-black font-black' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Globe size={11} />
              ON-CHAIN LEDGER
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all cursor-pointer ${
                activeTab === 'archived' 
                  ? 'bg-white text-black font-black' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Database size={11} />
              TRANSMISSION LOGS
            </button>
          </div>

          {activeTab === 'on_chain' && wallet.publicKey && (
            <button
              onClick={() => handleFetchOnChain(false)}
              disabled={loadingOnChain}
              className="p-1.5 rounded border border-white/10 bg-black/40 text-gray-400 hover:text-white hover:border-white transition-all cursor-pointer disabled:opacity-50"
              title="Sync On-Chain Ledger"
            >
              <RefreshCw size={12} className={loadingOnChain ? 'animate-spin text-white' : ''} />
            </button>
          )}

          {activeTab === 'archived' && history.length > 0 && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-1 px-3 py-1.5 text-[9px] text-white hover:text-gray-300 border border-white/10 hover:border-white/30 rounded transition-all cursor-pointer"
            >
              <Trash2 size={11} />
              CLEAR ARCHIVE
            </button>
          )}
        </div>
      </div>

      {/* Main Lists Section */}
      {activeTab === 'on_chain' ? (
        // TAB 1: ON-CHAIN HORIZON LEDGER
        !wallet.publicKey ? (
          <div className="py-12 text-center text-gray-500 text-xs flex flex-col items-center gap-2 border border-dashed border-white/10 rounded bg-white/[0.01]">
            <Globe size={24} className="opacity-20 text-white mb-1" />
            Connect wallet terminal session to query on-chain ledgers.
          </div>
        ) : loadingOnChain ? (
          <div className="py-16 text-center text-gray-400 text-xs flex flex-col items-center justify-center gap-3">
            <RefreshCw size={20} className="animate-spin text-white" />
            <span className="uppercase tracking-widest text-[9px] font-black">Querying Horizon API Testnet Node...</span>
          </div>
        ) : onChainHistory.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-xs flex flex-col items-center gap-2 border border-dashed border-white/10 rounded bg-white/[0.01]">
            <Globe size={24} className="opacity-20 text-white mb-1" />
            No transaction records found on-chain for this wallet key.
            <p className="text-[10px] text-gray-600 max-w-xs mt-1">
              Ensure you fund the account via Friendbot faucet or submit a payment payload first.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {onChainHistory.map((tx) => {
              const typeLabel = tx.type === 'payment' 
                ? (tx.isIncoming ? 'Payment Received' : 'Payment Sent')
                : tx.type === 'create_account'
                  ? (tx.isIncoming ? 'Account Activated' : 'Funder Deposit')
                  : tx.type.replace('_', ' ').toUpperCase();

              return (
                <div
                  key={tx.id}
                  className="grid grid-cols-12 px-4 py-4 bg-white/[0.02] rounded items-center border border-white/5 hover:bg-white/[0.04] transition-all"
                >
                  {/* Status Circle */}
                  <div className="col-span-2 sm:col-span-1 flex justify-center">
                    {tx.isIncoming ? (
                      <div className="w-8 h-8 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
                        <ArrowDownLeft className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded bg-white/5 text-gray-300 border border-white/10 flex items-center justify-center font-bold">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Date & Type Info */}
                  <div className="col-span-10 sm:col-span-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="block text-xs font-bold text-white uppercase tracking-wider">
                        {typeLabel}
                      </span>
                      {!tx.successful && (
                        <XCircle size={10} className="text-rose-500" title="Transaction Failed" />
                      )}
                    </div>
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest block mt-0.5">
                      {formatDate(tx.timestamp)} @ {formatTime(tx.timestamp)}
                    </span>
                  </div>

                  {/* Transfer Details */}
                  <div className="col-span-12 sm:col-span-5 py-2 sm:py-0 font-mono">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <span className="text-gray-600 text-[9px] uppercase font-bold tracking-wider">
                        {tx.isIncoming ? 'From:' : 'To:'}
                      </span>
                      <span className="truncate max-w-[180px] text-gray-300" title={tx.isIncoming ? tx.sender : tx.recipient}>
                        {tx.isIncoming ? tx.sender : tx.recipient}
                      </span>
                      <button
                        onClick={() => handleCopy(tx.hash)}
                        className="text-gray-500 hover:text-white transition-colors cursor-pointer shrink-0"
                        title="Copy Transaction Hash"
                      >
                        <Copy size={11} />
                      </button>
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gray-500 hover:text-white transition-colors shrink-0"
                        title="View in Stellar Expert"
                      >
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>

                  {/* Value / Volume details */}
                  <div className="col-span-12 sm:col-span-3 text-left sm:text-right">
                    <span className={`text-sm font-bold block ${tx.isIncoming ? 'text-emerald-400' : 'text-white'}`}>
                      {tx.isIncoming ? '+' : '-'} {parseFloat(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} XLM
                    </span>
                    <span className="text-[9px] text-gray-500 tracking-tighter uppercase font-mono">
                      Tx: {shortenHash(tx.hash)}
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        )
      ) : (
        // TAB 2: TRANSMISSION ARCHIVES
        history.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-xs flex flex-col items-center gap-2 border border-dashed border-white/10 rounded bg-white/[0.01]">
            <Database size={24} className="opacity-20 text-white mb-1 animate-pulse" />
            No transaction receipts archived on this account yet.
            {wallet.publicKey && (
              <p className="text-[10px] text-gray-600 max-w-xs mt-1">
                Initiate payment payload operations using this terminal app to store secure transfer records.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((tx, idx) => {
              const isSuccess = tx.status === 'success';
              return (
                <div
                  key={`${tx.hash}-${idx}`}
                  className="grid grid-cols-12 px-4 py-4 bg-white/[0.02] rounded items-center border border-white/5 hover:bg-white/[0.05] transition-all"
                >
                  <div className="col-span-2 sm:col-span-1 flex justify-center">
                    {isSuccess ? (
                      <div className="w-8 h-8 rounded bg-white text-black flex items-center justify-center font-bold">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded border border-white/20 text-gray-500 flex items-center justify-center font-bold bg-black">
                        <ArrowDownLeft className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="col-span-10 sm:col-span-3 px-3">
                    <span className="block text-xs font-bold text-white uppercase tracking-wider">
                      {isSuccess ? 'Payload Broadcasted' : 'Payload Failed'}
                    </span>
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest block truncate">
                      {tx.memo ? `Memo: ${tx.memo}` : 'No text memo'}
                    </span>
                  </div>

                  <div className="col-span-12 sm:col-span-5 py-2 sm:py-0">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <span className="text-gray-600 text-[9px] uppercase font-bold tracking-wider">To:</span>
                      <span className="truncate max-w-[200px]" title={tx.recipient}>
                        {tx.recipient}
                      </span>
                      <button
                        onClick={() => handleCopy(tx.hash)}
                        disabled={tx.hash === 'N/A'}
                        className="text-gray-500 hover:text-white disabled:opacity-30 transition-colors cursor-pointer shrink-0"
                        title="Copy Hash"
                      >
                        <Copy size={11} />
                      </button>
                      {tx.hash !== 'N/A' && (
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-gray-500 hover:text-white transition-colors shrink-0"
                          title="Explorer Link"
                        >
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="col-span-12 sm:col-span-3 text-left sm:text-right">
                    <span className={`text-sm font-bold block ${isSuccess ? 'text-white' : 'text-gray-500'}`}>
                      {isSuccess ? `- ${tx.amount}` : tx.amount} XLM
                    </span>
                    {tx.hash !== 'N/A' ? (
                      <span className="text-[9px] text-gray-500 tracking-tighter uppercase">
                        Tx: {shortenHash(tx.hash)}
                      </span>
                    ) : (
                      <span className="text-[9px] text-gray-500 tracking-tighter uppercase font-bold">
                        Fault: {tx.error ? tx.error.slice(0, 16) + '...' : 'Rejected'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
