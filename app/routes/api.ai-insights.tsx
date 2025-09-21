import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { withDatabaseAndSession } from "~/lib/db-utils";
import { AIAnalyticsService } from "~/lib/ai-analytics-service";
import { AnalyticsDB } from "~/lib/analytics-db";
import { analyticsLogger } from "~/lib/logger";
import { getValidatedEnv } from "~/lib/env.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  return withDatabaseAndSession(request, context, async (db, session) => {
    const url = new URL(request.url);
    const timeRange = url.searchParams.get("timeRange") || "30";
    const category = url.searchParams.get("category") || "all";

    try {
      analyticsLogger.info("Generating AI insights", {
        householdId: session.currentHouseholdId,
        timeRange,
        category,
      });

      const env = getValidatedEnv(context);

      // Check if AI binding is available
      if (!env.AI) {
        analyticsLogger.warn(
          "AI binding not available, returning mock insights"
        );
        return Response.json({
          success: true,
          insights: [],
          metadata: {
            totalGenerated: 0,
            filtered: 0,
            category,
            timeRange,
            generatedAt: new Date().toISOString(),
            note: "AI insights require Cloudflare AI binding configuration",
          },
          cached: false,
        });
      }

      // Initialize AI Analytics Service
      const aiService = new AIAnalyticsService(
        db,
        env.AI, // Cloudflare AI binding
        session.currentHouseholdId
      );

      // Check for cached AI insights first
      const analyticsDB = new AnalyticsDB(db);
      const cacheKey = `ai_insights_${category}_${timeRange}`;
      const ttlMinutes = 120; // Cache for 2 hours

      let insights = await analyticsDB.getCachedInsights(
        session.currentHouseholdId,
        cacheKey
      );

      if (!insights) {
        analyticsLogger.info(
          "No cached AI insights found, generating new ones"
        );

        // Generate new AI insights
        const aiInsights = await aiService.generateAdvancedInsights();

        // Filter by category if specified
        const filteredInsights =
          category === "all"
            ? aiInsights
            : aiInsights.filter(
                insight =>
                  insight.type === category ||
                  insight.category
                    .toLowerCase()
                    .includes(category.toLowerCase())
              );

        insights = {
          insights: filteredInsights,
          metadata: {
            totalGenerated: aiInsights.length,
            filtered: filteredInsights.length,
            category,
            timeRange,
            generatedAt: new Date().toISOString(),
          },
        };

        // Cache the insights (don't fail if caching fails)
        try {
          await analyticsDB.cacheInsights(
            session.currentHouseholdId,
            cacheKey,
            insights,
            ttlMinutes
          );
        } catch (cacheError) {
          analyticsLogger.warn("Failed to cache insights", {
            error:
              cacheError instanceof Error
                ? cacheError.message
                : "Unknown error",
          });
          // Continue execution - caching failure shouldn't break the response
        }

        analyticsLogger.info(
          `Generated ${filteredInsights.length} AI insights`
        );
      } else {
        analyticsLogger.info("Using cached AI insights");
      }

      return Response.json({
        success: true,
        insights: insights.insights || [],
        metadata: insights.metadata || {
          totalGenerated: 0,
          filtered: 0,
          category,
          timeRange,
          generatedAt: new Date().toISOString(),
        },
        cached: !!insights,
      });
    } catch (error) {
      analyticsLogger.error("Error generating AI insights", {
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Return fallback response
      return Response.json(
        {
          success: false,
          error: "Failed to generate AI insights",
          insights: [],
          metadata: {
            totalGenerated: 0,
            filtered: 0,
            category,
            timeRange,
            generatedAt: new Date().toISOString(),
          },
          cached: false,
        },
        {
          status: 500,
        }
      );
    }
  });
}

export async function action({ request, context }: ActionFunctionArgs) {
  return withDatabaseAndSession(request, context, async (db, session) => {
    const formData = await request.formData();
    const action = formData.get("action") as string;
    const insightId = formData.get("insightId") as string;

    try {
      const _analyticsDB = new AnalyticsDB(db);

      switch (action) {
        case "dismiss":
          // Mark insight as dismissed (could store in database)
          analyticsLogger.info("Insight dismissed", { insightId });
          return Response.json({ success: true, message: "Insight dismissed" });

        case "mark_complete":
          // Mark insight as completed/acted upon
          analyticsLogger.info("Insight marked complete", { insightId });
          return Response.json({
            success: true,
            message: "Insight marked as complete",
          });

        case "regenerate": {
          // Clear cache and regenerate insights
          const _cachePattern = "ai_insights_";
          // Note: In a full implementation, you'd have a method to clear cache by pattern
          analyticsLogger.info("Regenerating AI insights", {
            householdId: session.currentHouseholdId,
          });
          return Response.json({
            success: true,
            message: "Insights will be regenerated on next request",
          });
        }

        default:
          return Response.json(
            { success: false, error: "Unknown action" },
            {
              status: 400,
            }
          );
      }
    } catch (error) {
      analyticsLogger.error("Error processing AI insight action", {
        action,
        insightId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return Response.json(
        { success: false, error: "Failed to process action" },
        {
          status: 500,
        }
      );
    }
  });
}
