# XPR Delegation Demo - Developer Guide

Comprehensive development documentation for contributors and technical users of the XPR Delegation Demo application.

## Development Environment Setup

### Prerequisites
- Node.js version 16.x or higher
- npm version 8.x or higher
- Git version control system
- VS Code (recommended) or compatible IDE
- Modern web browser with WebAuth or Anchor wallet support

### Initial Setup
```bash
# Repository cloning
git clone https://github.com/lucm9/xpr-delegation-demo.git
cd xpr-delegation-demo

# Dependency installation
npm install

# Development server startup
npm run dev

# Application access
open http://localhost:3000
```

## Project Architecture

### Technology Stack
- **Frontend Framework**: React 18.2.0 with concurrent features
- **Build System**: Vite 7.1.9 for fast development and production builds
- **Type System**: TypeScript 5.9.3 for type safety and developer experience
- **Styling**: Tailwind CSS 3.4.18 for utility-first styling
- **Blockchain Integration**: Proton Web SDK 4.2.20
- **State Management**: Zustand 5.0.8 for lightweight state management

### Directory Structure
```
src/
├── components/          # Reusable UI components
│   ├── BlockProducerSelector.tsx
│   ├── NetworkInfo.tsx
│   ├── NetworkSelector.tsx
│   ├── StakeResources.tsx
│   ├── TokenSelector.tsx
│   ├── TransferForm.tsx
│   ├── VoteInfo.tsx
│   ├── WalletConnection.tsx
│   └── index.ts
├── config/             # Configuration management
│   └── networks.ts
├── hooks/              # Custom React hooks
│   └── usePerformance.ts
├── layout/             # Layout components
│   ├── CardLayout.tsx
│   └── index.ts
├── middleware/         # Middleware implementations
│   └── security.ts
├── pages/              # Page-level components
│   ├── HomePage.tsx
│   ├── TransferPage.tsx
│   └── index.ts
├── services/           # Business logic services
│   ├── blockchain.ts
│   ├── sdk.ts
│   ├── token.ts
│   ├── wallet.ts
│   └── index.ts
├── store/              # State management
│   └── index.ts
├── styles/             # Styling resources
│   └── index.css
├── types/              # TypeScript type definitions
│   ├── globals.d.ts
│   ├── index.ts
│   └── README.md
└── utils/              # Utility functions
    ├── helpers.ts
    ├── security.ts
    └── security-hardening.ts
```

## Development Workflow

### Code Quality Standards
The project enforces high code quality through:

- **ESLint Configuration**: Zero errors or warnings policy
- **TypeScript Compliance**: Full type coverage requirement
- **Prettier Formatting**: Consistent code formatting
- **Accessibility Standards**: WCAG 2.1 compliance
- **Security Validation**: Input sanitization and validation

### Development Commands
```bash
# Development server
npm run dev

# Production build
npm run build
npm run build:prod

# Code quality checks
npm run lint
npm run lint:fix
npm run type-check
npm run quality

# Testing
npm run test
npm run test:watch
npm run test:coverage
```

### Component Development Guidelines

#### Component Structure
```typescript
import React from 'react';
import type { ComponentProps } from '../types';

interface ComponentNameProps {
  /** Prop documentation */
  propName: string;
  /** Event handler documentation */
  onAction: () => void;
}

const ComponentName: React.FC<ComponentNameProps> = ({
  propName,
  onAction
}) => {
  return (
    <div className="component-container">
      {/* Implementation */}
    </div>
  );
};

export default ComponentName;
```

#### Component Integration
```typescript
// File: src/components/index.ts
export { default as ComponentName } from './ComponentName';
```

### Service Layer Development

#### Service Implementation Pattern
```typescript
/**
 * Service Name - XPR Delegation Demo
 *
 * Service description and functionality overview.
 *
 * @fileoverview Service description
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

export class ServiceName {
  private cache: Map<string, any> = new Map();

  async operationName(
    param1: string,
    param2: number,
    session?: any
  ): Promise<ReturnType> {
    try {
      // Implementation
      return result;
    } catch (error: any) {
      throw new Error(`Operation failed: ${error.message}`);
    }
  }
}

export const serviceInstance = new ServiceName();
```

## Blockchain Integration

### XPR Network Operations

#### Account Information Retrieval
```typescript
export const getAccountInfo = async (
  accountName: string,
  network: NetworkType = 'testnet',
  session: any = null
): Promise<AccountInfo> => {
  const rpc = session?.rpc || await getRpcClient(network);
  const accountData = await rpc.get_account(accountName);
  
  // Process and return account information
  return processedAccountInfo;
};
```

