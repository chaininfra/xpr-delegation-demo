/* eslint-disable @typescript-eslint/no-explicit-any, no-console */
/**
 * Token Service - Advanced Token Management
 *
 * Provides comprehensive token operations for XPR network including:
 * - Balance discovery across multiple token contracts
 * - Transfer transactions với validation
 * - Advanced caching với memory management
 * - RPC client management và optimization
 * - Request deduplication để prevent duplicate API calls
 *
 * @fileoverview Professional token management service for XPR delegation demo
 */

import type { TokenBalance, TransferData, NetworkType } from '../types';
import type {
  SessionData as EnhancedSessionData,
  RpcClient as EnhancedRpcClient,
  TransactionResult,
} from '../types/enhanced';
import { validateAccountName } from '../utils/security';
import { MemoryManager } from '../utils/MemoryManager';
import { NETWORKS as networks } from '../config/networks';

/**
 * Token Service Class with Advanced Memory Management
 * Provides blockchain token operations for XPR network with optimized caching
 */
export class TokenService {
  private memoryManager = new MemoryManager({
    maxMemorySize: 25 * 1024 * 1024, // 25MB for token cache
    maxEntries: 500,
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    gcInterval: 2 * 60 * 1000, // 2 minutes
    strategy: 'lru' as any, // LRU strategy
  });

  private rpcCache = new Map<string, any>(); // Cache RPC clients for reuse
  private loadingRequests = new Map<string, Promise<TokenBalance[]>>(); // Prevent duplicate simultaneous calls
  private readonly maxRpcCacheSize = 50; // Limit RPC cache size
  private readonly maxLoadingRequestsSize = 20; // Limit loading requests cache size

  /**
   * Cleanup RPC cache to prevent memory leaks
   */
  private cleanupRpcCache(): void {
    if (this.rpcCache.size > this.maxRpcCacheSize) {
      // Remove oldest entries (LRU behavior)
      const keysToRemove = Array.from(this.rpcCache.keys()).slice(
        0,
        this.rpcCache.size - this.maxRpcCacheSize
      );
      keysToRemove.forEach(key => {
        this.rpcCache.delete(key);
      });
      console.log(
        `[TokenService] Cleaned up ${keysToRemove.length} RPC cache entries`
      );
    }
  }

  /**
   * Cleanup loading requests cache to prevent memory leaks
   */
  private cleanupLoadingRequests(): void {
    if (this.loadingRequests.size > this.maxLoadingRequestsSize) {
      // Remove oldest entries
      const keysToRemove = Array.from(this.loadingRequests.keys()).slice(
        0,
        this.loadingRequests.size - this.maxLoadingRequestsSize
      );
      keysToRemove.forEach(key => {
        this.loadingRequests.delete(key);
      });
      console.log(
        `[TokenService] Cleaned up ${keysToRemove.length} loading request entries`
      );
    }
  }

  /**
   * Get cached tokens for account with memory management
   */
  private getCachedTokens(account: string): TokenBalance[] | null {
    return this.memoryManager.get(account) || null;
  }

  /**
   * Cache tokens with memory management optimization
   */
  private setCachedTokens(account: string, tokens: TokenBalance[]): void {
    const memoryStatus = this.memoryManager.getHealthStatus();
    if (memoryStatus.status === 'critical') {
      console.warn(
        `[TokenService] Memory status: ${memoryStatus.status}`,
        memoryStatus
      );
    }

    // High priority cache for token balances
    this.memoryManager.set(account, tokens);
  }

  /**
   * Clear cache for specific account
   */
  clearCache(account: string): void {
    this.memoryManager.remove(account);
    console.log(`[TokenService] Cache cleared for account: ${account}`);
  }

  /**
   * Clear all cached data
   */
  clearAllCache(): void {
    this.memoryManager.clear();
    console.log('[TokenService] All cache cleared');
  }

