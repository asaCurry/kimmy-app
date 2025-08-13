import type { Route } from "./+types/index";
import * as React from "react";
import { useNavigate, useLoaderData, redirect } from "react-router";
import { PageLayout } from "~/components/ui/layout";
import { useAuth, RequireAuth } from "~/contexts/auth-context";
import { MemberCard } from "~/components/member-card";
import type { Householdmember } from "~/lib/utils";
import { QuickActionButton } from "~/components/ui/quick-action-button";

import { extractEnv, parseCookies } from "~/lib/utils";
import { getDatabase } from "~/lib/db-utils";
import { records, recordTypes } from "~/db/schema";
import { eq, desc } from "drizzle-orm";
import { RecentRecordsList } from "~/components/recent-records-list";
import { RecordManagementProvider } from "~/contexts/record-management-context";
import { RecordDrawer } from "~/components/ui/record-drawer";

export async function loader({ request, context }: Route.LoaderArgs) {
  try {
    // Check if user has a valid session first
    const cookieHeader = request.headers.get("cookie");

    if (cookieHeader) {
      const cookies = parseCookies(cookieHeader);
      const sessionData = cookies["kimmy_auth_session"];

      if (sessionData) {
        try {
          const session = JSON.parse(decodeURIComponent(sessionData));
          if (session.currentHouseholdId) {
            // User has a valid session with a household, allow access
            // Data will be loaded in the component after authentication is confirmed
            return { hasValidSession: true };
          }
        } catch (error) {
          // Invalid session data, continue to redirect
        }
      }
    }

    // No valid session or household, redirect to welcome
    return redirect("/welcome");
  } catch (error) {
    console.error("Loader error:", error);
    return redirect("/welcome");
  }
}

// Component that loads data after authentication is confirmed
function AuthenticatedHouseholdHub() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [householdData, setHouseholdData] = React.useState<any>(null);
  const [recentRecords, setRecentRecords] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Load household data after authentication is confirmed
  React.useEffect(() => {
    async function loadData() {
      try {
        // Get the session data to access household ID
        const cookieHeader = document.cookie;
        const cookies = parseCookies(cookieHeader);
        const sessionData = cookies["kimmy_auth_session"];
        
        if (sessionData) {
          const session = JSON.parse(decodeURIComponent(sessionData));
          if (session.currentHouseholdId) {
            // For now, we'll redirect to a route that can properly load the data
            // This ensures no data is loaded before authentication
            window.location.href = `/member/${session.currentHouseholdId}`;
            return;
          }
        }
        
        // If we get here, redirect to welcome
        window.location.href = "/welcome";
      } catch (error) {
        console.error("Failed to load household data:", error);
        window.location.href = "/welcome";
      }
    }

    loadData();
  }, []);

  return (
    <PageLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Redirecting to household dashboard...</p>
        </div>
      </div>
    </PageLayout>
  );
}

export default function Index() {
  const { hasValidSession } = useLoaderData<typeof loader>();

  // If no valid session, this should have redirected in the loader
  if (!hasValidSession) {
    return null;
  }

  return (
    <RequireAuth requireHousehold={true}>
      <AuthenticatedHouseholdHub />
    </RequireAuth>
  );
}
