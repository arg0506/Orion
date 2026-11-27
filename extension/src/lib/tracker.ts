/**
 * Keeps pending transactions moving: polls status, rebroadcasts Solana transactions,
 * and marks originals as "replaced" once a cancel or speed-up wins.
 */
import { browser } from 'wxt/browser';
import { adapterFor, networkById, txs, upsertTx, updateBadge } from './wallet';
import type { TrackedTx } from './chains/types';

let running = false;

export function startTracking() {
  if (running) return;
  running = true;
  void loop();
}

async function loop() {
  try {
    while (true) {
      const list = await txs();
      const pending = list.filter((t) => t.status === 'pending');
      if (!pending.length) break;
      await Promise.all(pending.map((t) => check(t, list)));
      await new Promise((r) => setTimeout(r, 2500));
    }
  } finally {
    running = false;
    await updateBadge();
  }
}

async function check(tx: TrackedTx, list: TrackedTx[]) {
  const net = await networkById(tx.networkId);
  if (!net) return;
  const adapter = adapterFor(tx.family);
  try {
    const { status, error } = await adapter.getStatus(net, tx);
    if (status === 'pending') {
      await adapter.keepAlive?.(net, tx);
      return;
    }
    let final = { ...tx, status, error };
    // A Stellar speed-up wraps the same inner tx, so the original hash confirms too.
    // If a replacement exists and confirmed, show the original as replaced.
    if (status === 'confirmed' && tx.replacedBy) {
      const repl = list.find((t) => t.id === tx.replacedBy);
      if (repl && repl.kind === 'speedup') final = { ...final, status: 'replaced' };
    }
    await upsertTx(final);
    // If this was a cancel / speed-up that won, retire the original.
    if (status === 'confirmed' && tx.replaces) {
      const orig = list.find((t) => t.id === tx.replaces);
      if (orig && orig.status === 'pending') await upsertTx({ ...orig, status: 'replaced' });
    }
    // If the original won the race against a cancel, the cancel is the one replaced.
    if (status === 'confirmed' && tx.replacedBy) {
      const repl = list.find((t) => t.id === tx.replacedBy);
      if (repl && repl.status === 'pending' && repl.kind === 'cancel') await upsertTx({ ...repl, status: 'replaced', error: 'The original landed first' });
    }
    notify(final);
  } catch {
    /* network hiccup: try again next round */
  }
}

function notify(tx: TrackedTx) {
  const label = tx.kind === 'cancel' ? 'Cancellation' : tx.kind === 'speedup' ? 'Sped-up payment' : 'Transaction';
  const messages: Record<string, string> = {
    confirmed: tx.kind === 'cancel' ? 'Cancelled. The original payment can no longer go through.' : `${tx.amount ? `${tx.amount} ${tx.symbol} ` : ''}confirmed.`,
    failed: tx.error ?? 'It failed on chain.',
    expired: 'It expired without landing. No funds moved.',
    replaced: tx.kind === 'cancel' ? 'The original landed before the cancel.' : 'Replaced by a newer version.',
  };
  const message = messages[tx.status];
  if (!message) return;
  browser.notifications
    ?.create(tx.id, {
      type: 'basic',
      iconUrl: browser.runtime.getURL('/icon/128.png' as any),
      title: `${label} ${tx.status === 'confirmed' ? 'confirmed' : tx.status}`,
      message,
    })
    .catch(() => {});
}
