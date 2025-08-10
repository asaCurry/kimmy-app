import type { Route } from "./+types/member.$memberId";
import * as React from "react";
import { Link, useLoaderData, redirect } from "react-router";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { RequireAuth, useAuth } from "~/contexts/auth-context";
import { Navigation } from "~/components/navigation";
import { CategoryCard } from "~/components/category-card";
import { loadFamilyDataWithMember } from "~/lib/loader-helpers";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `${params.memberId ? params.memberId + "'s" : "Member"} Records - Kimmy` },
    { name: "description", content: "View and manage family member records" },
  ];
}

export async function loader({ params, request, context }: Route.LoaderArgs) {
  const { familyId, familyMembers, currentMember } = await loadFamilyDataWithMember(
    request, 
    (context as any).cloudflare?.env,
    params.memberId
  );
  
  // If no family data found, redirect to welcome
  if (!familyId) {
    console.log('❌ No family data found, redirecting to welcome');
    throw redirect('/welcome');
  }
  
  return { 
    member: currentMember, 
    familyMembers, 
    familyId, 
    recordTypesByCategory: {}, 
    categories: [] 
  };
}

const MemberCategories: React.FC<Route.ComponentProps> = ({ loaderData }) => {
  const { member, familyMembers, recordTypesByCategory, categories } = loaderData;
  const { session } = useAuth();
  
  // Create a basic member profile from session data if no member data from loader
  const currentMember = member || (session ? {
    id: session.userId,
    name: session.name,
    email: session.email,
    role: session.role
  } : null);
  
  // If no session and no member, show error
  if (!currentMember) {
    return (
      <RequireAuth requireHousehold={true}>
        <PageLayout>
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-slate-200 mb-4">No Member Found</h2>
            <p className="text-slate-400 mb-6">Unable to load member information.</p>
          </div>
        </PageLayout>
      </RequireAuth>
    );
  }
  
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
          
          {/* Simple add category button instead of AddCard component */}
          <button className="p-6 border-2 border-dashed border-slate-600 rounded-lg hover:border-slate-500 hover:bg-slate-800 transition-colors group">
            <div className="text-center">
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">➕</div>
              <div className="text-slate-400 group-hover:text-slate-300">Add Category</div>
            </div>
          </button>
        </div>
      </PageLayout>
    </RequireAuth>
  );
};

export default MemberCategories;