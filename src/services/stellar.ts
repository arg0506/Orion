import { Horizon, StrKey, TransactionBuilder, Networks, BASE_FEE, Asset, Operation, Memo, Transaction } from '@stellar/stellar-sdk';
import { AccountData } from '../types';

export const HORIZON_URL = 'https://horizon-testnet.stellar.org';
export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const server = new Horizon.Server(HORIZON_URL);

/** Stellar base reserve (XLM) — each account holds (2 + subentries) × this. */
export const BASE_RESERVE = 0.5;
/** Fee per operation in XLM (BASE_FEE is in stroops). */
export const FEE_XLM = Number(BASE_FEE) / 1e7;
/** Max bytes Stellar allows in a text memo. */
export const MEMO_MAX_BYTES = 28;

export function isValidAddress(address: string): boolean {
  try {
    return StrKey.isValidEd25519PublicKey(address);
  } catch {
    return false;
  }
}

export function memoByteLength(memo: string): number {
  return new TextEncoder().encode(memo).length;
}

/** Minimum balance an account must keep, based on its subentries. */
export function minimumBalance(subentryCount = 0): number {
  return (2 + subentryCount) * BASE_RESERVE;
}

/** How much XLM can actually leave the account in one payment. */
export function spendableBalance(balance: string | number, subentryCount = 0): number {
  const b = typeof balance === 'string' ? parseFloat(balance) : balance;
  return Math.max(0, b - minimumBalance(subentryCount) - FEE_XLM);
}

export class HorizonError extends Error {}

export async function fetchAccountDetails(publicKey: string): Promise<AccountData> {
  if (!isValidAddress(publicKey)) {
    throw new Error('That is not a valid Stellar address.');
  }

  try {
    const account = await server.loadAccount(publicKey);
    const nativeBalance = account.balances.find((b: any) => b.asset_type === 'native');
    const otherAssets = account.balances
      .filter((b: any) => b.asset_type !== 'native' && b.asset_type !== 'liquidity_pool_shares')
      .map((b: any) => ({ code: b.asset_code as string, issuer: b.asset_issuer as string, balance: b.balance as string }));

    return {
      publicKey,
      xlmBalance: nativeBalance ? nativeBalance.balance : '0',
      sequenceNumber: account.sequenceNumber(),
      exists: true,
      lastUpdated: new Date().toISOString(),
      subentryCount: account.subentry_count,
      assets: otherAssets,
    };
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return {
        publicKey,
        xlmBalance: '0',
        sequenceNumber: 'N/A',
        exists: false,
        lastUpdated: new Date().toISOString(),
        subentryCount: 0,
        assets: [],
      };
    }
    throw new HorizonError('Could not reach the Stellar testnet (Horizon). Check your connection and try again.');
  }
}

export async function accountExists(publicKey: string): Promise<boolean> {
  try {
    await server.loadAccount(publicKey);
    return true;
  } catch (error: any) {
    if (error?.response?.status === 404) return false;
    throw new HorizonError('Could not check the recipient account on Horizon.');
  }
}

