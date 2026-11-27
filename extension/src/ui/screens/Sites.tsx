import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Globe, Unplug } from 'lucide-react';
import { call } from '../api';
import { Button, FamilyTile, ago } from '../kit';
import type { Permission } from '../../lib/store';

export default function Sites() {
  const [list, setList] = useState<Permission[] | null>(null);
  useEffect(() => {
    call<Permission[]>({ type: 'ui:permissions' }).then(setList);
  }, []);
  return (
    <div className="px-4 pt-4 pb-6">
      <h1 className="font-serif text-[28px] leading-none">Connected sites</h1>
      <p className="text-[12px] text-muted mt-2 leading-relaxed">Sites can see your address on the chains listed and ask you to sign. They can never sign without your approval.</p>
      {list && list.length === 0 && (
        <div className="mt-5 rounded-[16px] border border-dashed border-line-strong py-8 text-center">
          <p className="font-serif text-[18px]">No sites yet</p>
          <p className="text-[12px] text-muted mt-1">When a dapp asks to connect, it will appear here.</p>
        </div>
      )}
      <ul className="mt-4 space-y-2">
        <AnimatePresence>
          {list?.map((p, i) => (
            <motion.li key={p.origin} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.04 }} className="flex items-center gap-3 rounded-[16px] border border-line bg-card p-3">
              <span className="tile w-9 h-9 bg-inset text-muted">
                <Globe size={16} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium truncate">{new URL(p.origin).host}</p>
                <div className="flex items-center gap-1 mt-1">
                  {p.families.map((f) => (
                    <FamilyTile key={f} family={f} size={16} />
                  ))}
                  <span className="text-[11px] text-subtle ml-1">since {ago(p.connectedAt)}</span>
                </div>
              </div>
              <Button size="sm" variant="ghost" icon={<Unplug size={14} />} onClick={async () => setList(await call({ type: 'ui:revoke', origin: p.origin }))}>
                Disconnect
              </Button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
