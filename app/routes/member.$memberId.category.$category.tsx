import type { Route } from "./+types/member.$memberId.category.$category";
import * as React from "react";
import { useNavigate, redirect } from "react-router";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { RequireAuth, useAuth } from "~/contexts/auth-context";
import { Navigation } from "~/components/navigation";
import { RecordsList } from "~/components/records-list";
import { RecordDrawer } from "~/components/ui/record-drawer";
import { AddCard } from "~/components/ui/interactive-card";
import { Accordion } from "~/components/ui/accordion";
import { loadFamilyDataWithMember } from "~/lib/loader-helpers";
import { getDatabase } from "~/lib/db-utils";
import { RecordManagementProvider } from "~/contexts/record-management-context";
import { recordTypes, records } from "~/db/schema";
import { eq, and } from "drizzle-orm";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `${params.category} Records - Kimmy` },
    {
      name: "description",
      content: `View and manage ${params.category.toLowerCase()} records`,
    },
  ];
}

export async function loader({ params, request, context }: Route.LoaderArgs) {
  try {
    console.log("Category route loader - starting...");
    console.log("Category route loader - params:", params);
    const env = (context as any).cloudflare?.env;

    if (!env?.DB) {
      console.log("Category route loader - no DB available");
      throw new Response("Database not available", { status: 500 });
    }

    // Check authentication first
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) {
      throw redirect("/welcome");
    }

    const cookies = cookieHeader.split(";").reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, string>
    );

    const sessionData = cookies["kimmy_auth_session"];
    if (!sessionData) {
      throw redirect("/welcome");
    }

    let session;
    try {
      session = JSON.parse(decodeURIComponent(sessionData));
    } catch (error) {
      throw redirect("/welcome");
    }

    // Check if user has a valid session with a household
    if (!session.currentHouseholdId) {
      throw redirect("/welcome");
    }

    const { memberId, category } = params;

    if (!memberId) {
      throw new Response("Member ID required", { status: 400 });
    }

    console.log("Category route loader - about to load family data...");
    // Load family data from URL params
    const { familyId, familyMembers, currentMember } =
      await loadFamilyDataWithMember(request, env, memberId);
    console.log("Category route loader - family data loaded:", { familyId, currentMember: currentMember?.name });

    // If no family data found, redirect to welcome
    if (!familyId) {
      console.log("❌ No family data found, redirecting to welcome");
      throw redirect("/welcome");
    }

    // Verify the user is accessing their own family data
    if (familyId !== session.currentHouseholdId) {
      throw redirect("/welcome");
    }

    console.log("Category route loader - about to fetch record types...");
    // Fetch record types for this family and category
    const db = getDatabase(env);
    const recordTypesResult = await db
      .select()
      .from(recordTypes)
      .where(
        and(
          eq(recordTypes.familyId, familyId),
          eq(recordTypes.category, category)
        )
      );
    console.log("Category route loader - record types fetched:", recordTypesResult.length);

    // Parse the fields JSON for each record type
    const parsedRecordTypes = recordTypesResult.map(rt => {
      let parsedFields = [];
      if (rt.fields) {
        try {
          const parsed = JSON.parse(rt.fields);
          
          // Extract the fields array from the parsed object
          if (parsed && typeof parsed === 'object' && Array.isArray(parsed.fields)) {
            parsedFields = parsed.fields;
          } else if (Array.isArray(parsed)) {
            // Handle case where fields is directly an array
            parsedFields = parsed;
          } else {
            parsedFields = [];
          }
        } catch (error) {
          parsedFields = [];
        }
      }
      
      return {
        ...rt,
        fields: parsedFields,
      };
    });

    console.log("Category route loader - about to fetch records...");
    // Fetch records for each record type, filtered by the specific member
    const recordsData = await db
      .select()
      .from(records)
      .where(
        and(
          eq(records.familyId, familyId),
          eq(records.memberId, parseInt(memberId))
        )
      );
    console.log("Category route loader - records fetched:", recordsData.length);

    // Group records by record type
    const recordsByType = recordsData.reduce(
      (acc, record) => {
        if (record.recordTypeId) {
          if (!acc[record.recordTypeId]) {
            acc[record.recordTypeId] = [];
          }
          acc[record.recordTypeId].push(record);
        }
        return acc;
      },
      {} as Record<number, any[]>
    );

    console.log("Category route loader - returning data:", {
      member: currentMember?.name,
      category,
      recordTypesCount: parsedRecordTypes.length,
      recordsCount: Object.keys(recordsByType).length
    });
    
    return {
      member: currentMember,
      category,
      recordTypes: parsedRecordTypes,
      recordsByType,
      familyId,
      familyMembers,
    };
  } catch (error) {
    console.error("Category route loader error:", error);

    if (error instanceof Response || error instanceof Error) {
      throw error;
    }

    throw new Response("Failed to load category data", { status: 500 });
  }
}

