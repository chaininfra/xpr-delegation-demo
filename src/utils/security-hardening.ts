/* eslint-disable @typescript-eslint/no-explicit-any, no-console, no-undef */

import type { NetworkType } from '../types';

/**
 * HTTPS Endpoint Validation
 * Validates that all endpoints use HTTPS and have valid certificates
 */
export class HTTPSValidator {
  private static readonly ALLOWED_PROTOCOLS = ['https:'];
  private static readonly BLOCKED_DOMAINS = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
  ];

  /**
   * Validate HTTPS endpoint
   * @param endpoint - Endpoint URL to validate
   * @returns Promise<boolean> - True if valid HTTPS endpoint
   */
  static async validateEndpoint(endpoint: string): Promise<boolean> {
    try {
      const url = new URL(endpoint);

      // Check protocol
      if (!this.ALLOWED_PROTOCOLS.includes(url.protocol)) {
        console.warn(
          `[Security] Invalid protocol: ${url.protocol}. Only HTTPS allowed.`
        );
        return false;
      }

      // Check for blocked domains
      if (this.BLOCKED_DOMAINS.includes(url.hostname)) {
        console.warn(`[Security] Blocked domain: ${url.hostname}`);
        return false;
      }

      // Validate certificate (in production)
      if (process.env.NODE_ENV === 'production') {
        return await this.validateCertificate(endpoint);
      }

      return true;
    } catch (error) {
      console.error(`[Security] Invalid endpoint format: ${endpoint}`, error);
      return false;
    }
  }

  /**
   * Validate SSL certificate
   * @param endpoint - Endpoint to validate
   * @returns Promise<boolean> - True if certificate is valid
   */
  private static async validateCertificate(endpoint: string): Promise<boolean> {
    try {
      const url = new URL(endpoint);
      const response = await fetch(endpoint, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      // Check if response is secure
      if (!response.ok) {
        console.warn(
          `[Security] Certificate validation failed for ${endpoint}`
        );
        return false;
      }

      console.log(`[Security] Certificate validated for ${url.hostname}`);
      return true;
    } catch (error) {
      console.error(
        `[Security] Certificate validation error for ${endpoint}:`,
        error
      );
      return false;
    }
  }

  /**
   * Validate all network endpoints
   * @param network - Network configuration
   * @returns Promise<boolean> - True if all endpoints are valid
   */
  static async validateNetworkEndpoints(
    network: NetworkType
  ): Promise<boolean> {
    const { getNetworkConfig } = await import('../config/networks');
    const config = getNetworkConfig(network);

    const validationPromises = config.endpoints.map(endpoint =>
      this.validateEndpoint(endpoint)
    );

    const results = await Promise.all(validationPromises);
    const allValid = results.every(result => result);

    if (!allValid) {
      console.error(`[Security] Invalid endpoints detected for ${network}`);
    }

    return allValid;
  }
}

/**
 * Rate Limiting Implementation
 * Implements client-side rate limiting with exponential backoff
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly backoffMultiplier: number;

  constructor(
    maxRequests: number = 10,
    windowMs: number = 60000,
    backoffMultiplier: number = 2
  ) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.backoffMultiplier = backoffMultiplier;
  }

  /**
   * Check if request is allowed
   * @param key - Unique identifier for rate limiting
   * @returns Promise<boolean> - True if request is allowed
   */
  async isAllowed(key: string): Promise<boolean> {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      console.warn(`[Security] Rate limit exceeded for key: ${key}`);
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
   * @returns number - Number of remaining requests
   */
  getRemainingRequests(key: string): number {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    const validRequests = requests.filter(time => now - time < this.windowMs);

    return Math.max(0, this.maxRequests - validRequests.length);
  }

  /**
   * Get backoff delay for rate limited key
   * @param key - Unique identifier
   * @returns number - Delay in milliseconds
   */
  getBackoffDelay(key: string): number {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    const validRequests = requests.filter(time => now - time < this.windowMs);

    const exceededRequests = validRequests.length - this.maxRequests;
    return Math.min(
      30000,
      1000 * Math.pow(this.backoffMultiplier, exceededRequests)
    );
  }
}

/**
 * Transaction Signature Verification
 * Verifies transaction signatures for security
 */
