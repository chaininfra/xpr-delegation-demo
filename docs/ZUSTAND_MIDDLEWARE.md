# Advanced Zustand Middleware Implementation

Comprehensive middleware architecture for Zustand state management, featuring logging, analytics, optimization, and subscription capabilities for enterprise-grade applications.

## Overview

The advanced middleware implementation extends Zustand with sophisticated features including automatic performance optimization, user behavior analytics, enhanced debugging capabilities, and subscription-based integrations.

## Middleware Architecture

### 1. Middleware Composition Pattern

The system implements a composable middleware architecture allowing multiple middleware layers to be combined:

```typescript
const advancedMiddleware = composeMiddleware(
  loggingMiddleware,
  analyticsMiddleware,
  optimizationMiddleware,
  subscriptionMiddleware,
  devtoolsMiddleware
)(defaultMiddlewareConfig);
```

### 2. Configuration System

Centralized configuration for all middleware components:

```typescript
interface MiddlewareConfig {
  enableLogging?: boolean;
  enableAnalytics?: boolean;
  enableOptimization?: boolean;
  enableDevtools?: boolean;
  enablePersist?: boolean;
  enableSubscriptions?: boolean;
  logLevels?: LogLevel[];
  analyticsEndpoint?: string;
  optimizationThreshold?: number;
}
```

## Core Middleware Components

### 1. Logging Middleware

Comprehensive action logging with configurable levels and security-aware data handling.

#### Features

- **Configurable Log Levels**: Debug, Info, Warn, Error
- **Security-Aware Logging**: Automatic data sanitization for sensitive information
- **Performance Tracking**: Action duration measurement and slow action detection
- **Structured Logging**: Consistent log format with contextual information

#### Implementation

```typescript
export const loggingMiddleware = (config: MiddlewareConfig) => 
  <T, M extends [StoreMutatorIdentifier, unknown][]>(
    creator: StateCreator<T, M>
  ): StateCreator<T, M> => (set, get, store) => {
    
    const originalSet = set;
    const loggedSet: typeof set = &{};

    // Enhanced set function with logging
    const loggedSet = (partial, replace, actionType) => {
      const startTime = performance.now();
      const previousState = get();
      let success = true;
      let error: Error | undefined;

      try {
        const result = originalSet(partial, replace, actionType);
        const nextState = get();
        const duration = performance.now() - startTime;

        // Log action with security validation
        if (config.enableLogging && config.logLevels?.includes(LogLevel.DEBUG)) {
          const meta: ActionMetadata = {
            action: actionType || 'unknown',
            timestamp: Date.now(),
            previousState: this.shouldLogState(previousState) ? previousState : '[REDACTED]',
            nextState: this.shouldLogState(nextState) ? nextState : '[REDACTED]',
            duration,
            success,
            payload: this.shouldLogPayload(partial) ? partial : '[REDACTED]'
          };

          console.log(`[Zustand] Action: ${meta.action}`, {
            duration: `${meta.duration.toFixed(2)}ms`,
            success: meta.success,
            ...(meta.payload && { payload: meta.payload })
          });
        }

        return result;
      } catch (err) {
        console.error('[Zustand] Action failed:', actionType, err);
        throw err;
      }
    };
  };
```

#### Security Considerations

```typescript
private shouldLogState(state: any): boolean {
  if (!state || typeof state !== 'object') return true;
  
  // Don't log sensitive wallet data
  if (state.wallet?.session?.auth) return false;
  if (state.account?.private_keys) return false;
  
  return true;
}
```

### 2. Analytics Middleware

User behavior tracking and analytics with privacy protection and batch processing.

#### Features

- **Batch Processing**: Queue-based analytics to reduce network overhead
- **Privacy Protection**: Automatic data sanitization for sensitive information
- **Configurable Endpoints**: Flexible analytics endpoint configuration
- **Session Tracking**: Unique session identification for user journey analysis

#### Implementation

