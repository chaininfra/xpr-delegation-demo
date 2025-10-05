# Memory Management Architecture

Advanced memory management implementation for the XPR Delegation Demo, featuring sophisticated garbage collection strategies and memory monitoring capabilities.

## Overview

The memory management system implements enterprise-grade memory optimization strategies to ensure optimal performance and resource utilization in blockchain applications.

## Core Components

### 1. MemoryManager Class

The `MemoryManager` provides a comprehensive memory caching solution with multiple garbage collection strategies.

#### Key Features

- **Multi-Strategy GC**: LRU, LFU, Age-based, Size-based, Priority-based garbage collection
- **Memory Monitoring**: Real-time memory usage tracking and health assessment
- **Intelligent Caching**: TTL-based cache with access frequency optimization
- **Priority Management**: Critical, High, Medium, Low priority cache entries

#### Configuration Options

```typescript
interface MemoryManagerOptions {
  maxMemorySize?: number;     // Max memory in bytes (default: 50MB)
  maxEntries?: number;        // Max cache entries (default: 1000)
  defaultTTL?: number;        // Default TTL in ms (default: 5min)
  gcInterval?: number;       // GC interval in ms (default: 2min)
  strategy?: GCStrategy;      // GC strategy (default: LRU)
}
```

### 2. Cache Entry Lifecycle

#### Cache Entry Structure

```typescript
interface CacheEntry<T> {
  data: T;                    // Cached data
  timestamp: number;          // Creation timestamp
  accessCount: number;        // Access frequency
  lastAccessed: number;       // Last access time
  memorySize: number;         // Estimated memory size
  priority: CachePriority;   // Cache priority level
}
```

#### Priority-Based Management

- **CRITICAL**: Wallet session data, authentication tokens
- **HIGH**: Account information, balance data  
- **MEDIUM**: Block producer information, voting data
- **LOW**: Generic cached data, API responses

### 3. Garbage Collection Strategies

#### LRU (Least Recently Used)

Removes entries with the oldest last access time.

```typescript
private performLRUGC(): void {
  const entries = Array.from(this.cache.entries());
  const sorted = entries.sort(([,a], [,b]) => a.lastAccessed - b.lastAccessed);
  
  const toRemove = Math.ceil(entries.length * 0.2); // Remove 20%
  for (let i = 0; i < toRemove && i < sorted.length; i++) {
    const [key] = sorted[i];
    this.remove(key);
  }
}
```

#### LFU (Least Frequently Used)

Removes entries with the lowest access count.

```typescript
private performLFUGC(): void {
  const entries = Array.from(this.cache.entries());
  const sorted = entries.sort(([,a], [,b]) => a.accessCount - b.accessCount);
  
  const toRemove = Math.ceil(entries.length * 0.2);
  for (let i = 0; i < toRemove && i < sorted.length; i++) {
    const [key] = sorted[i];
    this.remove(key);
  }
}
```

#### Age-Based Eviction

Removes entries approaching expiration threshold.

```typescript
private performAgeGC(): void {
  const now = Date.now();
  const expiredEntries = Array.from(this.cache.entries())
    .filter(([,entry]) => now - entry.timestamp > this.defaultTTL * 0.8);
  
  expiredEntries.forEach(([key]) => {
    this.remove(key);
  });
}
```

### 4. Memory Health Monitoring

#### Health Status Assessment

```typescript
getHealthStatus(): {
  status: 'healthy' | 'warning' | 'critical';
  memoryUsage: number;
  efficiency: number;
  recommendations: string[];
}
```

#### Memory Statistics

```typescript
interface MemoryStats {
  totalEntries: number;
  totalMemorySize: number;
  totalAccessCount: number;
  averageAccessFrequency: number;
  memoryEfficiency: number;
  gcRuns: number;
  evictions: number;
}
```

## Implementation in Services

### TokenService Integration

The `TokenService` utilizes the `MemoryManager` for optimized token caching:

```typescript
export class TokenService {
  private memoryManager = new MemoryManager({
    maxMemorySize: 25 * 1024 * 1024, // 25MB for token cache
    maxEntries: 500,
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    gcInterval: 2 * 60 * 1000, // 2 minutes
    strategy: 'lru' as any
  });
}
```

#### Cache Operations

