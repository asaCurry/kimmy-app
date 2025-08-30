import type { Route } from "./+types/household-records";
import { useLoaderData, Link, useFetcher, useRevalidator } from "react-router";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { RequireAuth } from "~/contexts/auth-context";
import { Navigation } from "~/components/navigation";
import { withDatabaseAndSession } from "~/lib/db-utils";
import { recordTypes, records, users } from "~/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Trash2, Edit, Users, FileText, Eye } from "lucide-react";
import { toast } from "react-toastify";
import * as React from "react";

export function meta() {
  return [
    { title: "Household Records - Kimmy" },
    {
      name: "description", 
      content: "Manage all household records and record types"
    }
  ];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  return withDatabaseAndSession(request, context, async (db, session) => {
    // Get all record types for this household
    const allRecordTypes = await db
      .select({
        id: recordTypes.id,
        name: recordTypes.name,
        description: recordTypes.description,
        category: recordTypes.category,
        icon: recordTypes.icon,
        color: recordTypes.color,
        allowPrivate: recordTypes.allowPrivate,
        visibleToMembers: recordTypes.visibleToMembers,
        fields: recordTypes.fields,
        createdAt: recordTypes.createdAt,
      })
      .from(recordTypes)
      .where(eq(recordTypes.householdId, session.currentHouseholdId))
      .orderBy(recordTypes.category, recordTypes.name);

    // Get all records for this household with member info
    const allRecords = await db
      .select({
        id: records.id,
        title: records.title,
        content: records.content,
        datetime: records.datetime,
        createdAt: records.createdAt,
        isPrivate: records.isPrivate,
        recordTypeName: recordTypes.name,
        recordTypeIcon: recordTypes.icon,
        recordTypeColor: recordTypes.color,
        category: recordTypes.category,
        memberId: records.memberId,
        memberName: users.name,
      })
      .from(records)
      .leftJoin(recordTypes, eq(records.recordTypeId, recordTypes.id))
      .leftJoin(users, eq(records.memberId, users.id))
      .where(eq(records.householdId, session.currentHouseholdId))
      .orderBy(desc(records.datetime), desc(records.createdAt));

    // Get household members
    const members = await db
      .select()
      .from(users)
      .where(eq(users.householdId, session.currentHouseholdId));

    // Group record types by category
    const recordTypesByCategory = allRecordTypes.reduce((acc, rt) => {
      const category = rt.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(rt);
      return acc;
    }, {} as Record<string, typeof allRecordTypes>);

    // Count records per record type
    const recordCountsByType = allRecords.reduce((acc, record) => {
      const typeName = record.recordTypeName || "Unknown";
      acc[typeName] = (acc[typeName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      recordTypesByCategory,
      allRecords,
      members,
      recordCountsByType,
      totalRecordTypes: allRecordTypes.length,
      totalRecords: allRecords.length,
    };
  });
}

export async function action({ request, context }: Route.ActionArgs) {
  return withDatabaseAndSession(request, context, async (db, session) => {
    const formData = await request.formData();
    const action = formData.get("_action") as string;

    switch (action) {
      case "delete-record-type": {
        const id = formData.get("id") as string;
        if (!id) {
          throw new Response("Missing record type ID", { status: 400 });
        }

        // First delete all records of this type
        await db
          .delete(records)
          .where(
            and(
              eq(records.recordTypeId, parseInt(id)),
              eq(records.householdId, session.currentHouseholdId)
            )
          );

        // Then delete the record type
        await db
          .delete(recordTypes)
          .where(
            and(
              eq(recordTypes.id, parseInt(id)),
              eq(recordTypes.householdId, session.currentHouseholdId)
            )
          );

        return { success: true, action: "delete-record-type" };
      }

      default:
        throw new Response("Invalid action", { status: 400 });
    }
  });
}

export default function HouseholdRecords() {
  const {
    recordTypesByCategory,
    allRecords,
    members,
    recordCountsByType,
    totalRecordTypes,
    totalRecords,
  } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const revalidator = useRevalidator();

  React.useEffect(() => {
    if (fetcher.data?.success && fetcher.data?.action === "delete-record-type") {
      toast.success("Record type deleted successfully!", {
        position: "top-right",
      });
      revalidator.revalidate();
    }
  }, [fetcher.data, revalidator]);

  const handleDeleteRecordType = (recordType: any) => {
    const recordCount = recordCountsByType[recordType.name] || 0;
    const confirmMessage = recordCount > 0
      ? `Are you sure you want to delete "${recordType.name}"? This will also delete ${recordCount} associated record${recordCount !== 1 ? 's' : ''}.`
      : `Are you sure you want to delete "${recordType.name}"?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    const formData = new FormData();
    formData.append("_action", "delete-record-type");
    formData.append("id", recordType.id.toString());
    fetcher.submit(formData, { method: "post" });
  };

  const categories = Object.keys(recordTypesByCategory);
  const recentRecords = allRecords.slice(0, 10);

  return (
    <RequireAuth requireHousehold={true}>
      <PageLayout>
        <Navigation currentView="household-records" />
        
        <PageHeader
          title="Household Records"
          subtitle={`Managing ${totalRecordTypes} record types and ${totalRecords} total records`}
        />

        <div className="space-y-8">
          {/* Overview Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Record Types</p>
                    <p className="text-2xl font-bold text-slate-200">{totalRecordTypes}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Total Records</p>
                    <p className="text-2xl font-bold text-slate-200">{totalRecords}</p>
                  </div>
                  <Eye className="w-8 h-8 text-emerald-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Categories</p>
                    <p className="text-2xl font-bold text-slate-200">{categories.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Record Types by Category */}
          <div>
            <h2 className="text-xl font-semibold text-slate-200 mb-4">Record Types by Category</h2>
            {categories.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-200 mb-2">
                    No record types yet
                  </h3>
                  <p className="text-slate-400 mb-4">
                    Create record types from member pages to get started
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {categories.map(category => {
                  const categoryRecordTypes = recordTypesByCategory[category];
                  return (
                    <Card key={category} className="bg-slate-800 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-slate-200 flex items-center justify-between">
                          <span>{category}</span>
                          <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                            {categoryRecordTypes.length} type{categoryRecordTypes.length !== 1 ? 's' : ''}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {categoryRecordTypes.map(recordType => {
                            const recordCount = recordCountsByType[recordType.name] || 0;
                            return (
                              <div
                                key={recordType.id}
                                className="p-4 bg-slate-700 rounded-lg border border-slate-600"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-lg">
                                      {recordType.icon || "📝"}
                                    </span>
                                    <div>
                                      <h4 className="font-medium text-slate-200">
                                        {recordType.name}
                                      </h4>
                                      {recordType.description && (
                                        <p className="text-xs text-slate-400">
                                          {recordType.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex space-x-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 text-slate-400 hover:text-slate-200"
                                      onClick={() => handleDeleteRecordType(recordType)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-400">
                                    {recordCount} record{recordCount !== 1 ? 's' : ''}
                                  </span>
                                  {recordType.allowPrivate && (
                                    <Badge variant="outline" className="border-orange-400 text-orange-400">
                                      Private
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Records */}
          <div>
            <h2 className="text-xl font-semibold text-slate-200 mb-4">Recent Records</h2>
            {recentRecords.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="text-center py-8">
                  <p className="text-slate-400">No records created yet</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-0">
                  <div className="space-y-0">
                    {recentRecords.map((record, index) => (
                      <div
                        key={record.id}
                        className={`p-4 flex items-center justify-between ${
                          index < recentRecords.length - 1 ? 'border-b border-slate-600' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">
                            {record.recordTypeIcon || "📝"}
                          </span>
                          <div>
                            <h4 className="font-medium text-slate-200">
                              {record.title}
                            </h4>
                            <p className="text-xs text-slate-400">
                              {record.recordTypeName} • {record.memberName}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400">
                            {record.datetime
                              ? new Date(record.datetime).toLocaleDateString()
                              : record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'No date'}
                          </p>
                          {record.isPrivate === 1 && (
                            <Badge variant="outline" className="border-orange-400 text-orange-400 mt-1">
                              Private
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Household Members Overview */}
          <div>
            <h2 className="text-xl font-semibold text-slate-200 mb-4">Household Members</h2>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {members.map(member => {
                    const memberRecordCount = allRecords.filter(
                      record => record.memberId === member.id
                    ).length;
                    return (
                      <Link
                        key={member.id}
                        to={`/member/${member.id}`}
                        className="block p-4 bg-slate-700 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-slate-200">
                              {member.name}
                            </h4>
                            <p className="text-xs text-slate-400 capitalize">
                              {member.role}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-slate-200">
                              {memberRecordCount}
                            </p>
                            <p className="text-xs text-slate-400">
                              record{memberRecordCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageLayout>
    </RequireAuth>
  );
}