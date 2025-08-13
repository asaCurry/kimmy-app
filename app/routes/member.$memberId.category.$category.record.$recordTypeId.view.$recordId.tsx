import type { Route } from "./+types/member.$memberId.category.$category.record.$recordTypeId.view.$recordId";
import * as React from "react";
import { redirect } from "react-router";
import { PageLayout, PageHeader } from "~/components/ui";
import { RequireAuth, useAuth } from "~/contexts";
import { Navigation } from "~/components";
import { RecordDetailView } from "~/components/ui";
import { loadHouseholdDataWithMember, getDatabase } from "~/lib";
import { recordTypes, records } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import { ErrorBoundary } from "~/components/ui/error-boundary";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `View Record - Kimmy` },
    {
      name: "description",
      content: "View record details",
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

    const { memberId, category, recordTypeId, recordId } = params;

    if (!memberId || !recordTypeId || !recordId) {
      throw new Response("Missing required parameters", { status: 400 });
    }

    // Load family data from URL params
    const { householdId, householdMembers, currentMember } =
      await loadHouseholdDataWithMember(request, env, memberId);

    // If no family data found, redirect to welcome
    if (!householdId) {
      console.log("❌ No family data found, redirecting to welcome");
      throw redirect("/welcome");
    }

    // Verify the user is accessing their own family data
    if (householdId !== session.currentHouseholdId) {
      throw redirect("/welcome");
    }

    // Fetch the specific record
    const db = getDatabase(env);
    const recordResult = await db
      .select()
      .from(records)
      .where(
        and(
          eq(records.id, parseInt(recordId)),
          eq(records.householdId, householdId),
          eq(records.recordTypeId, parseInt(recordTypeId))
        )
      )
      .limit(1);

    if (recordResult.length === 0) {
      throw new Response("Record not found", { status: 404 });
    }

    const record = recordResult[0];

    // Fetch the record type
    const recordTypeResult = await db
      .select()
      .from(recordTypes)
      .where(
        and(
          eq(recordTypes.id, parseInt(recordTypeId)),
          eq(recordTypes.householdId, householdId)
        )
      )
      .limit(1);

    if (recordTypeResult.length === 0) {
      throw new Response("Record type not found", { status: 404 });
    }

    const recordType = recordTypeResult[0];

    return {
      record,
      recordType,
      householdMembers,
      householdId,
      currentMember,
      memberId,
      category,
      recordTypeId,
    };
  } catch (error) {
    console.error("Record view loader error:", error);

    if (error instanceof Response || error instanceof Error) {
      throw error;
    }

    throw new Response("Failed to load record", { status: 500 });
  }
}

export async function action({
  request,
  context,
}: {
  request: Request;
  context: any;
}) {
  const formData = await request.formData();
  const action = formData.get("_action");

  switch (action) {
    case "delete": {
      const recordId = parseInt(formData.get("recordId") as string);
      const householdId = formData.get("householdId") as string;

      if (!recordId || !householdId) {
        throw new Response("Missing required fields", { status: 400 });
      }

      const env = (context as any).cloudflare?.env;
      if (!env?.DB) {
        throw new Response("Database not available", { status: 500 });
      }

      const db = getDatabase(env);
      
      // Delete the record
      await db
        .delete(records)
        .where(
          and(
            eq(records.id, recordId),
            eq(records.householdId, householdId)
          )
        );

      // Redirect back to the category view
      const memberId = formData.get("memberId") as string;
      const category = formData.get("category") as string;
      
      return redirect(`/member/${memberId}/category/${encodeURIComponent(category)}`);
    }

    default:
      throw new Response("Invalid action", { status: 400 });
  }
}

const RecordViewPage: React.FC<Route.ComponentProps> = ({ loaderData }) => {
  const {
    record,
    recordType,
    householdMembers,
    householdId,
    currentMember,
    memberId,
    category,
    recordTypeId,
  } = loaderData;
  const { session } = useAuth();

  const handleDelete = (recordId: number) => {
    const formData = new FormData();
    formData.append("_action", "delete");
    formData.append("recordId", recordId.toString());
    formData.append("householdId", householdId);
    formData.append("memberId", memberId);
    formData.append("category", category);

    // Submit the delete action
    const form = document.createElement("form");
    form.method = "post";
    form.action = window.location.pathname;
    
    formData.forEach((value, key) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value.toString();
      form.appendChild(input);
    });
    
    document.body.appendChild(form);
    form.submit();
  };

  return (
    <RequireAuth requireHousehold={true}>
      <PageLayout>
        <Navigation currentView="categories" member={currentMember} />
        
        <PageHeader
          title="View Record"
          subtitle={`Viewing ${record.title}`}
        />

        <ErrorBoundary>
          <RecordDetailView
            record={record}
            recordType={recordType}
            householdMembers={householdMembers}
            householdId={householdId}
            memberId={memberId}
            category={category}
            recordTypeId={recordTypeId}
            onDelete={handleDelete}
          />
        </ErrorBoundary>
      </PageLayout>
    </RequireAuth>
  );
};

export default RecordViewPage;
