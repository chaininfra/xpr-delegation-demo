/**
 * Security Utilities Tests
 *
 * Comprehensive tests for security utilities including input validation,
 * sanitization, rate limiting, and XSS prevention.
 *
 * @fileoverview Security utilities tests for XPR Delegation Demo
 */

import {
  sanitizeInput,
  validateAccountName,
  validateNetwork,
  validateAmount,
  RateLimiter,
  validateTransactionData,
  escapeHtml,
  validateUrl,
  generateSecureRandomString,
  sanitizeObject,
} from '../security';

describe('Security Utilities', () => {
  describe('sanitizeInput', () => {
    test('should remove HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe(
        'scriptalert("xss")/script'
      );
    });

    test('should remove javascript: protocol', () => {
      expect(sanitizeInput('javascript:alert("xss")')).toBe('alert("xss")');
    });

    test('should remove event handlers', () => {
      expect(sanitizeInput('onclick=alert("xss")')).toBe('alert("xss")');
    });

    test('should trim whitespace', () => {
      expect(sanitizeInput('  test  ')).toBe('test');
    });

    test('should handle non-string input', () => {
      expect(sanitizeInput(null as any)).toBe('');
      expect(sanitizeInput(undefined as any)).toBe('');
      expect(sanitizeInput(123 as any)).toBe('');
    });
  });

  describe('validateAccountName', () => {
    test('should validate correct account names', () => {
      expect(validateAccountName('testuser')).toBe(true);
      expect(validateAccountName('proton')).toBe(true);
      expect(validateAccountName('a1b2c3d4')).toBe(true);
    });

    test('should reject invalid account names', () => {
      expect(validateAccountName('')).toBe(false);
      expect(validateAccountName('TestUser')).toBe(false); // uppercase
      expect(validateAccountName('test-user')).toBe(false); // hyphen
      expect(validateAccountName('test@user')).toBe(false); // special char
      expect(validateAccountName('abc')).toBe(false); // too short
      expect(validateAccountName('abcdefghijklm')).toBe(false); // too long
      expect(validateAccountName('test678')).toBe(false); // number > 5
    });

    test('should handle non-string input', () => {
      expect(validateAccountName(null as any)).toBe(false);
      expect(validateAccountName(undefined as any)).toBe(false);
      expect(validateAccountName(123 as any)).toBe(false);
    });
  });

  describe('validateNetwork', () => {
    test('should validate correct networks', () => {
      expect(validateNetwork('testnet')).toBe(true);
      expect(validateNetwork('mainnet')).toBe(true);
    });

    test('should reject invalid networks', () => {
      expect(validateNetwork('devnet')).toBe(false);
      expect(validateNetwork('')).toBe(false);
      expect(validateNetwork('TESTNET')).toBe(false);
    });
  });

  describe('validateAmount', () => {
    test('should validate correct amounts', () => {
      expect(validateAmount('10.5')).toBe(true);
      expect(validateAmount('100')).toBe(true);
      expect(validateAmount('0.0001')).toBe(true);
      expect(validateAmount('1000000')).toBe(true);
    });

    test('should reject invalid amounts', () => {
      expect(validateAmount('0')).toBe(false);
      expect(validateAmount('-10')).toBe(false);
      expect(validateAmount('1000001')).toBe(false); // too large
      expect(validateAmount('10.12345')).toBe(false); // too many decimals
      expect(validateAmount('abc')).toBe(false);
      expect(validateAmount('')).toBe(false);
    });
  });

  describe('RateLimiter', () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
      rateLimiter = new RateLimiter(2, 1000); // 2 requests per second
    });

    test('should allow requests within limit', () => {
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(true);
    });

    test('should block requests over limit', () => {
      rateLimiter.isAllowed('user1');
      rateLimiter.isAllowed('user1');
      expect(rateLimiter.isAllowed('user1')).toBe(false);
    });

    test('should reset after window', async () => {
      rateLimiter.isAllowed('user1');
      rateLimiter.isAllowed('user1');
      expect(rateLimiter.isAllowed('user1')).toBe(false);

      // Wait for window to reset
      await new Promise(resolve => setTimeout(resolve, 1100));
      expect(rateLimiter.isAllowed('user1')).toBe(true);
    });

    test('should track different users separately', () => {
      rateLimiter.isAllowed('user1');
      rateLimiter.isAllowed('user1');
      expect(rateLimiter.isAllowed('user1')).toBe(false);

      expect(rateLimiter.isAllowed('user2')).toBe(true);
      expect(rateLimiter.isAllowed('user2')).toBe(true);
    });

    test('should return remaining requests', () => {
      expect(rateLimiter.getRemainingRequests('user1')).toBe(2);
      rateLimiter.isAllowed('user1');
      expect(rateLimiter.getRemainingRequests('user1')).toBe(1);
      rateLimiter.isAllowed('user1');
      expect(rateLimiter.getRemainingRequests('user1')).toBe(0);
    });
  });

  describe('validateTransactionData', () => {
    test('should validate correct transaction data', () => {
      const validData = {
        account: 'eosio',
        name: 'voteproducer',
        authorization: [{ actor: 'testuser', permission: 'owner' }],
        data: { voter: 'testuser', producers: ['proton'] },
      };
      expect(validateTransactionData(validData)).toBe(true);
    });

    test('should reject invalid transaction data', () => {
      expect(validateTransactionData(null)).toBe(false);
      expect(validateTransactionData({})).toBe(false);
      expect(validateTransactionData({ account: 'eosio' })).toBe(false);
      expect(
        validateTransactionData({
          account: 'eosio',
          name: 'voteproducer',
          authorization: [],
          data: {},
        })
      ).toBe(false);
      expect(
        validateTransactionData({
          account: 'eosio',
          name: 'voteproducer',
          authorization: [{ actor: 'invalid@user', permission: 'owner' }],
          data: {},
        })
      ).toBe(false);
    });
  });

  describe('escapeHtml', () => {
    test('should escape HTML characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
      expect(escapeHtml('test & test')).toBe('test &amp; test');
      expect(escapeHtml('\'single\' and "double" quotes')).toBe(
        '&#039;single&#039; and &quot;double&quot; quotes'
      );
    });

    test('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });
  });

  describe('validateUrl', () => {
    test('should validate correct URLs', () => {
      expect(validateUrl('https://example.com')).toBe(true);
      expect(validateUrl('https://api.protonnz.com')).toBe(true);
    });

    test('should reject invalid URLs', () => {
      expect(validateUrl('http://example.com')).toBe(false); // not HTTPS
      expect(validateUrl('javascript:alert("xss")')).toBe(false);
      expect(validateUrl('data:text/html,<script>alert("xss")</script>')).toBe(
        false
      );
      expect(validateUrl('vbscript:msgbox("xss")')).toBe(false);
      expect(validateUrl('not-a-url')).toBe(false);
      expect(validateUrl('')).toBe(false);
    });
  });

  describe('generateSecureRandomString', () => {
    test('should generate string of correct length', () => {
      const result = generateSecureRandomString(16);
      expect(result).toHaveLength(16);
    });

    test('should generate different strings', () => {
      const result1 = generateSecureRandomString(32);
      const result2 = generateSecureRandomString(32);
      expect(result1).not.toBe(result2);
    });

    test('should use default length', () => {
      const result = generateSecureRandomString();
      expect(result).toHaveLength(32);
    });

    test('should only contain valid characters', () => {
      const result = generateSecureRandomString(100);
      expect(result).toMatch(/^[A-Za-z0-9]+$/);
    });
  });

  describe('sanitizeObject', () => {
    test('should sanitize string values', () => {
      const obj = {
        name: '<script>alert("xss")</script>',
        description: '  test  ',
      };
      const result = sanitizeObject(obj);
      expect(result.name).toBe('scriptalert("xss")/script');
      expect(result.description).toBe('test');
    });

    test('should sanitize nested objects', () => {
      const obj = {
        user: {
          name: '<script>alert("xss")</script>',
          email: 'test@example.com',
        },
      };
      const result = sanitizeObject(obj);
      expect(result.user.name).toBe('scriptalert("xss")/script');
      expect(result.user.email).toBe('test@example.com');
    });

    test('should sanitize arrays', () => {
      const obj = {
        tags: ['<script>alert("xss")</script>', 'normal', '  spaced  '],
      };
      const result = sanitizeObject(obj);
      expect(result.tags[0]).toBe('scriptalert("xss")/script');
      expect(result.tags[1]).toBe('normal');
      expect(result.tags[2]).toBe('spaced');
    });

    test('should handle null and undefined', () => {
      expect(sanitizeObject(null)).toBe(null);
      expect(sanitizeObject(undefined)).toBe(undefined);
    });

    test('should handle primitive values', () => {
      expect(sanitizeObject(123)).toBe(123);
      expect(sanitizeObject(true)).toBe(true);
    });
  });
});
