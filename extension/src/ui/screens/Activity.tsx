import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDownLeft, ArrowUpRight, Ban, ExternalLink, Gauge, Globe, Loader2, Zap } from 'lucide-react';
import { call } from '../api';
import { Badge, Button, ErrorText, ago, cx, fmt, short } from '../kit';
import { explorerTxUrl, type Network } from '../../lib/networks';
import type { TrackedTx } from '../../lib/chains/types';
import { Comet, Constellation, Stipple } from '../art/Engraving';
import { NetworkLogo } from '../art/ChainLogo';

const STATUS: Record<TrackedTx['status'], { label: string; tone: 'neutral' | 'ok' | 'warn' | 'bad' | 'info' }> = {
  pending: { label: 'Pending', tone: 'info' },
  confirmed: { label: 'Confirmed', tone: 'ok' },
  failed: { label: 'Failed', tone: 'bad' },
  expired: { label: 'Expired', tone: 'warn' },
  replaced: { label: 'Replaced', tone: 'neutral' },
};

function useNow(active: boolean) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

export default function Activity({ txs, networks, onChange }: { txs: TrackedTx[]; networks: Network[]; onChange: () => void }) {
  const anyPending = txs.some((t) => t.status === 'pending');
  const now = useNow(anyPending);
  return (
    <section className="mt-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-serif text-[20px]">Activity</h2>
        {txs.length > 0 && (
          <span className="flex items-center gap-1 text-[12px] text-subtle">
            {anyPending && <Comet width={44} height={18} />}
            {txs.filter((t) => t.status === 'pending').length} pending
          </span>
        )}
      </div>
      {txs.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-line-strong pt-3 pb-6 text-center">
          <div className="mx-auto w-fit"><Constellation size={120} /></div>
          <p className="font-serif text-[18px]">Nothing yet</p>
          <p className="text-[12px] text-muted mt-1">Transactions you send from Orion or approve for a site show up here.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {txs.slice(0, 30).map((t, i) => (
              <motion.li key={t.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, delay: Math.min(i, 6) * 0.03 }}>
                <TxRow tx={t} net={networks.find((n) => n.id === t.networkId)} now={now} onChange={onChange} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}

function TxRow({ tx, net, now, onChange }: { tx: TrackedTx; net?: Network; now: number; onChange: () => void }) {
  const [busy, setBusy] = useState<'' | 'speed' | 'cancel'>('');
  const [error, setError] = useState('');
  const pending = tx.status === 'pending';
  const canReplace = pending && (tx.family === 'evm' || tx.family === 'stellar') && !tx.replacedBy && tx.kind !== 'cancel';
  const secondsLeft = tx.expiresAt ? Math.max(0, Math.round((tx.expiresAt - now) / 1000)) : null;

  const act = async (kind: 'speed' | 'cancel') => {
    setBusy(kind);
    setError('');
    try {
      await call({ type: kind === 'speed' ? 'ui:speedUp' : 'ui:cancel', id: tx.id });
      onChange();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  };

  const title =
    tx.kind === 'cancel' ? 'Cancellation' : tx.kind === 'speedup' ? `Sped up · ${fmt(tx.amount)} ${tx.symbol}` : tx.kind === 'dapp' && !tx.amount ? 'Site transaction' : `Sent ${fmt(tx.amount || '0')} ${tx.symbol}`;

  return (
    <div className={cx('rounded-[16px] border bg-card p-3', pending ? 'border-rigel/30' : 'border-line')}>
      <div className="flex items-center gap-3">
        <span className="relative shrink-0">
        <span
          className={cx('tile w-9 h-9 shrink-0', tx.kind === 'cancel' ? 'text-muted' : 'text-betel')}
          style={{ background: tx.kind === 'cancel' ? 'linear-gradient(160deg,#fff,#eceae4)' : tx.kind === 'dapp' ? 'linear-gradient(160deg,#fff,#eef2ff)' : 'linear-gradient(160deg,#fff,#f2f0ea)' }}
        >
          {tx.kind === 'cancel' ? <Ban size={16} /> : tx.kind === 'dapp' ? <Globe size={16} className="text-rigel" /> : tx.kind === 'speedup' ? <Zap size={16} /> : <ArrowUpRight size={16} />}
        </span>
          <span className="absolute -bottom-1 -right-1 grid place-items-center w-[18px] h-[18px] rounded-full bg-white border-[1.5px] border-ink">
            <NetworkLogo networkId={tx.networkId} family={tx.family} size={12} />
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium truncate">{title}</p>
          <p className="text-[11px] text-subtle truncate">
            {tx.to && tx.kind !== 'cancel' ? `to ${short(tx.to, 4, 4)} · ` : ''}
            {tx.origin ? `${new URL(tx.origin).host} · ` : ''}
            {net?.name ?? tx.networkId} · {ago(tx.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Badge tone={STATUS[tx.status].tone} dot={pending}>
            {pending && <Loader2 size={10} className="animate-spin -ml-0.5" />}
            {STATUS[tx.status].label}
          </Badge>
          {net?.explorer && tx.hash && (
            <a href={explorerTxUrl(net, tx.hash)} target="_blank" rel="noreferrer" className="p-1 text-subtle hover:text-ink" aria-label="Open in explorer">
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>

      {pending && (
        <div className="mt-2.5 pt-2.5 border-t border-line">
          {secondsLeft !== null && (
            <div className="mb-2">
              <div className="flex justify-between text-[11px] text-muted">
                <span>{tx.family === 'solana' ? 'Rebroadcasting until it lands' : 'Valid for'}</span>
                <span className="num">{secondsLeft}s left</span>
              </div>
              <div className="h-1 rounded-full bg-inset mt-1 overflow-hidden">
                <motion.div className="h-full bg-rigel" animate={{ width: `${Math.min(100, (secondsLeft / Math.max(1, Math.round(((tx.expiresAt ?? 0) - tx.createdAt) / 1000))) * 100)}%` }} transition={{ duration: 0.9, ease: 'linear' }} />
              </div>
            </div>
          )}
          {canReplace ? (
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" icon={<Gauge size={14} />} loading={busy === 'speed'} disabled={!!busy} onClick={() => act('speed')}>
                Speed up
              </Button>
              <Button size="sm" variant="danger" icon={<Ban size={14} />} loading={busy === 'cancel'} disabled={!!busy} onClick={() => act('cancel')}>
                Cancel
              </Button>
            </div>
          ) : tx.family === 'solana' ? (
            <p className="text-[11px] text-subtle leading-snug">Solana can't cancel a sent transaction, but it can't land after its blockhash expires. If it does, no funds move.</p>
          ) : tx.kind === 'cancel' ? (
            <div className="flex items-center gap-2">
              <Stipple kind="eclipse" size={40} seed={9} />
              <p className="text-[11px] text-subtle leading-snug">Racing the original. Whichever lands first wins; the other can never go through.</p>
            </div>
          ) : null}
          <div className="mt-2">
            <ErrorText>{error}</ErrorText>
          </div>
        </div>
      )}
      {tx.error && !pending && <p className="text-[11px] text-subtle mt-2">{tx.error}</p>}
    </div>
  );
}
