import { browser } from 'wxt/browser';
import type { Approval } from './messages';
import { ERR, perr } from './messages';

type Pending = { approval: Approval; resolve: (v: { approved: boolean; payload?: any }) => void; windowId?: number };
const pending = new Map<string, Pending>();

/** Opens the approval window and resolves when the user decides (or closes it, which counts as reject). */
export async function requestApproval(a: Omit<Approval, 'id' | 'createdAt'>): Promise<any> {
  const approval: Approval = { ...a, id: crypto.randomUUID(), createdAt: Date.now() };
  const decision = new Promise<{ approved: boolean; payload?: any }>((resolve) => pending.set(approval.id, { approval, resolve }));
  const url = browser.runtime.getURL(`/approval.html#${approval.id}` as any);
  const width = 400;
  const height = 660;
  const current = await browser.windows.getLastFocused().catch(() => undefined);
  let win;
  try {
    // Prefer the top-right corner of the current window, like other wallets.
    const left = current?.left !== undefined && current.width ? Math.max(0, current.left + current.width - width - 16) : undefined;
    const top = current?.top !== undefined ? Math.max(0, current.top + 64) : undefined;
    win = await browser.windows.create({ url, type: 'popup', width, height, left, top, focused: true });
  } catch {
    // Chrome rejects positions that would be mostly off-screen; let it choose.
    win = await browser.windows.create({ url, type: 'popup', width, height, focused: true });
  }
  const p = pending.get(approval.id);
  if (p) p.windowId = win?.id;
  const result = await decision;
  if (!result.approved) throw perr(ERR.userRejected);
  return result.payload ?? true;
}

export const getApproval = (id: string) => pending.get(id)?.approval;

export async function resolveApproval(id: string, approved: boolean, payload?: any) {
  const p = pending.get(id);
  if (!p) return;
  pending.delete(id);
  p.resolve({ approved, payload });
  if (p.windowId !== undefined) browser.windows.remove(p.windowId).catch(() => {});
}

/** Closing the window rejects whatever it was showing. */
browser.windows.onRemoved.addListener((windowId) => {
  for (const [id, p] of pending) {
    if (p.windowId === windowId) {
      pending.delete(id);
      p.resolve({ approved: false });
    }
  }
});
