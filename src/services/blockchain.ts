/**
 * XPR Network Blockchain Service
 *
 * Core service layer for interacting with XPR Network blockchain.
 * Provides functions for account management, voting, and resource operations.
 *
 * Features:
 * - Account information retrieval
 * - Block producer management
 * - Vote delegation operations
 * - Resource staking/unstaking
 * - RPC client with failover support
 * - Caching for performance optimization
 * - Comprehensive error handling
 *
 * @fileoverview Blockchain service for XPR Delegation Demo
 */
/* eslint-disable @typescript-eslint/no-explicit-any, no-console */
import { getNetworkConfig, SAMPLE_BLOCK_PRODUCERS } from '../config/networks';
import { createDefaultAccountInfo } from '../utils/helpers';
import {
  validateAccountName,
  validateNetwork,
  validateAmount,
} from '../utils/security';
import {
  globalRateLimiter,
  transactionVerifier,
} from '../utils/security-hardening';
import type {
  AccountInfo,
  BlockProducer,
  NetworkType,
  VoteInfo,
  VotingResources,
} from '../types';
import { smartCache, CacheKeys, CacheDependencies } from '../utils/SmartCache';
import { extractTransactionId } from '../utils/transactionUtils';
import {
  retryWithBackoff,
  createRateLimitedFetch,
  CircuitBreaker,
} from '../utils/retryUtils';

/**
 * Custom error classes for better error handling and debugging
 */
export class BlockchainError extends Error {
  public type: string;

  constructor(message: string, type = 'BLOCKCHAIN_ERROR') {
    super(message);
    this.type = type;
    this.name = 'BlockchainError';
  }
}

export class RpcError extends BlockchainError {
  public endpoint?: string;

  constructor(message: string, endpoint?: string) {
    super(message, 'RPC_ERROR');
    this.endpoint = endpoint;
  }
}

export class ValidationError extends BlockchainError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
  }
}

// Cache for frequently accessed data to improve performance
const cache = new Map<string, { data: unknown; timestamp: number }>();

/**
 * Input validation utilities for data integrity
 */
const validateAccountNameInput = (accountName: string): void => {
  if (!validateAccountName(accountName)) {
    throw new ValidationError('Invalid account name format');
  }
};

const validateNetworkInput = (network: string): void => {
  if (!validateNetwork(network)) {
    throw new ValidationError(`Network must be one of: testnet, mainnet`);
  }
};

// Global circuit breaker for API calls
const apiCircuitBreaker = new CircuitBreaker(5, 30000);

// Rate-limited fetch function
const rateLimitedFetch = createRateLimitedFetch(150); // 150ms delay between requests

// RPC client creation with failover support and security validation
const createRpcClient = async (endpoint: string) => {
  return {
    get_account: async (accountName: string) => {
      // Rate limiting check
      const rateLimitKey = `get_account_${accountName}`;
      const isAllowed = await globalRateLimiter.isAllowed(rateLimitKey);
      if (!isAllowed) {
        throw new RpcError(
          `Rate limit exceeded for get_account: ${accountName}`,
          endpoint
        );
      }

      return apiCircuitBreaker.execute(async () => {
        return retryWithBackoff(async () => {
          const response = await rateLimitedFetch(
            `${endpoint}/v1/chain/get_account`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ account_name: accountName }),
            }
          );
          return response.json();
        });
      });
    },

    get_producers: async (options: Record<string, unknown> = {}) => {
      // Rate limiting check
      const rateLimitKey = 'get_producers';
      const isAllowed = await globalRateLimiter.isAllowed(rateLimitKey);
      if (!isAllowed) {
        throw new RpcError('Rate limit exceeded for get_producers', endpoint);
      }

      return apiCircuitBreaker.execute(async () => {
        return retryWithBackoff(async () => {
          const response = await rateLimitedFetch(
            `${endpoint}/v1/chain/get_producers`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ limit: 30, json: true, ...options }),
            }
          );
          return response.json();
        });
      });
    },

    get_table_rows: async (options: any) => {
      return apiCircuitBreaker.execute(async () => {
        return retryWithBackoff(async () => {
          const response = await rateLimitedFetch(
            `${endpoint}/v1/chain/get_table_rows`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(options),
            }
          );
          return response.json();
        });
      });
    },

    get_currency_balance: async (
      contract: string,
      account: string,
      symbol: string | null = null
    ) => {
      // Validate inputs
      if (!contract || typeof contract !== 'string') {
        throw new ValidationError('Contract name must be a non-empty string.');
      }
      if (!account || typeof account !== 'string') {
        throw new ValidationError('Account name must be a non-empty string.');
      }

      const requestBody: any = {
        code: contract,
        account: account,
        symbol: symbol,
      };

      return apiCircuitBreaker.execute(async () => {
        return retryWithBackoff(async () => {
          const response = await rateLimitedFetch(
            `${endpoint}/v1/chain/get_currency_balance`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody),
            }
          );
          return response.json();
        });
      });
    },
  };
};

