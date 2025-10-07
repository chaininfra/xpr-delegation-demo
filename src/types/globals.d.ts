/**
 * Global Type Definitions
 * Declares browser global objects and API
 */

/* eslint-disable no-undef, @typescript-eslint/no-explicit-any */

declare global {
  // Browser APIs
  interface Window {
    crypto: Crypto;
    performance: Performance;
    Buffer: any;
    global: typeof globalThis;
  }

  const self: ServiceWorkerGlobalScope;
  const caches: CacheStorage;
  const Response: ResponseConstructor;
  const HTMLDivElement: new () => HTMLDivElement;
  const HTMLInputElement: new () => HTMLInputElement;
  const HTMLTextAreaElement: new () => HTMLTextAreaElement;
  const HTMLElement: new () => HTMLElement;
  const URLSearchParams: new (init?: string | URLSearchParams | Record<string, string> | string[][]) => URLSearchParams;
  const navigator: Navigator;
  const Node: NodeConstructor;
  const MouseEvent: MouseEventConstructor;
  const Element: ElementConstructor;
  const HTMLDivElement: HTMLDivElementConstructor;

  // Performance APIs
  interface PerformanceEntry {
    name: string;
    startTime: number;
    duration: number;
  }

  interface PerformanceEventTiming extends PerformanceEntry {
    processingStart?: number;
  }

  interface PerformanceObserver {
    observe(options?: any): void;
    disconnect(): void;
  }

  interface PerformanceObserverEntryList {
    getEntries(): PerformanceEntry[];
    getEntriesByName(name: string): PerformanceEntry[];
  }

  interface PerformanceObserverInit {
    entryTypes: string[];
  }

  const PerformanceObserver: {
    prototype: PerformanceObserver;
    new (
      callback: (list: PerformanceObserverEntryList) => void
    ): PerformanceObserver;
  };

  // Node.js globals (for testing)
  const process: {
    env: Record<string, string>;
    browser: boolean;
  };

  const NodeJS: any;

  // Analytics
  interface Window {
    analytics?: {
      track: (event: string, data?: any) => void;
    };
  }
}

export {};