  /**
   * Get core token symbol from XPR network
   */
  async getCoreSymbol(_network: NetworkType = 'testnet'): Promise<string> {
    try {
      const config = networks[_network];
      const response = await fetch(
        `${config.endpoints[0]}/v1/chain/get_table_rows`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: 'eosio.token',
            table: 'stat',
            scope: 'XPR',
            limit: 1,
            json: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const result = await response.json();
      if (result.rows && result.rows.length > 0) {
        return result.rows[0].symbol || 'XPR';
      }

      return 'XPR'; // Default fallback
    } catch {
      return 'XPR'; // Safe fallback
    }
  }

  /**
   * Parse token balance information from blockchain response
   */
  private parseTokenBalance(
    row: any,
    _contract: string = 'eosio.token'
  ): TokenBalance {
    const balance = row.balance || '0.0000 XPR';
    const [amount, symbol] = balance.split(' ');
    const precision = symbol === 'XPR' ? 4 : 2; // Standard XPR precision

    return {
      contract: _contract,
      symbol,
      precision,
      amount,
      formatted: balance,
    };
  }

  /**
   * Fetch TOTAL token balances for account with deduplication
   * Returns total wallet balances (liquid + staked) for accurate display
   * Used specifically for transfer page to show complete wallet balance
   */
  async getTokenBalances(
    account: string,
    _network: NetworkType = 'testnet',
    session?: EnhancedSessionData
  ): Promise<TokenBalance[]> {
    try {
      // Input validation
      if (!validateAccountName(account)) {
        throw new Error(`Invalid account name: ${account}`);
      }

      // Check cache first
      const cached = this.getCachedTokens(account);
      if (cached) {
        return cached;
      }

      // Check if request is already in progress
      const requestKey = `${account}-${_network}`;
      const existingRequest = this.loadingRequests.get(requestKey);
      if (existingRequest) {
        console.log(`[TokenService] Reusing existing request for ${account}`);
        return existingRequest;
      }

      // Create and cache the async request
      const requestPromise = this.fetchTokenBalancesInternal(
        account,
        _network,
        session
      );
      this.loadingRequests.set(requestKey, requestPromise);

      // Cleanup loading requests cache if too large
      this.cleanupLoadingRequests();

      // Clean up when done
      requestPromise.finally(() => {
        this.loadingRequests.delete(requestKey);
      });

      return requestPromise;
    } catch (error) {
      console.error(
        `[TokenService] Error fetching token balances for ${account}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Internal token balance fetching logic
   * Gets TOTAL wallet balances (liquid + staked) for accurate display
   */
  private async fetchTokenBalancesInternal(
    account: string,
    _network: NetworkType = 'testnet',
    session?: EnhancedSessionData
  ): Promise<TokenBalance[]> {
    const tokens: TokenBalance[] = [];

    // Try to get cached RPC first, then session RPC
    let rpc: EnhancedRpcClient | undefined =
      this.getCachedRpc(session) || session?.rpc;

    if (!rpc) {
      // No session RPC - create a simple RPC client for token queries
      const config = networks[_network];
      rpc = {
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
      console.log(`[TokenService] Created simple RPC client for ${account}`);
    }

    // Cache the RPC client for reuse
    if (session) {
      this.setCachedRpc(session, rpc);
    }

    // Fetch liquid balances from eosio.token accounts table
    const tokenContracts = [
      'eosio.token', // Core XPR tokens - liquid balance
    ];

    // Get staked balance from voters table
    let stakedBalance = 0;
    try {
      const voterInfo = await rpc.get_table_rows({
        code: 'eosio',
        scope: 'eosio',
        table: 'voters',
        lower_bound: account,
        upper_bound: account,
        limit: 1,
        json: true,
      });

      if (voterInfo.rows && voterInfo.rows.length > 0) {
        stakedBalance = parseFloat(voterInfo.rows[0].staked || '0');
        console.log(`[TokenService] Staked balance: ${stakedBalance} XPR`);
      }
    } catch (error: any) {
      console.debug(
        `[TokenService] Could not get staked balance: ${error?.message || 'Unknown error'}`
      );
    }

    // Process contracts sequentially with error handling and rate limiting
    for (const contract of tokenContracts) {
      try {
        // Add small delay between requests to avoid rate limiting
        if (contract !== 'eosio.token') {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const result = await rpc.get_table_rows({
          code: contract,
          table: 'accounts',
          scope: account,
          limit: 50,
          json: true,
        });

        if (result.rows && Array.isArray(result.rows)) {
          for (const row of result.rows) {
            if (row.balance && row.balance !== '0') {
              const liquidBalance = this.parseTokenBalance(row, contract);
              console.log(
                `[TokenService] Liquid balance from ${contract} accounts table:`,
                liquidBalance.formatted
              );

              // Calculate total balance (liquid + staked)
              const liquidAmount = parseFloat(liquidBalance.amount);
              const totalAmount = liquidAmount + stakedBalance / 10000;
              const totalFormatted = `${totalAmount.toFixed(4)} ${liquidBalance.symbol}`;

              console.log(
                `[TokenService] Total balance (liquid + staked): ${totalFormatted}`
              );

              // Create token balance with total amount
              const totalTokenBalance: TokenBalance = {
                contract: liquidBalance.contract,
                symbol: liquidBalance.symbol,
                precision: liquidBalance.precision,
                amount: totalAmount.toString(),
                formatted: totalFormatted,
              };

              tokens.push(totalTokenBalance);
            }
          }
        }
      } catch (error: any) {
        // Skip contracts that don't exist or have errors
        console.debug(
          `[TokenService] Skipping contract ${contract}: ${error?.message || 'Unknown error'}`
        );

        // Log detailed error for debugging
        if (
          error?.message?.includes('400') ||
          error?.message?.includes('500')
        ) {
          console.warn(`[TokenService] API error for contract ${contract}:`, {
            contract,
            account,
            error: error.message,
            requestParams: {
              code: contract,
              table: 'accounts',
              scope: account,
              limit: 50,
              json: true,
            },
          });
        }

        continue;
      }
    }

    // Cache results
    this.setCachedTokens(account, tokens);

    return tokens;
  }

  /**
   * Execute token transfer
   */
  async transferTokens(
    transferData: TransferData,
    session: EnhancedSessionData,
    _network: NetworkType = 'testnet'
  ): Promise<TransactionResult> {
    try {
      // Validate transfer data inline
      if (!validateAccountName(transferData.from)) {
        throw new Error(`Invalid from account: ${transferData.from}`);
      }
      if (!validateAccountName(transferData.to)) {
        throw new Error(`Invalid to account: ${transferData.to}`);
      }
      if (
        !transferData.quantity ||
        !transferData.quantity.match(/^\d+\.\d{4} [A-Z]+$/)
      ) {
        throw new Error(`Invalid quantity format: ${transferData.quantity}`);
      }

      // Ensure we have a valid session
      if (!session || !session.transact) {
        throw new Error('No valid session available for transaction');
      }

      // Create transfer action
      const action = {
        account: transferData.contract || 'eosio.token',
        name: 'transfer',
        authorization: [
          {
            actor: transferData.from,
            permission: transferData.permission || 'owner',
          },
        ],
        data: {
          from: transferData.from,
          to: transferData.to,
          quantity: transferData.quantity,
          memo: transferData.memo || '',
        },
      };

      console.log(`[TokenService] Executing transfer:`, {
        from: transferData.from,
        to: transferData.to,
        quantity: transferData.quantity,
        contract: action.account,
      });

      // Execute transaction
      const result = await session.transact(
        {
          actions: [action],
        },
        {
          blocksBehind: 3,
          expireSeconds: 30,
        }
      );

      console.log(
        `[TokenService] Transfer successful:`,
        result.transaction_id || result.id || 'No transaction ID'
      );

      return result;
    } catch (error) {
      console.error(`[TokenService] Transfer failed:`, error);
      throw error;
    }
  }

  /**
   * Utility function to format token amounts
   */
  formatTokenAmount(
    amount: number,
    symbol: string,
    precision: number = 4
  ): string {
    const formattedAmount = amount.toFixed(precision);
    return `${formattedAmount} ${symbol}`;
  }

  /**
   * Utility function to parse token amounts
   */
  parseTokenAmount(balance: string): {
    precision: number;
    amount: number;
    formatted: string;
  } {
    const [amountStr, symbol] = balance.split(' ');
    const amount = parseFloat(amountStr || '0');
    const precision = symbol === 'XPR' ? 4 : 2;

    return {
      precision,
      amount,
      formatted: balance,
    };
  }

  /**
   * RPC Cache Management
   */
  private getCachedRpc(
    session?: EnhancedSessionData
  ): EnhancedRpcClient | null {
    if (!session?.auth?.actor) return null;
    const sessionKey = this.getSessionKey(session);
    return this.rpcCache.get(sessionKey) || null;
  }

  setCachedRpc(session: EnhancedSessionData, rpc: EnhancedRpcClient): void {
    if (!session?.auth?.actor) return;
    const sessionKey = this.getSessionKey(session);
    this.rpcCache.set(sessionKey, rpc);

    // Cleanup if cache is too large
    this.cleanupRpcCache();
  }

  clearCachedRpc(session?: EnhancedSessionData): void {
    if (!session?.auth?.actor) return;
    const sessionKey = this.getSessionKey(session);
    this.rpcCache.delete(sessionKey);
  }

  private getSessionKey(session: any): string {
    return `session-${session.auth?.actor || 'unknown'}`;
  }

  /**
   * Memory management methods
   */
  getMemoryHealth(): any {
    return this.memoryManager.getHealthStatus();
  }

  getMemoryStats(): any {
    return this.memoryManager.getStats();
  }

  performGC(): void {
    this.memoryManager.performGC();
  }

  destroy(): void {
    this.memoryManager.destroy();
    this.loadingRequests.clear();
    this.rpcCache.clear();
  }
}

// Export default token service instance
export const tokenService = new TokenService();

// Export service instance and individual methods
export const clearTransferCache = (account: string): void => {
  tokenService.clearCache(account);
};

export const {
  getTokenBalances,
  transferTokens,
  getCoreSymbol,
  formatTokenAmount,
  parseTokenAmount,
  getMemoryHealth,
  getMemoryStats,
  performGC,
  destroy,
} = tokenService;
