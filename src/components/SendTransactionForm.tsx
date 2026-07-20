import React, { useState } from 'react';
import { useWallet, isIFrame } from '../context/WalletContext';
import { buildPaymentTransaction, submitSignedTransaction, isValidAddress } from '../services/stellar';
import { signTransaction } from '@stellar/freighter-api';
import { useTransactionHistory } from '../hooks/useTransactionHistory';
import { motion, AnimatePresence } from 'motion/react';
import { Send, RefreshCw, CheckCircle2, AlertTriangle, ExternalLink, X, Copy, QrCode } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AddressQRCodeScanner } from './QRCodeUtility';

export default function SendTransactionForm() {
  const { wallet, account, refreshAccount } = useWallet();
  const { addTransaction } = useTransactionHistory(wallet.publicKey);

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Validation states
  const [recipientError, setRecipientError] = useState('');
  const [amountError, setAmountError] = useState('');

  // Transaction outcome states
  const [outcome, setOutcome] = useState<{
    status: 'success' | 'failed';
    hash?: string;
    ledger?: number;
    errorReason?: string;
    amountSent?: string;
    recipientAddr?: string;
    timestamp?: string;
  } | null>(null);

  const isValidEVMAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleRecipientChange = (val: string) => {
    setRecipient(val);
    if (!val.trim()) {
      setRecipientError('');
      return;
    }

    const isMetaMask = wallet.walletType === 'metamask';
    if (isMetaMask) {
      if (!isValidEVMAddress(val.trim())) {
        setRecipientError('Invalid Ethereum address format (0x...).');
      } else if (wallet.publicKey && val.trim().toLowerCase() === wallet.publicKey.toLowerCase()) {
        setRecipientError('Cannot send ETH to your own address.');
      } else {
        setRecipientError('');
      }
    } else {
      if (!isValidAddress(val.trim())) {
        setRecipientError('Invalid Stellar G-address format.');
      } else if (wallet.publicKey && val.trim().toLowerCase() === wallet.publicKey.toLowerCase()) {
        setRecipientError('Cannot send XLM to your own address.');
      } else {
        setRecipientError('');
      }
    }
  };

  const handleAmountChange = (val: string) => {
    setAmount(val);
    if (!val.trim()) {
      setAmountError('');
      return;
    }
    const amt = parseFloat(val);
    if (isNaN(amt) || amt <= 0) {
      setAmountError('Amount must be greater than 0.');
      return;
    }

    const symbol = wallet.walletType === 'metamask' ? 'ETH' : 'XLM';

    if (account) {
      const balance = parseFloat(account.xlmBalance);
      if (amt >= balance) {
        setAmountError(`Sufficient balance is required. Your balance: ${account.xlmBalance} ${symbol}`);
      } else {
        setAmountError('');
      }
    } else {
      setAmountError('');
    }
  };

  const handleSendXLM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.publicKey) {
      toast.error('Connect your wallet first.');
      return;
    }

    const cleanRecipient = recipient.trim();
    const cleanAmount = amount.trim();
    const cleanMemo = memo.trim();

    // Re-validate fields
    const isMetaMask = wallet.walletType === 'metamask';
    if (isMetaMask) {
      if (!cleanRecipient || !isValidEVMAddress(cleanRecipient)) {
        setRecipientError('A valid Ethereum recipient address is required.');
        return;
      }
    } else {
      if (!cleanRecipient || !isValidAddress(cleanRecipient)) {
        setRecipientError('A valid recipient address is required.');
        return;
      }
    }

    if (cleanRecipient.toLowerCase() === wallet.publicKey.toLowerCase()) {
      setRecipientError('Cannot send to yourself.');
      return;
    }

    const parsedAmt = parseFloat(cleanAmount);
    if (!cleanAmount || isNaN(parsedAmt) || parsedAmt <= 0) {
      setAmountError('A valid amount greater than 0 is required.');
      return;
    }

    const symbol = isMetaMask ? 'ETH' : 'XLM';

    if (account && parsedAmt >= parseFloat(account.xlmBalance)) {
      setAmountError(`Sufficient balance is required. Your balance: ${account.xlmBalance} ${symbol}`);
      return;
    }

    setIsSending(true);
    setOutcome(null);

    if (isMetaMask) {
      const progressToast = toast.loading('Initiating MetaMask transaction...');
      try {
        const isSimulated = !(typeof window !== 'undefined' && (window as any).ethereum) || wallet.publicKey?.startsWith('0xSIM_');
        
        if (isSimulated) {
          // Simulate standard transaction latency
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          const mockHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
          
          // Deduct from simulated balance
          const currentBal = account ? parseFloat(account.xlmBalance) : 100;
          const newBal = Math.max(0, currentBal - parsedAmt - 0.0001);
          localStorage.setItem('sim_eth_balance', newBal.toFixed(4));
          
          addTransaction({
            hash: mockHash,
            sender: wallet.publicKey || '0xSIM_f39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            recipient: cleanRecipient,
            amount: cleanAmount,
            memo: cleanMemo || 'Simulated MetaMask Transfer',
            status: 'success',
            ledger: 0,
          });

          setOutcome({
            status: 'success',
            hash: mockHash,
            amountSent: cleanAmount,
            recipientAddr: cleanRecipient,
            timestamp: new Date().toISOString(),
          });

          toast.success('Simulated MetaMask transaction sent successfully!', { id: progressToast });
          setRecipient('');
          setAmount('');
          setMemo('');
          refreshAccount();
        } else {
          const provider = (window as any).ethereum;
          // Format values for EVM eth_sendTransaction
          const valueWei = '0x' + Math.floor(parsedAmt * 1e18).toString(16);
          
          const txHash = await provider.request({
            method: 'eth_sendTransaction',
            params: [{
              from: wallet.publicKey,
              to: cleanRecipient,
              value: valueWei,
            }]
          });

          addTransaction({
            hash: txHash,
            sender: wallet.publicKey!,
            recipient: cleanRecipient,
            amount: cleanAmount,
            memo: cleanMemo || 'MetaMask Transfer',
            status: 'success',
            ledger: 0,
          });

          setOutcome({
            status: 'success',
            hash: txHash,
            amountSent: cleanAmount,
            recipientAddr: cleanRecipient,
            timestamp: new Date().toISOString(),
          });

          toast.success('MetaMask transaction sent successfully!', { id: progressToast });
          setRecipient('');
          setAmount('');
          setMemo('');
          refreshAccount();
        }
      } catch (err: any) {
        console.error('MetaMask submission failed:', err);
        toast.error('MetaMask transaction failed.', { id: progressToast });
        setOutcome({
          status: 'failed',
          errorReason: err.message || 'Transaction rejected by user or failed on-chain.',
        });
      } finally {
        setIsSending(false);
      }
    } else {
      const progressToast = toast.loading('Building transaction...');
      try {
        // Step 1: Build the transaction envelope
        toast.loading('Preparing transaction envelope...', { id: progressToast });
        const transactionXDR = await buildPaymentTransaction({
          senderPublicKey: wallet.publicKey,
          recipientAddress: cleanRecipient,
          amount: cleanAmount,
          memo: cleanMemo,
        });

        // Step 2: Request signature from Freighter wallet
        toast.loading('Requesting Freighter signature...', { id: progressToast });
        let signedXDR: string;
        try {
          const signRes = await signTransaction(transactionXDR, {
            networkPassphrase: 'Test SDF Network ; September 2015',
          });
          if (signRes.error) {
            throw new Error(signRes.error);
          }
          signedXDR = signRes.signedTxXdr;
        } catch (signErr: any) {
          console.error('Signing rejected:', signErr);
          throw new Error(signErr.message || 'Transaction signing rejected by Freighter wallet.');
        }

        if (!signedXDR) {
          throw new Error('Freighter failed to return a signed transaction.');
        }

        // Step 3: Submit signed transaction to Stellar Testnet
        toast.loading('Submitting transaction to Stellar Testnet...', { id: progressToast });
        const submitResult = await submitSignedTransaction(signedXDR);

        // Log transaction history
        addTransaction({
          hash: submitResult.hash,
          sender: wallet.publicKey,
          recipient: cleanRecipient,
          amount: cleanAmount,
          memo: cleanMemo,
          status: 'success',
          ledger: submitResult.ledger,
        });

        // Success state
        setOutcome({
          status: 'success',
          hash: submitResult.hash,
          ledger: submitResult.ledger,
          amountSent: cleanAmount,
          recipientAddr: cleanRecipient,
          timestamp: new Date().toISOString(),
        });

        toast.success('Transaction submitted successfully!', { id: progressToast });
        setRecipient('');
        setAmount('');
        setMemo('');
        refreshAccount();
      } catch (err: any) {
        console.error('Submission failed:', err);
        toast.error('Transaction failed on-chain', { id: progressToast });
        setOutcome({
          status: 'failed',
          errorReason: err.message || 'Unknown network error occurred during broadcast.',
        });
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast.success('Transaction hash copied!');
  };

  const isMetaMask = wallet.walletType === 'metamask';

  return (
    <div className="p-8 sm:p-10 rounded-[28px] border border-zinc-800 bg-zinc-950/40 backdrop-blur-3xl flex flex-col relative overflow-hidden shadow-2xl font-sans hover:border-zinc-700/80 transition-all duration-300 group">
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-zinc-700 rounded-tl group-hover:border-zinc-500 transition-colors" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-zinc-700 rounded-tr group-hover:border-zinc-500 transition-colors" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-zinc-700 rounded-bl group-hover:border-zinc-500 transition-colors" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-zinc-700 rounded-br group-hover:border-zinc-500 transition-colors" />

      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 font-mono">
          <Send size={14} className="text-zinc-400" />
          {isMetaMask ? 'Send EVM Payment' : 'Send Stellar Payment'}
        </h3>
        {isSending && (
          <span className="flex items-center gap-1.5 text-[9px] font-mono text-white bg-white/5 border border-zinc-800 px-2.5 py-1 rounded-full uppercase tracking-wider">
            <RefreshCw size={10} className="animate-spin" />
            Broadcasting
          </span>
        )}
      </div>

      <form onSubmit={handleSendXLM} className="space-y-5">
        {/* Recipient Input */}
        <div className="space-y-1.5">
          <label className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest font-mono">
            {isMetaMask ? 'Recipient ETH Address (0x)' : 'Recipient G-Address'}
          </label>
          <div className="relative">
            <input
              type="text"
              required
              disabled={isSending || !wallet.publicKey}
              value={recipient}
              onChange={(e) => handleRecipientChange(e.target.value)}
              placeholder={isMetaMask ? "0x... (Ethereum Address)" : "G... (Stellar Public Key)"}
              className={`w-full bg-zinc-900/40 border rounded-xl pl-4 pr-12 py-3.5 text-xs focus:outline-none transition-all font-mono placeholder:text-zinc-700 text-white ${
                recipientError
                  ? 'border-rose-500/30 text-white'
                  : 'border-zinc-800 focus:border-zinc-500'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            />
            {wallet.publicKey && (
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 hover:bg-white/5 text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center justify-center bg-zinc-950/80"
                title="Scan Address QR Code"
              >
                <QrCode size={14} />
              </button>
            )}
          </div>
          {recipientError && (
            <p className="mt-1 text-[9px] font-mono text-rose-400 flex items-center gap-1 uppercase tracking-wider">
              <AlertTriangle size={11} />
              {recipientError}
            </p>
          )}
        </div>

        {/* Amount Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest font-mono">
              Amount
            </label>
            {account && (
              <button
                type="button"
                onClick={() => {
                  const maxAmt = Math.max(0, parseFloat(account.xlmBalance) - (isMetaMask ? 0.005 : 1.5));
                  handleAmountChange(maxAmt.toFixed(4));
                }}
                disabled={isSending || !wallet.publicKey || parseFloat(account.xlmBalance) <= (isMetaMask ? 0.005 : 1.5)}
                className="text-[9px] text-zinc-400 hover:text-white hover:underline disabled:opacity-50 cursor-pointer uppercase tracking-wider font-mono"
              >
                Use Max (~{Math.max(0, parseFloat(account.xlmBalance) - (isMetaMask ? 0.005 : 1.5)).toFixed(3)} {isMetaMask ? 'ETH' : 'XLM'})
              </button>
            )}
          </div>
          <div className="relative">
            <input
              type="number"
              step="any"
              required
              disabled={isSending || !wallet.publicKey}
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.00"
              className={`w-full bg-zinc-900/40 border rounded-xl px-4 py-3.5 text-xs focus:outline-none transition-all font-mono placeholder:text-zinc-700 text-white pr-12 ${
                amountError
                  ? 'border-rose-500/30 text-white'
                  : 'border-zinc-800 focus:border-zinc-500'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-bold text-zinc-500 tracking-widest font-mono">
              {isMetaMask ? 'ETH' : 'XLM'}
            </span>
          </div>
          {amountError && (
            <p className="mt-1 text-[9px] font-mono text-rose-400 flex items-center gap-1 uppercase tracking-wider">
              <AlertTriangle size={11} />
              {amountError}
            </p>
          )}
        </div>

        {/* Memo Input */}
        <div className="space-y-1.5">
          <label className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest font-mono">
            {isMetaMask ? 'Transaction Note' : 'Memo Text'} <span className="text-zinc-600 font-sans font-normal lowercase">(optional)</span>
          </label>
          <input
            type="text"
            disabled={isSending || !wallet.publicKey}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder={isMetaMask ? "Transfer note" : "Coffee payment / Invoice ID"}
            maxLength={28}
            className="w-full bg-zinc-900/40 border border-zinc-800 focus:border-zinc-500 rounded-xl px-4 py-3.5 text-xs focus:outline-none transition-all font-mono placeholder:text-zinc-700 text-white"
          />
          <div className="flex justify-between mt-1 text-[9px] text-zinc-600 font-mono">
            <span>Encodes in UTF-8</span>
            <span>{memo.length}/28 chars</span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSending || !wallet.publicKey || !!recipientError || !!amountError}
          className="w-full py-4 rounded-full btn-metallic font-bold text-xs tracking-widest disabled:opacity-30 disabled:cursor-not-allowed transition-all mt-3 cursor-pointer uppercase font-mono shadow-md"
        >
          {isSending ? (
            <span className="flex items-center justify-center gap-2">
              <RefreshCw size={12} className="animate-spin" />
              Broadcasting Shipment...
            </span>
          ) : (
            'Authorize Shipment'
          )}
        </button>

        {!wallet.publicKey && (
          <p className="text-center text-[9px] text-zinc-500 uppercase tracking-widest font-mono pt-1">
            {isMetaMask ? 'Establish a MetaMask connection to transmit payloads.' : 'Establish a Freighter connection to transmit payloads.'}
          </p>
        )}
      </form>

      {/* Outcome Banner */}
      <AnimatePresence>
        {outcome && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-6 p-6 rounded-2xl border relative bg-zinc-950/60 border-zinc-800 backdrop-blur-md"
          >
            <button
              onClick={() => setOutcome(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>

            {outcome.status === 'success' ? (
              <div className="space-y-4 font-mono">
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <h4 className="font-bold text-xs tracking-widest uppercase">Shipment Transmitted</h4>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[10px] bg-zinc-900/40 p-4 rounded-xl border border-zinc-850">
                  <div>
                    <span className="text-zinc-500 block mb-0.5 uppercase tracking-wider font-bold text-[8px]">SENT:</span>
                    <span className="text-white font-bold">{outcome.amountSent} {isMetaMask ? 'ETH' : 'XLM'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block mb-0.5 uppercase tracking-wider font-bold text-[8px]">{isMetaMask ? 'TX STATUS:' : 'LEDGER INDEX:'}</span>
                    <span className="text-white font-bold">{isMetaMask ? 'CONFIRMED' : (outcome.ledger || 'N/A')}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-zinc-500 block mb-0.5 uppercase tracking-wider font-bold text-[8px]">RECIPIENT:</span>
                    <span className="text-zinc-300 select-all truncate block font-light" title={outcome.recipientAddr}>
                      {outcome.recipientAddr}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    onClick={() => handleCopyHash(outcome.hash!)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-850 hover:text-white text-zinc-400 text-[10px] font-mono font-bold uppercase tracking-widest transition-all cursor-pointer"
                  >
                    <Copy size={11} />
                    Copy Tx Hash
                  </button>
                  <a
                    href={isMetaMask ? `https://sepolia.etherscan.io/tx/${outcome.hash}` : `https://stellar.expert/explorer/testnet/tx/${outcome.hash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full btn-metallic text-[10px] font-mono font-bold uppercase tracking-widest transition-all text-center"
                  >
                    {isMetaMask ? 'Etherscan' : 'Stellar Expert'}
                    <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-4 font-mono">
                <div className="flex items-center gap-2 text-rose-400">
                  <AlertTriangle size={14} />
                  <h4 className="font-bold text-xs tracking-widest uppercase">Transmission Fault</h4>
                </div>
                <p className="text-[10px] text-zinc-400 bg-zinc-950/80 p-3.5 rounded-xl border border-rose-500/15 whitespace-pre-wrap leading-relaxed font-light">
                  {outcome.errorReason}
                </p>
                <div className="pt-1">
                  <button
                    onClick={() => {
                      setOutcome(null);
                      handleSendXLM({ preventDefault: () => {} } as any);
                    }}
                    className="py-3 px-5 rounded-full btn-metallic font-bold text-[10px] tracking-widest uppercase transition-all cursor-pointer shadow-md"
                  >
                    Re-authorize Payload
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Scanner Overlay */}
      <AddressQRCodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(scannedAddr) => {
          handleRecipientChange(scannedAddr);
          toast.success(`Address loaded: ${scannedAddr.substring(0, 8)}...${scannedAddr.substring(scannedAddr.length - 8)}`);
        }}
        allowedTypes={isMetaMask ? 'evm' : 'stellar'}
      />
    </div>
  );
}
