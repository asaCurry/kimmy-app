import type { Route } from "./+types/member.$memberId.category.$category";
import * as React from "react";
import { Link, redirect } from "react-router";
import { PageLayout } from "~/components/ui/layout";
import { Navigation } from "~/components/navigation";
import { RecordTypeCard } from "~/components/record-type-card";
import { AddCard } from "~/components/ui/interactive-card";
import { PageHeader } from "~/components/ui/layout";
import { userDb, recordTypeDb } from "~/lib/db";
import { RequireAuth, useAuth } from "~/contexts/auth-context";

export function meta({ params }: Route.MetaArgs) {
  const category = decodeURIComponent(params.category);
  return [
    { title: `Member - ${category} Records - Hey, Kimmy` },
    { name: "description", content: `Manage family member's ${category.toLowerCase()} records` },
  ];
}

export async function loader({ params, context }: Route.LoaderArgs) {
  try {
    const env = (context.cloudflare as any)?.env;
    
    if (!env?.DB) {
      throw new Response('Database not available', { status: 500 });
    }

    const memberId = params.memberId;
    const category = decodeURIComponent(params.category);
    
    if (!memberId) {
      throw new Response('Member ID required', { status: 400 });
    }

    // Get family ID from the authenticated user's session
    // For now, we'll return empty data and let the component handle it via auth context
    return { 
      member: null, 
      category, 
      recordTypes: [] 
    };
  } catch (error) {
    console.error('Category route loader error:', error);
    
    if (error instanceof Response || error instanceof Error) {
      throw error;
    }
    
    throw new Response('Failed to load category data', { status: 500 });
  }
}

const CategoryRecordTypes: React.FC<Route.ComponentProps> = ({ loaderData }) => {
  const { member, category, recordTypes } = loaderData;
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

  return (
    <RequireAuth requireHousehold={true}>
      <PageLayout>
        <Navigation
          currentView="record-types"
          member={currentMember}
          category={category}
        />
        
        <PageHeader
          title={`${currentMember.name} - ${category}`}
          subtitle="Choose a record type to create a new record"
        />

        <div className="grid gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2">
          {recordTypes.map((recordType) => (
            <Link 
              key={recordType.id} 
              to={`/member/${currentMember.id}/category/${encodeURIComponent(category)}/record/${recordType.id}`}
            >
              <RecordTypeCard 
                recordType={recordType} 
                onSelect={() => {}} 
              />
            </Link>
          ))}
          <AddCard 
            title="Add Record Type"
            description={`Create a new ${category.toLowerCase()} record type`}
          />
        </div>
      </PageLayout>
    </RequireAuth>
  );
};

export default CategoryRecordTypes;