import type { Route } from "./+types/member.$memberId";
import * as React from "react";
import { Link, redirect, useFetcher } from "react-router";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { RequireAuth, useAuth } from "~/contexts/auth-context";
import { Navigation } from "~/components/navigation";
import { CategoryCard } from "~/components/category-card";
import { loadFamilyDataWithMember } from "~/lib/loader-helpers";
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
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { LoadingSpinner } from "~/components/ui/loading";

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

    // Fetch record types and records for this family
    const db = getDatabase(env);
    const recordTypesResult = await db
      .select()
      .from(recordTypes)
      .where(eq(recordTypes.familyId, familyId));

    const recordsResult = await db
      .select()
      .from(records)
      .where(
        and(
          eq(records.familyId, familyId),
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
      familyMembers,
      familyId,
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
      const familyId = formData.get("familyId") as string;
      const fields = formData.get("fields") as string;
      const icon = formData.get("icon") as string;
      const color = formData.get("color") as string;
      const allowPrivate = formData.get("allowPrivate") === "true";
      const createdBy = parseInt(formData.get("createdBy") as string);

      if (!name || !category || !familyId || !createdBy) {
        throw new Response("Missing required fields", { status: 400 });
      }

      return withDatabase(context, async db => {
        const newRecordType = await db
          .insert(recordTypes)
          .values({
            name,
            description,
            category,
            familyId,
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
    familyMembers,
    recordTypesByCategory,
    categories,
    categoryRecordCounts,
  } = loaderData;
  const { session } = useAuth();
  const fetcher = useFetcher();
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [newRecordType, setNewRecordType] = React.useState({
    name: "",
    description: "",
    category: "",
    icon: "📝",
    color: "blue",
    allowPrivate: false,
  });

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

  const handleCreateRecordType = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("_action", "create-record-type");
    formData.append("name", newRecordType.name);
    formData.append("description", newRecordType.description);
    formData.append("category", newRecordType.category);
    formData.append("familyId", loaderData.familyId);
    formData.append("icon", newRecordType.icon);
    formData.append("color", newRecordType.color);
    formData.append("allowPrivate", newRecordType.allowPrivate.toString());
    formData.append("createdBy", currentMember.id.toString());
    formData.append("fields", JSON.stringify([]));

    fetcher.submit(formData, { method: "post" });

    // Reset form and hide
    setNewRecordType({
      name: "",
      description: "",
      category: "",
      icon: "📝",
      color: "blue",
      allowPrivate: false,
    });
    setShowCreateForm(false);
  };

  // Handle successful submission
  React.useEffect(() => {
    if (fetcher.data?.success) {
      // Refresh the page to show the new record type
      window.location.reload();
    }
  }, [fetcher.data]);

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
                <Link
                  key={category}
                  to={`/member/${currentMember.id}/category/${encodeURIComponent(category)}`}
                >
                  <CategoryCard
                    category={category}
                    recordCount={recordCount}
                    onSelect={() => {}}
                  />
                </Link>
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
                <fetcher.Form
                  onSubmit={handleCreateRecordType}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-slate-200">
                        Name *
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={newRecordType.name}
                        onChange={e =>
                          setNewRecordType(prev => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="e.g., Health Record, School Event"
                        required
                        className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
                      />
                    </div>

                    <div>
                      <Label htmlFor="category" className="text-slate-200">
                        Category *
                      </Label>
                      <Select
                        name="category"
                        required
                        value={newRecordType.category}
                        onValueChange={value =>
                          setNewRecordType(prev => ({
                            ...prev,
                            category: value,
                          }))
                        }
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                          <SelectValue placeholder="Choose a category" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="Health">🏥 Health</SelectItem>
                          <SelectItem value="Activities">
                            🏃 Activities
                          </SelectItem>
                          <SelectItem value="Personal">📝 Personal</SelectItem>
                          <SelectItem value="Education">
                            🎓 Education
                          </SelectItem>
                          <SelectItem value="Finance">💰 Finance</SelectItem>
                          <SelectItem value="Travel">✈️ Travel</SelectItem>
                          <SelectItem value="Food">🍽️ Food</SelectItem>
                          <SelectItem value="Home">🏠 Home</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-slate-200">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={newRecordType.description}
                      onChange={e =>
                        setNewRecordType(prev => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Describe what this record type is for..."
                      className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="icon" className="text-slate-200">
                        Icon
                      </Label>
                      <Select
                        name="icon"
                        value={newRecordType.icon}
                        onValueChange={value =>
                          setNewRecordType(prev => ({ ...prev, icon: value }))
                        }
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                          <SelectValue placeholder="Choose an icon" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="📝">📝 Note</SelectItem>
                          <SelectItem value="🏥">🏥 Health</SelectItem>
                          <SelectItem value="🎓">🎓 Education</SelectItem>
                          <SelectItem value="⭐">⭐ Achievement</SelectItem>
                          <SelectItem value="🎯">🎯 Goal</SelectItem>
                          <SelectItem value="💊">💊 Medication</SelectItem>
                          <SelectItem value="🏃">🏃 Activity</SelectItem>
                          <SelectItem value="🍽️">🍽️ Meal</SelectItem>
                          <SelectItem value="😴">😴 Sleep</SelectItem>
                          <SelectItem value="🎨">🎨 Creative</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="color" className="text-slate-200">
                        Color
                      </Label>
                      <Select
                        name="color"
                        value={newRecordType.color}
                        onValueChange={value =>
                          setNewRecordType(prev => ({ ...prev, color: value }))
                        }
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                          <SelectValue placeholder="Choose a color" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="blue">Blue</SelectItem>
                          <SelectItem value="green">Green</SelectItem>
                          <SelectItem value="red">Red</SelectItem>
                          <SelectItem value="yellow">Yellow</SelectItem>
                          <SelectItem value="purple">Purple</SelectItem>
                          <SelectItem value="pink">Pink</SelectItem>
                          <SelectItem value="indigo">Indigo</SelectItem>
                          <SelectItem value="gray">Gray</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="allowPrivate"
                      name="allowPrivate"
                      checked={newRecordType.allowPrivate}
                      onChange={e =>
                        setNewRecordType(prev => ({
                          ...prev,
                          allowPrivate: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <Label htmlFor="allowPrivate" className="text-slate-200">
                      Allow private records
                    </Label>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      type="submit"
                      disabled={fetcher.state === "submitting"}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                      {fetcher.state === "submitting" ? (
                        <>
                          <LoadingSpinner className="w-4 h-4 mr-2" />
                          Creating...
                        </>
                      ) : (
                        "Create Record Type"
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      Cancel
                    </Button>
                  </div>
                </fetcher.Form>
              )}
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    </RequireAuth>
  );
};

export default MemberCategories;
