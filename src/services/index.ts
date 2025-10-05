/**
 * Services Barrel Export
 *
 * Centralized export point for all service modules.
 * Simplifies imports across the application.
 *
 * @fileoverview Services index for XPR Delegation Demo
 */

// Wallet services
export {
  connectWallet,
  checkExistingSession,
  disconnectWallet,
} from './wallet';
export { initializeSDK, getSDKInstance } from './sdk';

// Blockchain services
export {
  getAccountInfo,
  getBlockProducers,
  delegateVotes,
  getVoteInfo,
  checkVotingResources,
  getCurrencyBalance,
  stakeResources,
  unstakeResources,
  getCoreSymbol,
  clearCache,
  BlockchainError,
  RpcError,
  ValidationError,
} from './blockchain';

// Default exports
export { default as walletService } from './wallet';
export { default as sdkService } from './sdk';
export { default as blockchainService } from './blockchain';
