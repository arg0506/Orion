/**
 * Official chain marks come from @web3icons/react (MIT). We only frame them; the marks are unaltered.
 */
import React from 'react';
import NetworkEthereum from '@web3icons/react/icons/networks/NetworkEthereum';
import NetworkSepolia from '@web3icons/react/icons/networks/NetworkSepolia';
import NetworkBase from '@web3icons/react/icons/networks/NetworkBase';
import NetworkBaseSepolia from '@web3icons/react/icons/networks/NetworkBaseSepolia';
import NetworkArbitrumSepolia from '@web3icons/react/icons/networks/NetworkArbitrumSepolia';
import NetworkOptimismSepolia from '@web3icons/react/icons/networks/NetworkOptimismSepolia';
import NetworkSolana from '@web3icons/react/icons/networks/NetworkSolana';
import NetworkStellar from '@web3icons/react/icons/networks/NetworkStellar';
import { motion, useReducedMotion } from 'motion/react';
import type { Family } from '../../lib/networks';

type Icon = React.ComponentType<{ size?: number | string; variant?: 'branded' | 'mono' | 'background'; className?: string }>;

const BY_NETWORK: Record<string, Icon> = {
  'evm:sepolia': NetworkSepolia,
  'evm:base-sepolia': NetworkBaseSepolia,
  'evm:arbitrum-sepolia': NetworkArbitrumSepolia,
  'evm:op-sepolia': NetworkOptimismSepolia,
  'evm:local': NetworkEthereum,
  'evm:mainnet': NetworkEthereum,
  'evm:base': NetworkBase,
};
const BY_FAMILY: Record<Family, Icon> = { evm: NetworkEthereum, solana: NetworkSolana, stellar: NetworkStellar };

export function NetworkLogo({ networkId, family, size = 20, className }: { networkId: string; family: Family; size?: number; className?: string }) {
  const I = BY_NETWORK[networkId] ?? BY_FAMILY[family];
  return <I size={size} variant="branded" className={className} />;
}

export function FamilyLogo({ family, size = 20, className }: { family: Family; size?: number; className?: string }) {
  const I = BY_FAMILY[family];
  return <I size={size} variant="branded" className={className} />;
}

/** Sticker-style coin: white disc, thick ink rim, hard offset shadow, the chain's mark in the middle. */
export function Coin({ family, networkId, size = 44, wobble = false, className }: { family: Family; networkId?: string; size?: number; wobble?: boolean; className?: string }) {
  const reduced = useReducedMotion();
  const ring = Math.max(2, size * 0.07);
  return (
    <motion.span
      className={`relative inline-grid place-items-center rounded-full bg-white shrink-0 ${className ?? ''}`}
      style={{ width: size, height: size, border: `${ring}px solid #141414`, boxShadow: `${size * 0.07}px ${size * 0.09}px 0 #141414` }}
      animate={wobble && !reduced ? { rotate: [-8, 8, -8] } : undefined}
      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <span className="absolute inset-[12%] rounded-full border border-dashed border-black/15" />
      {networkId ? <NetworkLogo networkId={networkId} family={family} size={size * 0.62} /> : <FamilyLogo family={family} size={size * 0.62} />}
      <span className="absolute top-[14%] left-[22%] w-[22%] h-[10%] rounded-full bg-white/90 rotate-[-30deg]" />
    </motion.span>
  );
}
