import type { Database } from "../../db";
import { analyticsCache } from "../../db/schema";
import { eq, and, lt } from "drizzle-orm";
import type {
  FieldSuggestions,
  AutoCompletionSuggestion,
} from "./auto-completion-service";
import { CloudflarePerformanceMonitor } from "./cloudflare-analytics";

interface CachedSuggestions {
  fieldSuggestions?: FieldSuggestions;
  titleSuggestions?: AutoCompletionSuggestion[];
  tagSuggestions?: string[];
  smartDefaults?: {
    suggestedTime?: string;
    suggestedTags?: string[];
    commonPatterns?: Record<string, any>;
  };
  timestamp: number;
}

export class AutoCompletionCache {
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static readonly CLEANUP_INTERVAL = 15 * 60 * 1000; // 15 minutes
  private memoryCache = new Map<string, CachedSuggestions>();
  private lastCleanup = Date.now();
  private monitor?: CloudflarePerformanceMonitor;

  constructor(
    private db: Database,
    env?: { ANALYTICS?: AnalyticsEngineDataset }
  ) {
    if (env) {
      this.monitor = new CloudflarePerformanceMonitor(env);
    }
  }

  /**
   * Generate cache key for field suggestions
   */
  private getFieldCacheKey(
    fieldId: string,
    recordTypeId: number,
    householdId: string,
    memberId?: number,
    currentValue?: string
  ): string {
    const memberPart = memberId ? `_m${memberId}` : "";
    const valuePart = currentValue ? `_v${currentValue.slice(0, 10)}` : "";
    return `field_${householdId}_${recordTypeId}_${fieldId}${memberPart}${valuePart}`;
  }

  /**
   * Generate cache key for general suggestions
   */
  private getGeneralCacheKey(
    recordTypeId: number,
    householdId: string,
    memberId?: number
  ): string {
    const memberPart = memberId ? `_m${memberId}` : "";
    return `general_${householdId}_${recordTypeId}${memberPart}`;
  }

  /**
   * Check if cache entry is valid
   */
  private isValidCache(cached: CachedSuggestions): boolean {
    return Date.now() - cached.timestamp < AutoCompletionCache.CACHE_DURATION;
  }

  /**
   * Clean expired entries from memory cache
   */
  private cleanupMemoryCache(): void {
    const now = Date.now();
    if (now - this.lastCleanup < AutoCompletionCache.CLEANUP_INTERVAL) {
      return;
    }

    for (const [key, cached] of this.memoryCache.entries()) {
      if (!this.isValidCache(cached)) {
        this.memoryCache.delete(key);
      }
    }
    this.lastCleanup = now;
  }

  /**
   * Get cached field suggestions
   */
  async getCachedFieldSuggestions(
    fieldId: string,
    recordTypeId: number,
    householdId: string,
    memberId?: number,
    currentValue?: string
  ): Promise<FieldSuggestions | null> {
    this.cleanupMemoryCache();

    const cacheKey = this.getFieldCacheKey(
      fieldId,
      recordTypeId,
      householdId,
      memberId,
      currentValue
    );

    // Check memory cache first (fastest)
    const memoryEntry = this.memoryCache.get(cacheKey);
    if (memoryEntry && this.isValidCache(memoryEntry)) {
      this.monitor?.trackCachePerformance({
        operation: "hit",
        cacheType: "memory",
        key: cacheKey,
        householdId,
      });
      return memoryEntry.fieldSuggestions || null;
    }

    // Check database cache
    try {
      const dbEntry = await this.db
        .select({ data: analyticsCache.data })
        .from(analyticsCache)
        .where(
          and(
            eq(analyticsCache.householdId, householdId),
            eq(analyticsCache.cacheKey, cacheKey)
          )
        )
        .limit(1);

      if (dbEntry.length > 0 && dbEntry[0].data) {
        const cached: CachedSuggestions = JSON.parse(dbEntry[0].data);
        if (this.isValidCache(cached)) {
          // Store in memory cache for faster access
          this.memoryCache.set(cacheKey, cached);
          this.monitor?.trackCachePerformance({
            operation: "hit",
            cacheType: "database",
            key: cacheKey,
            householdId,
          });
          return cached.fieldSuggestions || null;
        }
      }
    } catch (error) {
      console.warn("Error reading from cache:", error);
    }

    // Track cache miss
    this.monitor?.trackCachePerformance({
      operation: "miss",
      cacheType: "memory",
      key: cacheKey,
      householdId,
    });

    return null;
  }