/**
 * Get an RPC client instance, with failover to multiple endpoints
 * @param network - Network name (testnet/mainnet)
 * @returns RPC client with blockchain interaction methods
 * @throws {RpcError} If all RPC endpoints fail
 */
const getRpcClient = async (network: NetworkType) => {
  const config = getNetworkConfig(network);
  for (const endpoint of config.endpoints) {
    try {
      // Test endpoint connectivity
      await fetch(`${endpoint}/v1/chain/get_info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return await createRpcClient(endpoint);
    } catch {
      // Endpoint failed - try next one
    }
  }
  throw new RpcError(
    `All RPC endpoints for ${network} failed.`,
    config.endpoints.join(', ')
  );
};

/**
 * Clear specific or all caches
 * @param key - Specific cache key to clear, or clear all if not provided
 */
export const clearCache = (key?: string): void => {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
};

/**
 * Get comprehensive account information using smart caching
 * Only makes API calls when data is stale or missing
 * @param accountName - Account name
 * @param network - Network name (testnet/mainnet)
 * @param session - Optional session from connected wallet
 * @returns Account information
 * @throws {BlockchainError} If fetching account info fails
 */
export const getAccountInfo = async (
  accountName: string,
  network: NetworkType = 'testnet',
  session: any = null
): Promise<AccountInfo> => {
  validateAccountNameInput(accountName);
  validateNetworkInput(network);

  const cacheKey = CacheKeys.account(accountName, network);

  return smartCache.getWithRefresh(
    cacheKey,
    async () => {
      let rpc;
      if (session && session.rpc) {
        rpc = session.rpc;
      } else {
        rpc = await getRpcClient(network);
      }

      try {
        const accountData = await rpc.get_account(accountName);

        // Fetch all token balances from eosio.token accounts table
        const balances = await rpc.get_table_rows({
          code: 'eosio.token',
          scope: accountName,
          table: 'accounts',
          json: true,
        });

        const allBalances = balances.rows.map((row: any) => row.balance);
        const coreLiquidBalance =
          allBalances.find((balance: string) => balance.includes('XPR')) ||
          '0.0000 XPR';

        const fullAccountInfo: AccountInfo = {
          ...createDefaultAccountInfo(accountName),
          ...accountData,
          core_liquid_balance: coreLiquidBalance,
          all_balances: allBalances,
          cpu_limit: accountData.cpu_limit || { used: 0, max: 0 },
          net_limit: accountData.net_limit || { used: 0, max: 0 },
        };

        return fullAccountInfo;
      } catch {
        // Return default structure on error to prevent app crash
        return createDefaultAccountInfo(accountName);
      }
    },
    {
      ttl: 5 * 60 * 1000, // 5 minutes
      priority: 'high',
      dependencies: [CacheDependencies.account],
    }
  );
};

/**
 * Get list of Block Producers using smart caching
 * Only refreshes when data is stale or missing
 * @param network - Network name (testnet/mainnet)
 * @param session - Optional session from connected wallet
 * @returns Array of Block Producers
 * @throws {BlockchainError} If fetching block producers fails
 */
export const getBlockProducers = async (
  network: NetworkType = 'testnet',
  session: any = null
): Promise<BlockProducer[]> => {
  validateNetworkInput(network);

  const cacheKey = CacheKeys.blockProducers(network);

  return smartCache.getWithRefresh(
    cacheKey,
    async () => {
      let rpc;
      if (session && session.rpc) {
        rpc = session.rpc;
      } else {
        rpc = await getRpcClient(network);
      }

      try {
        const producersResponse = await rpc.get_producers({
          limit: 30,
          json: true,
          reverse: true,
          index_position: 2,
        });

        const producers: BlockProducer[] = producersResponse.rows.map(
          (p: any) => ({
            name: p.owner,
            url: p.url,
            total_votes: p.total_votes,
          })
        );

        return producers;
      } catch {
        // Fallback to sample data on error
        return SAMPLE_BLOCK_PRODUCERS[network] || [];
      }
    },
    {
      ttl: 10 * 60 * 1000, // 10 minutes (producers change less frequently)
      priority: 'medium',
      dependencies: [CacheDependencies.blockProducers],
    }
  );
};

/**
 * Delegate votes to a Block Producer
 * @param accountName - Account name delegating votes
 * @param producerName - Name of the Block Producer to vote for
 * @param network - Network name (testnet/mainnet)
 * @param session - Session object from ConnectWallet
 * @returns Transaction result
 * @throws {ValidationError|BlockchainError} If validation fails or transaction fails
 */
export const delegateVotes = async (
  accountName: string,
  producerNames: string | string[], // Support both single producer and multiple producers
  network: NetworkType = 'testnet',
  session: any = null
): Promise<{ transactionId: string; blockNum: number; status: string }> => {
  validateAccountNameInput(accountName);
  validateNetworkInput(network);

  // Convert to array if single producer
  const producers = Array.isArray(producerNames)
    ? producerNames
    : [producerNames];

  // Validate producers array
  if (producers.length === 0) {
    throw new ValidationError('At least one producer must be specified');
  }

  if (producers.length > 4) {
    throw new ValidationError('Maximum 4 producers can be selected');
  }

  // Validate each producer name
  producers.forEach(producer => {
    validateAccountNameInput(producer);
  });

  if (!session) {
    throw new ValidationError(
      'Session is required for voting. Please connect your wallet first.'
    );
  }

  // Pre-flight check for voting resources
  await getAccountInfo(accountName, network, session);
  const votingResources = await checkVotingResources(
    accountName,
    network,
    session
  );

  if (!votingResources.canVote) {
    throw new BlockchainError(
      'Insufficient resources to vote. Please stake more CPU/NET.'
    );
  }

  try {
    const actions = [
      {
        account: 'eosio',
        name: 'voteproducer',
        authorization: [
          {
            actor: session.auth.actor,
            permission: session.auth.permission, // Use the actual session permission
          },
        ],
        data: {
          voter: accountName,
          proxy: '', // Empty proxy means direct voting
          producers: producers.sort(), // Use the producers array
        },
      },
    ];

    // Verify transaction data integrity
    if (!transactionVerifier.verifyTransactionData({ actions })) {
      throw new ValidationError('Invalid transaction data');
    }

    const result = await session.transact(
      {
        actions,
      },
      {
        blocksBehind: 3,
        expireSeconds: 30,
      }
    );

    // Debug: Log the full result structure to understand ProtonSDK response
    console.log('[Blockchain] Full transaction result:', result);
    console.log('[Blockchain] Transaction result structure:', {
      transaction_id: result.transaction_id,
      id: result.id,
      processed: result.processed,
      keys: Object.keys(result),
      type: typeof result,
    });

    // Verify transaction signature after execution
    if (
      result.transaction &&
      !(await transactionVerifier.verifySignature(
        result.transaction,
        session.auth.actor
      ))
    ) {
      throw new BlockchainError('Transaction signature verification failed');
    }

    clearCache(`producers-${network}`); // Clear producers cache to refresh vote counts
    clearCache(`account-${accountName}-${network}`); // Clear account cache to refresh vote info

    // Extract transaction ID with comprehensive fallbacks
    const transactionId = extractTransactionId(result);

    return {
      transactionId,
      blockNum: result.processed?.block_num || 0,
      status: result.processed?.receipt?.status || 'success',
    };
  } catch (error: unknown) {
    // Error delegating votes
    throw new BlockchainError(
      `Failed to delegate votes: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
};

/**
 * Get current vote information for an account using RPC client
 * @param accountName - Account name
 * @param network - Network name (testnet/mainnet)
 * @param session - Optional session from connected wallet
 * @returns Vote information
 * @throws {BlockchainError} If fetching vote info fails
 */
export const getVoteInfo = async (
  accountName: string,
  network: NetworkType = 'testnet',
  session: any = null
): Promise<VoteInfo | null> => {
  validateAccountNameInput(accountName);
  validateNetworkInput(network);

  let rpc;

  // Use session RPC if available, otherwise use fallback RPC client
  if (session && session.rpc) {
    try {
      rpc = session.rpc;
    } catch {
      // Session RPC error, using fallback
      rpc = await getRpcClient(network);
    }
  } else {
    rpc = await getRpcClient(network);
  }

  try {
    // Get voter information from the blockchain
    const voterInfo = await rpc.get_table_rows({
      code: 'eosio',
      scope: 'eosio',
      table: 'voters',
      lower_bound: accountName,
      upper_bound: accountName,
      limit: 1,
      json: true,
    });

    if (voterInfo.rows && voterInfo.rows.length > 0) {
      const voter = voterInfo.rows[0];
      return {
        owner: voter.owner,
        proxy: voter.proxy,
        producers: voter.producers,
        last_vote_weight: voter.last_vote_weight,
        last_vote_time: voter.last_vote_time,
        staked: voter.staked,
      };
    }

    return null;
  } catch (error: unknown) {
    // Error getting vote info
    throw new BlockchainError(
      `Failed to get vote info: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
};

/**
 * Check if account has sufficient resources for voting
 * @param accountName - Account name
 * @param network - Network name (testnet/mainnet)
 * @param session - Optional session from connected wallet
 * @returns Object indicating if account can vote and resource details
 * @throws {BlockchainError} If checking voting resources fails
 */
export const checkVotingResources = async (
  accountName: string,
  network: NetworkType = 'testnet',
  session: any = null
): Promise<VotingResources> => {
  validateAccountNameInput(accountName);
  validateNetworkInput(network);

  try {
    const account = await getAccountInfo(accountName, network, session);

    const minCpu = 1000; // Example minimum CPU in microseconds
    const minNet = 1000; // Example minimum NET in bytes

    const cpuAvailable = account.cpu_limit.max - account.cpu_limit.used;
    const netAvailable = account.net_limit.max - account.net_limit.used;
    const ramAvailable = account.ram_quota - account.ram_usage;

    const canVote = cpuAvailable >= minCpu && netAvailable >= minNet;

    return {
      canVote,
      cpuAvailable,
      netAvailable,
      ramAvailable,
      minCpuRequired: minCpu,
      minNetRequired: minNet,
    };
  } catch (error: unknown) {
    // Error checking voting resources
    throw new BlockchainError(
      `Failed to check voting resources: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
};

/**
 * Get currency balance for a specific token
 * @param accountName - Account name
 * @param symbol - Token symbol (e.g., 'XPR', 'USDC')
 * @param network - Network name (testnet/mainnet)
 * @param session - Optional session from connected wallet
 * @returns Formatted balance string (e.g., "10.0000 XPR")
 * @throws {BlockchainError} If fetching currency balance fails
 */
export const getCurrencyBalance = async (
  accountName: string,
  symbol: string,
  network: NetworkType = 'testnet',
  session: any = null
): Promise<string> => {
  validateAccountNameInput(accountName);
  validateNetworkInput(network);

  let rpc;
  if (session && session.rpc) {
    rpc = session.rpc;
  } else {
    rpc = await getRpcClient(network);
  }

  try {
    const balances = await rpc.get_table_rows({
      code: 'eosio.token',
      scope: accountName,
      table: 'accounts',
      lower_bound: symbol.toUpperCase(),
      upper_bound: symbol.toUpperCase(),
      limit: 1,
      json: true,
    });

    if (balances.rows && balances.rows.length > 0) {
      return balances.rows[0].balance;
    }
    return `0.0000 ${symbol.toUpperCase()}`;
  } catch {
    // Error getting currency balance - using default
    return `0.0000 ${symbol.toUpperCase()}`; // Return default balance on error
  }
};

/**
 * Stake XPR tokens for network resources
 * @param accountName - Account name
 * @param stakeData - {cpu: number, net: number} in XPR (cpu = total amount, net = 0 for compatibility)
 * @param network - Network name (testnet/mainnet)
 * @param session - Session object from ConnectWallet
 * @returns Transaction result
 * @throws {ValidationError|BlockchainError} If validation fails or transaction fails
 */
export const stakeResources = async (
  accountName: string,
  stakeData: { cpu: number; net: number },
  network: NetworkType = 'testnet',
  session: any = null
): Promise<{ transactionId: string; actions: number; totalStaked: number }> => {
  validateAccountNameInput(accountName);
  validateNetworkInput(network);

  if (!session) {
    throw new ValidationError(
      'Session is required for staking. Please connect your wallet first.'
    );
  }

  const { cpu, net } = stakeData;
  const totalAmount = cpu + net;

  if (!validateAmount(totalAmount)) {
    throw new ValidationError('Invalid stake amount');
  }

  const actions = [];
  const authToUse = {
    actor: session.auth.actor,
    permission: 'owner', // Use 'owner' permission for staking/unstaking
  };

  // Use 'stakexpr' action for staking XPR tokens
  actions.push({
    account: 'eosio',
    name: 'stakexpr',
    authorization: [authToUse],
    data: {
      from: accountName,
      receiver: accountName,
      stake_xpr_quantity: `${totalAmount.toFixed(4)} XPR`,
    },
  });

  // Execute transaction using existing session
  const transaction = { actions };

  // Verify transaction data integrity
  if (!transactionVerifier.verifyTransactionData(transaction)) {
    throw new ValidationError('Invalid transaction data for staking');
  }

  const result = await session.transact(transaction, {
    blocksBehind: 3,
    expireSeconds: 30,
  });

  // Debug: Log the full result structure for staking
  console.log('[Blockchain] Stake transaction result:', result);
  console.log('[Blockchain] Stake result keys:', Object.keys(result));

  // Verify transaction signature after execution
  if (
    result.transaction &&
    !(await transactionVerifier.verifySignature(
      result.transaction,
      session.auth.actor
    ))
  ) {
    throw new BlockchainError(
      'Stake transaction signature verification failed'
    );
  }

  // Extract transaction ID with comprehensive fallbacks
  const transactionId = extractTransactionId(result);

  return {
    transactionId,
    actions: actions.length,
    totalStaked: totalAmount,
  };
};

/**
 * Unstake XPR tokens from network resources
 * @param accountName - Account name
 * @param unstakeData - {cpu: number, net: number} in XPR (cpu = total amount, net = 0 for compatibility)
 * @param network - Network name (testnet/mainnet)
 * @param session - Session object from ConnectWallet
 * @returns Transaction result
 * @throws {ValidationError|BlockchainError} If validation fails or transaction fails
 */
export const unstakeResources = async (
  accountName: string,
  unstakeData: { cpu: number; net: number },
  network: NetworkType = 'testnet',
  session: any = null
): Promise<{
  transactionId: string;
  actions: number;
  totalUnstaked: number;
}> => {
  validateAccountNameInput(accountName);
  validateNetworkInput(network);

  if (!session) {
    throw new ValidationError(
      'Session is required for unstaking. Please connect your wallet first.'
    );
  }

  const { cpu, net } = unstakeData;
  const totalAmount = cpu + net;

  if (!validateAmount(totalAmount)) {
    throw new ValidationError('Invalid unstake amount');
  }

  const actions = [];
  const authToUse = {
    actor: session.auth.actor,
    permission: 'owner', // Use 'owner' permission for staking/unstaking
  };

  // Use 'unstakexpr' action for unstaking XPR tokens
  actions.push({
    account: 'eosio',
    name: 'unstakexpr',
    authorization: [authToUse],
    data: {
      from: accountName,
      receiver: accountName,
      unstake_xpr_quantity: `${totalAmount.toFixed(4)} XPR`,
    },
  });

  // Execute transaction using existing session
  const transaction = { actions };

  // Verify transaction data integrity
  if (!transactionVerifier.verifyTransactionData(transaction)) {
    throw new ValidationError('Invalid transaction data for unstaking');
  }

  const result = await session.transact(transaction, {
    blocksBehind: 3,
    expireSeconds: 30,
  });

  // Debug: Log the full result structure for unstaking
  console.log('[Blockchain] Unstake transaction result:', result);
  console.log('[Blockchain] Unstake result keys:', Object.keys(result));

  // Verify transaction signature after execution
  if (
    result.transaction &&
    !(await transactionVerifier.verifySignature(
      result.transaction,
      session.auth.actor
    ))
  ) {
    throw new BlockchainError(
      'Unstake transaction signature verification failed'
    );
  }

  // Extract transaction ID with comprehensive fallbacks
  const transactionId = extractTransactionId(result);

  return {
    transactionId,
    actions: actions.length,
    totalUnstaked: totalAmount,
  };
};

/**
 * Get the core symbol of the network (e.g., 'XPR', 'SYS')
 * @param network - Network name (testnet/mainnet)
 * @returns Core symbol
 */
export const getCoreSymbol = async (
  network: NetworkType = 'testnet'
): Promise<string> => {
  try {
    validateNetworkInput(network);
    const rpc = await getRpcClient(network);

    const res = await rpc.get_table_rows({
      json: true,
      code: 'eosio.token',
      scope: 'XPR',
      table: 'stat',
      limit: 1,
    });

    if (res.rows && res.rows.length > 0) {
      const row = res.rows[0];
      const supply = row.supply;

      if (supply && typeof supply === 'string') {
        const symbol = supply.split(' ')[1];
        return symbol || 'XPR';
      }
    }

    return 'XPR'; // Fallback
  } catch {
    // Error getting core symbol
    return 'XPR';
  }
};

export default {
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
};
