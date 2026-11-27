import React, { useCallback, useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, ExternalLink, RefreshCw, Trash2, UserPlus, Activity, Radio } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useWallet } from '../context/WalletContext';
import { useTransactionHistory, TX_ADDED_EVENT } from '../hooks/useTransactionHistory';
import { fetchOnChainPayments, streamPayments, OnChainPayment } from '../services/stellar';
import { Badge, Button, Card, CardHeader, EmptyState, Skeleton, cx, formatAmount, shortAddress, timeAgo } from './ui';

type Row = {
  key: string;
  hash: string;
  incoming: boolean;
  counterparty: string;
  amount: string;
  asset: string;
  timestamp: string;
  ok: boolean;
  kind?: string;
  memo?: string;
};

export default function TransactionHistoryList() {
  const { wallet, refreshAccount } = useWallet();
  const { history, clearHistory } = useTransactionHistory(wallet.publicKey);
  const isEvm = wallet.walletType === 'metamask';

  const [tab, setTab] = useState<'ledger' | 'receipts'>(isEvm ? 'receipts' : 'ledger');
  const [payments, setPayments] = useState<OnChainPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => setTab(isEvm ? 'receipts' : 'ledger'), [isEvm]);

  const load = useCallback(
    async (showSpinner = true) => {
      if (!wallet.publicKey || isEvm) return;
      if (showSpinner) setLoading(true);
      setError(null);
      try {
        setPayments(await fetchOnChainPayments(wallet.publicKey, 20));
      } catch {
        setError('Could not load activity from Horizon.');
      } finally {
        setLoading(false);
      }
    },
    [wallet.publicKey, isEvm]
  );

  useEffect(() => {
    setPayments([]);
    load();
  }, [load]);

  // Live updates: stream new payments for this account
  useEffect(() => {
    if (!wallet.publicKey || isEvm) return;
    const me = wallet.publicKey;
    const close = streamPayments(me, (p) => {
      setPayments((prev) => (prev.some((x) => x.id === p.id) ? prev : [p, ...prev].slice(0, 50)));
      if (p.isIncoming && p.sender !== me) {
        toast.success(`Received ${formatAmount(p.amount)} ${p.asset}`, { icon: '↙' });
        refreshAccount({ silent: true });
      }
    });
    setLive(true);
    return () => {
      close();
      setLive(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.publicKey, isEvm]);

  // Pick up our own sends immediately
  useEffect(() => {
    const onSent = () => setTimeout(() => load(false), 1500);
    window.addEventListener(TX_ADDED_EVENT, onSent);
    return () => window.removeEventListener(TX_ADDED_EVENT, onSent);
  }, [load]);

  const ledgerRows: Row[] = payments.map((p) => ({
    key: p.id,
    hash: p.hash,
    incoming: p.isIncoming,
    counterparty: p.isIncoming ? p.sender : p.recipient,
    amount: p.amount,
    asset: p.asset,
    timestamp: p.timestamp,
    ok: p.successful,
    kind: p.type === 'create_account' ? 'Account created' : p.type === 'account_merge' ? 'Account merged' : undefined,
  }));

  const receiptRows: Row[] = history.map((t) => ({
    key: t.hash + t.timestamp,
    hash: t.hash,
    incoming: !!wallet.publicKey && t.recipient.toLowerCase() === wallet.publicKey.toLowerCase(),
    counterparty: t.recipient,
    amount: t.amount,
    asset: isEvm ? 'ETH' : 'XLM',
    timestamp: t.timestamp,
    ok: t.status === 'success',
    memo: t.memo,
  }));

  const rows = tab === 'ledger' ? ledgerRows : receiptRows;
  const txUrl = (hash: string) => (isEvm ? `https://sepolia.etherscan.io/tx/${hash}` : `https://stellar.expert/explorer/testnet/tx/${hash}`);

  return (
    <Card>
      <CardHeader
        title="Activity"
        icon={<Activity size={17} />}
        description={
          tab === 'ledger'
            ? 'Every payment to or from this address, read straight from the Stellar testnet.'
            : `Payments you sent from Orion${isEvm ? ' on Sepolia' : ''}, with their memos.`
        }
        action={
          tab === 'ledger' ? (
            <div className="flex items-center gap-2">
              {live && (
                <span className="hidden sm:inline-flex">
                  <Badge tone="info">
                    <Radio size={12} /> Live
                  </Badge>
                </span>
              )}
              <Button size="sm" variant="ghost" onClick={() => load()} loading={loading} icon={<RefreshCw size={14} />} aria-label="Refresh activity" />
            </div>
          ) : history.length > 0 ? (
            <Button
              size="sm"
              variant="ghost"
              icon={<Trash2 size={14} />}
              onClick={() => {
                if (window.confirm('Delete all saved receipts? On-chain history is not affected.')) clearHistory();
              }}
            >
              Clear
            </Button>
          ) : undefined
        }
      />

      {!isEvm && (
        <div role="tablist" className="inline-flex p-1 rounded-xl bg-deeper border border-line mb-4">
          {(
            [
              ['ledger', 'On the ledger'],
              ['receipts', 'Your receipts'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cx('h-8 px-3.5 rounded-lg text-sm font-medium transition-colors', tab === id ? 'bg-deep text-starlight border border-line' : 'text-mist hover:text-starlight')}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {error && tab === 'ledger' ? (
        <EmptyState title={error} action={<Button size="sm" onClick={() => load()}>Try again</Button>} />
      ) : loading && rows.length === 0 ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={<Activity size={18} />} title="No activity yet">
          {tab === 'ledger' ? 'Payments to and from this address will show up here as they happen.' : 'Payments you send from Orion will be saved here.'}
        </EmptyState>
      ) : (
        <ul className="divide-y divide-line -mx-2">
          {rows.map((r) => (
            <li key={r.key} className="flex items-center gap-3 sm:gap-4 px-2 py-3">
              <span
                className={cx(
                  'w-10 h-10 rounded-xl grid place-items-center shrink-0 border',
                  !r.ok ? 'text-bad bg-bad/10 border-bad/20' : r.incoming ? 'text-rigel bg-rigel/10 border-rigel/20' : 'text-betel bg-betel/10 border-betel/20'
                )}
                aria-hidden="true"
              >
                {r.kind === 'Account created' ? <UserPlus size={17} /> : r.incoming ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] text-starlight font-medium truncate">
                  {r.kind ?? (r.incoming ? 'Received' : 'Sent')}
                  <span className="text-mist font-normal"> {r.incoming ? 'from' : 'to'} </span>
                  <span className="font-mono text-[13px]">{shortAddress(r.counterparty, 4, 4)}</span>
                </p>
                <p className="text-[13px] text-haze truncate">
                  {timeAgo(r.timestamp)}
                  {r.memo ? ` · “${r.memo}”` : ''}
                  {!r.ok && <span className="text-bad"> · Failed</span>}
                </p>
              </div>
              <span className={cx('num font-semibold text-[15px] text-right whitespace-nowrap', r.incoming ? 'text-rigel' : 'text-starlight')}>
                {r.amount === '—' ? '—' : `${r.incoming ? '+' : '−'}${formatAmount(r.amount)}`}
                <span className="text-mist font-normal text-[13px] ml-1">{r.asset}</span>
              </span>
              <a
                href={txUrl(r.hash)}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg text-haze hover:text-starlight hover:bg-white/5 shrink-0"
                aria-label="Open in explorer"
                title="Open in explorer"
              >
                <ExternalLink size={15} />
              </a>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
