import type { Route } from "./+types/member.$memberId.records";
import { useLoaderData, Link, redirect } from "react-router";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { RequireAuth } from "~/contexts/auth-context";
import { Navigation } from "~/components/navigation";
import { loadHouseholdDataWithMember } from "~/lib/loader-helpers";
import { getDatabase } from "~/lib/db-utils";
import { recordTypes, records } from "~/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `All Records - ${params.memberId} - Kimmy` },
    {
      name: "description",
      content: "View all records for this household member",
    },
  ];
}

export async function loader({ params, request, context }: Route.LoaderArgs) {
  try {
    const env = (context as any).cloudflare?.env;

    if (!env?.DB) {
      throw new Response("Database not available", { status: 500 });
    }

    // Extract session from cookies
    const cookies = request.headers
      .get("cookie")
      ?.split(";")
      .reduce(
        (acc, cookie) => {
          const [key, value] = cookie.trim().split("=");
          if (key && value) {
            acc[key] = value;
          }
          return acc;
        },
        {} as Record<string, string>
      );

    const sessionData = cookies?.["kimmy_auth_session"];
    if (!sessionData) {
      throw redirect("/welcome");
    }

    let session;
    try {
      session = JSON.parse(decodeURIComponent(sessionData));
    } catch (error) {
      throw redirect("/welcome");
    }

    if (!session.currentHouseholdId) {
      throw redirect("/welcome");
    }

    const { memberId } = params;

    if (!memberId) {
      throw new Response("Member ID required", { status: 400 });
    }

    // Load household data
    const { householdId, currentMember } = await loadHouseholdDataWithMember(
      request,
      env,
      memberId
    );

    if (!householdId) {
      throw redirect("/welcome");
    }

    if (householdId !== session.currentHouseholdId) {
      throw redirect("/welcome");
    }

    // Fetch all records for this member
    const db = getDatabase(env);
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
      })
      .from(records)
      .leftJoin(recordTypes, eq(records.recordTypeId, recordTypes.id))
      .where(
        and(
          eq(records.householdId, householdId),
          eq(records.memberId, parseInt(memberId))
        )
      )
      .orderBy(desc(records.datetime), desc(records.createdAt));

    // Group records by category
    const recordsByCategory = allRecords.reduce((acc, record) => {
      const category = record.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(record);
      return acc;
    }, {} as Record<string, typeof allRecords>);

    return {
      member: currentMember,
      householdId,
      recordsByCategory,
      totalRecords: allRecords.length,
    };
  } catch (error) {
    console.error("Member records route loader error:", error);

    if (error instanceof Response || error instanceof Error) {
      throw error;
    }

    throw new Response("Failed to load member records", { status: 500 });
  }
}

export default function MemberRecords({ loaderData }: Route.ComponentProps) {
  const { member, recordsByCategory, totalRecords } = loaderData;

  if (!member) {
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

  const categories = Object.keys(recordsByCategory);

  return (
    <RequireAuth requireHousehold={true}>
      <PageLayout>
        <Navigation currentView="records" member={member} />

        <PageHeader
          title={`${member.name}'s Records`}
          subtitle={`All records (${totalRecords} total)`}
        />

        <div className="space-y-6">
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-slate-200 mb-2">
                No Records Yet
              </h3>
              <p className="text-slate-400 mb-6">
                {member.name} hasn't created any records yet.
              </p>
              <Link to={`/member/${member.id}`}>
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                  Browse Categories
                </Button>
              </Link>
            </div>
          ) : (
            categories.map(category => {
              const categoryRecords = recordsByCategory[category];
              return (
                <Card key={category} className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-slate-200 flex items-center justify-between">
                      <span>{category}</span>
                      <span className="text-sm font-normal text-slate-400">
                        {categoryRecords.length} record{categoryRecords.length !== 1 ? 's' : ''}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {categoryRecords.map(record => (
                        <div
                          key={record.id}
                          className="p-4 bg-slate-700 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">
                                {record.recordTypeIcon || "📝"}
                              </span>
                              <div>
                                <h4 className="font-medium text-slate-200">
                                  {record.title}
                                </h4>
                                <p className="text-xs text-slate-400">
                                  {record.recordTypeName}
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
                                <span className="text-xs text-orange-400">🔒 Private</span>
                              )}
                            </div>
                          </div>
                          {record.content && (
                            <div className="text-sm text-slate-300">
                              {(() => {
                                try {
                                  const content = JSON.parse(record.content);
                                  return (
                                    <div className="space-y-1">
                                      {Object.entries(content).slice(0, 3).map(([key, value]) => (
                                        <div key={key} className="flex">
                                          <span className="text-slate-400 capitalize min-w-[80px]">{key.replace(/_/g, ' ')}:</span>
                                          <span className="text-slate-200">{String(value)}</span>
                                        </div>
                                      ))}
                                      {Object.keys(content).length > 3 && (
                                        <p className="text-xs text-slate-500 italic">
                                          +{Object.keys(content).length - 3} more fields...
                                        </p>
                                      )}
                                    </div>
                                  );
                                } catch {
                                  return <span className="text-slate-300">{record.content}</span>;
                                }
                              })()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {categories.length > 0 && (
          <div className="text-center mt-8">
            <Link to={`/member/${member.id}`}>
              <Button 
                variant="outline" 
                className="border-slate-600 text-slate-400 hover:bg-slate-700"
              >
                ← Back to Categories
              </Button>
            </Link>
          </div>
        )}
      </PageLayout>
    </RequireAuth>
  );
}