```typescript
// Get cached tokens with access tracking
private getCachedTokens(account: string): TokenBalance[] | null {
  const cached = this.memoryManager.get<TokenBalance[]>(account);
  
  if (!cached) {
    console.debug(`Cache miss for ${account}`);
    return null;
  }
  
  return cached;
}

// Set tokens with memory health monitoring
private setCachedTokens(account: string, tokens: TokenBalance[]): void {
  const cacheKey = `tokens_${account}`;
  this.memoryManager.set(cacheKey, tokens);
  
  // Monitor memory health
  const health = this.memoryManager.getHealthStatus();
  if (health.status === 'critical') {
    this.memoryManager.performGC();
  }
}
```

## Performance Optimization

### Memory Size Estimation

Intelligent object size estimation for memory tracking:

```typescript
private estimateMemorySize(obj: any): number {
  if (typeof obj === 'string') {
    return obj.length * 2; // UTF-16 estimate
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
```

### Automatic Optimization

Real-time optimization based on performance metrics:

- **Memory usage > 90%**: Automatic GC trigger
- **Efficiency < 20%**: Critical status with manual intervention required
- **Efficiency < 40%**: Warning status with optimization recommendations

## Integration with React Components

### Memory Monitoring Hook

```typescript
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
```

### Usage in Components

```typescript
const MemoryMonitor = () => {
  const { stats, health, performGC } = useMemoryMonitor();
  
  return (
    <div className="memory-monitor">
      <div>Memory Usage: {health.memoryUsage.toFixed(1)}%</div>
      <div>Status: {health.status}</div>
      <div>Entries: {stats.totalEntries}</div>
      <button onClick={performGC}>Run GC</button>
    </div>
  );
};
```

## Best Practices

### 1. Cache Key Strategy

Use descriptive, hierarchical cache keys:

```typescript
const cacheKey = `tokens_${account}`;
const producerKey = `producers_${network}`;
const voteKey = `votes_${account}_${network}`;
```

### 2. Memory Monitoring

Implement proactive memory monitoring:

```typescript
// Monitor memory health in intervals
setInterval(() => {
  const health = memoryManager.getHealthStatus();
  if (health.status === 'critical') {
    console.error('Critical memory usage detected', health);
    memoryManager.performGC();
  }
}, 60000); // Check every minute
```

### 3. Cleanup on Component Unmount

```typescript
useEffect(() => {
  return () => {
    memoryManager.destroy();
  };
}, []);
```

## Configuration Recommendations

### Development Environment

```typescript
new MemoryManager({
  maxMemorySize: 10 * 1024 * 1024, // 10MB
  maxEntries: 200,
  gcInterval: 60000, // 1 minute
  strategy: GCStrategy.LRU
});
```

### Production Environment

```typescript
new MemoryManager({
  maxMemorySize: 100 * 1024 * 1024, // 100MB
  maxEntries: 2000,
  gcInterval: 120000, // 2 minutes
  strategy: GCStrategy.PRIORITY_BASED
});
```

## Monitoring and Debugging

### Memory Statistics Dashboard

Track key metrics:

- Total memory usage percentage
- Cache hit/miss ratio
- Garbage collection frequency
- Average access patterns
- Memory efficiency trends

### Console Logging

Comprehensive logging for debugging:

```typescript
console.debug('[MemoryManager] Cache miss for', key);
console.warn('[MemoryManager] Memory status:', health.status);
console.log('[MemoryManager] GC performed:', gcStats);
```

## Security Considerations

### Data Sanitization

Cache entries exclude sensitive data:

```typescript
private shouldLogState(state: any): boolean {
  if (state?.wallet?.session?.auth) return false;
  if (state?.account?.private_keys) return false;
  return true;
}
```

### Memory Cleanup

Ensure sensitive data is properly removed:

```typescript
destroy(): void {
  this.stopGC();
  this.clear(); // Comprehensive cleanup
}
```

## Future Enhancements

### Planned Improvements

1. **Adaptive Strategies**: Dynamic GC strategy selection based on usage patterns
2. **Memory Compression**: Automatic compression for large cached objects
3. **Distributed Caching**: Browser IndexedDB integration for persistent caching
4. **Performance Analytics**: Detailed performance impact analysis
5. **Memory Pooling**: Object pooling for frequently allocated types

### Integration Roadmap

1. **Service Workers**: Offload memory management to background threads
2. **WebAssembly**: High-performance GC algorithms in WASM
3. **ML Optimization**: Machine learning-based cache optimization
4. **Cross-Tab Synchronization**: Shared memory management across browser tabs

This memory management architecture provides enterprise-grade caching capabilities optimized for blockchain applications, ensuring optimal performance and resource utilization.
