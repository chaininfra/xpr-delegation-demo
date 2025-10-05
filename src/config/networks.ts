/**
 * XPR Network Configuration
 *
 * Centralized configuration for XPR Network testnet and mainnet.
 * Contains endpoints, chain IDs, and network-specific settings.
 *
 * Features:
 * - Testnet and mainnet configurations
 * - Correct chain IDs and endpoints
 * - WebAuth integration settings
 * - Sample Block Producer data
 * - Network validation utilities
 *
 * @fileoverview Network configuration for XPR Delegation Demo
 */

import type { NetworkConfig, NetworkType, BlockProducer } from '../types';

// Network configurations with correct endpoints and chain IDs
export const NETWORKS: Record<NetworkType, NetworkConfig> = {
  testnet: {
    name: 'Testnet',
    chainId: '71ee83bcf52142d61019d95f9cc5427ba6a0d7ff8accd9e2088ae2abeaf3d3dd',
    endpoints: ['https://testnet-api.chaininfra.net'],
    appName: 'XPR Delegation Demo',
    webauth: 'testnet.webauth.com',
    color: '#27ae60',
  },
  mainnet: {
    name: 'Mainnet',
    chainId: '384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0',
    endpoints: ['https://api.protonnz.com'],
    appName: 'XPR Delegation Demo',
    webauth: 'webauth.com',
    color: '#f39c12',
  },
};

// Sample Block Producers data
export const SAMPLE_BLOCK_PRODUCERS: Record<NetworkType, BlockProducer[]> = {
  testnet: [
    { name: 'proton', url: 'https://protonchain.com' },
    { name: 'protondev', url: 'https://protondev.com' },
    { name: 'protonbp', url: 'https://protonbp.com' },
    { name: 'protonvote', url: 'https://protonvote.com' },
    { name: 'protonnode', url: 'https://protonnode.com' },
  ],
  mainnet: [
    { name: 'proton', url: 'https://protonchain.com' },
    { name: 'protondev', url: 'https://protondev.com' },
    { name: 'protonbp', url: 'https://protonbp.com' },
    { name: 'protonvote', url: 'https://protonvote.com' },
    { name: 'protonnode', url: 'https://protonnode.com' },
    { name: 'protonchain', url: 'https://protonchain.io' },
    { name: 'protonwallet', url: 'https://protonwallet.io' },
    { name: 'protondex', url: 'https://protondex.com' },
  ],
};

/**
 * Get network configuration by name
 * @param network - Network name (testnet/mainnet)
 * @returns Network configuration object
 * @throws Error if network is not supported
 */
export const getNetworkConfig = (
  network: NetworkType = 'testnet'
): NetworkConfig => {
  const config = NETWORKS[network];
  if (!config) {
    throw new Error(`Unsupported network: ${network}`);
  }
  return config;
};

/**
 * Validate network name against available networks
 * @param network - Network name to validate
 * @returns True if valid network name
 */
export const isValidNetwork = (network: string): network is NetworkType => {
  return Object.keys(NETWORKS).includes(network);
};

/**
 * Get all available network names
 * @returns Array of available network names
 */
export const getAvailableNetworks = (): NetworkType[] => {
  return Object.keys(NETWORKS) as NetworkType[];
};
