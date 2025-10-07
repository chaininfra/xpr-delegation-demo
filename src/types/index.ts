/**
 * XPR Delegation Demo - Type Definitions
 *
 * Comprehensive TypeScript type definitions for the application.
 * Ensures type safety across components, services, and utilities.
 *
 * @fileoverview Type definitions for XPR Delegation Demo
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

// =============================================================================
// CORE WALLET & ACCOUNT TYPES
// =============================================================================

/**
 * Account information structure
 */
export interface AccountInfo {
  /** Account name identifier */
  account_name: string;
  /** Liquid XPR balance */
  core_liquid_balance: string;
  /** All token balances */
  all_balances: string[];
  /** RAM usage in bytes */
  ram_usage: number;
  /** RAM quota in bytes */
  ram_quota: number;
  /** CPU resource limits */
  cpu_limit: {
    used: number;
    max: number;
  };
  /** NET resource limits */
  net_limit: {
    used: number;
    max: number;
  };
  /** Total staked resources */
  total_resources?: {
    cpu_weight: string;
    net_weight: string;
    ram_bytes?: number;
  };
  /** Additional voting information */
  vote_info?: VoteInfo;
  /** Voting resource requirements */
  voting_resources?: VotingResources;
}

/**
 * Block Producer information
 */
export interface BlockProducer {
  /** Producer name */
  name: string;
  /** Producer website URL */
  url: string;
  /** Total votes received */
  total_votes?: number;
}

/**
 * Network configuration options
 */
export interface NetworkConfig {
  /** Network display name */
  name: string;
  /** Blockchain chain ID */
  chainId: string;
  /** RPC endpoints */
  endpoints: string[];
  /** Application name */
  appName: string;
  /** WebAuth endpoint */
  webauth: string;
  /** Theme color */
  color: string;
}

/**
 * Network type definitions
 */
export type NetworkType = 'testnet' | 'mainnet';

// =============================================================================
// VOTING & STAKING TYPES
// =============================================================================

/**
 * Vote information structure
 */
export interface VoteInfo {
  /** Voter account name */
  owner: string;
  /** Proxy voter (if any) */
  proxy: string;
  /** Voted producers */
  producers: string[];
  /** Last vote weight */
  last_vote_weight: number;
  /** Last vote timestamp */
  last_vote_time: string;
  /** Total staked amount */
  staked: number;
}

/**
 * Voting resource requirements
 */
export interface VotingResources {
  /** Whether account can vote */
  canVote: boolean;
  /** Available CPU resource */
  cpuAvailable: number;
  /** Available NET resource */
  netAvailable: number;
  /** Available RAM resource */
  ramAvailable: number;
  /** Minimum CPU required */
  minCpuRequired: number;
  /** Minimum NET required */
  minNetRequired: number;
}

/**
 * XPR token staking data
 */
export interface StakeData {
  /** Total XPR amount to stake/unstake */
  cpu: number;
  /** Not used in XPR Network - kept for compatibility */
  net: number;
}

// =============================================================================
// PROTON SDK TYPES
// =============================================================================

/**
 * Proton SDK session interface
 */
export interface ProtonSession {
  /** Authentication details */
  auth: {
    actor: string;
    permission: string;
  };
  /** RPC client instance */
  rpc?: RpcClient;
  /** Transaction execution method */
  transact: (actions: any[], options?: any) => Promise<any>;
  /** Session removal method */
  remove: () => Promise<void>;
}

/**
 * Proton WebLink interface
 */
export interface ProtonWebLink {
  /** Login method */
  login: (options?: any) => Promise<any>;
  /** Session restoration */
  restoreSession: boolean;
  /** Custom wallet URL */
  walletBrowser: string;
}

/**
 * RPC client interface
 */
export interface RpcClient {
  /** Get account information */
  get_account: (accountName: string) => Promise<any>;
  /** Get block producers */
  get_producers: (options: any) => Promise<any>;
  /** Get table rows */
  get_table_rows: (options: any) => Promise<any>;
  /** Get currency balance */
  get_currency_balance: (
    contract: string,
    account: string,
    symbol?: string
  ) => Promise<any>;
}

// =============================================================================
// USER INTERFACE TYPES
// =============================================================================

/**
 * Component prop interfaces for consistent typing
 */
export interface VoteInfoProps {
  account: AccountInfo | null;
}

export interface BlockProducerSelectorProps {
  blockProducers: BlockProducer[];
  selectedBPs: string[]; // Array of selected Block Producer names (max 4)
  onSelectBP: (bpName: string) => void; // Add/remove BP from selection
  onDelegateVotes: (producerNames: string[]) => void; // Delegate votes to multiple producers
  loading: boolean;
}

