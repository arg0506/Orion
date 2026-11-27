import { browser } from 'wxt/browser';
import type { UiMessage, UiResponse } from '../lib/messages';

/** Typed call into the background service worker. Throws the background's error message. */
export async function call<T = any>(msg: UiMessage): Promise<T> {
  const res = (await browser.runtime.sendMessage(msg)) as UiResponse<T> | undefined;
  if (!res) throw new Error('Orion background is not responding');
  if (!res.ok) throw new Error(res.error);
  return res.data;
}
