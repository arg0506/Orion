import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, animate, motion, useReducedMotion } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowDownLeft, ArrowUpRight, Check, ChevronDown, Droplets, ExternalLink, RefreshCw, X, Zap, Clock } from 'lucide-react';
import { call } from '../api';
import { Badge, Button, Card, Copy_, ErrorText, FAMILY_TILE, FamilyTile, Field, cx, ease, fmt, inputCls, short } from '../kit';
import type { WalletView } from '../../lib/messages';
import { explorerAddressUrl, type Family, type Network } from '../../lib/networks';
import type { TrackedTx } from '../../lib/chains/types';
import Activity from './Activity';
import Ori from '../art/Ori';
import { Confetti } from '../art/Scene';
import { NetworkLogo, Coin } from '../art/ChainLogo';

function AnimatedNumber({ value }: { value: number }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(value);
  const [prev, setPrev] = useState(0);
  useEffect(() => {
    if (reduced) return setShown(value);
    const c = animate(prev, value, { duration: 1.1, ease, onUpdate: setShown });
    setPrev(value);
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <>{fmt(shown)}</>;
}

export default function Home({ view, setView, family, setFamily }: { view: WalletView; setView: (v: WalletView) => void; family: Family; setFamily: (f: Family) => void }) {
  const net = view.networks.find((n) => n.id === view.active[family])!;
  const address = view.accounts[family] ?? '';
  const [balance, setBalance] = useState<{ amount: string; exists: boolean } | null>(null);
  const [balErr, setBalErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [sheet, setSheet] = useState<null | 'send' | 'receive' | 'networks'>(null);
  const [faucetMsg, setFaucetMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [faucetBusy, setFaucetBusy] = useState(false);
  const [txs, setTxs] = useState<TrackedTx[]>([]);
  const [party, setParty] = useState<null | string>(null);
  const celebrate = (text: string) => {
    setParty(text);
    setTimeout(() => setParty(null), 1900);
  };

  const loadBalance = useCallback(async () => {
    setLoading(true);
    setBalErr('');
    try {
      setBalance(await call({ type: 'ui:balance', family }));
    } catch (e: any) {
      setBalance(null);
      console.warn('balance failed', e);
      setBalErr(net.kind === 'local' ? `Can't reach ${net.rpcUrl.replace(/^https?:\/\//, '')}. Is your local node running?` : `Can't reach ${net.name} right now. Check your connection or switch networks.`);
    } finally {
      setLoading(false);
    }
  }, [family, net.id]);

  const loadTxs = useCallback(async () => setTxs(await call<TrackedTx[]>({ type: 'ui:txs' })), []);

  useEffect(() => {
    setBalance(null);
    setFaucetMsg(null);
    loadBalance();
  }, [loadBalance]);
  useEffect(() => {
    loadTxs();
    const id = setInterval(() => {
      loadTxs();
    }, 2000);
    return () => clearInterval(id);
  }, [loadTxs]);
  // Refresh the balance when one of this chain's transactions settles.
  const settledKey = txs.filter((t) => t.family === family && t.status !== 'pending').length;
  useEffect(() => {
    if (settledKey) loadBalance();
  }, [settledKey]);

  const faucet = async () => {
    if (net.faucet?.kind === 'link') return window.open(net.faucet.url, '_blank');
    setFaucetBusy(true);
    setFaucetMsg(null);
    try {
      const text = await call<string>({ type: 'ui:faucet', family });
      setFaucetMsg({ ok: true, text });
      celebrate(text);
      loadBalance();
    } catch (e: any) {
      setFaucetMsg({ ok: false, text: e.message });
    } finally {
      setFaucetBusy(false);
    }
  };

  const familyTxs = txs.filter((t) => t.family === family);
  const pendingHere = familyTxs.some((t) => t.status === 'pending');
  // Ori reacts to what's going on with this chain.
  const ori = balErr
    ? { pose: 'stand' as const, mood: 'dizzy' as const, prop: 'plug' as const, say: 'Node unreachable!' }
    : faucetBusy
      ? { pose: 'stand' as const, mood: 'focused' as const, prop: 'can' as const, say: 'Watering…' }
      : pendingHere
        ? { pose: 'run' as const, mood: 'focused' as const, prop: null, say: 'On it!' }
        : net.kind === 'mainnet'
          ? { pose: 'stand' as const, mood: 'worried' as const, prop: null, say: 'Real money!' }
          : { pose: 'sit' as const, mood: 'happy' as const, prop: null, say: '' };

  return (
    <div className="relative h-full flex flex-col">
      {/* Chain switcher */}
      <div className="px-4 pt-3">
        <div className="flex p-1 rounded-[14px] bg-[#e9e8e4]/90 border border-black/[0.04]">
          {(['evm', 'solana', 'stellar'] as Family[]).map((f) => (
            <button key={f} onClick={() => setFamily(f)} className={cx('relative flex-1 h-10 rounded-[10px] flex items-center justify-center gap-2 text-[13px] transition-colors', family === f ? 'text-ink' : 'text-muted hover:text-ink')}>
              {family === f && <motion.span layoutId="family-pill" className="absolute inset-0 rounded-[10px] bg-card shadow-[0_2px_8px_-2px_rgba(0,0,0,0.15)]" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
              <span className="relative flex items-center gap-2">
                <FamilyTile family={f} size={22} />
                {FAMILY_TILE[f].label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* Balance */}
        <AnimatePresence mode="wait">
          <motion.div key={family} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease }}>
            <Card className="relative mt-[76px] p-5">
              {/* Ori perches on the card and reacts to the wallet's state */}
              <motion.div key={ori.pose + ori.mood + ori.prop} className="absolute -top-[72px] right-2 z-10" initial={{ y: 12, opacity: 0, rotate: 12 }} animate={{ y: 0, opacity: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 12 }}>
                <Ori size={70} pose={ori.pose} mood={ori.mood} prop={ori.prop} shadow={false} />
                {ori.say && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-[64px] top-2 whitespace-nowrap rounded-[10px] border-2 border-ink bg-white px-2 py-0.5 text-[11px] font-medium shadow-[2px_2px_0_#141414]">
                    {ori.say}
                  </motion.span>
                )}
              </motion.div>
              <div className="flex items-center justify-between">
                <button onClick={() => setSheet('networks')} className="inline-flex items-center gap-1.5 h-7 pl-1 pr-1.5 rounded-[9px] bg-inset text-[12px] font-medium hover:bg-line">
                  <NetworkLogo networkId={net.id} family={family} size={18} />
                  {net.name}
                  <ChevronDown size={13} className="text-subtle" />
                </button>
                <div className="flex items-center -mr-1.5">
                  <Copy_ value={address} label={short(address, 5, 4)} />
                  {net.explorer && (
                    <a href={explorerAddressUrl(net, address)} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg text-subtle hover:text-ink" aria-label="Open in explorer">
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-end gap-2 min-h-[52px]">
                {balance ? (
                  <p className="min-w-0 font-serif text-[40px] leading-[0.95] tracking-[-0.03em] num truncate">
                    <AnimatedNumber value={Number(balance.amount)} />
                    <span className="text-[20px] text-muted ml-2 tracking-normal">{net.symbol}</span>
                  </p>
                ) : balErr ? (
                  <p className="min-w-0 flex-1 text-[13px] text-bad leading-snug">{balErr}</p>
                ) : (
                  <span className="h-12 w-40 rounded-lg bg-black/[0.05] animate-pulse" />
                )}
                <button onClick={loadBalance} className="ml-auto mb-1 p-1.5 rounded-lg text-subtle hover:text-ink shrink-0" aria-label="Refresh balance">
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
              {balance && !balance.exists && <p className="text-[12px] text-warn mt-2">This account isn't on the ledger yet. Fund it with at least 1 XLM.</p>}
              {net.kind === 'mainnet' && <p className="text-[12px] text-bad mt-2">Mainnet: real funds.</p>}

              <div className="mt-5 grid grid-cols-3 gap-2">
                <Button variant="primary" icon={<ArrowUpRight size={16} />} onClick={() => setSheet('send')}>
                  Send
                </Button>
                <Button icon={<ArrowDownLeft size={16} />} onClick={() => setSheet('receive')}>
                  Receive
                </Button>
                <Button icon={<Droplets size={15} />} disabled={!net.faucet} loading={faucetBusy} onClick={faucet} title={net.faucet?.label ?? 'No faucet on this network'}>
                  Faucet
                </Button>
              </div>
              <AnimatePresence>
                {faucetMsg && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={cx('text-[12px] mt-3', faucetMsg.ok ? 'text-ok' : 'text-bad')}>
                    {faucetMsg.text}
                  </motion.p>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        </AnimatePresence>

        <Activity txs={familyTxs} networks={view.networks} onChange={loadTxs} />
      </div>

      <Sheet open={sheet === 'send'} onClose={() => setSheet(null)} title={`Send ${net.symbol}`}>
        <SendForm family={family} net={net} balance={balance} onSent={() => { setSheet(null); loadTxs(); celebrate('Sent!'); }} />
      </Sheet>
      {/* Celebration: confetti + Ori cheering */}
      <Confetti show={!!party} />
      <AnimatePresence>
        {party && (
          <motion.div className="pointer-events-none absolute inset-0 z-40 grid place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0.3, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 10 }} className="flex flex-col items-center">
              <span className="font-serif text-[30px] rounded-[16px] border-[3px] border-ink bg-[#ffd84d] px-4 py-1 shadow-[4px_4px_0_#141414] -rotate-3">{party}</span>
              <Ori size={130} pose="cheer" mood="excited" sparkles />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet open={sheet === 'receive'} onClose={() => setSheet(null)} title="Receive">
        <div className="flex flex-col items-center text-center">
          <motion.div initial={{ rotate: -6, scale: 0.9, opacity: 0 }} animate={{ rotate: 0, scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 140, damping: 14 }} className="p-4 rounded-[20px] bg-card border border-line">
            <QRCodeSVG value={address} size={168} bgColor="#ffffff" fgColor="#141414" />
          </motion.div>
          <p className="font-mono text-[12px] break-all mt-4 px-2 leading-relaxed">{address}</p>
          <div className="mt-2">
            <Copy_ value={address} label="Copy address" />
          </div>
          <p className="text-[12px] text-subtle mt-3">Only send {net.symbol} on {net.name} to this address.</p>
        </div>
      </Sheet>
      <Sheet open={sheet === 'networks'} onClose={() => setSheet(null)} title="Network">
        <NetworkList view={view} family={family} onPick={async (id) => { setView(await call({ type: 'ui:setNetwork', family, networkId: id })); setSheet(null); }} />
      </Sheet>
    </div>
  );
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="absolute inset-0 z-30 flex flex-col justify-end bg-ink/25" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            className="rounded-t-[24px] bg-paper border-t border-line max-h-[92%] overflow-y-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.35, ease }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <h2 className="font-serif text-[24px]">{title}</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-black/[0.04]" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function NetworkList({ view, family, onPick }: { view: WalletView; family: Family; onPick: (id: string) => void }) {
  const nets = view.networks.filter((n) => n.family === family && (view.showMainnets || n.kind !== 'mainnet'));
  const groups: [string, Network[]][] = [
    ['Testnets', nets.filter((n) => n.kind === 'testnet')],
    ['Local', nets.filter((n) => n.kind === 'local')],
    ['Mainnets', nets.filter((n) => n.kind === 'mainnet')],
  ];
  return (
    <div className="space-y-4">
      {groups.filter(([, l]) => l.length).map(([label, list]) => (
        <div key={label}>
          <p className="text-[11px] font-medium text-subtle mb-1.5 uppercase tracking-wide">{label}</p>
          <div className="rounded-[16px] bg-card border border-line divide-y divide-line overflow-hidden">
            {list.map((n) => (
              <button key={n.id} onClick={() => onPick(n.id)} className="w-full flex items-center gap-3 px-3.5 py-3 text-left hover:bg-black/[0.02]">
                <span className="relative">
                  <Coin family={n.family} networkId={n.id} size={30} />
                  <span className={cx('absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white', n.kind === 'mainnet' ? 'bg-bad' : n.kind === 'local' ? 'bg-rigel' : 'bg-ok')} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[14px]">{n.name}</span>
                  <span className="block text-[11px] text-subtle font-mono truncate">{n.chainId ? `chain ${n.chainId} · ` : ''}{n.rpcUrl.replace(/^https?:\/\//, '')}</span>
                </span>
                {view.active[family] === n.id && <Check size={16} />}
              </button>
            ))}
          </div>
        </div>
      ))}
      {!view.showMainnets && <p className="text-[12px] text-subtle">Mainnets are hidden. Turn them on in Settings.</p>}
    </div>
  );
}

function SendForm({ family, net, balance, onSent }: { family: Family; net: Network; balance: { amount: string } | null; onSent: () => void }) {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [speed, setSpeed] = useState<'fast' | 'normal'>('fast');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const memoBytes = new TextEncoder().encode(memo).length;
  const amt = Number(amount);
  const tooMuch = balance && amt > Number(balance.amount);
  const speedHelp: Record<Family, string> = {
    evm: 'Fast tips 2x the suggested priority fee. You can still speed up or cancel while it is pending.',
    solana: 'Fast pays a higher priority fee and Orion rebroadcasts until it lands or the blockhash expires (~60s).',
    stellar: 'Fast uses the 90th-percentile fee and a 30-second window. You can speed up or cancel while pending.',
  };
  return (
    <form
      className="space-y-3.5"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
          await call({ type: 'ui:send', family, to, amount, memo: memo || undefined, speed });
          onSent();
        } catch (err: any) {
          setError(err.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <Field label="To">
        <input className={cx(inputCls(), 'font-mono text-[13px]')} spellCheck={false} autoComplete="off" placeholder={family === 'evm' ? '0x…' : family === 'stellar' ? 'G…' : 'Solana address'} value={to} onChange={(e) => setTo(e.target.value)} autoFocus />
      </Field>
      <Field label="Amount" error={tooMuch ? 'More than your balance' : undefined} trailing={balance && <button type="button" className="text-rigel" onClick={() => setAmount(balance.amount)}>Balance {fmt(balance.amount)}</button>}>
        <div className="relative">
          <input className={cx(inputCls(!!tooMuch), 'font-serif !text-[22px] !h-14 pr-14 num')} inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value.replace(',', '.'))} />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] text-muted">{net.symbol}</span>
        </div>
      </Field>
      {family === 'stellar' && (
        <Field label="Memo (optional)" error={memoBytes > 28 ? `${memoBytes}/28 bytes` : undefined} trailing={<span className="text-subtle num">{memoBytes}/28</span>}>
          <input className={inputCls(memoBytes > 28)} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="e.g. invoice 1042" />
        </Field>
      )}
      <div>
        <div className="flex p-1 rounded-[12px] bg-inset">
          {(['fast', 'normal'] as const).map((s) => (
            <button type="button" key={s} onClick={() => setSpeed(s)} className={cx('relative flex-1 h-9 rounded-[9px] text-[13px] flex items-center justify-center gap-1.5', speed === s ? 'text-ink' : 'text-muted')}>
              {speed === s && <motion.span layoutId="speed-pill" className="absolute inset-0 rounded-[9px] bg-card shadow-sm" />}
              <span className="relative flex items-center gap-1.5">{s === 'fast' ? <Zap size={14} /> : <Clock size={14} />}{s === 'fast' ? 'Fast' : 'Normal'}</span>
            </button>
          ))}
        </div>
        <p className="text-[12px] text-subtle mt-1.5 leading-snug">{speedHelp[family]}</p>
      </div>
      <ErrorText>{error}</ErrorText>
      <Button type="submit" variant="primary" size="lg" className="w-full" loading={busy} disabled={!to || !amount || !!tooMuch || memoBytes > 28}>
        {amount && !isNaN(amt) && amt > 0 ? `Send ${fmt(amount)} ${net.symbol}` : 'Send'}
      </Button>
    </form>
  );
}
