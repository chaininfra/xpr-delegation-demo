/**
 * Integration Tests for XPR Delegation Demo
 *
 * Tests the complete application flow including:
 * - Wallet connection and session management
 * - Network switching
 * - Vote delegation workflow
 * - Resource staking operations
 * - Component integration
 *
 * @fileoverview Integration tests for XPR Delegation Demo
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import App from '../../App';
import * as services from '../../services';

// Mock the services
jest.mock('../../services', () => ({
  connectWallet: jest.fn().mockResolvedValue({
    link: {},
    session: {
      auth: { actor: 'testuser', permission: 'owner' },
      transact: jest.fn(),
      remove: jest.fn(),
    },
    account: {
      account_name: 'testuser',
      core_liquid_balance: '100.0000 XPR',
      all_balances: ['100.0000 XPR'],
      ram_usage: 1000,
      ram_quota: 8000,
      cpu_limit: { used: 1000, max: 2000000 },
      net_limit: { used: 1000, max: 1000000 },
      total_resources: { cpu_weight: '10.0000 SYS', net_weight: '10.0000 SYS' },
      vote_info: {
        owner: 'testuser',
        proxy: '',
        producers: ['proton'],
        staked: '100.0000 XPR',
      },
      voting_resources: {
        canVote: true,
        cpuAvailable: 1000000,
        netAvailable: 500000,
        ramAvailable: 5000,
      },
    },
  }),
  disconnectWallet: jest.fn().mockResolvedValue(undefined),
  delegateVotes: jest.fn().mockResolvedValue({
    transactionId: 'mock-tx-id',
    blockNum: 12345,
    status: 'success',
  }),
  getAccountInfo: jest.fn().mockResolvedValue({
    account_name: 'testuser',
    core_liquid_balance: '100.0000 XPR',
    all_balances: ['100.0000 XPR'],
    ram_usage: 1000,
    ram_quota: 8000,
    cpu_limit: { used: 1000, max: 2000000 },
    net_limit: { used: 1000, max: 1000000 },
  }),
  getBlockProducers: jest.fn().mockResolvedValue([
    {
      name: 'proton',
      url: 'https://protonchain.com',
      total_votes: '100000000000',
    },
    {
      name: 'protondev',
      url: 'https://protondev.com',
      total_votes: '50000000000',
    },
  ]),
  checkExistingSession: jest.fn().mockResolvedValue(null),
  stakeResources: jest.fn().mockResolvedValue({
    transactionId: 'mock-stake-tx-id',
    actions: 1,
    totalStaked: 100,
  }),
  unstakeResources: jest.fn().mockResolvedValue({
    transactionId: 'mock-unstake-tx-id',
    actions: 1,
    totalUnstaked: 100,
  }),
  getVoteInfo: jest.fn().mockResolvedValue({
    owner: 'testuser',
    proxy: '',
    producers: ['proton'],
    staked: '100.0000 XPR',
  }),
  checkVotingResources: jest.fn().mockResolvedValue({
    canVote: true,
    cpuAvailable: 1000000,
    netAvailable: 500000,
    ramAvailable: 5000,
  }),
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

describe('App Integration Tests', () => {
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
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    sessionStorageMock.getItem.mockReturnValue(null);
  });

  describe('Application Initialization', () => {
    test('should render the application with initial state', async () => {
      (services.checkExistingSession as jest.Mock).mockResolvedValue(null);

      await act(async () => {
        render(<App />);
      });

      expect(screen.getByText('XPR Delegation Demo')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Delegate your votes to Block Producers on XPR Network'
        )
      ).toBeInTheDocument();
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      expect(screen.getByDisplayValue('testnet')).toBeInTheDocument();
    });

    test('should check for existing session on mount', async () => {
      (services.checkExistingSession as jest.Mock).mockResolvedValue(null);

      await act(async () => {
        render(<App />);
      });

      expect(services.checkExistingSession).toHaveBeenCalledWith('testnet');
    });

    test('should restore existing session if found', async () => {
      (services.checkExistingSession as jest.Mock).mockResolvedValue(
        mockWallet
      );

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText('Wallet Connected')).toBeInTheDocument();
        expect(screen.getByText('testuser')).toBeInTheDocument();
      });
    });
  });

  describe('Wallet Connection Flow', () => {
    test('should connect wallet successfully', async () => {
      const user = userEvent.setup();
      (services.checkExistingSession as jest.Mock).mockResolvedValue(null);
      (services.connectWallet as jest.Mock).mockResolvedValue(mockWallet);
      (services.getBlockProducers as jest.Mock).mockResolvedValue(
        mockBlockProducers
      );

      await act(async () => {
        render(<App />);
      });

      const connectButton = screen.getByText('Connect Wallet');
      await user.click(connectButton);

      await waitFor(() => {
        expect(services.connectWallet).toHaveBeenCalledWith('testnet');
      });

      await waitFor(() => {
        expect(screen.getByText('Wallet Connected')).toBeInTheDocument();
        expect(screen.getByText('testuser')).toBeInTheDocument();
      });
    });

    test('should handle wallet connection failure', async () => {
      const user = userEvent.setup();
      (services.checkExistingSession as jest.Mock).mockResolvedValue(null);
      (services.connectWallet as jest.Mock).mockRejectedValue(
        new Error('Connection failed')
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

    test('should disconnect wallet successfully', async () => {
      const user = userEvent.setup();
      (services.checkExistingSession as jest.Mock).mockResolvedValue(
        mockWallet
      );
      (services.disconnectWallet as jest.Mock).mockResolvedValue(undefined);

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText('Wallet Connected')).toBeInTheDocument();
      });

      const disconnectButton = screen.getByText('Disconnect');
      await user.click(disconnectButton);

      await waitFor(() => {
        expect(services.disconnectWallet).toHaveBeenCalled();
        expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      });
    });
  });

  describe('Network Switching', () => {
    test('should switch between testnet and mainnet', async () => {
      const user = userEvent.setup();
      (services.checkExistingSession as jest.Mock).mockResolvedValue(null);

      await act(async () => {
        render(<App />);
      });

      const networkSelect = screen.getByTestId('network-select');
      await user.selectOptions(networkSelect, 'mainnet');

      expect(networkSelect).toHaveValue('mainnet');
    });

    test('should reset wallet state when switching networks', async () => {
      const user = userEvent.setup();
      (services.checkExistingSession as jest.Mock).mockResolvedValue(
        mockWallet
      );

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText('Wallet Connected')).toBeInTheDocument();
      });

      const networkSelect = screen.getByTestId('network-select');
      await user.selectOptions(networkSelect, 'mainnet');

      await waitFor(() => {
        expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      });
    });
  });

  describe('Vote Delegation Flow', () => {
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
        expect(screen.getByText('Wallet Connected')).toBeInTheDocument();
      });

      // Wait for block producers to load
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

    test('should show error when no block producer is selected', async () => {
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

  describe('Resource Staking Flow', () => {
    test('should stake resources successfully', async () => {
      const user = userEvent.setup();
      (services.checkExistingSession as jest.Mock).mockResolvedValue(
        mockWallet
      );
      (services.stakeResources as jest.Mock).mockResolvedValue({
        transactionId: 'stake-tx-id',
        actions: 1,
        totalStaked: 10,
      });

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText('Wallet Connected')).toBeInTheDocument();
      });

      // Find and fill the stake amount input
      const stakeInput = screen.getByLabelText(/stake amount/i);
      await user.type(stakeInput, '10');

      // Click stake button
      const stakeButton = screen.getByText(/stake/i);
      await user.click(stakeButton);

      await waitFor(() => {
        expect(services.stakeResources).toHaveBeenCalledWith(
          'testuser',
          { cpu: 10, net: 0 },
          'testnet',
          mockWallet.session
        );
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Resources staked successfully/)
        ).toBeInTheDocument();
      });
    });

    test('should unstake resources successfully', async () => {
      const user = userEvent.setup();
      (services.checkExistingSession as jest.Mock).mockResolvedValue(
        mockWallet
      );
      (services.unstakeResources as jest.Mock).mockResolvedValue({
        transactionId: 'unstake-tx-id',
        actions: 1,
        totalUnstaked: 5,
      });

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText('Wallet Connected')).toBeInTheDocument();
      });

      // Find and fill the unstake amount input
      const unstakeInput = screen.getByLabelText(/unstake amount/i);
      await user.type(unstakeInput, '5');

      // Click unstake button
      const unstakeButton = screen.getByText(/unstake/i);
      await user.click(unstakeButton);

      await waitFor(() => {
        expect(services.unstakeResources).toHaveBeenCalledWith(
          'testuser',
          { cpu: 5, net: 0 },
          'testnet',
          mockWallet.session
        );
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Resources unstaked successfully/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      (services.checkExistingSession as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await act(async () => {
        render(<App />);
      });

      // App should still render even if session check fails
      expect(screen.getByText('XPR Delegation Demo')).toBeInTheDocument();
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });

    test('should handle service errors during operations', async () => {
      (services.checkExistingSession as jest.Mock).mockResolvedValue(
        mockWallet
      );
      (services.getBlockProducers as jest.Mock).mockRejectedValue(
        new Error('Service error')
      );

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText('Wallet Connected')).toBeInTheDocument();
      });

      // Should show error message for failed operations
      await waitFor(() => {
        expect(
          screen.getByText(/Failed to load block producers/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Component Integration', () => {
    test('should display account information when wallet is connected', async () => {
      (services.checkExistingSession as jest.Mock).mockResolvedValue(
        mockWallet
      );

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText('Wallet Connected')).toBeInTheDocument();
        expect(screen.getByText('testuser')).toBeInTheDocument();
        expect(screen.getByText('100.0000 XPR')).toBeInTheDocument();
        expect(screen.getByText('50.0000 XPR')).toBeInTheDocument();
      });
    });

    test('should show voting information when available', async () => {
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
      });
    });

    test('should show resource management interface when wallet is connected', async () => {
      (services.checkExistingSession as jest.Mock).mockResolvedValue(
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

  describe('State Management', () => {
    test('should maintain state consistency across operations', async () => {
      const user = userEvent.setup();
      (services.checkExistingSession as jest.Mock).mockResolvedValue(null);
      (services.connectWallet as jest.Mock).mockResolvedValue(mockWallet);
      (services.getBlockProducers as jest.Mock).mockResolvedValue(
        mockBlockProducers
      );

      await act(async () => {
        render(<App />);
      });

      // Connect wallet
      const connectButton = screen.getByText('Connect Wallet');
      await user.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText('Wallet Connected')).toBeInTheDocument();
      });

      // Switch network
      const networkSelect = screen.getByTestId('network-select');
      await user.selectOptions(networkSelect, 'mainnet');

      // Wallet should be disconnected
      await waitFor(() => {
        expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      });

      // Switch back
      await user.selectOptions(networkSelect, 'testnet');

      // Should check for session again
      expect(services.checkExistingSession).toHaveBeenCalledWith('testnet');
    });
  });
});
