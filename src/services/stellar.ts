import { Horizon, StrKey, TransactionBuilder, Networks, BASE_FEE, Asset, Operation, Memo, Transaction } from '@stellar/stellar-sdk';
import { AccountData } from '../types';

const TESTNET_URL = 'https://horizon-testnet.stellar.org';
export const server = new Horizon.Server(TESTNET_URL);

/**
 * Validates whether a given string is a valid Stellar public key (ED25519 address).
 */
export function isValidAddress(address: string): boolean {
  try {
    return StrKey.isValidEd25519PublicKey(address);
  } catch {
    return false;
  }
}

/**
 * Fetches real account information from the Stellar Testnet.
 */
export async function fetchAccountDetails(publicKey: string): Promise<AccountData> {
  if (!isValidAddress(publicKey)) {
    throw new Error('Invalid Stellar address format.');
  }

  try {
    const account = await server.loadAccount(publicKey);
    const nativeBalance = account.balances.find((b: any) => b.asset_type === 'native');
    const xlmBalance = nativeBalance ? nativeBalance.balance : '0';

    return {
      publicKey,
      xlmBalance,
      sequenceNumber: account.sequenceNumber(),
      exists: true,
      lastUpdated: new Date().toISOString(),
      subentryCount: account.subentry_count,
    };
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      // Account does not exist on testnet yet
      return {
        publicKey,
        xlmBalance: '0',
        sequenceNumber: 'N/A',
        exists: false,
        lastUpdated: new Date().toISOString(),
      };
    }
    throw new Error(error.message || 'Failed to fetch account details from Horizon API.');
  }
}

/**
 * Requests testnet XLM using Friendbot (funding faucet).
 */
export async function fundWithFriendbot(publicKey: string): Promise<boolean> {
  if (!isValidAddress(publicKey)) {
    throw new Error('Invalid Stellar address for funding.');
  }

  const url = `https://friendbot.stellar.org/?addr=${encodeURIComponent(publicKey)}`;
  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Friendbot funding failed: ${errorText || response.statusText}`);
  }
  return true;
}

/**
 * Builds a signed-ready payment transaction envelope (XDR).
 */
export async function buildPaymentTransaction(params: {
  senderPublicKey: string;
  recipientAddress: string;
  amount: string;
  memo?: string;
}): Promise<string> {
  const { senderPublicKey, recipientAddress, amount, memo } = params;

  if (!isValidAddress(senderPublicKey)) {
    throw new Error('Sender address is invalid.');
  }
  if (!isValidAddress(recipientAddress)) {
    throw new Error('Recipient address is invalid.');
  }

  // Load sender account to get sequence number
  const senderAccount = await server.loadAccount(senderPublicKey);

  // Parse amount
  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    throw new Error('Amount must be a positive number.');
  }

  // Build transaction
  let builder = new TransactionBuilder(senderAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.payment({
        destination: recipientAddress,
        asset: Asset.native(),
        amount: amount,
      })
    )
    .setTimeout(180); // 3 minutes timeout

  if (memo && memo.trim() !== '') {
    builder = builder.addMemo(Memo.text(memo.trim()));
  }

  const transaction = builder.build();
  return transaction.toEnvelope().toXDR('base64');
}

/**
 * Submits a signed transaction envelope (XDR) to Stellar Testnet.
 */
export async function submitSignedTransaction(signedXDR: string): Promise<{
  hash: string;
  ledger: number;
  timestamp: string;
}> {
  try {
    const transaction = new Transaction(signedXDR, Networks.TESTNET);
    const response = await server.submitTransaction(transaction);
    return {
      hash: response.hash,
      ledger: response.ledger,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('Transaction submission error:', error);
    if (error.response && error.response.data) {
      const data = error.response.data;
      if (data.extras && data.extras.result_codes) {
        const codes = data.extras.result_codes;
        let details = `Transaction rejected: transaction=${codes.transaction}`;
        if (codes.operations) {
          details += `, operations=[${codes.operations.join(', ')}]`;
        }
        throw new Error(details);
      }
    }
    throw new Error(error.message || 'Failed to submit transaction to the network.');
  }
}

/**
 * Fetches and parses recent payments from Horizon for a given public key.
 */
export async function fetchOnChainPayments(publicKey: string, limit = 15): Promise<any[]> {
  if (!isValidAddress(publicKey)) {
    throw new Error('Invalid Stellar address format.');
  }

  try {
    const response = await server.payments()
      .forAccount(publicKey)
      .order('desc')
      .limit(limit)
      .call();

    return response.records.map((record: any) => {
      let amount = '0';
      let sender = '';
      let recipient = '';
      let isIncoming = false;

      if (record.type === 'payment') {
        amount = record.amount;
        sender = record.from;
        recipient = record.to;
        isIncoming = recipient === publicKey;
      } else if (record.type === 'create_account') {
        amount = record.starting_balance;
        sender = record.funder;
        recipient = record.account;
        isIncoming = recipient === publicKey;
      } else if (record.type === 'account_merge') {
        amount = 'ALL';
        sender = record.account;
        recipient = record.into;
        isIncoming = recipient === publicKey;
      } else {
        sender = record.source_account || '';
        recipient = publicKey;
        amount = '0';
        isIncoming = true;
      }

      return {
        id: record.id,
        hash: record.transaction_hash,
        type: record.type,
        sender,
        recipient,
        amount,
        timestamp: record.created_at,
        isIncoming,
        successful: record.transaction_successful ?? true,
      };
    });
  } catch (error: any) {
    console.error('Failed to fetch on-chain payments:', error);
    throw error;
  }
}