```typescript
export const analyticsMiddleware = (config: MiddlewareConfig) =>
  <T, M extends [StoreMutatorIdentifier, unknown][]>(
    creator: StateCreator<T, M>
  ): StateCreator<T, M> => (set, get, store) => {
    
    let analyticsQueue: ActionMetadata[] = [];
    const maxQueueSize = 100;
    const flushInterval = 30000; // 30 seconds

    const originalSet = set;
    
    const analyticsSet: typeof set = (partial, replace, actionType) => {
      const startTime = performance.now();
      const previousState = get();
      
      try {
        const result = originalSet(partial, replace, actionType);
        const duration = performance.now() - startTime;

        // Queue sanitized analytics data
        const meta: ActionMetadata = {
          action: actionType || 'unknown',
          timestamp: Date.now(),
          previousState: sanitizeForAnalytics(previousState),
          nextState: sanitizeForAnalytics(nextState),
          duration,
          success: true,
          payload: sanitizeForAnalytics(partial)
        };

        addToAnalyticsQueue(meta);
        return result;
      } catch (err) {
        // Handle errors analytically
        queueAnalyticsError(actionType, err);
        throw err;
      }
    };

    // Automatic batch processing
    const analyticsTimer = setInterval(() => {
      if (analyticsQueue.length > 0 && config.enableAnalytics) {
        flushAnalytics();
      }
    }, flushInterval);

    return creator(analyticsSet, get, store);
  };
```

#### Data Sanitization

```typescript
const sanitizeForAnalytics = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  
  if (sanitized.wallet?.session) {
    sanitized.wallet.session = '[REDACTED]';
  }
  
  if (sanitized.account?.private_keys) {
    delete sanitized.account.private_keys;
  }
  
  return sanitized;
};
```

### 3. Optimization Middleware

Automatic performance optimization with intelligent caching and garbage collection.

#### Features

- **Dynamic Optimization**: Real-time performance monitoring and optimization
- **Garbage Collection**: Automatic memory cleanup and resource management
- **Performance Metrics**: Detailed performance tracking and bottleneck identification
- **Threshold-Based Triggers**: Configurable performance thresholds for optimization

#### Implementation

```typescript
export const optimizationMiddleware = (config: MiddlewareConfig) =>
  <T, M extends [StoreMutatorIdentifier, unknown][]>(
    creator: StateCreator<T, M>
  ): StateCreator<T, M> => (set, get, store) => {
    
    let actionCount = 0;
    let totalDuration = 0;
    let lastOptimization = Date.now();
    const optimizationThreshold = config.optimizationThreshold || 1000;

    const originalSet = set;
    
    const optimizedSet: typeof set = (partial, replace, actionType) => {
      const startTime = performance.now();
      
      try {
        const result = originalSet(partial, replace, actionType);
        const duration = performance.now() - startTime;
        
        actionCount++;
        totalDuration += duration;

        // Perform optimization based on performance metrics
        if (shouldOptimize()) {
          performOptimization();
        }

        return result;
      } catch (err) {
        totalDuration += performance.now() - startTime;
        throw err;
      }
    };

    const shouldOptimize = (): boolean => {
      const timeSinceLastOptimization = Date.now() - lastOptimization;
      const averageDuration = actionCount > 0 ? totalDuration / actionCount : 0;
      
      return (
        timeSinceLastOptimization > optimizationThreshold ||
        averageDuration > 50 || // Average action exceeds 50ms
        actionCount > 100 // More than 100 actions performed
      );
    };

    const performOptimization = () => {
      if (config.enableOptimization) {
        // Force garbage collection if available
        if ('gc' in window && typeof (window as any).gc === 'function') {
          (window as any).gc();
        }

        // Reset metrics
        lastOptimization = Date.now();
        actionCount = 0;
        totalDuration = 0;

        console.log('[Zustand] Optimization performed');
      }
    };

    return creator(
      optimizationFunction(isOptimized, performOptimization)(originalSet),
      get,
      store
    );
  };
```

### 4. Subscription Middleware

Event-driven subscriptions for external system integration and real-time updates.

#### Features

- **Action-Specific Subscriptions**: Subscribe to specific action types
- **State-Based Subscriptions**: Subscribe to general state changes
- **Error Handling**: Robust error handling for subscription callbacks
- **Automatic Cleanup**: Proper subscription cleanup and resource management

#### Implementation

