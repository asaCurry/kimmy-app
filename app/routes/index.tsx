import type { Route } from "./+types/index";
import * as React from "react";
import { useNavigate, useLoaderData, redirect } from "react-router";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { RequireAuth } from "~/contexts/auth-context";
import { MemberCard } from "~/components/member-card";
import type { Householdmember } from "~/lib/utils";
import { QuickActionButton } from "~/components/ui/quick-action-button";
import { RecentInsights } from "~/components/recent-insights";
import { withDatabaseAndSession } from "~/lib/db-utils";
import { users, households, insightsRequests } from "~/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { hasAnalyticsAccess, getUserRoleInHousehold } from "~/lib/permissions";
import type { AIInsight } from "~/lib/ai-analytics-service";

export async function loader({ request, context }: Route.LoaderArgs) {
  return withDatabaseAndSession(request, context, async (db, session) => {
    // Load household data and members
    const [householdData, members] = await Promise.all([
      db
        .select()
        .from(households)
        .where(eq(households.id, session.currentHouseholdId))
        .limit(1),
      db
        .select()
        .from(users)
        .where(eq(users.householdId, session.currentHouseholdId)),
    ]);

    if (!members.length) {
      throw redirect("/welcome");
    }

    const household = householdData[0];

    const householdMembers = members.map(member => ({
      id: member.id,
      name: member.name,
      email: member.email,
      role: (member.role as "admin" | "member") || "member",
      age: member.age || undefined,
      relationshipToAdmin: member.relationshipToAdmin || undefined,
    })) as Array<Householdmember>;

    // Always show member selector for consistent UX, even for single-member households

    // Check analytics access for UI display
    const _userRole = getUserRoleInHousehold(
      session,
      session.currentHouseholdId
    );
    const canViewAnalytics = hasAnalyticsAccess(household);

    // Fetch recent insights if analytics access is available
    let recentInsights: AIInsight[] = [];
    if (canViewAnalytics) {
      try {
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

        if (completedRequests.length > 0) {
          const request = completedRequests[0];
          try {
            const requestResult = JSON.parse(request.result || "{}");
            recentInsights = requestResult.aiInsights || [];
          } catch (parseError) {
            console.warn("Failed to parse insights for home page", {
              parseError,
            });
          }
        }
      } catch (error) {
        console.warn("Failed to fetch recent insights for home page", {
          error,
        });
      }
    }

    // If multiple members, return them for selection
    return {
      hasValidSession: true,
      householdMembers,
      householdId: session.currentHouseholdId,
      household: {
        id: household?.id || session.currentHouseholdId,
        name: household?.name || "Your Household",
        hasAnalyticsAccess: canViewAnalytics,
      },
      canViewAnalytics,
      recentInsights,
    };
  });
}

// Member selection component for households with multiple members
function MemberSelection({
  householdMembers,
  householdId: _householdId,
  canViewAnalytics = false,
  household: _household,
  recentInsights = [],
}: {
  householdMembers: Array<Householdmember>;
  householdId: string;
  canViewAnalytics?: boolean;
  household?: {
    id: string;
    name: string;
    hasAnalyticsAccess: boolean;
  };
  recentInsights?: AIInsight[];
}) {
  const navigate = useNavigate();

  const handleMemberSelect = (memberId: number) => {
    navigate(`/member/${memberId}`);
  };

  return (
    <PageLayout>
      <PageHeader
        title={
          householdMembers.length === 1
            ? "Your Household"
            : "Select Household Member"
        }
        subtitle={
          householdMembers.length === 1
            ? "Click below to access records and trackers"
            : "Choose which member you'd like to manage records and trackers for"
        }
      />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-200 mb-4">
              {householdMembers.length === 1
                ? "Ready to Get Started"
                : "Welcome to Your Household"}
            </h2>
            <p className="text-slate-400 text-lg">
              {householdMembers.length === 1
                ? "Click on your member card below to start managing records and trackers."
                : "Select a household member to manage their records, trackers, and activities."}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {householdMembers.map(member => (
              <div
                key={member.id}
                onClick={() => handleMemberSelect(member.id)}
                className="cursor-pointer"
              >
                <MemberCard
                  member={member}
                  onSelect={() => handleMemberSelect(member.id)}
                />
              </div>
            ))}
          </div>

          <RecentInsights
            insights={recentInsights}
            canViewAnalytics={canViewAnalytics}
          />

          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 border border-blue-500/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">
                Quick Actions
              </h3>
              <p className="text-slate-400 mb-4">
                Access household-wide features and management tools
              </p>
              <div className="flex flex-wrap gap-3 justify-center lg:justify-center xl:flex-nowrap">
                <QuickActionButton
                  to="/household-records"
                  icon="📋"
                  title="Manage Records"
                  description="Manage all household records & types"
                  color="emerald"
                />
                <QuickActionButton
                  to={`/member/${householdMembers[0]?.id || 1}`}
                  icon="📝"
                  title="Member Records"
                  description="View individual member records"
                  color="blue"
                />
                <QuickActionButton
                  to="/trackers"
                  icon="⏱️"
                  title="Activity Trackers"
                  description="View household activity trackers"
                  color="purple"
                />
                <QuickActionButton
                  to="/insights"
                  icon="📊"
                  title="Insights"
                  description={
                    canViewAnalytics
                      ? "View analytics and patterns"
                      : "Analytics (Premium)"
                  }
                  color={canViewAnalytics ? "purple" : "orange"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();

  // If no valid session, this should have redirected in the loader
  if (!loaderData?.hasValidSession) {
    return null;
  }

  return (
    <RequireAuth requireHousehold={true}>
      <MemberSelection
        householdMembers={loaderData.householdMembers}
        householdId={loaderData.householdId}
        canViewAnalytics={loaderData.canViewAnalytics}
        household={loaderData.household}
        recentInsights={loaderData.recentInsights}
      />
    </RequireAuth>
  );
}

// Error boundary to handle authentication errors
export function ErrorBoundary() {
  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold text-slate-200 mb-4">
            Authentication Required
          </h2>
          <p className="text-slate-400 mb-6">
            Please sign in to access your household dashboard.
          </p>
          <div className="space-y-3">
            <a
              href="/login"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-md hover:from-blue-600 hover:to-purple-700 transition-colors"
            >
              Sign In
            </a>
            <div className="text-sm text-slate-500">
              <p>Don't have an account?</p>
              <a
                href="/onboarding"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Create one here
              </a>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
