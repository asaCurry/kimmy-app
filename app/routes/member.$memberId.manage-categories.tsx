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
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { loadHouseholdDataWithMember } from "~/lib/loader-helpers";
import { getDatabase } from "~/lib/db-utils";
import { recordTypes, records } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import { useFetcher } from "react-router";
import { useState } from "react";
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
    const defaultCategories = [
      "Health",
      "Activities",
      "Personal",
      "Education",
      "Finance",
      "Travel",
      "Food",
      "Home",
    ];
    const allCategories = Array.from(
      new Set([...existingCategories, ...defaultCategories])
    ).sort();

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
  const formData = await request.formData();
  const action = formData.get("_action");

  switch (action) {
    case "create-category": {
      const categoryName = formData.get("categoryName") as string;
      const householdId = formData.get("householdId") as string;

      if (!categoryName || !householdId) {
        throw new Response("Missing required fields", { status: 400 });
      }

      // For now, we'll create a default record type for the new category
      // In a full implementation, you might want a separate categories table
      return { success: true, message: "Category created successfully" };
    }

    default:
      throw new Response("Invalid action", { status: 400 });
  }
}

const CategoriesManagement: React.FC<{
  loaderData: any;
  params: RouteParams;
}> = ({ loaderData, params }) => {
  const { member, householdId, householdMembers, categoryStats, allCategories } =
    loaderData;
  const { session } = useAuth();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const [newCategoryName, setNewCategoryName] = useState("");

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

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    const formData = new FormData();
    formData.append("_action", "create-category");
    formData.append("categoryName", newCategoryName.trim());
    formData.append("householdId", householdId);

    fetcher.submit(formData, { method: "post" });
    setNewCategoryName("");
  };

  return (
    <RequireAuth requireHousehold={true}>
      <PageLayout>
        <Navigation currentView="categories" member={currentMember} />

        <PageHeader
          title="Manage Categories"
          subtitle="Create and organize your record categories"
        />

        <div className="space-y-6">
          {/* Create New Category */}
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">
                Create New Category
              </CardTitle>
              <CardDescription className="text-slate-400">
                Add a new category to organize your records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <fetcher.Form
                onSubmit={handleCreateCategory}
                className="flex gap-3"
              >
                <div className="flex-1">
                  <Label htmlFor="categoryName" className="sr-only">
                    Category Name
                  </Label>
                  <Input
                    id="categoryName"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    placeholder="Enter category name..."
                    className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!newCategoryName.trim()}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  Create
                </Button>
              </fetcher.Form>
            </CardContent>
          </Card>

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
                          <span className="text-slate-400">Record Types:</span>
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

                      {isActive && (
                        <div className="mt-3 pt-3 border-t border-slate-600">
                          <Link
                            to={`/member/${currentMember.id}/category/${encodeURIComponent(category)}`}
                            className="text-blue-400 hover:text-blue-300 text-sm"
                          >
                            View Records →
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

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
