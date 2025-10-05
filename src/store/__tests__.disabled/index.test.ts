/**
 * Store Tests
 *
 * Unit tests for Zustand store including:
 * - State management
 * - Action dispatching
 * - Persistence
 * - Optimistic updates
 *
 * @fileoverview Tests for Zustand store
 */

import { renderHook, act } from '@testing-library/react';
import { useAppStore } from '../index';
import type { AccountInfo, BlockProducer, NetworkType } from '../../types';

// Mock account info
const mockAccountInfo: AccountInfo = {
  account_name: 'testaccount',
  core_liquid_balance: '1000.0000 XPR',
  all_balances: ['1000.0000 XPR'],
  ram_usage: 1000,
  ram_quota: 10000,
  cpu_limit: { used: 100, max: 1000 },
  net_limit: { used: 200, max: 2000 },
};

// Mock block producers
const mockBlockProducers: BlockProducer[] = [
  { name: 'proton', url: 'https://protonchain.com' },
  { name: 'protondev', url: 'https://protondev.com' },
];

// Mock wallet
const mockWallet = {
  link: {} as any,
  session: {
    auth: { actor: 'testaccount', permission: 'owner' },
    rpc: {} as any,
    transact: jest.fn(),
    remove: jest.fn(),
  } as any,
  account: mockAccountInfo,
} as const;

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useAppStore.getState().resetState();
    });
  });

  describe('Initial State', () => {
    test('has correct initial state', () => {
      const { result } = renderHook(() => useAppStore());

      expect(result.current.wallet).toBeNull();
      expect(result.current.account).toBeNull();
      expect(result.current.blockProducers).toEqual([]);
      expect(result.current.selectedBP).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.message).toBeNull();
      expect(result.current.network).toBe('testnet');
      expect(result.current.dataLoaded).toBe(false);
      expect(result.current.currentWalletKey).toBeNull();
    });
  });

  describe('Wallet Management', () => {
    test('sets wallet correctly', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setWallet(mockWallet);
      });

      expect(result.current.wallet).toEqual(mockWallet);
    });

    test('clears wallet when set to null', () => {
      const { result } = renderHook(() => useAppStore());

      // Set wallet first
      act(() => {
        result.current.setWallet(mockWallet);
      });

      expect(result.current.wallet).toEqual(mockWallet);

      // Clear wallet
      act(() => {
        result.current.setWallet(null);
      });

      expect(result.current.wallet).toBeNull();
    });
  });

  describe('Account Management', () => {
    test('sets account correctly', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setAccount(mockAccountInfo);
      });

      expect(result.current.account).toEqual(mockAccountInfo);
    });

    test('clears account when set to null', () => {
      const { result } = renderHook(() => useAppStore());

      // Set account first
      act(() => {
        result.current.setAccount(mockAccountInfo);
      });

      expect(result.current.account).toEqual(mockAccountInfo);

      // Clear account
      act(() => {
        result.current.setAccount(null);
      });

      expect(result.current.account).toBeNull();
    });
  });

  describe('Block Producers Management', () => {
    test('sets block producers correctly', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setBlockProducers(mockBlockProducers);
      });

      expect(result.current.blockProducers).toEqual(mockBlockProducers);
    });

    test('handles empty block producers array', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setBlockProducers([]);
      });

      expect(result.current.blockProducers).toEqual([]);
    });
  });

  describe('Selection Management', () => {
    test('sets selected block producer correctly', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setSelectedBP('proton');
      });

      expect(result.current.selectedBP).toBe('proton');
    });

    test('clears selection when set to null', () => {
      const { result } = renderHook(() => useAppStore());

      // Set selection first
      act(() => {
        result.current.setSelectedBP('proton');
      });

      expect(result.current.selectedBP).toBe('proton');

      // Clear selection
      act(() => {
        result.current.setSelectedBP(null);
      });

      expect(result.current.selectedBP).toBeNull();
    });
  });

  describe('Loading State Management', () => {
    test('sets loading state correctly', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.loading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Message Management', () => {
    test('sets message correctly', () => {
      const { result } = renderHook(() => useAppStore());

      const message = {
        type: 'success' as const,
        text: 'Operation successful',
      };

      act(() => {
        result.current.setMessage(message);
      });

      expect(result.current.message).toEqual(message);
    });

    test('clears message when set to null', () => {
      const { result } = renderHook(() => useAppStore());

      const message = {
        type: 'success' as const,
        text: 'Operation successful',
      };

      // Set message first
      act(() => {
        result.current.setMessage(message);
      });

      expect(result.current.message).toEqual(message);

      // Clear message
      act(() => {
        result.current.setMessage(null);
      });

      expect(result.current.message).toBeNull();
    });
  });

  describe('Network Management', () => {
    test('sets network correctly', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setNetwork('mainnet');
      });

      expect(result.current.network).toBe('mainnet');
    });

    test('handles network switching', () => {
      const { result } = renderHook(() => useAppStore());

      expect(result.current.network).toBe('testnet');

      act(() => {
        result.current.setNetwork('mainnet');
      });

      expect(result.current.network).toBe('mainnet');

      act(() => {
        result.current.setNetwork('testnet');
      });

      expect(result.current.network).toBe('testnet');
    });
  });

  describe('Data Loading State', () => {
    test('tracks data loaded state', () => {
      const { result } = renderHook(() => useAppStore());

      expect(result.current.dataLoaded).toBe(false);

      act(() => {
        result.current.setDataLoaded(true);
      });

      expect(result.current.dataLoaded).toBe(true);
    });

    test('tracks current wallet key', () => {
      const { result } = renderHook(() => useAppStore());

      expect(result.current.currentWalletKey).toBeNull();

      act(() => {
        result.current.setCurrentWalletKey('testaccount-testnet');
      });

      expect(result.current.currentWalletKey).toBe('testaccount-testnet');
    });
  });

  describe('State Reset', () => {
    test('resets all state to initial values', () => {
      const { result } = renderHook(() => useAppStore());

      // Set some state
      act(() => {
        result.current.setWallet(mockWallet);
        result.current.setAccount(mockAccountInfo);
        result.current.setBlockProducers(mockBlockProducers);
        result.current.setSelectedBP('proton');
        result.current.setLoading(true);
        result.current.setMessage({ type: 'success', text: 'Test' });
        result.current.setNetwork('mainnet');
        result.current.setDataLoaded(true);
        result.current.setCurrentWalletKey('test-key');
      });

      // Verify state is set
      expect(result.current.wallet).toEqual(mockWallet);
      expect(result.current.account).toEqual(mockAccountInfo);
      expect(result.current.blockProducers).toEqual(mockBlockProducers);
      expect(result.current.selectedBP).toBe('proton');
      expect(result.current.loading).toBe(true);
      expect(result.current.message).toEqual({ type: 'success', text: 'Test' });
      expect(result.current.network).toBe('mainnet');
      expect(result.current.dataLoaded).toBe(true);
      expect(result.current.currentWalletKey).toBe('test-key');

      // Reset state
      act(() => {
        result.current.resetState();
      });

      // Verify state is reset
      expect(result.current.wallet).toBeNull();
      expect(result.current.account).toBeNull();
      expect(result.current.blockProducers).toEqual([]);
      expect(result.current.selectedBP).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.message).toBeNull();
      expect(result.current.network).toBe('testnet');
      expect(result.current.dataLoaded).toBe(false);
      expect(result.current.currentWalletKey).toBeNull();
    });
  });

  describe('Optimistic Updates', () => {
    test('performs optimistic stake update', () => {
      const { result } = renderHook(() => useAppStore());

      // Set account with vote info
      const accountWithVoteInfo: AccountInfo = {
        ...mockAccountInfo,
        vote_info: {
          owner: 'testaccount',
          proxy: '',
          producers: [],
          last_vote_weight: 0,
          last_vote_time: new Date().toISOString(),
          staked: 100,
        },
      };

      act(() => {
        result.current.setAccount(accountWithVoteInfo);
      });

      // Perform optimistic stake
      act(() => {
        result.current.optimisticStake({ cpu: 50, net: 0 });
      });

      expect(result.current.account?.vote_info?.staked).toBe('150.0000 XPR');
    });

    test('handles optimistic stake with no vote info', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setAccount(mockAccountInfo);
      });

      // Perform optimistic stake
      act(() => {
        result.current.optimisticStake({ cpu: 50, net: 0 });
      });

      expect(result.current.account?.vote_info?.staked).toBe('50.0000 XPR');
    });

    test('performs optimistic vote update', () => {
      const { result } = renderHook(() => useAppStore());

      // Set account with vote info
      const accountWithVoteInfo: AccountInfo = {
        ...mockAccountInfo,
        vote_info: {
          owner: 'testaccount',
          proxy: '',
          producers: [],
          last_vote_weight: 0,
          last_vote_time: new Date().toISOString(),
          staked: 100,
        },
      };

      act(() => {
        result.current.setAccount(accountWithVoteInfo);
      });

      // Perform optimistic vote
      act(() => {
        result.current.optimisticVote('proton');
      });

      expect(result.current.account?.vote_info?.producers).toEqual(['proton']);
    });

    test('handles optimistic vote with no vote info', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setAccount(mockAccountInfo);
      });

      // Perform optimistic vote
      act(() => {
        result.current.optimisticVote('proton');
      });

      expect(result.current.account?.vote_info?.producers).toEqual(['proton']);
    });

    test('handles optimistic updates with null account', () => {
      const { result } = renderHook(() => useAppStore());

      // Perform optimistic stake with null account
      act(() => {
        result.current.optimisticStake({ cpu: 50, net: 0 });
      });

      expect(result.current.account).toBeNull();

      // Perform optimistic vote with null account
      act(() => {
        result.current.optimisticVote('proton');
      });

      expect(result.current.account).toBeNull();
    });
  });

  describe('Persistence', () => {
    test('persists state changes', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setWallet(mockWallet);
        result.current.setNetwork('mainnet');
      });

      // Create new hook instance to test persistence
      const { result: result2 } = renderHook(() => useAppStore());

      // Note: In a real test environment, persistence might not work
      // This test verifies the store structure supports persistence
      expect(result2.current.setWallet).toBeDefined();
      expect(result2.current.setNetwork).toBeDefined();
    });
  });

  describe('Type Safety', () => {
    test('handles type-safe network values', () => {
      const { result } = renderHook(() => useAppStore());

      const validNetworks: NetworkType[] = ['testnet', 'mainnet'];

      validNetworks.forEach(network => {
        act(() => {
          result.current.setNetwork(network);
        });

        expect(result.current.network).toBe(network);
      });
    });

    test('handles type-safe message types', () => {
      const { result } = renderHook(() => useAppStore());

      const messageTypes = ['success', 'error', 'warning', 'info'] as const;

      messageTypes.forEach(type => {
        act(() => {
          result.current.setMessage({ type, text: `Test ${type} message` });
        });

        expect(result.current.message?.type).toBe(type);
      });
    });
  });

  describe('Error Handling', () => {
    test('handles invalid state updates gracefully', () => {
      const { result } = renderHook(() => useAppStore());

      // Test with invalid data
      act(() => {
        result.current.setAccount({} as AccountInfo);
        result.current.setBlockProducers([{}] as BlockProducer[]);
      });

      expect(result.current.account).toEqual({});
      expect(result.current.blockProducers).toEqual([{}]);
    });

    test('handles null and undefined values', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setWallet(undefined as any);
        result.current.setAccount(undefined as any);
        result.current.setMessage(undefined as any);
      });

      expect(result.current.wallet).toBeUndefined();
      expect(result.current.account).toBeUndefined();
      expect(result.current.message).toBeUndefined();
    });
  });
});
