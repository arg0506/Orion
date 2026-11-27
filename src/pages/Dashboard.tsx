import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Droplets, ExternalLink, Wallet, Download } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import SendTransactionForm from '../components/SendTransactionForm';
import TransactionHistoryList from '../components/TransactionHistoryList';
import { minimumBalance, spendableBalance } from '../services/stellar';
import { Badge, Button, Card, CardHeader, CopyButton, Mono, Notice, Skeleton, formatAmount, formatUsd, timeAgo } from '../components/ui';

/** The Orion constellation, drawn to scale-ish. Betelgeuse and Rigel carry the app's two signal colours. */
function Constellation({ className }: { className?: string }) {
  const stars = {
    betelgeuse: [30, 22],
    bellatrix: [118, 34],
    alnitak: [62, 104],
    alnilam: [78, 98],
    mintaka: [94, 92],
    saiph: [44, 178],
    rigel: [132, 168],
  } as const;
  const lines: [keyof typeof stars, keyof typeof stars][] = [
    ['betelgeuse', 'bellatrix'],
    ['betelgeuse', 'alnitak'],
    ['bellatrix', 'mintaka'],
    ['alnitak', 'alnilam'],
    ['alnilam', 'mintaka'],
    ['alnitak', 'saiph'],
    ['mintaka', 'rigel'],
  ];
  return (
    <svg viewBox="0 0 160 200" className={className} aria-hidden="true">
      {lines.map(([a, b]) => (
        <line key={a + b} x1={stars[a][0]} y1={stars[a][1]} x2={stars[b][0]} y2={stars[b][1]} stroke="#8a93b2" strokeOpacity="0.28" strokeWidth="0.8" />
      ))}
      {Object.entries(stars).map(([name, [x, y]]) => {
        const color = name === 'betelgeuse' ? '#ff8a5b' : name === 'rigel' ? '#8fc1ff' : '#eef1fa';
        const r = name === 'betelgeuse' || name === 'rigel' ? 3.6 : name.startsWith('al') || name === 'mintaka' ? 2.4 : 2;
        return (
          <g key={name}>
            <circle cx={x} cy={y} r={r * 3.2} fill={color} opacity="0.08" />
            <circle cx={x} cy={y} r={r} fill={color} />
          </g>
        );
      })}
    </svg>
  );
}

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

