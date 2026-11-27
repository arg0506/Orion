/**
 * Background-only wallet core. Keys are derived from the session-held phrase on demand
 * and cached for the life of the service worker. Nothing here runs in web pages.
 */
import { browser } from 'wxt/browser';
import { local, session, type Permission, type Settings } from './store';
import { decryptSecret, encryptSecret } from './keyring/vault';
import { deriveEvmPrivateKey, deriveSolanaSeed, deriveStellarSeed, normalizeMnemonic, seedFromMnemonic, validateMnemonic } from './keyring/derive';
import { BUILTIN_NETWORKS, DEFAULT_ACTIVE, customEvmNetwork, type Family, type Network } from './networks';
import { evmAdapter, evmKeysFromPrivateKey, type EvmKeys } from './chains/evm';
import { solanaAdapter, solanaKeysFromSeed, type SolanaKeys } from './chains/solana';
import { stellarAdapter, stellarKeysFromSeed, type StellarKeys } from './chains/stellar';
import type { ChainAdapter, TrackedTx } from './chains/types';
import type { WalletView } from './messages';

export const ACCOUNT_INDEX = 0;

type Keys = { evm: EvmKeys; solana: SolanaKeys; stellar: StellarKeys };
let cached: Keys | null = null;

export const adapters: { evm: typeof evmAdapter; solana: typeof solanaAdapter; stellar: typeof stellarAdapter } = {
  evm: evmAdapter,
  solana: solanaAdapter,
  stellar: stellarAdapter,
};
export const adapterFor = (f: Family) => adapters[f] as ChainAdapter<any>;

const DEFAULT_SETTINGS: Settings = { showMainnets: false, autoLockMinutes: 30, active: { ...DEFAULT_ACTIVE }, customNetworks: [] };

export async function getSettings(): Promise<Settings> {
  const s = await local.get('settings');
  return { ...DEFAULT_SETTINGS, ...s, active: { ...DEFAULT_ACTIVE, ...s?.active } };
}
export async function saveSettings(patch: Partial<Settings>) {
  const s = { ...(await getSettings()), ...patch };
  await local.set('settings', s);
  return s;
}

export async function allNetworks(): Promise<Network[]> {
  const s = await getSettings();
  return [...BUILTIN_NETWORKS, ...s.customNetworks.map(customEvmNetwork)];
}
export async function activeNetwork(f: Family): Promise<Network> {
  const [s, nets] = await Promise.all([getSettings(), allNetworks()]);
  return nets.find((n) => n.id === s.active[f]) ?? nets.find((n) => n.id === DEFAULT_ACTIVE[f])!;
}
export async function networkById(id: string) {
  return (await allNetworks()).find((n) => n.id === id);
}

// ── Lock state ─────────────────────────────────────────────────────────────

function deriveKeys(mnemonic: string): Keys {
  const seed = seedFromMnemonic(mnemonic);
  return {
    evm: evmKeysFromPrivateKey(deriveEvmPrivateKey(seed, ACCOUNT_INDEX)),
    solana: solanaKeysFromSeed(deriveSolanaSeed(seed, ACCOUNT_INDEX)),
    stellar: stellarKeysFromSeed(deriveStellarSeed(seed, ACCOUNT_INDEX)),
  };
}

export async function hasVault() {
  return !!(await local.get('vault'));
}

export async function isUnlocked() {
  if (cached) return true;
  const m = await session.get('mnemonic');
  if (m) cached = deriveKeys(m);
  return !!cached;
}

/** Keys for signing. Throws if locked. */
export async function keys(): Promise<Keys> {
  if (!(await isUnlocked())) throw new Error('Orion is locked');
  await touch();
  return cached!;
}

export async function addresses(): Promise<Record<Family, string>> {
  const k = await keys();
  return { evm: k.evm.account.address, solana: k.solana.keypair.publicKey.toBase58(), stellar: k.stellar.keypair.publicKey() };
}

export async function createVault(mnemonic: string, password: string) {
  if (!validateMnemonic(mnemonic)) throw new Error('That recovery phrase is not valid');
  if (password.length < 8) throw new Error('Use a password of at least 8 characters');
  const m = normalizeMnemonic(mnemonic);
  await local.set('vault', await encryptSecret(m, password));
  await session.set('mnemonic', m);
  cached = deriveKeys(m);
  await touch();
}

