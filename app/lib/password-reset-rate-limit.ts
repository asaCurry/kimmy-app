import type { KVNamespace } from "@cloudflare/workers-types";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export class PasswordResetRateLimit {
  constructor(private kv: KVNamespace) {}

  /**
   * Rate limit configuration for password reset requests
   */
  private readonly config = {
    // Maximum reset requests per email per time window
    maxRequests: 3,
    // Time window in seconds (15 minutes)
    windowSeconds: 15 * 60,
    // Lockout period after hitting limit (30 minutes)
    lockoutSeconds: 30 * 60,
  };

  /**
   * Generate KV key for rate limiting
   */
  private getRateLimitKey(email: string): string {
    return `password_reset_rate_limit:${email.toLowerCase()}`;
  }

  /**
   * Check if password reset request is allowed for email
   */
  async checkRateLimit(email: string): Promise<RateLimitResult> {
    const key = this.getRateLimitKey(email);
    const now = Date.now();

    try {
      // Get existing rate limit data
      const existingData = await this.kv.get(key, "json");
      const rateLimitData = existingData as {
        count: number;
        firstRequest: number;
        lastRequest: number;
      } | null;

      // If no existing data, allow the request
      if (!rateLimitData) {
        return {
          allowed: true,
          remaining: this.config.maxRequests - 1,
          resetTime: now + this.config.windowSeconds * 1000,
        };
      }

      const { count, firstRequest, lastRequest } = rateLimitData;
      const windowStart = now - this.config.windowSeconds * 1000;
      const lockoutEnd = lastRequest + this.config.lockoutSeconds * 1000;

      // Check if we're still in lockout period
      if (count >= this.config.maxRequests && now < lockoutEnd) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: lockoutEnd,
          retryAfter: Math.ceil((lockoutEnd - now) / 1000),
        };
      }

      // Reset counter if window has expired or lockout period ended
      if (firstRequest < windowStart || now >= lockoutEnd) {
        return {
          allowed: true,
          remaining: this.config.maxRequests - 1,
          resetTime: now + this.config.windowSeconds * 1000,
        };
      }

      // Check if within rate limit
      if (count < this.config.maxRequests) {
        return {
          allowed: true,
          remaining: this.config.maxRequests - count - 1,
          resetTime: firstRequest + this.config.windowSeconds * 1000,
        };
      }

      // Rate limit exceeded
      const retryAfter = Math.ceil((lockoutEnd - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetTime: lockoutEnd,
        retryAfter: retryAfter > 0 ? retryAfter : undefined,
      };
    } catch (error) {
      console.error("Error checking rate limit:", error);
      // On error, allow the request but log the issue
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowSeconds * 1000,
      };
    }
  }

  /**
   * Record a password reset request
   */
  async recordRequest(email: string): Promise<void> {
    const key = this.getRateLimitKey(email);
    const now = Date.now();

    try {
      // Get existing rate limit data
      const existingData = await this.kv.get(key, "json");
      const rateLimitData = existingData as {
        count: number;
        firstRequest: number;
        lastRequest: number;
      } | null;

      let newData;

      if (!rateLimitData) {
        // First request in window
        newData = {
          count: 1,
          firstRequest: now,
          lastRequest: now,
        };
      } else {
        const { count, firstRequest } = rateLimitData;
        const windowStart = now - this.config.windowSeconds * 1000;

        // Reset if window expired
        if (firstRequest < windowStart) {
          newData = {
            count: 1,
            firstRequest: now,
            lastRequest: now,
          };
        } else {
          // Increment count
          newData = {
            count: count + 1,
            firstRequest,
            lastRequest: now,
          };
        }
      }

      // Store with TTL slightly longer than lockout period
      const ttl =
        Math.max(this.config.windowSeconds, this.config.lockoutSeconds) + 300; // Extra 5 minutes buffer

      await this.kv.put(key, JSON.stringify(newData), {
        expirationTtl: ttl,
      });
    } catch (error) {
      console.error("Error recording rate limit request:", error);
      // Don't throw - rate limiting failure shouldn't block the request
    }
  }

  /**
   * Clear rate limit for an email (admin function)
   */
  async clearRateLimit(email: string): Promise<void> {
    const key = this.getRateLimitKey(email);
    try {
      await this.kv.delete(key);
    } catch (error) {
      console.error("Error clearing rate limit:", error);
      throw new Error("Failed to clear rate limit");
    }
  }

  /**
   * Get rate limit status for an email (admin function)
   */
  async getRateLimitStatus(email: string): Promise<{
    exists: boolean;
    count?: number;
    firstRequest?: Date;
    lastRequest?: Date;
    resetTime?: Date;
  }> {
    const key = this.getRateLimitKey(email);

    try {
      const existingData = await this.kv.get(key, "json");
      const rateLimitData = existingData as {
        count: number;
        firstRequest: number;
        lastRequest: number;
      } | null;

      if (!rateLimitData) {
        return { exists: false };
      }

      const { count, firstRequest, lastRequest } = rateLimitData;
      const resetTime = firstRequest + this.config.windowSeconds * 1000;

      return {
        exists: true,
        count,
        firstRequest: new Date(firstRequest),
        lastRequest: new Date(lastRequest),
        resetTime: new Date(resetTime),
      };
    } catch (error) {
      console.error("Error getting rate limit status:", error);
      return { exists: false };
    }
  }
}
