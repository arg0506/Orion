import React, { useState } from 'react';
import { useMultiAccounts } from '../hooks/useMultiAccounts';
import { RefreshCw, Plus, Trash2, Search, CheckCircle2, AlertCircle, Copy, ExternalLink, HelpCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function MultiAccountChecker() {
  const { accounts, addAccount, removeAccount, refreshAccount, refreshAllAccounts } = useMultiAccounts();
  const [newAddress, setNewAddress] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await addAccount(newAddress, newLabel);
    setIsSubmitting(false);
    if (success) {
      setNewAddress('');
      setNewLabel('');
    }
  };

  const handleCopy = (addr: string) => {
    navigator.clipboard.writeText(addr);
    toast.success('Address copied to clipboard!');
  };

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 10)}...${addr.slice(-10)}`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header and top tools with Immersive UI Styling */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded bg-white/[0.02] border border-white/10 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -translate-y-6 translate-x-6 w-32 h-32 rounded-full bg-white/[0.01] blur-2xl pointer-events-none"></div>
        <div className="z-10">
          <span className="text-[9px] font-bold text-white uppercase tracking-widest block mb-1">Multi-Terminal Surveillance</span>
          <h2 className="font-display font-extrabold text-2xl tracking-tighter text-white uppercase">
            Multi-Account Monitor
          </h2>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed max-w-2xl font-mono">
            Watch real-time active balances, record registrations, and track key activities on external Stellar G-addresses securely without revealing credentials.
          </p>
        </div>
        {accounts.length > 0 && (
          <button
            onClick={refreshAllAccounts}
            className="flex items-center justify-center gap-2 px-5 py-3 font-mono font-bold text-xs bg-white text-black hover:bg-gray-200 transition-all cursor-pointer self-start md:self-center shrink-0 z-10 uppercase tracking-widest"
          >
            <RefreshCw size={12} />
            REFRESH ALL MONITORS
          </button>
        )}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Form & Guide */}
        <div className="lg:col-span-4 space-y-6 font-mono">
          <div className="p-6 sm:p-8 rounded bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-2xl">
            <h3 className="font-display font-bold text-xs tracking-widest text-white uppercase flex items-center gap-2 mb-6">
              <Plus size={14} className="text-white" />
              Add Monitor Wallet
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Address Input */}
              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold text-gray-500 mb-1.5 uppercase tracking-widest">
                  Stellar G-Address
                </label>
                <input
                  type="text"
                  required
                  disabled={isSubmitting}
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="GD3J26... (ED25519 Public Key)"
                  className="w-full bg-black/60 border border-white/10 focus:border-white rounded px-4 py-3 text-xs focus:outline-none transition-all font-mono placeholder:text-gray-700 text-white disabled:opacity-50"
                />
              </div>

              {/* Label Input */}
              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold text-gray-500 mb-1.5 uppercase tracking-widest">
                  Label Memo / Name
                </label>
                <input
                  type="text"
                  disabled={isSubmitting}
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Savings Vault / cold-storage"
                  className="w-full bg-black/60 border border-white/10 focus:border-white rounded px-4 py-3 text-xs focus:outline-none transition-all font-mono placeholder:text-gray-700 text-white disabled:opacity-50"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !newAddress.trim()}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded font-bold text-xs bg-white text-black hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all mt-2 cursor-pointer uppercase tracking-widest"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    QUERYING LEDGER...
                  </>
                ) : (
                  <>
                    <Search size={12} />
                    INITIALIZE TRACKER
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Guide Card */}
          <div className="p-6 sm:p-8 rounded bg-white/[0.02] border border-white/10 backdrop-blur-xl space-y-4 text-xs leading-relaxed text-gray-400">
            <h4 className="font-display font-semibold text-xs tracking-widest text-white flex items-center gap-1.5 uppercase font-mono">
              <HelpCircle size={14} className="text-white" />
              Surveillance Protocol
            </h4>
            <div className="space-y-3">
              <p>
                This monitor performs direct read-only queries to the official Stellar Horizon Node. No credentials or private keys are ever held.
              </p>
              <p>
                It lists balances, state codes, and recent sequence ids securely. You can monitor any G-address globally on the Testnet.
              </p>
            </div>
          </div>
        </div>

        {/* Right Columns: Monitored wallets list */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="font-mono font-bold text-xs tracking-widest text-gray-400 uppercase">
            Tracked Accounts ({accounts.length})
          </h3>

          {accounts.length === 0 ? (
            <div className="p-12 text-center rounded bg-white/[0.02] border border-white/10 backdrop-blur-xl flex flex-col items-center gap-3 font-mono">
              <Search size={28} className="text-gray-600 animate-pulse mb-1" />
              <div className="space-y-1">
                <p className="text-xs text-gray-300 uppercase tracking-widest">No Monitors Initialized</p>
                <p className="text-[11px] text-gray-500 max-w-sm mx-auto leading-relaxed">
                  Enter a Stellar public key address in the left panel to initialize safe watchlists of test balances.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className={`p-6 rounded relative overflow-hidden transition-all border backdrop-blur-xl ${
                    acc.error
                      ? 'border-white/10 bg-white/[0.01]'
                      : acc.exists
                      ? 'border-white/10 bg-white/[0.02] hover:border-white'
                      : 'border-white/10 bg-white/[0.01]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 max-w-[calc(100%-70px)] font-mono">
                      {/* Name / Label */}
                      <h4 className="font-display font-bold text-sm text-white tracking-wide truncate">
                        {acc.label || 'Unnamed Wallet'}
                      </h4>

                      {/* Address */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-500 hover:text-gray-400 select-all truncate block" title={acc.address}>
                          {shortenAddress(acc.address)}
                        </span>
                        <button
                          onClick={() => handleCopy(acc.address)}
                          className="text-gray-500 hover:text-white transition-colors cursor-pointer shrink-0"
                          title="Copy Address"
                        >
                          <Copy size={11} />
                        </button>
                        <a
                          href={`https://stellar.expert/explorer/testnet/account/${acc.address}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-gray-500 hover:text-white transition-colors shrink-0"
                          title="View on Explorer"
                        >
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => refreshAccount(acc.id, acc.address)}
                        disabled={acc.isLoading}
                        className="p-2 rounded border border-white/5 bg-black/40 text-gray-400 hover:text-white hover:border-white transition-all cursor-pointer"
                        title="Sync Ledger Balance"
                      >
                        <RefreshCw size={12} className={acc.isLoading ? 'animate-spin' : ''} />
                      </button>
                      <button
                        onClick={() => removeAccount(acc.id)}
                        className="p-2 rounded border border-white/5 bg-black/40 text-gray-400 hover:text-white hover:border-white transition-all cursor-pointer"
                        title="Remove Monitor"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Account state values */}
                  <div className="mt-5 pt-4 border-t border-white/5 flex items-end justify-between font-mono">
                    <div>
                      <span className="text-[9px] font-bold text-gray-500 tracking-widest block uppercase">
                        Ledger XLM Balance
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="font-display font-extrabold text-lg text-white">
                          {acc.isLoading ? '...' : parseFloat(acc.xlmBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                        </span>
                        <span className="text-[10px] font-bold text-white">XLM</span>
                      </div>
                    </div>

                    <div className="text-right">
                      {acc.error ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-white bg-white/10 border border-white/20 px-2 py-0.5 rounded uppercase tracking-wider">
                          <AlertCircle size={9} />
                          RPC_ERR
                        </span>
                      ) : acc.exists ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-white bg-white/10 border border-white/20 px-2 py-0.5 rounded uppercase tracking-wider">
                          <CheckCircle2 size={9} />
                          ACTIVE
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-[9px] font-bold text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded uppercase tracking-wider cursor-help"
                          title="Account is unfunded and does not yet exist on-chain."
                        >
                          <AlertCircle size={9} />
                          UNFUNDED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sync date */}
                  <div className="mt-2 text-[9px] font-mono text-gray-600 flex justify-between">
                    <span>Sync:</span>
                    <span>{acc.lastUpdated ? new Date(acc.lastUpdated).toLocaleTimeString() : 'NEVER'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