```typescript
export const subscriptionMiddleware = (config: MiddlewareConfig) =>
  <T, M extends [StoreMutatorIdentifier, unknown][]>(
    creator: StateCreator<T, M>
  ): StateCreator<T, M> => (set, get, store) => {
    
    const subscribers = new Set<(state: T, prevState: T, action?: string) => void>();
    const actionSubscribers = new Map<string, Set<(payload: any, state: T) => void>>();

    const originalSet = set;
    
    const subscriptionSet: typeof set = (partial, replace, actionType) => {
      const prevState = get();
      
      try {
        const result = originalSet(partial, replace, actionType);
        const newState = get();

        // Notify state subscribers
        if (config.enableSubscriptions) {
          subscribers.forEach(sub => {
            try {
              sub(newState, prevState, actionType);
            } catch (err) {
              console.warn('[Subscription] Subscriber error:', err);
            }
          });
        }

        // Notify action-specific subscribers
        if (actionType && actionSubscribers.has(actionType)) {
          const actionSubs = actionSubscribers.get(actionType)!;
          actionSubs.forEach(sub => {
            try {
              sub(partial, newState);
            } catch (err) {
              console.warn('[Subscription] Action subscriber error:', err);
            }
          });
        }

        return result;
      } catch (err) {
        // Notify error subscribers
        subscribers.forEach(sub => {
          try {
            sub(get(), prevState, `${actionType}_ERROR`);
          } catch (subErr) {
            console.warn('[Subscription] Error subscriber failed:', subErr);
          }
        });
        throw err;
      }
    };

    // Extend store with subscription methods
    const storeWithSubscriptions = {
      ...store,
      subscribe: (callback: (state: T, prevState: T, action?: string) => void) => {
        subscribers.add(callback);
        return () => subscribers.delete(callback);
      },
      subscribeToAction: (actionType: string, callback: (payload: any, state: T) => void) => {
        if (!actionSubscribers.has(actionType)) {
          actionSubscribers.set(actionType, new Set());
        }
        actionSubscribers.get(actionType)!.add(callback);
        
        return () => {
          const subs = actionSubscribers.get(actionType);
          if (subs) {
            subs.delete(callback);
            if (subs.size === 0) {
              actionSubscribers.delete(actionType);
            }
          }
        };
      },
      unsubscribe: () => {
        subscribers.clear();
        actionSubscribers.clear();
      }
    };

    return creator(subscriptionSet, get, storeWithSubscriptions);
  };
```

### 5. Devtools Middleware

Enhanced developer tools with detailed state change analysis and debugging capabilities.

#### Features

- **State Change Analysis**: Deep diffing and change visualization
- **Performance Monitoring**: Detailed performance metrics and warnings
- **Advanced Debugging**: Enhanced debugging information and call stacks
- **Development-Only**: Automatic enabling/disabling based on environment

#### Implementation

```typescript
export const devtoolsMiddleware = (config: MiddlewareConfig) =>
  <T, M extends [StoreMutatorIdentifier, unknown][]>(
    creator: StateCreator<T, M>
  ): StateCreator<T, M> => (set, get, store) => {
    
    if (!config.enableDevtools || process.env.NODE_ENV === 'production') {
      return creator(set, get, store);
    }

    const enhancedSet: typeof set = (partial, replace, actionType) => {
      const startTime = performance.now();
      const prevState = get();
      
      try {
        const result = set(partial, replace, actionType);
        const duration = performance.now() - startTime;
        const newState = get();

        // Enhanced devtools logging
        console.group(`🔧 [Zustand Devtools] ${actionType || 'Unknown Action'}`);
        console.log('Duration:', `${duration.toFixed(2)}ms`);
        console.log('Previous State:', prevState);
        console.log('Payload:', partial);
        console.log('New State:', newState);
        
        // Performance warnings
        if (duration > 100) {
          console.warn('⚠️ Slow action detected:', duration.toFixed(2), 'ms');
        }
        
        // State change analysis
        const changes = analyzeStateChanges(prevState, newState);
        if (changes.length > 0) {
          console.log('Changes:', changes);
        }
        
        console.groupEnd();

        return result;
      } catch (err) {
        console.error('❌ [Zustand Devtools] Action failed:', actionType, err);
        throw err;
      }
    };

    return creator(enhancedSet, get, store);
  };
```

#### State Change Analysis

```typescript
const analyzeStateChanges = (prev: any, next: any): string[] => {
  const changes: string[] = [];
  
  if (typeof prev !== 'object' || typeof next !== 'object') {
    return changes;
  }

  const analyzeObject = (obj1: any, obj2: any, path = ''): void => {
    const keys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);
    
    keys.forEach(key => {
      const newPath = path ? `${path}.${key}` : key;
      
      if (!(key in (obj1 || {}))) {
        changes.push(`+ ${newPath}: ${JSON.stringify(obj2[key])}`);
      } else if (!(key in (obj2 || {}))) {
        changes.push(`- ${newPath}: ${JSON.stringify(obj1[key])}`);
      } else if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
        changes.push(`~ ${newPath}: ${JSON.stringify(obj1[key])} → ${JSON.stringify(obj2[key])}`);
      }
    });
  };

  analyzeObject(prev, next);
  return changes;
};
```

