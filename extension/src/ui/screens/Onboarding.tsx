import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Eye, EyeOff, KeyRound, Plus } from 'lucide-react';
import { generateMnemonic, validateMnemonic } from '../../lib/keyring/derive';
import { call } from '../api';
import { Button, ErrorText, Field, OrionMark, Rise, SplitWords, inputCls, ease } from '../kit';
import Ori, { type Pose, type Mood, type Prop } from '../art/Ori';
import { Doodles, OriScene } from '../art/Scene';
import type { WalletView } from '../../lib/messages';

type Step = 'welcome' | 'show' | 'verify' | 'password' | 'import';

export default function Onboarding({ onDone }: { onDone: (v: WalletView) => void }) {
  const [step, setStep] = useState<Step>('welcome');
  const [mnemonic, setMnemonic] = useState('');
  const [mode, setMode] = useState<'create' | 'import'>('create');

  const go = (s: Step) => setStep(s);
  return (
    <div className="relative h-full flex flex-col dots">
      <Doodles />
      <AnimatePresence mode="wait">
        <motion.div key={step} className="flex-1 flex flex-col" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3, ease }}>
          {step === 'welcome' && (
            <Welcome
              onCreate={() => {
                setMode('create');
                setMnemonic(generateMnemonic());
                go('show');
              }}
              onImport={() => {
                setMode('import');
                go('import');
              }}
            />
          )}
          {step === 'show' && <ShowPhrase mnemonic={mnemonic} onBack={() => go('welcome')} onNext={() => go('verify')} />}
          {step === 'verify' && <Verify mnemonic={mnemonic} onBack={() => go('show')} onNext={() => go('password')} />}
          {step === 'import' && (
            <Import
              onBack={() => go('welcome')}
              onNext={(m) => {
                setMnemonic(m);
                go('password');
              }}
            />
          )}
          {step === 'password' && <Password mnemonic={mnemonic} mode={mode} onBack={() => go(mode === 'create' ? 'verify' : 'import')} onDone={onDone} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Header({ onBack, title, sub, ori }: { onBack?: () => void; title: string; sub?: string; ori?: { pose?: Pose; mood?: Mood; prop?: Prop } }) {
  return (
    <div className="relative px-5 pt-5">
      {ori && (
        <motion.div className="absolute right-3 top-2" initial={{ y: -20, opacity: 0, rotate: 20 }} animate={{ y: 0, opacity: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 160, damping: 11, delay: 0.25 }}>
          <Ori size={78} shadow={false} {...ori} />
        </motion.div>
      )}
      {onBack && (
        <button onClick={onBack} className="mb-3 -ml-1.5 p-1.5 rounded-lg text-muted hover:text-ink hover:bg-black/[0.04]" aria-label="Back">
          <ArrowLeft size={18} />
        </button>
      )}
      <h1 className={`font-serif text-[30px] leading-[1.02] tracking-[-0.01em] ${ori ? "pr-20" : ""}`}>
        <SplitWords text={title} />
      </h1>
      {sub && <p className="text-[13px] text-muted mt-2 leading-relaxed">{sub}</p>}
    </div>
  );
}

function Welcome({ onCreate, onImport }: { onCreate: () => void; onImport: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center text-center px-6 pt-9">
      <motion.div initial={{ scale: 0.4, opacity: 0, rotate: -20 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 11 }}>
        <OriScene size={224} pose="wave" mood="excited" orbit seed={11} splat="#ffcfdb" />
      </motion.div>
      <h1 className="font-serif text-[44px] leading-[0.95] mt-1 tracking-[-0.02em] flex items-center gap-2">
        <OrionMark className="w-9 h-9" animate />
        <SplitWords text="Meet Orion," delay={0.3} />
      </h1>
      <Rise delay={0.6}>
        <p className="text-[14px] text-muted mt-2 leading-relaxed">one wallet for Ethereum, Solana, Stellar<br />and every chain you build on.</p>
      </Rise>
      <Rise delay={0.9} className="w-full mt-auto pb-6 space-y-2.5">
        <Button variant="primary" size="lg" className="w-full" icon={<Plus size={17} />} onClick={onCreate}>
          Create a new wallet
        </Button>
        <Button size="lg" className="w-full" icon={<KeyRound size={16} />} onClick={onImport}>
          I already have a recovery phrase
        </Button>
      </Rise>
    </div>
  );
}

function ShowPhrase({ mnemonic, onBack, onNext }: { mnemonic: string; onBack: () => void; onNext: () => void }) {
  const [shown, setShown] = useState(false);
  const words = mnemonic.split(' ');
  return (
    <div className="flex-1 flex flex-col">
      <Header onBack={onBack} ori={{ pose: 'shh', mood: 'happy' }} title="Your recovery phrase" sub="These 12 words are the only way back into your wallet on every chain. Write them down and keep them offline. Anyone with them can take your funds." />
      <div className="px-5 mt-5 relative">
        <div className={`grid grid-cols-3 gap-1.5 transition ${shown ? '' : 'blur-[6px] select-none'}`}>
          {words.map((w, i) => (
            <motion.span key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.03 }} className="h-9 rounded-[10px] bg-card border border-line flex items-center gap-1.5 px-2.5 text-[13px]">
              <span className="text-subtle text-[11px] w-4 num">{i + 1}</span>
              <span className="font-mono">{w}</span>
            </motion.span>
          ))}
        </div>
        {!shown && (
          <button onClick={() => setShown(true)} className="absolute inset-0 grid place-items-center">
            <span className="inline-flex items-center gap-2 h-10 px-4 rounded-[12px] bg-ink text-paper text-[13px] font-medium">
              <Eye size={15} /> Reveal phrase
            </span>
          </button>
        )}
      </div>
      <div className="mt-auto p-5">
        <Button variant="primary" size="lg" className="w-full" disabled={!shown} onClick={onNext}>
          I've written it down
        </Button>
      </div>
    </div>
  );
}

