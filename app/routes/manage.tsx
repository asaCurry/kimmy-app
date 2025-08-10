import type { Route } from "./+types/manage";
import * as React from "react";
import { Link, useLoaderData, redirect } from "react-router";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { IconCard } from "~/components/ui/interactive-card";
import { UserPlus, Users, Settings, Key, ArrowRight } from "lucide-react";
import { RequireAuth, useAuth } from "~/contexts/auth-context";
import { userDb } from "~/lib/db";
import { recordTypeDb } from "~/lib/db";
import { sessionStorage } from "~/lib/auth-db";
import type { FamilyMember } from "~/lib/utils";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Manage Household - Hey, Kimmy" },
    { name: "description", content: "Manage your household members and settings" },
  ];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  try {
    const env = (context.cloudflare as any)?.env;
    
    if (!env?.DB) {
      throw new Response('Database not available', { status: 500 });
    }

    // Get the current session from the request headers or cookies
    // For now, we'll rely on the client-side auth context
    // In a real implementation, you'd validate the session token server-side
    
    // Return empty data - the component will use the auth context
    return { 
      members: [], 
      familyId: null,
      recordTypes: []
    };
  } catch (error) {
    console.error('Manage route loader error:', error);
    
    if (error instanceof Response) {
      throw error;
    }
    
    // Return empty data on error
    return { members: [], familyId: null, recordTypes: [] };
  }
}

