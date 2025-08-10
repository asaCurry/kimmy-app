import type { Route } from "./+types/member.$memberId.category.$category.record.$recordTypeId";
import * as React from "react";
import { redirect, useNavigate, Link } from "react-router";
import { PageLayout } from "~/components/ui/layout";
import { Navigation } from "~/components/navigation";
import { DynamicRecordForm } from "~/components/dynamic-record-form";
import { userDb, recordTypeDb } from "~/lib/db";
import { RequireAuth, useAuth } from "~/contexts/auth-context";

export function meta({ params }: Route.MetaArgs) {
  const category = decodeURIComponent(params.category);
  return [
    { title: `New Record for Member - Hey, Kimmy` },
    { name: "description", content: `Create a new record for family member` },
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
    const recordTypeId = params.recordTypeId;
    
    if (!memberId || !recordTypeId) {
      throw new Response('Member ID and Record Type ID required', { status: 400 });
    }

    // Get family ID from the authenticated user's session
    // For now, we'll return empty data and let the component handle it via auth context
    return { 
      member: null, 
      category, 
      recordType: null 
    };
  } catch (error) {
    console.error('Record form route loader error:', error);
    
    if (error instanceof Response || error instanceof Error) {
      throw error;
    }
    
    throw new Response('Failed to load record form data', { status: 500 });
  }
}

const RecordForm: React.FC<Route.ComponentProps> = ({ loaderData }) => {
  const { member, category, recordType } = loaderData;
  const { session } = useAuth();
  const navigate = useNavigate();
  
  // Get the current family ID from the session
  const currentFamilyId = session?.currentFamilyId;
  
  if (!currentFamilyId) {
    return (
      <RequireAuth requireHousehold={true}>
        <PageLayout>
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-slate-200 mb-4">No Household Found</h2>
            <p className="text-slate-400 mb-6">You need to create or join a household to create records.</p>
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