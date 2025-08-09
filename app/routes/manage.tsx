import type { Route } from "./+types/manage";
import * as React from "react";
import { Link } from "react-router";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { IconCard } from "~/components/ui/interactive-card";
import { UserPlus, Users, Settings, Key, ArrowRight, LogOut } from "lucide-react";
import { RequireAuth, useAuth } from "~/contexts/auth-context";
import { mockHouseholdMembersWithDetails } from "~/lib/mock-data";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Manage Household - Kimmy App" },
    { name: "description", content: "Manage your household members and settings" },
  ];
}

const Manage: React.FC<Route.ComponentProps> = () => {
  const { session, logout } = useAuth();
  
  if (!session || !session.currentHouseholdId) {
    return null; // This should be handled by RequireAuth
  }
  
  const currentHousehold = session.households.find(h => h.id === session.currentHouseholdId);
  const householdMembers = mockHouseholdMembersWithDetails.filter(
    member => member.householdId === session.currentHouseholdId
  );

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const adminMembers = householdMembers.filter(m => m.role === 'ADMIN');
  const regularMembers = householdMembers.filter(m => m.role === 'MEMBER');
  const children = householdMembers.filter(m => m.role === 'CHILD');

  return (
    <RequireAuth requireHousehold={true}>
      <PageLayout>
        <div className="flex justify-between items-start mb-6">
          <PageHeader
            title="Household Management"
            subtitle={`Manage ${currentHousehold?.name || 'your household'}`}
          />
          <Button
            variant="outline"
            onClick={handleLogout}
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

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
            />
          </div>
        </section>

        {/* Household Overview */}
        <section>
          <h2 className="text-xl font-semibold text-slate-200 mb-4">Household Overview</h2>
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
                        <p className="font-medium text-slate-200">{member.fullName}</p>
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
                          <p className="font-medium text-slate-200">{member.fullName}</p>
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
                          <p className="font-medium text-slate-200">{child.fullName}</p>
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