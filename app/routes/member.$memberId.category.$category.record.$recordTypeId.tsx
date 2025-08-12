import type { Route } from "./+types/member.$memberId.category.$category.record.$recordTypeId";
import * as React from "react";
import { useNavigate, useLoaderData, redirect } from "react-router";
import { PageLayout } from "~/components/ui/layout";
import { RequireAuth, useAuth } from "~/contexts/auth-context";
import { Navigation } from "~/components/navigation";
import { DynamicRecordForm } from "~/components/dynamic-record-form";
import { loadFamilyDataWithMember } from "~/lib/loader-helpers";
import { withDatabaseAndSession, getDatabase } from "~/lib/db-utils";
import { recordTypes, records } from "~/db/schema";
import { eq } from "drizzle-orm";
import type { FormField } from "~/lib/utils";
import { useCallback } from "react";
import type { RecordType } from "~/db/schema";
import { convertFormDataToFields } from "~/lib/utils/dynamic-fields/field-serialization";

// Local interface for parsed record type
interface ParsedRecordType {
  id: number;
  name: string;
  description: string | null;
  category: string;
  familyId: string;
  fields: any[]; // Will be parsed from JSON
  icon: string | null;
  color: string | null;
  allowPrivate: number | null;
  createdAt: string | null;
  createdBy: number | null;
}

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Create ${params.category} Record - Kimmy` },
    {
      name: "description",
      content: `Create a new ${params.category.toLowerCase()} record`,
    },
  ];
}

export async function loader({ params, request, context }: Route.LoaderArgs) {
  try {
    const env = (context as any).cloudflare?.env;

    if (!env?.DB) {
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

    const { memberId, category, recordTypeId } = params;

    if (!memberId || !recordTypeId) {
      throw new Response("Member ID and Record Type ID required", {
        status: 400,
      });
    }

    // Load family data from URL params
    const { familyId, familyMembers, currentMember } =
      await loadFamilyDataWithMember(request, env, memberId);

    // If no family data found, redirect to welcome
    if (!familyId) {
      console.log("❌ No family data found, redirecting to welcome");
      throw redirect("/welcome");
    }

    // Verify the user is accessing their own family data
    if (familyId !== session.currentHouseholdId) {
      throw redirect("/welcome");
    }

    // Fetch the actual record type configuration
    const db = getDatabase(env);
    const recordTypeResult = await db
      .select()
      .from(recordTypes)
      .where(eq(recordTypes.id, parseInt(recordTypeId)))
      .limit(1);

    if (!recordTypeResult.length) {
      throw new Response("Record type not found", { status: 404 });
    }

    console.log("recordTypeResult[0]:", recordTypeResult[0]);
    console.log("recordTypeResult[0].fields:", recordTypeResult[0].fields);
    console.log("recordTypeResult[0].fields type:", typeof recordTypeResult[0].fields);
    
    let parsedFields = [];
    if (recordTypeResult[0].fields) {
      try {
        const parsed = JSON.parse(recordTypeResult[0].fields);
        console.log("Parsed fields:", parsed);
        console.log("Parsed fields type:", typeof parsed);
        console.log("Parsed fields is array:", Array.isArray(parsed));
        
        // Extract the fields array from the parsed object
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.fields)) {
          parsedFields = parsed.fields;
        } else if (Array.isArray(parsed)) {
          // Handle case where fields is directly an array
          parsedFields = parsed;
        } else {
          console.warn("Unexpected fields structure:", parsed);
          parsedFields = [];
        }
        
        console.log("Final parsedFields:", parsedFields);
      } catch (error) {
        console.error("Error parsing fields:", error);
        parsedFields = [];
      }
    }
    
    const recordType: ParsedRecordType = {
      ...recordTypeResult[0],
      fields: parsedFields,
    };

    return {
      member: currentMember,
      category,
      recordType,
      familyId,
      familyMembers,
    };
  } catch (error) {
    console.error("Record form route loader error:", error);

    if (error instanceof Response || error instanceof Error) {
      throw error;
    }

    throw new Response("Failed to load record form data", { status: 500 });
  }
}

export async function action({
  request,
  context,
  params,
}: {
  request: Request;
  context: any;
  params: Route.Params;
}) {
  const formData = await request.formData();
  const action = formData.get("_action");

  switch (action) {
    case "create": {
      const title = formData.get("title") as string;
      const content = formData.get("content") as string;
      const recordTypeId = parseInt(formData.get("recordTypeId") as string);
      const familyId = formData.get("familyId") as string;
      const tags = formData.get("tags") as string;
      const isPrivate = formData.get("isPrivate") === "true";
      const datetime = formData.get("datetime") as string;

      if (!title || !recordTypeId || !familyId) {
        throw new Response("Missing required fields", { status: 400 });
      }

      return withDatabaseAndSession(request, context, async (db, session) => {
        try {
          // Parse dynamic fields from form data
          const recordType = await db
            .select()
            .from(recordTypes)
            .where(eq(recordTypes.id, parseInt(params.recordTypeId)))
            .limit(1);

          if (!recordType.length) {
            throw new Response("Record type not found", { status: 404 });
          }

          const fieldsJson = recordType[0].fields;
          if (!fieldsJson) {
            throw new Response("Record type has no fields", { status: 400 });
          }
          
          const fields = JSON.parse(fieldsJson);
          
          // Convert form data to dynamic fields using the utility function
          const dynamicFields: Record<string, any> = {};
          if (Array.isArray(fields)) {
            fields.forEach((field: any) => {
              const fieldKey = `field_${field.id}`;
              const fieldValue = formData.get(fieldKey);

              if (fieldValue !== null) {
                switch (field.type) {
                  case "number":
                    dynamicFields[fieldKey] = fieldValue ? parseFloat(fieldValue.toString()) : null;
                    break;
                  case "checkbox":
                    dynamicFields[fieldKey] = fieldValue === "true";
                    break;
                  default:
                    dynamicFields[fieldKey] = fieldValue;
                }
              }
            });
          }

          // Create the full content object
          const fullContent = {
            description: content || "No description provided", // Ensure description is never empty
            fields: dynamicFields,
          };

          // Set datetime to current timestamp if not provided
          const recordDatetime = datetime || new Date().toISOString();

          console.log("Creating record with data:", {
            title,
            content: fullContent,
            recordTypeId,
            familyId,
            memberId: params.memberId,
            createdBy: session.userId,
            createdByType: typeof session.userId,
            tags,
            isPrivate: isPrivate ? 1 : 0,
            datetime: recordDatetime,
          });

          const newRecord = await db
            .insert(records)
            .values({
              title,
              content: JSON.stringify(fullContent),
              recordTypeId,
              familyId,
              memberId: parseInt(params.memberId), // Associate record with the specific member
              createdBy: parseInt(session.userId.toString()),
              tags,
              isPrivate: isPrivate ? 1 : 0,
              datetime: recordDatetime,
            })
            .returning();

          const result = {
            success: true,
            record: newRecord[0],
            message: "Record created successfully",
          };

          console.log("Record action returning:", result);
          return result;
        } catch (error) {
          console.error("Error creating record:", error);
          throw new Response(
            `Failed to create record: ${error instanceof Error ? error.message : "Unknown error"}`,
            { status: 500 }
          );
        }
      });
    }

    default:
      throw new Response("Invalid action", { status: 400 });
  }
}

const RecordForm: React.FC<Route.ComponentProps> = ({ loaderData, params }) => {
  const { member, category, recordType, familyId, familyMembers } = loaderData;
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

  const handleBack = useCallback(() => {
    navigate(
      `/member/${currentMember.id}/category/${encodeURIComponent(category)}`
    );
  }, [currentMember.id, category, navigate]);

  return (
    <RequireAuth requireHousehold={true}>
      <PageLayout maxWidth="2xl">
        <Navigation
          currentView="form"
          member={currentMember}
          category={category}
          recordType={recordType}
        />

        <DynamicRecordForm
          member={currentMember}
          recordType={recordType}
          familyId={familyId}
          onBack={handleBack}
        />
      </PageLayout>
    </RequireAuth>
  );
};

export default RecordForm;
