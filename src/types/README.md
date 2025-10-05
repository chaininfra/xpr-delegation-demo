# Types Directory

This directory contains all TypeScript type definitions for the XPR Delegation Demo application.

## Structure

- `index.ts` - Main type definitions file containing all application interfaces and types

## Type Categories

### Core Types
- `AccountInfo` - User account structure
- `BlockProducer` - Block producer information
- `NetworkConfig` - Network configuration
- `NetworkType` - Supported network types

### Voting & Staking
- `VoteInfo` - Vote information structure
- `VotingResources` - Resource requirements for voting
- `StakeData` - Staking operation data

### SDK Types
- `ProtonSession` - Proton SDK session interface
- `ProtonWebLink` - Proton WebLink interface
- `RpcClient` - RPC client interface

### Component Props
- `VoteInfoProps` - Vote info component props
- `BlockProducerSelectorProps` - Block producer selector props
- `WalletConnectionProps` - Wallet connection props
- `HomePageProps` - Home page component props
- `NetworkSelectorProps` - Network selector props
- `StakeResourcesProps` - Staking resources props

### UI Types
- `WalletInstance` - Wallet instance structure
- `Message` - User feedback messages
- `LoadingState` - Component loading states
- `PerformanceMetrics` - Performance monitoring

## Usage

Import types from the main index file:

```typescript
import type { 
  AccountInfo, 
  NetworkType, 
  VoteInfo 
} from '../types';

// Or import specific interfaces
import type { HomePageProps } from '../types';
```

## Adding New Types

When adding new types:

1. Follow the existing categorization structure
2. Add comprehensive JSDoc comments
3. Use strict typing (avoid `any` when possible)
4. Consider backward compatibility for interface changes
5. Update this README if adding new major categories
