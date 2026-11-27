import React, { useState } from 'react';
import { motion } from 'motion/react';
import { call } from '../api';
import { Button, ErrorText, Rise, SplitWords, inputCls } from '../kit';
import Ori from '../art/Ori';
import { Doodles, OriScene } from '../art/Scene';
import type { WalletView } from '../../lib/messages';

export default function Unlock({ onDone, compact = false }: { onDone: (v: WalletView) => void; compact?: boolean }) {
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(0);
  return (
    <form
      className={`relative isolate flex flex-col items-center text-center px-6 ${compact ? 'py-6' : 'h-full pt-8 dots'}`}
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
          onDone(await call<WalletView>({ type: 'ui:unlock', password: pw }));
        } catch (err: any) {
          setError(err.message === 'Wrong password' ? 'That password is not right.' : err.message);
          setShake((s) => s + 1);
        } finally {
          setBusy(false);
        }
      }}
    >
      {!compact && <Doodles />}
      {compact ? (
        <Ori size={96} prop="key" mood={error ? 'worried' : 'happy'} />
      ) : (
        <OriScene size={190} prop="key" mood={error ? 'worried' : 'excited'} splat="#dbe7ff" seed={4} />
      )}
      <h1 className={`font-serif ${compact ? 'text-[26px] mt-2' : 'text-[36px] mt-2'} leading-none`}>
        <SplitWords text="Welcome back" delay={0.2} />
      </h1>
      <Rise delay={0.4} className="w-full">
        <p className="text-[13px] text-muted mt-2">Unlock to continue.</p>
        <motion.div key={shake} animate={shake ? { x: [0, -8, 8, -5, 5, 0] } : undefined} transition={{ duration: 0.35 }} className="mt-6 text-left space-y-2">
          <input type="password" autoFocus placeholder="Password" className={inputCls(!!error)} value={pw} onChange={(e) => setPw(e.target.value)} />
          <ErrorText>{error}</ErrorText>
        </motion.div>
        <Button type="submit" variant="primary" size="lg" className="w-full mt-4" loading={busy} disabled={!pw}>
          Unlock
        </Button>
      </Rise>
    </form>
  );
}
