/**
 * XPR Network Wallet Service
 *
 * Service layer for managing wallet connections and sessions.
 * Handles WebAuth and Anchor wallet integration with session management.
 *
 * Features:
 * - Wallet connection and disconnection
 * - Session restoration and management
 * - Account information retrieval
 * - Network-specific configuration
 * - Error handling and timeout protection
 *
 * @fileoverview Wallet service for XPR Delegation Demo
 */
/* eslint-disable @typescript-eslint/no-explicit-any, no-console */
import ProtonSDK from '@proton/web-sdk';
import { getNetworkConfig } from '../config/networks';
import {
  getAccountInfo,
  getVoteInfo,
  checkVotingResources,
} from './blockchain';
import { tokenService } from './token';
import { smartCache, CacheKeys } from '../utils/SmartCache';
import type { NetworkType, Wallet, AccountInfo } from '../types';

/**
 * Connect wallet using ProtonSDK default export
 * @param network - Network name (testnet/mainnet)
 * @returns Wallet instance with session and account info
 * @throws {Error} If wallet connection fails or times out
 */
export const connectWallet = async (
  network: NetworkType = 'testnet',
  maxRetries: number = 3
): Promise<Wallet> => {
  const config = getNetworkConfig(network);
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `[Wallet] Attempt ${attempt}/${maxRetries} to connect wallet...`
      );

      console.log(`[Wallet] Configuration:`, {
        endpoints: config.endpoints,
        chainId: config.chainId,
        appName: config.appName,
      });

      // Enhanced timeout with user-friendly error messages
      const result = await Promise.race([
        ProtonSDK({
          linkOptions: {
            endpoints: config.endpoints,
            chainId: config.chainId,
            // Disable restoreSession to avoid conflicts
            restoreSession: false,
            // transport removed due to LinkTransport incompatibility
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
        }),
      ]);

      const { link, session } = result as any;

      if (!session) {
        throw new Error(
          'Wallet connection cancelled or failed to establish session.'
        );
      }

      // Ensure session has RPC client - create if missing
      if (!(session as any).rpc) {
        console.log('[Wallet] Creating RPC client for session');
        const config = getNetworkConfig(network);
        const endpoint = config.endpoints[0]; // Use first endpoint

        // Create simple RPC client
        (session as any).rpc = {
          get_table_rows: async (params: any) => {
            const response = await fetch(
              `${endpoint}/v1/chain/get_table_rows`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params),
              }
            );
            if (!response.ok) {
              throw new Error(
                `RPC call failed: ${response.status} ${response.statusText}`
              );
            }
            return response.json();
          },
          get_account: async (accountName: string) => {
            const response = await fetch(`${endpoint}/v1/chain/get_account`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ account_name: accountName }),
            });
            if (!response.ok) {
              throw new Error(
                `RPC call failed: ${response.status} ${response.statusText}`
              );
            }
            return response.json();
          },
          get_producers: async (options: any = {}) => {
            const response = await fetch(`${endpoint}/v1/chain/get_producers`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ limit: 30, json: true, ...options }),
            });
            if (!response.ok) {
              throw new Error(
                `RPC call failed: ${response.status} ${response.statusText}`
              );
            }
            return response.json();
          },
        };

        console.log('[Wallet] RPC client created and attached to session');
      }

      // Cache the RPC client for reuse
      tokenService.setCachedRpc(session as any, (session as any).rpc);

      // Get comprehensive account information using smart caching
      // Only makes API calls if data is stale or missing
      const accountName = session.auth.actor;

      // Check if we already have fresh data for this account
      const accountCacheKey = CacheKeys.account(accountName, network);
      const voteCacheKey = CacheKeys.voteInfo(accountName, network);
      const resourcesCacheKey = CacheKeys.votingResources(accountName, network);

      let detailedAccount: AccountInfo;
      let voteInfo: any;
      let votingResources: any;

      // Use cached data if available and fresh, otherwise fetch
      if (
        smartCache.get(accountCacheKey) &&
        !smartCache.isStale(accountCacheKey)
      ) {
        console.log(`[Wallet] Using cached account data for ${accountName}`);
        detailedAccount = smartCache.get(accountCacheKey)!;
      } else {
        detailedAccount = await getAccountInfo(accountName, network, session);
      }

      if (smartCache.get(voteCacheKey) && !smartCache.isStale(voteCacheKey)) {
        console.log(`[Wallet] Using cached vote info for ${accountName}`);
        voteInfo = smartCache.get(voteCacheKey);
      } else {
        voteInfo = await getVoteInfo(accountName, network, session);
      }

      if (
        smartCache.get(resourcesCacheKey) &&
        !smartCache.isStale(resourcesCacheKey)
      ) {
        console.log(
          `[Wallet] Using cached voting resources for ${accountName}`
        );
        votingResources = smartCache.get(resourcesCacheKey);
      } else {
        votingResources = await checkVotingResources(accountName, network);
      }

      const fullAccountInfo: AccountInfo = {
        ...detailedAccount,
        vote_info: voteInfo || undefined,
        voting_resources: votingResources,
      };

      // Debug session object
      console.log(`[Wallet] Session object debug:`, {
        hasSession: !!session,
        hasRpc: !!session?.rpc,
        sessionKeys: session ? Object.keys(session) : [],
        authActor: session?.auth?.actor,
        sessionType: session ? typeof session : 'none',
      });

      // Log full session object to understand structure
      console.log(`[Wallet] Full session object:`, session);

      // Cache RPC client for reuse in transfer page
      if (session?.rpc) {
        tokenService.setCachedRpc(session, session.rpc);
        console.log(
          `[Wallet] RPC client cached for session: ${session.auth?.actor}`
        );
      } else {
        console.warn(
          `[Wallet] No RPC client found in session for actor: ${session?.auth?.actor}`
        );

        // Create a simple RPC client for this session
        const simpleRpc = {
          get_table_rows: async (params: any) => {
            const response = await fetch(
              `${config.endpoints[0]}/v1/chain/get_table_rows`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(params),
              }
            );

            if (!response.ok) {
              throw new Error(
                `RPC call failed: ${response.status} ${response.statusText}`
              );
            }

            return response.json();
          },
          get_account: async (accountName: string) => {
            const response = await fetch(
              `${config.endpoints[0]}/v1/chain/get_account`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ account_name: accountName }),
              }
            );
            if (!response.ok) {
              throw new Error(
                `RPC call failed: ${response.status} ${response.statusText}`
              );
            }
            return response.json();
          },
          get_producers: async (options: any = {}) => {
            const response = await fetch(
              `${config.endpoints[0]}/v1/chain/get_producers`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ limit: 30, json: true, ...options }),
              }
            );
            if (!response.ok) {
              throw new Error(
                `RPC call failed: ${response.status} ${response.statusText}`
              );
            }
            return response.json();
          },
          get_currency_balance: async (
            contract: string,
            account: string,
            symbol?: string | null
          ) => {
            const response = await fetch(
              `${config.endpoints[0]}/v1/chain/get_currency_balance`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: contract, account, symbol }),
              }
            );
            if (!response.ok) {
              throw new Error(
                `RPC call failed: ${response.status} ${response.statusText}`
              );
            }
            return response.json();
          },
        };

        // Cache the simple RPC client
        tokenService.setCachedRpc(session, simpleRpc);
        console.log(
          `[Wallet] Simple RPC client created and cached for session: ${session.auth?.actor}`
        );
      }

      return {
        link,
        session,
        account: fullAccountInfo,
      };
    } catch (error: any) {
      lastError = error;
      console.warn(
        `[Wallet] Attempt ${attempt}/${maxRetries} failed:`,
        error.message
      );
      console.error(`[Wallet] Full error details:`, error);
      console.error(`[Wallet] Error stack:`, error.stack);

      // Don't retry for user cancellation
      if (
        error.message.includes('cancelled') ||
        error.message.includes('Cancel')
      ) {
        throw error;
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const waitTime = Math.min(1000 * attempt, 5000); // Max 5 seconds
        console.log(`[Wallet] Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  console.error('[Wallet] All connection attempts failed');
  throw (
    lastError || new Error('Failed to connect wallet after multiple attempts')
  );
};

/**
 * Check if there's an existing session and restore it with full account info
 * @param network - Network name (testnet/mainnet)
 * @returns Existing session with full account info or null
 * @throws {Error} If session restoration fails
 */
export const checkExistingSession = async (
  network: NetworkType = 'testnet'
): Promise<Wallet | null> => {
  const config = getNetworkConfig(network);

  try {
    const { link, session } = await ProtonSDK({
      linkOptions: {
        endpoints: config.endpoints,
        chainId: config.chainId,
        restoreSession: true, // Enable session restoration
      },
      transportOptions: {
        requestAccount: config.appName,
      },
      selectorOptions: {
        appName: config.appName,
      },
    });

    if (session && session.auth) {
      // Ensure session has RPC client - create if missing
      if (!(session as any).rpc) {
        console.log('[Wallet] Creating RPC client for existing session');
        const endpoint = config.endpoints[0]; // Use first endpoint

        // Create simple RPC client
        (session as any).rpc = {
          get_table_rows: async (params: any) => {
            const response = await fetch(
              `${endpoint}/v1/chain/get_table_rows`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params),
              }
            );
            if (!response.ok) {
              throw new Error(
                `RPC call failed: ${response.status} ${response.statusText}`
              );
            }
            return response.json();
          },
          get_account: async (accountName: string) => {
            const response = await fetch(`${endpoint}/v1/chain/get_account`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ account_name: accountName }),
            });
            if (!response.ok) {
              throw new Error(
                `RPC call failed: ${response.status} ${response.statusText}`
              );
            }
            return response.json();
          },
          get_producers: async (options: any = {}) => {
            const response = await fetch(`${endpoint}/v1/chain/get_producers`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ limit: 30, json: true, ...options }),
            });
            if (!response.ok) {
              throw new Error(
                `RPC call failed: ${response.status} ${response.statusText}`
              );
            }
            return response.json();
          },
        };

        console.log('[Wallet] RPC client created for existing session');
      }

      // Cache the RPC client for reuse
      tokenService.setCachedRpc(session as any, (session as any).rpc);

      // Get comprehensive account information using smart caching
      const accountName = session.auth.actor as unknown as string;

      // Check cache first to avoid unnecessary API calls
      const accountCacheKey = CacheKeys.account(accountName, network);
      const voteCacheKey = CacheKeys.voteInfo(accountName, network);
      const resourcesCacheKey = CacheKeys.votingResources(accountName, network);

      let detailedAccount: AccountInfo;
      let voteInfo: any;
      let votingResources: any;

      // Use cached data if available and fresh
      if (
        smartCache.get(accountCacheKey) &&
        !smartCache.isStale(accountCacheKey)
      ) {
        console.log(
          `[Wallet] Using cached account data for existing session ${accountName}`
        );
        detailedAccount = smartCache.get(accountCacheKey)!;
      } else {
        detailedAccount = await getAccountInfo(accountName, network, session);
      }

      if (smartCache.get(voteCacheKey) && !smartCache.isStale(voteCacheKey)) {
        console.log(
          `[Wallet] Using cached vote info for existing session ${accountName}`
        );
        voteInfo = smartCache.get(voteCacheKey);
      } else {
        voteInfo = await getVoteInfo(accountName, network, session);
      }

      if (
        smartCache.get(resourcesCacheKey) &&
        !smartCache.isStale(resourcesCacheKey)
      ) {
        console.log(
          `[Wallet] Using cached voting resources for existing session ${accountName}`
        );
        votingResources = smartCache.get(resourcesCacheKey);
      } else {
        votingResources = await checkVotingResources(accountName, network);
      }

      const fullAccountInfo: AccountInfo = {
        ...detailedAccount,
        vote_info: voteInfo || undefined,
        voting_resources: votingResources,
      };

      return {
        link: link as any,
        session: session as any,
        account: fullAccountInfo,
      };
    }
    return null;
  } catch (error: any) {
    console.error('Error checking existing session:', error);
    return null;
  }
};

/**
 * Disconnect wallet and clear session data
 * @returns Promise<void>
 * @throws {Error} If disconnection fails
 */
export const disconnectWallet = async (
  network: NetworkType = 'testnet'
): Promise<void> => {
  try {
    const config = getNetworkConfig(network);

    // Clear Proton-related keys from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('proton-')) {
        localStorage.removeItem(key);
      }
    });
    // Note: ProtonSDK's disconnect method might also handle this,
    // but explicit clearing ensures a clean slate.

    // If there's an active session, attempt to remove it via SDK
    const { session } = await ProtonSDK({
      linkOptions: {
        restoreSession: true, // Attempt to restore to get the active session
        endpoints: config.endpoints,
        chainId: config.chainId,
      },
    } as any);
    if (session) {
      // Clear cached RPC for this session
      tokenService.clearCachedRpc(session as any);
      await session.remove();
      console.log(
        `[Wallet] Session disconnected and RPC cache cleared: ${session.auth?.actor}`
      );
    }
  } catch (error: any) {
    console.error('Error disconnecting wallet:', error);
    throw new Error(`Failed to disconnect wallet: ${error.message}`);
  }
};

export default {
  connectWallet,
  checkExistingSession,
  disconnectWallet,
};
