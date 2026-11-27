import { TransactionBuilder, FeeBumpTransaction, Transaction } from '@stellar/stellar-sdk';
import type { DappRequest } from '../messages';
import { ERR, perr, ProviderError } from '../messages';
import { requestApproval } from '../approvals';
import { activeNetwork, addresses, allNetworks, isPermitted, isUnlocked, keys } from '../wallet';
import { stellarAdapter } from '../chains/stellar';
import { ensureConnected, requirePermission } from './connect';

/** Implements the SEP-43 wallet interface for Stellar dapps. */
export async function handleStellar(req: DappRequest): Promise<unknown> {
  const p = req.params ?? {};
  const net = await activeNetwork('stellar');
  switch (req.method) {
    case 'isConnected':
      return { isConnected: true };
    case 'isAllowed':
      return { isAllowed: (await isPermitted(req.origin, 'stellar')) && (await isUnlocked()) };
    case 'requestAccess':
    case 'getAddress':
      await ensureConnected(req);
      return { address: (await addresses()).stellar };
    case 'getNetwork':
      return { network: net.name, networkPassphrase: net.passphrase };

    case 'signTransaction': {
      await requirePermission(req);
      const passphrase: string = p.opts?.networkPassphrase ?? net.passphrase!;
      const known = (await allNetworks()).find((n) => n.family === 'stellar' && n.passphrase === passphrase);
      let tx: Transaction | FeeBumpTransaction;
      try {
        tx = TransactionBuilder.fromXDR(p.xdr, passphrase);
      } catch {
        throw new ProviderError(-32602, 'Could not read this transaction XDR');
      }
      const inner = tx instanceof FeeBumpTransaction ? tx.innerTransaction : tx;
      await requestApproval({
        kind: 'signTransaction',
        family: 'stellar',
        origin: req.origin,
        favicon: req.favicon,
        networkId: known?.id,
        details: {
          network: known?.name ?? `Unknown network (${passphrase})`,
          source: inner.source,
          fee: tx.fee,
          memo: inner.memo?.value?.toString(),
          operations: inner.operations.map((o: any) => ({ type: o.type, destination: o.destination, amount: o.amount ?? o.startingBalance, asset: o.asset?.code ?? (o.asset ? 'XLM' : undefined), contract: o.func ? 'Smart contract call' : undefined })),
        },
      });
      const k = await keys();
      return { signedTxXdr: stellarAdapter.signXdr(k.stellar, p.xdr, passphrase), signerAddress: k.stellar.keypair.publicKey() };
    }

    case 'signMessage': {
      await requirePermission(req);
      await requestApproval({ kind: 'signMessage', family: 'stellar', origin: req.origin, favicon: req.favicon, details: { message: String(p.message) } });
      const k = await keys();
      return { signedMessage: stellarAdapter.signMessage(k.stellar, String(p.message)), signerAddress: k.stellar.keypair.publicKey() };
    }
  }
  throw perr(ERR.unsupported, `Orion does not support ${req.method} on Stellar`);
}