  /**
   * Cache field suggestions
   */
  async cacheFieldSuggestions(
    fieldId: string,
    recordTypeId: number,
    householdId: string,
    suggestions: FieldSuggestions,
    memberId?: number,
    currentValue?: string
  ): Promise<void> {
    const cacheKey = this.getFieldCacheKey(
      fieldId,
      recordTypeId,
      householdId,
      memberId,
      currentValue
    );

    const cached: CachedSuggestions = {
      fieldSuggestions: suggestions,
      timestamp: Date.now(),
    };

    // Store in memory cache
    this.memoryCache.set(cacheKey, cached);

    // Store in database cache (fire and forget - don't block the request)
    const expiresAt = new Date(Date.now() + AutoCompletionCache.CACHE_DURATION);

    // Use setTimeout to not block the response
    setTimeout(async () => {
      try {
        // Check if database methods are available (graceful handling for test environments)
        if (
          typeof this.db?.delete !== "function" ||
          typeof this.db?.insert !== "function"
        ) {
          return; // Skip cache operation in test environments
        }

        // Delete existing entry first
        await this.db
          .delete(analyticsCache)
          .where(
            and(
              eq(analyticsCache.householdId, householdId),
              eq(analyticsCache.cacheKey, cacheKey)
            )
          );

        // Insert new entry
        await this.db.insert(analyticsCache).values({
          householdId,
          cacheKey,
          data: JSON.stringify(cached),
          expiresAt: expiresAt.toISOString(),
        });
      } catch (error) {
        console.warn("Error writing to cache:", error);
      }
    }, 0);
  }

  /**
   * Get cached general suggestions
   */
  async getCachedGeneralSuggestions(
    recordTypeId: number,
    householdId: string,
    memberId?: number
  ): Promise<{
    titleSuggestions?: AutoCompletionSuggestion[];
    tagSuggestions?: string[];
    smartDefaults?: {
      suggestedTime?: string;
      suggestedTags?: string[];
      commonPatterns?: Record<string, any>;
    };
  } | null> {
    this.cleanupMemoryCache();

    const cacheKey = this.getGeneralCacheKey(
      recordTypeId,
      householdId,
      memberId
    );

    // Check memory cache first
    const memoryEntry = this.memoryCache.get(cacheKey);
    if (memoryEntry && this.isValidCache(memoryEntry)) {
      return {
        titleSuggestions: memoryEntry.titleSuggestions,
        tagSuggestions: memoryEntry.tagSuggestions,
        smartDefaults: memoryEntry.smartDefaults,
      };
    }

    // Check database cache
    try {
      const dbEntry = await this.db
        .select({ data: analyticsCache.data })
        .from(analyticsCache)
        .where(
          and(
            eq(analyticsCache.householdId, householdId),
            eq(analyticsCache.cacheKey, cacheKey)
          )
        )
        .limit(1);

      if (dbEntry.length > 0 && dbEntry[0].data) {
        const cached: CachedSuggestions = JSON.parse(dbEntry[0].data);
        if (this.isValidCache(cached)) {
          // Store in memory cache for faster access
          this.memoryCache.set(cacheKey, cached);
          return {
            titleSuggestions: cached.titleSuggestions,
            tagSuggestions: cached.tagSuggestions,
            smartDefaults: cached.smartDefaults,
          };
        }
      }
    } catch (error) {
      console.warn("Error reading from cache:", error);
    }

    return null;
  }

  /**
   * Cache general suggestions
   */
  async cacheGeneralSuggestions(
    recordTypeId: number,
    householdId: string,
    titleSuggestions: AutoCompletionSuggestion[],
    tagSuggestions: string[],
    smartDefaults: {
      suggestedTime?: string;
      suggestedTags?: string[];
      commonPatterns?: Record<string, any>;
    },
    memberId?: number
  ): Promise<void> {
    const cacheKey = this.getGeneralCacheKey(
      recordTypeId,
      householdId,
      memberId
    );

    const cached: CachedSuggestions = {
      titleSuggestions,
      tagSuggestions,
      smartDefaults,
      timestamp: Date.now(),
    };

    // Store in memory cache
    this.memoryCache.set(cacheKey, cached);

    // Store in database cache (fire and forget)
    const expiresAt = new Date(Date.now() + AutoCompletionCache.CACHE_DURATION);

    // Use setTimeout to not block the response
    setTimeout(async () => {
      try {
        // Check if database methods are available (graceful handling for test environments)
        if (
          typeof this.db?.delete !== "function" ||
          typeof this.db?.insert !== "function"
        ) {
          return; // Skip cache operation in test environments
        }

        // Delete existing entry first
        await this.db
          .delete(analyticsCache)
          .where(
            and(
              eq(analyticsCache.householdId, householdId),
              eq(analyticsCache.cacheKey, cacheKey)
            )
          );

        // Insert new entry
        await this.db.insert(analyticsCache).values({
          householdId,
          cacheKey,
          data: JSON.stringify(cached),
          expiresAt: expiresAt.toISOString(),
        });
      } catch (error) {
        console.warn("Error writing to cache:", error);
      }
    }, 0);
  }

  /**
   * Invalidate cache for a household (call when new records are created)
   */
  async invalidateHouseholdCache(householdId: string): Promise<void> {
    // Clear memory cache entries for this household
    for (const [key] of this.memoryCache.entries()) {
      if (key.includes(householdId)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear database cache entries (fire and forget)
    try {
      await this.db
        .delete(analyticsCache)
        .where(eq(analyticsCache.householdId, householdId));
    } catch (error) {
      console.warn("Error clearing cache from database:", error);
    }
  }

  /**
   * Clean up expired entries from database
   */
  async cleanupExpiredCache(): Promise<void> {
    try {
      await this.db
        .delete(analyticsCache)
        .where(lt(analyticsCache.expiresAt, new Date().toISOString()));
    } catch (error) {
      console.warn("Error cleaning up expired cache:", error);
    }
  }
}