#### Vote Delegation Implementation
```typescript
export const delegateVotes = async (
  accountName: string,
  producers: string[],
  network: NetworkType = 'testnet',
  session: any
): Promise<TransactionResult> => {
  const actions = producers.map(producer => ({
    account: 'eosio',
    name: 'voteproducer',
    authorization: [{ actor: session.auth.actor, permission: 'owner' }],
    
    data: {
      voter: accountName,
      proxy: '',
      producers: [producer]
    }
  }));

  const result = await session.transact({ actions }, {
    blocksBehind: 3,
    expire: 30
  });

  return result;
};
```

#### Token Transfer Implementation
```typescript
export const transferTokens = async (
  transferData: TransferData,
  session: any,
  network: NetworkType
): Promise<TransactionResult> => {
  const action = {
    account: transferData.contract || 'eosio.token',
    name: 'transfer',
    authorization: [{
      actor: transferData.from,
      permission: transferData.permission || 'owner'
    }],
    data: {
      from: transferData.from,
      to: transferData.to,
      quantity: transferData.quantity,
      memo: transferData.memo || ''
    }
  };

  const result = await session.transact({ actions: [action] }, {
    blocksBehind: 3,
    expireSeconds: 30
  });

  return result;
};
```

#### Resource Management
```typescript
export const stakeResources = async (
  accountName: string,
  stakeData: { cpu: number; net: number },
  network: NetworkType,
  session: any
): Promise<StakeResult> => {
  const { cpu, net } = stakeData;
  const totalAmount = cpu + net;

  const action = {
    account: 'eosio',
    name: 'stakexpr',
    authorization: [{ actor: session.auth.actor, permission: 'owner' }],
    data: {
      from: accountName,
      receiver: accountName,
      stake_xpr_quantity: `${totalAmount.toFixed(4)} XPR`
    }
  };

  const result = await session.transact({ actions: [action] }, {
    blocksBehind: 3,
    expireSeconds: 30
  });

  return {
    transactionId: result.transaction_id,
    totalStaked: totalAmount
  };
};
```

### Wallet Integration Patterns

#### Proton SDK Connection
```typescript
export const connectWallet = async (
  network: NetworkType = 'testnet'
): Promise<WalletInstance> => {
  const config = getNetworkConfig(network);
  
  const linkOptions = {
    chains: [{
      chainId: config.chainId,
      endpoints: config.endpoints
    }],
    restoreSession: true,
    requestAccount: config.appName
  };

  const link = await ProtonSDK();
  const result = await link.login(linkOptions);

  if (!result.session) {
    throw new Error('Wallet connection failed');
  }

  return {
    link,
    session: result.session,
    account: await getAccountInfo(result.session.auth.actor, network, result.session)
  };
};
```

## Security Implementation

### Input Validation
```typescript
export const validateAccountName = (accountName: string): boolean => {
  const regex = /^[a-z1-5]{4,30}$/;
  const contractRegex = /^[a-z1-5.]{4,30}$/;
  return regex.test(accountName) || contractRegex.test(accountName);
};

export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};
```

### Transaction Security
```typescript
export class TransactionVerifier {
  static verifyTransactionData(transaction: any): boolean {
    const requiredFields = ['actions'];
    const optionalFields = ['expiration', 'ref_block_num', 'ref_block_prefix'];

    // Validate required fields
    for (const field of requiredFields) {
      if (!transaction[field]) {
        console.error(`[Security] Missing required field: ${field}`);
        return false;
      }
    }

    // Log missing optional fields
    for (const field of optionalFields) {
      if (!transaction[field]) {
        console.log(`[Security] Optional field not present: ${field} (ProtonSDK may handle automatically)`);
      }
    }

    return true;
  }
}
```

## Testing Framework

### Unit Testing Configuration
```typescript
// jest.config.js
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  }
};
```

### Component Testing Pattern
```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ComponentName from './ComponentName';

describe('ComponentName', () => {
  test('renders component correctly', () => {
    render(<ComponentName />);
    const element = screen.getByText('Expected Text');
    expect(element).toBeInTheDocument();
  });

  test('handles user interactions', () => {
    const mockHandler = jest.fn();
    render(<ComponentName onAction={mockHandler} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockHandler).toHaveBeenCalled();
  });
});
```

## Performance Optimization

### Code Splitting Implementation
```typescript
// Lazy component loading
const LazyComponent = React.lazy(() => import('./HeavyComponent'));

const App = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <LazyComponent />
  </Suspense>
);
```

### Caching Strategy
```typescript
export class DataService {
  private cache = new Map<string, { data: any; timestamp: number }>();

  async getCachedData(key: string, fetcher: () => Promise<any>, ttl: number = 10000) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }
}
```

## Progressive Web App (PWA) Features

### PWA Configuration

The application includes comprehensive PWA support with offline capabilities, installability, and native app-like experience.

