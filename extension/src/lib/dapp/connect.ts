import { requestApproval } from '../approvals';
import { activeNetwork, grant, isPermitted, isUnlocked } from '../wallet';
import type { DappRequest } from '../messages';

/** Ask the user to connect this site (the approval screen also unlocks Orion if needed). */
export async function ensureConnected(req: DappRequest) {
  if ((await isPermitted(req.origin, req.family)) && (await isUnlocked())) return;
  const net = await activeNetwork(req.family);
  await requestApproval({ kind: 'connect', family: req.family, origin: req.origin, favicon: req.favicon, networkId: net.id, details: {} });
  await grant(req.origin, req.family);
}

/** For signing requests: the site must already be connected; unlock is handled by the approval screen. */
export async function requirePermission(req: DappRequest) {
  const { ERR, perr } = await import('../messages');
  if (!(await isPermitted(req.origin, req.family))) throw perr(ERR.unauthorized);
}
