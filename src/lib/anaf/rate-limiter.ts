/** @format */

/**
 * ANAF Rate Limiter Service
 * Implements rate limiting according to ANAF documentation:
 * - 1000 requests per 1 minute
 * - 429 Too Many Requests error when limit exceeded
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class ANAFRateLimiter {
  private static readonly RATE_LIMIT = {
    MAX_REQUESTS: 1000,
    WINDOW_MS: 60 * 1000, // 1 minute in milliseconds
  };

  private static rateLimitMap = new Map<string, RateLimitEntry>();

  /**
   * Check if request is within rate limit
   * @param identifier - Unique identifier for rate limiting (e.g., client IP, user ID)
   * @returns Object with rate limit status
   */
  static checkRateLimit(identifier: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } {
    const now = Date.now();
    const entry = this.rateLimitMap.get(identifier);

    if (!entry || now >= entry.resetTime) {
      // No entry or window has expired, create new entry
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + this.RATE_LIMIT.WINDOW_MS,
      };
      this.rateLimitMap.set(identifier, newEntry);

      return {
        allowed: true,
        remaining: this.RATE_LIMIT.MAX_REQUESTS - 1,
        resetTime: newEntry.resetTime,
      };
    }

    if (entry.count >= this.RATE_LIMIT.MAX_REQUESTS) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter,
      };
    }

    // Increment counter
    entry.count++;
    this.rateLimitMap.set(identifier, entry);

    return {
      allowed: true,
      remaining: this.RATE_LIMIT.MAX_REQUESTS - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Clean up expired entries to prevent memory leaks
   */
  static cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.rateLimitMap.entries()) {
      if (now >= entry.resetTime) {
        this.rateLimitMap.delete(key);
      }
    }
  }

  /**
   * Get rate limit status for an identifier
   */
  static getRateLimitStatus(identifier: string): {
    count: number;
    remaining: number;
    resetTime: number;
    isLimited: boolean;
  } {
    const entry = this.rateLimitMap.get(identifier);
    const now = Date.now();

    if (!entry || now >= entry.resetTime) {
      return {
        count: 0,
        remaining: this.RATE_LIMIT.MAX_REQUESTS,
        resetTime: now + this.RATE_LIMIT.WINDOW_MS,
        isLimited: false,
      };
    }

    return {
      count: entry.count,
      remaining: Math.max(0, this.RATE_LIMIT.MAX_REQUESTS - entry.count),
      resetTime: entry.resetTime,
      isLimited: entry.count >= this.RATE_LIMIT.MAX_REQUESTS,
    };
  }

  /**
   * Reset rate limit for an identifier
   */
  static resetRateLimit(identifier: string): void {
    this.rateLimitMap.delete(identifier);
  }

  /**
   * Get all active rate limit entries (for debugging)
   */
  static getAllEntries(): Map<string, RateLimitEntry> {
    return new Map(this.rateLimitMap);
  }
}

// Cleanup expired entries every 5 minutes
setInterval(() => {
  ANAFRateLimiter.cleanup();
}, 5 * 60 * 1000);
