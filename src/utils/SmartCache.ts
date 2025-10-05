/**
 * Smart Cache Manager - Intelligent API Call Optimization
 *
 * Implements advanced caching strategies to ensure API calls are made
 * only when absolutely necessary, with intelligent invalidation patterns.
 *
 * Features:
 * - Data freshness validation
 * - Conditional API calls based on staleness
 * - Stale-while-revalidate pattern
 * - Intelligent refresh triggers
 * - Cross-service cache coordination
 *
 * @fileoverview Advanced caching system for optimal API usage
 */

/* eslint-disable @typescript-eslint/no-explicit-any, no-console */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  priority: 'high' | 'medium' | 'low';
  dependencies: string[];
}

export interface CacheConfig {
  defaultTTL: number;
  staleThreshold: number; // When to consider data stale
  refreshThreshold: number; // When to refresh in background
  maxAge: number; // Maximum age before forced refresh
}

export class SmartCache {
  private cache = new Map<string, CacheEntry<any>>();
  private refreshPromises = new Map<string, Promise<any>>();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      staleThreshold: 2 * 60 * 1000, // 2 minutes
      refreshThreshold: 4 * 60 * 1000, // 4 minutes
      maxAge: 10 * 60 * 1000, // 10 minutes
      ...config,
    };
  }

  /**
   * Get cached data with intelligent freshness check
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    const age = now - entry.timestamp;

    // Check if data is expired
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access tracking
    entry.accessCount++;
    entry.lastAccessed = now;

    return entry.data;
  }

  /**
   * Check if data is stale and needs refresh
   */
  isStale(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;

    const age = Date.now() - entry.timestamp;
    return age > this.config.staleThreshold;
  }

  /**
   * Check if data needs background refresh
   */
  needsRefresh(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;

    const age = Date.now() - entry.timestamp;
    return age > this.config.refreshThreshold;
  }

  /**
   * Check if data is too old and must be refreshed
   */
  isExpired(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;

    const age = Date.now() - entry.timestamp;
    return age > this.config.maxAge;
  }

  /**
   * Set cached data with intelligent TTL
   */
  set<T>(
    key: string,
    data: T,
    options: {
      ttl?: number;
      priority?: 'high' | 'medium' | 'low';
      dependencies?: string[];
    } = {}
  ): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl: options.ttl || this.config.defaultTTL,
      accessCount: 1,
      lastAccessed: now,
      priority: options.priority || 'medium',
      dependencies: options.dependencies || [],
    };

    this.cache.set(key, entry);
  }

  /**
   * Get data with stale-while-revalidate pattern
   * Returns cached data immediately if available, refreshes in background
   */
  async getWithRefresh<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: {
      ttl?: number;
      priority?: 'high' | 'medium' | 'low';
      dependencies?: string[];
    } = {}
  ): Promise<T> {
    const cached = this.get<T>(key);

    // If we have fresh data, return it immediately
    if (cached && !this.isStale(key)) {
      return cached;
    }

    // If we have stale data, return it but refresh in background
    if (cached && this.isStale(key) && !this.isExpired(key)) {
      this.refreshInBackground(key, fetchFn, options);
      return cached;
    }

    // If no data or expired, fetch immediately
    return this.fetchAndCache(key, fetchFn, options);
  }

  /**
   * Refresh data in background without blocking
   */
  private async refreshInBackground<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: any
  ): Promise<void> {
    // Prevent multiple simultaneous refreshes
    if (this.refreshPromises.has(key)) {
      return;
    }

    const refreshPromise = this.fetchAndCache(key, fetchFn, options).finally(
      () => {
        this.refreshPromises.delete(key);
      }
    );

    this.refreshPromises.set(key, refreshPromise);
  }

  /**
   * Fetch data and cache it
   */
  private async fetchAndCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: any
  ): Promise<T> {
    try {
      const data = await fetchFn();
      this.set(key, data, options);
      return data;
    } catch (error) {
      console.error(`[SmartCache] Failed to fetch data for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Invalidate cache entries based on dependencies
   */
  invalidateByDependency(dependency: string): void {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.dependencies.includes(dependency)) {
        this.cache.delete(key);
        console.log(
          `[SmartCache] Invalidated ${key} due to dependency ${dependency}`
        );
      }
    }
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.refreshPromises.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalEntries: number;
    staleEntries: number;
    expiredEntries: number;
    averageAge: number;
    hitRate: number;
  } {
    const now = Date.now();
    let totalAge = 0;
    let staleCount = 0;
    let expiredCount = 0;

    for (const entry of this.cache.values()) {
      const age = now - entry.timestamp;
      totalAge += age;

      if (age > this.config.staleThreshold) staleCount++;
      if (age > this.config.maxAge) expiredCount++;
    }

    return {
      totalEntries: this.cache.size,
      staleEntries: staleCount,
      expiredEntries: expiredCount,
      averageAge: this.cache.size > 0 ? totalAge / this.cache.size : 0,
      hitRate: 0, // Would need to track hits/misses
    };
  }
}

// Global smart cache instance
export const smartCache = new SmartCache({
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  staleThreshold: 2 * 60 * 1000, // 2 minutes
  refreshThreshold: 4 * 60 * 1000, // 4 minutes
  maxAge: 10 * 60 * 1000, // 10 minutes
});

/**
 * Cache key generators for consistent naming
 */
export const CacheKeys = {
  account: (accountName: string, network: string) =>
    `account-${accountName}-${network}`,
  voteInfo: (accountName: string, network: string) =>
    `vote-${accountName}-${network}`,
  votingResources: (accountName: string, network: string) =>
    `resources-${accountName}-${network}`,
  blockProducers: (network: string) => `producers-${network}`,
  tokenBalances: (accountName: string, network: string) =>
    `tokens-${accountName}-${network}`,
  coreSymbol: (network: string) => `symbol-${network}`,
} as const;

/**
 * Cache dependencies for intelligent invalidation
 */
export const CacheDependencies = {
  account: 'account',
  voteInfo: 'account',
  votingResources: 'account',
  blockProducers: 'network',
  tokenBalances: 'account',
  coreSymbol: 'network',
} as const;
