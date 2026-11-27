import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Trash2 } from 'lucide-react';
import { call } from '../api';
import { Button, FamilyTile, cx } from '../kit';
import { OriScene } from '../art/Scene';
import type { LogEntry } from '../../lib/messages';

/** Every request a dapp sent to Orion, with params, result and timing — for debugging integrations. */
export default function DevLog() {
  const [log, setLog] = useState<LogEntry[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  useEffect(() => {
    const load = () => call<LogEntry[]>({ type: 'ui:log' }).then(setLog);
    load();
    const id = setInterval(load, 1500);
    return () => clearInterval(id);
  }, []);
  const shown = log.filter((l) => !filter || l.method.includes(filter) || l.origin.includes(filter));
  return (
    <div className="px-4 pt-4 pb-6">
      <div className="flex items-end justify-between">
        <h1 className="font-serif text-[28px] leading-none">Request log</h1>
        {log.length > 0 && (
          <Button size="sm" variant="ghost" icon={<Trash2 size={13} />} onClick={async () => setLog(await call({ type: 'ui:clearLog' }))}>
            Clear
          </Button>
        )}
      </div>
      <p className="text-[12px] text-muted mt-2 leading-relaxed">Every call a site made to Orion, newest first. Handy when your dapp integration misbehaves.</p>
      <input className="mt-3 w-full h-9 rounded-[10px] bg-card border border-line px-3 text-[13px] font-mono focus:outline-none focus:border-ink" placeholder="Filter by method or site" value={filter} onChange={(e) => setFilter(e.target.value)} />
      {shown.length === 0 && (
        <div className="mt-4 text-center">
          <OriScene size={140} prop="magnifier" mood="focused" splat="#d8f5e6" seed={31} />
          <p className="text-[12px] text-subtle">{filter ? 'Nothing matches that filter.' : 'No requests yet. Connect a dapp and watch them roll in.'}</p>
        </div>
      )}
      <ul className="mt-3 space-y-1.5">
        {shown.slice(0, 120).map((l) => (
          <motion.li key={l.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-[12px] border border-line bg-card">
            <button className="w-full flex items-center gap-2 px-3 py-2 text-left" onClick={() => setOpen(open === l.id ? null : l.id)}>
              <FamilyTile family={l.family} size={16} />
              <span className="font-mono text-[12px] flex-1 truncate">{l.method}</span>
              <span className={cx('text-[11px] num', l.ok ? 'text-subtle' : 'text-bad')}>{l.ok ? `${l.ms}ms` : 'error'}</span>
            </button>
            {open === l.id && (
              <div className="px-3 pb-3 space-y-1.5 text-[11px] font-mono break-all">
                <p className="text-subtle">{new Date(l.at).toLocaleTimeString()} · {new URL(l.origin).host}</p>
                {l.params && <p><span className="text-subtle">params </span>{l.params}</p>}
                {l.ok ? <p><span className="text-subtle">result </span>{l.result ?? 'null'}</p> : <p className="text-bad">{l.error}</p>}
              </div>
            )}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
