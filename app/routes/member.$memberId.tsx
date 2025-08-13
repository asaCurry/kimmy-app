import type { Route } from "./+types/member.$memberId";
import * as React from "react";
import { Link, redirect } from "react-router";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { RequireAuth, useAuth } from "~/contexts/auth-context";
import { Navigation } from "~/components/navigation";
import { CategoryCard } from "~/components/category-card";
import { loadHouseholdDataWithMember } from "~/lib/loader-helpers";
import { getDatabase, withDatabase } from "~/lib/db-utils";
import { recordTypes, records } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { CreateRecordTypeForm } from "~/components/create-record-type-form";

export function meta({ params }: Route.MetaArgs) {
  return [
    {
      title: `${params.memberId ? params.memberId + "'s" : "Member"} Records - Kimmy`,
    },
    { name: "description", content: "View and manage family member records" },
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

    const { memberId } = params;

    if (!memberId) {
      throw new Response("Member ID required", { status: 400 });
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

    // Fetch record types and records for this family
    const db = getDatabase(env);
    const recordTypesResult = await db
      .select()
      .from(recordTypes)
      .where(eq(recordTypes.householdId, householdId));

    const recordsResult = await db
      .select()
      .from(records)
      .where(
        and(
          eq(records.householdId, householdId),
          eq(records.memberId, parseInt(params.memberId))
        )
      );

    // Get unique categories from record types
    const categories = Array.from(
      new Set(recordTypesResult.map(rt => rt.category))
    ).sort();

    // If no categories exist, use default ones
    const defaultCategories = [
      "Health",
      "Activities",
      "Personal",
      "Education",
      "Finance",
      "Food",
      "Travel",
      "Home",
    ];
    const currentCategories =
      categories.length > 0 ? categories : defaultCategories;

    // Categorize record types and count records
    const recordTypesByCategory: Record<string, any[]> = {};

    currentCategories.forEach(category => {
      recordTypesByCategory[category] = [];
    });

    recordTypesResult.forEach(recordType => {
      const category = recordType.category || "Personal";

      // Count records for this record type
      const recordCount = recordsResult.filter(
        record => record.recordTypeId === recordType.id
      ).length;

      if (recordTypesByCategory[category]) {
        recordTypesByCategory[category].push({
          ...recordType,
          recordCount,
        });
      } else {
        // If category doesn't exist in our list, add it
        if (!recordTypesByCategory[category]) {
          recordTypesByCategory[category] = [];
        }
        recordTypesByCategory[category].push({
          ...recordType,
          recordCount,
        });
      }
    });

    // Calculate total record counts per category
    const categoryRecordCounts: Record<string, number> = {};
    currentCategories.forEach(category => {
      categoryRecordCounts[category] =
        recordTypesByCategory[category]?.reduce(
          (total, rt) => total + (rt.recordCount || 0),
          0
        ) || 0;
    });

    return {
      member: currentMember,
      householdMembers,
      householdId,
      recordTypesByCategory,
      categories: currentCategories,
      categoryRecordCounts,
    };
  } catch (error) {
    console.error("Member route loader error:", error);

    if (error instanceof Response || error instanceof Error) {
      throw error;
    }

    throw new Response("Failed to load member data", { status: 500 });
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

const MemberCategories: React.FC<Route.ComponentProps> = ({ loaderData }) => {
  const {
    member,
    householdMembers,
    recordTypesByCategory,
    categories,
    categoryRecordCounts,
  } = loaderData;
  const { session } = useAuth();
  const [showCreateForm, setShowCreateForm] = React.useState(false);


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

  // Use default categories if none provided from loader
  const defaultCategories = [
    "Health",
    "Activities",
    "Personal",
    "Education",
    "Finance",
    "Food",
    "Travel",
    "Home",
  ];
  const currentCategories =
    categories.length > 0 ? categories : defaultCategories;





  return (
    <RequireAuth requireHousehold={true}>
      <PageLayout>
        <Navigation currentView="categories" member={currentMember} />

        <PageHeader
          title={`${currentMember.name}'s Records`}
          subtitle="Choose a category to view or add records"
        />

        <div className="space-y-6">
          {/* Categories Grid */}
          <div className="grid gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {currentCategories.map(category => {
              const categoryRecordTypes =
                (recordTypesByCategory as any)[category] || [];
              const recordCount = (categoryRecordCounts as any)[category] || 0;
              return (
                <div
                  key={category}
                  className="block cursor-pointer"
                  onClick={() => {
                    console.log(`Navigating to category: ${category}`);
                    window.location.href = `/member/${currentMember.id}/category/${encodeURIComponent(category)}`;
                  }}
                >
                  <CategoryCard
                    category={category}
                    recordCount={recordCount}
                  />
                </div>
              );
            })}
          </div>
          {/* Create Record Type Section */}
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-slate-100">
                    Create New Record Type
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Add a new type of record to track for {currentMember.name}
                  </CardDescription>
                </div>
                <Link
                  to={`/member/${currentMember.id}/manage-categories`}
                  className="py-2 px-4 border-2 border-dashed border-slate-600 rounded-lg hover:border-slate-500 hover:bg-slate-800 transition-colors group"
                >
                  <div className="text-center">
                    <div className="text-slate-400 group-hover:text-slate-300">
                      ➕ Manage Categories
                    </div>
                  </div>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {!showCreateForm ? (
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  + Create Record Type
                </Button>
              ) : (
                <CreateRecordTypeForm
                  householdId={loaderData.householdId}
                  createdBy={currentMember.id}
                  onCancel={() => setShowCreateForm(false)}
                  className="space-y-4"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    </RequireAuth>
  );
};

export default MemberCategories;
