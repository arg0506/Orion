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
import type { Family } from './Engraving';

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
