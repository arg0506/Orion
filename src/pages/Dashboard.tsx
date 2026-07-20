import React from 'react';
import { useWallet } from '../context/WalletContext';
import SendTransactionForm from '../components/SendTransactionForm';
import TransactionHistoryList from '../components/TransactionHistoryList';
import { RefreshCw, Sparkles, HelpCircle, ShieldAlert, ArrowDownCircle, ExternalLink, Globe } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AddressQRCodeGenerator } from '../components/QRCodeUtility';

export default function Dashboard() {
  const { wallet, account, isLoadingAccount, refreshAccount, requestAirdrop, isFunding, connect } = useWallet();

  const handleCopyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    toast.success('Stellar G-address copied!');
  };

  return (
    <div className="space-y-8">
      {/* Welcome / Intro Hero with Stark Monochrome Background */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 sm:p-10 rounded-[28px] border border-zinc-800 bg-zinc-950/40 backdrop-blur-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -translate-y-6 translate-x-6 w-32 h-32 rounded-full bg-white/[0.03] blur-2xl pointer-events-none"></div>
        <div className="z-10">
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5 font-mono">Stellar Testnet Node Gateway</span>
          <h2 className="font-display font-extrabold text-2xl tracking-tight text-white uppercase">
            Stellar Voyager Hub
          </h2>
          <p className="text-zinc-400 text-xs mt-2 leading-relaxed max-w-2xl font-sans font-light">
            A high-performance command console to check ledger balances, configure test payloads, track sequence states, and broadcast transfers on the SDF Testnet blockchain.
          </p>
        </div>
        {!wallet.isConnected && (
          <div className="flex flex-col sm:flex-row gap-3 z-10">
            <button
              onClick={() => connect('freighter')}
              className="flex items-center gap-2 px-5 py-3 rounded-full btn-metallic text-[10px] font-mono font-bold tracking-widest uppercase cursor-pointer"
            >
              INITIALIZE FREIGHTER
            </button>
            <button
              onClick={() => connect('metamask')}
              className="flex items-center gap-2 px-5 py-3 rounded-full border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-white text-[10px] font-mono font-bold tracking-widest uppercase cursor-pointer transition-all"
            >
              INITIALIZE METAMASK
            </button>
          </div>
        )}
      </div>

      {wallet.isConnected && wallet.publicKey ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Area (Main balance cards + Transaction form) */}
          <div className="lg:col-span-8 space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Account Balance Card - Stark Monochrome Design */}
              <div className="p-8 rounded-[28px] border border-zinc-800 bg-zinc-950/40 backdrop-blur-3xl shadow-2xl flex flex-col justify-between min-h-[220px] hover:border-zinc-700/80 hover:shadow-[0_0_30px_rgba(255,255,255,0.02)] transition-all duration-300 relative group overflow-hidden">
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-zinc-800 rounded-tl group-hover:border-zinc-600 transition-colors" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-zinc-800 rounded-tr group-hover:border-zinc-600 transition-colors" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-zinc-800 rounded-bl group-hover:border-zinc-600 transition-colors" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-zinc-800 rounded-br group-hover:border-zinc-600 transition-colors" />
                
                <div>
                  <div className="flex justify-between items-start font-mono">
                    <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase">Native Asset Balance</span>
                    <span className="px-2.5 py-1 rounded-full bg-white/5 border border-zinc-800 text-[9px] text-white font-bold tracking-widest">
                      {wallet.walletType === 'metamask' ? 'ETH' : 'XLM'}
                    </span>
                  </div>
                  <div className="mt-5 flex items-baseline gap-2">
                    <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white font-display">
                      {isLoadingAccount ? (
                        <span className="opacity-40 animate-pulse">...</span>
                      ) : account ? (
                        parseFloat(account.xlmBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
                      ) : (
                        '0.00'
                      )}
                    </h2>
                    <span className="text-sm font-semibold text-zinc-500 font-mono">
                      {wallet.walletType === 'metamask' ? 'ETHER' : 'LUMENS'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1.5 font-mono">
                    ≈ ${account ? (parseFloat(account.xlmBalance) * (wallet.walletType === 'metamask' ? 3200 : 0.11)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} USD
                  </p>
                </div>
                
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-zinc-900">
                  <span className="text-[9px] uppercase text-zinc-500 font-bold tracking-widest font-mono flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-ping"></span>
                    SESSION_CONNECTED
                  </span>
                  <button
                    onClick={refreshAccount}
                    disabled={isLoadingAccount}
                    className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all cursor-pointer hover:scale-105 active:scale-95"
                    title="Refresh Ledger Balance"
                  >
                    <RefreshCw size={12} className={isLoadingAccount ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>

              {/* Account State Card */}
              <div className="p-8 rounded-[28px] border border-zinc-800 bg-zinc-950/40 backdrop-blur-3xl shadow-2xl flex flex-col justify-between min-h-[220px] hover:border-zinc-700/80 hover:shadow-[0_0_30px_rgba(255,255,255,0.02)] transition-all duration-300 relative group overflow-hidden">
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-zinc-800 rounded-tl group-hover:border-zinc-600 transition-colors" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-zinc-800 rounded-tr group-hover:border-zinc-600 transition-colors" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-zinc-800 rounded-bl group-hover:border-zinc-600 transition-colors" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-zinc-800 rounded-br group-hover:border-zinc-600 transition-colors" />

                <div>
                  <div className="flex justify-between items-start font-mono">
                    <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase">Voyage Parameters</span>
                    {account && (
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        account.exists
                          ? 'bg-white/5 text-white border-zinc-800'
                          : 'bg-zinc-900/60 text-zinc-500 border-zinc-800'
                      }`}>
                        {account.exists ? 'ACTIVE' : 'UNREGISTERED'}
                      </span>
                    )}
                  </div>

                  <div className="mt-5 space-y-4">
                    <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800 font-mono">
                      <span className="block text-[8px] uppercase text-zinc-500 font-bold tracking-widest mb-1">Sequence ID</span>
                      <span className="text-xs font-bold text-zinc-300 block truncate">
                        {isLoadingAccount ? '...' : account?.sequenceNumber || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-zinc-900 text-[9px] text-zinc-500 font-mono font-bold tracking-widest">
                  <span className="uppercase">Subentries</span>
                  <span className="text-white">{account?.subentryCount ?? 0}</span>
                </div>
              </div>

            </div>

            {/* Inactive Account Banner / Friendbot Faucet */}
            {account && !account.exists && (
              <div className="p-8 sm:p-10 rounded-[28px] border border-rose-500/20 bg-rose-950/20 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-rose-900/40 rounded-tl" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-rose-900/40 rounded-br" />
                <div className="flex items-start gap-5">
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl shrink-0">
                    <ShieldAlert size={20} />
                  </div>
                  <div className="space-y-2 font-mono">
                    <h4 className="font-display font-bold text-xs tracking-widest text-rose-200 uppercase">
                      UNACTIVATED TERMINAL DETECTED
                    </h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-sans font-light">
                      This public key is empty on-chain. Register your address automatically with Friendbot and receive 10,000 free testnet XLM below.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={requestAirdrop}
                        disabled={isFunding}
                        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full btn-metallic text-[10px] font-mono font-bold tracking-widest uppercase transition-all cursor-pointer shadow-md"
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
              <div className="p-8 sm:p-10 rounded-[28px] border border-zinc-800 bg-zinc-950/40 backdrop-blur-3xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 border border-zinc-800 text-white rounded-2xl shrink-0">
                    <Sparkles size={16} />
                  </div>
                  <div className="font-mono">
                    <h5 className="font-bold text-xs text-white uppercase tracking-widest">Testnet Faucet Refill</h5>
                    <p className="text-[11px] text-zinc-500 mt-1 font-sans font-light">Need additional tokens? Push another 10,000 testnet XLM onto this address.</p>
                  </div>
                </div>
                <button
                  onClick={requestAirdrop}
                  disabled={isFunding}
                  className="px-6 py-3.5 rounded-full btn-metallic font-mono font-bold text-[10px] tracking-widest transition-all cursor-pointer self-stretch sm:self-center uppercase shadow-md"
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
            <div className="p-8 sm:p-10 rounded-[28px] border border-zinc-800 bg-zinc-950/40 backdrop-blur-3xl shadow-2xl relative overflow-hidden group hover:border-zinc-700/80 transition-all duration-300">
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-zinc-700 rounded-tl group-hover:border-zinc-500" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-zinc-700 rounded-br group-hover:border-zinc-500" />
              <h4 className="font-sans font-bold text-xs tracking-widest text-zinc-400 mb-6 uppercase">
                Public Key Envelope
              </h4>
              <div className="space-y-5 font-mono">
                <div>
                  <span className="text-[8px] text-zinc-500 block mb-1.5 uppercase tracking-widest font-bold">Stellar Address</span>
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between gap-2 overflow-hidden">
                    <span className="text-xs text-zinc-300 select-all truncate block">
                      {wallet.publicKey}
                    </span>
                    <button
                      onClick={() => handleCopyAddress(wallet.publicKey!)}
                      className="px-3.5 py-2 rounded-full border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-800 hover:text-white text-zinc-400 text-[10px] font-bold transition-all cursor-pointer shrink-0"
                    >
                      COPY
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[9px]">
                  <div className="bg-zinc-900/40 p-3.5 rounded-xl border border-zinc-800">
                    <span className="text-zinc-500 block mb-1 uppercase tracking-wider font-bold">PROVIDER</span>
                    <span className="text-zinc-200 font-bold block">{wallet.walletType === 'metamask' ? 'MetaMask' : 'Freighter'}</span>
                  </div>
                  <div className="bg-zinc-900/40 p-3.5 rounded-xl border border-zinc-800">
                    <span className="text-zinc-500 block mb-1 uppercase tracking-wider font-bold">EST. FEE</span>
                    <span className="text-zinc-200 font-bold block">{wallet.walletType === 'metamask' ? '0.0001 ETH' : '0.0001 XLM'}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href={wallet.walletType === 'metamask' ? `https://sepolia.etherscan.io/address/${wallet.publicKey}` : `https://stellar.expert/explorer/testnet/account/${wallet.publicKey}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 py-3.5 w-full rounded-full bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-750 text-zinc-300 hover:text-white text-[10px] font-bold tracking-widest transition-all text-center uppercase"
                  >
                    {wallet.walletType === 'metamask' ? 'VIEW IN ETHERSCAN' : 'VIEW IN STELLAR EXPERT'}
                    <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            </div>

            {/* Public Address QR Code Generator */}
            <AddressQRCodeGenerator 
              address={wallet.publicKey!} 
              label={wallet.walletType === 'metamask' ? 'MetaMask Address' : 'Stellar Address'} 
              network={wallet.walletType === 'metamask' ? wallet.network || 'SEPOLIA' : 'TESTNET'} 
            />

            {/* Space Pilot instructions / Quick Guide */}
            <div className="p-8 rounded-[28px] border border-zinc-850 bg-zinc-950/20 backdrop-blur-md space-y-4 text-xs leading-relaxed text-zinc-400 font-mono">
              <h4 className="font-sans font-semibold text-xs tracking-widest text-white flex items-center gap-1.5 uppercase">
                <HelpCircle size={14} className="text-zinc-400" />
                Terminal Protocol Guide
              </h4>
              <div className="space-y-3 font-sans font-light text-[11px] text-zinc-400 leading-relaxed">
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
        <div className="py-24 text-center max-w-lg mx-auto space-y-8 animate-fade-in font-mono">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white text-black flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)]">
            <Globe size={28} />
          </div>
          <div className="space-y-4">
            <h3 className="font-display font-black text-xl text-white uppercase tracking-widest">Initialize Terminal Node</h3>
            <p className="text-xs text-zinc-400 font-sans font-light leading-relaxed">
              Connect your secure browser key management extension to synchronize active balance parameters, current sequence index, and validate transaction signatures.
            </p>
          </div>
          <div>
            <button
              onClick={() => connect()}
              className="px-8 py-4 rounded-full btn-metallic font-bold text-xs tracking-widest uppercase transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-[0_4px_12px_rgba(255,255,255,0.1)]"
            >
              CONNECT SECURE TERMINAL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