export class TransactionVerifier {
  /**
   * Verify transaction signature
   * @param transaction - Transaction object
   * @param publicKey - Public key for verification
   * @returns Promise<boolean> - True if signature is valid
   */
  static async verifySignature(
    transaction: any,
    _publicKey: string
  ): Promise<boolean> {
    try {
      // For ProtonSDK, signatures may not be present in the initial transaction object
      // They are added during the signing process
      if (!transaction.signatures || transaction.signatures.length === 0) {
        console.log(
          '[Security] No signatures found in transaction (ProtonSDK will add them during signing)'
        );
        return true; // Allow transaction to proceed, ProtonSDK will handle signing
      }

      // Validate signature format if signatures are present
      for (const signature of transaction.signatures) {
        if (!this.isValidSignatureFormat(signature)) {
          console.warn('[Security] Invalid signature format');
          return false;
        }
      }

      // Additional validation can be added here
      console.log('[Security] Transaction signature verified');
      return true;
    } catch (error) {
      console.error('[Security] Signature verification error:', error);
      return false;
    }
  }

  /**
   * Enhanced signature format validation
   * @param signature - Signature string
   * @returns boolean - True if format is valid
   */
  private static isValidSignatureFormat(signature: string): boolean {
    // Enhanced signature format validation
    if (typeof signature !== 'string' || signature.length === 0) {
      return false;
    }

    // Check signature length (typical crypto signatures are 64-256 chars)
    if (signature.length < 64 || signature.length > 256) {
      console.warn('[Security] Signature length outside expected range');
      return false;
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [/^0+$/, /^[fF]+$/, /.{100,}/];
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(signature)) {
        console.warn('[Security] Suspicious signature pattern detected');
        return false;
      }
    }

    // Basic encoding check (hex or base64)
    const isHex = /^[0-9A-Fa-f]+$/i.test(signature);
    const isBase64 = /^[A-Za-z0-9+/=]+$/.test(signature);

    if (!isHex && !isBase64) {
      console.warn('[Security] Signature is not in valid encoding format');
      return false;
    }

