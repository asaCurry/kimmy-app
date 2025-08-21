import * as React from "react";
import { useNavigate, useLoaderData, redirect } from "react-router";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { RequireAuth, useAuth } from "~/contexts/auth-context";
import { Navigation } from "~/components/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { loadHouseholdDataWithMember } from "~/lib/loader-helpers";
import { getDatabase } from "~/lib/db-utils";
import { recordTypes, records } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import { Link } from "react-router";

// Temporary interface until types are generated
interface RouteParams {
  memberId: string;
}

interface RouteContext {
  cloudflare?: {
    env: any;
  };
}

export function meta({ params }: { params: RouteParams }) {
  return [
    { title: `Manage Categories - Kimmy` },
    { name: "description", content: "Create and manage record categories" },
  ];
}

export async function loader({
  params,
  request,
  context,
}: {
  params: RouteParams;
  request: Request;
  context: RouteContext;
}) {
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

    // Get unique categories and their stats
    const categoryStats: Record<
      string,
      { recordTypeCount: number; recordCount: number }
    > = {};

    recordTypesResult.forEach(recordType => {
      const category = recordType.category || "Personal";
      if (!categoryStats[category]) {
        categoryStats[category] = { recordTypeCount: 0, recordCount: 0 };
      }
      categoryStats[category].recordTypeCount++;

      // Count records for this record type
      const recordsForType = recordsResult.filter(
        record => record.recordTypeId === recordType.id
      );
      categoryStats[category].recordCount += recordsForType.length;
    });

    // Get all categories (existing + defaults)
    const existingCategories = Object.keys(categoryStats);
    // Only show categories that have record types
    const allCategories = existingCategories.sort();

    return {
      member: currentMember,
      householdId,
      householdMembers,
      categoryStats,
      allCategories,
    };
  } catch (error) {
    console.error("Categories management loader error:", error);

    if (error instanceof Response || error instanceof Error) {
      throw error;
    }

    throw new Response("Failed to load categories data", { status: 500 });
  }
}

export async function action({
  request,
  context,
}: {
  request: Request;
  context: any;
}) {
  // No actions needed - categories are created automatically with record types
  throw new Response("No actions available", { status: 400 });
}

const CategoriesManagement: React.FC<{
  loaderData: any;
  params: RouteParams;
}> = ({ loaderData, params }) => {
  const {
    member,
    householdId,
    householdMembers,
    categoryStats,
    allCategories,
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

  const handleBack = () => {
    navigate(`/member/${currentMember.id}`);
  };

  return (
    <RequireAuth requireHousehold={true}>
      <PageLayout>
        <Navigation currentView="categories" member={currentMember} />

        <PageHeader
          title="Manage Categories"
          subtitle="View and organize your record categories"
        />

        <div className="space-y-6">
          {/* Existing Categories */}
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">
                Existing Categories
              </CardTitle>
              <CardDescription className="text-slate-400">
                View and manage your current categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allCategories.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📁</div>
                  <p className="text-slate-400 mb-4">
                    No categories have been created yet. Categories are
                    automatically created when you add record types.
                  </p>
                  <Link
                    to={`/member/${currentMember.id}/category/Personal/create-record-type`}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-colors"
                  >
                    + Create Your First Record Type
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {allCategories.map((category: string) => {
                    const stats = categoryStats[category] || {
                      recordTypeCount: 0,
                      recordCount: 0,
                    };
                    const isActive = stats.recordTypeCount > 0;

                    return (
                      <div
                        key={category}
                        className={`p-4 rounded-lg border ${
                          isActive
                            ? "bg-slate-700/50 border-slate-600"
                            : "bg-slate-800/30 border-slate-700/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3
                            className={`font-medium ${isActive ? "text-slate-100" : "text-slate-400"}`}
                          >
                            {category}
                          </h3>
                          {!isActive && (
                            <span className="text-xs text-slate-500">
                              Available
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">
                              Record Types:
                            </span>
                            <span
                              className={
                                isActive ? "text-slate-200" : "text-slate-500"
                              }
                            >
                              {stats.recordTypeCount}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Records:</span>
                            <span
                              className={
                                isActive ? "text-slate-200" : "text-slate-500"
                              }
                            >
                              {stats.recordCount}
                            </span>
                          </div>
                        </div>

                        {isActive ? (
                          <div className="mt-3 pt-3 border-t border-slate-600">
                            <Link
                              to={`/member/${currentMember.id}/category/${encodeURIComponent(category)}`}
                              className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                              View Records →
                            </Link>
                          </div>
                        ) : (
                          <div className="mt-3 pt-3 border-t border-slate-600">
                            <Link
                              to={`/member/${currentMember.id}/category/${encodeURIComponent(category)}/create-record-type`}
                              className="text-green-400 hover:text-green-300 text-sm"
                            >
                              Create Record Type →
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Create Records Section */}
          {Object.keys(categoryStats).some(
            cat => (categoryStats[cat] as any).recordTypeCount > 0
          ) ? (
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">
                  Quick Create Records
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Quickly create new records using existing record types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(categoryStats)
                    .filter(([_, stats]) => (stats as any).recordTypeCount > 0)
                    .map(([category, stats]) => (
                      <div
                        key={category}
                        className="p-4 border border-slate-600 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-slate-200">
                            {category}
                          </h4>
                          <span className="text-sm text-slate-400">
                            {(stats as any).recordTypeCount} record type
                            {(stats as any).recordTypeCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            to={`/member/${currentMember.id}/category/${encodeURIComponent(category)}`}
                            className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                          >
                            View All →
                          </Link>
                          <Link
                            to={`/member/${currentMember.id}/category/${encodeURIComponent(category)}/create-record-type`}
                            className="inline-flex items-center px-3 py-2 bg-slate-600 hover:bg-slate-500 text-slate-200 text-sm rounded-lg transition-colors"
                          >
                            + Add Record Type
                          </Link>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">
                  No Record Types Yet
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Create your first record type to get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📝</div>
                  <p className="text-slate-400 mb-4">
                    You haven't created any record types yet. Record types
                    define the structure and fields for your records.
                  </p>
                  <Link
                    to={`/member/${currentMember.id}/category/Personal/create-record-type`}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-colors"
                  >
                    + Create Your First Record Type
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Back Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleBack}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              ← Back to Categories
            </Button>
          </div>
        </div>
      </PageLayout>
    </RequireAuth>
  );
};

export default CategoriesManagement;
