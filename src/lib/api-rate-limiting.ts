/** @format */

import { NextRequest, NextResponse } from "next/server";

// Enhanced rate limiting configuration for public API
export const API_RATE_LIMITS = {
  // Public API endpoints - more lenient for legitimate use
  public_api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 1000, // 1000 requests per minute per IP
    blockDuration: 5 * 60 * 1000, // Block for 5 minutes
    burstLimit: 50, // Allow 50 requests in burst
  },
  
  // Authenticated API endpoints - per-token limits
  authenticated_api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute per token
    blockDuration: 10 * 60 * 1000, // Block for 10 minutes
    burstLimit: 20, // Allow 20 requests in burst
  },
  
  // Write operations - stricter limits
  write_operations: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50, // 50 write operations per minute per token
    blockDuration: 15 * 60 * 1000, // Block for 15 minutes
    burstLimit: 10, // Allow 10 write operations in burst
  },
  
  // Documentation and metadata - very lenient
  documentation: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5000, // 5000 requests per minute per IP
    blockDuration: 2 * 60 * 1000, // Block for 2 minutes
    burstLimit: 200, // Allow 200 requests in burst
  },
} as const;

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blockedUntil?: number;
  burstCount: number;
  lastRequestTime: number;
  attempts: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  blocked?: boolean;
  retryAfter?: number;
  burstRemaining: number;
}

// Enhanced rate limiting store with burst protection
class ApiRateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private maxEntries = 100000; // Maximum stored entries
  
  // Clean up old entries every 5 minutes
  constructor() {
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }
  
  get(key: string): RateLimitEntry | undefined {
    return this.store.get(key);
  }
  
  set(key: string, entry: RateLimitEntry): void {
    // Evict oldest entries if store is full
    if (this.store.size >= this.maxEntries) {
      this.evictOldest();
    }
    this.store.set(key, entry);
  }
  
  delete(key: string): boolean {
    return this.store.delete(key);
  }
  
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now && (!entry.blockedUntil || entry.blockedUntil < now)) {
        this.store.delete(key);
      }
    }
  }
  
  private evictOldest(): void {
    const entries = Array.from(this.store.entries());
    entries.sort((a, b) => a[1].lastRequestTime - b[1].lastRequestTime);
    
    // Remove 10% of oldest entries
    const toRemove = Math.ceil(this.maxEntries * 0.1);
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      this.store.delete(entries[i][0]);
    }
  }
}

// Global rate limiting store
const apiRateLimitStore = new ApiRateLimitStore();

// Enhanced client identifier for API rate limiting
export function getApiClientIdentifier(request: NextRequest, token?: string): string {
  // Use IP address as primary identifier
  const ip = request.headers.get("x-forwarded-for") ||
             request.headers.get("x-real-ip") ||
             request.headers.get("cf-connecting-ip") ||
             request.headers.get("x-client-ip") ||
             "unknown";
  
  // For authenticated requests, include token hash for per-token limits
  if (token) {
    const tokenHash = token.substring(0, 16); // Use first 16 chars for identification
    return `${ip}-${tokenHash}`;
  }
  
  return ip;
}

