import type { Route } from "./+types/index";
import * as React from "react";
import { useNavigate, useLoaderData, redirect } from "react-router";
import { PageLayout } from "~/components/ui/layout";
import { useAuth } from "~/contexts/auth-context";
import { MemberCard } from "~/components/member-card";
import type { FamilyMember } from "~/lib/utils";
import { QuickActionButton } from "~/components/ui/quick-action-button";
import { loadFamilyData } from "~/lib/loader-helpers";
import { extractEnv, parseCookies } from "~/lib/utils";

export async function loader({ request, context }: Route.LoaderArgs) {
  try {
    // Check if user has a valid session first
    const cookieHeader = request.headers.get('cookie');
    let sessionData = null;
    
    if (cookieHeader) {
      const cookies = parseCookies(cookieHeader);
      const sessionData = cookies['kimmy_auth_session'];
      
      if (sessionData) {
        try {
          const session = JSON.parse(decodeURIComponent(sessionData));
          if (session.currentHouseholdId) {
            // User has a family, load family data
            const env = extractEnv(context);
            if (env) {
              const familyData = await loadFamilyData(request, env);
              return { familyData };
            }
          }
        } catch (error) {
          // Invalid session data, continue to redirect
        }
      }
    }
    
    // No valid session or family, redirect to welcome
    return redirect('/welcome');
  } catch (error) {
    console.error('Loader error:', error);
    return redirect('/welcome');
  }
}

export default function Index() {
  const { familyData } = useLoaderData<typeof loader>();
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  // Handle case where there are no family members
  if (!familyData?.familyMembers || familyData.familyMembers.length === 0) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-slate-100">
              Welcome to Your Family Hub
            </h1>
            <p className="text-slate-300 max-w-md">
              It looks like you don't have any family members yet. Let's get started by adding some!
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/manage/add-member')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Add Family Member
            </button>
            
            <button
              onClick={() => navigate('/onboarding/create-household')}
              className="px-6 py-3 border border-slate-600 hover:bg-slate-800 text-slate-300 rounded-lg font-medium transition-colors"
            >
              Create Household
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">
              Family Hub
            </h1>
            <p className="text-slate-400">
              Welcome back, {session?.name || 'Family Member'}!
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/manage/add-member')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Add Member
            </button>
            
            <button
              onClick={logout}
              className="px-4 py-2 border border-slate-600 hover:bg-slate-800 text-slate-300 rounded-lg font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {familyData.familyMembers.map((member) => (
             <MemberCard
               key={member.id}
               member={{
                 ...member,
                 role: member.role as 'admin' | 'member'
               }}
               onSelect={() => navigate(`/member/${member.id}`)}
             />
           ))}
         </div>
      </div>
    </PageLayout>
  );
}
