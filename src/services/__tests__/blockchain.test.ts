import {
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
} from '../blockchain';

// Mock dependencies
jest.mock('../../config/networks', () => ({
  getNetworkConfig: jest.fn(() => ({
    endpoints: ['https://testnet-api.chaininfra.net'],
    chainId: 'test-chain-id',
  })),
  SAMPLE_BLOCK_PRODUCERS: {
    testnet: [{ name: 'proton', url: 'https://protonchain.com' }],
  },
}));

jest.mock('../../utils/helpers', () => ({
  createDefaultAccountInfo: jest.fn(() => ({
    account_name: 'testaccount',
    core_liquid_balance: '0.0000 XPR',
    all_balances: [],
    ram_usage: 0,
    ram_quota: 0,
    cpu_limit: { used: 0, max: 0 },
    net_limit: { used: 0, max: 0 },
  })),
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('blockchain service', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    clearCache();
  });

  describe('error classes', () => {
    test('BlockchainError should create instance correctly', () => {
      const error = new BlockchainError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.type).toBe('BLOCKCHAIN_ERROR');
      expect(error.name).toBe('BlockchainError');
    });

    test('RpcError should create instance correctly', () => {
      const error = new RpcError('RPC error', 'https://test.com');
      expect(error.message).toBe('RPC error');
      expect(error.type).toBe('RPC_ERROR');
      expect(error.endpoint).toBe('https://test.com');
      expect(error.name).toBe('BlockchainError');
    });

    test('ValidationError should create instance correctly', () => {
      const error = new ValidationError('Validation error');
      expect(error.message).toBe('Validation error');
      expect(error.type).toBe('VALIDATION_ERROR');
      expect(error.name).toBe('BlockchainError');
    });
  });

  describe('getAccountInfo', () => {
    test('should validate account name', async () => {
      await expect(getAccountInfo('', 'testnet')).rejects.toThrow(
        ValidationError
      );
      await expect(getAccountInfo('', 'testnet')).rejects.toThrow(
        ValidationError
      );
      await expect(getAccountInfo('INVALID', 'testnet')).rejects.toThrow(
        ValidationError
      );
    });

    test('should validate network', async () => {
      await expect(getAccountInfo('testaccount', 'testnet')).rejects.toThrow(
        ValidationError
      );
    });

    test('should fetch account info successfully', async () => {
      const mockAccountData = {
        account_name: 'testaccount',
        core_liquid_balance: '10.0000 XPR',
        ram_usage: 1000,
        ram_quota: 10000,
        cpu_limit: { used: 100, max: 1000 },
        net_limit: { used: 200, max: 2000 },
      };

      const mockBalances = {
        rows: [{ balance: '10.0000 XPR' }],
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAccountData),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockBalances),
        });

      const result = await getAccountInfo('testaccount', 'testnet');

      expect(result).toEqual({
        ...mockAccountData,
        all_balances: ['10.0000 XPR'],
      });
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    test('should handle RPC errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await getAccountInfo('testaccount', 'testnet');

      expect(result).toEqual({
        account_name: 'testaccount',
        core_liquid_balance: '0.0000 XPR',
        all_balances: [],
        ram_usage: 0,
        ram_quota: 0,
        cpu_limit: { used: 0, max: 0 },
        net_limit: { used: 0, max: 0 },
      });
    });
  });

  describe('getBlockProducers', () => {
    test('should validate network', async () => {
      await expect(getBlockProducers('testnet')).rejects.toThrow(
        ValidationError
      );
    });

    test('should fetch block producers successfully', async () => {
      const mockProducersData = {
        rows: [
          {
            owner: 'proton',
            url: 'https://protonchain.com',
            total_votes: '1000000',
          },
        ],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProducersData),
      });

      const result = await getBlockProducers('testnet');

      expect(result).toEqual([
        {
          name: 'proton',
          url: 'https://protonchain.com',
          total_votes: '1000000',
        },
      ]);
    });

    test('should fallback to sample data on error', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await getBlockProducers('testnet');

      expect(result).toEqual([
        { name: 'proton', url: 'https://protonchain.com' },
      ]);
    });
  });

  describe('delegateVotes', () => {
    const mockSession = {
      auth: { actor: 'testaccount', permission: 'owner' },
      transact: jest.fn(),
    };

    beforeEach(() => {
      mockSession.transact.mockClear();
    });

    test('should validate inputs', async () => {
      await expect(
        delegateVotes('', 'proton', 'testnet', mockSession)
      ).rejects.toThrow(ValidationError);
      await expect(
        delegateVotes('testaccount', '', 'testnet', mockSession)
      ).rejects.toThrow(ValidationError);
      await expect(
        delegateVotes('testaccount', 'proton', 'testnet', null)
      ).rejects.toThrow(ValidationError);
    });

    test('should delegate votes successfully', async () => {
      const mockTransactionResult = {
        transaction_id: 'test-tx-id',
        processed: { block_num: 12345 },
      };

      mockSession.transact.mockResolvedValue(mockTransactionResult);

      // Mock getAccountInfo and checkVotingResources
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              account_name: 'testaccount',
              cpu_limit: { used: 100, max: 1000 },
              net_limit: { used: 200, max: 2000 },
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ rows: [] }),
        });

      const result = await delegateVotes(
        'testaccount',
        'proton',
        'testnet',
        mockSession
      );

      expect(result).toEqual({
        transactionId: 'test-tx-id',
        blockNum: 12345,
        status: 'success',
      });
      expect(mockSession.transact).toHaveBeenCalled();
    });
  });

  describe('getVoteInfo', () => {
    test('should validate inputs', async () => {
      await expect(getVoteInfo('', 'testnet')).rejects.toThrow(ValidationError);
      await expect(getVoteInfo('testaccount', 'testnet')).rejects.toThrow(
        ValidationError
      );
    });

    test('should fetch vote info successfully', async () => {
      const mockVoteData = {
        rows: [
          {
            owner: 'testaccount',
            proxy: '',
            producers: ['proton'],
            last_vote_weight: '1000000',
            last_vote_time: '2023-01-01T00:00:00.000Z',
            staked: '100.0000 XPR',
          },
        ],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockVoteData),
      });

      const result = await getVoteInfo('testaccount', 'testnet');

      expect(result).toEqual({
        owner: 'testaccount',
        proxy: '',
        producers: ['proton'],
        last_vote_weight: '1000000',
        last_vote_time: '2023-01-01T00:00:00.000Z',
        staked: '100.0000 XPR',
      });
    });

    test('should return null when no vote info found', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ rows: [] }),
      });

      const result = await getVoteInfo('testaccount', 'testnet');
      expect(result).toBeNull();
    });
  });

  describe('checkVotingResources', () => {
    test('should validate inputs', async () => {
      await expect(checkVotingResources('', 'testnet')).rejects.toThrow(
        ValidationError
      );
      await expect(
        checkVotingResources('testaccount', 'testnet')
      ).rejects.toThrow(ValidationError);
    });

    test('should check voting resources successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            account_name: 'testaccount',
            cpu_limit: { used: 100, max: 1000 },
            net_limit: { used: 200, max: 2000 },
            ram_usage: 500,
            ram_quota: 10000,
          }),
      });

      const result = await checkVotingResources('testaccount', 'testnet');

      expect(result).toEqual({
        canVote: true,
        cpuAvailable: 900,
        netAvailable: 1800,
        ramAvailable: 9500,
        minCpuRequired: 1000,
        minNetRequired: 1000,
      });
    });
  });

  describe('getCurrencyBalance', () => {
    test('should validate inputs', async () => {
      await expect(getCurrencyBalance('', 'XPR', 'testnet')).rejects.toThrow(
        ValidationError
      );
      await expect(
        getCurrencyBalance('testaccount', 'XPR', 'testnet')
      ).rejects.toThrow(ValidationError);
    });

    test('should fetch currency balance successfully', async () => {
      const mockBalanceData = {
        rows: [{ balance: '10.0000 XPR' }],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBalanceData),
      });

      const result = await getCurrencyBalance('testaccount', 'XPR', 'testnet');

      expect(result).toBe('10.0000 XPR');
    });

    test('should return default balance when no balance found', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ rows: [] }),
      });

      const result = await getCurrencyBalance('testaccount', 'XPR', 'testnet');
      expect(result).toBe('0.0000 XPR');
    });
  });

  describe('stakeResources', () => {
    const mockSession = {
      auth: { actor: 'testaccount', permission: 'owner' },
      transact: jest.fn(),
    };

    beforeEach(() => {
      mockSession.transact.mockClear();
    });

    test('should validate inputs', async () => {
      await expect(
        stakeResources('', { cpu: 10, net: 10 }, 'testnet', mockSession)
      ).rejects.toThrow(ValidationError);
      await expect(
        stakeResources(
          'testaccount',
          { cpu: 0, net: 0 },
          'testnet',
          mockSession
        )
      ).rejects.toThrow(ValidationError);
      await expect(
        stakeResources('testaccount', { cpu: 10, net: 10 }, 'testnet', null)
      ).rejects.toThrow(ValidationError);
    });

    test('should stake resources successfully', async () => {
      const mockTransactionResult = {
        transaction_id: 'test-tx-id',
      };

      mockSession.transact.mockResolvedValue(mockTransactionResult);

      const result = await stakeResources(
        'testaccount',
        { cpu: 10, net: 10 },
        'testnet',
        mockSession
      );

      expect(result).toEqual({
        transactionId: 'test-tx-id',
        actions: 1,
        totalStaked: 20,
      });
      expect(mockSession.transact).toHaveBeenCalled();
    });
  });

  describe('unstakeResources', () => {
    const mockSession = {
      auth: { actor: 'testaccount', permission: 'owner' },
      transact: jest.fn(),
    };

    beforeEach(() => {
      mockSession.transact.mockClear();
    });

    test('should validate inputs', async () => {
      await expect(
        unstakeResources('', { cpu: 10, net: 10 }, 'testnet', mockSession)
      ).rejects.toThrow(ValidationError);
      await expect(
        unstakeResources(
          'testaccount',
          { cpu: 0, net: 0 },
          'testnet',
          mockSession
        )
      ).rejects.toThrow(ValidationError);
      await expect(
        unstakeResources('testaccount', { cpu: 10, net: 10 }, 'testnet', null)
      ).rejects.toThrow(ValidationError);
    });

    test('should unstake resources successfully', async () => {
      const mockTransactionResult = {
        transaction_id: 'test-tx-id',
      };

      mockSession.transact.mockResolvedValue(mockTransactionResult);

      const result = await unstakeResources(
        'testaccount',
        { cpu: 10, net: 10 },
        'testnet',
        mockSession
      );

      expect(result).toEqual({
        transactionId: 'test-tx-id',
        actions: 1,
        totalUnstaked: 20,
      });
      expect(mockSession.transact).toHaveBeenCalled();
    });
  });

  describe('getCoreSymbol', () => {
    test('should validate network', async () => {
      await expect(getCoreSymbol('testnet')).rejects.toThrow(ValidationError);
    });

    test('should fetch core symbol successfully', async () => {
      const mockStatData = {
        rows: [{ supply: '1000000.0000 XPR' }],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatData),
      });

      const result = await getCoreSymbol('testnet');
      expect(result).toBe('XPR');
    });

    test('should return fallback symbol on error', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await getCoreSymbol('testnet');
      expect(result).toBe('XPR');
    });
  });

  describe('clearCache', () => {
    test('should clear specific cache key', () => {
      // This test verifies the function exists and can be called
      expect(() => clearCache('test-key')).not.toThrow();
    });

    test('should clear all cache', () => {
      // This test verifies the function exists and can be called
      expect(() => clearCache()).not.toThrow();
    });
  });
});
