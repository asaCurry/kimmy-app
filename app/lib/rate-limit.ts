/**
 * Cloudflare Workers rate limiting using KV storage
 * Replaces in-memory rate limiting for production scalability
 */

import { logger } from "./logger";

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyPrefix?: string; // KV key prefix
  skipOnError?: boolean; // Skip rate limiting if KV fails
}

export interface RateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * Rate limiter using Cloudflare Workers KV
 * Falls back to in-memory for development
 */
export class CloudflareRateLimiter {
  private inMemoryStore = new Map<string, { count: number; resetTime: number }>();
  private isDevelopment: boolean;

  constructor(private env: any) {
    this.isDevelopment = !env?.RATE_LIMIT_KV; // Use KV presence to detect production
  }

  async checkRateLimit(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const key = `${config.keyPrefix || 'rl'}:${identifier}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    try {
      if (this.isDevelopment || !this.env?.RATE_LIMIT_KV) {
        return this.checkInMemory(identifier, config, now);
      }

      // Use Cloudflare KV for production
      return await this.checkKV(key, config, now);
    } catch (error) {
      logger.error("Rate limit check failed", {
        error: error instanceof Error ? error.message : 'Unknown error',
        identifier: identifier.substring(0, 10) + '***', // Mask for security
        skipOnError: config.skipOnError
      });

      if (config.skipOnError) {
        // Allow request if rate limiting fails
        return {
          allowed: true,
          remainingRequests: config.maxRequests - 1,
          resetTime: now + config.windowMs
        };
      }

      // Deny request if rate limiting fails and skipOnError is false
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: now + config.windowMs,
        retryAfter: Math.ceil(config.windowMs / 1000)
      };
    }
  }

  private async checkKV(
    key: string, 
    config: RateLimitConfig, 
    now: number
  ): Promise<RateLimitResult> {
    const kv = this.env.RATE_LIMIT_KV;
    
    // Get current count and reset time
    const data = await kv.get(key, { type: 'json' }) as {
      count: number;
      resetTime: number;
    } | null;

    let count = 1;
    let resetTime = now + config.windowMs;

    if (data && now < data.resetTime) {
      // Within the same window
      count = data.count + 1;
      resetTime = data.resetTime;
    }

    // Check if limit exceeded
    if (count > config.maxRequests) {
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime,
        retryAfter: Math.ceil((resetTime - now) / 1000)
      };
    }

    // Update count in KV with TTL
    const ttlSeconds = Math.ceil(config.windowMs / 1000);
    await kv.put(key, JSON.stringify({ count, resetTime }), {
      expirationTtl: ttlSeconds
    });

    return {
      allowed: true,
      remainingRequests: config.maxRequests - count,
      resetTime
    };
  }

  private checkInMemory(
    identifier: string,
    config: RateLimitConfig,
    now: number
  ): RateLimitResult {
    const current = this.inMemoryStore.get(identifier);
    let count = 1;
    let resetTime = now + config.windowMs;

    if (current && now < current.resetTime) {
      count = current.count + 1;
      resetTime = current.resetTime;
    }

    // Clean up expired entries periodically
    this.cleanupExpired(now);

    if (count > config.maxRequests) {
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime,
        retryAfter: Math.ceil((resetTime - now) / 1000)
      };
    }

    this.inMemoryStore.set(identifier, { count, resetTime });

    return {
      allowed: true,
      remainingRequests: config.maxRequests - count,
      resetTime
    };
  }

  private cleanupExpired(now: number): void {
    if (Math.random() < 0.01) { // 1% chance to cleanup on each request
      for (const [key, value] of this.inMemoryStore.entries()) {
        if (now >= value.resetTime) {
          this.inMemoryStore.delete(key);
        }
      }
    }
  }
}

/**
 * Common rate limit configurations
 */
export const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 login attempts per 15 minutes
    keyPrefix: 'auth'
  },

  // API endpoints
  api: {
    windowMs: 60 * 1000, // 1 minute  
    maxRequests: 60, // 60 requests per minute
    keyPrefix: 'api',
    skipOnError: true
  },

  // Analytics endpoints (more generous)
  analytics: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
    keyPrefix: 'analytics',
    skipOnError: true
  },

  // File uploads (very restrictive)
  upload: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 uploads per minute
    keyPrefix: 'upload'
  }
};

/**
 * Get rate limit identifier from request
 */
export function getRateLimitIdentifier(request: Request, userId?: number): string {
  // Use user ID if available, otherwise fall back to IP
  if (userId) {
    return `user:${userId}`;
  }

  // Try to get IP from Cloudflare headers
  const cfIP = request.headers.get('CF-Connecting-IP');
  if (cfIP) {
    return `ip:${cfIP}`;
  }

  // Fallback to X-Forwarded-For or generic
  const forwarded = request.headers.get('X-Forwarded-For');
  if (forwarded) {
    return `ip:${forwarded.split(',')[0].trim()}`;
  }

  return 'ip:unknown';
}

/**
 * Middleware function for rate limiting
 */
export async function withRateLimit(
  request: Request,
  env: any,
  config: RateLimitConfig,
  userId?: number
): Promise<Response | null> {
  const rateLimiter = new CloudflareRateLimiter(env);
  const identifier = getRateLimitIdentifier(request, userId);
  
  const result = await rateLimiter.checkRateLimit(identifier, config);
  
  if (!result.allowed) {
    logger.securityEvent('Rate limit exceeded', 'medium', {
      identifier: identifier.substring(0, 10) + '***',
      config: config.keyPrefix,
      retryAfter: result.retryAfter
    });

    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': result.retryAfter?.toString() || '60',
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString()
      }
    });
  }

  // Add rate limit headers to successful responses
  return null; // No rate limit response needed, continue processing
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: Response,
  result: RateLimitResult,
  config: RateLimitConfig
): Response {
  response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
  response.headers.set('X-RateLimit-Remaining', result.remainingRequests.toString());
  response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
  
  return response;
}