import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, CheckCircle2, Clock, Zap } from 'lucide-react';
import { call } from './api';
import { Badge, Button, Card, FamilyTile, OrionMark, Rise, SplitWords, cx, fmt, short } from './kit';
import Unlock from './screens/Unlock';
import Ori from './art/Ori';
import { Doodles } from './art/Scene';
import type { Approval as A, WalletView } from '../lib/messages';

const TITLES: Record<A['kind'], string> = {
  connect: 'Connect to this site?',
  signMessage: 'Sign this message?',
  signTypedData: 'Sign this data?',
  sendTransaction: 'Send this transaction?',
  signTransaction: 'Sign this transaction?',
  addChain: 'Add this network?',
};

export default function Approval() {
  const id = location.hash.slice(1);
  const [a, setA] = useState<A | null | undefined>(undefined);
  const [view, setView] = useState<WalletView | null>(null);
  const [speed, setSpeed] = useState<'fast' | 'normal'>('fast');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    call<A | null>({ type: 'ui:approval:get', id }).then(setA);
    call<WalletView>({ type: 'ui:state' }).then(setView);
  }, [id]);

  const resolve = async (approved: boolean) => {
    setBusy(true);
    await call({ type: 'ui:approval:resolve', id, approved, payload: { speed } } as any);
    window.close();
  };

  if (a === undefined || !view) return <div className="h-full grid place-items-center"><OrionMark className="w-10 h-10 animate-pulse" /></div>;
  if (a === null)
    return (
      <div className="h-full grid place-items-center text-center p-8">
        <div>
          <p className="font-serif text-[22px]">This request expired</p>
          <p className="text-[13px] text-muted mt-2">The site may have reloaded. Try again from the site.</p>
          <Button className="mt-5" onClick={() => window.close()}>Close</Button>
        </div>
      </div>
    );
  if (!view.unlocked) return <Unlock compact onDone={setView} />;

  const net = view.networks.find((n) => n.id === a.networkId);
  const host = (() => {
    try {
      return new URL(a.origin).host;
    } catch {
      return a.origin;
    }
  })();
  const d = a.details;
  const danger = (a.kind === 'sendTransaction' && d.simulation && !d.simulation.ok) || d.call?.warn || net?.kind === 'mainnet';

  return (
    <div className="relative h-full flex flex-col dots">
      <Doodles />
      <motion.div className="absolute right-3 top-[52px] z-10" initial={{ x: 60, rotate: 25 }} animate={{ x: 0, rotate: 0 }} transition={{ type: 'spring', stiffness: 140, damping: 12, delay: 0.2 }}>
        <Ori
          size={84}
          shadow={false}
          pose={a.kind === 'connect' ? 'wave' : 'stand'}
          mood={danger ? 'worried' : a.kind === 'connect' ? 'excited' : 'focused'}
          prop={a.kind === 'connect' ? null : a.kind === 'addChain' ? 'telescope' : 'magnifier'}
        />
      </motion.div>
      <div className="relative px-5 pt-5">
        <div className="flex items-center gap-2.5">
          {a.favicon ? <img src={a.favicon} className="w-9 h-9 rounded-[10px] border border-line bg-card" alt="" /> : <span className="w-9 h-9 rounded-[10px] bg-inset" />}
          <div className="min-w-0">
            <p className="text-[14px] font-medium truncate">{host}</p>
            <p className="text-[11px] text-subtle truncate">{a.origin.startsWith('https://') ? 'Secure connection' : /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|$)/.test(a.origin) ? 'Local development site' : 'Not using HTTPS'}</p>
          </div>
          <span className="ml-auto flex items-center gap-1.5">
            <FamilyTile family={a.family} size={22} />
            {net && <Badge tone={net.kind === 'mainnet' ? 'bad' : net.kind === 'local' ? 'info' : 'ok'} dot>{net.name}</Badge>}
          </span>
        </div>
        <h1 className="font-serif text-[30px] leading-[1.02] mt-6 pr-24">
          <SplitWords text={TITLES[a.kind]} />
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        <Rise delay={0.15}>
          {a.kind === 'connect' && (
            <Card className="p-4 space-y-2 text-[13px]">
              <p>{host} will be able to:</p>
              <ul className="space-y-1.5 text-muted">
                <li className="flex gap-2"><CheckCircle2 size={15} className="text-ok shrink-0 mt-0.5" />See your {a.family === 'evm' ? 'EVM' : a.family === 'solana' ? 'Solana' : 'Stellar'} address: <span className="font-mono text-ink">{short(view.accounts[a.family], 6, 6)}</span></li>
                <li className="flex gap-2"><CheckCircle2 size={15} className="text-ok shrink-0 mt-0.5" />Ask you to sign. Nothing is signed without approval.</li>
              </ul>
            </Card>
          )}

          {(a.kind === 'signMessage') && (
            <Card className="p-4">
              <p className="text-[11px] text-subtle mb-2">Message</p>
              <pre className="whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed max-h-60 overflow-y-auto">{d.message}</pre>
            </Card>
          )}

          {a.kind === 'signTypedData' && (
            <Card className="p-4 space-y-2 text-[12px]">
              <p><span className="text-subtle">Type </span><span className="font-medium">{d.primaryType}</span></p>
              {d.domain?.name && <p><span className="text-subtle">App </span>{d.domain.name}{d.domain.chainId ? ` · chain ${d.domain.chainId}` : ''}</p>}
              {d.domain?.verifyingContract && <p className="font-mono break-all"><span className="text-subtle font-sans">Contract </span>{d.domain.verifyingContract}</p>}
              <pre className="whitespace-pre-wrap break-words font-mono text-[11px] bg-inset rounded-[10px] p-2.5 max-h-48 overflow-y-auto">{JSON.stringify(d.message, null, 2)}</pre>
            </Card>
          )}

          {a.kind === 'addChain' && (
            <Card className="p-4 space-y-1.5 text-[13px]">
              <p className="font-medium">{d.name}</p>
              <p className="text-muted">Chain ID {d.chainId} · {d.symbol}</p>
              <p className="font-mono text-[11px] break-all text-muted">{d.rpcUrl}</p>
              <p className="text-[12px] text-subtle pt-1">Only add networks you trust. A malicious RPC can show you false balances.</p>
            </Card>
          )}

          {a.family === 'evm' && a.kind === 'sendTransaction' && (
            <Card className="p-4 space-y-3 text-[13px]">
              <div>
                <p className="text-[11px] text-subtle">Amount</p>
                <p className="font-serif text-[32px] leading-none mt-1 num">{fmt(d.value, 6)} <span className="text-[16px] text-muted">{d.symbol}</span></p>
              </div>
              <div className="grid grid-cols-[70px_1fr] gap-y-1.5 text-[12px]">
                <span className="text-subtle">To</span><span className="font-mono break-all">{d.to}</span>
                {d.call && (<><span className="text-subtle">Action</span><span>{d.call.fn}{d.call.args?.length ? <span className="block font-mono text-[11px] text-muted break-all">{d.call.args.join(', ')}</span> : null}</span></>)}
                {d.maxFee && (<><span className="text-subtle">Max fee</span><span className="num">{fmt(d.maxFee, 6)} {d.symbol}</span></>)}
              </div>
              {d.simulation?.ok ? <p className="flex items-center gap-1.5 text-[12px] text-ok"><CheckCircle2 size={14} />Simulation passed</p> : <p className="flex items-start gap-1.5 text-[12px] text-bad"><AlertTriangle size={14} className="shrink-0 mt-0.5" />Likely to fail: {d.simulation?.reason}</p>}
              {d.call?.warn && <p className="flex items-start gap-1.5 text-[12px] text-warn"><AlertTriangle size={14} className="shrink-0 mt-0.5" />{d.call.warn}</p>}
              <div className="flex p-1 rounded-[12px] bg-inset">
                {(['fast', 'normal'] as const).map((s) => (
                  <button key={s} onClick={() => setSpeed(s)} className={cx('relative flex-1 h-8 rounded-[9px] text-[12px] flex items-center justify-center gap-1.5', speed === s ? 'text-ink' : 'text-muted')}>
                    {speed === s && <motion.span layoutId="ap-speed" className="absolute inset-0 rounded-[9px] bg-card shadow-sm" />}
                    <span className="relative flex items-center gap-1.5">{s === 'fast' ? <Zap size={13} /> : <Clock size={13} />}{s === 'fast' ? 'Fast' : 'Normal'}</span>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {a.family === 'solana' && (a.kind === 'sendTransaction' || a.kind === 'signTransaction') && (
            <Card className="p-4 space-y-2 text-[12px]">
              {d.transfers?.length ? d.transfers.map((t: any, i: number) => (
                <p key={i}><span className="font-serif text-[22px] num">{fmt(t.sol, 6)}</span> SOL <span className="text-subtle">to</span> <span className="font-mono">{short(t.to, 6, 6)}</span></p>
              )) : <p className="text-muted">No direct SOL transfers.</p>}
              <p className="text-subtle">{d.instructions} instruction{d.instructions === 1 ? '' : 's'} · programs:</p>
              <ul className="font-mono text-[11px] text-muted space-y-0.5">{d.programs?.map((p: string) => <li key={p} className="break-all">{p}</li>)}</ul>
              {d.send ? <p className="text-[12px] text-muted">Orion will send it and rebroadcast until it lands.</p> : <p className="text-[12px] text-muted">The site will send it after you sign.</p>}
            </Card>
          )}

          {a.family === 'stellar' && a.kind === 'signTransaction' && (
            <Card className="p-4 space-y-2 text-[12px]">
              <p><span className="text-subtle">Network </span>{d.network}</p>
              <p className="font-mono break-all"><span className="text-subtle font-sans">Source </span>{d.source}</p>
              {d.memo && <p><span className="text-subtle">Memo </span>{d.memo}</p>}
              <p><span className="text-subtle">Fee </span>{Number(d.fee) / 1e7} XLM</p>
              <ul className="space-y-1.5 pt-1">
                {d.operations?.map((o: any, i: number) => (
                  <li key={i} className="rounded-[10px] bg-inset px-2.5 py-2">
                    <span className="font-medium">{o.contract ?? o.type}</span>
                    {o.amount && <span> · <span className="num">{fmt(o.amount, 7)}</span> {o.asset ?? 'XLM'}</span>}
                    {o.destination && <span className="block font-mono text-[11px] text-muted break-all">to {o.destination}</span>}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </Rise>

        {danger && net?.kind === 'mainnet' && (
          <p className="flex items-start gap-1.5 text-[12px] text-bad"><AlertTriangle size={14} className="shrink-0 mt-0.5" />This is a mainnet request. Real funds are at stake.</p>
        )}
      </div>

      <div className="p-4 grid grid-cols-2 gap-2 border-t border-line bg-paper">
        <Button size="lg" disabled={busy} onClick={() => resolve(false)}>
          Reject
        </Button>
        <Button size="lg" variant="primary" loading={busy} onClick={() => resolve(true)}>
          {a.kind === 'connect' ? 'Connect' : a.kind === 'addChain' ? 'Add network' : a.kind === 'sendTransaction' ? 'Send' : 'Sign'}
        </Button>
      </div>
    </div>
  );
}
