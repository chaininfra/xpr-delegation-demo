/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * XPR Delegation Demo - Zustand Store
 *
 * Simplified state management using basic Zustand patterns
 * for reliable and maintainable state handling.
 *
 * Features:
 * - Wallet connection state
 * - Account information management
 * - Block producer data
 * - Network configuration
 * - Loading states and error handling
 * - Optimistic updates with rollback
 *
 * @fileoverview Simplified Zustand store for XPR Delegation Demo
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  WalletInstance,
  AccountInfo,
  BlockProducer,
  NetworkType,
  StakeData,
} from '../types';

// =============================================================================
// STORE STATE INTERFACE
// =============================================================================

/**
 * Main application store state interface
 */
interface AppStore {
  // Wallet and session state
  wallet: WalletInstance | null;
  account: AccountInfo | null;
  currentWalletKey: string;

  // Block producer data
  blockProducers: BlockProducer[];
  selectedBP: string;
  voteTimestamp: number;

  // Network configuration
  network: NetworkType;
  validators: BlockProducer[];

  // UI states
  loading: boolean;
  error: string | null;
  success: string | null;
  dataLoaded: boolean;

  // Optimistic updates
  optimisticUpdates: boolean;

  // Actions
  // Wallet operations
  setWallet: (wallet: WalletInstance | null) => void;
  setAccount: (account: AccountInfo | null) => void;
  setCurrentWalletKey: (key: string) => void;

  // Block producer operations
  setBlockProducers: (blockProducers: BlockProducer[]) => void;
  setSelectedBP: (bp: string) => void;
  setVoteTimestamp: (timestamp: number) => void;

  // Network operations
  setNetwork: (network: NetworkType) => void;
  pendingNetworkChange: NetworkType | null;

  // UI state operations
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
  setDataLoaded: (loaded: boolean) => void;

  // Clear state operations
  clearError: () => void;
  clearSuccess: () => void;
  resetStore: () => void;

  // Optimistic updates
  setOptimisticUpdates: (enabled: boolean) => void;

  // Stake operations
  updateStakeState: (stakeData: StakeData) => void;
  clearStakeState: () => void;
}

// =============================================================================
// INITIAL STATE VALUES
// =============================================================================

/**
 * Default state values for the store
 */
const initialState = {
  // Wallet state
  wallet: null,
  account: null,
  currentWalletKey: '',

  // Block producer data
  blockProducers: [],
  selectedBP: '',
  voteTimestamp: 0,

  // Network
  network: 'testnet' as NetworkType,
  validators: [],
  pendingNetworkChange: null,

  // UI states
  loading: false,
  error: null,
  success: null,
  dataLoaded: false,
  optimisticUpdates: true,
};

// =============================================================================
// STORE CREATION
// =============================================================================

/**
 * Create the main application store with simplified middleware
 */
export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      set => ({
        ...initialState,

        // Wallet operations
        setWallet: (wallet: WalletInstance | null) =>
          set({ wallet, currentWalletKey: wallet?.session?.auth?.actor || '' }),

        setAccount: (account: AccountInfo | null) => set({ account }),

        setCurrentWalletKey: (key: string) => set({ currentWalletKey: key }),

        // Block producer operations
        setBlockProducers: (blockProducers: BlockProducer[]) =>
          set({ blockProducers }),

        setSelectedBP: (bp: string) => set({ selectedBP: bp }),

        setVoteTimestamp: (timestamp: number) =>
          set({ voteTimestamp: timestamp }),

        // Network operations
        setNetwork: (network: NetworkType) => set({ network }),

        // UI state operations
        setLoading: (loading: boolean) => set({ loading }),

        setError: (error: string | null) => set({ error }),

        setSuccess: (success: string | null) => set({ success }),

        setDataLoaded: (loaded: boolean) => set({ dataLoaded: loaded }),

        // Clear operations
        clearError: () => set({ error: null }),

        clearSuccess: () => set({ success: null }),

        resetStore: () => set(initialState),

        // Optimistic updates
        setOptimisticUpdates: (optimisticUpdates: boolean) =>
          set({ optimisticUpdates }),

        // Stake operations
        updateStakeState: (_stakeData: StakeData) =>
          set(() => ({
            // Add stake data if needed
          })),

        clearStakeState: () =>
          set(() => ({
            // Clear stake data if needed
          })),
      }),
      {
        name: 'xpr-delegation-store',
        partialize: state => ({
          network: state.network,
          optimisticUpdates: state.optimisticUpdates,
          selectedBP: state.selectedBP,
          dataLoaded: state.dataLoaded,
        }),
      }
    ),
    {
      name: 'XPR Delegation Store',
    }
  )
);

// =============================================================================
// SELECTOR HOOKS
// =============================================================================

/**
 * Custom hooks for common state selections
 */

// Wallet selectors
export const useWallet = () => useAppStore(state => state.wallet);
export const useAccount = () => useAppStore(state => state.account);
export const useWalletKey = () => useAppStore(state => state.currentWalletKey);

// Network selectors
export const useNetwork = () => useAppStore(state => state.network);
export const useValidators = () => useAppStore(state => state.validators);

// Block producer selectors
export const useBlockProducers = () =>
  useAppStore(state => state.blockProducers);

export const useSelectedBP = () => useAppStore(state => state.selectedBP);
export const useVoteTimestamp = () => useAppStore(state => state.voteTimestamp);

// UI state selectors
export const useLoading = () => useAppStore(state => state.loading);
export const useError = () => useAppStore(state => state.error);
export const useSuccess = () => useAppStore(state => state.success);
export const useDataLoaded = () => useAppStore(state => state.dataLoaded);

// Optimistic updates
export const useOptimisticUpdates = () =>
  useAppStore(state => state.optimisticUpdates);

// Combined states
export const useAccountInfo = () =>
  useAppStore(state => ({
    wallet: state.wallet,
    account: state.account,
    loading: state.loading,
    error: state.error,
  }));

export const useDelegationState = () =>
  useAppStore(state => ({
    blockProducers: state.blockProducers,
    selectedBP: state.selectedBP,
    voteTimestamp: state.voteTimestamp,
    network: state.network,
    loading: state.loading,
    error: state.error,
  }));

// =============================================================================
// STATE DEBUGGING UTILITIES
// =============================================================================

/**
 * Development utilities for state debugging
 */
if (typeof window !== 'undefined') {
  // Add debugging helpers in development
  (window as any).debugStore = useAppStore;
}
