/**
 * Intelligent Refresh Triggers - Smart API Call Management
 *
 * Implements intelligent triggers for when to refresh cached data
 * based on user actions, data staleness, and business logic.
 *
 * Features:
 * - Action-based cache invalidation
 * - Smart refresh timing
 * - User behavior analysis
 * - Network-aware refresh strategies
 *
 * @fileoverview Intelligent refresh trigger system
 */

/* eslint-disable @typescript-eslint/no-explicit-any, no-console, no-undef */

import { smartCache, CacheKeys } from './SmartCache';

export interface RefreshTrigger {
  action: string;
  dependencies: string[];
  immediate: boolean;
  delay?: number;
}

export class RefreshManager {
  private triggers = new Map<string, RefreshTrigger[]>();
  private refreshTimeouts = new Map<
    string,
    { timeout: NodeJS.Timeout; action: string }
  >();

  constructor() {
    this.setupDefaultTriggers();
  }

  /**
   * Setup default refresh triggers for common actions
   */
  private setupDefaultTriggers(): void {
    // Wallet connection triggers
    this.addTrigger('wallet_connect', {
      action: 'refresh_account_data',
      dependencies: ['account', 'voteInfo', 'votingResources'],
      immediate: false,
      delay: 1000, // 1 second delay to avoid race conditions
    });

    // Vote delegation triggers
    this.addTrigger('vote_delegated', {
      action: 'refresh_vote_data',
      dependencies: ['voteInfo', 'votingResources'],
      immediate: true,
    });

    // Resource staking triggers
    this.addTrigger('resources_staked', {
      action: 'refresh_account_data',
      dependencies: ['account', 'votingResources'],
      immediate: true,
    });

    // Token transfer triggers
    this.addTrigger('tokens_transferred', {
      action: 'refresh_token_data',
      dependencies: ['account', 'tokenBalances'],
      immediate: true,
    });

    // Network change triggers
    this.addTrigger('network_changed', {
      action: 'refresh_all_data',
      dependencies: [
        'account',
        'voteInfo',
        'votingResources',
        'blockProducers',
        'tokenBalances',
      ],
      immediate: false,
      delay: 500, // Small delay for network switch
    });

    // Account switch triggers
    this.addTrigger('account_switched', {
      action: 'refresh_account_data',
      dependencies: ['account', 'voteInfo', 'votingResources', 'tokenBalances'],
      immediate: true,
    });
  }

  /**
   * Add a new refresh trigger
   */
  addTrigger(event: string, trigger: RefreshTrigger): void {
    if (!this.triggers.has(event)) {
      this.triggers.set(event, []);
    }
    this.triggers.get(event)!.push(trigger);
  }

  /**
   * Trigger refresh based on user action
   */
  async triggerRefresh(event: string, context: any = {}): Promise<void> {
    const eventTriggers = this.triggers.get(event);
    if (!eventTriggers) {
      console.log(`[RefreshManager] No triggers found for event: ${event}`);
      return;
    }

    console.log(`[RefreshManager] Triggering refresh for event: ${event}`);

    for (const trigger of eventTriggers) {
      if (trigger.immediate) {
        await this.executeRefresh(trigger, context);
      } else {
        this.scheduleRefresh(trigger, context);
      }
    }
  }

  /**
   * Execute immediate refresh
   */
  private async executeRefresh(
    trigger: RefreshTrigger,
    context: any
  ): Promise<void> {
    console.log(
      `[RefreshManager] Executing immediate refresh: ${trigger.action}`
    );

    try {
      switch (trigger.action) {
        case 'refresh_account_data':
          await this.refreshAccountData(context);
          break;
        case 'refresh_vote_data':
          await this.refreshVoteData(context);
          break;
        case 'refresh_token_data':
          await this.refreshTokenData(context);
          break;
        case 'refresh_all_data':
          await this.refreshAllData(context);
          break;
        default:
          console.warn(
            `[RefreshManager] Unknown refresh action: ${trigger.action}`
          );
      }
    } catch (error) {
      console.error(`[RefreshManager] Error executing refresh:`, error);
    }
  }

  /**
   * Schedule delayed refresh
   */
  private scheduleRefresh(trigger: RefreshTrigger, context: any): void {
    const timeoutKey = `${trigger.action}-${Date.now()}`;

    // Clear existing timeout for this action
    const existingTimeoutEntry = Array.from(this.refreshTimeouts.values()).find(
      entry => entry.action === trigger.action
    );
    if (existingTimeoutEntry) {
      clearTimeout(existingTimeoutEntry.timeout);
    }

    const timeout = setTimeout(async () => {
      await this.executeRefresh(trigger, context);
      this.refreshTimeouts.delete(timeoutKey);
    }, trigger.delay || 0);

    // Store timeout with metadata
    this.refreshTimeouts.set(timeoutKey, { timeout, action: trigger.action });

    console.log(
      `[RefreshManager] Scheduled refresh: ${trigger.action} in ${trigger.delay}ms`
    );
  }

