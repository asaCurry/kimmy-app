import type { Route } from "./+types/member.$memberId.category.$category.edit-record-type.$recordTypeId";
import * as React from "react";
import { redirect, useNavigate } from "react-router";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { RequireAuth, useAuth } from "~/contexts/auth-context";
import { Navigation } from "~/components/navigation";
import { loadHouseholdDataWithMember } from "~/lib/loader-helpers";
import { withDatabase, getDatabase } from "~/lib/db-utils";
import { recordTypes } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import { CreateRecordTypeForm } from "~/components/create-record-type-form";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Edit Record Type - ${params.category} - Kimmy` },
    {
      name: "description",
      content: `Edit record type for ${params.category.toLowerCase()}`,
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw redirect("/welcome");
    }

    // Check if user has a valid session with a household
    if (!session.currentHouseholdId) {
      throw redirect("/welcome");
    }

    const { memberId, category, recordTypeId } = params;

    if (!memberId || !category || !recordTypeId) {
      throw new Response("Member ID, Category, and Record Type ID required", {
        status: 400,
      });
    }

    // Load household data from URL params
    const { householdId, currentMember, householdMembers } =
      await loadHouseholdDataWithMember(request, env, memberId);

    // If no household data found, redirect to welcome
    if (!householdId) {
      throw redirect("/welcome");
    }

    // Verify the user is accessing their own household data
    if (householdId !== session.currentHouseholdId) {
      throw redirect("/welcome");
    }

    // Fetch the record type to edit
    const db = getDatabase(env);
    const recordTypeResult = await db
      .select()
      .from(recordTypes)
      .where(
        and(
          eq(recordTypes.id, parseInt(recordTypeId)),
          eq(recordTypes.householdId, householdId)
        )
      );

    if (recordTypeResult.length === 0) {
      throw new Response("Record type not found", { status: 404 });
    }

    const recordType = recordTypeResult[0];

    // Parse the fields JSON
    let parsedFields: any[] = [];
    if (recordType.fields) {
      try {
        parsedFields = JSON.parse(recordType.fields);
      } catch {
        console.error("Failed to parse record type fields:");
      }
    }

    // Fetch existing categories from record types
    const allRecordTypesResult = await db
      .select({ category: recordTypes.category })
      .from(recordTypes)
      .where(eq(recordTypes.householdId, householdId));

    const existingCategories = Array.from(
      new Set(allRecordTypesResult.map(rt => rt.category))
    ).sort();

    return {
      member: currentMember,
      category,
      householdId,
      recordType: {
        ...recordType,
        fields: parsedFields,
      },
      existingCategories,
      householdMembers,
    };
  } catch (error) {
    console.error("Edit record type route loader error:", error);

    if (error instanceof Response || error instanceof Error) {
      throw error;
    }

    throw new Response("Failed to load edit record type data", {
      status: 500,
    });
  }
}

export async function action({
  request,
  context,
  params,
}: {
  request: Request;
  context: any;
  params: { memberId: string; category: string; recordTypeId: string };
}) {
  const formData = await request.formData();
  const action = formData.get("_action");

  switch (action) {
    case "update-record-type": {
      const name = formData.get("name") as string;
      const description = formData.get("description") as string;
      const category = formData.get("category") as string;
      const householdId = formData.get("householdId") as string;
      const fields = formData.get("fields") as string;
      const icon = formData.get("icon") as string;
      const color = formData.get("color") as string;
      const allowPrivate = formData.get("allowPrivate") === "true";
      const visibleToMembers = formData.get("visibleToMembers") as string;
      const recordTypeId = parseInt(params.recordTypeId);

      if (!name || !category || !householdId || !recordTypeId) {
        throw new Response("Missing required fields", { status: 400 });
      }

      return withDatabase(context, async db => {
        const updatedRecordType = await db
          .update(recordTypes)
          .set({
            name,
            description,
            category,
            fields,
            icon,
            color,
            allowPrivate: allowPrivate ? 1 : 0,
            visibleToMembers,
          })
          .where(
            and(
              eq(recordTypes.id, recordTypeId),
              eq(recordTypes.householdId, householdId)
            )
          )
          .returning();

        const result = {
          success: true,
          recordType: updatedRecordType[0],
          message: "Record type updated successfully",
        };

        return result;
      });
    }

    default:
      throw new Response("Invalid action", { status: 400 });
  }
}

const EditRecordType: React.FC<Route.ComponentProps> = ({
  loaderData,
  params: _params,
}) => {
  const { member, category, householdId, recordType, householdMembers } =
    loaderData;
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

  return (
    <RequireAuth requireHousehold={true}>
      <PageLayout maxWidth="4xl">
        <Navigation
          currentView="form"
          member={currentMember}
          category={category}
        />

        <PageHeader
          title="Edit Record Type"
          subtitle={`Edit "${recordType.name}" record type`}
        />

        <CreateRecordTypeForm
          householdId={householdId}
          createdBy={currentMember.id}
          category={category}
          _existingCategories={loaderData.existingCategories}
          existingRecordType={recordType}
          householdMembers={householdMembers as any}
          isEditing={true}
          onSuccess={() => {
            // Navigate back to the category page
            navigate(
              `/member/${currentMember.id}/category/${encodeURIComponent(category)}`
            );
          }}
          showBackButton={true}
          className="space-y-8"
        />
      </PageLayout>
    </RequireAuth>
  );
};

export default EditRecordType;