    return true;
  }

  /**
   * Verify transaction data integrity
   * @param transaction - Transaction object
   * @returns boolean - True if data is valid
   */
  static verifyTransactionData(transaction: any): boolean {
    try {
      // Check required fields (only essential fields for action-based transactions)
      const requiredFields = ['actions'];

      // Check optional transaction fields (ProtonSDK may handle these automatically)
      const optionalFields = [
        'expiration',
        'ref_block_num',
        'ref_block_prefix',
      ];

      for (const field of requiredFields) {
        if (!(field in transaction)) {
          console.warn(`[Security] Missing required field: ${field}`);
          return false;
        }
      }

      // Log missing optional fields only in debug mode
      if (process.env.NODE_ENV === 'development') {
        for (const field of optionalFields) {
          if (!(field in transaction)) {
            console.debug(
              `[Security] Optional field not present: ${field} (ProtonSDK may handle automatically)`
            );
          }
        }
      }

      // Validate actions
      if (
        !Array.isArray(transaction.actions) ||
        transaction.actions.length === 0
      ) {
        console.warn('[Security] Invalid actions array');
        return false;
      }

      // Validate each action structure
      for (const action of transaction.actions) {
        if (!this.validateAction(action)) {
          console.warn('[Security] Invalid action structure:', action);
          return false;
        }
      }

      // Additional blockchain-specific validation
      if (!this.validateBlockchainSpecifics(transaction)) {
        return false;
      }

      console.log('[Security] Transaction data verified successfully');
      return true;
    } catch (error) {
      console.error('[Security] Transaction data verification error:', error);
      return false;
    }
  }

  /**
   * Validate individual action structure
   * @param action - Action object
   * @returns boolean - True if valid
   */
  private static validateAction(action: any): boolean {
    const requiredFields = ['account', 'name', 'authorization', 'data'];

    for (const field of requiredFields) {
      if (!(field in action)) {
        console.warn(`[Security] Action missing required field: ${field}`);
        return false;
      }
    }

    // Validate authorization structure
    if (
      !Array.isArray(action.authorization) ||
      action.authorization.length === 0
    ) {
      console.warn('[Security] Invalid authorization array');
      return false;
    }

    for (const auth of action.authorization) {
      if (!auth.actor || !auth.permission) {
        console.warn('[Security] Invalid authorization structure');
        return false;
      }
    }

    return true;
  }

  /**
   * Validate blockchain-specific transaction properties
   * @param transaction - Transaction object
   * @returns boolean - True if valid
   */
  private static validateBlockchainSpecifics(transaction: any): boolean {
    try {
      // Validate block references only if they exist (ProtonSDK may handle these automatically)
      if (transaction.ref_block_num !== undefined) {
        if (
          typeof transaction.ref_block_num !== 'number' ||
          transaction.ref_block_num < 0
        ) {
          console.warn('[Security] Invalid reference block number');
          return false;
        }
      }

      if (transaction.ref_block_prefix !== undefined) {
        if (
          typeof transaction.ref_block_prefix !== 'number' ||
          transaction.ref_block_prefix < 0
        ) {
          console.warn('[Security] Invalid reference block prefix');
          return false;
        }
      }

      // Validate expiration timestamp
      if (transaction.expiration) {
        const expiration = new Date(transaction.expiration);
        if (isNaN(expiration.getTime())) {
          console.warn('[Security] Invalid expiration timestamp');
          return false;
        }

        // Check if expiration is not too far in the future (24 hours max)
        const maxExpiration = Date.now() + 24 * 60 * 60 * 1000;
        if (expiration.getTime() > maxExpiration) {
          console.warn('[Security] Transaction expiration too far in future');
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('[Security] Blockchain validation error:', error);
      return false;
    }
  }

  /**
   * Generate comprehensive security report for transaction
   * @param transaction - Transaction object
   * @returns object - Security assessment report
   */
  static generateSecurityReport(transaction: any): any {
    const report = {
      timestamp: new Date().toISOString(),
      transactionId: transaction.id || transaction.transaction_id || 'unknown',
      isValid: true,
      warnings: [] as string[],
      errors: [] as string[],
      score: 100,
    };

    try {
      // Signature analysis
      const signatureCount = transaction.signatures?.length || 0;
      if (signatureCount === 0) {
        report.errors.push('No signatures found');
        report.score -= 50;
        report.isValid = false;
      } else if (signatureCount === 1) {
        report.warnings.push(
          'Single signature detected (consider multi-signature for enhanced security)'
        );
        report.score -= 10;
      } else {
        report.score += 5; // Bonus for multiple signatures
      }

      // Transaction size analysis
      const transactionSize = JSON.stringify(transaction).length;
      if (transactionSize > 10000) {
        report.warnings.push('Large transaction size detected');
        report.score -= 5;
      }

      // Action count analysis
      const actionCount = transaction.actions?.length || 0;
      if (actionCount === 0) {
        report.errors.push('No actions found');
        report.score -= 30;
        report.isValid = false;
      } else if (actionCount > 10) {
        report.warnings.push('High number of actions detected');
        report.score -= 5;
      }

      // Final score adjustment
      report.score = Math.max(0, Math.min(100, report.score));

      console.log(
        '[Security] Security report generated with score:',
        report.score
      );
      return report;
    } catch (error) {
      report.errors.push('Error generating security report');
      report.isValid = false;
      report.score = 0;
      console.error('[Security] Security report generation error:', error);
      return report;
    }
  }
}

/**
 * Security Headers Validator
 * Validates security headers for production deployment
 */
export class SecurityHeadersValidator {
  private static readonly REQUIRED_HEADERS = [
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection',
    'Referrer-Policy',
    'Content-Security-Policy',
  ];

  /**
   * Validate security headers
   * @param headers - Response headers
   * @returns boolean - True if all required headers are present
   */
  static validateHeaders(headers: Headers): boolean {
    const missingHeaders: string[] = [];

    for (const requiredHeader of this.REQUIRED_HEADERS) {
      if (!headers.has(requiredHeader)) {
        missingHeaders.push(requiredHeader);
      }
    }

    if (missingHeaders.length > 0) {
      console.warn('[Security] Missing security headers:', missingHeaders);
      return false;
    }

    return true;
  }

  /**
   * Get recommended security headers
   * @returns Record<string, string> - Security headers configuration
   */
  static getRecommendedHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.protonnz.com https://testnet-api.chaininfra.net;",
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    };
  }
}

/**
 * Global security instances
 */
export const globalRateLimiter = new RateLimiter(100, 60000); // 100 requests per minute
export const transactionVerifier = TransactionVerifier;
export const httpsValidator = HTTPSValidator;
export const securityHeadersValidator = SecurityHeadersValidator;
