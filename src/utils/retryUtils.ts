/**
 * Retry Utilities for API Calls
 *
 * Provides exponential backoff and retry mechanisms for handling
 * rate limiting and temporary API failures.
 *
 * @fileoverview Retry utilities for robust API communication
 */

/* eslint-disable no-undef, @typescript-eslint/no-explicit-any, no-console */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryCondition?: (error: any) => boolean;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryCondition: (error: any) => {
    // Retry on network errors, rate limiting, and server errors
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('rate limit') ||
        message.includes('timeout') ||
        message.includes('network') ||
        message.includes('500') ||
        message.includes('502') ||
        message.includes('503') ||
        message.includes('504') ||
        message.includes('429') // Too Many Requests
      );
    }
    return false;
  },
};

/**
 * Execute a function with exponential backoff retry
 * @param fn - Function to execute
 * @param options - Retry configuration
 * @returns Promise with function result
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if this is the last attempt
      if (attempt === config.maxRetries) {
        break;
      }

      // Don't retry if condition is not met
      if (!config.retryCondition(error)) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelay
      );

      console.log(
        `[Retry] Attempt ${attempt + 1}/${config.maxRetries + 1} failed, retrying in ${delay}ms...`
      );

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Create a rate-limited fetch function
 * @param baseDelay - Base delay between requests
 * @returns Rate-limited fetch function
 */
export function createRateLimitedFetch(baseDelay: number = 100) {
  let lastRequestTime = 0;

  return async (url: string, options: RequestInit = {}): Promise<Response> => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    if (timeSinceLastRequest < baseDelay) {
      const waitTime = baseDelay - timeSinceLastRequest;
      console.log(`[RateLimit] Waiting ${waitTime}ms before request...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    lastRequestTime = Date.now();

    // Add retry logic to the fetch
    return retryWithBackoff(async () => {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return response;
    });
  };
}

/**
 * Batch API calls with rate limiting
 * @param calls - Array of API call functions
 * @param batchSize - Number of concurrent calls
 * @param delayBetweenBatches - Delay between batches
 * @returns Promise with all results
 */
export async function batchApiCalls<T>(
  calls: (() => Promise<T>)[],
  batchSize: number = 3,
  delayBetweenBatches: number = 200
): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < calls.length; i += batchSize) {
    const batch = calls.slice(i, i + batchSize);

    console.log(
      `[BatchAPI] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(calls.length / batchSize)}`
    );

    const batchResults = await Promise.allSettled(
      batch.map(call => retryWithBackoff(call))
    );

    // Extract successful results
    batchResults.forEach(result => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.warn('[BatchAPI] Batch call failed:', result.reason);
        // Push null for failed calls to maintain array structure
        results.push(null as T);
      }
    });

    // Add delay between batches (except for the last batch)
    if (i + batchSize < calls.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return results;
}

/**
 * Circuit breaker pattern for API calls
 * Prevents cascading failures by temporarily stopping calls to failing services
 */
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private failureThreshold: number = 5,
    private resetTimeout: number = 30000 // 30 seconds
  ) {
    // Initialize circuit breaker
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        console.log('[CircuitBreaker] Moving to HALF_OPEN state');
      } else {
        throw new Error('Circuit breaker is OPEN - service unavailable');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      console.log(
        `[CircuitBreaker] Moving to OPEN state after ${this.failureCount} failures`
      );
    }
  }

  getState(): string {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }
}
