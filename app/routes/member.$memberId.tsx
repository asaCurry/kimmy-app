import type { Route } from "./+types/member.$memberId";
import * as React from "react";
import { Link, redirect, useNavigate } from "react-router";
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
    {
      name: "description",
      content: "View and manage household member records",
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

    const { memberId } = params;

    if (!memberId) {
      throw new Response("Member ID required", { status: 400 });
    }

    // Load household data from URL params
    const { householdId, householdMembers, currentMember } =
      await loadHouseholdDataWithMember(request, env, memberId);

    // If no household data found, redirect to welcome
    if (!householdId) {
      console.log("❌ No household data found, redirecting to welcome");
      throw redirect("/welcome");
    }

    // Verify the user is accessing their own household data
    if (householdId !== session.currentHouseholdId) {
      throw redirect("/welcome");
    }

    // Fetch record types and records for this household
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

    // Only show categories that have record types (no default fallback)
    const currentCategories = categories;

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

  // Use categories from loader (only those with record types)
  const currentCategories = categories;

  return (
    <RequireAuth requireHousehold={true}>
      <PageLayout>
        <Navigation currentView="categories" member={currentMember} />

        <PageHeader
          title={`${currentMember.name}'s Records`}
          subtitle="Choose a category to view or add records"
        />

        {/* Quick Access to Trackers */}
        <div className="mb-6">
          <Card className="bg-gradient-to-br from-blue-500/10 to-purple-600/10 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">⏱️</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-200">Activity Trackers</h3>
                    <p className="text-slate-400">Monitor time, progress, and activities</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/member/${currentMember.id}/trackers`}
                    className="inline-block"
                  >
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                      ⏱️ Member Trackers
                    </Button>
                  </Link>
                  <Link
                    to="/trackers"
                    className="inline-block"
                  >
                    <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                      📊 All Trackers
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {currentCategories.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-slate-200 mb-2">
                No record types configured yet
              </h3>
              <p className="text-slate-400 mb-6">
                You'll need to create record types before you can start logging
                records.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Link
                  to={`/member/${currentMember.id}/manage-categories`}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-colors"
                >
                  ➕ Create Your First Record Type
                </Link>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg transition-colors"
                >
                  + Quick Create
                </Button>
              </div>

              {showCreateForm && (
                <div className="mt-8 pt-8 border-t border-slate-600">
                  <CreateRecordTypeForm
                    householdId={loaderData.householdId}
                    createdBy={currentMember.id}
                    existingCategories={currentCategories}
                    onCancel={() => setShowCreateForm(false)}
                    className="space-y-4"
                  />
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Categories Grid */}
              <div className="grid gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {currentCategories.map(category => {
                  const categoryRecordTypes =
                    (recordTypesByCategory as any)[category] || [];
                  const recordCount =
                    (categoryRecordCounts as any)[category] || 0;
                  return (
                    <div
                      key={category}
                      className="block cursor-pointer"
                      onClick={() => {
                        navigate(`/member/${currentMember.id}/category/${encodeURIComponent(category)}`);
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

              {/* Quick Actions Section */}
              <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-slate-100">
                        Quick Actions
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        Manage record types, categories, and trackers for{" "}
                        {currentMember.name}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        to={`/member/${currentMember.id}/trackers`}
                        className="py-2 px-4 border-2 border-dashed border-slate-600 rounded-lg hover:border-slate-500 hover:bg-slate-800 transition-colors group"
                      >
                        <div className="text-center">
                          <div className="text-slate-400 group-hover:text-slate-300">
                            ⏱️ Trackers
                          </div>
                        </div>
                      </Link>
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
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-4 border border-slate-600 rounded-lg">
                      <h4 className="font-medium text-slate-200 mb-2">
                        Create Record Type
                      </h4>
                      <p className="text-sm text-slate-400 mb-3">
                        Add a new type of record to track
                      </p>
                      <Button
                        onClick={() => setShowCreateForm(true)}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      >
                        + Create Record Type
                      </Button>
                    </div>
                    <div className="p-4 border border-slate-600 rounded-lg">
                      <h4 className="font-medium text-slate-200 mb-2">
                        Manage Trackers
                      </h4>
                      <p className="text-sm text-slate-400 mb-3">
                        Create and manage activity trackers
                      </p>
                      <div className="flex flex-col gap-2">
                        <Link
                          to={`/member/${currentMember.id}/trackers`}
                          className="inline-block"
                        >
                          <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                            ⏱️ Member Trackers
                          </Button>
                        </Link>
                        <Link
                          to="/trackers"
                          className="inline-block"
                        >
                          <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700">
                            📊 All Household Trackers
                          </Button>
                        </Link>
                      </div>
                    </div>
                    <div className="p-4 border border-slate-600 rounded-lg">
                      <h4 className="font-medium text-slate-200 mb-2">
                        Manage Categories
                      </h4>
                      <p className="text-sm text-slate-400 mb-3">
                        Organize and manage your record categories
                      </p>
                      <Link
                        to={`/member/${currentMember.id}/manage-categories`}
                        className="inline-flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
                      >
                        Manage →
                      </Link>
                    </div>
                  </div>

                  {showCreateForm && (
                    <div className="mt-6 pt-6 border-t border-slate-600">
                      <CreateRecordTypeForm
                        householdId={loaderData.householdId}
                        createdBy={currentMember.id}
                        existingCategories={currentCategories}
                        onCancel={() => setShowCreateForm(false)}
                        className="space-y-4"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </PageLayout>
    </RequireAuth>
  );
};

export default MemberCategories;
