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

export async function processInsightsRequests(
  env: Env,
  forceRefresh: boolean = false
): Promise<void> {
  console.log("🔍 Starting insights processing...", {
    timestamp: new Date().toISOString(),
    environment: env.ENVIRONMENT,
    hasDB: !!env.DB,
    hasAI: !!env.AI,
    forceRefresh,
  });

  if (!env.DB) {
    console.error("❌ Database not available for insights processing");
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

    console.log(
      `📋 Found ${pendingRequests.length} pending insights requests`,
      {
        requestIds: pendingRequests.map(r => r.id),
        types: pendingRequests.map(r => r.type),
        priorities: pendingRequests.map(r => r.priority),
      }
    );

    if (pendingRequests.length === 0) {
      console.log("✅ No pending requests to process");
      return;
    }

    for (const request of pendingRequests) {
      console.log(`🔄 Starting processing for request ${request.id}`, {
        requestId: request.id,
        type: request.type,
        priority: request.priority,
        householdId: request.householdId,
        createdAt: request.createdAt,
      });

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
          `⚙️ Processing insights request ${request.id} of type ${request.type}`
        );

        // Process the request
        const result = await processInsightsRequest(
          db,
          env,
          request,
          forceRefresh
        );

        console.log(`✅ Successfully processed request ${request.id}`, {
          requestId: request.id,
          resultKeys: Object.keys(result),
          hasBasicInsights: !!result.basicInsights,
          hasAIInsights: !!result.aiInsights,
          aiInsightsCount: result.aiInsights?.length || 0,
        });

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

        console.log(`🎉 Completed insights request ${request.id}`);
      } catch (error) {
        console.error(`❌ Error processing insights request ${request.id}:`, {
          requestId: request.id,
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          type: request.type,
          householdId: request.householdId,
        });

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
    console.error("💥 Error in insights processing:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}

async function processInsightsRequest(
  db: any,
  env: Env,
  request: typeof insightsRequests.$inferSelect,
  forceRefresh: boolean = false
): Promise<any> {
  console.log(`🧠 Starting AI processing for request ${request.id}`, {
    requestId: request.id,
    type: request.type,
    householdId: request.householdId,
    hasAI: !!env.AI,
    forceRefresh,
  });

  const analyticsDB = new AnalyticsDB(db);

  // Check for cached insights first (unless force refresh is requested)
  if (!forceRefresh) {
    const cacheKey = `ai_insights_${request.type}`;
    console.log(`🔍 Checking for cached insights with key: ${cacheKey}`);

    const cachedInsights = await analyticsDB.getCachedInsights(
      request.householdId,
      cacheKey
    );

    if (cachedInsights) {
      console.log(`✅ Found cached insights for request ${request.id}`, {
        requestId: request.id,
        cacheKey,
        hasBasicInsights: !!cachedInsights.basicInsights,
        hasAIInsights: !!cachedInsights.aiInsights,
        aiInsightsCount: cachedInsights.aiInsights?.length || 0,
      });

      // Return cached results but still update the request status
      const result = {
        ...cachedInsights,
        type: request.type,
        priority: request.priority,
        processedAt: new Date().toISOString(),
        fromCache: true,
      };

      console.log(`🎉 Returning cached insights for request ${request.id}`);
      return result;
    } else {
      console.log(
        `❌ No cached insights found for request ${request.id}, generating new ones`
      );
    }
  } else {
    console.log(
      `🔄 Force refresh requested for request ${request.id}, bypassing cache`
    );
  }

  // Generate basic insights first
  console.log(
    `📊 Generating basic insights for household ${request.householdId}`
  );
  const analyticsService = new AnalyticsService(db, request.householdId);
  const basicInsights = await analyticsService.generateBasicInsights();

  console.log(`✅ Basic insights generated`, {
    requestId: request.id,
    hasSummary: !!basicInsights.summary,
    categoryCount: basicInsights.categoryInsights?.length || 0,
    memberCount: basicInsights.memberInsights?.length || 0,
    patternCount: basicInsights.patterns?.length || 0,
    recommendationCount: basicInsights.recommendations?.length || 0,
  });

  let aiInsights: any[] = [];

  // Generate AI insights if available
  if (env.AI) {
    console.log(`🤖 Starting AI analysis for request ${request.id}`, {
      requestId: request.id,
      type: request.type,
      householdId: request.householdId,
    });

    try {
      const aiService = new AIAnalyticsService(db, env.AI, request.householdId);

      // Generate AI insights (currently only comprehensive available)
      // TODO: Implement specialized insights filtering based on request.type
      console.log(`🚀 Calling AI service for advanced insights...`);
      aiInsights = await aiService.generateAdvancedInsights();

      console.log(`🎯 AI insights generated successfully`, {
        requestId: request.id,
        aiInsightsCount: aiInsights.length,
        insightTypes: aiInsights.map(i => i.type),
      });

      // Filter insights based on request type if needed
      if (request.type !== "comprehensive") {
        console.log(`🔍 Filtering AI insights for type: ${request.type}`);
        aiInsights = filterInsightsByType(aiInsights, request.type);
        console.log(`📋 Filtered AI insights count: ${aiInsights.length}`);
      }
    } catch (aiError) {
      console.error(`❌ AI insights failed for request ${request.id}:`, {
        requestId: request.id,
        error: aiError instanceof Error ? aiError.message : "Unknown AI error",
        stack: aiError instanceof Error ? aiError.stack : undefined,
        type: request.type,
        householdId: request.householdId,
      });
      console.warn("AI insights failed, using basic insights only:", aiError);
    }
  } else {
    console.log(`⚠️ No AI binding available for request ${request.id}`, {
      requestId: request.id,
      hasAI: !!env.AI,
    });
  }

  // Save recommendations to database if any
  if (
    basicInsights.recommendations &&
    basicInsights.recommendations.length > 0
  ) {
    console.log(
      `💾 Saving ${basicInsights.recommendations.length} recommendations to database`
    );
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

  console.log(`💾 Caching results for request ${request.id}`, {
    requestId: request.id,
    cacheKey,
    dataSize: JSON.stringify(cacheData).length,
  });

  await analyticsDB.cacheInsights(
    request.householdId,
    cacheKey,
    cacheData,
    240 // Cache for 4 hours
  );

  const result = {
    basicInsights,
    aiInsights,
    type: request.type,
    priority: request.priority,
    processedAt: new Date().toISOString(),
  };

  console.log(
    `🎉 Successfully completed processing for request ${request.id}`,
    {
      requestId: request.id,
      type: request.type,
      basicInsightsGenerated: !!basicInsights,
      aiInsightsGenerated: aiInsights.length > 0,
      totalInsights: aiInsights.length,
    }
  );

  return result;
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
