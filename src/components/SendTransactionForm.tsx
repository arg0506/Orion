import React, { useEffect, useState } from 'react';
import { signTransaction } from '@stellar/freighter-api';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUpRight, CheckCircle2, ExternalLink, QrCode, X, XCircle, UserPlus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useWallet } from '../context/WalletContext';
import {
  accountExists,
  buildPaymentTransaction,
  isValidAddress,
  memoByteLength,
  MEMO_MAX_BYTES,
  NETWORK_PASSPHRASE,
  spendableBalance,
  submitSignedTransaction,
} from '../services/stellar';
import { useTransactionHistory } from '../hooks/useTransactionHistory';
import { AddressQRCodeScanner } from './QRCodeUtility';
import { Badge, Button, Card, CardHeader, CopyButton, Field, Mono, formatAmount, inputClass, shortAddress } from './ui';

const EVM_GAS_BUFFER = 0.0005;
const isValidEVMAddress = (a: string) => /^0x[a-fA-F0-9]{40}$/.test(a);

type Outcome =
  | { status: 'success'; hash: string; ledger?: number; amount: string; recipient: string; createdAccount?: boolean }
  | { status: 'failed'; reason: string };

export default function SendTransactionForm() {
  const { wallet, account, refreshAccount } = useWallet();
  const { addTransaction } = useTransactionHistory(wallet.publicKey);

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [step, setStep] = useState<string>('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [touched, setTouched] = useState({ recipient: false, amount: false });
  const [recipientIsNew, setRecipientIsNew] = useState<boolean | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const isEvm = wallet.walletType === 'metamask';
  const symbol = isEvm ? 'ETH' : 'XLM';
  const balance = account ? parseFloat(account.xlmBalance) : 0;
  const maxSendable = isEvm ? Math.max(0, balance - EVM_GAS_BUFFER) : spendableBalance(balance, account?.subentryCount ?? 0);
  const cleanRecipient = recipient.trim();
  const memoBytes = memoByteLength(memo.trim());

  // Validation (pure, recomputed every render)
  let recipientError = '';
  if (cleanRecipient) {
    if (isEvm ? !isValidEVMAddress(cleanRecipient) : !isValidAddress(cleanRecipient)) {
      recipientError = isEvm ? 'Enter a valid Ethereum address (0x…, 42 characters).' : 'Enter a valid Stellar address (starts with G, 56 characters).';
    } else if (wallet.publicKey && cleanRecipient.toLowerCase() === wallet.publicKey.toLowerCase()) {
      recipientError = 'This is your own address.';
    }
  }

  let amountError = '';
  const amt = parseFloat(amount);
  if (amount.trim()) {
    if (isNaN(amt) || amt <= 0) amountError = 'Enter an amount greater than 0.';
    else if (!isEvm && /\.\d{8,}$/.test(amount.trim())) amountError = 'Stellar supports up to 7 decimal places.';
    else if (account && amt > maxSendable)
      amountError = isEvm
        ? `You can send up to ${formatAmount(maxSendable, 6)} ETH (a little is kept for gas).`
        : `You can send up to ${formatAmount(maxSendable)} XLM. The rest is the minimum balance your account must keep.`;
    else if (!isEvm && recipientIsNew && amt < 1) amountError = 'This address is new, so you need to send at least 1 XLM to create it.';
  }

  const memoError = memoBytes > MEMO_MAX_BYTES ? `Memo is ${memoBytes} bytes. Stellar allows ${MEMO_MAX_BYTES}.` : '';

  // Check whether a Stellar recipient already exists (debounced)
  useEffect(() => {
    setRecipientIsNew(null);
    if (isEvm || !isValidAddress(cleanRecipient)) return;
    let live = true;
    const id = setTimeout(() => {
      accountExists(cleanRecipient)
        .then((exists) => live && setRecipientIsNew(!exists))
        .catch(() => {});
    }, 350);
    return () => {
      live = false;
      clearTimeout(id);
    };
  }, [cleanRecipient, isEvm]);

  const blocked = !wallet.networkOk || !account || (!isEvm && !account.exists);
  const canSubmit = !blocked && !isSending && cleanRecipient && amount.trim() && !recipientError && !amountError && !memoError;

  const reset = () => {
    setRecipient('');
    setAmount('');
    setMemo('');
    setTouched({ recipient: false, amount: false });
  };

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setTouched({ recipient: true, amount: true });
    if (!canSubmit || !wallet.publicKey) return;

    setIsSending(true);
    setOutcome(null);
    const cleanMemo = memo.trim();

    try {
      if (isEvm) {
        setStep('Confirm in MetaMask…');
        const provider = (window as any).ethereum;
        // Convert via gwei to avoid floating-point overflow in wei
        const valueWeiHex = '0x' + (BigInt(Math.round(amt * 1e9)) * 10n ** 9n).toString(16);
        const hash: string = await provider.request({
          method: 'eth_sendTransaction',
          params: [{ from: wallet.publicKey, to: cleanRecipient, value: valueWeiHex }],
        });
        await addTransaction({ hash, sender: wallet.publicKey, recipient: cleanRecipient, amount: amount.trim(), memo: cleanMemo, status: 'success' });
        setOutcome({ status: 'success', hash, amount: amount.trim(), recipient: cleanRecipient });
        toast.success('Sent. Waiting for Sepolia to confirm.');
      } else {
        setStep('Preparing transaction…');
        const { xdr, createsAccount } = await buildPaymentTransaction({
          senderPublicKey: wallet.publicKey,
          recipientAddress: cleanRecipient,
          amount: amount.trim(),
          memo: cleanMemo,
        });

        setStep('Approve in Freighter…');
        const signed = await signTransaction(xdr, { networkPassphrase: NETWORK_PASSPHRASE, address: wallet.publicKey });
        if (signed.error) throw new Error(signed.error.message || 'You declined the request in Freighter.');
        if (!signed.signedTxXdr) throw new Error('Freighter did not return a signed transaction.');

        setStep('Submitting to the testnet…');
        const res = await submitSignedTransaction(signed.signedTxXdr);
        await addTransaction({
          hash: res.hash,
          sender: wallet.publicKey,
          recipient: cleanRecipient,
          amount: amount.trim(),
          memo: cleanMemo,
          status: 'success',
          ledger: res.ledger,
        });
        setOutcome({ status: 'success', hash: res.hash, ledger: res.ledger, amount: amount.trim(), recipient: cleanRecipient, createdAccount: createsAccount });
        toast.success(createsAccount ? 'Account created and funded' : 'Payment sent');
      }
      reset();
      refreshAccount({ silent: true });
    } catch (err: any) {
      console.error('Send failed:', err);
      const reason = err?.code === 4001 ? 'You declined the request in MetaMask.' : err?.message || 'The payment could not be sent.';
      setOutcome({ status: 'failed', reason });
      toast.error('Payment not sent');
    } finally {
      setIsSending(false);
      setStep('');
    }
  };

  return (
    <Card>
      <CardHeader
        title="Send"
        description={isEvm ? 'Send Sepolia ETH to any Ethereum address.' : 'Send test XLM to any Stellar address.'}
        action={isSending ? <Badge tone="info" dot>{step}</Badge> : undefined}
      />

      <form onSubmit={send} className="space-y-5" noValidate>
        <Field
          label="To"
          htmlFor="send-to"
          error={touched.recipient ? recipientError : ''}
          hint={
            !recipientError && recipientIsNew ? (
              <span className="text-warn inline-flex items-center gap-1.5">
                <UserPlus size={13} /> New address. This payment will create the account (minimum 1 XLM).
              </span>
            ) : !recipientError && recipientIsNew === false ? (
              <span className="text-ok">Active testnet account</span>
            ) : undefined
          }
        >
          <div className="relative">
            <input
              id="send-to"
              className={`${inputClass(touched.recipient && !!recipientError)} font-mono text-[14px] pr-12`}
              value={recipient}
              disabled={isSending}
              autoComplete="off"
              spellCheck={false}
              placeholder={isEvm ? '0x…' : 'G…'}
              onChange={(e) => {
                setRecipient(e.target.value);
                setTouched((t) => ({ ...t, recipient: e.target.value.trim().length >= (isEvm ? 42 : 56) || t.recipient }));
              }}
              onBlur={() => cleanRecipient && setTouched((t) => ({ ...t, recipient: true }))}
            />
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center rounded-lg text-muted hover:text-ink hover:bg-black/[0.04]"
              aria-label="Scan a QR code"
              title="Scan a QR code"
            >
              <QrCode size={17} />
            </button>
          </div>
        </Field>

        <Field
          label="Amount"
          htmlFor="send-amount"
          error={touched.amount ? amountError : ''}
          trailing={
            account && maxSendable > 0 ? (
              <button
                type="button"
                className="text-[13px] text-rigel hover:underline underline-offset-4 num"
                onClick={() => {
                  setAmount(isEvm ? maxSendable.toFixed(6) : maxSendable.toFixed(7).replace(/\.?0+$/, ''));
                  setTouched((t) => ({ ...t, amount: true }));
                }}
              >
                Max {formatAmount(maxSendable)} {symbol}
              </button>
            ) : undefined
          }
        >
          <div className="relative">
            <input
              id="send-amount"
              className={`${inputClass(touched.amount && !!amountError)} num pr-14 !h-14 font-serif !text-[24px]`}
              inputMode="decimal"
              value={amount}
              disabled={isSending}
              placeholder="0.00"
              onChange={(e) => {
                setAmount(e.target.value.replace(',', '.'));
                setTouched((t) => ({ ...t, amount: true }));
              }}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted">{symbol}</span>
          </div>
        </Field>

        {!isEvm && (
          <Field
            label="Memo (optional)"
            htmlFor="send-memo"
            error={memoError}
            hint="Some exchanges need a memo to credit your deposit."
            trailing={<span className={`text-[13px] num ${memoBytes > MEMO_MAX_BYTES ? 'text-bad' : 'text-subtle'}`}>{memoBytes}/{MEMO_MAX_BYTES} bytes</span>}
          >
            <input id="send-memo" className={inputClass(!!memoError)} value={memo} disabled={isSending} placeholder="e.g. Invoice 1042" onChange={(e) => setMemo(e.target.value)} />
          </Field>
        )}

        <Button type="submit" variant="primary" size="lg" className="w-full" loading={isSending} disabled={!canSubmit} icon={!isSending ? <ArrowUpRight size={17} /> : undefined}>
          {isSending ? step : amount && !amountError && cleanRecipient && !recipientError ? `Send ${formatAmount(amount)} ${symbol}` : 'Send'}
        </Button>

        {blocked && (
          <p className="text-[13px] text-muted text-center">
            {!wallet.networkOk
              ? 'Sending is paused until your wallet is on the right test network.'
              : !account
                ? 'Waiting for your balance to load.'
                : 'Fund your account with Friendbot before sending.'}
          </p>
        )}
      </form>

      <AnimatePresence>
        {outcome && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6">
            {outcome.status === 'success' ? (
              <div className="rounded-2xl border border-ok/25 bg-ok/[0.06] p-5 relative">
                <button onClick={() => setOutcome(null)} className="absolute right-3 top-3 p-1.5 rounded-lg text-muted hover:text-ink" aria-label="Dismiss">
                  <X size={16} />
                </button>
                <p className="flex items-center gap-2 font-semibold text-ink">
                  <CheckCircle2 size={18} className="text-ok" />
                  {outcome.createdAccount ? 'Account created' : 'Sent'} {formatAmount(outcome.amount)} {symbol}
                </p>
                <p className="text-sm text-muted mt-1">
                  to <Mono className="text-ink">{shortAddress(outcome.recipient, 6, 6)}</Mono>
                  {outcome.ledger ? <> · ledger <span className="num">{outcome.ledger.toLocaleString()}</span></> : null}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={isEvm ? `https://sepolia.etherscan.io/tx/${outcome.hash}` : `https://stellar.expert/explorer/testnet/tx/${outcome.hash}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button size="sm" icon={<ExternalLink size={14} />}>
                      View on {isEvm ? 'Etherscan' : 'Stellar Expert'}
                    </Button>
                  </a>
                  <CopyButton value={outcome.hash} label="Copy transaction ID" toastText="Transaction ID copied" />
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-bad/25 bg-bad/[0.06] p-5 relative">
                <button onClick={() => setOutcome(null)} className="absolute right-3 top-3 p-1.5 rounded-lg text-muted hover:text-ink" aria-label="Dismiss">
                  <X size={16} />
                </button>
                <p className="flex items-center gap-2 font-semibold text-ink">
                  <XCircle size={18} className="text-bad" /> Payment not sent
                </p>
                <p className="text-sm text-muted mt-1.5 leading-relaxed pr-6">{outcome.reason}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AddressQRCodeScanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={(addr) => {
          setRecipient(addr);
          setTouched((t) => ({ ...t, recipient: true }));
          toast.success(`Address scanned: ${shortAddress(addr, 6, 6)}`);
        }}
        allowedTypes={isEvm ? 'evm' : 'stellar'}
      />
    </Card>
  );
}