## Integration Patterns

### Store Creation with Advanced Middleware

```typescript
// Compose advanced middleware with configuration
const advancedMiddleware = composeMiddleware(
  loggingMiddleware,
  analyticsMiddleware,
  optimizationMiddleware,
  subscriptionMiddleware,
  devtoolsMiddleware
)(defaultMiddlewareConfig);

// Create store with advanced middleware composition
export const useAppStore = create<AppStore>()(
  advancedMiddleware(
    devtools(
      persist(
        set => ({
          ...initialState,
          // Store implementation
        }),
        {
          name: 'xpr-delegation-store',
          partialize: state => ({ network: state.network })
        }
      ),
      { name: 'xpr-delegation-store' }
    )
  )
);
```

### Subscription Implementation

```typescript
export const useStoreSubscriptions = () => {
  const store = useAppStore();
  
  const subscribe = (callback: (state: AppState, prevState: AppState, action?: string) => void) => {
    return store.subscribe?.(callback);
  };
  
  const subscribeToWalletActions = (callback: (payload: any, state: AppState) => void) => {
    return store.subscribeToAction?.('setWallet', callback);
  };
  
  const subscribeToAccountActions = (callback: (payload: any, state: AppState) => void) => {
    return store.subscribeToAction?.('setAccount', callback);
  };

  return {
    subscribe,
    subscribeToWalletActions,
    subscribeToAccountActions,
    subscriberCount: store.getSubscriberCount?.(),
    actionSubscriberCount: store.getActionSubscriberCount
  };
};
```

## Configuration Strategies

### Development Configuration

```typescript
const devConfig: MiddlewareConfig = {
  enableLogging: true,
  enableAnalytics: false, // Disabled for privacy
  enableOptimization: true,
  enableDevtools: true,
  enableSubscriptions: true,
  logLevels: [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR]
};
```

### Production Configuration

```typescript
const prodConfig: MiddlewareConfig = {
  enableLogging: false, // Disabled for performance
  enableAnalytics: true,
  enableOptimization: true,
  enableDevtools: false,
  enableSubscriptions: true,
  analyticsEndpoint: 'https://analytics.example.com/api/events',
  optimizationThreshold: 500
};
```

## Performance Considerations

### Memory Management

- **Subscription Cleanup**: Automatic cleanup prevents memory leaks
- **Analytics Batching**: Reduces memory footprint for analytics data
- **Optimization Triggers**: Configurable thresholds prevent performance degradation

### Performance Monitoring

```typescript
interface PerformanceMetrics {
  actionsPerSecond: number;
  averageActionDuration: number;
  memoryUsage: number;
  stateSize: number;
  lastOptimization: number;
}
```

## Security Features

### Data Privacy

- **Automatic Data Sanitization**: Sensitive data removed from logs and analytics
- **Privacy-First Design**: Analytics disabled by default
- **Secure Configuration**: Production-ready security configurations

### Access Control

```typescript
// Security-aware logging
private shouldLogState(state: any): boolean {
  if (state?.wallet?.session?.auth) return false;
  if (state?.account?.private_keys) return false;
  return true;
}
```

## Best Practices

### 1. Middleware Composition

- Compose middleware in logical order
- Configure middleware appropriately for environment
- Monitor middleware performance impact

### 2. Subscription Management

```typescript
// Proper subscription cleanup
useEffect(() => {
  const unsubscribe = store.subscribe(onStateChange);
  return unsubscribe; // Cleanup on unmount
}, []);
```

### 3. Performance Optimization

- Configure appropriate optimization thresholds
- Monitor performance metrics regularly
- Use production-specific configurations

### 4. Security Implementation

- Enable data sanitization for all environments
- Configure analytics endpoints securely
- Monitor sensitive data exposure

## Future Enhancements

### Planned Features

1. **Middleware Interceptors**: Pre/post action hooks
2. **Performance Analytics**: Detailed performance reporting
3. **Distributed State**: Multi-tab state synchronization
4. **AI Optimization**: Machine learning-based optimization
5. **GraphQL Integration**: Advanced data fetching patterns

This advanced middleware implementation provides enterprise-grade capabilities for Zustand state management, enabling sophisticated monitoring, optimization, and integration patterns for blockchain applications.
