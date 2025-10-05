/**
 * Memory Management Utilities
 *
 * Advanced memory management strategies for cached objects,
 * including garbage collection, memory monitoring, and optimization.
 *
 * @fileoverview Memory management utilities for XPR Delegation Demo
 */

/* eslint-disable @typescript-eslint/no-explicit-any, no-console, @typescript-eslint/no-unused-vars */

// Global declarations for browser APIs (used in runtime)
declare const performance: {
  now(): number;
};

declare const gc: () => void;

declare const NodeJS: any;

/**
 * Memory-aware cache entry with lifecycle management
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  memorySize: number;
  priority: CachePriority;
}

export enum CachePriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4,
}

/**
 * Memory usage statistics
 */
export interface MemoryStats {
  totalEntries: number;
  totalMemorySize: number;
  totalAccessCount: number;
  averageAccessFrequency: number;
  memoryEfficiency: number;
  gcRuns: number;
  evictions: number;
}

/**
 * Garbage Collection Strategy
 */
export enum GCStrategy {
  LRU = 'lru', // Least Recently Used
  LFU = 'lfu', // Least Frequently Used
  AGE_BASED = 'age', // Age-based eviction
  SIZE_BASED = 'size', // Size-based eviction
  PRIORITY_BASED = 'priority', // Priority-based eviction
}

/**
 * Advanced Memory Manager with GC strategies
 */
export class MemoryManager {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly maxMemorySize: number;
  private readonly maxEntries: number;
  private readonly defaultTTL: number;
  private readonly gcInterval: number;
  private gcTimer: ReturnType<typeof setInterval> | null = null;
  private stats: MemoryStats = {
    totalEntries: 0,
    totalMemorySize: 0,
    totalAccessCount: 0,
    averageAccessFrequency: 0,
    memoryEfficiency: 0,
    gcRuns: 0,
    evictions: 0,
  };
  private gcStrategy: GCStrategy = GCStrategy.LRU;

  constructor(
    options: {
      maxMemorySize?: number; // Max memory in bytes (default: 50MB)
      maxEntries?: number; // Max cache entries (default: 1000)
      defaultTTL?: number; // Default TTL in ms (default: 5min)
      gcInterval?: number; // GC interval in ms (default: 2min)
      strategy?: GCStrategy; // GC strategy (default: LRU)
    } = {}
  ) {
    this.maxMemorySize = options.maxMemorySize ?? 50 * 1024 * 1024; // 50MB
    this.maxEntries = options.maxEntries ?? 1000;
    this.defaultTTL = options.defaultTTL ?? 5 * 60 * 1000; // 5 minutes
    this.gcInterval = options.gcInterval ?? 2 * 60 * 1000; // 2 minutes
    this.gcStrategy = options.strategy ?? GCStrategy.LRU;

    this.startGC();
  }

  /**
   * Get cached data with automatic access tracking
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check expiration
    if (Date.now() - entry.timestamp > this.defaultTTL) {
      this.remove(key);
      return null;
    }

    // Update access tracking
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.totalAccessCount++;

    return entry.data;
  }

  /**
   * Set cached data with memory tracking
   */
  set<T>(key: string, data: T): void {
    const memorySize = this.estimateMemorySize(data);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
      memorySize,
      priority: this.determinePriority(key, data),
    };

    this.cache.set(key, entry);
    this.stats.totalEntries++;
    this.stats.totalMemorySize += memorySize;

