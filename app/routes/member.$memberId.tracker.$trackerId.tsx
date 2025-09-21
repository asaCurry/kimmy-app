import * as React from "react";
import type { Route } from "./+types/member.$memberId.tracker.$trackerId";
import {
  useLoaderData,
  useFetcher,
  useRevalidator,
  useNavigate,
  useParams,
} from "react-router";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { RequireAuth } from "~/contexts/auth-context";
import { Navigation } from "~/components/navigation";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { TrackerCard } from "~/components/tracker-card";
import { TrackerHistory } from "~/components/tracker-history";
import { CreateTrackerForm } from "~/components/create-tracker-form";
import { ArrowLeft, Edit, BarChart3, Plus } from "lucide-react";
import { toast } from "react-toastify";
import { withDatabaseAndSession } from "~/lib/db-utils";
import { TrackerDB } from "~/lib/tracker-db";
import type { TrackerEntry } from "~/db/schema";

export async function loader({ request, context, params }: Route.LoaderArgs) {
  return withDatabaseAndSession(request, context, async (db, session) => {
    const { trackerId } = params;
    if (!trackerId) {
      throw new Response("Tracker ID required", { status: 400 });
    }

    const trackerDB = new TrackerDB(db);
    const [tracker, entries, activeEntries] = await Promise.all([
      trackerDB.getTracker(parseInt(trackerId), session.currentHouseholdId),
      trackerDB.getTrackerEntries(
        parseInt(trackerId),
        session.currentHouseholdId
      ),
      trackerDB.getActiveTimeTracking(session.currentHouseholdId),
    ]);

    if (!tracker) {
      throw new Response("Tracker not found", { status: 404 });
    }

    const activeEntry = activeEntries.find(
      entry => entry.trackerId === tracker.id
    );

    return { success: true, tracker, entries, activeEntry };
  });
}

export default function TrackerDetailPage() {
  const { tracker, entries, activeEntry } = useLoaderData<typeof loader>();
  // Get params from React Router
  const params = useParams();
  const memberId = params.memberId;
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const navigate = useNavigate();
  const [showEditForm, setShowEditForm] = React.useState(false);
  const [_showCreateEntryForm, setShowCreateEntryForm] = React.useState(false);

  React.useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.success) {
        if (fetcher.data.action === "update") {
          toast.success("Tracker updated successfully!", {
            position: "top-right",
          });
          setShowEditForm(false);
          revalidator.revalidate();
        }
      } else {
        toast.error(fetcher.data.error || "Action failed", {
          position: "top-right",
        });
      }
    }
  }, [fetcher.data, revalidator]);

  const handleEditTracker = () => {
    setShowEditForm(true);
  };

  const handleFormSuccess = () => {
    setShowEditForm(false);
    revalidator.revalidate();
  };

  const handleFormCancel = () => {
    setShowEditForm(false);
  };

  const handleEditEntry = (entry: TrackerEntry) => {
    console.log(`Editing entry NYI: ${entry.id}`);
  };

  if (!tracker) {
    return (
      <RequireAuth>
        <PageLayout>
          <PageHeader title="Tracker Not Found" />
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Tracker not found</p>
          </div>
        </PageLayout>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <PageLayout>
        <Navigation
          currentView="categories"
          member={{
            id: parseInt(memberId || ""),
            name: "Member",
            email: "",
            role: "member" as const,
          }}
        />
        <PageHeader title={tracker.name}>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button onClick={handleEditTracker}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            {tracker.type === "cumulative" && (
              <Button onClick={() => setShowCreateEntryForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Entry
              </Button>
            )}
          </div>
        </PageHeader>

        <div className="container mx-auto px-4 py-6 space-y-6">
          {showEditForm ? (
            <div className="flex justify-center">
              <CreateTrackerForm
                tracker={tracker}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </div>
          ) : (
            <>
              {/* Tracker Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <TrackerCard
                    tracker={tracker}
                    activeEntry={activeEntry}
                    onRefresh={() => revalidator.revalidate()}
                  />
                </div>
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Quick Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Total Entries
                        </span>
                        <span className="font-semibold">{entries.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Total {tracker.unit}
                        </span>
                        <span className="font-semibold">
                          {tracker.type === "time"
                            ? `${Math.floor(entries.reduce((sum, e) => sum + e.value, 0) / 60)}h ${entries.reduce((sum, e) => sum + e.value, 0) % 60}m`
                            : entries.reduce((sum, e) => sum + e.value, 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Average
                        </span>
                        <span className="font-semibold">
                          {entries.length > 0
                            ? tracker.type === "time"
                              ? `${Math.floor(entries.reduce((sum, e) => sum + e.value, 0) / entries.length / 60)}h ${Math.floor(entries.reduce((sum, e) => sum + e.value, 0) / entries.length) % 60}m`
                              : Math.round(
                                  entries.reduce((sum, e) => sum + e.value, 0) /
                                    entries.length
                                )
                            : 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Created
                        </span>
                        <span className="font-semibold">
                          {tracker.createdAt
                            ? new Date(tracker.createdAt).toLocaleDateString()
                            : "Unknown"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {tracker.description && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Description</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">
                          {tracker.description}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* Tracker History */}
              <TrackerHistory
                tracker={tracker}
                entries={entries}
                onRefresh={() => revalidator.revalidate()}
                onEditEntry={handleEditEntry}
              />
            </>
          )}
        </div>
      </PageLayout>
    </RequireAuth>
  );
}
