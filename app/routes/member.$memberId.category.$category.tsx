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
import { loadHouseholdDataWithMember } from "~/lib/loader-helpers";
import { getDatabase } from "~/lib/db-utils";
import { RecordManagementProvider } from "~/contexts/record-management-context";
import {
  recordTypes,
  records,
  quickNotes,
  households,
  users,
} from "~/db/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { QuickNotes } from "~/components/ui";
import { useLoaderData, useActionData, useRevalidator } from "react-router";
import { useEffect } from "react";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `${params.category} Records - Kimmy` },
    {
      name: "description",
      content: `View and manage ${params.category.toLowerCase()} records`,
    },
  ];
}

export async function action({ request, context, params }: Route.ActionArgs) {
  try {
    const { memberId, category } = params;
    if (!memberId || !category) {
      throw new Error("Missing required parameters");
    }

    const formData = await request.formData();
    const action = formData.get("_action");

    // Handle record deletion
    if (action === "delete" && formData.has("recordId")) {
      const recordId = formData.get("recordId");
      if (!recordId) {
        throw new Error("Record ID is required for deletion");
      }

      const env = (context as any).cloudflare?.env;
      if (!env?.DB) {
        throw new Error("Database not available");
      }

      const { householdId } = await loadHouseholdDataWithMember(
        request,
        env,
        memberId
      );
      if (!householdId) {
        throw new Error("Household not found");
      }

      const db = getDatabase(env);

      // Verify record exists and belongs to household
      const record = await db
        .select()
        .from(records)
        .where(
          and(
            eq(records.id, parseInt(recordId.toString())),
            eq(records.householdId, householdId)
          )
        )
        .get();

      if (!record) {
        throw new Error("Record not found");
      }

      // Delete the record
      await db
        .delete(records)
        .where(eq(records.id, parseInt(recordId.toString())));

      // Redirect back to the same page to refresh the data
      return redirect(
        `/member/${memberId}/category/${encodeURIComponent(category)}`
      );
    }

    // Handle quick note creation
    if (action === "create" && formData.has("content")) {
      const content = formData.get("content");
      const tags = formData.get("tags");
      const householdId = formData.get("householdId");
      const noteMemberId = formData.get("memberId");

      if (!content || !householdId || !noteMemberId) {
        return { error: "Missing required fields for quick note creation" };
      }

      const env = (context as any).cloudflare?.env;
      if (!env?.DB) {
        return { error: "Database not available" };
      }

      const db = getDatabase(env);

      // Create the quick note
      const newNote = await db
        .insert(quickNotes)
        .values({
          content: content.toString(),
          tags: tags?.toString() || null,
          householdId: householdId.toString(),
          createdBy: parseInt(noteMemberId.toString()),
        })
        .returning()
        .get();

      return { success: true, note: newNote };
    }

    // Handle quick note deletion
    if (action === "delete" && formData.has("noteId")) {
      const noteId = formData.get("noteId");
      if (!noteId) {
        return { error: "Note ID is required for deletion" };
      }

      const env = (context as any).cloudflare?.env;
      if (!env?.DB) {
        return { error: "Database not available" };
      }

      const db = getDatabase(env);

      // Delete the quick note
      await db
        .delete(quickNotes)
        .where(eq(quickNotes.id, parseInt(noteId.toString())));

      return { success: true, deletedNoteId: parseInt(noteId.toString()) };
    }

    // For unknown actions, return null instead of throwing an error

    // Return null to indicate no action was taken, but don't crash
    return null;
  } catch (error) {
    console.error("Error in category action:", error);
    throw error;
  }
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

    if (!memberId) {
      throw new Response("Member ID required", { status: 400 });
    }

    // Load household data directly from database instead of using the helper
    const db = getDatabase(env);

    // First, verify the household exists and user has access
    const household = await db
      .select()
      .from(households)
      .where(eq(households.id, session.currentHouseholdId))
      .get();

    if (!household) {
      throw redirect("/welcome");
    }

    // Load household members
    const householdMembers = await db
      .select()
      .from(users)
      .where(eq(users.householdId, session.currentHouseholdId));

    // Map to expected interface format
    const mappedHouseholdMembers = householdMembers.map(member => ({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role || "member",
      age: member.age || undefined,
      relationshipToAdmin: member.relationshipToAdmin || undefined,
    }));

    // Find the current member (use original database result for type compatibility)
    const currentMember = householdMembers.find(
      member => member.id.toString() === memberId
    );

    if (!currentMember) {
      throw redirect("/welcome");
    }

    const householdId = session.currentHouseholdId;

    // Fetch record types for this household and category
    const recordTypesResult = await db
      .select()
      .from(recordTypes)
      .where(
        and(
          eq(recordTypes.householdId, householdId),
          eq(recordTypes.category, category)
        )
      );

    // Parse the fields JSON for each record type
    const parsedRecordTypes = recordTypesResult.map(rt => {
      let parsedFields: any[] = [];
      if (rt.fields) {
        try {
          let parsed;
          if (typeof rt.fields === "string") {
            parsed = JSON.parse(rt.fields);
          } else {
            parsed = rt.fields;
          }

          if (
            parsed &&
            typeof parsed === "object" &&
            Array.isArray(parsed.fields)
          ) {
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
        parsedFields, // Keep original fields as string, add parsedFields separately
      };
    });

    // Fetch records for each record type, filtered by the specific member
    const recordsData = await db
      .select()
      .from(records)
      .where(
        and(
          eq(records.householdId, householdId),
          eq(records.memberId, parseInt(memberId))
        )
      );

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

    // Load quick notes for the current member (filtered by createdBy)
    let memberQuickNotes: any[] = [];
    try {
      const quickNotesResult = await db
        .select()
        .from(quickNotes)
        .where(
          and(
            eq(quickNotes.householdId, householdId),
            eq(quickNotes.createdBy, parseInt(memberId))
          )
        )
        .orderBy(desc(quickNotes.createdAt))
        .limit(20);

      memberQuickNotes = quickNotesResult;
    } catch (error) {
      console.error("Failed to load quick notes:", error);
      memberQuickNotes = [];
    }

    return {
      member: currentMember,
      category,
      recordTypes: parsedRecordTypes,
      recordsByType,
      householdId,
      householdMembers: mappedHouseholdMembers,
      quickNotes: memberQuickNotes,
    };
  } catch (error) {
    console.error("Category route loader error:", error);

    if (error instanceof Response || error instanceof Error) {
      throw error;
    }

    throw new Response("Failed to load category data", { status: 500 });
  }
}

export default function CategoryRecordTypes() {
  const {
    member,
    householdId,
    recordTypes,
    recordsByType,
    householdMembers,
    category,
    quickNotes,
  } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const revalidator = useRevalidator();

  // Refresh data when component mounts to ensure we have the latest record types
  useEffect(() => {
    // Only revalidate once when component mounts, not on every revalidator change
    const timer = setTimeout(() => {
      revalidator.revalidate();
    }, 100);

    return () => clearTimeout(timer);
  }, []); // Empty dependency array - only run once on mount

  // Show toast notification when data is being refreshed
  // Loading states are handled visually through UI indicators
  // No need for toast notifications during normal data refreshing

  const handleAddRecordType = () => {
    navigate(
      `/member/${member.id}/category/${encodeURIComponent(category)}/create-record-type`
    );
  };

  const handleNoteCreated = (note: any) => {
    // This function is called when a quick note is created
    // The page will automatically refresh due to the action redirect
  };

  const handleNoteDeleted = (noteId: number) => {
    // This function is called when a quick note is deleted
    // The page will automatically refresh due to the action redirect
  };

  if (!member) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-slate-200 mb-4">
            Member not found
          </h1>
          <p className="text-slate-400">
            The requested household member could not be found.
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <RequireAuth requireHousehold={true}>
      <PageLayout>
        <PageHeader
          title={`${category} Records`}
          subtitle={`Manage ${category.toLowerCase()} records for ${member.name}`}
        />

        <RecordManagementProvider
          householdMembers={householdMembers}
          householdId={householdId}
          memberId={member.id.toString()}
          category={category}
        >
          <div className="space-y-6">
            {/* Quick Create Records Section */}
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">
                  Quick Create Records
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Choose a record type to quickly create a new record
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {recordTypes.map(recordType => {
                    const recordCount =
                      recordsByType[recordType.id]?.length || 0;
                    return (
                      <div
                        key={recordType.id}
                        className="p-4 border border-slate-600 rounded-lg hover:border-slate-500 hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-2xl">
                            {recordType.icon || "📝"}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
                              {recordCount} record{recordCount !== 1 ? "s" : ""}
                            </span>
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                navigate(
                                  `/member/${member.id}/category/${encodeURIComponent(category)}/edit-record-type/${recordType.id}`
                                );
                              }}
                              className="text-slate-400 hover:text-slate-200 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md hover:bg-slate-700/50"
                              title="Edit record type"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <h4 className="font-medium text-slate-200 mb-1">
                          {recordType.name}
                        </h4>
                        {recordType.description && (
                          <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                            {recordType.description}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            navigate(
                              `/member/${member.id}/category/${encodeURIComponent(category)}/record/${recordType.id}`
                            );
                          }}
                          className="text-blue-400 hover:text-blue-300 text-base sm:text-sm font-medium w-full text-left py-2 px-3 rounded-md hover:bg-slate-700/30 min-h-[44px] flex items-center"
                        >
                          Create Record →
                        </button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Notes Section */}
            <QuickNotes
              householdId={householdId}
              memberId={member.id.toString()}
              member={member}
              notes={quickNotes}
              onNoteCreated={handleNoteCreated}
              onNoteDeleted={handleNoteDeleted}
            />

            {/* Existing Records Section */}
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">View Records</CardTitle>
                <CardDescription className="text-slate-400">
                  View and manage your existing records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion>
                  {recordTypes.map(recordType => (
                    <RecordsList
                      key={recordType.id}
                      records={recordsByType[recordType.id] || []}
                      recordType={recordType}
                      memberId={member.id.toString()}
                      category={category}
                      householdId={householdId}
                    />
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            <div className="pt-4">
              <AddCard
                title="Add Record Type"
                description={`Create a new ${category.toLowerCase()} record type`}
                onClick={handleAddRecordType}
              />
            </div>
          </div>

          {/* Record Drawer - rendered at this level to be accessible to all RecordsList components */}
          <RecordDrawer
            householdId={householdId}
            memberId={member.id.toString()}
            category={category}
          />
        </RecordManagementProvider>
      </PageLayout>
    </RequireAuth>
  );
}