    // Trigger GC if memory limit exceeded
    if (this.requiresCleanup()) {
      this.performGC();
    }
  }

  /**
   * Remove specific entry
   */
  remove(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    this.stats.totalMemorySize -= entry.memorySize;
    this.stats.totalEntries--;
    this.stats.evictions++;

    return this.cache.delete(key);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.stats.totalEntries = 0;
    this.stats.totalMemorySize = 0;
    this.cache.clear();
  }

  /**
   * Get memory statistics
   */
  getStats(): MemoryStats {
    return { ...this.stats };
  }

  /**
   * Force garbage collection
   */
  performGC(): void {
    const oldStats = { ...this.stats };

    switch (this.gcStrategy) {
      case GCStrategy.LRU:
        this.performLRUGC();
        break;
      case GCStrategy.LFU:
        this.performLFUGC();
        break;
      case GCStrategy.AGE_BASED:
        this.performAgeGC();
        break;
      case GCStrategy.SIZE_BASED:
        this.performSizeGC();
        break;
      case GCStrategy.PRIORITY_BASED:
        this.performPriorityGC();
        break;
    }

    this.stats.gcRuns++;
    this.updateMemoryEfficiency();

    console.log('[MemoryManager] GC performed:', {
      before: oldStats.totalEntries,
      after: this.stats.totalEntries,
      evicted: oldStats.totalEntries - this.stats.totalEntries,
      strategy: this.gcStrategy,
    });
  }

  /**
   * Start automatic garbage collection
   */
  private startGC(): void {
    if (this.gcTimer) {
      clearInterval(this.gcTimer);
    }

    this.gcTimer = setInterval(() => {
      if (this.requiresCleanup()) {
        this.performGC();
      }
    }, this.gcInterval);
  }

  /**
   * Stop automatic garbage collection
   */
  stopGC(): void {
    if (this.gcTimer) {
      clearInterval(this.gcTimer);
      this.gcTimer = null;
    }
  }

  /**
   * Check if cleanup is required
   */
  private requiresCleanup(): boolean {
    return (
      this.stats.totalEntries > this.maxEntries ||
      this.stats.totalMemorySize > this.maxMemorySize
    );
  }

  /**
   * LRU-based garbage collection
   */
  private performLRUGC(): void {
    const entries = Array.from(this.cache.entries());
    const sorted = entries.sort(
      ([, a], [, b]) => a.lastAccessed - b.lastAccessed
    );

    const toRemove = Math.ceil(entries.length * 0.2); // Remove 20%
    for (let i = 0; i < toRemove && i < sorted.length; i++) {
      const [key] = sorted[i];
      this.remove(key);
    }
  }

  /**
   * LFU-based garbage collection
   */
  private performLFUGC(): void {
    const entries = Array.from(this.cache.entries());
    const sorted = entries.sort(
      ([, a], [, b]) => a.accessCount - b.accessCount
    );

    const toRemove = Math.ceil(entries.length * 0.2); // Remove 20%
    for (let i = 0; i < toRemove && i < sorted.length; i++) {
      const [key] = sorted[i];
      this.remove(key);
    }
  }

  /**
   * Age-based garbage collection
   */
  private performAgeGC(): void {
    const now = Date.now();
    const expiredEntries = Array.from(this.cache.entries()).filter(
      ([, entry]) => now - entry.timestamp > this.defaultTTL * 0.8
    ); // Remove entries approaching expiry

    expiredEntries.forEach(([key]) => {
      this.remove(key);
    });
  }

  /**
   * Size-based garbage collection
   */
  private performSizeGC(): void {
    const entries = Array.from(this.cache.entries());
    const sorted = entries.sort(([, a], [, b]) => b.memorySize - a.memorySize);

    const toRemove = Math.ceil(entries.length * 0.1); // Remove largest 10%
    for (let i = 0; i < toRemove && i < sorted.length; i++) {
      const [key] = sorted[i];
      this.remove(key);
    }
  }

  /**
   * Priority-based garbage collection
   */
  private performPriorityGC(): void {
    const entries = Array.from(this.cache.entries());
    const sorted = entries.sort(([, a], [, b]) => a.priority - b.priority);

    const toRemove = Math.ceil(entries.length * 0.2); // Remove lowest priority 20%
    for (let i = 0; i < toRemove && i < sorted.length; i++) {
      const [key] = sorted[i];
      this.remove(key);
    }
  }

  /**
   * Estimate memory size of object
   */
  private estimateMemorySize(obj: any): number {
    if (typeof obj === 'string') {
      return obj.length * 2; // Rough estimate for UTF-16
    }

    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return 8; // V8 heap estimate
    }

    if (Array.isArray(obj)) {
      return obj.reduce((sum, item) => sum + this.estimateMemorySize(item), 0);
    }

    if (obj && typeof obj === 'object') {
      return Object.keys(obj).reduce((sum, key) => {
        return sum + key.length * 2 + this.estimateMemorySize(obj[key]);
      }, 0);
    }

    return 0;
  }

  /**
   * Determine cache priority based on key and data
   */
  private determinePriority(key: string, _data: any): CachePriority {
    // High priority for frequently accessed data
    if (key.includes('account') || key.includes('balance')) {
      return CachePriority.HIGH;
    }

    // Medium priority for block producers
    if (key.includes('producer') || key.includes('vote')) {
      return CachePriority.MEDIUM;
    }

    // Critical priority for wallet session data
    if (key.includes('session') || key.includes('auth')) {
      return CachePriority.CRITICAL;
    }

    // Low priority for other cached data
    return CachePriority.LOW;
  }

  /**
   * Update memory efficiency metric
   */
  private updateMemoryEfficiency(): void {
    const activeEntries = this.cache.size;
    const totalCapacity = this.maxEntries;

    this.stats.memoryEfficiency =
      totalCapacity > 0 ? (activeEntries / totalCapacity) * 100 : 100;

    this.stats.averageAccessFrequency =
      this.stats.totalEntries > 0
        ? this.stats.totalAccessCount / totalCapacity
        : 0;
  }

  /**
   * Get memory health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    memoryUsage: number;
    efficiency: number;
    recommendations: string[];
  } {
    const memoryUsage = (this.stats.totalMemorySize / this.maxMemorySize) * 100;
    const efficiency = this.stats.memoryEfficiency;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    const recommendations: string[] = [];

    // More intelligent health assessment
    const hasSignificantCache = this.stats.totalEntries > 10;
    const lowMemoryEfficiency = efficiency < 40 && hasSignificantCache;
    const highMemoryUsage = memoryUsage > 80;

    if (highMemoryUsage || lowMemoryEfficiency) {
      status = 'critical';
      recommendations.push('Consider reducing cache size or TTL');
      recommendations.push('Perform immediate manual garbage collection');
    } else if (memoryUsage > 60 || efficiency < 60) {
      status = 'warning';
      recommendations.push('Monitor memory usage closely');
      recommendations.push('Consider optimizing GC strategy');
    }

    return {
      status: hasSignificantCache ? status : 'healthy',
      memoryUsage,
      efficiency,
      recommendations: hasSignificantCache ? recommendations : [],
    };
  }

  /**
   * Cleanup and destroy the manager
   */
  destroy(): void {
    this.stopGC();
    this.clear();
  }
}

/**
 * Global memory manager instance
 */
export const memoryManager = new MemoryManager({
  maxMemorySize: 50 * 1024 * 1024, // 50MB
  maxEntries: 1000,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  gcInterval: 2 * 60 * 1000, // 2 minutes
  strategy: GCStrategy.LRU,
});

/**
 * Memory monitoring hook for React components
 */
export const useMemoryMonitor = () => {
  const stats = memoryManager.getStats();
  const health = memoryManager.getHealthStatus();

  return {
    stats,
    health,
    performGC: () => memoryManager.performGC(),
    clearCache: () => memoryManager.clear(),
  };
};
