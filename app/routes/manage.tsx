import { useAuth } from "~/contexts/auth-context";
import { useLoaderData, redirect } from "react-router";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { RequireAuth } from "~/contexts/auth-context";
import { PageLoading } from "~/components/ui/loading";
import { NoHousehold } from "~/components/manage/no-household";
import { QuickActions } from "~/components/manage/quick-actions";
import { HouseholdOverview } from "~/components/manage/household-overview";
import { NavigationSection } from "~/components/manage/navigation-section";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { loadFamilyData } from "~/lib/loader-helpers";

interface FamilyMember {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'member';
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
    { name: "description", content: "Manage your household members and settings" },
  ];
}

export async function loader({ request, context }: { request: Request; context: any }) {
  try {
    const { familyId, familyMembers } = await loadFamilyData(request, context.cloudflare?.env);
    console.log('familyId', familyId);
    console.log('familyMembers', familyMembers);
    
    // Return family data if available, otherwise return null
    return { 
      members: familyMembers || [], 
      familyId: familyId || null
    };
  } catch (error) {
    console.log('❌ Error loading family data:', error);
    // Return empty data instead of redirecting
    return { 
      members: [], 
      familyId: null
    };
  }
}

const Manage: React.FC = () => {
  const { session, isAuthenticated, isLoading } = useAuth();
  const { members: loaderMembers, familyId: loaderFamilyId } = useLoaderData<LoaderData>();
  
  // Use data from loader instead of client-side fetching
  const householdMembers = loaderMembers || [];
  const currentHouseholdId = loaderFamilyId;

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
          <h2 className="text-2xl font-bold text-slate-200 mb-4">No Household Found</h2>
          <p className="text-slate-400 mb-6">You need to be part of a household to access this page.</p>
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
              <div><strong>Current Household ID:</strong> {currentHouseholdId || 'null'}</div>
              <div><strong>Session:</strong> {session ? 'Available' : 'None'}</div>
              <div><strong>Members Count:</strong> {householdMembers.length}</div>
              <div><strong>Loader Family ID:</strong> {loaderFamilyId || 'null'}</div>
              <div><strong>URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Server side'}</div>
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