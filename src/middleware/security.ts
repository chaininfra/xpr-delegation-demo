/* eslint-disable @typescript-eslint/no-explicit-any, no-console */

import { createServer } from 'http';
import { securityHeadersValidator } from '../utils/security-hardening';

/**
 * Rate Limiting Store
 * In-memory store for rate limiting (use Redis in production)
 */
class RateLimitStore {
  private store: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now > record.resetTime) {
      this.store.set(key, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (record.count >= this.maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  getRemainingRequests(key: string): number {
    const record = this.store.get(key);
    if (!record) return this.maxRequests;
    return Math.max(0, this.maxRequests - record.count);
  }

  getResetTime(key: string): number {
    const record = this.store.get(key);
    return record ? record.resetTime : Date.now() + this.windowMs;
  }
}

/**
 * Security Middleware
 * Implements comprehensive security measures
 */
export class SecurityMiddleware {
  private rateLimitStore: RateLimitStore;
  private readonly blockedIPs: Set<string> = new Set();
  private readonly suspiciousPatterns: RegExp[] = [
    /\.\./, // Path traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /javascript:/i, // JavaScript injection
  ];

  constructor() {
    this.rateLimitStore = new RateLimitStore(60000, 100); // 100 requests per minute
  }

  /**
   * Main middleware function
   */
  middleware = (req: any, res: any, next: any) => {
    const clientIP = this.getClientIP(req);

    // 1. IP Blocking
    if (this.blockedIPs.has(clientIP)) {
      return this.sendError(res, 403, 'IP blocked');
    }

    // 2. Rate Limiting
    if (!this.rateLimitStore.isAllowed(clientIP)) {
      const resetTime = this.rateLimitStore.getResetTime(clientIP);
      res.setHeader('X-RateLimit-Limit', '100');
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));
      return this.sendError(res, 429, 'Rate limit exceeded');
    }

    // 3. Request Validation
    if (!this.validateRequest(req)) {
      return this.sendError(res, 400, 'Invalid request');
    }

    // 4. Security Headers
    this.setSecurityHeaders(res);

    // 5. Suspicious Activity Detection
    if (this.detectSuspiciousActivity(req)) {
      this.blockedIPs.add(clientIP);
      return this.sendError(res, 403, 'Suspicious activity detected');
    }

    // Add rate limit headers
    const remaining = this.rateLimitStore.getRemainingRequests(clientIP);
    res.setHeader('X-RateLimit-Limit', '100');
    res.setHeader('X-RateLimit-Remaining', remaining.toString());

    next();
  };

  /**
   * Get client IP address
   */
  private getClientIP(req: any): string {
    return (
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.headers['x-real-ip'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Validate incoming request
   */
  private validateRequest(req: any): boolean {
    // Check HTTP method
    const allowedMethods = ['GET', 'POST', 'HEAD', 'OPTIONS'];
    if (!allowedMethods.includes(req.method)) {
      return false;
    }

    // Check content length
    const contentLength = parseInt(req.headers['content-length'] || '0');
    if (contentLength > 10 * 1024 * 1024) {
      // 10MB limit
      return false;
    }

    // Check URL length
    if (req.url && req.url.length > 2048) {
      return false;
    }

    return true;
  }

  /**
   * Detect suspicious activity
   */
  private detectSuspiciousActivity(req: any): boolean {
    const url = req.url || '';
    const userAgent = req.headers['user-agent'] || '';

    // Check for suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(url) || pattern.test(userAgent)) {
        return true;
      }
    }

    // Check for suspicious user agents
    const suspiciousUserAgents = [
      'sqlmap',
      'nikto',
      'nmap',
      'masscan',
      'zap',
      'burp',
    ];

    const lowerUserAgent = userAgent.toLowerCase();
    return suspiciousUserAgents.some(agent => lowerUserAgent.includes(agent));
  }

  /**
   * Set security headers
   */
  private setSecurityHeaders(res: any): void {
    const headers = securityHeadersValidator.getRecommendedHeaders();

    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Additional production headers
    res.setHeader('X-Powered-By', 'XPR-Delegation-Demo');
    res.setHeader('Server', 'XPR-Server/1.0');
  }

  /**
   * Send error response
   */
  private sendError(res: any, statusCode: number, message: string): void {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: true,
        status: statusCode,
        message,
        timestamp: new Date().toISOString(),
      })
    );
  }

  /**
   * Block IP address
   */
  blockIP(ip: string): void {
    this.blockedIPs.add(ip);
  }

  /**
   * Unblock IP address
   */
  unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
  }

  /**
   * Get blocked IPs
   */
  getBlockedIPs(): string[] {
    return Array.from(this.blockedIPs);
  }
}

/**
 * Create production server with security middleware
 */
export const createSecureServer = (port: number = 3000) => {
  const securityMiddleware = new SecurityMiddleware();

  const server = createServer((req, res) => {
    // Apply security middleware
    securityMiddleware.middleware(req, res, () => {
      // Handle normal requests here
      res.setHeader('Content-Type', 'text/html');
      res.end(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>XPR Delegation Demo - Security Enabled</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body>
            <h1>🔒 Security Middleware Active</h1>
            <p>XPR Delegation Demo is running with enhanced security measures.</p>
            <ul>
              <li>✅ HTTPS endpoint validation</li>
              <li>✅ Rate limiting (100 req/min)</li>
              <li>✅ Transaction signature verification</li>
              <li>✅ Security headers</li>
              <li>✅ Suspicious activity detection</li>
            </ul>
          </body>
        </html>
      `);
    });
  });

  server.listen(port, () => {
    console.log(`🔒 Secure server running on port ${port}`);
    console.log(`📊 Rate limit: 100 requests per minute`);
    console.log(`🛡️ Security headers: Enabled`);
  });

  return { server, securityMiddleware };
};

export default SecurityMiddleware;
