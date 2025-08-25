import type { Route } from "./+types/index";
import * as React from "react";
import { useNavigate, useLoaderData, redirect } from "react-router";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { RequireAuth, useAuth } from "~/contexts/auth-context";
import { MemberCard } from "~/components/member-card";
import type { Householdmember } from "~/lib/utils";
import { QuickActionButton } from "~/components/ui/quick-action-button";
import { withDatabaseAndSession } from "~/lib/db-utils";
import { users } from "~/db/schema";
import { eq } from "drizzle-orm";

export async function loader({ request, context }: Route.LoaderArgs) {
  return withDatabaseAndSession(request, context, async (db, session) => {
    // Load household members directly from database
    const members = await db
      .select()
      .from(users)
      .where(eq(users.householdId, session.currentHouseholdId));

    if (!members.length) {
      throw redirect("/welcome");
    }

    const householdMembers = members.map(member => ({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role || "member",
      age: member.age || undefined,
      relationshipToAdmin: member.relationshipToAdmin || undefined,
    }));

    // If only one member, redirect directly to their dashboard
    if (householdMembers.length === 1) {
      throw redirect(`/member/${householdMembers[0].id}`);
    }

    // If multiple members, return them for selection
    return {
      hasValidSession: true,
      householdMembers,
      householdId: session.currentHouseholdId,
    };
  });
}

// Member selection component for households with multiple members
function MemberSelection({
  householdMembers,
  householdId,
}: {
  householdMembers: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    age?: number;
  }>;
  householdId: string;
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
              <div className="flex flex-wrap gap-3 justify-center">
                <QuickActionButton
                  to="/trackers"
                  icon="⏱️"
                  title="All Trackers"
                  description="View household activity trackers"
                />
                <QuickActionButton
                  to="/manage"
                  icon="⚙️"
                  title="Manage Household"
                  description="Add members, manage settings"
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
