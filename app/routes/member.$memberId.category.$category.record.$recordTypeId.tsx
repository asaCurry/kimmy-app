import type { Route } from "./+types/member.$memberId.category.$category.record.$recordTypeId";
import * as React from "react";
import { useNavigate, useLoaderData, redirect } from "react-router";
import { PageLayout } from "~/components/ui/layout";
import { RequireAuth, useAuth } from "~/contexts/auth-context";
import { Navigation } from "~/components/navigation";
import { DynamicRecordForm } from "~/components/dynamic-record-form";
import { loadFamilyDataWithMember } from "~/lib/loader-helpers";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Create ${params.category} Record - Kimmy` },
    { name: "description", content: `Create a new ${params.category.toLowerCase()} record` },
  ];
}

export async function loader({ params, request, context }: Route.LoaderArgs) {
  try {
    const env = (context as any).cloudflare?.env;
    
    if (!env?.DB) {
      throw new Response('Database not available', { status: 500 });
    }

    const { memberId, category, recordTypeId } = params;
    
    if (!memberId || !recordTypeId) {
      throw new Response('Member ID and Record Type ID required', { status: 400 });
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

    // For now, return empty record type - this can be expanded later
    const recordType = null;
    
    return { 
      member: currentMember, 
      category, 
      recordType,
      familyId,
      familyMembers
    };
  } catch (error) {
    console.error('Record form route loader error:', error);
    
    if (error instanceof Response || error instanceof Error) {
      throw error;
    }
    
    throw new Response('Failed to load record form data', { status: 500 });
  }
}

const RecordForm: React.FC<Route.ComponentProps> = ({ loaderData, params }) => {
  const { member, category, recordType, familyId, familyMembers } = loaderData;
  const { session } = useAuth();
  const navigate = useNavigate();
  
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
  
  // Create a basic record type if none provided from loader
  const currentRecordType = recordType || {
    id: 1,
    name: 'Basic Record',
    description: 'A basic record type',
    icon: 'document',
    color: 'blue',
    fields: []
  };

  const handleBack = () => {
    navigate(`/member/${currentMember.id}/category/${encodeURIComponent(category)}`);
  };

  return (
    <RequireAuth requireHousehold={true}>
      <PageLayout maxWidth="2xl">
        <Navigation
          currentView="form"
          member={currentMember}
          category={category}
          recordType={currentRecordType}
        />
        
        <DynamicRecordForm 
          member={currentMember} 
          recordType={currentRecordType} 
          onBack={handleBack} 
        />
      </PageLayout>
    </RequireAuth>
  );
};

export default RecordForm;