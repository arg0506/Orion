import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { buildPaymentTransaction, submitSignedTransaction, isValidAddress } from '../services/stellar';
import { signTransaction } from '@stellar/freighter-api';
import { useTransactionHistory } from '../hooks/useTransactionHistory';
import { motion, AnimatePresence } from 'motion/react';
import { Send, RefreshCw, CheckCircle2, AlertTriangle, ExternalLink, X, Copy } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SendTransactionForm() {
  const { wallet, account, refreshAccount } = useWallet();
  const { addTransaction } = useTransactionHistory(wallet.publicKey);

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [isSending, setIsSending] = useState(false);

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

  const handleRecipientChange = (val: string) => {
    setRecipient(val);
    if (!val.trim()) {
      setRecipientError('');
      return;
    }
    if (!isValidAddress(val.trim())) {
      setRecipientError('Invalid Stellar G-address format.');
    } else if (wallet.publicKey && val.trim().toLowerCase() === wallet.publicKey.toLowerCase()) {
      setRecipientError('Cannot send XLM to your own address.');
    } else {
      setRecipientError('');
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

    if (account) {
      const balance = parseFloat(account.xlmBalance);
      if (amt >= balance) {
        setAmountError(`Sufficient balance is required. Your balance: ${account.xlmBalance} XLM`);
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
    if (!cleanRecipient || !isValidAddress(cleanRecipient)) {
      setRecipientError('A valid recipient address is required.');
      return;
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

    if (account && parsedAmt >= parseFloat(account.xlmBalance)) {
      setAmountError(`Sufficient balance is required. Your balance: ${account.xlmBalance} XLM`);
      return;
    }

    setIsSending(true);
    setOutcome(null);
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
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast.success('Transaction hash copied!');
  };

  return (
    <div className="p-6 sm:p-8 rounded bg-white/[0.02] border border-white/10 flex flex-col backdrop-blur-xl relative overflow-hidden shadow-2xl font-mono">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <Send size={14} className="text-white" />
          Send Payment
        </h3>
        {isSending && (
          <span className="flex items-center gap-1.5 text-[9px] font-mono text-white bg-white/10 border border-white/20 px-2 py-0.5 rounded uppercase tracking-wider">
            <RefreshCw size={10} className="animate-spin" />
            Broadcasting
          </span>
        )}
      </div>

      <form onSubmit={handleSendXLM} className="space-y-5">
        {/* Recipient Input */}
        <div className="space-y-1.5">
          <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">
            Recipient G-Address
          </label>
          <div className="relative">
            <input
              type="text"
              required
              disabled={isSending || !wallet.publicKey}
              value={recipient}
              onChange={(e) => handleRecipientChange(e.target.value)}
              placeholder="G... (Stellar Public Key)"
              className={`w-full bg-black/60 border rounded px-4 py-3 text-xs focus:outline-none transition-all font-mono placeholder:text-gray-700 text-white ${
                recipientError
                  ? 'border-white/20 text-white'
                  : 'border-white/10 focus:border-white'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            />
          </div>
          {recipientError && (
            <p className="mt-1 text-[9px] font-mono text-gray-400 flex items-center gap-1 uppercase tracking-wider">
              <AlertTriangle size={11} />
              {recipientError}
            </p>
          )}
        </div>

        {/* Amount Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">
              Amount
            </label>
            {account && (
              <button
                type="button"
                onClick={() => {
                  const maxAmt = Math.max(0, parseFloat(account.xlmBalance) - 1.5);
                  handleAmountChange(maxAmt.toFixed(4));
                }}
                disabled={isSending || !wallet.publicKey || parseFloat(account.xlmBalance) <= 1.5}
                className="text-[9px] text-white hover:underline disabled:opacity-50 cursor-pointer uppercase tracking-wider"
              >
                Use Max (~{Math.max(0, parseFloat(account.xlmBalance) - 1.5).toFixed(2)} XLM)
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
              className={`w-full bg-black/60 border rounded px-4 py-3 text-xs focus:outline-none transition-all font-mono placeholder:text-gray-700 text-white pr-12 ${
                amountError
                  ? 'border-white/20 text-white'
                  : 'border-white/10 focus:border-white'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gray-500 tracking-widest">
              XLM
            </span>
          </div>
          {amountError && (
            <p className="mt-1 text-[9px] font-mono text-gray-400 flex items-center gap-1 uppercase tracking-wider">
              <AlertTriangle size={11} />
              {amountError}
            </p>
          )}
        </div>

        {/* Memo Input */}
        <div className="space-y-1.5">
          <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">
            Memo Text <span className="text-gray-600 font-sans font-normal lowercase">(optional)</span>
          </label>
          <input
            type="text"
            disabled={isSending || !wallet.publicKey}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Coffee payment / Invoice ID"
            maxLength={28}
            className="w-full bg-black/60 border border-white/10 focus:border-white rounded px-4 py-3 text-xs focus:outline-none transition-all font-mono placeholder:text-gray-700 text-white"
          />
          <div className="flex justify-between mt-1 text-[9px] text-gray-600">
            <span>Encodes in UTF-8</span>
            <span>{memo.length}/28 chars</span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSending || !wallet.publicKey || !!recipientError || !!amountError}
          className="w-full py-4 rounded bg-white text-black font-bold text-xs tracking-widest hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all mt-2 cursor-pointer uppercase font-mono"
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
          <p className="text-center text-[9px] text-gray-500 uppercase tracking-widest">
            Establish a freighter connection to transmit payloads.
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
            className="mt-6 p-4 rounded border relative bg-white/[0.01] border-white/10"
          >
            <button
              onClick={() => setOutcome(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>

            {outcome.status === 'success' ? (
              <div className="space-y-3 font-mono">
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle2 size={14} />
                  <h4 className="font-bold text-xs tracking-widest uppercase">Shipment Transmitted</h4>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[10px] bg-black/60 p-3 rounded border border-white/5">
                  <div>
                    <span className="text-gray-500 block mb-0.5 uppercase tracking-wider">SENT:</span>
                    <span className="text-white font-bold">{outcome.amountSent} XLM</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-0.5 uppercase tracking-wider">LEDGER INDEX:</span>
                    <span className="text-white font-bold">{outcome.ledger || 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500 block mb-0.5 uppercase tracking-wider">RECIPIENT:</span>
                    <span className="text-gray-300 select-all truncate block" title={outcome.recipientAddr}>
                      {outcome.recipientAddr}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1.5">
                  <button
                    onClick={() => handleCopyHash(outcome.hash!)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                  >
                    <Copy size={11} />
                    Copy Tx Hash
                  </button>
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${outcome.hash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-white text-black hover:bg-gray-200 text-[10px] font-bold uppercase tracking-wider transition-all text-center"
                  >
                    Stellar Expert
                    <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-2 font-mono">
                <div className="flex items-center gap-2 text-white">
                  <AlertTriangle size={14} />
                  <h4 className="font-bold text-xs tracking-widest uppercase">Transmission Fault</h4>
                </div>
                <p className="text-[10px] text-gray-400 bg-black/60 p-2.5 rounded border border-white/5 whitespace-pre-wrap leading-relaxed">
                  {outcome.errorReason}
                </p>
                <div className="pt-1">
                  <button
                    onClick={() => {
                      setOutcome(null);
                      handleSendXLM({ preventDefault: () => {} } as any);
                    }}
                    className="py-2 px-3 bg-white text-black hover:bg-gray-200 font-bold text-[10px] tracking-widest uppercase transition-all cursor-pointer"
                  >
                    Re-authorize Payload
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
