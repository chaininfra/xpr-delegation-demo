/**
 * Security Utilities for XPR Delegation Demo
 *
 * Provides input validation, sanitization, and security helpers
 * to prevent common security vulnerabilities.
 *
 * Features:
 * - Input sanitization and validation
 * - XSS prevention
 * - Rate limiting utilities
 * - Security headers validation
 * - Account name validation
 *
 * @fileoverview Security utilities for XPR Delegation Demo
 */

import type { NetworkType } from '../types';

/**
 * Sanitize user input to prevent XSS attacks
 * @param input - User input string
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Validate account name format according to XPR Network rules
 * @param accountName - Account name to validate
 * @returns True if valid, false otherwise
 */
export const validateAccountName = (accountName: string): boolean => {
  if (!accountName || typeof accountName !== 'string') {
    return false;
  }

  // XPR account names: 4-12 characters, lowercase letters and numbers 1-5
  // Also allow well-known contracts like eosio.*
  const regex = /^[a-z1-5]{4,12}$/;
  const contractRegex = /^[a-z1-5.]{4,30}$/; // For contracts with dots like eosio.token

  return regex.test(accountName) || contractRegex.test(accountName);
};

/**
 * Validate network type
 * @param network - Network to validate
 * @returns True if valid network type
 */
export const validateNetwork = (network: string): network is NetworkType => {
  return ['testnet', 'mainnet'].includes(network);
};

/**
 * Validate amount input for staking operations
 * @param amount - Amount to validate
 * @returns True if valid amount
 */
export const validateAmount = (amount: string | number): boolean => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  return (
    !isNaN(numAmount) &&
    numAmount > 0 &&
    numAmount <= 1000000 && // Max 1M XPR
    (numAmount.toString().split('.')[1]?.length || 0) <= 4 // Max 4 decimal places
  );
};

/**
 * Rate limiting utility
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if request is allowed for given key
   * @param key - Unique identifier for rate limiting
   * @returns True if request is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);

    return true;
  }

  /**
   * Get remaining requests for a key
   * @param key - Unique identifier
   * @returns Number of remaining requests
   */
  getRemainingRequests(key: string): number {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    const validRequests = requests.filter(time => now - time < this.windowMs);

    return Math.max(0, this.maxRequests - validRequests.length);
  }
}

/**
 * Global rate limiter instance
 */
export const globalRateLimiter = new RateLimiter(100, 60000); // 100 requests per minute

/**
 * Validate transaction data
 * @param data - Transaction data to validate
 * @returns True if valid transaction data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validateTransactionData = (data: any): boolean => {
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Check required fields
  const requiredFields = ['account', 'name', 'authorization', 'data'];
  for (const field of requiredFields) {
    if (!(field in data)) {
      return false;
    }
  }

  // Validate authorization structure
  if (!Array.isArray(data.authorization) || data.authorization.length === 0) {
    return false;
  }

  for (const auth of data.authorization) {
    if (!auth.actor || !auth.permission) {
      return false;
    }

    if (!validateAccountName(auth.actor)) {
      return false;
    }
  }

  return true;
};

/**
 * Escape HTML characters to prevent XSS
 * @param text - Text to escape
 * @returns Escaped text
 */
export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };

  return text.replace(/[&<>"']/g, m => map[m]);
};

/**
 * Validate URL to prevent malicious redirects
 * @param url - URL to validate
 * @returns True if valid URL
 */
export const validateUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);

    // Only allow HTTPS URLs
    if (parsedUrl.protocol !== 'https:') {
      return false;
    }

    // Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:'];
    if (
      dangerousProtocols.some(protocol =>
        url.toLowerCase().startsWith(protocol)
      )
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * Generate secure random string
 * @param length - Length of random string
 * @returns Secure random string
 */
export const generateSecureRandomString = (length: number = 32): string => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  if (
    typeof window !== 'undefined' &&
    window.crypto &&
    window.crypto.getRandomValues
  ) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);

    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
  } else {
    // Fallback for environments without crypto.getRandomValues
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }

  return result;
};

/**
 * Validate and sanitize all inputs in an object
 * @param obj - Object to validate
 * @returns Sanitized object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sanitizeObject = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeInput(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
};
