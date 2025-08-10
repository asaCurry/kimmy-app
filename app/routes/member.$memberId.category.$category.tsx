import type { Route } from "./+types/member.$memberId.category.$category";
import * as React from "react";
import { Link, useLoaderData, redirect } from "react-router";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { RequireAuth, useAuth } from "~/contexts/auth-context";
import { Navigation } from "~/components/navigation";
import { RecordTypeCard } from "~/components/record-type-card";
import { AddCard } from "~/components/ui/interactive-card";
import { loadFamilyDataWithMember } from "~/lib/loader-helpers";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `${params.category} Records - Kimmy` },
    { name: "description", content: `View and manage ${params.category.toLowerCase()} records` },
  ];
}

export async function loader({ params, request, context }: Route.LoaderArgs) {
  try {
    const env = (context as any).cloudflare?.env;
    
    if (!env?.DB) {
      throw new Response('Database not available', { status: 500 });
    }

    const { memberId, category } = params;
    
    if (!memberId) {
      throw new Response('Member ID required', { status: 400 });
    }

    // Load family data from URL params
    const { familyId, familyMembers, currentMember } = await loadFamilyDataWithMember(
      request, 
      env,
      memberId
    );
    
    // If no family data found, redirect to welcome
    if (!familyId) {
      console.log('❌ No family data found, redirecting to welcome');
      throw redirect('/welcome');
    }

    // For now, return empty record types - this can be expanded later
    const recordTypes: any[] = [];
    
    return { 
      member: currentMember, 
      category, 
      recordTypes,
      familyId,
      familyMembers
    };
  } catch (error) {
    console.error('Category route loader error:', error);
    
    if (error instanceof Response || error instanceof Error) {
      throw error;
    }
    
    throw new Response('Failed to load category data', { status: 500 });
  }
}

const CategoryRecordTypes: React.FC<Route.ComponentProps> = ({ loaderData, params }) => {
  const { member, category, recordTypes, familyId, familyMembers } = loaderData;
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