  /**
   * Refresh account-related data
   */
  private async refreshAccountData(context: any): Promise<void> {
    const { accountName, network } = context;
    if (!accountName || !network) return;

    console.log(`[RefreshManager] Refreshing account data for ${accountName}`);

    // Invalidate account-related caches
    smartCache.invalidateByDependency('account');

    // Clear specific caches
    smartCache.invalidate(CacheKeys.account(accountName, network));
    smartCache.invalidate(CacheKeys.votingResources(accountName, network));
  }

  /**
   * Refresh vote-related data
   */
  private async refreshVoteData(context: any): Promise<void> {
    const { accountName, network } = context;
    if (!accountName || !network) return;

    console.log(`[RefreshManager] Refreshing vote data for ${accountName}`);

    // Invalidate vote-related caches
    smartCache.invalidate(CacheKeys.voteInfo(accountName, network));
    smartCache.invalidate(CacheKeys.votingResources(accountName, network));
  }

  /**
   * Refresh token-related data
   */
  private async refreshTokenData(context: any): Promise<void> {
    const { accountName, network } = context;
    if (!accountName || !network) return;

    console.log(`[RefreshManager] Refreshing token data for ${accountName}`);

    // Invalidate token-related caches
    smartCache.invalidate(CacheKeys.tokenBalances(accountName, network));
    smartCache.invalidate(CacheKeys.account(accountName, network));
  }

  /**
   * Refresh all data (network change)
   */
  private async refreshAllData(context: any): Promise<void> {
    const { network } = context;
    if (!network) return;

    console.log(`[RefreshManager] Refreshing all data for network ${network}`);

    // Clear all caches for fresh start
    smartCache.clear();
  }

  /**
   * Check if data needs refresh based on staleness
   */
  shouldRefreshData(key: string): boolean {
    return smartCache.isStale(key) || smartCache.isExpired(key);
  }

  /**
   * Get refresh recommendations based on cache state
   */
  getRefreshRecommendations(): string[] {
    const recommendations: string[] = [];
    const stats = smartCache.getStats();

    if (stats.staleEntries > 0) {
      recommendations.push(
        `${stats.staleEntries} entries are stale and should be refreshed`
      );
    }

    if (stats.expiredEntries > 0) {
      recommendations.push(
        `${stats.expiredEntries} entries are expired and must be refreshed`
      );
    }

    if (stats.averageAge > 5 * 60 * 1000) {
      // 5 minutes
      recommendations.push(
        'Average cache age is high, consider refreshing frequently accessed data'
      );
    }

    return recommendations;
  }

  /**
   * Cleanup timeouts
   */
  cleanup(): void {
    for (const entry of this.refreshTimeouts.values()) {
      clearTimeout(entry.timeout);
    }
    this.refreshTimeouts.clear();
  }
}

// Global refresh manager instance
export const refreshManager = new RefreshManager();

/**
 * Convenience functions for common refresh triggers
 */
export const RefreshTriggers = {
  /**
   * Trigger refresh after wallet connection
   */
  onWalletConnect: (accountName: string, network: string) => {
    refreshManager.triggerRefresh('wallet_connect', { accountName, network });
  },

  /**
   * Trigger refresh after vote delegation
   */
  onVoteDelegated: (accountName: string, network: string) => {
    refreshManager.triggerRefresh('vote_delegated', { accountName, network });
  },

  /**
   * Trigger refresh after resource staking
   */
  onResourcesStaked: (accountName: string, network: string) => {
    refreshManager.triggerRefresh('resources_staked', { accountName, network });
  },

  /**
   * Trigger refresh after token transfer
   */
  onTokensTransferred: (accountName: string, network: string) => {
    refreshManager.triggerRefresh('tokens_transferred', {
      accountName,
      network,
    });
  },

  /**
   * Trigger refresh after network change
   */
  onNetworkChanged: (network: string) => {
    refreshManager.triggerRefresh('network_changed', { network });
  },

  /**
   * Trigger refresh after account switch
   */
  onAccountSwitched: (accountName: string, network: string) => {
    refreshManager.triggerRefresh('account_switched', { accountName, network });
  },
} as const;