export interface WalletConnectionProps {
  wallet: WalletInstance | null;
  loading: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export interface NetworkSelectorProps {
  network: NetworkType;
  onNetworkChange: (network: NetworkType) => void;
}

export interface NetworkInfoProps {
  network: NetworkType;
}

export interface StakeResourcesProps {
  account: AccountInfo | null;
  onStakeResources: (stakeData: StakeData) => void;
  loading: boolean;
  network: NetworkType;
}

export interface HomePageProps {
  wallet: WalletInstance | null;
  account: AccountInfo | null;
  blockProducers: BlockProducer[];
  selectedBPs: string[]; // Array of selected Block Producer names (max 4)
  loading: boolean;
  message?: Message | null;
  network: NetworkType;
  handleConnectWallet: () => void;
  handleDisconnectWallet: () => void;
  handleDelegateVotes: (producerNames?: string[]) => void;
  handleNetworkChange: (network: NetworkType) => void;
  handleStakeResources: (stakeData: StakeData) => void;
  handleSelectBP: (bpName: string) => void; // Toggle BP selection
  navigateToTransfer?: () => void;
}

/**
 * Wallet instance structure
 */
export interface WalletInstance {
  /** Proton SDK link */
  link: ProtonWebLink;
  /** Active session */
  session: ProtonSession;
  /** Account information */
  account: AccountInfo;
}

/**
 * Legacy Wallet type alias for backward compatibility
 */
export type Wallet = WalletInstance;

/**
 * User feedback messages
 */
export interface Message {
  /** Message type */
  type: 'success' | 'error' | 'warning' | 'info';
  /** Message text */
  text: string;
}

/**
 * Component loading states
 */
export interface LoadingState {
  /** Whether data is loading */
  isLoading: boolean;
  /** Error message if any */
  error?: string;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * formatted resource display
 */
export interface TotalResources {
  /** CPU resource */
  cpu?: number;
  /** NET resource */
  net?: number;
  /** RAM resource */
  ram?: number;
  /** Total formatted string */
  total?: string;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  /** Render count */
  renderCount: number;
  /** Average render time */
  averageRenderTime: number;
  /** Memory usage */
  memoryUsage?: number;
  /** Last render timestamp */
  lastRenderTime: number;
}

// =============================================================================
// TRANSFER & TOKEN TYPES
// =============================================================================

/**
 * Token balance information
 */
export interface TokenBalance {
  /** Token contract */
  contract: string;
  /** Token symbol */
  symbol: string;
  /** Token precision */
  precision: number;
  /** Token amount */
  amount: string;
  /** Formatted balance display */
  formatted: string;
}

/**
 * Transfer transaction data
 */
export interface TransferData {
  /** Source account name */
  from: string;
  /** Destination account name */
  to: string;
  /** Token amount with symbol (e.g., "1.0000 XPR") */
  quantity: string;
  /** Transfer memo */
  memo: string;
  /** Token contract */
  contract: string;
  /** Permission used (default: "active") */
  permission: string;
}

/**
 * Transfer form state
 */
export interface TransferFormState {
  /** Selected token */
  selectedToken: TokenBalance | null;
  /** Destination account */
  to: string;
  /** Transfer amount */
  amount: string;
  /** Transfer memo */
  memo: string;
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Success message */
  success: string | null;
}

/**
 * Transfer component props
 */
export interface TransferPageProps {
  /** Wallet instance */
  wallet: WalletInstance | null;
  /** Account information */
  account: AccountInfo | null;
  /** Loading state */
  loading: boolean;
  /** Network type */
  network: NetworkType;
  /** Transfer handler */
  handleTransfer: (transferData: TransferData) => Promise<void>;
  /** Status message */
  message?: Message | null;
  /** Pending transfer data from URL */
  pendingTransferData?: RequestPaymentData | null;
  /** Clear pending transfer data handler */
  onClearPendingData?: () => void;
}

export interface TokenSelectorProps {
  /** Available tokens */
  tokens: TokenBalance[];
  /** Selected token */
  selectedToken: TokenBalance | null;
  /** Token selection handler */
  onTokenSelect: (token: TokenBalance) => void;
  /** Loading state */
  loading: boolean;
}

export interface TransferFormProps {
  /** Selected token */
  token: TokenBalance | null;
  /** Account information */
  account: AccountInfo | null;
  /** Transfer handler */
  onTransfer: (transferData: TransferData) => Promise<void>;
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Pending transfer data from URL */
  pendingTransferData?: RequestPaymentData | null;
  /** Clear pending transfer data handler */
  onClearPendingData?: () => void;
}

// =============================================================================
// REQUEST PAYMENT TYPES
// =============================================================================

/**
 * Request payment data structure
 */
export interface RequestPaymentData {
  /** Recipient account name */
  recipient: string;
  /** Requested amount */
  amount: string;
  /** Request memo/note */
  memo: string;
  /** Token symbol (default: XPR) */
  symbol?: string;
  /** Request expiration date */
  expirationDate?: string;
  /** Shareable URL for the request */
  shareableUrl?: string;
}

/**
 * Request payment form state
 */
export interface RequestFormState {
  /** Recipient account name */
  recipient: string;
  /** Requested amount */
  amount: string;
  /** Request memo/note */
  memo: string;
  /** Token symbol */
  symbol: string;
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Success message */
  success: string | null;
}

/**
 * Request page component props
 */
export interface RequestPageProps {
  /** Wallet instance */
  wallet: WalletInstance | null;
  /** Account information */
  account: AccountInfo | null;
  /** Loading state */
  loading: boolean;
  /** Network type */
  network: NetworkType;
  /** Request handler */
  handleRequest: (requestData: RequestPaymentData) => Promise<void>;
  /** Status message */
  message?: Message | null;
  /** Request data from URL */
  urlRequestData?: RequestPaymentData | null;
  /** Clear URL data handler */
  onClearUrlData?: () => void;
}

/**
 * Request form component props
 */
export interface RequestFormProps {
  /** Account information */
  account: AccountInfo | null;
  /** Request handler */
  onRequest: (requestData: RequestPaymentData) => Promise<void>;
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Pre-filled request data from URL */
  urlRequestData?: RequestPaymentData | null;
  /** Clear URL data handler */
  onClearUrlData?: () => void;
}
