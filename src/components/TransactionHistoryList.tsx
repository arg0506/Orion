import React from 'react';
import { useWallet } from '../context/WalletContext';
import { useTransactionHistory } from '../hooks/useTransactionHistory';
import { Copy, ExternalLink, History, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function TransactionHistoryList() {
  const { wallet } = useWallet();
  const { history, clearHistory } = useTransactionHistory(wallet.publicKey);

  const handleCopy = (hash: string) => {
    if (hash === 'N/A') return;
    navigator.clipboard.writeText(hash);
    toast.success('Tx hash copied!');
  };

  const shortenHash = (hash: string) => {
    if (!hash || hash === 'N/A') return 'N/A';
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  return (
    <div className="p-6 sm:p-8 rounded bg-white/[0.02] border border-white/10 shadow-xl font-mono">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <History size={14} className="text-white" />
            Recent Transmissions
          </h3>
          <p className="text-[10px] text-gray-500 mt-1">Locally saved on-chain submissions for this wallet session.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-1 px-3 py-1.5 text-[9px] text-white hover:text-gray-300 border border-white/10 hover:border-white/30 rounded transition-all cursor-pointer"
            >
              <Trash2 size={11} />
              CLEAR HISTORY
            </button>
          )}
          {wallet.publicKey && (
            <a
              href={`https://stellar.expert/explorer/testnet/account/${wallet.publicKey}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-white hover:underline font-bold transition-colors flex items-center gap-1 uppercase tracking-widest"
            >
              Stellar Expert
              <ExternalLink size={10} />
            </a>
          )}
        </div>
      </div>

      {history.length === 0 ? (
        <div className="py-12 text-center text-gray-500 text-xs flex flex-col items-center gap-2 border border-dashed border-white/10 rounded bg-white/[0.01]">
          <History size={24} className="opacity-20 text-white mb-1 animate-pulse" />
          No transactions recorded on this terminal session yet.
          {wallet.publicKey && (
            <p className="text-[10px] text-gray-600 max-w-xs mt-1">
              Initiate a test payment payload above to write to the ledger.
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
                {/* Status Indicator Icon */}
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

                {/* Left labels */}
                <div className="col-span-10 sm:col-span-3 px-3">
                  <span className="block text-xs font-bold text-white uppercase tracking-wider">
                    {isSuccess ? 'Payment Sent' : 'Payment Failed'}
                  </span>
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest block truncate">
                    {tx.memo ? `Memo: ${tx.memo}` : 'No text memo'}
                  </span>
                </div>

                {/* Recipient Address Details */}
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

                {/* Right side Amount */}
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
      )}
    </div>
  );
}