#### Manifest Configuration
```json
{
  "name": "XPR Delegation Demo",
  "short_name": "XPR Delegate",
  "description": "Delegate votes to Block Producers on XPR Network",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "portrait-primary",
  "scope": "/",
  "lang": "en-US",
  "categories": ["finance", "business", "productivity"]
}
```

#### Service Worker Implementation
```javascript
// public/sw.js - Service Worker for caching and offline support
const CACHE_NAME = 'xpr-delegation-demo-cache-v1';

const FILES_TO_CACHE = [
  '/', 
  '/index.html', 
  '/manifest.json', 
  '/logo/favicon.ico',
  '/logo/logo-192x192.png',
  '/logo/logo-512x512.png'
];

// Install event: cache static assets
self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Pre-caching offline assets');
        return cache.addAll(FILES_TO_CACHE);
      })
  );
  self.skipWaiting();
});

// Fetch event: serve from cache or network
self.addEventListener('fetch', evt => {
  // Skip API requests - let them go directly to network
  if (
    evt.request.url.includes('/v1/chain/') ||
    evt.request.url.includes('api.protonnz.com') ||
    evt.request.url.includes('anchor.link')
  ) {
    return; // Let API requests pass through
  }

  evt.respondWith(
    caches.match(evt.request)
      .then(response => {
        if (response) {
          return response; // Return cached response
        }
        return fetch(evt.request); // Fetch from network
      })
  );
});
```

#### PWA Registration
```javascript
// index.html - Service Worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              if (confirm('New version available! Reload to update?')) {
                window.location.reload();
              }
            }
          });
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
```

#### Install Prompt Handling
```javascript
// PWA Install Prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // Show install button
  const installButton = document.createElement('div');
  installButton.innerHTML = '📱 Install XPR Delegation Demo';
  installButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    background: #2563eb;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    z-index: 1000;
  `;
  
  installButton.addEventListener('click', () => {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted PWA install');
      }
      deferredPrompt = null;
      installButton.remove();
    });
  });
  
  document.body.appendChild(installButton);
  
  // Auto-hide after 10 seconds
  setTimeout(() => installButton.remove(), 10000);
});
```

### PWA Features

#### Offline Capabilities
- **Static Asset Caching**: HTML, CSS, JS, and images cached for offline use
- **API Request Handling**: Blockchain API requests bypass cache for real-time data
- **Fallback Strategy**: Graceful degradation when network is unavailable

#### Installability
- **App Shortcuts**: Quick access to Connect Wallet and View Validators
- **Edge Side Panel**: Optimized for Microsoft Edge side panel
- **Mobile Installation**: Full mobile app experience on iOS and Android

#### Background Features
- **Push Notifications**: Support for transaction notifications
- **Background Sync**: Vote synchronization when connection is restored
- **Update Management**: Automatic update detection and user prompts

#### Performance Benefits
- **Faster Loading**: Cached assets load instantly
- **Reduced Data Usage**: Cached resources don't require re-download
- **Native App Feel**: Standalone display mode and app-like navigation

## Deployment Considerations

### Build Optimization
```javascript
// vite.config.js production optimizations
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          blockchain: ['@proton/web-sdk'],
          utils: ['zustand']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
};
```

### Environment Configuration
```typescript
// Environment-specific configurations
const configs = {
  development: {
    logLevel: 'debug',
    apiEndpoints: ['http://localhost:3000']
  },
  production: {
    logLevel: 'error',
    apiEndpoints: ['https://api.protonnz.com']
  }
};
```

## Troubleshooting Guide

### Common Development Issues

#### TypeScript Errors
- **Error**: `Cannot find module 'react-helmet-async'`
- **Solution**: Install missing dependencies: `npm install react-helmet-async`

#### Build Failures
- **Error**: Module resolution failures
- **Solution**: Clear cache and reinstall: `rm -rf node_modules package-lock.json && npm install`

#### Wallet Connection Issues
- **Error**: CSP violations for WebSocket connections
- **Solution**: Update vite.config.js with proper CSP headers

### Debugging Techniques
```typescript
// Development debugging utilities
export const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG] ${message}`, data);
  }
};

// Error boundary implementation
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong.</div>;
    }

    return this.props.children;
  }
}
```

## Contributing Guidelines

### Code Review Checklist
- [ ] TypeScript types properly defined
- [ ] ESLint errors resolved
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Security implications reviewed
- [ ] Performance considerations addressed

### Pull Request Process
1. **Feature Branch**: Create from `main` branch
2. **Development**: Implement feature with tests
3. **Quality Check**: Run all quality checks (`npm run quality`)
4. **Review**: Submit for peer review
5. **Merge**: Merge approved changes to `main`

For additional technical details, please refer to the [Technical Deep Dive](TECHNICAL_DEEP_DIVE.md) documentation.