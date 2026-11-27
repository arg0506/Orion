import React, { useState } from 'react';
import { Eye, Plus, RefreshCw, Trash2, ExternalLink } from 'lucide-react';
import { useMultiAccounts } from '../hooks/useMultiAccounts';
import { useWallet } from '../context/WalletContext';
import { isValidAddress } from '../services/stellar';
import { Badge, Button, Card, CardHeader, CopyButton, EmptyState, Field, PageHeader, Skeleton, formatAmount, formatUsd, inputClass, shortAddress, timeAgo } from '../components/ui';

export default function MultiAccountChecker() {
  const { accounts, addAccount, removeAccount, refreshAccount, refreshAllAccounts, loading } = useMultiAccounts();
  const { prices } = useWallet();
  const [newAddress, setNewAddress] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmed = newAddress.trim();
  const addressError = trimmed && !isValidAddress(trimmed) ? 'Enter a valid Stellar address (starts with G, 56 characters).' : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addressError || !trimmed) return;
    setIsSubmitting(true);
    const ok = await addAccount(trimmed, newLabel);
    setIsSubmitting(false);
    if (ok) {
      setNewAddress('');
      setNewLabel('');
    }
  };

  const total = accounts.reduce((sum, a) => sum + (parseFloat(a.xlmBalance) || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Watchlist"
        title="Keep an eye on any address"
        description="Track the balance of Stellar testnet addresses you don't control, like a teammate's wallet or a contract's treasury. This is read-only; no keys are involved."
        action={
          accounts.length > 0 ? (
            <Button onClick={refreshAllAccounts} icon={<RefreshCw size={15} />}>
              Refresh all
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <Card className="lg:col-span-4">
          <CardHeader title="Add an address" />
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Field label="Stellar address" htmlFor="watch-address" error={addressError}>
              <input
                id="watch-address"
                className={`${inputClass(!!addressError)} font-mono text-[14px]`}
                placeholder="G…"
                value={newAddress}
                spellCheck={false}
                autoComplete="off"
                disabled={isSubmitting}
                onChange={(e) => setNewAddress(e.target.value)}
              />
            </Field>
            <Field label="Name (optional)" htmlFor="watch-label">
              <input id="watch-label" className={inputClass()} placeholder="e.g. Team treasury" value={newLabel} disabled={isSubmitting} onChange={(e) => setNewLabel(e.target.value)} />
            </Field>
            <Button type="submit" variant="primary" className="w-full" loading={isSubmitting} disabled={!trimmed || !!addressError} icon={<Plus size={16} />}>
              Add to watchlist
            </Button>
          </form>
        </Card>

        <Card className="lg:col-span-8">
          <CardHeader
            title={`Watching ${accounts.length} ${accounts.length === 1 ? 'address' : 'addresses'}`}
            description={
              accounts.length > 0 ? (
                <span className="num">
                  {formatAmount(total)} XLM in total{prices.stellar !== undefined && ` · ≈ ${formatUsd(total * prices.stellar)} at mainnet price`}
                </span>
              ) : undefined
            }
          />

          {loading ? (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <EmptyState icon={<Eye size={18} />} title="Nothing on your watchlist">
              Paste a Stellar address on the left to start tracking its balance.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-line -mx-2">
              {accounts.map((acc) => (
                <li key={acc.id} className="px-2 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-starlight truncate">{acc.label || 'Unnamed'}</p>
                      {acc.error ? (
                        <Badge tone="bad">Couldn't load</Badge>
                      ) : acc.isLoading ? null : acc.exists ? (
                        <Badge tone="ok" dot>Active</Badge>
                      ) : (
                        <Badge tone="warning" dot>Not funded</Badge>
                      )}
                    </div>
                    <p className="font-mono text-[13px] text-mist mt-1" title={acc.address}>
                      {shortAddress(acc.address, 8, 8)}
                    </p>
                    {acc.lastUpdated && <p className="text-[12px] text-haze mt-0.5">Updated {timeAgo(acc.lastUpdated)}</p>}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <p className="num font-display font-semibold text-xl text-starlight whitespace-nowrap">
                      {acc.isLoading ? <Skeleton className="h-6 w-24" /> : <>{formatAmount(acc.xlmBalance)} <span className="text-sm text-mist font-sans font-normal">XLM</span></>}
                    </p>
                    <div className="flex items-center">
                      <Button size="sm" variant="ghost" aria-label="Refresh" title="Refresh" onClick={() => refreshAccount(acc.id, acc.address)} icon={<RefreshCw size={15} className={acc.isLoading ? 'animate-spin' : ''} />} />
                      <CopyButton value={acc.address} label="" toastText="Address copied" />
                      <a href={`https://stellar.expert/explorer/testnet/account/${acc.address}`} target="_blank" rel="noreferrer" className="p-2 rounded-lg text-mist hover:text-starlight hover:bg-white/5" aria-label="Open in explorer" title="Open in explorer">
                        <ExternalLink size={15} />
                      </a>
                      <Button size="sm" variant="ghost" aria-label="Remove" title="Remove" onClick={() => removeAccount(acc.id)} icon={<Trash2 size={15} />} className="hover:text-bad" />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
