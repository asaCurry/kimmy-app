import { useAuth } from "~/contexts/auth-context";
import { useLoaderData, redirect, useFetcher } from "react-router";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { RequireAuth } from "~/contexts/auth-context";
import { PageLoading } from "~/components/ui/loading";
import { NoHousehold } from "~/components/manage/no-household";
import { QuickActions } from "~/components/manage/quick-actions";
import { HouseholdOverview } from "~/components/manage/household-overview";
import { NavigationSection } from "~/components/manage/navigation-section";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { loadFamilyData } from "~/lib/loader-helpers";

interface FamilyMember {
  id: number;
  name: string;
  email: string;
  role: "admin" | "member";
  age?: number;
  relationshipToAdmin?: string;
}

interface LoaderData {
  members: FamilyMember[];
  familyId: string | null;
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
    const { familyId, familyMembers } = await loadFamilyData(
      request,
      context.cloudflare?.env
    );
    console.log("familyId", familyId);
    console.log("familyMembers", familyMembers);

    // Verify the user is accessing their own family data
    if (familyId !== session.currentHouseholdId) {
      throw redirect("/welcome");
    }

    // Return family data if available, otherwise return null
    return {
      members: familyMembers || [],
      familyId: familyId || null,
    };
  } catch (error) {
    console.log("❌ Error loading family data:", error);
    // If it's a redirect, re-throw it
    if (error instanceof Response && error.status >= 300 && error.status < 400) {
      throw error;
    }
    // For other errors, return empty data
    return {
      members: [],
      familyId: null,
    };
  }
}

const Manage: React.FC = () => {
  const { session, isAuthenticated, isLoading } = useAuth();
  const { members: loaderMembers, familyId: loaderFamilyId } =
    useLoaderData<LoaderData>();
  const fetcher = useFetcher();
  const isSeeding = fetcher.state === "submitting";

  // Use data from loader instead of client-side fetching
  const householdMembers = loaderMembers || [];
  const currentHouseholdId = loaderFamilyId;

  const handleSeedBasicData = () => {
    if (
      confirm(
        "This will create basic record types to get you started. Continue?"
      )
    ) {
      const formData = new FormData();
      formData.append("familyId", currentHouseholdId!);

      fetcher.submit(formData, {
        method: "post",
        action: "/api/seed-demo-data",
      });
    }
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
            href="/onboarding/create-household"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-md hover:from-emerald-600 hover:to-blue-600 transition-colors"
          >
            Create Household
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

        {/* Debug information */}
        <Card className="mb-4 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-sm">Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-1">
              <div>
                <strong>Current Household ID:</strong>{" "}
                {currentHouseholdId || "null"}
              </div>
              <div>
                <strong>Session:</strong> {session ? "Available" : "None"}
              </div>
              <div>
                <strong>Members Count:</strong> {householdMembers.length}
              </div>
              <div>
                <strong>Loader Family ID:</strong> {loaderFamilyId || "null"}
              </div>
              <div>
                <strong>URL:</strong>{" "}
                {typeof window !== "undefined"
                  ? window.location.href
                  : "Server side"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Data Seeding */}
        <Card className="mb-4 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-700/50">
          <CardHeader>
            <CardTitle className="text-blue-200">
              🎯 Get Started with Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-blue-100 text-sm">
                Create basic record types to get you started with the dynamic
                record system.
              </p>
              <Button
                onClick={handleSeedBasicData}
                disabled={isSeeding}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {isSeeding ? (
                  <>
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                    Creating Basic Data...
                  </>
                ) : (
                  "Create Basic Record Types"
                )}
              </Button>

              {fetcher.data?.success && (
                <div className="p-3 bg-green-900/20 border border-green-700 rounded-md">
                  <p className="text-green-400 text-sm">
                    {fetcher.data.message}
                  </p>
                </div>
              )}

              {fetcher.data?.error && (
                <div className="p-3 bg-red-900/20 border border-red-700 rounded-md">
                  <p className="text-red-400 text-sm">{fetcher.data.error}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <QuickActions
            currentHouseholdId={currentHouseholdId}
            isLoadingMembers={false}
            onRefresh={() => window.location.reload()}
          />

          <HouseholdOverview householdMembers={householdMembers} />

          <NavigationSection />
        </div>
      </PageLayout>
    </RequireAuth>
  );
};

export default Manage;
