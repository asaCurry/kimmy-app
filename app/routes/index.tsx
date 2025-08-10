import type { Route } from "./+types/index";
import * as React from "react";
import { useNavigate, useLoaderData } from "react-router";
import { PageLayout } from "~/components/ui/layout";
import { RequireAuth, useAuth } from "~/contexts/auth-context";
import { useCurrentHouseholdMembers } from "~/contexts/household-context";
import { MemberCard } from "~/components/member-card";
import type { FamilyMember } from "~/lib/utils";

export async function loader({ context }: Route.LoaderArgs) {
  // Access the D1 database from the Cloudflare context
  const env = (context.cloudflare as any)?.env;
  
  if (!env?.DB) {
    throw new Error('Database not available');
  }

  // Check if user is authenticated via session storage
  // Note: In a real app, you'd validate the session token here
  // For now, we'll rely on the client-side auth context
  
  return { 
    familyMembers: [],
    familyId: null
  };
}

export default function Dashboard() {
  const { familyMembers, familyId } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const { session, isAuthenticated, isLoading, logout } = useAuth();
  
  // Redirect to welcome if not authenticated
  if (!isLoading && !isAuthenticated) {
    navigate('/welcome', { replace: true });
    return null;
  }

  // Show loading while checking auth
  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-300">Loading...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Use the family members from the loader data or session
  // If no members found, ensure the current user is at least one member
  let currentFamilyMembers = useCurrentHouseholdMembers(session?.currentFamilyId || familyId || undefined);
  console.log(session?.currentFamilyId, familyId, undefined);
  // If no family members found but we have a session, create a basic user profile
  if (currentFamilyMembers.length === 0 && session) {
    currentFamilyMembers = [{
      id: session.userId,
      name: session.name,
      email: session.email,
      hashedPassword: null, // No password for basic profile
      familyId: session.currentFamilyId,
      role: session.role,
      age: null,
      relationshipToAdmin: 'self',
      createdAt: new Date().toISOString()
    }];
  }

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Home, {session?.name || 'Family'}!</h1>
            <p className="text-slate-300">
              Manage your family's records and stay organized together.
            </p>
          </div>
          <button
            onClick={async () => {
              await logout();
              navigate('/welcome');
            }}
            className="text-slate-400 hover:text-slate-300 transition-colors px-3 py-2 rounded-lg hover:bg-slate-800"
          >
            Sign Out
          </button>
        </div>

        {!session?.currentFamilyId ? (
          <div className="text-center py-12">
            <div className="text-slate-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Welcome to Your New Household!</h3>
            <p className="text-slate-400 mb-6">
              You're all set up! Now let's create your household and add your first family member.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/onboarding/create-household")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors mr-3"
              >
                Create Household
              </button>
              <button
                onClick={() => navigate("/manage/add-member")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Add Family Member
              </button>
            </div>
          </div>
        ) : currentFamilyMembers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-slate-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Family Members Yet</h3>
            <p className="text-slate-400 mb-6">
              Get started by adding your first family member.
            </p>
            <button
              onClick={() => navigate("/manage/add-member")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Add Family Member
            </button>
          </div>
        ) : (
          <>
            {/* Quick Actions Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">Quick Actions</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <button
                  onClick={() => navigate("/manage/add-member")}
                  className="p-6 bg-gradient-to-br from-blue-1200 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg border border-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/25 text-left"
                >
                  <div className="text-2xl mb-3">👥</div>
                  <h3 className="font-semibold text-white mb-2">Add Family Member</h3>
                  <p className="text-sm text-blue-200">Invite new members to your household</p>
                </button>

                <button
                  onClick={() => navigate("/records/create")}
                  className="p-6 bg-gradient-to-br from-emerald-1200 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 rounded-lg border border-emerald-500/20 transition-all hover:shadow-lg hover:shadow-emerald-500/25 text-left"
                >
                  <div className="text-2xl mb-3">📝</div>
                  <h3 className="font-semibold text-white mb-2">Create Record</h3>
                  <p className="text-sm text-emerald-200">Log important information for your family</p>
                </button>

                <button
                  onClick={() => navigate("/records")}
                  className="p-6 bg-gradient-to-br from-purple-1200 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-lg border border-purple-500/20 transition-all hover:shadow-lg hover:shadow-purple-500/25 text-left"
                >
                  <div className="text-2xl mb-3">📋</div>
                  <h3 className="font-semibold text-white mb-2">View Records</h3>
                  <p className="text-sm text-purple-200">Browse and manage existing records</p>
                </button>

                <button
                  onClick={() => navigate("/manage")}
                  className="p-6 bg-gradient-to-br from-orange-1200 to-orange-700 hover:from-orange-700 hover:to-orange-800 rounded-lg border border-orange-500/20 transition-all hover:shadow-lg hover:shadow-orange-500/25 text-left"
                >
                  <div className="text-2xl mb-3">⚙️</div>
                  <h3 className="font-semibold text-white mb-2">Manage Household</h3>
                  <p className="text-sm text-orange-200">Manage members and household settings</p>
                </button>

                <button
                  onClick={() => navigate("/quick-note")}
                  className="p-6 bg-gradient-to-br from-pink-1200 to-pink-700 hover:from-pink-700 hover:to-pink-800 rounded-lg border border-pink-500/20 transition-all hover:shadow-lg hover:shadow-pink-500/25 text-left"
                >
                  <div className="text-2xl mb-3">💬</div>
                  <h3 className="font-semibold text-white mb-2">Quick Note</h3>
                  <p className="text-sm text-pink-200">Take a quick note for your family</p>
                </button>
              </div>
            </div>

            {/* Family Members Section */}
            <div>
              <h2 className="text-xl font-semibold text-slate-1200 mb-4">Family Members</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentFamilyMembers.map((member) => (
                  <MemberCard
                    key={member.id}
                    member={{
                      id: member.id,
                      name: member.name,
                      email: member.email || '',
                      role: (member.role === 'admin' ? 'admin' : 'member') as 'admin' | 'member',
                    }}
                    onSelect={() => navigate(`/member/${member.id}`)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
}
