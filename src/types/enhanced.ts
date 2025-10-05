/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Enhanced Type Definitions for XPR Delegation Demo
 *
 * Provides comprehensive type definitions to improve type safety
 * and reduce the use of 'any' types throughout the application.
 *
 * @fileoverview Enhanced type definitions for better TypeScript safety
 */

/**
 * RPC Client Interface
 * Defines the structure of RPC client methods
 */
export interface RpcClient {
  get_account: (accountName: string) => Promise<any>;
  get_producers: (options?: Record<string, unknown>) => Promise<any>;
  get_table_rows: (options: TableRowsOptions) => Promise<any>;
  get_currency_balance: (
    contract: string,
    account: string,
    symbol?: string | null
  ) => Promise<any>;
}

/**
 * Table Rows Options Interface
 */
export interface TableRowsOptions {
  code: string;
  table: string;
  scope?: string;
  lower_bound?: string;
  upper_bound?: string;
  limit?: number;
  json?: boolean;
  reverse?: boolean;
  show_payer?: boolean;
}

/**
 * Session Data Interface
 * Defines the structure of wallet session data
 */
export interface SessionData {
  auth: {
    actor: string;
    permission: string;
  };
  rpc?: RpcClient;
  transact?: (
    transaction: TransactionData,
    options?: TransactionOptions
  ) => Promise<TransactionResult>;
  remove?: () => Promise<void>;
}

/**
 * Transaction Data Interface
 */
export interface TransactionData {
  actions: ActionData[];
  expiration?: string;
  ref_block_num?: number;
  ref_block_prefix?: number;
}

/**
 * Action Data Interface
 */
export interface ActionData {
  account: string;
  name: string;
  authorization: AuthorizationData[];
  data: Record<string, unknown>;
}

/**
 * Authorization Data Interface
 */
export interface AuthorizationData {
  actor: string;
  permission: string;
}

/**
 * Transaction Options Interface
 */
export interface TransactionOptions {
  blocksBehind?: number;
  expireSeconds?: number;
}

/**
 * Transaction Result Interface
 */
export interface TransactionResult {
  transaction_id?: string;
  id?: string;
  processed?: {
    block_num?: number;
    receipt?: {
      status?: string;
    };
    trx?: {
      id?: string;
    };
  };
}

/**
 * Wallet Instance Interface
 */
export interface WalletInstance {
  session: SessionData;
  account: {
    account_name: string;
    core_liquid_balance: string;
    ram_quota: number;
    net_weight: string;
    cpu_weight: string;
  };
}

/**
 * Transfer Data Interface
 */
export interface TransferData {
  from: string;
  to: string;
  quantity: string;
  memo: string;
  contract: string;
  permission: string;
}

/**
 * Token Balance Interface
 */
export interface TokenBalance {
  contract: string;
  symbol: string;
  precision: number;
  amount: string;
  formatted: string;
}

/**
 * Network Configuration Interface
 */
export interface NetworkConfig {
  endpoints: string[];
  chainId: string;
  appName: string;
}

/**
 * Cache Entry Interface
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  priority: 'low' | 'medium' | 'high';
}

/**
 * Memory Statistics Interface
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
 * Health Status Interface
 */
export interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical';
  memoryUsage: number;
  efficiency: number;
  recommendations: string[];
}

/**
 * Retry Options Interface
 */
export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryCondition?: (error: unknown) => boolean;
}

/**
 * Circuit Breaker State Type
 */
export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/**
 * Message Type Interface
 */
export interface Message {
  type: 'success' | 'error' | 'warning' | 'info';
  text: string;
}

/**
 * Account Info Interface
 */
export interface AccountInfo {
  account_name: string;
  core_liquid_balance: string;
  ram_quota: number;
  net_weight: string;
  cpu_weight: string;
  total_resources?: {
    owner: string;
    net_weight: string;
    cpu_weight: string;
    ram_bytes: number;
  };
  voter_info?: {
    owner: string;
    proxy: string;
    producers: string[];
    staked: number;
    last_vote_weight: string;
    proxied_vote_weight: string;
    is_proxy: number;
  };
}

/**
 * Block Producer Interface
 */
export interface BlockProducer {
  name: string;
  url: string;
  is_active: boolean;
  total_votes: string;
  producer_key: string;
  unpaid_blocks: number;
  last_claim_time: string;
  location: number;
}

/**
 * Vote Info Interface
 */
export interface VoteInfo {
  owner: string;
  proxy: string;
  producers: string[];
  staked: number;
  last_vote_weight: string;
  proxied_vote_weight: string;
  is_proxy: number;
}

/**
 * Voting Resources Interface
 */
export interface VotingResources {
  canVote: boolean;
  cpuAvailable: boolean;
  netAvailable: boolean;
  ramAvailable: boolean;
  cpuUsage: number;
  netUsage: number;
  ramUsage: number;
}

/**
 * Stake Data Interface
 */
export interface StakeData {
  account: string;
  cpuAmount: string;
  netAmount: string;
  totalAmount: string;
}

/**
 * Network Type Union
 */
export type NetworkTypeUnion = 'testnet' | 'mainnet';

/**
 * Utility type for making all properties optional
 */
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

/**
 * Utility type for making all properties required
 */
export type Required<T> = {
  [P in keyof T]-?: T[P];
};

/**
 * Utility type for picking specific properties
 */
export type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

/**
 * Utility type for omitting specific properties
 */
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
