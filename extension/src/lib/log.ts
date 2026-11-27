import { local } from './store';
import type { DappRequest, LogEntry } from './messages';

const trim = (v: unknown, n = 400) => {
  try {
    const s = typeof v === 'string' ? v : JSON.stringify(v, (_, x) => (typeof x === 'bigint' ? x.toString() : x));
    return s && s.length > n ? s.slice(0, n) + '…' : s;
  } catch {
    return String(v);
  }
};

/** Wraps a dapp request so every call lands in the developer request log. */
export async function logged<T>(req: DappRequest, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  const entry: LogEntry = { id: crypto.randomUUID(), at: start, origin: req.origin, family: req.family, method: req.method, params: trim(req.params), ok: true, ms: 0 };
  try {
    const result = await fn();
    entry.result = trim(result);
    return result;
  } catch (e: any) {
    entry.ok = false;
    entry.error = `${e?.code ?? ''} ${e?.message ?? e}`.trim();
    throw e;
  } finally {
    entry.ms = Date.now() - start;
    const list = (await local.get('log')) ?? [];
    list.unshift(entry);
    await local.set('log', list.slice(0, 300));
  }
}