// Enhanced rate limiting check with burst protection
export function checkApiRateLimit(
  identifier: string,
  config: typeof API_RATE_LIMITS[keyof typeof API_RATE_LIMITS]
): RateLimitResult {
  const now = Date.now();
  const entry = apiRateLimitStore.get(identifier);
  
  // Check if currently blocked
  if (entry?.blockedUntil && entry.blockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.blockedUntil,
      blocked: true,
      retryAfter: Math.ceil((entry.blockedUntil - now) / 1000),
      burstRemaining: 0,
    };
  }
  
  // Initialize or reset entry
  if (!entry || entry.resetTime < now) {
    apiRateLimitStore.set(identifier, {
      count: 0,
      resetTime: now + config.windowMs,
      burstCount: 0,
      lastRequestTime: now,
      attempts: 0,
    });
  }
  
  const currentEntry = apiRateLimitStore.get(identifier)!;
  
  // Check burst limit
  const timeSinceLastRequest = now - currentEntry.lastRequestTime;
  if (timeSinceLastRequest < 1000) { // Within 1 second
    if (currentEntry.burstCount >= config.burstLimit) {
      // Block for burst limit exceeded
      currentEntry.blockedUntil = now + config.blockDuration;
      currentEntry.attempts++;
      apiRateLimitStore.set(identifier, currentEntry);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: currentEntry.blockedUntil,
        blocked: true,
        retryAfter: Math.ceil(config.blockDuration / 1000),
        burstRemaining: 0,
      };
    }
    currentEntry.burstCount++;
  } else {
    // Reset burst count if more than 1 second has passed
    currentEntry.burstCount = 1;
  }
  
  // Check main rate limit
  if (currentEntry.count >= config.maxRequests) {
    // Block for rate limit exceeded
    currentEntry.blockedUntil = now + config.blockDuration;
    currentEntry.attempts++;
    apiRateLimitStore.set(identifier, currentEntry);
    
    return {
      allowed: false,
      remaining: 0,
      resetTime: currentEntry.blockedUntil,
      blocked: true,
      retryAfter: Math.ceil(config.blockDuration / 1000),
      burstRemaining: 0,
    };
  }
  
  // Allow request
  currentEntry.count++;
  currentEntry.lastRequestTime = now;
  apiRateLimitStore.set(identifier, currentEntry);
  
  return {
    allowed: true,
    remaining: config.maxRequests - currentEntry.count,
    resetTime: currentEntry.resetTime,
    burstRemaining: config.burstLimit - currentEntry.burstCount,
  };
}

// Rate limiting middleware for API routes
export function withApiRateLimit(
  config: typeof API_RATE_LIMITS[keyof typeof API_RATE_LIMITS]
) {
  return function (handler: Function) {
    return async function (request: NextRequest, ...args: any[]) {
      const identifier = getApiClientIdentifier(request);
      const result = checkApiRateLimit(identifier, config);
      
      if (!result.allowed) {
        const headers: Record<string, string> = {
          "X-RateLimit-Limit": config.maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(result.resetTime).toISOString(),
          "X-RateLimit-BurstLimit": config.burstLimit.toString(),
          "X-RateLimit-BurstRemaining": "0",
        };
        
        if (result.retryAfter) {
          headers["Retry-After"] = result.retryAfter.toString();
        }
        
        return NextResponse.json(
          {
            error: result.blocked
              ? "Rate limit exceeded. Please try again later."
              : "Too many requests. Please try again later.",
            retryAfter: result.retryAfter,
            burstLimit: config.burstLimit,
          },
          {
            status: 429,
            headers,
          }
        );
      }
      
      // Add rate limit headers to successful responses
      const response = await handler(request, ...args);
      if (response instanceof NextResponse) {
        response.headers.set("X-RateLimit-Limit", config.maxRequests.toString());
        response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
        response.headers.set("X-RateLimit-Reset", new Date(result.resetTime).toISOString());
        response.headers.set("X-RateLimit-BurstLimit", config.burstLimit.toString());
        response.headers.set("X-RateLimit-BurstRemaining", result.burstRemaining.toString());
      }
      
      return response;
    };
  };
}

// Get rate limit statistics
export function getApiRateLimitStats(): {
  totalEntries: number;
  blockedEntries: number;
  activeEntries: number;
} {
  let totalEntries = 0;
  let blockedEntries = 0;
  let activeEntries = 0;
  
  for (const entry of apiRateLimitStore.store.values()) {
    totalEntries++;
    if (entry.blockedUntil && entry.blockedUntil > Date.now()) {
      blockedEntries++;
    } else {
      activeEntries++;
    }
  }
  
  return {
    totalEntries,
    blockedEntries,
    activeEntries,
  };
}

// Clear rate limit for a specific identifier (admin function)
export function clearApiRateLimit(identifier: string): boolean {
  return apiRateLimitStore.delete(identifier);
}

// Clear all rate limits (admin function)
export function clearAllApiRateLimits(): void {
  apiRateLimitStore.store.clear();
}
