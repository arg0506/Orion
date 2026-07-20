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
    <div className="p-8 sm:p-10 rounded-[28px] border border-zinc-800 bg-zinc-950/40 backdrop-blur-3xl shadow-2xl font-mono relative overflow-hidden group hover:border-zinc-700/80 transition-all duration-300">
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-zinc-700 rounded-tl group-hover:border-zinc-500 transition-colors" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-zinc-700 rounded-tr group-hover:border-zinc-500 transition-colors" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-zinc-700 rounded-bl group-hover:border-zinc-500 transition-colors" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-zinc-700 rounded-br group-hover:border-zinc-500 transition-colors" />
      
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-zinc-900">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <History size={14} className="text-zinc-400" />
            Terminal Transaction Ledgers
          </h3>
          <p className="text-[10px] text-zinc-500 mt-1 font-sans font-light">
            Check on-chain Stellar transactions or review local/cloud transaction receipts.
          </p>
        </div>
        
        {/* Tab Selector */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <div className="inline-flex rounded-full bg-zinc-950/80 p-1 border border-zinc-800 text-[9px] font-bold">
            <button
              onClick={() => setActiveTab('on_chain')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all cursor-pointer ${
                activeTab === 'on_chain' 
                  ? 'bg-white text-black font-black shadow-md' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Globe size={11} />
              ON-CHAIN LEDGER
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all cursor-pointer ${
                activeTab === 'archived' 
                  ? 'bg-white text-black font-black shadow-md' 
                  : 'text-zinc-400 hover:text-white'
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
              className="p-2 rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all cursor-pointer disabled:opacity-50"
              title="Sync On-Chain Ledger"
            >
              <RefreshCw size={12} className={loadingOnChain ? 'animate-spin text-white' : ''} />
            </button>
          )}

          {activeTab === 'archived' && history.length > 0 && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-1.5 px-4 py-2 text-[9px] text-rose-400 hover:text-rose-300 border border-zinc-800 hover:border-rose-500/30 rounded-full transition-all cursor-pointer font-bold"
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
          <div className="py-14 text-center text-zinc-500 text-xs flex flex-col items-center gap-3 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/20 font-mono">
            <Globe size={24} className="opacity-20 text-zinc-400 mb-1" />
            Connect wallet terminal session to query on-chain ledgers.
          </div>
        ) : loadingOnChain ? (
          <div className="py-16 text-center text-zinc-400 text-xs flex flex-col items-center justify-center gap-3">
            <RefreshCw size={20} className="animate-spin text-zinc-300" />
            <span className="uppercase tracking-widest text-[9px] font-black">Querying Horizon API Testnet Node...</span>
          </div>
        ) : onChainHistory.length === 0 ? (
          <div className="py-14 text-center text-zinc-500 text-xs flex flex-col items-center gap-3 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/20 font-mono">
            <Globe size={24} className="opacity-20 text-zinc-400 mb-1" />
            No transaction records found on-chain for this wallet key.
            <p className="text-[10px] text-zinc-600 max-w-xs mt-1 font-sans font-light">
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
                  className="grid grid-cols-12 px-5 py-4.5 bg-zinc-900/20 rounded-2xl items-center border border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900/40 transition-all font-mono"
                >
                  {/* Status Circle */}
                  <div className="col-span-2 sm:col-span-1 flex justify-center">
                    {tx.isIncoming ? (
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
                        <ArrowDownLeft className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-white/5 text-zinc-300 border border-zinc-800 flex items-center justify-center font-bold">
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
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest block mt-1 font-bold">
                      {formatDate(tx.timestamp)} @ {formatTime(tx.timestamp)}
                    </span>
                  </div>

                  {/* Transfer Details */}
                  <div className="col-span-12 sm:col-span-5 py-2 sm:py-0 font-mono">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <span className="text-zinc-600 text-[9px] uppercase font-bold tracking-wider">
                        {tx.isIncoming ? 'From:' : 'To:'}
                      </span>
                      <span className="truncate max-w-[180px] text-zinc-300 select-all font-light" title={tx.isIncoming ? tx.sender : tx.recipient}>
                        {tx.isIncoming ? tx.sender : tx.recipient}
                      </span>
                      <button
                        onClick={() => handleCopy(tx.hash)}
                        className="text-zinc-500 hover:text-white transition-colors cursor-pointer shrink-0"
                        title="Copy Transaction Hash"
                      >
                        <Copy size={11} />
                      </button>
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-500 hover:text-white transition-colors shrink-0"
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
                    <span className="text-[9px] text-zinc-500 tracking-tighter uppercase font-mono block mt-0.5">
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
          <div className="py-14 text-center text-zinc-500 text-xs flex flex-col items-center gap-3 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/20 font-mono">
            <Database size={24} className="opacity-20 text-zinc-400 mb-1 animate-pulse" />
            No transaction receipts archived on this account yet.
            {wallet.publicKey && (
              <p className="text-[10px] text-zinc-600 max-w-xs mt-1 font-sans font-light">
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
                  className="grid grid-cols-12 px-5 py-4.5 bg-zinc-900/20 rounded-2xl items-center border border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900/40 transition-all font-mono"
                >
                  <div className="col-span-2 sm:col-span-1 flex justify-center">
                    {isSuccess ? (
                      <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-bold">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg border border-zinc-850 text-zinc-500 flex items-center justify-center font-bold bg-zinc-950">
                        <ArrowDownLeft className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="col-span-10 sm:col-span-3 px-3">
                    <span className="block text-xs font-bold text-white uppercase tracking-wider">
                      {isSuccess ? 'Payload Broadcasted' : 'Payload Failed'}
                    </span>
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest block truncate mt-1 font-bold">
                      {tx.memo ? `Memo: ${tx.memo}` : 'No text memo'}
                    </span>
                  </div>

                  <div className="col-span-12 sm:col-span-5 py-2 sm:py-0">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <span className="text-zinc-600 text-[9px] uppercase font-bold tracking-wider">To:</span>
                      <span className="truncate max-w-[200px] text-zinc-300 font-light select-all" title={tx.recipient}>
                        {tx.recipient}
                      </span>
                      <button
                        onClick={() => handleCopy(tx.hash)}
                        disabled={tx.hash === 'N/A'}
                        className="text-zinc-500 hover:text-white disabled:opacity-30 transition-colors cursor-pointer shrink-0"
                        title="Copy Hash"
                      >
                        <Copy size={11} />
                      </button>
                      {tx.hash !== 'N/A' && (
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-zinc-500 hover:text-white transition-colors shrink-0"
                          title="Explorer Link"
                        >
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="col-span-12 sm:col-span-3 text-left sm:text-right">
                    <span className={`text-sm font-bold block ${isSuccess ? 'text-white' : 'text-zinc-500'}`}>
                      {isSuccess ? `- ${tx.amount}` : tx.amount} XLM
                    </span>
                    {tx.hash !== 'N/A' ? (
                      <span className="text-[9px] text-zinc-500 tracking-tighter uppercase block mt-0.5">
                        Tx: {shortenHash(tx.hash)}
                      </span>
                    ) : (
                      <span className="text-[9px] text-rose-400 tracking-tighter uppercase font-bold block mt-0.5">
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
