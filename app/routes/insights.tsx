import * as React from "react";
import type { Route } from "./+types/insights";
import { useLoaderData } from "react-router";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { RequireAuth } from "~/contexts/auth-context";
import { withDatabaseAndSession } from "~/lib/db-utils";
import { AnalyticsDB } from "~/lib/analytics-db";
import { AnalyticsService } from "~/lib/analytics-service";
import { InsightsDashboard } from "~/components/insights-dashboard";
import { UpgradeToPremiumCard } from "~/components/upgrade-to-premium-card";
import { canAccessAnalytics, getUserRoleInHousehold } from "~/lib/permissions";
import { households } from "~/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "react-router";

export async function loader({ request, context }: Route.LoaderArgs) {
  return withDatabaseAndSession(request, context, async (db, session) => {
    console.log("Insights loader called for household:", session.currentHouseholdId);

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
    const userRole = getUserRoleInHousehold(session, session.currentHouseholdId);
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
        cached: false
      };
    }

    const analyticsDB = new AnalyticsDB(db);
    const cacheKey = "basic_insights";
    const ttlMinutes = 60; // Cache for 1 hour

    try {
      // Check for cached insights first
      let insights = await analyticsDB.getCachedInsights(session.currentHouseholdId, cacheKey);

      if (!insights) {
        console.log("No cached insights found, generating new ones");
        
        // Generate fresh insights
        const analyticsService = new AnalyticsService(db, session.currentHouseholdId);
        insights = await analyticsService.generateBasicInsights();

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
        };

        await analyticsDB.cacheInsights(
          session.currentHouseholdId,
          cacheKey,
          cacheData,
          ttlMinutes
        );

        console.log("Generated and cached new insights");
      } else {
        console.log("Using cached insights");
      }

      // Always fetch fresh recommendations from database
      const recommendations = await analyticsDB.getRecommendations(session.currentHouseholdId);

      return {
        success: true,
        hasAccess: true,
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
          }))
        },
        generatedAt: new Date().toISOString(),
        cached: !!insights // true if we used cached data
      };
    } catch (error) {
      console.error("Error loading insights:", error);
      
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
        cached: false
      };
    }
  });
}

export default function InsightsPage() {
  const data = useLoaderData<typeof loader>();
  
  return (
    <RequireAuth requireHousehold={true}>
      <PageLayout>
        <PageHeader
          title="Household Insights"
          subtitle="Analytics and patterns from your household data"
        />
        
        <div className="space-y-6">
          {!data.hasAccess && (
            <UpgradeToPremiumCard reason={data.reason} household={data.household} />
          )}

          {!data.success && data.hasAccess && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h3 className="text-blue-400 font-medium mb-2">No Insights Available Yet</h3>
              <p className="text-blue-300 text-sm">
                {data.error || "Check back later for your first round of insights."}
              </p>
            </div>
          )}

          {data.hasAccess && (
            <InsightsDashboard 
              insights={data.insights}
              generatedAt={data.generatedAt}
              cached={data.cached}
            />
          )}

          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-xs text-slate-400">
              <details>
                <summary className="cursor-pointer hover:text-slate-300">
                  Debug Information
                </summary>
                <pre className="mt-2 whitespace-pre-wrap">
                  {JSON.stringify({
                    success: data.success,
                    cached: data.cached,
                    generatedAt: data.generatedAt,
                    summaryCount: data.insights?.summary ? Object.keys(data.insights.summary).length : 0,
                    categoriesCount: data.insights?.categoryInsights?.length || 0,
                    membersCount: data.insights?.memberInsights?.length || 0,
                    patternsCount: data.insights?.patterns?.length || 0,
                    recommendationsCount: data.insights?.recommendations?.length || 0,
                  }, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </PageLayout>
    </RequireAuth>
  );
}