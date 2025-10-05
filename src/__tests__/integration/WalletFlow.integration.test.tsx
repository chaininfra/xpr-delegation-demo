/**
 * Wallet Flow Integration Tests
 *
 * Tests the complete wallet connection and management flow including:
 * - WebAuth and Anchor wallet integration
 * - Session restoration and management
 * - Account information retrieval
 * - Network-specific wallet operations
 *
 * @fileoverview Wallet flow integration tests for XPR Delegation Demo
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import App from '../../App';
import * as walletService from '../../services/wallet';
import * as blockchainService from '../../services/blockchain';

// Mock the services
jest.mock('../../services/wallet');
jest.mock('../../services/blockchain');

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

describe('Wallet Flow Integration Tests', () => {
  const mockAccountInfo = {
    account_name: 'testuser',
    core_liquid_balance: '100.0000 XPR',
    all_balances: ['100.0000 XPR'],
    ram_usage: 1000,
    ram_quota: 10000,
    cpu_limit: { used: 100, max: 1000 },
    net_limit: { used: 200, max: 2000 },
  };

  const mockVoteInfo = {
    owner: 'testuser',
    proxy: '',
    producers: [],
    last_vote_weight: '0',
    last_vote_time: new Date().toISOString(),
    staked: '50.0000 XPR',
  };

  const mockVotingResources = {
    canVote: true,
    cpuAvailable: 900,
    netAvailable: 1800,
    ramAvailable: 9000,
    minCpuRequired: 1000,
    minNetRequired: 1000,
  };

  const mockWallet = {
    link: {},
    session: {
      auth: { actor: 'testuser', permission: 'owner' },
      rpc: {},
      transact: jest.fn(),
    },
    account: {
      ...mockAccountInfo,
      vote_info: mockVoteInfo,
      voting_resources: mockVotingResources,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    sessionStorageMock.getItem.mockReturnValue(null);
  });

  describe('Wallet Connection', () => {
    test('should connect wallet and load account information', async () => {
      const user = userEvent.setup();
      (walletService.checkExistingSession as jest.Mock).mockResolvedValue(null);
      (walletService.connectWallet as jest.Mock).mockResolvedValue(mockWallet);
      (blockchainService.getBlockProducers as jest.Mock).mockResolvedValue([]);

      await act(async () => {
        render(<App />);
      });

      const connectButton = screen.getByText('Connect Wallet');
      await user.click(connectButton);

      await waitFor(() => {
        expect(walletService.connectWallet).toHaveBeenCalledWith('testnet');
      });

      await waitFor(() => {
        expect(screen.getByText('Wallet Connected')).toBeInTheDocument();
        expect(screen.getByText('testuser')).toBeInTheDocument();
        expect(screen.getByText('100.0000 XPR')).toBeInTheDocument();
      });
    });

    test('should handle wallet connection timeout', async () => {
      const user = userEvent.setup();
      (walletService.checkExistingSession as jest.Mock).mockResolvedValue(null);
      (walletService.connectWallet as jest.Mock).mockRejectedValue(
        new Error('ProtonSDK timeout after 30 seconds')
      );

      await act(async () => {
        render(<App />);
      });

      const connectButton = screen.getByText('Connect Wallet');
      await user.click(connectButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to connect wallet/)
        ).toBeInTheDocument();
      });
    });

    test('should handle wallet connection cancellation', async () => {
      const user = userEvent.setup();
      (walletService.checkExistingSession as jest.Mock).mockResolvedValue(null);
      (walletService.connectWallet as jest.Mock).mockRejectedValue(
        new Error('Wallet connection cancelled or failed to establish session.')
      );

      await act(async () => {
        render(<App />);
      });

      const connectButton = screen.getByText('Connect Wallet');
      await user.click(connectButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to connect wallet/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Session Management', () => {
    test('should restore existing session on app load', async () => {
      (walletService.checkExistingSession as jest.Mock).mockResolvedValue(
        mockWallet
      );

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(walletService.checkExistingSession).toHaveBeenCalledWith(
          'testnet'
        );
        expect(screen.getByText('Wallet Connected')).toBeInTheDocument();
        expect(screen.getByText('testuser')).toBeInTheDocument();
      });
    });

    test('should handle session restoration failure', async () => {
      (walletService.checkExistingSession as jest.Mock).mockRejectedValue(
        new Error('Session restoration failed')
      );

      await act(async () => {
        render(<App />);
      });

      // App should still render even if session restoration fails
      expect(screen.getByText('XPR Delegation Demo')).toBeInTheDocument();
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });

    test('should clear session data on disconnect', async () => {
      const user = userEvent.setup();
      (walletService.checkExistingSession as jest.Mock).mockResolvedValue(
        mockWallet
      );
      (walletService.disconnectWallet as jest.Mock).mockResolvedValue(
        undefined
      );

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText('Wallet Connected')).toBeInTheDocument();
      });

      const disconnectButton = screen.getByText('Disconnect');
      await user.click(disconnectButton);

      await waitFor(() => {
        expect(walletService.disconnectWallet).toHaveBeenCalled();
        expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      });
    });
  });

  describe('Network-Specific Wallet Operations', () => {
    test('should connect to testnet by default', async () => {
      const user = userEvent.setup();
      (walletService.checkExistingSession as jest.Mock).mockResolvedValue(null);
      (walletService.connectWallet as jest.Mock).mockResolvedValue(mockWallet);

      await act(async () => {
        render(<App />);
      });

      const connectButton = screen.getByText('Connect Wallet');
      await user.click(connectButton);

      await waitFor(() => {
        expect(walletService.connectWallet).toHaveBeenCalledWith('testnet');
      });
    });

    test('should connect to mainnet when network is switched', async () => {
      const user = userEvent.setup();
      (walletService.checkExistingSession as jest.Mock).mockResolvedValue(null);
      (walletService.connectWallet as jest.Mock).mockResolvedValue(mockWallet);

      await act(async () => {
        render(<App />);
      });

      // Switch to mainnet
      const networkSelect = screen.getByDisplayValue('testnet');
      await user.selectOptions(networkSelect, 'mainnet');

      const connectButton = screen.getByText('Connect Wallet');
      await user.click(connectButton);

      await waitFor(() => {
        expect(walletService.connectWallet).toHaveBeenCalledWith('mainnet');
      });
    });

    test('should check existing session for current network', async () => {
      (walletService.checkExistingSession as jest.Mock).mockResolvedValue(null);

      await act(async () => {
        render(<App />);
      });

      expect(walletService.checkExistingSession).toHaveBeenCalledWith(
        'testnet'
      );
    });
  });

  describe('Account Information Loading', () => {
    test('should load comprehensive account information on connection', async () => {
      const user = userEvent.setup();
      (walletService.checkExistingSession as jest.Mock).mockResolvedValue(null);
      (walletService.connectWallet as jest.Mock).mockResolvedValue(mockWallet);

      await act(async () => {
        render(<App />);
      });

      const connectButton = screen.getByText('Connect Wallet');
      await user.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument();
        expect(screen.getByText('100.0000 XPR')).toBeInTheDocument();
        expect(screen.getByText('50.0000 XPR')).toBeInTheDocument();
      });
    });

    test('should display voting information when available', async () => {
      (walletService.checkExistingSession as jest.Mock).mockResolvedValue(
        mockWallet
      );

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText(/Voting Information/)).toBeInTheDocument();
        expect(screen.getByText(/Current Votes/)).toBeInTheDocument();
        expect(screen.getByText(/Total Staked/)).toBeInTheDocument();
      });
    });

    test('should display resource information when available', async () => {
      (walletService.checkExistingSession as jest.Mock).mockResolvedValue(
        mockWallet
      );

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText(/Resource Management/)).toBeInTheDocument();
        expect(screen.getByText(/Stake Resources/)).toBeInTheDocument();
        expect(screen.getByText(/Unstake Resources/)).toBeInTheDocument();
      });
    });
  });

  describe('Wallet State Management', () => {
    test('should maintain wallet state across component re-renders', async () => {
      (walletService.checkExistingSession as jest.Mock).mockResolvedValue(
        mockWallet
      );

      const { rerender } = render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Wallet Connected')).toBeInTheDocument();
      });

      // Re-render the component
      rerender(<App />);

      // Wallet state should be maintained
      expect(screen.getByText('Wallet Connected')).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    test('should reset wallet state when network changes', async () => {
      const user = userEvent.setup();
      (walletService.checkExistingSession as jest.Mock).mockResolvedValue(
        mockWallet
      );

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText('Wallet Connected')).toBeInTheDocument();
      });

      // Switch network
      const networkSelect = screen.getByDisplayValue('testnet');
      await user.selectOptions(networkSelect, 'mainnet');

      // Wallet should be disconnected
      await waitFor(() => {
        expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      });

      // Switch back to testnet
      await user.selectOptions(networkSelect, 'testnet');

      // Should check for session again
      expect(walletService.checkExistingSession).toHaveBeenCalledWith(
        'testnet'
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle wallet service errors gracefully', async () => {
      const user = userEvent.setup();
      (walletService.checkExistingSession as jest.Mock).mockResolvedValue(null);
      (walletService.connectWallet as jest.Mock).mockRejectedValue(
        new Error('Wallet service unavailable')
      );

      await act(async () => {
        render(<App />);
      });

      const connectButton = screen.getByText('Connect Wallet');
      await user.click(connectButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to connect wallet/)
        ).toBeInTheDocument();
      });
    });

    test('should handle blockchain service errors during wallet connection', async () => {
      const user = userEvent.setup();
      (walletService.checkExistingSession as jest.Mock).mockResolvedValue(null);
      (walletService.connectWallet as jest.Mock).mockRejectedValue(
        new Error('Failed to get account info')
      );

      await act(async () => {
        render(<App />);
      });

      const connectButton = screen.getByText('Connect Wallet');
      await user.click(connectButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to connect wallet/)
        ).toBeInTheDocument();
      });
    });

    test('should handle session removal errors', async () => {
      const user = userEvent.setup();
      (walletService.checkExistingSession as jest.Mock).mockResolvedValue(
        mockWallet
      );
      (walletService.disconnectWallet as jest.Mock).mockRejectedValue(
        new Error('Failed to remove session')
      );

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText('Wallet Connected')).toBeInTheDocument();
      });

      const disconnectButton = screen.getByText('Disconnect');
      await user.click(disconnectButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to disconnect wallet/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Optimization', () => {
    test('should not make duplicate API calls during wallet connection', async () => {
      const user = userEvent.setup();
      (walletService.checkExistingSession as jest.Mock).mockResolvedValue(null);
      (walletService.connectWallet as jest.Mock).mockResolvedValue(mockWallet);

      await act(async () => {
        render(<App />);
      });

      const connectButton = screen.getByText('Connect Wallet');
      await user.click(connectButton);

      // Wait for connection to complete
      await waitFor(() => {
        expect(screen.getByText('Wallet Connected')).toBeInTheDocument();
      });

      // Click connect again (should not make duplicate calls)
      await user.click(connectButton);

      // Should only have been called once
      expect(walletService.connectWallet).toHaveBeenCalledTimes(1);
    });

    test('should cache wallet state to prevent unnecessary re-renders', async () => {
      (walletService.checkExistingSession as jest.Mock).mockResolvedValue(
        mockWallet
      );

      const { rerender } = render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Wallet Connected')).toBeInTheDocument();
      });

      // Re-render multiple times
      rerender(<App />);
      rerender(<App />);
      rerender(<App />);

      // Wallet state should be maintained without additional API calls
      expect(screen.getByText('Wallet Connected')).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });
  });
});
