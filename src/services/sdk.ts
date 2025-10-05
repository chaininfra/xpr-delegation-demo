/**
 * Proton Web SDK Initialization Service
 *
 * Centralized SDK initialization and configuration management.
 * Provides singleton instance for consistent SDK usage across the application.
 *
 * Features:
 * - SDK instance management
 * - Network-specific configuration
 * - Error handling and validation
 * - Singleton pattern implementation
 *
 * @fileoverview SDK service for XPR Delegation Demo
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import ProtonSDK from '@proton/web-sdk';
import { getNetworkConfig } from '../config/networks';
import type { NetworkType } from '../types';

let protonSDKInstance: any = null;

/**
 * Initialize Proton SDK
 * @param network - Network name (testnet/mainnet)
 * @returns ProtonSDK instance
 */
export const initializeSDK = (network: NetworkType = 'testnet') => {
  if (!protonSDKInstance) {
    const config = getNetworkConfig(network);
    protonSDKInstance = ProtonSDK({
      linkOptions: {
        endpoints: config.endpoints,
        chainId: config.chainId,
      },
      transportOptions: {
        requestAccount: config.appName,
      },
      selectorOptions: {
        appName: config.appName,
        customStyleOptions: {
          modalBackgroundColor: '#F4F7F9',
          optionBackgroundColor: '#667eea',
        },
      },
    });
  }
  return protonSDKInstance;
};

/**
 * Get the initialized Proton SDK instance
 * @returns ProtonSDK instance
 */
export const getSDKInstance = () => {
  if (!protonSDKInstance) {
    throw new Error('Proton SDK not initialized. Call initializeSDK first.');
  }
  return protonSDKInstance;
};

export default {
  initializeSDK,
  getSDKInstance,
};
