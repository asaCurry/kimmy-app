import { eq, and, desc, lt, sql } from "drizzle-orm";
import { analyticsCache, aiRecommendations } from "~/db/schema";
import type {
  NewAnalyticsCache,
  AnalyticsCache,
  NewAiRecommendation,
  AiRecommendation,
} from "~/db/schema";

export class AnalyticsDB {
  constructor(private db: any) {}

  // Analytics cache operations
  async cacheInsights(
    householdId: string,
    cacheKey: string,
    data: any,
    ttlMinutes: number = 60
  ): Promise<AnalyticsCache> {
    console.log("AnalyticsDB.cacheInsights called with:", {
      householdId,
      cacheKey,
      ttlMinutes,
    });

    try {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);

      // Delete existing cache entry for this key
      await this.db
        .delete(analyticsCache)
        .where(
          and(
            eq(analyticsCache.householdId, householdId),
            eq(analyticsCache.cacheKey, cacheKey)
          )
        );

      // Insert new cache entry
      const cacheData: NewAnalyticsCache = {
        householdId,
        cacheKey,
        data: JSON.stringify(data),
        expiresAt: expiresAt.toISOString(),
      };

      const result = await this.db
        .insert(analyticsCache)
        .values(cacheData)
        .returning();

      console.log("Cache entry created successfully:", result[0]);
      return result[0];
    } catch (error) {
      console.error("Error in AnalyticsDB.cacheInsights:", error);
      console.error("Error details:", {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack,
      });
      throw error;
    }
  }

  async getCachedInsights(
    householdId: string,
    cacheKey: string
  ): Promise<any | null> {
    console.log("AnalyticsDB.getCachedInsights called with:", {
      householdId,
      cacheKey,
    });

    try {
      const now = new Date().toISOString();

      // Clean up expired cache entries while we're at it
      await this.db
        .delete(analyticsCache)
        .where(lt(analyticsCache.expiresAt, now));

      // Get the cached entry if it exists and hasn't expired
      const result = await this.db
        .select()
        .from(analyticsCache)
        .where(
          and(
            eq(analyticsCache.householdId, householdId),
            eq(analyticsCache.cacheKey, cacheKey)
          )
        )
        .limit(1);

      if (result.length === 0) {
        console.log("No cached insights found");
        return null;
      }

      const cached = result[0];
      if (new Date(cached.expiresAt) < new Date()) {
        console.log("Cached insights expired, removing");
        await this.db
          .delete(analyticsCache)
          .where(eq(analyticsCache.id, cached.id));
        return null;
      }

      console.log("Found valid cached insights");
      return JSON.parse(cached.data || "{}");
    } catch (error) {
      console.error("Error in AnalyticsDB.getCachedInsights:", error);
      return null; // Return null on error to trigger fresh generation
    }
  }

  // AI recommendations operations
  async saveRecommendations(
    recommendations: Omit<NewAiRecommendation, "createdAt" | "updatedAt">[]
  ): Promise<AiRecommendation[]> {
    console.log(
      "AnalyticsDB.saveRecommendations called with:",
      recommendations.length,
      "recommendations"
    );

    try {
      if (recommendations.length === 0) {
        return [];
      }

      // Clear existing active recommendations for this household
      const householdId = recommendations[0].householdId;
      await this.db
        .delete(aiRecommendations)
        .where(
          and(
            eq(aiRecommendations.householdId, householdId),
            eq(aiRecommendations.status, "active")
          )
        );

      // Insert new recommendations
      const result = await this.db
        .insert(aiRecommendations)
        .values(recommendations)
        .returning();

      console.log("Recommendations saved successfully:", result.length);
      return result;
    } catch (error) {
      console.error("Error in AnalyticsDB.saveRecommendations:", error);
      throw error;
    }
  }

  async getRecommendations(
    householdId: string,
    status: string = "active"
  ): Promise<AiRecommendation[]> {
    console.log("AnalyticsDB.getRecommendations called with:", {
      householdId,
      status,
    });

    try {
      const result = await this.db
        .select()
        .from(aiRecommendations)
        .where(
          and(
            eq(aiRecommendations.householdId, householdId),
            eq(aiRecommendations.status, status)
          )
        )
        .orderBy(
          sql`CASE ${aiRecommendations.priority} WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END`,
          desc(aiRecommendations.createdAt)
        );

      console.log("Found recommendations:", result.length);
      return result;
    } catch (error) {
      console.error("Error in AnalyticsDB.getRecommendations:", error);
      return [];
    }
  }

  async updateRecommendationStatus(
    id: number,
    status: "active" | "dismissed" | "completed"
  ): Promise<void> {
    console.log("AnalyticsDB.updateRecommendationStatus called with:", {
      id,
      status,
    });

    try {
      await this.db
        .update(aiRecommendations)
        .set({
          status,
          updatedAt: sql`(datetime('now'))`,
        })
        .where(eq(aiRecommendations.id, id));

      console.log("Recommendation status updated successfully");
    } catch (error) {
      console.error("Error in AnalyticsDB.updateRecommendationStatus:", error);
      throw error;
    }
  }

  // Utility method to clean up expired cache entries
  async cleanupExpiredCache(): Promise<void> {
    console.log("AnalyticsDB.cleanupExpiredCache called");

    try {
      const now = new Date().toISOString();
      const result = await this.db
        .delete(analyticsCache)
        .where(lt(analyticsCache.expiresAt, now));

      console.log("Cleaned up expired cache entries");
    } catch (error) {
      console.error("Error in AnalyticsDB.cleanupExpiredCache:", error);
      // Don't throw - this is a background cleanup operation
    }
  }
}
