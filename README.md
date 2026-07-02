# Stellar Voyager Portal (Testnet Web3 Console)

A highly polished, production-ready Web3 application built using **React, Vite, and Tailwind CSS** that operates against the **real Stellar Testnet**. It enables users to authenticate securely with Firebase Authentication, connect their Freighter browser wallet, retrieve real-time account data (including sequence numbers, subentries, and XLM balances), manage multiple monitored wallets, and securely build, sign, and submit transactions to the blockchain.

Designed and developed securely by **ARPAN ROY (arpanroy0506@gmail.com)**.

---

## 🎨 Visual Identity & Core Theme
*   **Cosmic Slate / Dark Cyberpunk Theme:** A tailored dark visual design featuring glowing monochrome indicators, subtle glassmorphism layers, and responsive interactive states.
*   **Aesthetic Pairings:** Uses the clean `Inter` for general UI text, paired with `Space Grotesk` display headers, and `JetBrains Mono` for precise blockchain markers and cryptographic hashes.

---

## 🚀 Key Features

### 1. Secure Firebase Authentication
*   **Multi-Method Auth:** Protects the gateway terminal with email/password login, registration callsigns, Google ID integrations, and instant anonymous Guest Passes.
*   **Session Persistence:** Securely tracks user session state and profile settings using Firebase Auth listeners.

### 2. Robust Wallet Integration
*   **Freighter Connection:** Detects if the Freighter extension is active. Proposes secure public key permissions and maintains connected state across browser refreshes.
*   **Network Synchronization:** Automatically queries and matches the active Freighter network to secure testnet transaction safety.

### 3. Comprehensive Wallet Dashboard
*   **Real Ledger Querying:** Direct, live connection to official Stellar Horizon Testnet nodes (no simulated data).
*   **Dynamic States:** Displays the active wallet address, current sequence number, XLM balance, subentry counts, and last updated timestamps.
*   **Interactive Faucet (Friendbot):** Provides a one-click Friendbot airdrop of **10,000 XLM** to instantly activate or top-up Testnet accounts!

### 4. Multi-Account Balance Checker
*   **Simultaneous Monitors:** Add and label multiple Stellar public keys to track their active ledger status and balances from a single dashboard.
*   **Address Validator:** Integrates official Stellar `StrKey` validations to discard ill-formatted addresses prior to issuing network queries.
*   **Local Storage Memory:** Retains tracked wallets across sessions so your monitor setup is preserved.

### 5. Direct XLM Payments
*   **Form Validations:** Real-time recipient address validation, balance alerts, and UTF-8 memo text compliance checks (28-character limit).
*   **Secure Workflow:** Programmatically loads sender credentials, builds a valid Stellar transaction, prompts Freighter for secure signing, and transmits the payload directly onto the testnet ledger.
*   **Interactive Receipts:** Displays transaction receipt cards complete with Hash, sequence numbers, and direct hyperlinks to the **StellarExpert Blockchain Explorer**.

---

## 📸 Screen Previews

This section lists the fundamental operational states of the terminal interface.

### 1. Wallet Connected State
*Shows Freighter agent successfully paired and active.*
```
┌────────────────────────────────────────────────────────────────────────┐
│  PILOT: ARPAN ROY   [CONNECTED ●]               [G-ADDR: GD3J...6F5T]  │
├────────────────────────────────────────────────────────────────────────┤
│  ● TESTNET_ONLINE                                                      │
│  G-ADDR: GD3J26...X6F5T                                                │
└────────────────────────────────────────────────────────────────────────┘
```

### 2. Balance Displayed
*Visual card rendering native XLM and active subentry limits.*
```
┌────────────────────────────────────────────────────────────────────────┐
│  NATIVE ASSET BALANCE                                            [XLM] │
│                                                                        │
│  10,000.0000 LUMENS                                                    │
│  ≈ $1,100.00 USD                                                       │
├────────────────────────────────────────────────────────────────────────┤
│  Sequence ID: 1948572019485                    Active Subentries: 0    │
└────────────────────────────────────────────────────────────────────────┘
```

