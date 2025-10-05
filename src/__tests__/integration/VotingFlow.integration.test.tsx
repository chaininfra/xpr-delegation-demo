/**
 * Voting Flow Integration Tests
 *
 * Tests the complete voting and delegation workflow including:
 * - Block producer selection and management
 * - Vote delegation operations
 * - Voting resource validation
 * - Transaction execution and confirmation
 *
 * @fileoverview Voting flow integration tests for XPR Delegation Demo
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import App from '../../App';
import * as services from '../../services';

// Mock the services
jest.mock('../../services', () => ({
  connectWallet: jest.fn(),
  disconnectWallet: jest.fn(),
  delegateVotes: jest.fn(),
  getAccountInfo: jest.fn(),
  getBlockProducers: jest.fn(),
  checkExistingSession: jest.fn(),
  stakeResources: jest.fn(),
  unstakeResources: jest.fn(),
  getVoteInfo: jest.fn(),
  checkVotingResources: jest.fn(),
}));

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

describe('Voting Flow Integration Tests', () => {
  const mockWallet = {
    link: {},
    session: {
      auth: { actor: 'testuser', permission: 'owner' },
      rpc: {},
      transact: jest.fn(),
    },
    account: {
      account_name: 'testuser',
      core_liquid_balance: '100.0000 XPR',
      all_balances: ['100.0000 XPR'],
      ram_usage: 1000,
      ram_quota: 10000,
      cpu_limit: { used: 100, max: 1000 },
      net_limit: { used: 200, max: 2000 },
      vote_info: {
        owner: 'testuser',
        proxy: '',
        producers: [],
        last_vote_weight: '0',
        last_vote_time: new Date().toISOString(),
        staked: '50.0000 XPR',
      },
      voting_resources: {
        canVote: true,
        cpuAvailable: 900,
        netAvailable: 1800,
        ramAvailable: 9000,
        minCpuRequired: 1000,
        minNetRequired: 1000,
      },
    },
  };

  const mockBlockProducers = [
    { name: 'proton', url: 'https://protonchain.com', total_votes: '1000000' },
    { name: 'protondev', url: 'https://protondev.com', total_votes: '500000' },
    { name: 'protonbp', url: 'https://protonbp.com', total_votes: '750000' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Block Producer Loading', () => {
    test('should load block producers after wallet connection', async () => {
      (services.checkExistingSession as jest.Mock).mockResolvedValue(
        mockWallet
      );
      (services.getBlockProducers as jest.Mock).mockResolvedValue(
        mockBlockProducers
      );

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(services.getBlockProducers).toHaveBeenCalledWith(
          'testnet',
          mockWallet.session
        );
      });

      await waitFor(() => {
        expect(screen.getByText('proton')).toBeInTheDocument();
        expect(screen.getByText('protondev')).toBeInTheDocument();
        expect(screen.getByText('protonbp')).toBeInTheDocument();
      });
    });

    test('should handle block producer loading failure', async () => {
      (services.checkExistingSession as jest.Mock).mockResolvedValue(
        mockWallet
      );
      (services.getBlockProducers as jest.Mock).mockRejectedValue(
        new Error('Failed to load producers')
      );

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to load block producers/)
        ).toBeInTheDocument();
      });
    });

    test('should refresh block producers after network change', async () => {
      const user = userEvent.setup();
      (services.checkExistingSession as jest.Mock).mockResolvedValue(
        mockWallet
      );
      (services.getBlockProducers as jest.Mock).mockResolvedValue(
        mockBlockProducers
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

      // Reconnect wallet
      const connectButton = screen.getByText('Connect Wallet');
      await user.click(connectButton);

      await waitFor(() => {
        expect(services.getBlockProducers).toHaveBeenCalledWith(
          'mainnet',
          expect.any(Object)
        );
      });
    });
  });

  describe('Block Producer Selection', () => {
    test('should allow selection of block producer from dropdown', async () => {
      const user = userEvent.setup();
      (services.checkExistingSession as jest.Mock).mockResolvedValue(
        mockWallet
      );
      (services.getBlockProducers as jest.Mock).mockResolvedValue(
        mockBlockProducers
      );

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText('proton')).toBeInTheDocument();
      });

      // Select a block producer
      const producerSelect = screen.getByRole('combobox');
      await user.selectOptions(producerSelect, 'proton');

      expect(producerSelect).toHaveValue('proton');
    });

    test('should show selected block producer information', async () => {
      const user = userEvent.setup();
      (services.checkExistingSession as jest.Mock).mockResolvedValue(
        mockWallet
      );
      (services.getBlockProducers as jest.Mock).mockResolvedValue(
        mockBlockProducers
      );

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText('proton')).toBeInTheDocument();
      });

      // Select a block producer
      const producerSelect = screen.getByRole('combobox');
      await user.selectOptions(producerSelect, 'proton');

      // Should show selected producer info
      expect(screen.getByText(/Selected: proton/)).toBeInTheDocument();
    });

    test('should validate block producer name format', async () => {
      const user = userEvent.setup();
      (services.checkExistingSession as jest.Mock).mockResolvedValue(
        mockWallet
      );
      (services.getBlockProducers as jest.Mock).mockResolvedValue(
        mockBlockProducers
      );

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText('proton')).toBeInTheDocument();
      });

      // Select a valid block producer
      const producerSelect = screen.getByRole('combobox');
      await user.selectOptions(producerSelect, 'proton');

      // Should accept valid name
      expect(producerSelect).toHaveValue('proton');
    });
  });

  describe('Vote Delegation', () => {
    test('should delegate votes to selected block producer', async () => {
      const user = userEvent.setup();
      (services.checkExistingSession as jest.Mock).mockResolvedValue(
        mockWallet
      );
      (services.getBlockProducers as jest.Mock).mockResolvedValue(
        mockBlockProducers
      );
      (services.delegateVotes as jest.Mock).mockResolvedValue({
        transactionId: 'test-tx-id',
        blockNum: 12345,
        status: 'success',
      });

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText('proton')).toBeInTheDocument();
      });

      // Select a block producer
      const producerSelect = screen.getByRole('combobox');
      await user.selectOptions(producerSelect, 'proton');

      // Click delegate button
      const delegateButton = screen.getByText('Delegate Votes');
      await user.click(delegateButton);

      await waitFor(() => {
        expect(services.delegateVotes).toHaveBeenCalledWith(
          'testuser',
          'proton',
          'testnet',
          mockWallet.session
        );
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Votes delegated successfully/)
        ).toBeInTheDocument();
      });
    });

    test('should validate voting resources before delegation', async () => {
      const user = userEvent.setup();
      const insufficientResourcesWallet = {
        ...mockWallet,
        account: {
          ...mockWallet.account,
          voting_resources: {
            canVote: false,
            cpuAvailable: 50,
            netAvailable: 50,
            ramAvailable: 500,
            minCpuRequired: 1000,
            minNetRequired: 1000,
          },
        },
      };

      (services.checkExistingSession as jest.Mock).mockResolvedValue(
        insufficientResourcesWallet
      );
      (services.getBlockProducers as jest.Mock).mockResolvedValue(
        mockBlockProducers
      );
      (services.delegateVotes as jest.Mock).mockRejectedValue(
        new Error('Insufficient resources to vote. Please stake more CPU/NET.')
      );

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText('proton')).toBeInTheDocument();
      });

      // Select a block producer
      const producerSelect = screen.getByRole('combobox');
      await user.selectOptions(producerSelect, 'proton');

      // Try to delegate votes
      const delegateButton = screen.getByText('Delegate Votes');
      await user.click(delegateButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Insufficient resources to vote/)
        ).toBeInTheDocument();
      });
    });

    test('should handle delegation transaction failure', async () => {
      const user = userEvent.setup();
      (services.checkExistingSession as jest.Mock).mockResolvedValue(
        mockWallet
      );
      (services.getBlockProducers as jest.Mock).mockResolvedValue(
        mockBlockProducers
      );
      (services.delegateVotes as jest.Mock).mockRejectedValue(
        new Error('Transaction failed: insufficient funds')
      );

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText('proton')).toBeInTheDocument();
      });

      // Select a block producer
      const producerSelect = screen.getByRole('combobox');
      await user.selectOptions(producerSelect, 'proton');

      // Try to delegate votes
      const delegateButton = screen.getByText('Delegate Votes');
      await user.click(delegateButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to delegate votes/)
        ).toBeInTheDocument();
      });
    });

    test('should require block producer selection before delegation', async () => {
      const user = userEvent.setup();
      (services.checkExistingSession as jest.Mock).mockResolvedValue(
        mockWallet
      );
      (services.getBlockProducers as jest.Mock).mockResolvedValue(
        mockBlockProducers
      );

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText('proton')).toBeInTheDocument();
      });

      // Try to delegate without selecting a producer
      const delegateButton = screen.getByText('Delegate Votes');
      await user.click(delegateButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Please select a Block Producer/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Voting Information Display', () => {
    test('should display current voting information', async () => {
      (services.checkExistingSession as jest.Mock).mockResolvedValue(
        mockWallet
      );

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText(/Voting Information/)).toBeInTheDocument();
        expect(screen.getByText(/Current Votes/)).toBeInTheDocument();
        expect(screen.getByText(/Total Staked/)).toBeInTheDocument();
        expect(screen.getByText('50.0000 XPR')).toBeInTheDocument();
      });
    });

    test('should display voting resource status', async () => {
      (services.checkExistingSession as jest.Mock).mockResolvedValue(
        mockWallet
      );

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText(/Can Vote/)).toBeInTheDocument();
        expect(screen.getByText(/CPU Available/)).toBeInTheDocument();
        expect(screen.getByText(/NET Available/)).toBeInTheDocument();
      });
    });

    test('should update voting information after delegation', async () => {
      const user = userEvent.setup();
      (services.checkExistingSession as jest.Mock).mockResolvedValue(
        mockWallet
      );
      (services.getBlockProducers as jest.Mock).mockResolvedValue(
        mockBlockProducers
      );
      (services.delegateVotes as jest.Mock).mockResolvedValue({
        transactionId: 'test-tx-id',
        blockNum: 12345,
        status: 'success',
      });

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText('proton')).toBeInTheDocument();
      });

      // Select a block producer
      const producerSelect = screen.getByRole('combobox');
      await user.selectOptions(producerSelect, 'proton');

      // Delegate votes
      const delegateButton = screen.getByText('Delegate Votes');
      await user.click(delegateButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Votes delegated successfully/)
        ).toBeInTheDocument();
      });

      // Voting information should be refreshed
      await waitFor(() => {
        expect(screen.getByText(/Voting Information/)).toBeInTheDocument();
      });
    });
  });

  describe('Transaction Confirmation', () => {
    test('should display transaction details after successful delegation', async () => {
      const user = userEvent.setup();
      const mockTransactionResult = {
        transactionId: 'abc123def456',
        blockNum: 12345,
        status: 'success',
      };

      (services.checkExistingSession as jest.Mock).mockResolvedValue(
        mockWallet
      );
      (services.getBlockProducers as jest.Mock).mockResolvedValue(
        mockBlockProducers
      );
      (services.delegateVotes as jest.Mock).mockResolvedValue(
        mockTransactionResult
      );

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText('proton')).toBeInTheDocument();
      });

      // Select a block producer
      const producerSelect = screen.getByRole('combobox');
      await user.selectOptions(producerSelect, 'proton');

      // Delegate votes
      const delegateButton = screen.getByText('Delegate Votes');
      await user.click(delegateButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Votes delegated successfully/)
        ).toBeInTheDocument();
        expect(screen.getByText(/Transaction ID/)).toBeInTheDocument();
        expect(screen.getByText(/Block Number/)).toBeInTheDocument();
      });
    });

    test('should handle transaction timeout', async () => {
      const user = userEvent.setup();
      (services.checkExistingSession as jest.Mock).mockResolvedValue(
        mockWallet
      );
      (services.getBlockProducers as jest.Mock).mockResolvedValue(
        mockBlockProducers
      );
      (services.delegateVotes as jest.Mock).mockRejectedValue(
        new Error('Transaction timeout')
      );

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText('proton')).toBeInTheDocument();
      });

      // Select a block producer
      const producerSelect = screen.getByRole('combobox');
      await user.selectOptions(producerSelect, 'proton');

      // Try to delegate votes
      const delegateButton = screen.getByText('Delegate Votes');
      await user.click(delegateButton);

      await waitFor(() => {
        expect(screen.getByText(/Transaction timeout/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors during vote delegation', async () => {
      const user = userEvent.setup();
      (services.checkExistingSession as jest.Mock).mockResolvedValue(
        mockWallet
      );
      (services.getBlockProducers as jest.Mock).mockResolvedValue(
        mockBlockProducers
      );
      (services.delegateVotes as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText('proton')).toBeInTheDocument();
      });

      // Select a block producer
      const producerSelect = screen.getByRole('combobox');
      await user.selectOptions(producerSelect, 'proton');

      // Try to delegate votes
      const delegateButton = screen.getByText('Delegate Votes');
      await user.click(delegateButton);

      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });
    });

    test('should handle invalid block producer selection', async () => {
      const user = userEvent.setup();
      (services.checkExistingSession as jest.Mock).mockResolvedValue(
        mockWallet
      );
      (services.getBlockProducers as jest.Mock).mockResolvedValue(
        mockBlockProducers
      );

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText('proton')).toBeInTheDocument();
      });

      // Try to delegate without selecting a producer
      const delegateButton = screen.getByText('Delegate Votes');
      await user.click(delegateButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Please select a Block Producer/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Optimization', () => {
    test('should not make duplicate API calls for block producers', async () => {
      (services.checkExistingSession as jest.Mock).mockResolvedValue(
        mockWallet
      );
      (services.getBlockProducers as jest.Mock).mockResolvedValue(
        mockBlockProducers
      );

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText('proton')).toBeInTheDocument();
      });

      // Re-render the component
      const { rerender } = render(<App />);
      rerender(<App />);

      // Should only have been called once
      expect(services.getBlockProducers).toHaveBeenCalledTimes(1);
    });

    test('should cache block producer data', async () => {
      (services.checkExistingSession as jest.Mock).mockResolvedValue(
        mockWallet
      );
      (services.getBlockProducers as jest.Mock).mockResolvedValue(
        mockBlockProducers
      );

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText('proton')).toBeInTheDocument();
      });

      // Block producers should be cached and not refetched
      expect(services.getBlockProducers).toHaveBeenCalledTimes(1);
    });
  });
});
