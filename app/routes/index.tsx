import type { Route } from "./+types/index";
import * as React from "react";
import { useNavigate, useLoaderData, redirect } from "react-router";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { RequireAuth, useAuth } from "~/contexts/auth-context";
import { MemberCard } from "~/components/member-card";
import type { Householdmember } from "~/lib/utils";
import { QuickActionButton } from "~/components/ui/quick-action-button";
import { withDatabaseAndSession } from "~/lib/db-utils";
import { users, households } from "~/db/schema";
import { eq } from "drizzle-orm";
import { hasAnalyticsAccess, getUserRoleInHousehold } from "~/lib/permissions";

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

    // If only one member, redirect directly to their dashboard
    if (householdMembers.length === 1) {
      throw redirect(`/member/${householdMembers[0].id}`);
    }

    // Check analytics access for UI display
    const userRole = getUserRoleInHousehold(
      session,
      session.currentHouseholdId
    );
    const canViewAnalytics = hasAnalyticsAccess(household);

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
    };
  });
}

// Member selection component for households with multiple members
function MemberSelection({
  householdMembers,
  householdId,
  canViewAnalytics = false,
  household,
}: {
  householdMembers: Array<Householdmember>;
  householdId: string;
  canViewAnalytics?: boolean;
  household?: {
    id: string;
    name: string;
    hasAnalyticsAccess: boolean;
  };
}) {
  const navigate = useNavigate();

  const handleMemberSelect = (memberId: number) => {
    navigate(`/member/${memberId}`);
  };

  return (
    <PageLayout>
      <PageHeader
        title="Select Household Member"
        subtitle="Choose which member you'd like to manage records and trackers for"
      />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-200 mb-4">
              Welcome to Your Household
            </h2>
            <p className="text-slate-400 text-lg">
              Select a household member to manage their records, trackers, and
              activities.
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
                {canViewAnalytics && (
                  <QuickActionButton
                    to="/insights"
                    icon="📊"
                    title="Insights"
                    description="View analytics and patterns"
                    color="purple"
                  />
                )}
                {!canViewAnalytics && (
                  <QuickActionButton
                    to="/insights"
                    icon="📊"
                    title="Insights"
                    description="Analytics (Premium)"
                    color="orange"
                  />
                )}
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
