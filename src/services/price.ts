/**
 * Live reference prices from CoinGecko. Testnet tokens have no real value,
 * so the UI labels this as the mainnet reference price.
 */
export type PriceMap = { stellar?: number; ethereum?: number };

let cache: { at: number; prices: PriceMap } | null = null;
const TTL_MS = 60_000;

export async function fetchUsdPrices(): Promise<PriceMap> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.prices;
  const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=stellar,ethereum&vs_currencies=usd');
  if (!res.ok) throw new Error('Price service unavailable');
  const data = await res.json();
  const prices: PriceMap = { stellar: data?.stellar?.usd, ethereum: data?.ethereum?.usd };
  cache = { at: Date.now(), prices };
  return prices;
}
