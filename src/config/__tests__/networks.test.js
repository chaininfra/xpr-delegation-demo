import {
  NETWORKS,
  SAMPLE_BLOCK_PRODUCERS,
  getNetworkConfig,
  isValidNetwork,
  getAvailableNetworks,
} from '../networks';

describe('network configuration', () => {
  describe('NETWORKS', () => {
    test('should have correct testnet configuration', () => {
      expect(NETWORKS.testnet).toEqual({
        name: 'Testnet',
        chainId:
          '71ee83bcf52142d61019d95f9cc5427ba6a0d7ff8accd9e2088ae2abeaf3d3dd',
        endpoints: ['https://testnet-api.chaininfra.net'],
        appName: 'XPR Delegation Demo',
        webauth: 'testnet.webauth.com',
        color: '#27ae60',
      });
    });

    test('should have correct mainnet configuration', () => {
      expect(NETWORKS.mainnet).toEqual({
        name: 'Mainnet',
        chainId:
          '384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0',
        endpoints: ['https://api.protonnz.com'],
        appName: 'XPR Delegation Demo',
        webauth: 'webauth.com',
        color: '#f39c12',
      });
    });

    test('should have valid chain IDs', () => {
      expect(NETWORKS.testnet.chainId).toMatch(/^[a-f0-9]{64}$/);
      expect(NETWORKS.mainnet.chainId).toMatch(/^[a-f0-9]{64}$/);
    });

    test('should have valid endpoints', () => {
      expect(NETWORKS.testnet.endpoints[0]).toMatch(/^https:\/\//);
      expect(NETWORKS.mainnet.endpoints[0]).toMatch(/^https:\/\//);
    });
  });

  describe('SAMPLE_BLOCK_PRODUCERS', () => {
    test('should have testnet producers', () => {
      expect(SAMPLE_BLOCK_PRODUCERS.testnet).toBeDefined();
      expect(Array.isArray(SAMPLE_BLOCK_PRODUCERS.testnet)).toBe(true);
      expect(SAMPLE_BLOCK_PRODUCERS.testnet.length).toBeGreaterThan(0);
    });

    test('should have mainnet producers', () => {
      expect(SAMPLE_BLOCK_PRODUCERS.mainnet).toBeDefined();
      expect(Array.isArray(SAMPLE_BLOCK_PRODUCERS.mainnet)).toBe(true);
      expect(SAMPLE_BLOCK_PRODUCERS.mainnet.length).toBeGreaterThan(0);
    });

    test('should have valid producer structure', () => {
      const producer = SAMPLE_BLOCK_PRODUCERS.testnet[0];
      expect(producer).toHaveProperty('name');
      expect(producer).toHaveProperty('url');
      expect(typeof producer.name).toBe('string');
      expect(typeof producer.url).toBe('string');
      expect(producer.url).toMatch(/^https:\/\//);
    });
  });

  describe('getNetworkConfig', () => {
    test('should return testnet config by default', () => {
      const config = getNetworkConfig();
      expect(config).toEqual(NETWORKS.testnet);
    });

    test('should return testnet config explicitly', () => {
      const config = getNetworkConfig('testnet');
      expect(config).toEqual(NETWORKS.testnet);
    });

    test('should return mainnet config', () => {
      const config = getNetworkConfig('mainnet');
      expect(config).toEqual(NETWORKS.mainnet);
    });

    test('should throw error for invalid network', () => {
      expect(() => getNetworkConfig('invalid')).toThrow(
        'Unsupported network: invalid'
      );
    });
  });

  describe('isValidNetwork', () => {
    test('should validate correct networks', () => {
      expect(isValidNetwork('testnet')).toBe(true);
      expect(isValidNetwork('mainnet')).toBe(true);
    });

    test('should reject invalid networks', () => {
      expect(isValidNetwork('invalid')).toBe(false);
      expect(isValidNetwork('')).toBe(false);
      expect(isValidNetwork(null)).toBe(false);
      expect(isValidNetwork(undefined)).toBe(false);
    });
  });

  describe('getAvailableNetworks', () => {
    test('should return array of available networks', () => {
      const networks = getAvailableNetworks();
      expect(Array.isArray(networks)).toBe(true);
      expect(networks).toContain('testnet');
      expect(networks).toContain('mainnet');
      expect(networks.length).toBe(2);
    });
  });
});
