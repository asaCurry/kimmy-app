import { eq, and, desc, like, sql } from "drizzle-orm";
import { records, recordTypes, users } from "~/db/schema";
import type { Database } from "../../db";
import { AutoCompletionCache } from "./auto-completion-cache";
import {
  monitorPerformance,
  withPerformanceMonitoring,
} from "./performance-monitor";
import { CloudflarePerformanceMonitor } from "./cloudflare-analytics";
import { MonitoredDatabase } from "./monitored-db";

export interface AutoCompletionSuggestion {
  value: string;
  frequency: number;
  lastUsed: Date;
  context?: {
    memberId?: number;
    memberName?: string;
    recordTypeName?: string;
    timeOfDay?: string;
  };
}

export interface FieldSuggestions {
  recent: AutoCompletionSuggestion[];
  frequent: AutoCompletionSuggestion[];
  contextual: AutoCompletionSuggestion[];
}

export class AutoCompletionService {
  private cache: AutoCompletionCache;
  private monitoredDb: MonitoredDatabase;
  private cloudflareMonitor?: CloudflarePerformanceMonitor;

  constructor(
    private db: Database,
    env?: { ANALYTICS?: AnalyticsEngineDataset }
  ) {
    this.cache = new AutoCompletionCache(db);
    this.monitoredDb = new MonitoredDatabase(db, env);
    if (env) {
      this.cloudflareMonitor = new CloudflarePerformanceMonitor(env);
    }
  }

  /**
   * Get auto-completion suggestions for a specific field
   */
  async getFieldSuggestions(
    fieldId: string,
    recordTypeId: number,
    householdId: string,
    memberId?: number,
    currentValue?: string
  ): Promise<FieldSuggestions> {
    return withPerformanceMonitoring(
      "auto_completion_field_suggestions",
      async () =>
        this.getFieldSuggestionsInternal(
          fieldId,
          recordTypeId,
          householdId,
          memberId,
          currentValue
        ),
      {
        fieldId,
        recordTypeId,
        memberId: memberId || null,
        hasCurrentValue: !!currentValue,
      }
    );
  }

