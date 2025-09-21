import * as React from "react";
import type { Route } from "./+types/insights";
import { useLoaderData } from "react-router";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { RequireAuth, useAuth } from "~/contexts/auth-context";
import { withDatabaseAndSession } from "~/lib/db-utils";
import { AnalyticsDB } from "~/lib/analytics-db";
import { AnalyticsService } from "~/lib/analytics-service";
import { AIAnalyticsService, type AIInsight } from "~/lib/ai-analytics-service";
import { getValidatedEnv } from "~/lib/env.server";
import { InsightsDashboard } from "~/components/insights-dashboard";
import { EnhancedAnalyticsDashboard } from "~/components/enhanced-analytics-dashboard";
import { UpgradeToPremiumCard } from "~/components/upgrade-to-premium-card";
import { InsightsRequestCard } from "~/components/insights-request-card";
import { canAccessAnalytics, getUserRoleInHousehold } from "~/lib/permissions";
import { households, insightsRequests } from "~/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { analyticsLogger } from "~/lib/logger";
import { toast } from "react-toastify";

export async function loader({ request, context }: Route.LoaderArgs) {
  return withDatabaseAndSession(request, context, async (db, session) => {
    analyticsLogger.info("Loading insights", {
      householdId: session.currentHouseholdId,
    });

    // Get household data to check analytics access
    const household = await db
      .select()
      .from(households)
      .where(eq(households.id, session.currentHouseholdId))
      .limit(1);

    if (!household.length) {
      throw new Response("Household not found", { status: 404 });
    }

    const householdData = household[0];

    // Check if user has permission to access analytics
    const userRole = getUserRoleInHousehold(
      session,
      session.currentHouseholdId
    );
    const accessCheck = canAccessAnalytics(householdData, userRole || "MEMBER");

    if (!accessCheck.canAccess) {
      // Return access denied data instead of throwing error
      // This allows us to show upgrade CTA instead of error page
      return {
        success: false,
        hasAccess: false,
        reason: accessCheck.reason,
        household: {
          id: householdData.id,
          name: householdData.name,
          hasAnalyticsAccess: Boolean(householdData.hasAnalyticsAccess),
        },
        insights: {
          summary: {
            totalRecords: 0,
            totalMembers: 0,
            activeCategories: [],
            recordsThisWeek: 0,
            recordsThisMonth: 0,
            mostActiveCategory: null,
            mostActiveMember: null,
          },
          categoryInsights: [],
          memberInsights: [],
          patterns: [],
          recommendations: [],
        },
        generatedAt: new Date().toISOString(),
        cached: false,
      };
    }

    const analyticsDB = new AnalyticsDB(db);
    const env = getValidatedEnv(context);

    // Try to use AI analytics if available, fallback to basic analytics
    const useAI = !!env.AI;
    const cacheKey = useAI ? "insights_comprehensive" : "basic_insights";
    const ttlMinutes = useAI ? 120 : 60; // Cache AI insights longer

    try {
      // First check for completed insights requests
      const completedRequests = await db
        .select()
        .from(insightsRequests)
        .where(
          and(
            eq(insightsRequests.householdId, session.currentHouseholdId),
            eq(insightsRequests.status, "completed")
          )
        )
        .orderBy(desc(insightsRequests.processedAt))
        .limit(1);

      let insights: any = null;
      let aiInsights: AIInsight[] = [];

      if (completedRequests.length > 0) {
        // Use insights from completed request
        const request = completedRequests[0];
        try {
          const requestResult = JSON.parse(request.result || "{}");
          insights = requestResult.basicInsights;
          aiInsights = requestResult.aiInsights || [];

          analyticsLogger.info(
            `Using insights from completed request ${request.id}`,
            {
              requestType: request.type,
              aiInsightsCount: aiInsights.length,
              processedAt: request.processedAt,
            }
          );
        } catch (parseError) {
          analyticsLogger.warn("Failed to parse insights request result", {
            parseError,
          });
        }
      }

      // Fall back to cached insights if no completed requests
      if (!insights) {
        insights = await analyticsDB.getCachedInsights(
          session.currentHouseholdId,
          cacheKey
        );

        if (insights) {
          aiInsights = (insights.aiInsights as AIInsight[]) || [];
          analyticsLogger.debug("Using cached insights");
        }
      }

      if (!insights) {
        analyticsLogger.debug(
          `No cached insights found, generating new ${useAI ? "AI" : "basic"} insights`
        );

        // Generate basic insights first (always available as fallback)
        const analyticsService = new AnalyticsService(
          db,
          session.currentHouseholdId
        );
        insights = await analyticsService.generateBasicInsights();

        if (useAI) {
          // Generate AI-powered insights
          try {
            const aiService = new AIAnalyticsService(
              db,
              env.AI,
              session.currentHouseholdId
            );
            aiInsights = await aiService.generateAdvancedInsights();
            analyticsLogger.info(`Generated ${aiInsights.length} AI insights`);
          } catch (aiError) {
            analyticsLogger.warn(
              "AI insights failed, falling back to basic analytics",
              {
                error:
                  aiError instanceof Error ? aiError.message : "Unknown error",
              }
            );
          }
        }

        // Save recommendations to database
        if (insights.recommendations && insights.recommendations.length > 0) {
          await analyticsDB.saveRecommendations(insights.recommendations);
        }

        // Cache the insights (excluding recommendations since they're stored separately)
        const cacheData = {
          summary: insights.summary,
          categoryInsights: insights.categoryInsights,
          memberInsights: insights.memberInsights,
          patterns: insights.patterns,
          aiInsights: aiInsights as AIInsight[], // Include AI insights in cache
        };

        await analyticsDB.cacheInsights(
          session.currentHouseholdId,
          cacheKey,
          cacheData,
          ttlMinutes
        );

        analyticsLogger.info(
          `Generated and cached new ${useAI ? "AI-enhanced" : "basic"} insights`
        );
      } else {
        analyticsLogger.debug("Using cached insights");
        aiInsights = (insights.aiInsights as AIInsight[]) || [];
      }

      // Always fetch fresh recommendations from database
      const recommendations = await analyticsDB.getRecommendations(
        session.currentHouseholdId
      );

      return {
        success: true,
        hasAccess: true,
        useAI,
        household: {
          id: householdData.id,
          name: householdData.name,
          hasAnalyticsAccess: Boolean(householdData.hasAnalyticsAccess),
        },
        insights: {
          ...insights,
          recommendations: recommendations.map(rec => ({
            id: rec.id,
            type: rec.type,
            title: rec.title,
            description: rec.description,
            priority: rec.priority,
            status: rec.status,
            memberId: rec.memberId,
            metadata: rec.metadata ? JSON.parse(rec.metadata) : null,
            createdAt: rec.createdAt,
          })),
        },
        aiInsights: aiInsights,
        generatedAt: new Date().toISOString(),
        cached: !!insights, // true if we used cached data
      };
    } catch (error) {
      analyticsLogger.error("Error loading insights", {
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Return fallback data structure
      return {
        success: false,
        hasAccess: true,
        error: "check back later for your first round of insights",
        household: {
          id: householdData.id,
          name: householdData.name,
          hasAnalyticsAccess: Boolean(householdData.hasAnalyticsAccess),
        },
        insights: {
          summary: {
            totalRecords: 0,
            totalMembers: 0,
            activeCategories: [],
            recordsThisWeek: 0,
            recordsThisMonth: 0,
            mostActiveCategory: null,
            mostActiveMember: null,
          },
          categoryInsights: [],
          memberInsights: [],
          patterns: [],
          recommendations: [],
        },
        generatedAt: new Date().toISOString(),
        cached: false,
      };
    }
  });
}

export default function InsightsPage() {
  const data = useLoaderData<typeof loader>();
  const { session } = useAuth();

  const handleInsightsRequest = async (type: string) => {
    try {
      const formData = new FormData();
      formData.append("_action", "create");
      formData.append("type", type);
      formData.append("priority", "normal");
      formData.append("description", `Admin requested ${type} analysis`);

      const response = await fetch("/api/insights-request", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = (await response.json()) as {
          message: string;
          success: boolean;
          processedImmediately?: boolean;
          processingError?: string;
        };

        if (result.processedImmediately) {
          toast.success(
            `${result.message}. Fresh insights have been generated!`
          );
        } else if (result.processingError) {
          toast.warning(
            `${result.message}. Processing will be handled by background worker.`
          );
        } else {
          toast.success(
            `${result.message}. Your request has been queued for processing.`
          );
        }
      } else {
        toast.error("Failed to create insights request. Please try again.");
      }
    } catch (error) {
      console.error("Error creating insights request:", error);
      toast.error("An error occurred. Please try again.");
    }
  };

  const insightsRequestTypes = [
    {
      type: "comprehensive" as const,
      title: "Comprehensive",
      description: "Full household analysis",
      icon: "📊",
      colorScheme: "blue" as const,
    },
    {
      type: "health" as const,
      title: "Health Focus",
      description: "Medical & wellness patterns",
      icon: "💚",
      colorScheme: "green" as const,
    },
    {
      type: "growth" as const,
      title: "Growth Tracking",
      description: "Development & milestones",
      icon: "📈",
      colorScheme: "purple" as const,
    },
    {
      type: "behavior" as const,
      title: "Behavior Analysis",
      description: "Mood & activity patterns",
      icon: "🧠",
      colorScheme: "yellow" as const,
    },
  ];

  return (
    <RequireAuth requireHousehold={true}>
      <PageLayout>
        <PageHeader
          title="Household Insights"
          subtitle="Analytics and patterns from your household data"
        />

        <div className="space-y-6">
          {!data.hasAccess && (
            <UpgradeToPremiumCard
              reason={data.reason}
              household={data.household}
            />
          )}

          {!data.success && data.hasAccess && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h3 className="text-blue-400 font-medium mb-2">
                No Insights Available Yet
              </h3>
              <p className="text-blue-300 text-sm">
                {data.error ||
                  "Check back later for your first round of insights."}
              </p>
            </div>
          )}

          {data.hasAccess && (
            <>
              {/* Admin-Only Insights Request Section */}
              {data.useAI &&
                data.household.hasAnalyticsAccess &&
                session?.role === "admin" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
                        🔬 Request Advanced Analysis
                        <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                          ADMIN ONLY
                        </span>
                      </h2>
                    </div>

                    <div className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border border-red-500/30 rounded-lg p-4">
                      <p className="text-sm text-slate-300 mb-4">
                        As an admin, you can request comprehensive AI analysis
                        that goes beyond standard insights. These requests are
                        processed with priority and provide deeper behavioral
                        patterns and predictions.
                      </p>

                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                        {insightsRequestTypes.map(requestType => (
                          <InsightsRequestCard
                            key={requestType.type}
                            type={requestType.type}
                            title={requestType.title}
                            description={requestType.description}
                            icon={requestType.icon}
                            colorScheme={requestType.colorScheme}
                            onClick={() =>
                              handleInsightsRequest(requestType.type)
                            }
                          />
                        ))}
                      </div>

                      <div className="mt-4 pt-4 border-t border-red-500/20">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>
                            Advanced AI processing • Results in 5-15 minutes
                          </span>
                          <span className="text-red-400">Admin feature</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* AI Insights Section */}
              {data.useAI && data.aiInsights && data.aiInsights.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
                      🧠 AI-Powered Insights
                      <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                        NEW
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Generated using Cloudflare AI
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {data.aiInsights.map((insight: any) => (
                      <div
                        key={insight.id}
                        className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-blue-200 text-sm">
                            {insight.title}
                          </h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              insight.importance === "critical"
                                ? "bg-red-500/20 text-red-300"
                                : insight.importance === "high"
                                  ? "bg-orange-500/20 text-orange-300"
                                  : "bg-blue-500/20 text-blue-300"
                            }`}
                          >
                            {insight.importance}
                          </span>
                        </div>
                        <p className="text-slate-300 text-sm mb-3">
                          {insight.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="capitalize">{insight.type}</span>
                          <span
                            className={`${
                              insight.confidence === "high"
                                ? "text-green-400"
                                : insight.confidence === "medium"
                                  ? "text-yellow-400"
                                  : "text-slate-400"
                            }`}
                          >
                            {insight.confidence} confidence
                          </span>
                        </div>
                        {insight.recommendations &&
                          insight.recommendations.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-600">
                              <p className="text-xs font-medium text-slate-300 mb-1">
                                Recommendations:
                              </p>
                              <ul className="text-xs text-slate-400 space-y-1">
                                {insight.recommendations
                                  .slice(0, 2)
                                  .map((rec: string, idx: number) => (
                                    <li
                                      key={idx}
                                      className="flex items-start gap-1"
                                    >
                                      <span>•</span>
                                      <span>{rec}</span>
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.useAI &&
                (!data.aiInsights || data.aiInsights.length === 0) && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <h3 className="text-blue-400 font-medium mb-2 flex items-center gap-2">
                      🧠 AI Insights
                      <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                        ENABLED
                      </span>
                    </h3>
                    <p className="text-blue-300 text-sm">
                      AI-powered insights will be available once you have more
                      data. Keep adding records to unlock advanced pattern
                      detection!
                    </p>
                  </div>
                )}

              <EnhancedAnalyticsDashboard
                insights={data.insights}
                aiInsights={data.aiInsights || []}
                generatedAt={data.generatedAt}
                cached={data.cached}
                _householdId={data.household.id}
              />

              {/* Fallback to basic dashboard if enhanced fails */}
              <div className="mt-8 pt-8 border-t border-slate-700">
                <h3 className="text-lg font-semibold text-slate-200 mb-4">
                  Basic Analytics (Fallback)
                </h3>
                <InsightsDashboard
                  insights={data.insights}
                  generatedAt={data.generatedAt}
                  cached={data.cached}
                />
              </div>
            </>
          )}

          {/* Debug info in development */}
          {import.meta.env?.DEV && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-xs text-slate-400">
              <details>
                <summary className="cursor-pointer hover:text-slate-300">
                  Debug Information
                </summary>
                <pre className="mt-2 whitespace-pre-wrap">
                  {JSON.stringify(
                    {
                      success: data.success,
                      cached: data.cached,
                      useAI: data.useAI,
                      generatedAt: data.generatedAt,
                      summaryCount: data.insights?.summary
                        ? Object.keys(data.insights.summary).length
                        : 0,
                      categoriesCount:
                        data.insights?.categoryInsights?.length || 0,
                      membersCount: data.insights?.memberInsights?.length || 0,
                      patternsCount: data.insights?.patterns?.length || 0,
                      recommendationsCount:
                        data.insights?.recommendations?.length || 0,
                      aiInsightsCount: data.aiInsights?.length || 0,
                    },
                    null,
                    2
                  )}
                </pre>
              </details>
            </div>
          )}
        </div>
      </PageLayout>
    </RequireAuth>
  );
}
