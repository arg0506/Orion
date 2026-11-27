<p align="center">
  <img src="../public/orion-logo-ink.svg" alt="Orion" width="220">
</p>

<h3 align="center">A multi-chain wallet built for developers</h3>
<p align="center">Ethereum & EVM L2s · Solana · Stellar — one recovery phrase, fast sends, real cancel and speed-up.</p>

---

> **Status: v0.1, testnet-first.** Orion has not been security-audited. Mainnets are hidden by default; don't put real funds in it yet.

## What it does

- **One phrase, three chains.** Derives standard addresses, so an imported phrase shows the same accounts as your other wallets:

  | Chain | Curve | Path | Same as |
  |---|---|---|---|
  | EVM | secp256k1 (BIP-32) | `m/44'/60'/0'/0/0` | MetaMask, Rabby, Hardhat/Anvil |
  | Solana | ed25519 (SLIP-10) | `m/44'/501'/0'/0'` | Phantom, Solflare |
  | Stellar | ed25519 (SLIP-10, SEP-5) | `m/44'/148'/0'` | Freighter, Lobstr |

- **Syncs with dapps on every chain**, without fighting other wallets:
  - **EVM**: EIP-1193 provider announced via **EIP-6963** (and `window.ethereum` only if no other wallet claimed it).
  - **Solana**: registered through the **Wallet Standard**, so `@solana/wallet-adapter` and friends list it automatically.
  - **Stellar**: a **SEP-43** style interface at `window.orion.stellar`.
- **Fast transactions, cancel and speed-up**, done the way each chain actually allows:

  | Chain | Fast send | Speed up | Cancel |
  |---|---|---|---|
  | EVM | 2× suggested priority fee | Same nonce, fees +12.5% (or current fast fee, whichever is higher) | Same nonce, 0-value self-transfer with higher fees |
  | Stellar | p90 fee, 30-second time bound | Fee-bump transaction paying 10× (stellar-core's replace-by-fee rule) | Same sequence, no-op `bumpSequence`, 10× fee |
  | Solana | Priority fee from recent fees (p75), rebroadcast every 2.5s | Not possible safely while pending | Not possible; Orion shows a countdown to blockhash expiry, after which it can never land |

- **Developer tools**
  - Testnets and local nodes built in: Sepolia, Base/Arbitrum/OP Sepolia, **Anvil/Hardhat** (`:8545`), Solana devnet/testnet and **solana-test-validator** (`:8899`), Stellar testnet and **Quickstart** (`:8000`).
  - Faucets: Friendbot, Solana airdrop, and `anvil_setBalance`/`hardhat_setBalance` on local EVM; links for public EVM testnets.
  - **Request log**: every call a site made, with params, result, errors and timing.
  - **Simulation before signing**: EVM transactions are simulated with `eth_estimateGas` and flagged if they would revert; ERC-20 `transfer`/`approve` and `setApprovalForAll` are decoded, with warnings for unlimited approvals.
  - `wallet_addEthereumChain` / `wallet_switchEthereumChain` support for custom and local chains.

## Install (development build)

```bash
cd extension
npm install
npm run build          # outputs .output/chrome-mv3
```

Then open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**, and pick `extension/.output/chrome-mv3`.

For live reload while developing: `npm run dev`.

## Use it from a dapp

**EVM** (any EIP-6963 library such as wagmi, RainbowKit, Web3Modal, or directly):

```js
window.addEventListener('eip6963:announceProvider', (e) => {
  if (e.detail.info.rdns === 'app.orion.wallet') {
    const orion = e.detail.provider;
    orion.request({ method: 'eth_requestAccounts' });
  }
});
window.dispatchEvent(new Event('eip6963:requestProvider'));
```

**Solana**: no code needed. Orion appears in any Wallet Standard / wallet-adapter wallet list as "Orion".

**Stellar** (SEP-43 shape: errors are returned, not thrown):

```js
const { address, error } = await window.orion.stellar.getAddress();
const { signedTxXdr } = await window.orion.stellar.signTransaction(xdr, { networkPassphrase });
```

## How it's built

```
extension/
├─ entrypoints/
│  ├─ background.ts        service worker: routes popup + dapp messages, auto-lock alarm
│  ├─ inpage.content.ts    MAIN world: installs the EVM, Solana and Stellar providers
│  ├─ bridge.content.ts    ISOLATED world: relays page <-> background
│  ├─ popup/               the wallet UI
│  └─ approval/            the window that asks you to approve each request
└─ src/
   ├─ lib/keyring/         BIP-39 / BIP-32 / SLIP-10 derivation, encrypted vault
   ├─ lib/chains/          evm.ts, solana.ts, stellar.ts adapters (send, status, cancel, speed-up, faucet)
   ├─ lib/dapp/            per-chain request handlers + permissions
   ├─ lib/tracker.ts       polls pending txs, rebroadcasts Solana, resolves replacement races
   ├─ inpage/              the providers dapps talk to
   └─ ui/                  React screens in the Orion paper style
```

**Security model**
- The recovery phrase is encrypted with your password (PBKDF2-SHA256, 600,000 iterations → AES-256-GCM) in `chrome.storage.local`.
- While unlocked, the phrase lives only in `chrome.storage.session` (memory, never written to disk) and is cleared on lock, auto-lock (default 30 min) or browser close.
- Keys never leave the background service worker. Pages only ever receive addresses and signatures.
- Every connection and signature needs explicit approval in an extension-owned window. The requesting origin comes from the browser, never from the page.

## Tests

```bash
npm test                      # 25 unit + integration tests
REQUIRE_LOCAL_NODE=1 npm test # fail instead of skipping if no EVM node is running
```

- **Key derivation** is checked against the official SLIP-10 and SEP-5 test vectors and the Hardhat default accounts.
- **EVM speed-up and cancel** run against a real local node (`npx hardhat node` or `anvil`) with automining switched off, proving the replacement wins and the original never lands.
- **Solana and Stellar** builders (priority fees, fee-bump, same-sequence cancel, SEP-53 message signing) are unit-tested offline.
- **End to end** (`e2e/e2e.py`): loads the built extension in Chrome, onboards through the UI, and drives a test dapp through all three chains, including cancelling a pending transaction from the popup. 18/18 checks pass.

## Not yet in v0.1

- One account per chain (index 0); multiple accounts and hardware wallets are next.
- Native tokens only in the UI (ERC-20 / SPL / Stellar assets are signed correctly for dapps, but not listed).
- Solana and Stellar flows were verified offline and through the provider APIs, but not yet against live devnet/testnet from CI.
- Stellar `signAuthEntry` (Soroban auth) and WalletConnect pairing are on the roadmap.
- Chrome/Chromium only for now (Firefox MV3 build untested).