export async function fundWithFriendbot(publicKey: string): Promise<boolean> {
  if (!isValidAddress(publicKey)) {
    throw new Error('That is not a valid Stellar address.');
  }

  const response = await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(publicKey)}`);
  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body?.detail || '';
    } catch {
      /* ignore */
    }
    if (detail.includes('already funded') || response.status === 400) {
      throw new Error('Friendbot only funds new accounts. This one is already funded.');
    }
    throw new Error(`Friendbot could not fund this account${detail ? `: ${detail}` : '.'}`);
  }
  return true;
}

/**
 * Builds a payment envelope (XDR). If the recipient does not exist yet,
 * it uses createAccount instead, which is the only way to send XLM to a new address.
 */
export async function buildPaymentTransaction(params: {
  senderPublicKey: string;
  recipientAddress: string;
  amount: string;
  memo?: string;
}): Promise<{ xdr: string; createsAccount: boolean }> {
  const { senderPublicKey, recipientAddress, amount, memo } = params;

  if (!isValidAddress(senderPublicKey)) throw new Error('Your address is invalid.');
  if (!isValidAddress(recipientAddress)) throw new Error('The recipient address is invalid.');

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) throw new Error('Amount must be greater than 0.');

  const cleanMemo = memo?.trim() ?? '';
  if (memoByteLength(cleanMemo) > MEMO_MAX_BYTES) {
    throw new Error(`Memo is too long. Stellar allows ${MEMO_MAX_BYTES} bytes.`);
  }

  const [senderAccount, recipientExists] = await Promise.all([
    server.loadAccount(senderPublicKey),
    accountExists(recipientAddress),
  ]);

  if (!recipientExists && amountNum < 1) {
    throw new Error('The recipient account does not exist yet. Send at least 1 XLM to create it.');
  }

  // Horizon wants at most 7 decimal places
  const normalizedAmount = amountNum.toFixed(7).replace(/\.?0+$/, '');

  let builder = new TransactionBuilder(senderAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      recipientExists
        ? Operation.payment({ destination: recipientAddress, asset: Asset.native(), amount: normalizedAmount })
        : Operation.createAccount({ destination: recipientAddress, startingBalance: normalizedAmount })
    )
    .setTimeout(180);

  if (cleanMemo) builder = builder.addMemo(Memo.text(cleanMemo));

  return { xdr: builder.build().toEnvelope().toXDR('base64'), createsAccount: !recipientExists };
}

const RESULT_CODE_MESSAGES: Record<string, string> = {
  op_underfunded: 'Not enough XLM. Remember the account must keep its minimum balance.',
  op_low_reserve: 'This would drop the account below its minimum balance.',
  op_no_destination: 'The recipient account does not exist.',
  op_no_trust: 'The recipient does not hold this asset.',
  tx_bad_seq: 'The transaction was out of date. Please try again.',
  tx_insufficient_fee: 'The network fee was too low. Please try again.',
  tx_too_late: 'The transaction expired before it was submitted. Please try again.',
};

export async function submitSignedTransaction(signedXDR: string): Promise<{ hash: string; ledger: number; timestamp: string }> {
  try {
    const transaction = new Transaction(signedXDR, NETWORK_PASSPHRASE);
    const response = await server.submitTransaction(transaction);
    return { hash: response.hash, ledger: response.ledger, timestamp: new Date().toISOString() };
  } catch (error: any) {
    const codes = error?.response?.data?.extras?.result_codes;
    if (codes) {
      const opCode = codes.operations?.find((c: string) => c !== 'op_success');
      const friendly = (opCode && RESULT_CODE_MESSAGES[opCode]) || RESULT_CODE_MESSAGES[codes.transaction];
      throw new Error(friendly || `Transaction rejected (${codes.transaction}${opCode ? `, ${opCode}` : ''}).`);
    }
    throw new Error(error?.message || 'Failed to submit the transaction.');
  }
}

export interface OnChainPayment {
  id: string;
  hash: string;
  type: string;
  sender: string;
  recipient: string;
  amount: string;
  asset: string;
  timestamp: string;
  isIncoming: boolean;
  successful: boolean;
}

function parsePaymentRecord(record: any, publicKey: string): OnChainPayment {
  let amount = '0';
  let sender = record.source_account || '';
  let recipient = '';
  let asset = 'XLM';

  if (record.type === 'payment' || record.type?.startsWith('path_payment')) {
    amount = record.amount;
    sender = record.from;
    recipient = record.to;
    asset = record.asset_type === 'native' ? 'XLM' : record.asset_code;
  } else if (record.type === 'create_account') {
    amount = record.starting_balance;
    sender = record.funder;
    recipient = record.account;
  } else if (record.type === 'account_merge') {
    amount = '—';
    sender = record.account;
    recipient = record.into;
  }

  return {
    id: record.id,
    hash: record.transaction_hash,
    type: record.type,
    sender,
    recipient,
    amount,
    asset,
    timestamp: record.created_at,
    isIncoming: recipient === publicKey,
    successful: record.transaction_successful ?? true,
  };
}

export async function fetchOnChainPayments(publicKey: string, limit = 20): Promise<OnChainPayment[]> {
  if (!isValidAddress(publicKey)) throw new Error('That is not a valid Stellar address.');

  try {
    const response = await server.payments().forAccount(publicKey).order('desc').limit(limit).call();
    return response.records.map((r: any) => parsePaymentRecord(r, publicKey));
  } catch (error: any) {
    if (error?.response?.status === 404) return [];
    throw error;
  }
}

/**
 * Streams new payments for an account. Returns a function that closes the stream.
 */
export function streamPayments(publicKey: string, onPayment: (p: OnChainPayment) => void): () => void {
  if (!isValidAddress(publicKey)) return () => {};
  return server
    .payments()
    .forAccount(publicKey)
    .cursor('now')
    .stream({
      onmessage: (record: any) => onPayment(parsePaymentRecord(record, publicKey)),
      onerror: () => {
        /* EventSource reconnects automatically */
      },
    });
}