const Manage: React.FC<Route.ComponentProps> = () => {
  const { session, isAuthenticated, isLoading } = useAuth();
  const { members: loaderMembers, familyId: loaderFamilyId } = useLoaderData<typeof loader>();
  const [householdMembers, setHouseholdMembers] = React.useState<any[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = React.useState(false);
  
  // Use the session data to get the real family members
  const currentFamilyId = session?.currentFamilyId;

  // Fetch family members when the component mounts or family ID changes
  React.useEffect(() => {
    const fetchMembers = async () => {
      if (!currentFamilyId) return;
      
      setIsLoadingMembers(true);
      try {
        // For now, we'll use a simple fetch to get the data
        // In a real implementation, you'd call the database directly
        const response = await fetch(`/api/family/${currentFamilyId}/members`);
        if (response.ok) {
          const data = await response.json() as { members?: any[] };
          let members = data.members || [];
          console.log(members);
          // If no members found, ensure the current user is at least one member
          if (members.length === 0 && session) {
            members = [{
              id: session.userId,
              name: session.name,
              email: session.email,
              role: session.role,
              familyId: currentFamilyId,
              relationshipToAdmin: 'self',
              age: null,
              createdAt: new Date().toISOString()
            }];
          }
          
          // Transform to FamilyMember type
          const transformedMembers: FamilyMember[] = members.map(m => ({
            id: m.id,
            name: m.name,
            email: m.email,
            role: (m.role as 'admin' | 'member') || 'member'
          }));
          
          setHouseholdMembers(transformedMembers);
        } else {
          // If the API doesn't exist yet, create a basic user profile
          if (session) {
            const basicUser: FamilyMember = {
              id: session.userId,
              name: session.name,
              email: session.email,
              role: (session.role as 'admin' | 'member') || 'member'
            };
            setHouseholdMembers([basicUser]);
          } else {
            setHouseholdMembers([]);
          }
        }
      } catch (error) {
        console.error('Error fetching family members:', error);
        // On error, create a basic user profile if we have session data
        if (session) {
          const basicUser: FamilyMember = {
            id: session.userId,
            name: session.name,
            email: session.email,
            role: (session.role as 'admin' | 'member') || 'member'
          };
          setHouseholdMembers([basicUser]);
        } else {
          setHouseholdMembers([]);
        }
      } finally {
        setIsLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [currentFamilyId, session]);

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

  // Redirect to welcome if not authenticated
  if (!isAuthenticated) {
    return null; // This will be handled by RequireAuth
  }
  
  if (!currentFamilyId) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <div className="text-slate-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Household Found</h3>
          <p className="text-slate-400 mb-6">
            You need to create or join a household to manage members.
          </p>
          <Link to="/onboarding/create-household">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Create Household
            </Button>
          </Link>
        </div>
      </PageLayout>
    );
  }

  // Show loading while fetching members
  if (isLoadingMembers) {
    return (
      <PageLayout>
        <PageHeader
          title="Household Management"
          subtitle="Manage your household members and settings"
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-300">Loading family members...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  const adminMembers = householdMembers.filter(m => m.role === 'admin');
  const regularMembers = householdMembers.filter(m => m.role === 'member' && !m.age); // Adults without age
  const children = householdMembers.filter(m => m.role === 'member' && m.age); // Members with age are children

  return (
    <RequireAuth requireHousehold={true}>
      <PageLayout>
        <PageHeader
          title="Household Management"
          subtitle="Manage your household members and settings"
        />

      <div className="space-y-8">
        {/* Quick Actions */}
        <section>
          <h2 className="text-xl font-semibold text-slate-200 mb-4">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link to="/manage/add-member">
              <IconCard
                icon={
                  <div className="text-2xl bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                    <UserPlus className="h-6 w-6 text-white" />
                  </div>
                }
                title="Add Member"
                description="Add a new family member or child"
                showChevron={true}
                className="hover:scale-105 transition-transform duration-200"
              />
            </Link>

            <IconCard
              icon={
                <div className="text-2xl bg-gradient-to-r from-emerald-500 to-blue-500 p-2 rounded-lg">
                  <Key className="h-6 w-6 text-white" />
                </div>
              }
              title="Invite Code"
              description="Share your household invite code"
              showChevron={true}
              className="hover:scale-105 transition-transform duration-200"
            />

            <IconCard
              icon={
                <div className="text-2xl bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg">
                  <Settings className="h-6 w-6 text-white" />
                </div>
              }
              title="Settings"
              description="Manage household settings"
              showChevron={true}
              className="hover:scale-105 transition-transform duration-200"
            />
          </div>
        </section>

        {/* Household Overview */}
        <section>
          <h2 className="text-xl font-semibold text-slate-200 mb-4">Household Overview</h2>
          
          {householdMembers.length === 0 ? (
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
              <Link to="/manage/add-member">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105">
                  Add Family Member
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Administrators */}
              <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-100">
                    <Users className="h-5 w-5 text-blue-400" />
                    Administrators
                  </CardTitle>
                  <CardDescription>
                    {adminMembers.length} admin{adminMembers.length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {adminMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-200">{member.name}</p>
                          <p className="text-sm text-slate-400">{member.email}</p>
                        </div>
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                          ADMIN
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Members */}
              <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-100">
                    <Users className="h-5 w-5 text-emerald-400" />
                    Members
                  </CardTitle>
                  <CardDescription>
                    {regularMembers.length} member{regularMembers.length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {regularMembers.length > 0 ? (
                      regularMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                          <div>
                            <p className="font-medium text-slate-200">{member.name}</p>
                            <p className="text-sm text-slate-400">{member.email}</p>
                          </div>
                          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">
                            MEMBER
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 text-center py-4">
                        No adult members yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Children */}
              <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-100">
                    <Users className="h-5 w-5 text-purple-400" />
                    Children
                  </CardTitle>
                  <CardDescription>
                    {children.length} child{children.length !== 1 ? 'ren' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {children.length > 0 ? (
                      children.map((child) => (
                        <div key={child.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                          <div>
                            <p className="font-medium text-slate-200">{child.name}</p>
                            <p className="text-sm text-slate-400">
                              Age {child.age} • {child.relationshipToAdmin}
                            </p>
                          </div>
                          <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                            CHILD
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 text-center py-4">
                        No children added yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </section>

        {/* Navigation */}
        <section className="border-t border-slate-700 pt-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-slate-200">Ready to add records?</h3>
              <p className="text-slate-400">Start managing your family's information</p>
            </div>
            <Link to="/">
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                Go to Records
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </PageLayout>
    </RequireAuth>
  );
};

export default Manage;