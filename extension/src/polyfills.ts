/**
 * The Stellar and Solana SDKs expect Node's Buffer. Browser service workers don't have it,
 * so install the browser build before anything else loads.
 */
import { Buffer } from 'buffer';

if (!(globalThis as any).Buffer) (globalThis as any).Buffer = Buffer;
