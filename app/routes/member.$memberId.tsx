import type { Route } from "./+types/member.$memberId";
import * as React from "react";
import { Link, redirect } from "react-router";
import { PageLayout } from "~/components/ui/layout";
import { Navigation } from "~/components/navigation";
import { CategoryCard } from "~/components/category-card";
import { AddCard } from "~/components/ui/interactive-card";
import { PageHeader } from "~/components/ui/layout";
import { RequireAuth, useAuth } from "~/contexts/auth-context";
import { userDb, recordTypeDb } from "~/lib/db";
import type { FamilyMember, RecordType } from "~/lib/utils";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Member Records - Hey, Kimmy` },
    { name: "description", content: `Manage family member's records and notes` },
  ];
}

export async function loader({ params, context }: Route.LoaderArgs) {
  try {
    const env = (context.cloudflare as any)?.env;
    
    if (!env?.DB) {
      throw new Response('Database not available', { status: 500 });
    }

    const memberId = params.memberId;
    if (!memberId) {
      throw new Response('Member ID required', { status: 400 });
    }

    // Get family ID from the authenticated user's session
    // For now, we'll return empty data and let the component handle it via auth context
    return { 
      member: null, 
      familyMembers: [], 
      familyId: null, 
      recordTypesByCategory: {}, 
      categories: [] 
    };
  } catch (error) {
    console.error('Member route loader error:', error);
    
    if (error instanceof Response) {
      throw error;
    }
    
    // Return empty data on error
    return { 
      member: null, 
      familyMembers: [], 
      familyId: null, 
      recordTypesByCategory: {}, 
      categories: [] 
    };
  }
}

const MemberCategories: React.FC<Route.ComponentProps> = ({ loaderData }) => {
  const { member, familyMembers, recordTypesByCategory, categories } = loaderData;
  const { session } = useAuth();
  
  // Get the current family ID from the session
  const currentFamilyId = session?.currentFamilyId;
  
  if (!currentFamilyId) {
    return (
      <RequireAuth requireHousehold={true}>
        <PageLayout>
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-slate-200 mb-4">No Household Found</h2>
            <p className="text-slate-400 mb-6">You need to create or join a household to view member records.</p>
            <Link to="/onboarding/create-household">
              <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-md hover:from-blue-600 hover:to-purple-700">
                Create Household
              </button>
            </Link>
          </div>
        </PageLayout>
      </RequireAuth>
    );
  }
  
  // Create a basic member profile from session data if no member data from loader
  const currentMember = member || {
    id: session.userId,
    name: session.name,
    email: session.email,
    role: session.role
  };
  
  // Use default categories if none provided from loader
  const defaultCategories = ['Health', 'Activities', 'Personal'];
  const currentCategories = categories.length > 0 ? categories : defaultCategories;

  return (
    <RequireAuth requireHousehold={true}>
      <PageLayout>
        <Navigation
          currentView="categories"
          member={currentMember}
        />
        
        <PageHeader
          title={`${currentMember.name}'s Records`}
          subtitle="Choose a category to view or add records"
        />

      <div className="grid gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {currentCategories.map((category) => {
          const categoryRecordTypes = (recordTypesByCategory as any)[category] || [];
          return (
            <Link key={category} to={`/member/${currentMember.id}/category/${encodeURIComponent(category)}`}>
              <CategoryCard 
                category={category} 
                recordCount={categoryRecordTypes.length}
                onSelect={() => {}} 
              />
            </Link>
          );
        })}
        <AddCard 
          title="Add Category"
          description="Create a new record type category"
        />
      </div>
    </PageLayout>
    </RequireAuth>
  );
};

export default MemberCategories;