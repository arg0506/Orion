import React, { useState } from 'react';
import { Eye, Lock, Trash2 } from 'lucide-react';
import { call } from '../api';
import { Button, Card, ErrorText, inputCls } from '../kit';
import { Constellation } from '../art/Engraving';
import type { WalletView } from '../../lib/messages';

export default function Settings({ view, setView }: { view: WalletView; setView: (v: WalletView) => void }) {
  const [pw, setPw] = useState('');
  const [phrase, setPhrase] = useState('');
  const [error, setError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <div className="px-4 pt-4 pb-6 space-y-4">
      <h1 className="font-serif text-[28px] leading-none">Settings</h1>

      <Card className="divide-y divide-line">
        <label className="flex items-center justify-between gap-4 p-4">
          <span>
            <span className="block text-[14px]">Show mainnets</span>
            <span className="block text-[12px] text-subtle">Off by default so you never sign real-money transactions by accident.</span>
          </span>
          <input type="checkbox" className="w-5 h-5 accent-[#141414]" checked={view.showMainnets} onChange={async (e) => setView(await call({ type: 'ui:settings', showMainnets: e.target.checked }))} />
        </label>
        <label className="flex items-center justify-between gap-4 p-4">
          <span>
            <span className="block text-[14px]">Auto-lock</span>
            <span className="block text-[12px] text-subtle">After this long without activity.</span>
          </span>
          <select className="h-9 rounded-[10px] border border-line bg-card px-2 text-[13px]" value={view.autoLockMinutes} onChange={async (e) => setView(await call({ type: 'ui:settings', autoLockMinutes: Number(e.target.value) }))}>
            {[5, 15, 30, 60, 240].map((m) => (
              <option key={m} value={m}>
                {m < 60 ? `${m} min` : `${m / 60} h`}
              </option>
            ))}
          </select>
        </label>
      </Card>

      <Card className="p-4 space-y-3">
        <p className="text-[14px]">Recovery phrase</p>
        {phrase ? (
          <>
            <p className="font-mono text-[12px] leading-relaxed bg-inset rounded-[12px] p-3">{phrase}</p>
            <Button size="sm" onClick={() => setPhrase('')}>Hide</Button>
          </>
        ) : (
          <form
            className="flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setError('');
              try {
                setPhrase(await call({ type: 'ui:reveal', password: pw }));
                setPw('');
              } catch (err: any) {
                setError(err.message === 'Wrong password' ? 'That password is not right.' : err.message);
              }
            }}
          >
            <input type="password" className={inputCls(!!error)} placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} />
            <Button type="submit" icon={<Eye size={14} />} disabled={!pw}>Show</Button>
          </form>
        )}
        <ErrorText>{error}</ErrorText>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Button icon={<Lock size={14} />} onClick={async () => setView(await call({ type: 'ui:lock' }))}>
          Lock now
        </Button>
        <Button variant="danger" icon={<Trash2 size={14} />} onClick={async () => (confirmReset ? setView(await call({ type: 'ui:reset' })) : setConfirmReset(true))}>
          {confirmReset ? 'Tap again to erase' : 'Remove wallet'}
        </Button>
      </div>
      {confirmReset && <p className="text-[12px] text-bad leading-snug">This erases Orion from this browser. You can only get your funds back with your recovery phrase.</p>}
      <div className="flex flex-col items-center pt-2">
        <Constellation size={84} labels={false} />
        <p className="text-[11px] text-subtle text-center">Orion v0.1 · account #0 on every chain</p>
      </div>
    </div>
  );
}
