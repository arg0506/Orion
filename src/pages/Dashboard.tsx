import React from 'react';
import { useWallet } from '../context/WalletContext';
import SendTransactionForm from '../components/SendTransactionForm';
import TransactionHistoryList from '../components/TransactionHistoryList';
import { RefreshCw, Sparkles, HelpCircle, ShieldAlert, ArrowDownCircle, ExternalLink, Globe } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Dashboard() {
  const { wallet, account, isLoadingAccount, refreshAccount, requestAirdrop, isFunding, connect } = useWallet();

  const handleCopyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    toast.success('Stellar G-address copied!');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome / Intro Hero with Stark Monochrome Background */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded bg-white/[0.02] border border-white/10 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -translate-y-6 translate-x-6 w-32 h-32 rounded-full bg-white/[0.03] blur-2xl pointer-events-none"></div>
        <div className="z-10">
          <span className="text-[9px] font-bold text-white uppercase tracking-widest block mb-1">Stellar Testnet Node Gateway</span>
          <h2 className="font-display font-extrabold text-2xl tracking-tighter text-white uppercase">
            Stellar Voyager Hub
          </h2>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed max-w-2xl font-mono">
            A high-performance command console to check ledger balances, configure test payloads, track sequence states, and broadcast transfers on the SDF Testnet blockchain.
          </p>
        </div>
        {!wallet.isConnected && (
          <button
            onClick={() => connect()}
            className="flex items-center gap-2 px-5 py-3 font-mono font-bold text-xs bg-white text-black hover:bg-gray-200 transition-all shrink-0 cursor-pointer z-10 uppercase tracking-widest"
          >
            INITIALIZE TERMINAL SESSION
          </button>
        )}
      </div>

      {wallet.isConnected && wallet.publicKey ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Area (Main balance cards + Transaction form) */}
          <div className="lg:col-span-8 space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Account Balance Card - Stark Monochrome Design */}
              <div className="p-8 rounded bg-white/[0.02] border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col justify-between min-h-[220px]">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-white tracking-widest uppercase font-display">Native Asset Balance</span>
                    <span className="px-2.5 py-1 rounded bg-white/10 border border-white/20 text-[9px] text-white font-bold tracking-widest font-mono">XLM</span>
                  </div>
                  <div className="mt-5 flex items-baseline gap-2">
                    <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white font-display">
                      {isLoadingAccount ? (
                        <span className="opacity-40">...</span>
                      ) : account ? (
                        parseFloat(account.xlmBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
                      ) : (
                        '0.00'
                      )}
                    </h2>
                    <span className="text-lg font-medium text-white/40 font-mono">LUMENS</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 font-mono">
                    ≈ ${account ? (parseFloat(account.xlmBalance) * 0.11).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} USD
                  </p>
                </div>
                
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5">
                  <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider font-mono">SESSION_CONNECTED</span>
                  <button
                    onClick={refreshAccount}
                    disabled={isLoadingAccount}
                    className="p-1.5 rounded border border-white/10 bg-black/40 text-gray-400 hover:text-white hover:border-white transition-all cursor-pointer"
                    title="Refresh Ledger Balance"
                  >
                    <RefreshCw size={12} className={isLoadingAccount ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>

              {/* Account State Card */}
              <div className="p-8 rounded bg-white/[0.02] border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col justify-between min-h-[220px]">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-white tracking-widest uppercase font-display">Voyage Parameters</span>
                    {account && (
                      <span className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                        account.exists
                          ? 'bg-white/10 text-white border-white/20'
                          : 'bg-white/5 text-gray-500 border-white/10'
                      }`}>
                        {account.exists ? 'ACTIVE' : 'UNREGISTERED'}
                      </span>
                    )}
                  </div>

                  <div className="mt-5 space-y-4">
                    <div className="p-4 rounded bg-black/60 border border-white/5">
                      <span className="block text-[10px] uppercase text-gray-500 font-bold tracking-widest font-mono mb-0.5">Sequence ID</span>
                      <span className="text-sm font-bold font-mono text-gray-100 block truncate">
                        {isLoadingAccount ? '...' : account?.sequenceNumber || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5 text-[10px] text-gray-500 font-mono">
                  <span className="uppercase font-bold tracking-wider">Subentries</span>
                  <span className="text-white font-bold">{account?.subentryCount ?? 0}</span>
                </div>
              </div>

            </div>

            {/* Inactive Account Banner / Friendbot Faucet */}
            {account && !account.exists && (
              <div className="p-6 rounded border border-white/20 bg-white/[0.02] backdrop-blur-md">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-white/5 border border-white/10 text-white rounded shrink-0">
                    <ShieldAlert size={18} />
                  </div>
                  <div className="space-y-1.5 font-mono">
                    <h4 className="font-display font-bold text-xs tracking-widest text-white uppercase">
                      UNACTIVATED TERMINAL DETECTED
                    </h4>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      This public key is empty on-chain. Register your address automatically with Friendbot and receive 10,000 free testnet XLM below.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={requestAirdrop}
                        disabled={isFunding}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-200 disabled:opacity-50 text-black font-mono font-bold text-[10px] tracking-widest uppercase transition-all cursor-pointer"
                      >
                        {isFunding ? (
                          <>
                            <RefreshCw size={12} className="animate-spin" />
                            ACTIVATE PROTOCOL IN PROGRESS...
                          </>
                        ) : (
                          <>
                            <ArrowDownCircle size={12} />
                            ACTIVATE NODE WITH 10,000 FREE XLM
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Friendbot Faucet Refill for Active Accounts */}
            {account && account.exists && (
              <div className="p-5 rounded border border-white/10 bg-white/[0.01] text-gray-300 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 border border-white/10 text-white rounded">
                    <Sparkles size={14} />
                  </div>
                  <div className="font-mono">
                    <h5 className="font-bold text-xs text-white uppercase tracking-widest">Testnet Faucet Refill</h5>
                    <p className="text-[11px] text-gray-500 mt-0.5">Need additional tokens? Push another 10,000 testnet XLM onto this address.</p>
                  </div>
                </div>
                <button
                  onClick={requestAirdrop}
                  disabled={isFunding}
                  className="px-4 py-2 bg-white text-black hover:bg-gray-200 font-mono font-bold text-[10px] transition-all cursor-pointer self-stretch sm:self-center uppercase tracking-widest"
                >
                  {isFunding ? 'REFUELING...' : 'REQUEST 10k XLM'}
                </button>
              </div>
            )}

            {/* Send Payloads Form */}
            <SendTransactionForm />
          </div>

          {/* Right Area (Explorer, guides, public keys) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Public Key Envelope Card */}
            <div className="p-6 rounded bg-white/[0.02] border border-white/10 backdrop-blur-xl">
              <h4 className="font-display font-semibold text-xs tracking-widest text-gray-400 mb-4 uppercase">
                Public Key Envelope
              </h4>
              <div className="space-y-4 font-mono">
                <div>
                  <span className="text-[9px] text-gray-500 block mb-1.5 uppercase tracking-widest">Stellar Address</span>
                  <div className="bg-black/60 border border-white/5 rounded p-3 flex items-center justify-between gap-2 overflow-hidden">
                    <span className="text-xs text-gray-300 select-all truncate block">
                      {wallet.publicKey}
                    </span>
                    <button
                      onClick={() => handleCopyAddress(wallet.publicKey!)}
                      className="px-3 py-1 bg-white/5 border border-white/10 hover:border-white/20 text-gray-300 text-[10px] transition-all cursor-pointer shrink-0"
                    >
                      COPY
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[9px]">
                  <div className="bg-black/40 p-3 rounded border border-white/5">
                    <span className="text-gray-500 block mb-0.5 uppercase tracking-wider">PROVIDER</span>
                    <span className="text-white font-bold block">Freighter SDK</span>
                  </div>
                  <div className="bg-black/40 p-3 rounded border border-white/5">
                    <span className="text-gray-500 block mb-0.5 uppercase tracking-wider">EST. FEE</span>
                    <span className="text-white font-bold block">0.0001 XLM</span>
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href={`https://stellar.expert/explorer/testnet/account/${wallet.publicKey}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 py-3 w-full bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 text-[10px] tracking-wider transition-all text-center uppercase"
                  >
                    VIEW IN STELLAR EXPERT
                    <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            </div>

            {/* Space Pilot instructions / Quick Guide */}
            <div className="p-6 rounded bg-white/[0.02] border border-white/10 backdrop-blur-xl space-y-4 text-xs leading-relaxed text-gray-400 font-mono">
              <h4 className="font-display font-semibold text-xs tracking-widest text-white flex items-center gap-1.5 uppercase">
                <HelpCircle size={14} className="text-white" />
                Terminal Protocol Guide
              </h4>
              <div className="space-y-3">
                <p>
                  1. <strong>Validate Network:</strong> Ensure Freighter settings are locked on the <strong>Testnet</strong>.
                </p>
                <p>
                  2. <strong>Activate Node:</strong> If sequence is unactivated, request Friendbot injection to claim the address.
                </p>
                <p>
                  3. <strong>Ship Transfers:</strong> Provide receiving G-address, amount, payload tag, and sign secure XDR.
                </p>
              </div>
            </div>

          </div>

          {/* Recent Transmissions History Table (Full width underneath) */}
          <div className="lg:col-span-12 pt-4">
            <TransactionHistoryList />
          </div>

        </div>
      ) : (
        /* Unconnected Blank Slate - Immersive theme style */
        <div className="py-20 text-center max-w-lg mx-auto space-y-8 animate-fade-in font-mono">
          <div className="w-16 h-16 mx-auto rounded bg-white text-black flex items-center justify-center shadow-[0_0_25px_rgba(255,255,255,0.4)]">
            <Globe size={28} />
          </div>
          <div className="space-y-3">
            <h3 className="font-display font-bold text-lg text-white uppercase tracking-widest">Initialize Terminal Node</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Connect your secure browser key management extension to synchronize active balance parameters, current sequence index, and validate transaction signatures.
            </p>
          </div>
          <div>
            <button
              onClick={() => connect()}
              className="px-6 py-3.5 bg-white hover:bg-gray-200 text-black font-bold text-xs tracking-widest uppercase transition-all cursor-pointer"
            >
              CONNECT SECURE TERMINAL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
