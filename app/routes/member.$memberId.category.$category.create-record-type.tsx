import type { Route } from "./+types/member.$memberId.category.$category.create-record-type";
import * as React from "react";
import { redirect } from "react-router";
import { PageLayout } from "~/components/ui/layout";
import { RequireAuth, useAuth } from "~/contexts/auth-context";
import { Navigation } from "~/components/navigation";
import { PageHeader } from "~/components/ui/layout";
import { loadHouseholdDataWithMember } from "~/lib/loader-helpers";
import { withDatabase, getDatabase } from "~/lib/db-utils";
import { recordTypes } from "~/db/schema";
import { eq } from "drizzle-orm";
import { CreateRecordTypeForm } from "~/components/create-record-type-form";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Create Record Type - ${params.category} - Kimmy` },
    {
      name: "description",
      content: `Create a new record type for ${params.category.toLowerCase()}`,
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

    const { memberId, category } = params;

    if (!memberId || !category) {
      throw new Response("Member ID and Category required", {
        status: 400,
      });
    }

    // Load household data from URL params
    const { householdId, currentMember } = await loadHouseholdDataWithMember(
      request,
      env,
      memberId
    );

    // If no household data found, redirect to welcome
    if (!householdId) {
      console.log("❌ No household data found, redirecting to welcome");
      throw redirect("/welcome");
    }

    // Verify the user is accessing their own household data
    if (householdId !== session.currentHouseholdId) {
      throw redirect("/welcome");
    }

    // Fetch existing categories from record types
    const db = getDatabase(env);
    const recordTypesResult = await db
      .select({ category: recordTypes.category })
      .from(recordTypes)
      .where(eq(recordTypes.householdId, householdId));

    const existingCategories = Array.from(
      new Set(recordTypesResult.map(rt => rt.category))
    ).sort();

    return {
      member: currentMember,
      category,
      householdId,
      existingCategories,
    };
  } catch (error) {
    console.error("Create record type route loader error:", error);

    if (error instanceof Response || error instanceof Error) {
      throw error;
    }

    throw new Response("Failed to load create record type data", {
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
  params: { memberId: string; category: string };
}) {
  const formData = await request.formData();
  const action = formData.get("_action");

  switch (action) {
    case "create-record-type": {
      const name = formData.get("name") as string;
      const description = formData.get("description") as string;
      const category = formData.get("category") as string;
      const householdId = formData.get("householdId") as string;
      const fields = formData.get("fields") as string;
      const icon = formData.get("icon") as string;
      const color = formData.get("color") as string;
      const allowPrivate = formData.get("allowPrivate") === "true";
      const createdBy = parseInt(formData.get("createdBy") as string);

      if (!name || !category || !householdId || !createdBy) {
        throw new Response("Missing required fields", { status: 400 });
      }

      return withDatabase(context, async db => {
        const newRecordType = await db
          .insert(recordTypes)
          .values({
            name,
            description,
            category,
            householdId,
            fields,
            icon,
            color,
            allowPrivate: allowPrivate ? 1 : 0,
            createdBy,
          })
          .returning();

        const result = {
          success: true,
          recordType: newRecordType[0],
          message: "Record type created successfully",
        };

        console.log("Action returning:", result);
        return result;
      });
    }

    default:
      throw new Response("Invalid action", { status: 400 });
  }
}

const CreateRecordType: React.FC<Route.ComponentProps> = ({
  loaderData,
  params,
}) => {
  const { member, category, householdId } = loaderData;
  const { session } = useAuth();

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
          title="Create Record Type"
          subtitle={`Create a new record type for ${category}`}
        />

        <CreateRecordTypeForm
          householdId={householdId}
          createdBy={currentMember.id}
          category={category}
          existingCategories={loaderData.existingCategories}
          onSuccess={() =>
            (window.location.href = `/member/${currentMember.id}/category/${encodeURIComponent(category)}`)
          }
          showBackButton={true}
          className="space-y-8"
        />
      </PageLayout>
    </RequireAuth>
  );
};

export default CreateRecordType;
