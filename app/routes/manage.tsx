import type { ActionFunctionArgs } from "react-router";
import { useAuth } from "~/contexts/auth-context";
import { useLoaderData, redirect, useFetcher } from "react-router";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { RequireAuth } from "~/contexts/auth-context";
import { PageLoading } from "~/components/ui/loading";
import { NoHousehold } from "~/components/manage/no-household";
import { QuickActions } from "~/components/manage/quick-actions";
import { HouseholdOverview } from "~/components/manage/household-overview";
import { HouseholdmemberList } from "~/components/manage/household-member-list";
import { InviteCodeManager } from "~/components/manage/invite-code-manager";
import { NavigationSection } from "~/components/manage/navigation-section";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { loadHouseholdData } from "~/lib/loader-helpers";
import { inviteCodeDb } from "~/lib/db";
import { withDatabaseAndSession } from "~/lib/db-utils";
import { seedAllDemoData } from "~/lib/demo-data-seeder";

interface Householdmember {
  id: number;
  name: string;
  email: string;
  role: "admin" | "member";
  age?: number;
  relationshipToAdmin?: string;
}

interface LoaderData {
  members: Householdmember[];
  householdId: string | null;
  inviteCode: string | undefined;
}

export function meta() {
  return [
    { title: "Household Management - Kimmy" },
    {
      name: "description",
      content: "Manage your household members and settings",
    },
  ];
}

export async function action({ request, context }: ActionFunctionArgs) {
  return withDatabaseAndSession(request, context, async (db, session) => {
    const formData = await request.formData();
    const action = formData.get("_action") as string;

    if (action === "seed-demo-data") {
      const result = await seedAllDemoData(db, {
        householdId: session.currentHouseholdId,
        userId: session.userId,
        visibleToMembers: [session.userId],
      });

      if (result.success) {
        return Response.json({
          success: true,
          message: result.message,
          recordTypes: result.recordTypes,
          trackers: result.trackers,
        });
      } else {
        return Response.json(
          {
            success: false,
            error: result.message,
          },
          { status: 500 }
        );
      }
    }

    return Response.json(
      { success: false, error: "Unknown action" },
      { status: 400 }
    );
  });
}

export async function loader({
  request,
  context,
}: {
  request: Request;
  context: any;
}) {
  // Check authentication first
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    throw redirect("/welcome");
  }

  const cookies = cookieHeader.split(";").reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      if (key && value) {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, string>
  );

  const sessionData = cookies["kimmy_auth_session"];
  if (!sessionData) {
    throw redirect("/welcome");
  }

  let session;
  try {
    session = JSON.parse(decodeURIComponent(sessionData));
  } catch (error) {
    throw redirect("/welcome");
  }

  // Check if user has a valid session with a household
  if (!session.currentHouseholdId) {
    throw redirect("/welcome");
  }

  try {
    const { householdId, householdMembers } = await loadHouseholdData(
      request,
      context.cloudflare?.env
    );

    // Verify the user is accessing their own household data
    if (householdId !== session.currentHouseholdId) {
      throw redirect("/welcome");
    }

    // Load the household invite code
    let inviteCode: string | undefined = undefined;
    if (householdId) {
      try {
        const household = await inviteCodeDb.getHouseholdById(
          context.cloudflare?.env,
          householdId
        );

        inviteCode = household?.inviteCode;
      } catch (error) {
        console.error("Failed to load invite code:", error);
        // Don't fail the entire request if invite code loading fails
      }
    }

    // Return household data if available, otherwise return null
    return {
      members: householdMembers || [],
      householdId: householdId || null,
      inviteCode,
    };
  } catch (error) {
    // If it's a redirect, re-throw it
    if (
      error instanceof Response &&
      error.status >= 300 &&
      error.status < 400
    ) {
      throw error;
    }
    // For other errors, return empty data
    return {
      members: [],
      householdId: null,
      inviteCode: undefined,
    };
  }
}

const Manage: React.FC = () => {
  const { session, isAuthenticated, isLoading } = useAuth();
  const {
    members: loaderMembers,
    householdId: loaderHouseholdId,
    inviteCode,
  } = useLoaderData<LoaderData>();

  const fetcher = useFetcher();
  const isSeeding = fetcher.state === "submitting";

  // Use data from loader instead of client-side fetching
  const householdMembers = loaderMembers || [];
  const currentHouseholdId = loaderHouseholdId;

  const handleSeedBasicData = () => {
    if (
      confirm(
        "This will create basic record types and trackers to get you started. Continue?"
      )
    ) {
      const formData = new FormData();
      formData.append("_action", "seed-demo-data");

      fetcher.submit(formData, {
        method: "post",
      });
    }
  };

  const handleMemberUpdated = () => {
    // Refresh handled by React Router revalidation
  };

  const handleMemberRemoved = () => {
    // Refresh handled by React Router revalidation
  };

  // Show loading while checking auth
  if (isLoading) {
    return <PageLoading message="Loading..." />;
  }

  // Redirect to welcome if not authenticated
  if (!isAuthenticated) {
    return null; // This will be handled by RequireAuth
  }

  if (!currentHouseholdId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold text-slate-200 mb-4">
            No Household Found
          </h2>
          <p className="text-slate-400 mb-6">
            You need to be part of a household to access this page.
          </p>
          <a
            href="/onboarding/create-account"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-md hover:from-emerald-600 hover:to-blue-600 transition-colors"
          >
            Create Account & Household
          </a>
        </div>
      </div>
    );
  }

  return (
    <RequireAuth requireHousehold={true}>
      <PageLayout>
        <PageHeader
          title="Household Management"
          subtitle="Manage your household members and settings"
        />
        {/* Basic Data Seeding */}
        <Card
          className="mb-6 bg-slate-800 border-slate-700"
          style={{ display: "none" }}
        >
          <CardHeader>
            <CardTitle className="text-lg text-slate-200">
              Quick Setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 mb-4">
              Get started quickly by creating some basic record types and
              templates.
            </p>
            <Button
              onClick={handleSeedBasicData}
              disabled={isSeeding}
              className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700"
            >
              {isSeeding ? (
                <>
                  <LoadingSpinner className="mr-2" />
                  Creating Demo Data...
                </>
              ) : (
                "Seed Basic Data"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <QuickActions
          currentHouseholdId={currentHouseholdId}
          isLoadingMembers={false}
          onRefresh={() => {}}
        />

        {/* Household member Management */}
        <HouseholdmemberList
          householdMembers={householdMembers}
          householdId={currentHouseholdId}
          onMemberUpdated={handleMemberUpdated}
          onMemberRemoved={handleMemberRemoved}
        />

        {/* Invite Code Management */}
        <div data-section="invite-code">
          <InviteCodeManager
            householdId={currentHouseholdId}
            currentInviteCode={inviteCode}
            onInviteCodeGenerated={newCode => {
              // Code update handled by component
            }}
          />
        </div>

        {/* Household Overview */}
        <HouseholdOverview householdMembers={householdMembers} />

        {/* Navigation Section */}
        <NavigationSection />
      </PageLayout>
    </RequireAuth>
  );
};

export default Manage;