const CategoryRecordTypes: React.FC<Route.ComponentProps> = ({
  loaderData,
  params,
}) => {
  console.log("CategoryRecordTypes component - loaderData:", loaderData);
  console.log("CategoryRecordTypes component - params:", params);
  
  const {
    member,
    category,
    recordTypes,
    recordsByType,
    familyId,
    familyMembers,
  } = loaderData;
  const { session } = useAuth();
  const navigate = useNavigate();

  // Create a basic member profile from session data if no member data from loader
  const currentMember =
    member ||
    (session
      ? {
          id: session.userId,
          name: session.name,
          email: session.email,
          role: session.role,
        }
      : null);

  // If no session and no member, show error
  if (!currentMember) {
    return (
      <RequireAuth requireHousehold={true}>
        <PageLayout>
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-slate-200 mb-4">
              No Member Found
            </h2>
            <p className="text-slate-400 mb-6">
              Unable to load member information.
            </p>
          </div>
        </PageLayout>
      </RequireAuth>
    );
  }

  const handleAddRecordType = () => {
    navigate(
      `/member/${currentMember.id}/category/${encodeURIComponent(category)}/create-record-type`
    );
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

        <RecordManagementProvider
          familyMembers={familyMembers}
          familyId={familyId}
          memberId={currentMember.id.toString()}
          category={category}
          onRecordDelete={async (recordId: number) => {
            // TODO: Implement record deletion
            console.log("Deleting record:", recordId);
          }}
          onRecordUpdate={async (recordId: number, updates: any) => {
            // TODO: Implement record update
            console.log("Updating record:", recordId, updates);
          }}
        >
          {recordTypes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-slate-200 mb-2">
                No record types configured yet
              </h3>
              <p className="text-slate-400 mb-6">
                You'll need to create record types before you can start logging
                records.
              </p>
              <AddCard
                title="Add Record Type"
                description={`Create a new ${category.toLowerCase()} record type`}
                onClick={handleAddRecordType}
              />
            </div>
          ) : (
            <div className="space-y-8">
              <Accordion>
                {recordTypes.map(recordType => (
                  <RecordsList
                    key={recordType.id}
                    records={recordsByType[recordType.id] || []}
                    recordType={recordType}
                    memberId={currentMember.id.toString()}
                    category={category}
                    familyId={familyId}
                  />
                ))}
              </Accordion>

              <div className="pt-4">
                <AddCard
                  title="Add Record Type"
                  description={`Create a new ${category.toLowerCase()} record type`}
                  onClick={handleAddRecordType}
                />
              </div>
            </div>
          )}
          
          {/* Record Drawer - rendered at this level to be accessible to all RecordsList components */}
          <RecordDrawer
            familyId={familyId}
            memberId={currentMember.id.toString()}
            category={category}
          />
        </RecordManagementProvider>
      </PageLayout>
    </RequireAuth>
  );
};

export default CategoryRecordTypes;
