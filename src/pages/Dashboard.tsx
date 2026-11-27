import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { animate, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Droplets, ExternalLink, Wallet, Download } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import SendTransactionForm from '../components/SendTransactionForm';
import TransactionHistoryList from '../components/TransactionHistoryList';
import StipplePlanet, { BELT } from '../components/landing/StipplePlanet';
import { HeroArt } from './LandingPage';
import { minimumBalance, spendableBalance } from '../services/stellar';
import { Badge, Button, Card, CardHeader, CopyButton, Mono, Notice, Skeleton, formatAmount, formatUsd, timeAgo } from '../components/ui';
import { Rise, SplitWords, ease } from '../components/motion';

/** Counts smoothly from the previous value to the new one whenever the balance changes. */
function AnimatedNumber({ value }: { value: number }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? value : 0);
  const prev = useRef(reduced ? value : 0);
  useEffect(() => {
    if (reduced) return setShown(value);
    const c = animate(prev.current, value, { duration: 1.4, ease, onUpdate: setShown });
    prev.current = value;
    return () => c.stop();
  }, [value, reduced]);
  return <>{formatAmount(shown)}</>;
}

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

export default function Dashboard() {
  const { wallet, account, accountError, isLoadingAccount, refreshAccount, requestAirdrop, isFunding, switchToSepolia, prices } = useWallet();
  const reduced = !!useReducedMotion();

  if (!wallet.isConnected || !wallet.publicKey) return <ConnectScreen />;

  const isEvm = wallet.walletType === 'metamask';
  const symbol = isEvm ? 'ETH' : 'XLM';
  const balance = account ? parseFloat(account.xlmBalance) : 0;
  const price = isEvm ? prices.ethereum : prices.stellar;
  const reserve = minimumBalance(account?.subentryCount ?? 0);
  const spendable = isEvm ? balance : spendableBalance(balance, account?.subentryCount ?? 0);
  const explorerUrl = isEvm ? `https://sepolia.etherscan.io/address/${wallet.publicKey}` : `https://stellar.expert/explorer/testnet/account/${wallet.publicKey}`;

  return (
    <div className="space-y-6">
      {!wallet.networkOk && (
        <Rise>
          <Notice tone="warning" title={`Your wallet is on ${wallet.network || 'another network'}`} action={isEvm ? <Button size="sm" onClick={switchToSepolia}>Switch to Sepolia</Button> : undefined}>
            {isEvm
              ? 'Orion only sends on the Sepolia test network. Switch networks to send.'
              : 'Orion only sends on the Stellar testnet. Open Freighter → Settings → Network and choose Testnet. Sending is paused until then.'}
          </Notice>
        </Rise>
      )}

      {accountError && (
        <Rise>
          <Notice tone="bad" title="Balance could not be loaded" action={<Button size="sm" onClick={() => refreshAccount()} icon={<RefreshCw size={14} />}>Try again</Button>}>
            {accountError}
          </Notice>
        </Rise>
      )}

      {/* Balance */}
      <Rise>
        <Card padded={false} className="relative overflow-hidden">
          <div className="grid md:grid-cols-[1fr_300px] items-center">
            <div className="p-6 sm:p-9">
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <span className="text-[14px] text-muted">{isEvm ? 'Sepolia balance' : 'Testnet balance'}</span>
                {account && !isEvm && (account.exists ? <Badge tone="ok" dot>Active</Badge> : <Badge tone="warning" dot>Not funded yet</Badge>)}
              </div>

              {isLoadingAccount && !account ? (
                <Skeleton className="h-16 w-72" />
              ) : (
                <p className="font-serif leading-[0.9] tracking-[-0.03em] num">
                  <span className="text-[56px] sm:text-[84px]">{account ? <AnimatedNumber value={balance} /> : '—'}</span>
                  <span className="text-[24px] sm:text-[32px] text-muted ml-3 tracking-normal">{symbol}</span>
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[14px] text-muted">
                {account?.exists && price !== undefined && (
                  <span title="Test tokens have no real value. This is what the same amount would be worth on mainnet.">≈ {formatUsd(balance * price)} at mainnet price</span>
                )}
                {account?.exists && !isEvm && (
                  <span>
                    {formatAmount(spendable)} spendable · {formatAmount(reserve, 1)} XLM reserved
                  </span>
                )}
                {account && <span className="text-subtle">Updated {timeAgo(account.lastUpdated)}</span>}
              </div>

              <div className="mt-7 grid grid-cols-[1fr_1fr_auto] sm:flex sm:flex-wrap gap-2.5">
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
                <p className="text-[14px] text-muted mt-5 max-w-lg leading-relaxed">
                  New Stellar addresses don't exist on the ledger until they hold at least 1 XLM. Friendbot is the testnet faucet: it creates the account and funds it for free.
                </p>
              )}
            </div>

            {/* Halftone planet, as on the landing page */}
            <motion.div
              className="hidden md:block relative pr-6 py-6"
              animate={reduced ? undefined : { y: [0, -6, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden="true"
            >
              <div className="relative">
                <StipplePlanet className="w-full h-auto" reduced={reduced} />
                {BELT.map((b, i) => (
                  <motion.span
                    key={i}
                    className="absolute w-[5px] h-[5px] -ml-[2.5px] -mt-[2.5px] rounded-full bg-white"
                    style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%`, boxShadow: '0 0 8px 2px rgba(255,255,255,0.95)' }}
                    initial={{ opacity: 0 }}
                    animate={reduced ? { opacity: 1 } : { opacity: [0, 1, 0.5, 1] }}
                    transition={{ delay: 1.6 + i * 0.15, duration: 1.2 }}
                  />
                ))}
              </div>
            </motion.div>
          </div>

          {account?.assets && account.assets.length > 0 && (
            <div className="border-t border-line px-6 sm:px-9 py-4 flex flex-wrap gap-2">
              <span className="text-[14px] text-muted mr-1 self-center">Other assets</span>
              {account.assets.map((a) => (
                <span key={a.code + a.issuer} className="h-8 px-3 rounded-[10px] bg-inset text-[14px] flex items-center gap-2 num" title={a.issuer}>
                  <span className="font-semibold">{formatAmount(a.balance)}</span>
                  <span className="text-muted">{a.code}</span>
                </span>
              ))}
            </div>
          )}
        </Card>
      </Rise>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <Rise delay={0.1} className="lg:col-span-7">
          <div id="send" className="scroll-mt-24">
            <SendTransactionForm />
          </div>
        </Rise>

        {/* Receive */}
        <Rise delay={0.18} className="lg:col-span-5">
          <Card id="receive" className="scroll-mt-24">
            <CardHeader title="Receive" description={`Share this address to receive ${symbol} on ${isEvm ? 'Sepolia' : 'the Stellar testnet'}.`} />
            <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-5">
              <motion.div
                className="p-4 rounded-[20px] bg-paper border border-line shrink-0"
                initial={reduced ? false : { rotate: -6, scale: 0.9, opacity: 0 }}
                whileInView={{ rotate: 0, scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 120, damping: 14, delay: 0.2 }}
              >
                <QRCodeSVG value={wallet.publicKey} size={156} bgColor="#f6f5f2" fgColor="#141414" level="M" />
              </motion.div>
              <div className="w-full min-w-0">
                <div className="rounded-[14px] bg-inset p-3.5">
                  <Mono className="text-ink leading-relaxed">{wallet.publicKey}</Mono>
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
                <summary className="cursor-pointer text-[14px] text-muted hover:text-ink select-none list-none flex items-center justify-between">
                  Account details
                  <span className="text-subtle group-open:rotate-90 transition-transform">›</span>
                </summary>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-[14px] bg-inset p-3">
                    <dt className="text-subtle text-[13px]">Sequence number</dt>
                    <dd className="font-mono text-[13px] text-ink mt-1 truncate">{account.sequenceNumber}</dd>
                  </div>
                  <div className="rounded-[14px] bg-inset p-3">
                    <dt className="text-subtle text-[13px]">Subentries</dt>
                    <dd className="text-ink mt-1 num">{account.subentryCount ?? 0}</dd>
                  </div>
                </dl>
              </details>
            )}
          </Card>
        </Rise>
      </div>

      <Rise inView>
        <TransactionHistoryList />
      </Rise>
    </div>
  );
}

function ConnectScreen() {
  const { wallet, connect } = useWallet();
  const connecting = wallet.status === 'connecting';

  return (
    <div className="text-center pt-6 sm:pt-10">
      <h1 className="font-serif text-[48px] sm:text-[80px] leading-[0.95] tracking-[-0.02em]">
        <SplitWords text="Connect a wallet," />
      </h1>
      <Rise delay={0.35} y={10}>
        <p className="mt-4 text-[15px] sm:text-base text-muted">and Orion takes it from there: fund, send and watch payments land.</p>
      </Rise>
      <Rise delay={0.5} y={10}>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button variant="primary" size="lg" loading={connecting} onClick={() => connect('freighter')} icon={<Wallet size={17} />}>
            Connect Freighter
          </Button>
          <Button size="lg" disabled={connecting} onClick={() => connect('metamask')}>
            Use MetaMask (Sepolia)
          </Button>
        </div>
        {wallet.error && <p className="text-[14px] text-bad mt-4">{wallet.error}</p>}
        {!wallet.isInstalled && (
          <p className="text-[14px] text-muted mt-4 inline-flex items-center gap-2">
            <Download size={15} className="text-subtle" />
            <span>
              No wallet found in this browser.{' '}
              <a href="https://www.freighter.app/" target="_blank" rel="noreferrer" className="text-ink underline underline-offset-4">
                Install Freighter
              </a>
              , then reload.
            </span>
          </p>
        )}
      </Rise>
      <HeroArt className="mt-6 max-w-[520px]" />
    </div>
  );
}