export default function Dashboard() {
  const { wallet, account, accountError, isLoadingAccount, refreshAccount, requestAirdrop, isFunding, connect, switchToSepolia, prices } = useWallet();

  if (!wallet.isConnected || !wallet.publicKey) return <ConnectScreen />;

  const isEvm = wallet.walletType === 'metamask';
  const symbol = isEvm ? 'ETH' : 'XLM';
  const balance = account ? parseFloat(account.xlmBalance) : 0;
  const price = isEvm ? prices.ethereum : prices.stellar;
  const reserve = minimumBalance(account?.subentryCount ?? 0);
  const spendable = isEvm ? balance : spendableBalance(balance, account?.subentryCount ?? 0);
  const explorerUrl = isEvm
    ? `https://sepolia.etherscan.io/address/${wallet.publicKey}`
    : `https://stellar.expert/explorer/testnet/account/${wallet.publicKey}`;

  return (
    <div className="space-y-6">
      {!wallet.networkOk && (
        <Notice
          tone="warning"
          title={`Your wallet is on ${wallet.network || 'another network'}`}
          action={isEvm ? <Button size="sm" onClick={switchToSepolia}>Switch to Sepolia</Button> : undefined}
        >
          {isEvm
            ? 'Orion only sends on the Sepolia test network. Switch networks to send.'
            : 'Orion only sends on the Stellar testnet. Open Freighter → Settings → Network and choose Testnet. Sending is paused until then.'}
        </Notice>
      )}

      {accountError && (
        <Notice tone="bad" title="Balance could not be loaded" action={<Button size="sm" onClick={() => refreshAccount()} icon={<RefreshCw size={14} />}>Try again</Button>}>
          {accountError}
        </Notice>
      )}

      {/* Balance */}
      <Card padded={false} className="relative overflow-hidden">
        <div className="relative p-6 sm:p-8 sm:pr-52">
          <Constellation className="pointer-events-none absolute right-6 lg:right-10 top-1/2 -translate-y-1/2 h-[calc(100%-2.5rem)] max-h-[230px] hidden sm:block" />
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-sm text-mist">{isEvm ? 'Sepolia balance' : 'Testnet balance'}</span>
            {account && !isEvm && (account.exists ? <Badge tone="ok" dot>Active</Badge> : <Badge tone="warning" dot>Not funded yet</Badge>)}
          </div>

          {isLoadingAccount && !account ? (
            <Skeleton className="h-14 w-64" />
          ) : (
            <p className="font-display font-bold tracking-tight text-starlight leading-none num">
              <span className="text-[44px] sm:text-[60px]">{account ? formatAmount(account.xlmBalance) : '—'}</span>
              <span className="text-2xl sm:text-3xl text-mist font-semibold ml-2">{symbol}</span>
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-mist">
            {account?.exists && price !== undefined && (
              <span title="Test tokens have no real value. This is what the same amount would be worth on mainnet.">
                ≈ {formatUsd(balance * price)} at mainnet price
              </span>
            )}
            {account?.exists && !isEvm && (
              <span>
                {formatAmount(spendable)} spendable · {formatAmount(reserve, 1)} XLM reserved
              </span>
            )}
            {account && <span className="text-haze">Updated {timeAgo(account.lastUpdated)}</span>}
          </div>

          <div className="mt-6 grid grid-cols-[1fr_1fr_auto] sm:flex sm:flex-wrap gap-2.5">
            {account && !account.exists && !isEvm ? (
              <Button variant="primary" size="lg" loading={isFunding} onClick={requestAirdrop} icon={<Droplets size={17} />} className="col-span-3 sm:col-span-1">
                Fund with Friendbot (10,000 XLM)
              </Button>
            ) : (
              <Button variant="primary" size="lg" onClick={() => scrollTo('send')} icon={<ArrowUpRight size={17} />} disabled={!wallet.networkOk}>
                Send
              </Button>
            )}
            <Button size="lg" onClick={() => scrollTo('receive')} icon={<ArrowDownLeft size={17} />}>
              Receive
            </Button>
            <Button size="lg" variant="ghost" onClick={() => refreshAccount()} loading={isLoadingAccount} icon={<RefreshCw size={16} />} aria-label="Refresh balance">
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>

          {account && !account.exists && !isEvm && (
            <p className="text-sm text-mist mt-4 max-w-lg leading-relaxed">
              New Stellar addresses don't exist on the ledger until they hold at least 1 XLM. Friendbot is the testnet faucet: it creates the account and funds it for free.
            </p>
          )}
        </div>

        {account?.assets && account.assets.length > 0 && (
          <div className="relative border-t border-line px-6 sm:px-8 py-4 flex flex-wrap gap-2">
            <span className="text-sm text-mist mr-1 self-center">Other assets</span>
            {account.assets.map((a) => (
              <span key={a.code + a.issuer} className="h-8 px-3 rounded-lg bg-deeper border border-line text-sm flex items-center gap-2 num" title={a.issuer}>
                <span className="font-semibold">{formatAmount(a.balance)}</span>
                <span className="text-mist">{a.code}</span>
              </span>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div id="send" className="lg:col-span-7 scroll-mt-24">
          <SendTransactionForm />
        </div>

        {/* Receive */}
        <Card id="receive" className="lg:col-span-5 scroll-mt-24">
          <CardHeader title="Receive" description={`Share this address to receive ${symbol} on ${isEvm ? 'Sepolia' : 'the Stellar testnet'}.`} />
          <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-5">
            <div className="p-3 rounded-2xl bg-starlight shrink-0">
              <QRCodeSVG value={wallet.publicKey} size={156} bgColor="#eef1fa" fgColor="#0b0e1a" level="M" />
            </div>
            <div className="w-full min-w-0">
              <div className="rounded-xl bg-deeper border border-line p-3.5">
                <Mono className="text-starlight leading-relaxed">{wallet.publicKey}</Mono>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <CopyButton value={wallet.publicKey} label="Copy address" toastText="Address copied" className="border border-line" />
                <a href={explorerUrl} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="ghost" icon={<ExternalLink size={14} />}>
                    {isEvm ? 'Etherscan' : 'Stellar Expert'}
                  </Button>
                </a>
              </div>
            </div>
          </div>

          {!isEvm && account?.exists && (
            <details className="mt-6 group">
              <summary className="cursor-pointer text-sm text-mist hover:text-starlight select-none list-none flex items-center justify-between">
                Account details
                <span className="text-haze group-open:rotate-90 transition-transform">›</span>
              </summary>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-deeper border border-line p-3">
                  <dt className="text-haze text-[13px]">Sequence number</dt>
                  <dd className="font-mono text-[13px] text-starlight mt-1 truncate">{account.sequenceNumber}</dd>
                </div>
                <div className="rounded-xl bg-deeper border border-line p-3">
                  <dt className="text-haze text-[13px]">Subentries</dt>
                  <dd className="text-starlight mt-1 num">{account.subentryCount ?? 0}</dd>
                </div>
              </dl>
            </details>
          )}
        </Card>
      </div>

      <TransactionHistoryList />
    </div>
  );
}

function ConnectScreen() {
  const { wallet, connect } = useWallet();
  const connecting = wallet.status === 'connecting';

  return (
    <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center py-6 sm:py-12">
      <div>
        <p className="text-[13px] font-medium text-rigel mb-3">Stellar testnet wallet</p>
        <h1 className="font-display font-bold text-[36px] sm:text-[48px] leading-[1.05] tracking-tight text-starlight">
          Send, receive and test XLM without the guesswork.
        </h1>
        <p className="text-[16px] text-mist mt-4 max-w-lg leading-relaxed">
          Connect Freighter to see your live testnet balance, fund new accounts with Friendbot, and send payments that follow Stellar's rules for reserves and memos.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button variant="primary" size="lg" loading={connecting} onClick={() => connect('freighter')} icon={<Wallet size={17} />}>
            Connect Freighter
          </Button>
          <Button size="lg" disabled={connecting} onClick={() => connect('metamask')}>
            Use MetaMask (Sepolia)
          </Button>
        </div>
        {wallet.error && <p className="text-sm text-bad mt-4">{wallet.error}</p>}
        {!wallet.isInstalled && (
          <p className="text-sm text-mist mt-5 flex items-center gap-2">
            <Download size={15} className="text-haze" />
            <span>
              No wallet found in this browser.{' '}
              <a href="https://www.freighter.app/" target="_blank" rel="noreferrer" className="text-rigel hover:underline underline-offset-4">
                Install Freighter
              </a>
              , then reload.
            </span>
          </p>
        )}
      </div>

      <Card className="hidden lg:block">
        <ol className="space-y-5">
          {[
            ['Connect', 'Freighter shares your public address. Your secret key never leaves the extension.'],
            ['Fund', 'New addresses need 1 XLM to exist. Friendbot sends 10,000 test XLM for free.'],
            ['Send', 'Orion builds the transaction, Freighter asks you to sign, and it lands on the testnet in seconds.'],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-4">
              <span className="w-8 h-8 rounded-full border border-line bg-deeper grid place-items-center text-sm font-semibold text-rigel shrink-0 num">{i + 1}</span>
              <div>
                <p className="font-semibold text-starlight">{t}</p>
                <p className="text-sm text-mist mt-0.5 leading-relaxed">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