  private async getFieldSuggestionsInternal(
    fieldId: string,
    recordTypeId: number,
    householdId: string,
    memberId?: number,
    currentValue?: string
  ): Promise<FieldSuggestions> {
    try {
      // Check cache first
      const cached = await this.cache.getCachedFieldSuggestions(
        fieldId,
        recordTypeId,
        householdId,
        memberId,
        currentValue
      );
      if (cached) {
        return cached;
      }
      // Optimized query with monitoring: only fetch needed columns and use indexed fields
      const queryBuilder = this.db
        .select({
          content: records.content,
          datetime: records.datetime,
          memberName: users.name,
          memberId: users.id,
          recordTypeName: recordTypes.name,
        })
        .from(records)
        .leftJoin(users, eq(records.memberId, users.id))
        .leftJoin(recordTypes, eq(records.recordTypeId, recordTypes.id))
        .where(
          and(
            eq(records.householdId, householdId),
            eq(records.recordTypeId, recordTypeId),
            // Only get records with content to reduce processing
            sql`${records.content} IS NOT NULL AND ${records.content} != ''`
          )
        )
        .orderBy(desc(records.datetime))
        .limit(75); // Reduced from 100 to improve performance

      const suggestions = await this.monitoredDb.monitoredSelect(queryBuilder, {
        operation: "field_suggestions_query",
        table: "records",
        householdId,
      });

      const fieldValues: AutoCompletionSuggestion[] = [];

      for (const record of suggestions) {
        if (!(record as any).content) continue;

        try {
          const content = JSON.parse((record as any).content) as any;
          const fieldValue = content.fields?.[`field_${fieldId}`];

          if (
            fieldValue &&
            typeof fieldValue === "string" &&
            fieldValue.trim()
          ) {
            // Skip if current value is provided and matches exactly
            if (
              currentValue &&
              fieldValue.toLowerCase() === currentValue.toLowerCase()
            ) {
              continue;
            }

            // Extract time of day for context
            const datetime = (record as any).datetime
              ? new Date((record as any).datetime)
              : new Date();
            const hour = datetime.getHours();
            let timeOfDay = "morning";
            if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
            else if (hour >= 17) timeOfDay = "evening";

            const suggestion: AutoCompletionSuggestion = {
              value: fieldValue.trim(),
              frequency: 1,
              lastUsed: datetime,
              context: {
                memberId: (record as any).memberId || undefined,
                memberName: (record as any).memberName || undefined,
                recordTypeName: (record as any).recordTypeName || undefined,
                timeOfDay,
              },
            };

            // Check if we already have this value
            const existing = fieldValues.find(
              s => s.value.toLowerCase() === suggestion.value.toLowerCase()
            );

            if (existing) {
              existing.frequency += 1;
              if (suggestion.lastUsed > existing.lastUsed) {
                existing.lastUsed = suggestion.lastUsed;
                existing.context = suggestion.context;
              }
            } else {
              fieldValues.push(suggestion);
            }
          }
        } catch (error) {
          // Skip records with invalid JSON
          continue;
        }
      }

      // Sort and categorize suggestions
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const currentHour = now.getHours();
      let currentTimeOfDay = "morning";
      if (currentHour >= 12 && currentHour < 17) currentTimeOfDay = "afternoon";
      else if (currentHour >= 17) currentTimeOfDay = "evening";

      // Recent suggestions (last week)
      const recent = fieldValues
        .filter(s => s.lastUsed >= oneWeekAgo)
        .sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime())
        .slice(0, 5);

      // Frequent suggestions (by frequency)
      const frequent = fieldValues
        .filter(s => s.frequency >= 2)
        .sort(
          (a, b) =>
            b.frequency - a.frequency ||
            b.lastUsed.getTime() - a.lastUsed.getTime()
        )
        .slice(0, 5);

      // Contextual suggestions (same member, time of day, etc.)
      let contextual = fieldValues.filter(s => {
        if (memberId && s.context?.memberId === memberId) return true;
        if (s.context?.timeOfDay === currentTimeOfDay) return true;
        return false;
      });

      // Remove duplicates from contextual that are already in recent/frequent
      const usedValues = new Set([
        ...recent.map(s => s.value.toLowerCase()),
        ...frequent.map(s => s.value.toLowerCase()),
      ]);
      contextual = contextual
        .filter(s => !usedValues.has(s.value.toLowerCase()))
        .sort(
          (a, b) =>
            b.frequency - a.frequency ||
            b.lastUsed.getTime() - a.lastUsed.getTime()
        )
        .slice(0, 3);

      const result = { recent, frequent, contextual };

      // Track auto-completion metrics
      this.cloudflareMonitor?.trackAutoCompletion({
        suggestionType: "field",
        cacheHit: false, // We know it's not a cache hit since we got here
        resultCount: recent.length + frequent.length + contextual.length,
        queryDuration: 0, // Would be tracked by monitoredDb
        processingDuration: 0, // Could add processing time tracking if needed
        householdId,
      });

      // Cache the result
      await this.cache.cacheFieldSuggestions(
        fieldId,
        recordTypeId,
        householdId,
        result,
        memberId,
        currentValue
      );

      return result;
    } catch (error) {
      console.error("Error fetching field suggestions:", error);
      return { recent: [], frequent: [], contextual: [] };
    }
  }

  /**
   * Get suggestions for record titles based on record type and context
   */
  async getTitleSuggestions(
    recordTypeId: number,
    householdId: string,
    memberId?: number
  ): Promise<AutoCompletionSuggestion[]> {
    try {
      // Optimized query for title suggestions
      const suggestions = await this.db
        .select({
          title: records.title,
          datetime: records.datetime,
          memberName: users.name,
          memberId: users.id,
        })
        .from(records)
        .leftJoin(users, eq(records.memberId, users.id))
        .where(
          and(
            eq(records.householdId, householdId),
            eq(records.recordTypeId, recordTypeId),
            // Only get records with non-empty titles
            sql`${records.title} IS NOT NULL AND ${records.title} != ''`
          )
        )
        .orderBy(desc(records.datetime))
        .limit(40); // Reduced limit for better performance

      const titleCounts = new Map<string, AutoCompletionSuggestion>();

      for (const record of suggestions) {
        if (!record.title || !record.title.trim()) continue;

        const title = record.title.trim();
        const key = title.toLowerCase();

        if (titleCounts.has(key)) {
          const existing = titleCounts.get(key)!;
          existing.frequency += 1;
          if (
            record.datetime &&
            new Date(record.datetime) > existing.lastUsed
          ) {
            existing.lastUsed = new Date(record.datetime);
            existing.context = {
              memberId: record.memberId || undefined,
              memberName: record.memberName || undefined,
            };
          }
        } else {
          titleCounts.set(key, {
            value: title,
            frequency: 1,
            lastUsed: new Date(record.datetime || new Date()),
            context: {
              memberId: record.memberId || undefined,
              memberName: record.memberName || undefined,
            },
          });
        }
      }

      return Array.from(titleCounts.values())
        .sort(
          (a, b) =>
            b.frequency - a.frequency ||
            b.lastUsed.getTime() - a.lastUsed.getTime()
        )
        .slice(0, 8);
    } catch (error) {
      console.error("Error fetching title suggestions:", error);
      return [];
    }
  }

  /**
   * Get tag suggestions based on previous usage
   */
  async getTagSuggestions(
    recordTypeId: number,
    householdId: string,
    memberId?: number
  ): Promise<string[]> {
    try {
      // Optimized query for tag suggestions - only get records with tags
      const suggestions = await this.db
        .select({
          tags: records.tags,
        })
        .from(records)
        .where(
          and(
            eq(records.householdId, householdId),
            eq(records.recordTypeId, recordTypeId),
            // Only get records with non-empty tags
            sql`${records.tags} IS NOT NULL AND ${records.tags} != ''`
          )
        )
        .orderBy(desc(records.datetime))
        .limit(60); // Reduced limit for better performance

      const tagCounts = new Map<string, number>();

      for (const record of suggestions) {
        if (!record.tags || !record.tags.trim()) continue;

        // Split tags by comma and clean them up
        const tags = record.tags
          .split(",")
          .map((tag: string) => tag.trim().toLowerCase())
          .filter((tag: string) => tag.length > 0);

        for (const tag of tags) {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }
      }

      return Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1]) // Sort by frequency
        .slice(0, 12)
        .map(([tag]: [string, number]) => tag);
    } catch (error) {
      console.error("Error fetching tag suggestions:", error);
      return [];
    }
  }

  /**
   * Get all general suggestions (title, tags, smart defaults) with caching
   */
  async getGeneralSuggestions(
    recordTypeId: number,
    householdId: string,
    memberId?: number
  ): Promise<{
    titleSuggestions: AutoCompletionSuggestion[];
    tagSuggestions: string[];
    smartDefaults: {
      suggestedTime?: string;
      suggestedTags?: string[];
      commonPatterns?: Record<string, any>;
    };
  }> {
    return withPerformanceMonitoring(
      "auto_completion_general_suggestions",
      async () =>
        this.getGeneralSuggestionsInternal(recordTypeId, householdId, memberId),
      { recordTypeId, memberId: memberId || null }
    );
  }

  private async getGeneralSuggestionsInternal(
    recordTypeId: number,
    householdId: string,
    memberId?: number
  ): Promise<{
    titleSuggestions: AutoCompletionSuggestion[];
    tagSuggestions: string[];
    smartDefaults: {
      suggestedTime?: string;
      suggestedTags?: string[];
      commonPatterns?: Record<string, any>;
    };
  }> {
    try {
      // Check cache first
      const cached = await this.cache.getCachedGeneralSuggestions(
        recordTypeId,
        householdId,
        memberId
      );
      if (
        cached &&
        cached.titleSuggestions &&
        cached.tagSuggestions &&
        cached.smartDefaults
      ) {
        return {
          titleSuggestions: cached.titleSuggestions,
          tagSuggestions: cached.tagSuggestions,
          smartDefaults: cached.smartDefaults,
        };
      }

      // Fetch all suggestions in parallel
      const [titleSuggestions, tagSuggestions, smartDefaults] =
        await Promise.all([
          this.getTitleSuggestionsInternal(recordTypeId, householdId, memberId),
          this.getTagSuggestionsInternal(recordTypeId, householdId, memberId),
          this.getSmartDefaultsInternal(recordTypeId, householdId, memberId),
        ]);

      const result = { titleSuggestions, tagSuggestions, smartDefaults };

      // Cache the result
      await this.cache.cacheGeneralSuggestions(
        recordTypeId,
        householdId,
        titleSuggestions,
        tagSuggestions,
        smartDefaults,
        memberId
      );

      return result;
    } catch (error) {
      console.error("Error fetching general suggestions:", error);
      return {
        titleSuggestions: [],
        tagSuggestions: [],
        smartDefaults: {},
      };
    }
  }

  /**
   * Get suggestions for record titles based on record type and context (internal)
   */
  private async getTitleSuggestionsInternal(
    recordTypeId: number,
    householdId: string,
    memberId?: number
  ): Promise<AutoCompletionSuggestion[]> {
    // Move existing getTitleSuggestions logic here
    return this.getTitleSuggestions(recordTypeId, householdId, memberId);
  }

  /**
   * Get tag suggestions based on previous usage (internal)
   */
  private async getTagSuggestionsInternal(
    recordTypeId: number,
    householdId: string,
    memberId?: number
  ): Promise<string[]> {
    // Move existing getTagSuggestions logic here
    return this.getTagSuggestions(recordTypeId, householdId, memberId);
  }

  /**
   * Get smart default values based on context (internal)
   */
  private async getSmartDefaultsInternal(
    recordTypeId: number,
    householdId: string,
    memberId?: number
  ): Promise<{
    suggestedTime?: string;
    suggestedTags?: string[];
    commonPatterns?: Record<string, any>;
  }> {
    // Move existing getSmartDefaults logic here
    return this.getSmartDefaults(recordTypeId, householdId, memberId);
  }

  /**
   * Get smart default values based on context
   */
  async getSmartDefaults(
    recordTypeId: number,
    householdId: string,
    memberId?: number
  ): Promise<{
    suggestedTime?: string;
    suggestedTags?: string[];
    commonPatterns?: Record<string, any>;
  }> {
    try {
      const now = new Date();
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Optimized query for smart defaults - get recent records with better filtering
      const recentRecords = await this.db
        .select({
          datetime: records.datetime,
          tags: records.tags,
          content: records.content,
        })
        .from(records)
        .where(
          and(
            eq(records.householdId, householdId),
            eq(records.recordTypeId, recordTypeId),
            memberId ? eq(records.memberId, memberId) : undefined,
            // Use direct date comparison for better index usage
            sql`${records.datetime} >= ${oneMonthAgo.toISOString()}`,
            // Only get records with datetime to avoid null processing
            sql`${records.datetime} IS NOT NULL`
          )
        )
        .orderBy(desc(records.datetime))
        .limit(15); // Reduced limit for faster processing

      // Analyze patterns
      const hourCounts = new Map<number, number>();
      const tagCounts = new Map<string, number>();

      for (const record of recentRecords) {
        // Analyze time patterns
        const recordTime = (record as any).datetime
          ? new Date((record as any).datetime)
          : new Date();
        const hour = recordTime.getHours();
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);

        // Analyze tag patterns
        if (record.tags) {
          const tags = record.tags
            .split(",")
            .map((tag: string) => tag.trim().toLowerCase())
            .filter((tag: string) => tag.length > 0);

          for (const tag of tags) {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
          }
        }
      }

      // Find most common hour
      let suggestedHour = now.getHours();
      if (hourCounts.size > 0) {
        const mostCommonHour = Array.from(hourCounts.entries()).sort(
          (a, b) => b[1] - a[1]
        )[0][0];
        suggestedHour = mostCommonHour;
      }

      // Suggest time based on most common hour
      const suggestedTime = new Date();
      suggestedTime.setHours(suggestedHour, 0, 0, 0);

      // Get most common tags
      const suggestedTags = Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([tag]: [string, number]) => tag);

      return {
        suggestedTime: suggestedTime.toISOString().slice(0, 16),
        suggestedTags,
        commonPatterns: {
          mostCommonHour: suggestedHour,
          totalRecords: recentRecords.length,
        },
      };
    } catch (error) {
      console.error("Error generating smart defaults:", error);
      return {};
    }
  }

  /**
   * Invalidate cache when new records are added
   */
  async invalidateCache(householdId: string): Promise<void> {
    await this.cache.invalidateHouseholdCache(householdId);
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupCache(): Promise<void> {
    await this.cache.cleanupExpiredCache();
  }
}