export async function unlock(password: string) {
  const vault = await local.get('vault');
  if (!vault) throw new Error('No wallet yet');
  const m = await decryptSecret(vault, password);
  await session.set('mnemonic', m);
  cached = deriveKeys(m);
  await touch();
  await broadcastAccounts();
}

export async function revealPhrase(password: string) {
  const vault = await local.get('vault');
  if (!vault) throw new Error('No wallet yet');
  return decryptSecret(vault, password);
}

export async function lock() {
  cached = null;
  await session.clear();
  await broadcastAccounts();
}

export async function resetWallet() {
  await lock();
  await local.remove(['vault', 'permissions', 'txs', 'log', 'settings']);
}

async function touch() {
  await session.set('lastActive', Date.now());
}

/** Called by an alarm every minute. */
export async function autoLockCheck() {
  if (!(await isUnlocked())) return;
  const [last, s] = await Promise.all([session.get('lastActive'), getSettings()]);
  if (last && Date.now() - last > s.autoLockMinutes * 60_000) await lock();
}

// ── Permissions ────────────────────────────────────────────────────────────

export async function permissions() {
  return (await local.get('permissions')) ?? {};
}
export async function isPermitted(origin: string, f: Family) {
  return !!(await permissions())[origin]?.families.includes(f);
}
export async function grant(origin: string, f: Family) {
  const all = await permissions();
  const p: Permission = all[origin] ?? { origin, families: [], connectedAt: Date.now() };
  if (!p.families.includes(f)) p.families.push(f);
  all[origin] = p;
  await local.set('permissions', all);
}
export async function revoke(origin: string, f?: Family) {
  const all = await permissions();
  if (!all[origin]) return;
  if (f) all[origin].families = all[origin].families.filter((x) => x !== f);
  if (!f || all[origin].families.length === 0) delete all[origin];
  await local.set('permissions', all);
  await broadcastAccounts();
}

// ── Transactions ───────────────────────────────────────────────────────────

export async function txs(): Promise<TrackedTx[]> {
  return (await local.get('txs')) ?? [];
}
export async function upsertTx(tx: TrackedTx) {
  const list = await txs();
  const i = list.findIndex((t) => t.id === tx.id);
  if (i >= 0) list[i] = tx;
  else list.unshift(tx);
  await local.set('txs', list.slice(0, 200));
  await updateBadge(list);
}
export async function updateBadge(list?: TrackedTx[]) {
  const pending = (list ?? (await txs())).filter((t) => t.status === 'pending').length;
  await browser.action.setBadgeText({ text: pending ? String(pending) : '' });
  await browser.action.setBadgeBackgroundColor({ color: '#141414' });
}

// ── View for the popup ─────────────────────────────────────────────────────

export async function view(): Promise<WalletView> {
  const [vault, unlocked, s, nets] = await Promise.all([hasVault(), isUnlocked(), getSettings(), allNetworks()]);
  return {
    hasVault: vault,
    unlocked,
    accounts: unlocked ? await addresses() : {},
    active: s.active,
    networks: nets,
    showMainnets: s.showMainnets,
    autoLockMinutes: s.autoLockMinutes,
  };
}

// ── Events to connected pages ──────────────────────────────────────────────

/** Tell every tab that its accounts or network may have changed; the bridge filters by permission. */
export async function broadcastAccounts() {
  const tabs = await browser.tabs.query({});
  const perms = await permissions();
  const unlocked = await isUnlocked();
  const addrs = unlocked ? await addresses() : null;
  const s = await getSettings();
  const evmNet = await activeNetwork('evm');
  const solNet = await activeNetwork('solana');
  const stellarNet = await activeNetwork('stellar');
  for (const tab of tabs) {
    if (!tab.id || !tab.url) continue;
    let origin: string;
    try {
      origin = new URL(tab.url).origin;
    } catch {
      continue;
    }
    const fam = perms[origin]?.families ?? [];
    browser.tabs
      .sendMessage(tab.id, {
        type: 'orion:event',
        evm: { accounts: addrs && fam.includes('evm') ? [addrs.evm] : [], chainId: '0x' + evmNet.chainId!.toString(16) },
        solana: { accounts: addrs && fam.includes('solana') ? [addrs.solana] : [], chain: solNet.caip },
        stellar: { address: addrs && fam.includes('stellar') ? addrs.stellar : null, network: stellarNet.name, networkPassphrase: stellarNet.passphrase },
        active: s.active,
      })
      .catch(() => {});
  }
}