### 3. Successful Testnet Transaction
*Broadcast and network validation sequence.*
```
┌────────────────────────────────────────────────────────────────────────┐
│  SEND PAYMENT [Broadcasting... ↻]                                      │
│                                                                        │
│  Recipient G-Address:  GCF472YXT4...7XF4H                              │
│  Amount (XLM):         150.00                                          │
│  Memo:                 Voyage Payload                                  │
├────────────────────────────────────────────────────────────────────────┤
│  [Authorize Shipment] ➔ Freighter signature requested                  │
└────────────────────────────────────────────────────────────────────────┘
```

### 4. Transaction Result Displayed to User
*Interactive transaction confirmation receipt.*
```
┌────────────────────────────────────────────────────────────────────────┐
│  ✔ SHIPMENT TRANSMITTED                                                │
│                                                                        │
│  • SENT: 150.00 XLM                                                    │
│  • LEDGER INDEX: 2948572                                               │
│  • RECIPIENT: GCF472YXT4...7XF4H                                       │
│                                                                        │
│  [ Copy Tx Hash ]                 [ View on Stellar Expert ↗ ]          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```text
/
├── .env.example                # Template for environment variables
├── package.json                # Project dependencies and workspace scripts
├── tsconfig.json               # TypeScript rules and compiler options
├── vite.config.ts              # Vite configurations
├── README.md                   # Core documentation
├── firebase-applet-config.json # Firebase cloud credential settings
├── src/
    ├── App.tsx                 # Main Application router, provider, and toaster setup
    ├── main.tsx                # Client entry-point
    ├── index.css               # Global CSS stylesheet (Tailwind directives & custom styles)
    ├── types.ts                # Core TypeScript type definitions
    ├── components/
    │   ├── Layout.tsx          # Cyberpunk shell layout, Firebase gate & Freighter install banners
    │   ├── AuthScreen.tsx      # Secure authentication terminal interface
    │   ├── SendTransactionForm.tsx # Secure payments form & Freighter signature handler
    │   └── TransactionHistoryList.tsx # List of completed local transactions
    ├── context/
    │   ├── AuthContext.tsx     # Firebase Authentication State Provider
    │   └── WalletContext.tsx   # Global state manager for wallet accounts & Friendbot faucets
    ├── hooks/
    │   ├── useMultiAccounts.ts # Custom hook for tracking and managing multiple accounts
    │   └── useTransactionHistory.ts # Hook for managing historic local transactions
    ├── services/
    │   ├── firebase.ts         # Firebase App & SDK initialized services
    │   └── stellar.ts          # Encapsulated on-chain logic (Horizon RPC, Friendbot, builders)
```

---

## ⚙️ Installation & Running Locally

### Prerequisites
1.  **Node.js:** Ensure Node.js (v18+) is installed.
2.  **Freighter Wallet:** Download and install the [Freighter Browser Extension](https://www.freighter.app/) to send transactions.

### Running Steps
1.  **Clone & Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Launch the development server:**
    ```bash
    npm run dev
    ```
3.  **Launch locally:**
    Open your browser to `http://localhost:3000` to interact with the console interface.

---

## ⚡ Environment Variables

The application can optionally use environment variables defined in `.env`:

```env
# APP_URL: Optional reference URL representing the app deployment
APP_URL="http://localhost:3000"
```

---

## 🛠️ Troubleshooting

### 1. Freighter Not Detected
*   Ensure that you have installed the extension from `freighter.app` and that it is enabled in your browser extensions manager.
*   Refresh the page after installing to allow the browser injected context to load.

### 2. "Account not found (404)" or "Inactive" Status
*   This is expected for new accounts. Stellar accounts must be funded with at least **1 XLM** to exist on-chain.
*   Click the **"Activate Node with 10,000 Free XLM"** button on the Dashboard. This contacts Stellar's Friendbot faucet, funding and activating your wallet on the testnet ledger instantly.

### 3. Google Sign-In closed / failed inside preview iframe
*   Due to browser iframe security policies, popup elements like Google Auth may be blocked or closed by the browser when run inside the sandboxed dev environment.
*   **Workaround:** Open the application in a new tab or use the **Email/Password** or **Guest Pass** fallback directly!