function Verify({ mnemonic, onBack, onNext }: { mnemonic: string; onBack: () => void; onNext: () => void }) {
  const words = mnemonic.split(' ');
  const picks = useMemo(() => {
    const idx = new Set<number>();
    while (idx.size < 3) idx.add(Math.floor(Math.random() * words.length));
    return [...idx].sort((a, b) => a - b);
  }, [mnemonic]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const ok = picks.every((i) => answers[i]?.trim().toLowerCase() === words[i]);
  return (
    <div className="flex-1 flex flex-col">
      <Header onBack={onBack} ori={{ mood: 'focused', prop: 'magnifier' }} title="Check your phrase" sub="Type these words from your phrase to make sure you saved it." />
      <div className="px-5 mt-5 space-y-3">
        {picks.map((i) => (
          <Field key={i} label={`Word #${i + 1}`}>
            <input className={inputCls()} autoComplete="off" spellCheck={false} value={answers[i] ?? ''} onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })} />
          </Field>
        ))}
      </div>
      <div className="mt-auto p-5">
        <Button variant="primary" size="lg" className="w-full" disabled={!ok} onClick={onNext}>
          Continue
        </Button>
      </div>
    </div>
  );
}

function Import({ onBack, onNext }: { onBack: () => void; onNext: (m: string) => void }) {
  const [text, setText] = useState('');
  const valid = validateMnemonic(text);
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return (
    <div className="flex-1 flex flex-col">
      <Header onBack={onBack} ori={{ mood: 'excited', prop: 'telescope' }} title="Import a wallet" sub="Paste your 12 or 24-word recovery phrase. Orion derives the same addresses as MetaMask, Phantom and Freighter." />
      <div className="px-5 mt-5">
        <textarea
          className="w-full h-32 rounded-[14px] bg-card border border-line focus:border-ink focus:outline-none p-3.5 font-mono text-[13px] leading-relaxed resize-none"
          placeholder="word word word …"
          spellCheck={false}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <p className={`text-[12px] mt-1.5 ${text && !valid ? 'text-bad' : 'text-subtle'}`}>{!text ? 'Words are separated by spaces.' : valid ? 'Looks good.' : `${words} words, not a valid phrase yet.`}</p>
      </div>
      <div className="mt-auto p-5">
        <Button variant="primary" size="lg" className="w-full" disabled={!valid} onClick={() => onNext(text)}>
          Continue
        </Button>
      </div>
    </div>
  );
}

function Password({ mnemonic, mode, onBack, onDone }: { mnemonic: string; mode: 'create' | 'import'; onBack: () => void; onDone: (v: WalletView) => void }) {
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const short = pw.length > 0 && pw.length < 8;
  const mismatch = pw2.length > 0 && pw !== pw2;
  return (
    <form
      className="flex-1 flex flex-col"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
          onDone(await call<WalletView>({ type: 'ui:create', mnemonic, password: pw }));
        } catch (err: any) {
          setError(err.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <Header onBack={onBack} ori={{ mood: 'excited', prop: 'key' }} title="Set a password" sub="It unlocks Orion on this device. It can't recover your wallet; only your phrase can." />
      <div className="px-5 mt-5 space-y-3">
        <Field label="Password" error={short ? 'At least 8 characters' : undefined}
          trailing={<button type="button" onClick={() => setShow(!show)} className="text-subtle hover:text-ink">{show ? <EyeOff size={14} /> : <Eye size={14} />}</button>}>
          <input type={show ? 'text' : 'password'} className={inputCls(short)} value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
        </Field>
        <Field label="Confirm password" error={mismatch ? "Passwords don't match" : undefined}>
          <input type={show ? 'text' : 'password'} className={inputCls(mismatch)} value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </Field>
        <ErrorText>{error}</ErrorText>
      </div>
      <div className="mt-auto p-5">
        <Button type="submit" variant="primary" size="lg" className="w-full" loading={busy} disabled={pw.length < 8 || pw !== pw2}>
          {mode === 'create' ? 'Create wallet' : 'Import wallet'}
        </Button>
      </div>
    </form>
  );
}
