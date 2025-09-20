/**
 * Background processor for AI insights requests
 * Handles async processing of insights requests created via the API
 */

import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { insightsRequests } from "~/db/schema";
import * as schema from "~/db/schema";
import { AIAnalyticsService, type AIInsight } from "~/lib/ai-analytics-service";
import { AnalyticsService } from "~/lib/analytics-service";
import { AnalyticsDB } from "~/lib/analytics-db";
import type { Env } from "~/lib/env.server";

export async function processInsightsRequests(env: Env): Promise<void> {
  if (!env.DB) {
    console.error("Database not available for insights processing");
    return;
  }

  const db = drizzle(env.DB, { schema });

  try {
    // Get all pending insights requests
    const pendingRequests = await db
      .select()
      .from(insightsRequests)
      .where(eq(insightsRequests.status, "pending"))
      .limit(10); // Process up to 10 requests per run

    console.log(`Found ${pendingRequests.length} pending insights requests`);

    for (const request of pendingRequests) {
      try {
        // Mark as processing
        await db
          .update(insightsRequests)
          .set({
            status: "processing",
            updatedAt: new Date().toISOString(),
          })
          .where(eq(insightsRequests.id, request.id));

        console.log(
          `Processing insights request ${request.id} of type ${request.type}`
        );

        // Process the request
        const result = await processInsightsRequest(db, env, request);

        // Mark as completed with result
        await db
          .update(insightsRequests)
          .set({
            status: "completed",
            result: JSON.stringify(result),
            processedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(insightsRequests.id, request.id));

        console.log(`Completed insights request ${request.id}`);
      } catch (error) {
        console.error(
          `Error processing insights request ${request.id}:`,
          error
        );

        // Mark as failed with error
        await db
          .update(insightsRequests)
          .set({
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
            updatedAt: new Date().toISOString(),
          })
          .where(eq(insightsRequests.id, request.id));
      }
    }
  } catch (error) {
    console.error("Error in insights processing:", error);
  }
}

async function processInsightsRequest(
  db: any,
  env: Env,
  request: typeof insightsRequests.$inferSelect
): Promise<any> {
  const analyticsDB = new AnalyticsDB(db);

  // Generate basic insights first
  const analyticsService = new AnalyticsService(db, request.householdId);
  const basicInsights = await analyticsService.generateBasicInsights();

  let aiInsights: any[] = [];

  // Generate AI insights if available
  if (env.AI) {
    try {
      const aiService = new AIAnalyticsService(db, env.AI, request.householdId);

      // Generate AI insights (currently only comprehensive available)
      // TODO: Implement specialized insights filtering based on request.type
      aiInsights = await aiService.generateAdvancedInsights();

      // Filter insights based on request type if needed
      if (request.type !== "comprehensive") {
        aiInsights = filterInsightsByType(aiInsights, request.type);
      }
    } catch (aiError) {
      console.warn("AI insights failed, using basic insights only:", aiError);
    }
  }

  // Save recommendations to database if any
  if (
    basicInsights.recommendations &&
    basicInsights.recommendations.length > 0
  ) {
    await analyticsDB.saveRecommendations(basicInsights.recommendations);
  }

  // Cache the results
  const cacheKey = `ai_insights_${request.type}`;
  const cacheData = {
    summary: basicInsights.summary,
    categoryInsights: basicInsights.categoryInsights,
    memberInsights: basicInsights.memberInsights,
    patterns: basicInsights.patterns,
    aiInsights: aiInsights,
    requestType: request.type,
    priority: request.priority,
  };

  await analyticsDB.cacheInsights(
    request.householdId,
    cacheKey,
    cacheData,
    240 // Cache for 4 hours
  );

  return {
    basicInsights,
    aiInsights,
    type: request.type,
    priority: request.priority,
    processedAt: new Date().toISOString(),
  };
}

function filterInsightsByType(
  insights: AIInsight[],
  type: string
): AIInsight[] {
  switch (type) {
    case "health":
      return insights.filter(
        insight =>
          insight.type === "health" ||
          insight.category.toLowerCase().includes("health") ||
          insight.category.toLowerCase().includes("medical") ||
          insight.category.toLowerCase().includes("wellness")
      );
    case "growth":
      return insights.filter(
        insight =>
          insight.type === "growth" ||
          insight.type === "development" ||
          insight.category.toLowerCase().includes("growth") ||
          insight.category.toLowerCase().includes("development") ||
          insight.category.toLowerCase().includes("milestone")
      );
    case "behavior":
      return insights.filter(
        insight =>
          insight.type === "behavior" ||
          insight.category.toLowerCase().includes("behavior") ||
          insight.category.toLowerCase().includes("mood") ||
          insight.category.toLowerCase().includes("activity")
      );
    default:
      return insights; // Return all for comprehensive or unknown types
  }
}
