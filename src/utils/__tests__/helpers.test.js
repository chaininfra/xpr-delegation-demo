import {
  validateBPName,
  formatBalance,
  formatResourceUsage,
  formatPercentage,
  truncateString,
  formatTransactionId,
  formatBlockNumber,
  getNetworkDisplayName,
  isEmpty,
  createDefaultAccountInfo,
  deepClone,
} from '../helpers';

describe('helpers utility functions', () => {
  describe('validateBPName', () => {
    test('should validate correct BP names', () => {
      expect(validateBPName('proton')).toBe(true);
      expect(validateBPName('protonbp')).toBe(true);
      expect(validateBPName('protondev')).toBe(true);
      expect(validateBPName('proton123')).toBe(true);
    });

    test('should reject invalid BP names', () => {
      expect(validateBPName('PROTON')).toBe(false); // uppercase
      expect(validateBPName('proton-')).toBe(false); // hyphen
      expect(validateBPName('pro')).toBe(false); // too short
      expect(validateBPName('protonchain123456')).toBe(false); // too long
      expect(validateBPName('')).toBe(false); // empty
      expect(validateBPName(null)).toBe(false); // null
      expect(validateBPName(undefined)).toBe(false); // undefined
    });
  });

  describe('formatBalance', () => {
    test('should format balance correctly', () => {
      expect(formatBalance('10.5')).toBe('10.5000 XPR');
      expect(formatBalance(10.5)).toBe('10.5000 XPR');
      expect(formatBalance('0')).toBe('0.0000 XPR');
      expect(formatBalance(null)).toBe('0.0000 XPR');
      expect(formatBalance(undefined)).toBe('0.0000 XPR');
      expect(formatBalance('10.5', 'USDC')).toBe('10.5000 USDC');
    });
  });

  describe('formatResourceUsage', () => {
    test('should format resource usage correctly', () => {
      expect(formatResourceUsage(1000, 5000)).toBe('1,000 / 5,000 (20.0%)');
      expect(formatResourceUsage(0, 1000)).toBe('0 / 1,000 (0.0%)');
      expect(formatResourceUsage(1000, 0)).toBe('1,000 / 0 (0.0%)');
      expect(formatResourceUsage(null, 1000)).toBe('0 / 0');
      expect(formatResourceUsage(1000, null)).toBe('0 / 0');
    });
  });

  describe('formatPercentage', () => {
    test('should format percentage correctly', () => {
      expect(formatPercentage(25, 100)).toBe('25.0%');
      expect(formatPercentage(0, 100)).toBe('0.0%');
      expect(formatPercentage(100, 0)).toBe('0.0%');
      expect(formatPercentage(null, 100)).toBe('0%');
      expect(formatPercentage(25, null)).toBe('0%');
    });
  });

  describe('truncateString', () => {
    test('should truncate long strings', () => {
      expect(truncateString('short')).toBe('short');
      expect(truncateString('verylongstring', 10)).toBe('verylongst...');
      expect(truncateString('', 10)).toBe('');
      expect(truncateString(null, 10)).toBe('');
    });
  });

  describe('formatTransactionId', () => {
    test('should format transaction ID correctly', () => {
      const longTxId =
        '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      expect(formatTransactionId(longTxId)).toBe('12345678...90abcdef');
      expect(formatTransactionId('short')).toBe('short');
      expect(formatTransactionId(null)).toBe('N/A');
      expect(formatTransactionId('')).toBe('N/A');
    });
  });

  describe('formatBlockNumber', () => {
    test('should format block number correctly', () => {
      expect(formatBlockNumber(1234567)).toBe('1,234,567');
      expect(formatBlockNumber(0)).toBe('0');
      expect(formatBlockNumber(null)).toBe('N/A');
      expect(formatBlockNumber(undefined)).toBe('N/A');
    });
  });

  describe('getNetworkDisplayName', () => {
    test('should return correct display names', () => {
      expect(getNetworkDisplayName('testnet')).toBe('Testnet');
      expect(getNetworkDisplayName('mainnet')).toBe('Mainnet');
      expect(getNetworkDisplayName('unknown')).toBe('unknown');
    });
  });

  describe('isEmpty', () => {
    test('should check if values are empty', () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
      expect(isEmpty('')).toBe(true);
      expect(isEmpty([])).toBe(true);
      expect(isEmpty({})).toBe(true);
      expect(isEmpty('test')).toBe(false);
      expect(isEmpty(['test'])).toBe(false);
      expect(isEmpty({ test: 'value' })).toBe(false);
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty(false)).toBe(false);
    });
  });

  describe('createDefaultAccountInfo', () => {
    test('should create default account info structure', () => {
      const accountInfo = createDefaultAccountInfo('testaccount');
      expect(accountInfo).toEqual({
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

  describe('deepClone', () => {
    test('should deep clone objects', () => {
      const original = {
        name: 'test',
        nested: { value: 123 },
        array: [1, 2, 3],
      };
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.nested).not.toBe(original.nested);
      expect(cloned.array).not.toBe(original.array);
    });

    test('should handle primitive values', () => {
      expect(deepClone('string')).toBe('string');
      expect(deepClone(123)).toBe(123);
      expect(deepClone(true)).toBe(true);
      expect(deepClone(null)).toBe(null);
    });

    test('should handle arrays', () => {
      const original = [1, { nested: 'value' }, [3, 4]];
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[1]).not.toBe(original[1]);
      expect(cloned[2]).not.toBe(original[2]);
    });
  });
});
